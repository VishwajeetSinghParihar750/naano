#!/usr/bin/env node
/** Expand email signup + walk multi-step creator onboarding as far as possible without OAuth */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "recon");

async function sig(page) {
  return page.evaluate(() => {
    const t = (el) => (el?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 200);
    return {
      url: location.href,
      headings: [...document.querySelectorAll("h1,h2,h3")].map(t).filter(Boolean).slice(0, 30),
      buttons: [...document.querySelectorAll("button,a")].map((el) => t(el)).filter(Boolean).slice(0, 40),
      inputs: [...document.querySelectorAll("input,select,textarea")].map((el) => ({
        type: el.getAttribute("type") || el.tagName.toLowerCase(),
        name: el.getAttribute("name"),
        placeholder: el.getAttribute("placeholder"),
      })),
      bodySnippet: (document.body?.innerText || "").slice(0, 3500),
    };
  });
}

async function clickText(page, re) {
  return page.evaluate((pattern) => {
    const rx = new RegExp(pattern, "i");
    const el = [...document.querySelectorAll("button,a,[role=button]")].find((n) =>
      rx.test((n.innerText || "").trim())
    );
    if (!el) return false;
    el.click();
    return (el.innerText || "").trim();
  }, re);
}

async function shot(page, rel) {
  const full = path.join(ROOT, rel);
  fs.mkdirSync(path.dirname(full), { recursive: true });
  await page.screenshot({ path: full, fullPage: true });
  const s = await sig(page);
  fs.writeFileSync(full.replace(/\.png$/, ".json"), JSON.stringify(s, null, 2));
  console.log("shot", rel, "→", page.url());
  return s;
}

async function walkRole(page, roleUrl, label, dir) {
  await page.goto(roleUrl, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1200));
  await shot(page, `recon/${dir}/40-${label}-step1.png`);

  const clicked = await clickText(page, "^Sign up with email$");
  console.log(label, "email click", clicked);
  await new Promise((r) => setTimeout(r, 1500));
  let s = await shot(page, `recon/${dir}/41-${label}-email-form.png`);

  // Fill whatever fields appeared
  await page.evaluate(() => {
    const email =
      document.querySelector('input[type=email],input[name=email]') ||
      [...document.querySelectorAll("input")].find((i) => /mail/i.test(`${i.name}${i.placeholder}`));
    const pass =
      document.querySelector('input[type=password]') ||
      [...document.querySelectorAll("input")].find((i) => /pass/i.test(`${i.name}${i.placeholder}`));
    const name =
      document.querySelector('input[name=name],input[name=fullName]') ||
      [...document.querySelectorAll("input")].find((i) => /name/i.test(`${i.name}${i.placeholder}`));
    if (email) {
      email.value = `8x.${Date.now()}@mailinator.com`;
      email.dispatchEvent(new Event("input", { bubbles: true }));
      email.dispatchEvent(new Event("change", { bubbles: true }));
    }
    if (pass) {
      pass.value = "Naano8x!Recon26";
      pass.dispatchEvent(new Event("input", { bubbles: true }));
    }
    if (name) {
      name.value = "8x Recon";
      name.dispatchEvent(new Event("input", { bubbles: true }));
    }
  });
  await shot(page, `recon/${dir}/42-${label}-filled.png`);

  // Try continue / create / next up to 4 steps
  for (let i = 0; i < 4; i++) {
    const btn = await clickText(page, "^(Continue|Create account|Sign up|Next|Get started|Submit)$");
    if (!btn) break;
    await new Promise((r) => setTimeout(r, 2200));
    s = await shot(page, `recon/${dir}/43-${label}-after-${i + 1}.png`);
    // Stop if OAuth or external
    if (/linkedin\.com|accounts\.google|oauth/i.test(page.url())) break;
    // Stop if same page with validation only and no progress
    if (/step 1 of/i.test(s.bodySnippet || "") && i > 0) break;
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122 Safari/537.36"
  );

  await walkRole(page, "https://naano.com/register?role=influencer", "creator", "creator");
  await walkRole(page, "https://naano.com/register?role=saas", "brand", "business");

  // Agency entry points
  for (const [id, url] of [
    ["50-agency-brand", "https://naano.com/agency"],
    ["51-talent-agency", "https://naano.com/talent-agency"],
    ["52-book", "https://naano.com/book"],
  ]) {
    try {
      await page.goto(url, { waitUntil: "networkidle2", timeout: 60000 });
      await new Promise((r) => setTimeout(r, 1500));
      await shot(page, `recon/business/${id}.png`);
    } catch (e) {
      console.error(id, e.message);
    }
  }

  await browser.close();
  console.log("email walk done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
