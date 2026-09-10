#!/usr/bin/env node
/**
 * Complete email signup via Mailinator public inbox, then screenshot onboarding.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");

async function dump(page, rel) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  await page.screenshot({ path: full, fullPage: true });
  const data = await page.evaluate(() => ({
    url: location.href,
    text: (document.body?.innerText || "").slice(0, 5000),
    inputs: [...document.querySelectorAll("input,select,textarea")].map((el) => ({
      type: el.type || el.tagName,
      name: el.name,
      placeholder: el.placeholder,
    })),
    buttons: [...document.querySelectorAll("button,a")]
      .map((el) => (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 80))
      .filter(Boolean)
      .slice(0, 40),
  }));
  fs.writeFileSync(full.replace(/\.png$/, ".json"), JSON.stringify(data, null, 2));
  console.log(rel, "→", data.url);
  return data;
}

async function fetchOtp(localPart, tries = 20) {
  for (let i = 0; i < tries; i++) {
    const url = `https://www.mailinator.com/api/v2/domains/public/inboxes/${localPart}`;
    try {
      const res = await fetch(url);
      const json = await res.json();
      const msgs = json?.msgs || json?.messages || [];
      console.log(`mailinator poll ${i}: ${msgs.length} msgs`);
      for (const m of msgs.slice(0, 5)) {
        const id = m.id || m.mid;
        if (!id) continue;
        const detailUrl = `https://www.mailinator.com/api/v2/domains/public/inboxes/${localPart}/messages/${id}`;
        const dres = await fetch(detailUrl);
        const detail = await dres.json();
        const body =
          detail?.parts?.map((p) => p.body).join("\n") ||
          detail?.body ||
          detail?.text ||
          JSON.stringify(detail);
        const match = String(body).match(/\b(\d{6})\b/);
        if (match) {
          console.log("OTP found", match[1]);
          return match[1];
        }
      }
    } catch (e) {
      console.log("mailinator err", e.message);
    }
    await new Promise((r) => setTimeout(r, 3000));
  }
  return null;
}

async function signupThroughOtp(page, roleUrl, label, dir) {
  const local = `naano8x${label}${Date.now().toString().slice(-8)}`;
  const email = `${local}@mailinator.com`;
  console.log("\n===", label, email, "===");

  await page.goto(roleUrl, { waitUntil: "networkidle2", timeout: 60000 });
  await page.evaluate(() => {
    const el = [...document.querySelectorAll("button,a")].find((n) =>
      /sign up with email/i.test(n.innerText || "")
    );
    el?.click();
  });
  await page.waitForSelector('input[name=firstName]', { timeout: 15000 });
  await page.type('input[name=firstName]', "Sahil", { delay: 15 });
  await page.type('input[name=lastName]', label === "creator" ? "Creator" : "Brand", { delay: 15 });
  await page.type('input[name=email]', email, { delay: 10 });
  await page.type('input[name=password]', "Naano8x!Recon26Aa", { delay: 10 });
  await page.evaluate(() => {
    const chip = [...document.querySelectorAll("button")].find((b) =>
      /^LinkedIn$/i.test((b.innerText || "").trim())
    );
    chip?.click();
  });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) => /^Continue$/i.test(b.innerText || ""))?.click();
  });
  await page.waitForSelector('input[name=code]', { timeout: 20000 });
  await dump(page, `recon/${dir}/70-${label}-otp.png`);

  const otp = await fetchOtp(local);
  if (!otp) {
    console.log("NO OTP for", email);
    return;
  }
  await page.click('input[name=code]');
  await page.keyboard.type(otp, { delay: 30 });
  await page.evaluate(() => {
    [...document.querySelectorAll("button")].find((b) =>
      /verify/i.test(b.innerText || "")
    )?.click();
  });
  await new Promise((r) => setTimeout(r, 3500));
  await dump(page, `recon/${dir}/71-${label}-post-verify.png`);

  for (let i = 0; i < 8; i++) {
    // fill empty inputs
    const inputs = await page.$$("input:not([type=hidden]):not([type=password])");
    for (const inp of inputs) {
      const meta = await page.evaluate((el) => ({
        value: el.value,
        type: el.type,
        name: el.name,
        ph: el.placeholder,
      }), inp);
      if (meta.value) continue;
      try {
        await inp.click({ clickCount: 3 });
        if (meta.type === "number") await page.keyboard.type("250");
        else if (/linkedin|url/i.test(`${meta.name}${meta.ph}`))
          await page.keyboard.type("https://www.linkedin.com/in/williamhgates");
        else if (/company|org/i.test(`${meta.name}${meta.ph}`))
          await page.keyboard.type("Acme SaaS");
        else if (/website/i.test(`${meta.name}${meta.ph}`))
          await page.keyboard.type("https://example.com");
        else await page.keyboard.type("B2B Sales");
      } catch {}
    }
    // click likely next
    const advanced = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /^(Continue|Next|Finish|Complete|Save|Confirm|Skip|Get started|Go to|Start)$/i.test(
          (b.innerText || "").trim()
        )
      );
      if (!btn || btn.disabled) return null;
      const t = btn.innerText.trim();
      btn.click();
      return t;
    });
    await new Promise((r) => setTimeout(r, 2500));
    await dump(page, `recon/${dir}/72-${label}-step-${i + 1}.png`);
    if (!advanced) break;
    // if we landed in app shell, keep screenshotting a few nav items
    if (/\/app|\/dashboard|\/home|\/campaigns|\/opportunities|\/marketplace/i.test(page.url())) {
      console.log("entered app-ish", page.url());
    }
  }

  // Try common app routes after auth cookies exist
  for (const route of [
    "/app",
    "/dashboard",
    "/home",
    "/campaigns",
    "/creators/marketplace",
    "/marketplace",
    "/opportunities",
    "/briefs",
    "/settings",
  ]) {
    try {
      await page.goto(`https://naano.com${route}`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1200));
      if (/404|could not be found/i.test(await page.content())) continue;
      await dump(page, `recon/${dir}/80-${label}${route.replace(/\//g, "_") || "_root"}.png`);
    } catch {}
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await signupThroughOtp(page, "https://naano.com/register?role=influencer", "creator", "creator");
  await signupThroughOtp(page, "https://naano.com/register?role=saas", "brand", "business");
  await browser.close();
  console.log("otp walk done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
