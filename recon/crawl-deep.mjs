#!/usr/bin/env node
/** Deeper auth + role signup recon for naano.com */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "recon");

const TARGETS = [
  { id: "20-register-creator", url: "https://naano.com/register?role=influencer", dir: "creator" },
  { id: "21-register-brand", url: "https://naano.com/register?role=saas", dir: "business" },
  { id: "22-agencies", url: "https://naano.com/agencies", dir: "business" },
  { id: "23-creators-platform", url: "https://naano.com/creators#platform", dir: "creator" },
  { id: "24-pricing", url: "https://naano.com/pricing", dir: "business" },
  { id: "25-forgot-password", url: "https://naano.com/login/forgot-password", dir: "auth" },
];

async function signals(page) {
  return page.evaluate(() => {
    const t = (el) => (el?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 200);
    return {
      title: document.title,
      url: location.href,
      headings: [...document.querySelectorAll("h1,h2,h3")].map(t).filter(Boolean).slice(0, 40),
      ctas: [...document.querySelectorAll("a,button")]
        .map((el) => ({
          text: t(el).slice(0, 100),
          href: el.getAttribute("href"),
        }))
        .filter((x) => x.text)
        .slice(0, 80),
      inputs: [...document.querySelectorAll("input,select,textarea")].map((el) => ({
        type: el.getAttribute("type") || el.tagName.toLowerCase(),
        name: el.getAttribute("name"),
        placeholder: el.getAttribute("placeholder"),
        label: el.labels?.[0]?.innerText || null,
      })),
      bodySnippet: (document.body?.innerText || "").slice(0, 4000),
    };
  });
}

async function capture(page, entry, results) {
  const dir = path.join(OUT, entry.dir);
  fs.mkdirSync(dir, { recursive: true });
  await page.goto(entry.url, { waitUntil: "networkidle2", timeout: 60000 });
  await new Promise((r) => setTimeout(r, 1800));
  const shot = path.join(dir, `${entry.id}.png`);
  await page.screenshot({ path: shot, fullPage: true });
  const sig = await signals(page);
  fs.writeFileSync(path.join(dir, `${entry.id}.json`), JSON.stringify(sig, null, 2));
  results.push({ id: entry.id, url: page.url(), screenshot: path.relative(ROOT, shot), ...sig });
  console.log(`OK ${entry.id} → ${page.url()}`);
  return sig;
}

async function tryFillSignup(page, roleLabel, dir, results) {
  // Fill email/password if present and advance without completing OAuth
  const email = `8x-recon-${roleLabel}-${Date.now()}@example.com`;
  const filled = await page.evaluate((email) => {
    const emailInput =
      document.querySelector('input[type=email],input[name=email]') ||
      [...document.querySelectorAll("input")].find((i) => /email/i.test(i.name || i.placeholder || ""));
    const passInput =
      document.querySelector('input[type=password],input[name=password]') ||
      [...document.querySelectorAll("input")].find((i) => /pass/i.test(i.name || i.placeholder || ""));
    if (!emailInput) return { ok: false, reason: "no-email" };
    emailInput.focus();
    emailInput.value = email;
    emailInput.dispatchEvent(new Event("input", { bubbles: true }));
    if (passInput) {
      passInput.focus();
      passInput.value = "ReconTest!8x_2026";
      passInput.dispatchEvent(new Event("input", { bubbles: true }));
    }
    return { ok: true, hasPassword: !!passInput };
  }, email);

  const shot1 = path.join(OUT, dir, `30-${roleLabel}-form-filled.png`);
  await page.screenshot({ path: shot1, fullPage: true });
  console.log(`fill ${roleLabel}:`, filled);

  // Click primary continue/sign up if safe (not OAuth)
  const clicked = await page.evaluate(() => {
    const btn = [...document.querySelectorAll("button,a")].find((el) => {
      const t = (el.innerText || "").trim().toLowerCase();
      return /^(continue|sign up|create account|next|get started)$/i.test(t);
    });
    if (!btn) return null;
    const href = btn.getAttribute("href") || "";
    if (/oauth|linkedin|google/i.test(href)) return "skipped-oauth";
    btn.click();
    return (btn.innerText || "").trim();
  });
  if (clicked && clicked !== "skipped-oauth") {
    await new Promise((r) => setTimeout(r, 2500));
    const shot2 = path.join(OUT, dir, `31-${roleLabel}-after-submit.png`);
    await page.screenshot({ path: shot2, fullPage: true });
    const sig = await signals(page);
    fs.writeFileSync(
      path.join(OUT, dir, `31-${roleLabel}-after-submit.json`),
      JSON.stringify({ filled, clicked, ...sig }, null, 2)
    );
    results.push({ id: `31-${roleLabel}-after-submit`, url: page.url(), sig });
    console.log(`after submit ${roleLabel} → ${page.url()} via ${clicked}`);
  } else {
    results.push({ id: `30-${roleLabel}-form-filled`, filled, clicked });
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
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  const results = [];
  for (const t of TARGETS) {
    await capture(page, t, results);
  }

  // Creator signup form depth
  await page.goto("https://naano.com/register?role=influencer", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  await tryFillSignup(page, "creator", "creator", results);

  // Brand signup form depth
  await page.goto("https://naano.com/register?role=saas", {
    waitUntil: "networkidle2",
    timeout: 60000,
  });
  await new Promise((r) => setTimeout(r, 1500));
  await tryFillSignup(page, "brand", "business", results);

  fs.writeFileSync(
    path.join(OUT, "manifest-deep.json"),
    JSON.stringify({ capturedAt: new Date().toISOString(), results }, null, 2)
  );
  await browser.close();
  console.log("done deep recon");
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
