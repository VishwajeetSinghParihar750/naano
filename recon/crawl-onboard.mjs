#!/usr/bin/env node
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
    text: (document.body?.innerText || "").slice(0, 6000),
    inputs: [...document.querySelectorAll("input,select,textarea")].map((el) => ({
      type: el.type || el.tagName,
      name: el.name,
      placeholder: el.placeholder,
      value: el.value,
    })),
    buttons: [...document.querySelectorAll("button,a")]
      .map((el) => (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 100))
      .filter(Boolean)
      .slice(0, 50),
  }));
  fs.writeFileSync(full.replace(/\.png$/, ".json"), JSON.stringify(data, null, 2));
  console.log(rel, "→", data.url);
  console.log((data.text || "").slice(0, 280).replace(/\n/g, " | "));
  return data;
}

async function fetchOtp(localPart) {
  for (let i = 0; i < 25; i++) {
    const res = await fetch(
      `https://www.mailinator.com/api/v2/domains/public/inboxes/${localPart}`
    );
    const json = await res.json();
    const msgs = json?.msgs || [];
    console.log("otp poll", i, msgs.length);
    for (const m of msgs.slice(0, 3)) {
      const dres = await fetch(
        `https://www.mailinator.com/api/v2/domains/public/inboxes/${localPart}/messages/${m.id}`
      );
      const detail = await dres.json();
      const body = detail?.parts?.map((p) => p.body).join("\n") || "";
      const match = String(body).match(/\b(\d{6})\b/);
      if (match) return match[1];
    }
    await new Promise((r) => setTimeout(r, 2500));
  }
  return null;
}

async function clickButton(page, re) {
  return page.evaluate((pattern) => {
    const rx = new RegExp(pattern, "i");
    const btn = [...document.querySelectorAll("button,a")].find((b) =>
      rx.test((b.innerText || "").trim())
    );
    if (!btn) return null;
    btn.click();
    return (btn.innerText || "").trim();
  }, re);
}

async function walkCreator(browser) {
  const page = await browser.newPage();
  const local = `c8x${Date.now().toString().slice(-9)}`;
  const email = `${local}@mailinator.com`;
  console.log("\nCREATOR", email);

  await page.goto("https://naano.com/register?role=influencer", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await clickButton(page, "^Sign up with email$");
  await page.waitForSelector("input[name=firstName]", { timeout: 15000 });
  await page.type("input[name=firstName]", "Sahil");
  await page.type("input[name=lastName]", "Creator");
  await page.type("input[name=email]", email);
  await page.type("input[name=password]", "Naano8x!Recon26Aa");
  await clickButton(page, "^LinkedIn$");
  await clickButton(page, "^Continue$");
  await page.waitForSelector("input[name=code]", { timeout: 20000 });
  const otp = await fetchOtp(local);
  if (!otp) throw new Error("no creator otp");
  await page.type("input[name=code]", otp);
  await clickButton(page, "Verify");
  await new Promise((r) => setTimeout(r, 3000));
  await dump(page, "recon/creator/90-after-verify.png");

  // Step 2 LinkedIn
  await page.waitForSelector("input[name=linkedinUrl]", { timeout: 15000 });
  await page.click("input[name=linkedinUrl]", { clickCount: 3 });
  await page.type("input[name=linkedinUrl]", "https://www.linkedin.com/in/williamhgates");
  await clickButton(page, "Import my public profile");
  // wait for import
  for (let i = 0; i < 20; i++) {
    await new Promise((r) => setTimeout(r, 2000));
    const t = await page.evaluate(() => document.body.innerText);
    await dump(page, `recon/creator/91-import-wait-${i}.png`);
    if (/step 3 of 4|set your|rate|price|cost \/ post|continue/i.test(t) && !/Import my public profile/i.test(t))
      break;
    if (/error|failed|could not/i.test(t) && i > 3) break;
  }

  for (let i = 0; i < 6; i++) {
    // fill number/rate fields
    const nums = await page.$$("input[type=number], input[name*=price], input[name*=rate], input[name*=cost]");
    for (const n of nums) {
      try {
        await n.click({ clickCount: 3 });
        await page.keyboard.type("250");
      } catch {}
    }
    const texts = await page.$$("input[type=text], textarea");
    for (const t of texts) {
      const v = await page.evaluate((el) => ({ value: el.value, name: el.name, ph: el.placeholder }), t);
      if (v.value) continue;
      try {
        await t.click({ clickCount: 3 });
        await page.keyboard.type("B2B SaaS creators and founders");
      } catch {}
    }
    const clicked = await clickButton(
      page,
      "^(Continue|Next|Finish|Complete|Save|Confirm|Skip|Go to dashboard|Enter Naano|Start)$"
    );
    await new Promise((r) => setTimeout(r, 2500));
    await dump(page, `recon/creator/92-adv-${i}.png`);
    if (!clicked) break;
  }

  // explore authenticated nav links on page
  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && h.startsWith("/") && !h.startsWith("/register") && !h.startsWith("/login"))
      .slice(0, 30)
  );
  console.log("creator hrefs", hrefs);
  for (const h of [...new Set(hrefs)].slice(0, 12)) {
    try {
      await page.goto(`https://naano.com${h}`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1000));
      const safe = h.replace(/\W+/g, "_").slice(0, 40);
      await dump(page, `recon/creator/93-nav${safe}.png`);
    } catch {}
  }
  await page.close();
}

async function walkBrand(browser) {
  const page = await browser.newPage();
  const local = `b8x${Date.now().toString().slice(-9)}`;
  const email = `${local}@mailinator.com`;
  console.log("\nBRAND", email);

  await page.goto("https://naano.com/register?role=saas", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await clickButton(page, "^Sign up with email$");
  await page.waitForSelector("input[name=firstName]", { timeout: 20000 });
  await page.type("input[name=firstName]", "Sahil");
  await page.type("input[name=lastName]", "Brand");
  await page.type("input[name=email]", email);
  await page.type("input[name=password]", "Naano8x!Recon26Aa");
  await clickButton(page, "^LinkedIn$");
  await clickButton(page, "^Continue$");
  await page.waitForSelector("input[name=code]", { timeout: 20000 });
  const otp = await fetchOtp(local);
  if (!otp) throw new Error("no brand otp");
  await page.type("input[name=code]", otp);
  await clickButton(page, "Verify");
  await new Promise((r) => setTimeout(r, 3000));
  await dump(page, "recon/business/90-after-verify.png");

  for (let i = 0; i < 8; i++) {
    const inputs = await page.$$("input:not([type=hidden]):not([type=password]):not([type=email])");
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
        if (meta.type === "number") await page.keyboard.type("5000");
        else if (/company|org|workspace/i.test(`${meta.name}${meta.ph}`))
          await page.keyboard.type("Acme Pipeline Co");
        else if (/website|url/i.test(`${meta.name}${meta.ph}`))
          await page.keyboard.type("https://example.com");
        else if (/linkedin/i.test(`${meta.name}${meta.ph}`))
          await page.keyboard.type("https://www.linkedin.com/company/google");
        else await page.keyboard.type("Demand gen");
      } catch {}
    }
    // select first radio/option-ish chips
    await page.evaluate(() => {
      const chip = [...document.querySelectorAll("button,[role=option],label")].find((el) => {
        const t = (el.innerText || "").trim();
        return t.length > 2 && t.length < 40 && /saas|b2b|marketing|self|start/i.test(t);
      });
      chip?.click();
    });
    const clicked = await clickButton(
      page,
      "^(Continue|Next|Finish|Complete|Save|Confirm|Skip|Create|Launch|Get started|Start)$"
    );
    await new Promise((r) => setTimeout(r, 2500));
    await dump(page, `recon/business/91-adv-${i}.png`);
    if (!clicked) break;
  }

  const hrefs = await page.evaluate(() =>
    [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && h.startsWith("/") && !h.startsWith("/register") && !h.startsWith("/login"))
      .slice(0, 40)
  );
  console.log("brand hrefs", hrefs);
  for (const h of [...new Set(hrefs)].slice(0, 15)) {
    try {
      await page.goto(`https://naano.com${h}`, { waitUntil: "networkidle2", timeout: 30000 });
      await new Promise((r) => setTimeout(r, 1000));
      const safe = h.replace(/\W+/g, "_").slice(0, 40);
      await dump(page, `recon/business/92-nav${safe}.png`);
    } catch {}
  }
  await page.close();
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  try {
    await walkCreator(browser);
  } catch (e) {
    console.error("creator fail", e);
  }
  try {
    await walkBrand(browser);
  } catch (e) {
    console.error("brand fail", e);
  }
  await browser.close();
  console.log("done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
