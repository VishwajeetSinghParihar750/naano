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
    text: (document.body?.innerText || "").slice(0, 4000),
    inputs: [...document.querySelectorAll("input,select,textarea")].map((el) => ({
      type: el.type || el.tagName,
      name: el.name,
      placeholder: el.placeholder,
    })),
  }));
  fs.writeFileSync(full.replace(/\.png$/, ".json"), JSON.stringify(data, null, 2));
  console.log(rel, "→", data.url, "inputs", data.inputs.length);
  return data;
}

async function fillAndContinue(page, roleUrl, label, dir) {
  await page.goto(roleUrl, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1000));

  // open email form
  const [emailBtn] = await page.$x("//button[contains(., 'Sign up with email')] | //a[contains(., 'Sign up with email')]");
  if (emailBtn) await emailBtn.click();
  else {
    await page.evaluate(() => {
      const el = [...document.querySelectorAll("button,a")].find((n) =>
        /sign up with email/i.test(n.innerText || "")
      );
      el?.click();
    });
  }
  await new Promise((r) => setTimeout(r, 1000));

  await page.waitForSelector('input[name=firstName], input[placeholder="First name"]', { timeout: 10000 });
  await page.click('input[name=firstName]');
  await page.type('input[name=firstName]', "Sahil", { delay: 20 });
  await page.click('input[name=lastName]');
  await page.type('input[name=lastName]', "8x", { delay: 20 });
  await page.click('input[name=email]');
  await page.type('input[name=email]', `sahil.8x.${Date.now()}@mailinator.com`, { delay: 10 });
  await page.click('input[name=password]');
  await page.type('input[name=password]', "Naano8x!Recon26Aa", { delay: 10 });

  // pick a source chip
  await page.evaluate(() => {
    const chip = [...document.querySelectorAll("button")].find((b) =>
      /^(LinkedIn|Word of mouth)$/i.test((b.innerText || "").trim())
    );
    chip?.click();
  });
  await dump(page, `recon/${dir}/60-${label}-ready.png`);

  await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button")].find((b) =>
      /^Continue$/i.test((b.innerText || "").trim())
    );
    btn?.click();
  });
  await new Promise((r) => setTimeout(r, 3000));
  let data = await dump(page, `recon/${dir}/61-${label}-step2.png`);

  // Walk remaining steps opportunistically
  for (let i = 0; i < 5; i++) {
    // fill visible text inputs with placeholders
    const fields = await page.$$("input:not([type=hidden]):not([type=password]):not([type=email])");
    for (const f of fields) {
      const ph = await page.evaluate((el) => el.placeholder || el.name || "", f);
      const val = await page.evaluate((el) => el.value, f);
      if (val) continue;
      try {
        await f.click({ clickCount: 3 });
        await page.keyboard.type(ph?.toLowerCase().includes("linkedin") ? "https://linkedin.com/in/example" : "Test value", {
          delay: 5,
        });
      } catch {}
    }
    // rate / number inputs
    const numbers = await page.$$('input[type=number]');
    for (const n of numbers) {
      try {
        await n.click({ clickCount: 3 });
        await page.keyboard.type("150", { delay: 5 });
      } catch {}
    }

    const advanced = await page.evaluate(() => {
      const btn = [...document.querySelectorAll("button")].find((b) =>
        /^(Continue|Next|Finish|Complete|Create account|Save|Confirm)$/i.test((b.innerText || "").trim())
      );
      if (!btn) return null;
      btn.click();
      return btn.innerText.trim();
    });
    if (!advanced) break;
    await new Promise((r) => setTimeout(r, 2500));
    data = await dump(page, `recon/${dir}/62-${label}-advance-${i + 1}.png`);
    if (/login|app\/|dashboard|onboarding|verify/i.test(data.url + data.text)) {
      // keep going a bit more
    }
    if (/step 1 of 4/i.test(data.text) && i > 0) break;
  }
}

async function main() {
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  // page.$x may be deprecated - use evaluate fallbacks already
  page.$x = async (xpath) => {
    return page.evaluateHandle((xp) => {
      const r = document.evaluate(xp, document, null, XPathResult.ORDERED_NODE_SNAPSHOT_TYPE, null);
      const arr = [];
      for (let i = 0; i < r.snapshotLength; i++) arr.push(r.snapshotItem(i));
      return arr;
    }, xpath).then(async (h) => {
      const props = await h.getProperties();
      const els = [];
      for (const p of props.values()) {
        const el = p.asElement();
        if (el) els.push(el);
      }
      return els;
    });
  };

  await fillAndContinue(page, "https://naano.com/register?role=influencer", "creator", "creator");
  await fillAndContinue(page, "https://naano.com/register?role=saas", "brand", "business");
  await browser.close();
  console.log("typed signup walk done");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
