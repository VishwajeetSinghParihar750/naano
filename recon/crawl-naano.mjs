#!/usr/bin/env node
/**
 * Naano.com public recon — screenshots + extracted UI text.
 * Does not implement product code; capture-only.
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const OUT = path.join(ROOT, "recon");
const MANIFEST = path.join(OUT, "manifest.json");

const PAGES = [
  { id: "01-home", url: "https://naano.com/", dir: "marketing", fullPage: true },
  { id: "02-creators-landing", url: "https://naano.com/creators", dir: "marketing", fullPage: true },
  { id: "03-agencies", url: "https://naano.com/agencies", dir: "marketing", fullPage: true },
  { id: "04-pricing", url: "https://naano.com/pricing", dir: "marketing", fullPage: true },
  { id: "05-about", url: "https://naano.com/about", dir: "marketing", fullPage: true },
  { id: "06-login", url: "https://naano.com/login", dir: "auth", fullPage: true },
  { id: "07-register", url: "https://naano.com/register", dir: "auth", fullPage: true },
  { id: "08-login-reauth", url: "https://naano.com/login?reauth=1", dir: "auth", fullPage: true },
  { id: "09-selection", url: "https://naano.com/selection", dir: "business", fullPage: true },
  { id: "10-free-tools", url: "https://naano.com/free-tools", dir: "misc", fullPage: true },
  { id: "11-case-blogseo", url: "https://naano.com/case-studies/blogseo", dir: "marketing", fullPage: true },
  { id: "12-help", url: "https://naano.com/help", dir: "misc", fullPage: true },
];

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

async function extractPageSignals(page) {
  return page.evaluate(() => {
    const text = (el) => (el?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 200);
    const headings = [...document.querySelectorAll("h1,h2,h3")]
      .map((h) => text(h))
      .filter(Boolean)
      .slice(0, 40);
    const ctas = [...document.querySelectorAll("a,button")]
      .map((el) => ({
        tag: el.tagName.toLowerCase(),
        text: text(el).slice(0, 80),
        href: el.getAttribute("href") || null,
      }))
      .filter((x) => x.text && x.text.length > 1)
      .slice(0, 60);
    const inputs = [...document.querySelectorAll("input,select,textarea")].map((el) => ({
      type: el.getAttribute("type") || el.tagName.toLowerCase(),
      name: el.getAttribute("name"),
      placeholder: el.getAttribute("placeholder"),
      aria: el.getAttribute("aria-label"),
    }));
    const links = [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && !h.startsWith("#") && !h.startsWith("mailto:"))
      .slice(0, 80);
    return {
      title: document.title,
      url: location.href,
      headings,
      ctas,
      inputs,
      links,
      bodySnippet: (document.body?.innerText || "").slice(0, 2500),
    };
  });
}

async function shot(page, entry, results) {
  const dir = path.join(OUT, entry.dir);
  ensureDir(dir);
  const file = path.join(dir, `${entry.id}.png`);
  const metaFile = path.join(dir, `${entry.id}.json`);
  const record = {
    id: entry.id,
    requestedUrl: entry.url,
    ok: false,
    finalUrl: null,
    screenshot: null,
    error: null,
    signals: null,
  };
  try {
    const resp = await page.goto(entry.url, {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    record.finalUrl = page.url();
    record.status = resp?.status() ?? null;
    record.signals = await extractPageSignals(page);
    await page.screenshot({ path: file, fullPage: !!entry.fullPage });
    record.screenshot = path.relative(ROOT, file);
    record.ok = true;
    fs.writeFileSync(metaFile, JSON.stringify(record.signals, null, 2));
    console.log(`OK  ${entry.id} → ${record.finalUrl} (${record.status})`);
  } catch (err) {
    record.error = String(err);
    console.error(`ERR ${entry.id}: ${err.message || err}`);
  }
  results.push(record);
}

async function exploreRegisterRoles(page, results) {
  // Try clicking role choices on register if present
  try {
    await page.goto("https://naano.com/register", {
      waitUntil: "networkidle2",
      timeout: 60000,
    });
    await new Promise((r) => setTimeout(r, 1500));
    const roleSelectors = [
      "text/brand",
      "text/creator",
      "text/agency",
      "text/Company",
      "text/Creator",
      "text/Business",
    ];
    // Click visible role-looking cards/buttons by text via evaluate
    const roles = await page.evaluate(() => {
      const candidates = [...document.querySelectorAll("a,button,div,label,span")];
      const interesting = candidates
        .map((el) => ({
          text: (el.innerText || "").trim().replace(/\s+/g, " ").slice(0, 80),
          tag: el.tagName,
          href: el.getAttribute?.("href"),
        }))
        .filter((x) =>
          /creator|brand|compan|business|agency|advertis|marketer/i.test(x.text)
        )
        .slice(0, 30);
      return interesting;
    });
    const dir = path.join(OUT, "auth");
    ensureDir(dir);
    const file = path.join(dir, "13-register-roles.png");
    await page.screenshot({ path: file, fullPage: true });
    const record = {
      id: "13-register-roles",
      requestedUrl: "https://naano.com/register",
      ok: true,
      finalUrl: page.url(),
      screenshot: path.relative(ROOT, file),
      rolesFound: roles,
    };
    fs.writeFileSync(
      path.join(dir, "13-register-roles.json"),
      JSON.stringify(record, null, 2)
    );
    results.push(record);
    console.log(`OK  register roles (${roles.length} hints)`);

    // Click each distinct role-ish CTA if it's a link/button with short text
    for (const role of roles.slice(0, 8)) {
      if (!role.text || role.text.length > 60) continue;
      try {
        const clicked = await page.evaluate((label) => {
          const el = [...document.querySelectorAll("a,button,[role=button]")].find(
            (n) => (n.innerText || "").trim().replace(/\s+/g, " ") === label
          );
          if (!el) return false;
          el.click();
          return true;
        }, role.text);
        if (!clicked) continue;
        await new Promise((r) => setTimeout(r, 2000));
        const safe = role.text.toLowerCase().replace(/[^a-z0-9]+/g, "-").slice(0, 40);
        const shotPath = path.join(dir, `14-role-${safe}.png`);
        await page.screenshot({ path: shotPath, fullPage: true });
        const signals = await extractPageSignals(page);
        fs.writeFileSync(
          path.join(dir, `14-role-${safe}.json`),
          JSON.stringify({ role: role.text, ...signals }, null, 2)
        );
        results.push({
          id: `14-role-${safe}`,
          ok: true,
          finalUrl: page.url(),
          screenshot: path.relative(ROOT, shotPath),
          role: role.text,
        });
        console.log(`OK  role click: ${role.text} → ${page.url()}`);
        await page.goto("https://naano.com/register", {
          waitUntil: "networkidle2",
          timeout: 60000,
        });
        await new Promise((r) => setTimeout(r, 1000));
      } catch (e) {
        console.error(`role click fail ${role.text}: ${e.message}`);
      }
    }
  } catch (err) {
    console.error("register explore failed", err.message || err);
    results.push({ id: "13-register-roles", ok: false, error: String(err) });
  }
}

async function main() {
  ensureDir(OUT);
  const browser = await puppeteer.launch({
    headless: true,
    args: ["--no-sandbox", "--disable-setuid-sandbox", "--window-size=1440,900"],
    defaultViewport: { width: 1440, height: 900 },
  });
  const page = await browser.newPage();
  await page.setUserAgent(
    "Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/122.0.0.0 Safari/537.36"
  );
  const results = [];
  for (const entry of PAGES) {
    await shot(page, entry, results);
  }
  await exploreRegisterRoles(page, results);

  // Try /app redirect
  try {
    await page.goto("https://naano.com/app", { waitUntil: "networkidle2", timeout: 60000 });
    await new Promise((r) => setTimeout(r, 1500));
    const dir = path.join(OUT, "auth");
    ensureDir(dir);
    const file = path.join(dir, "15-app-entry.png");
    await page.screenshot({ path: file, fullPage: true });
    const signals = await extractPageSignals(page);
    fs.writeFileSync(path.join(dir, "15-app-entry.json"), JSON.stringify(signals, null, 2));
    results.push({
      id: "15-app-entry",
      ok: true,
      finalUrl: page.url(),
      screenshot: path.relative(ROOT, file),
    });
    console.log(`OK  /app → ${page.url()}`);
  } catch (e) {
    console.error("/app fail", e.message);
  }

  fs.writeFileSync(MANIFEST, JSON.stringify({ capturedAt: new Date().toISOString(), results }, null, 2));
  await browser.close();
  console.log(`\nWrote ${MANIFEST} (${results.length} entries)`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
