#!/usr/bin/env node
/**
 * Headed recon: YOU log in in the opened Chrome window.
 * After login is detected, the script crawls in-app pages and dumps screenshots/JSON.
 *
 * Usage:
 *   node recon/crawl-headed-auth.mjs              # wait for any post-login URL
 *   ROLE=creator node recon/crawl-headed-auth.mjs
 *   ROLE=brand node recon/crawl-headed-auth.mjs
 */
import fs from "fs";
import path from "path";
import { fileURLToPath } from "url";
import puppeteer from "puppeteer";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.join(__dirname, "..");
const ROLE = (process.env.ROLE || "auto").toLowerCase();
const OUT = path.join(ROOT, "recon", "authenticated", ROLE === "auto" ? "session" : ROLE);

const CREATOR_ROUTES = [
  "/",
  "/app",
  "/home",
  "/dashboard",
  "/overview",
  "/opportunities",
  "/deals",
  "/collaborations",
  "/wallet",
  "/payouts",
  "/analytics",
  "/profile",
  "/settings",
  "/media-kit",
  "/onboarding",
];

const BRAND_ROUTES = [
  "/",
  "/brand",
  "/brand#home",
  "/brand#campaigns",
  "/brand#marketplace",
  "/brand#creators",
  "/brand#briefs",
  "/brand#analytics",
  "/brand#billing",
  "/brand#settings",
  "/brand#messages",
  "/app",
  "/home",
  "/dashboard",
  "/marketplace",
  "/creators",
  "/campaigns",
  "/briefs",
  "/analytics",
  "/billing",
  "/settings",
  "/selection",
  "/agency",
];

const SHARED_DISCOVER = [
  "/login",
  "/register",
];

function ensureDir(d) {
  fs.mkdirSync(d, { recursive: true });
}

async function dump(page, relBase) {
  ensureDir(path.dirname(path.join(ROOT, relBase + ".png")));
  const png = path.join(ROOT, relBase + ".png");
  const json = path.join(ROOT, relBase + ".json");
  await page.screenshot({ path: png, fullPage: true });
  const data = await page.evaluate(() => {
    const t = (el) => (el?.innerText || "").trim().replace(/\s+/g, " ").slice(0, 160);
    const nav = [...document.querySelectorAll("nav a, aside a, [role=navigation] a, header a")]
      .map((a) => ({ text: t(a), href: a.getAttribute("href") }))
      .filter((x) => x.text || x.href)
      .slice(0, 80);
    const allLinks = [...document.querySelectorAll("a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter((h) => h && h.startsWith("/"))
      .slice(0, 120);
    return {
      url: location.href,
      title: document.title,
      headings: [...document.querySelectorAll("h1,h2,h3")].map(t).filter(Boolean).slice(0, 40),
      nav,
      allLinks: [...new Set(allLinks)],
      buttons: [...document.querySelectorAll("button")]
        .map((b) => t(b))
        .filter(Boolean)
        .slice(0, 40),
      inputs: [...document.querySelectorAll("input,select,textarea")].map((el) => ({
        type: el.type || el.tagName.toLowerCase(),
        name: el.name,
        placeholder: el.placeholder,
      })),
      bodySnippet: (document.body?.innerText || "").slice(0, 6000),
    };
  });
  fs.writeFileSync(json, JSON.stringify(data, null, 2));
  console.log(`  shot ${relBase} → ${data.url}`);
  return data;
}

function looksLoggedIn(url, text) {
  // Never treat auth/onboarding URLs as logged-in app
  if (/\/(login|register)(\?|$|\/)/i.test(url)) return false;
  if (/step \d+ of \d+|check your email|sign up with|create your account|welcome back/i.test(text))
    return false;
  if (/\/(app|dashboard|home|overview|opportunities|deals|campaigns|marketplace|wallet|briefs|collaborations|payouts|creator|brand)(\?|#|$|\/)/i.test(url))
    return true;
  // App chrome signals (avoid marketing words alone)
  if (/\b(sign out|log out|sign out of)\b/i.test(text)) return true;
  if (/\b(opportunities|active collaborations|your wallet|campaigns)\b/i.test(text) && /\b(settings|profile)\b/i.test(text))
    return true;
  return false;
}

async function waitForLogin(page) {
  const readyFlag = path.join(ROOT, "recon", "authenticated", "READY");
  try {
    fs.unlinkSync(readyFlag);
  } catch {}

  console.log("\n=== ACTION NEEDED ===");
  console.log("A Chrome window is open on naano.com/login.");
  console.log("1) Log in as CREATOR or BRAND (or finish signup).");
  console.log("2) Wait until you see the real in-app UI (not login).");
  console.log("3) Tell the agent you are logged in (or create file recon/authenticated/READY).");
  console.log("=====================\n");

  for (let i = 0; i < 900; i++) {
    // up to ~15 min
    await new Promise((r) => setTimeout(r, 1000));
    if (fs.existsSync(readyFlag)) {
      console.log("\nREADY flag seen — proceeding");
      try {
        fs.unlinkSync(readyFlag);
      } catch {}
      break;
    }
    try {
      const url = page.url();
      const text = await page.evaluate(() => (document.body?.innerText || "").slice(0, 2000));
      if (looksLoggedIn(url, text)) {
        console.log(`\nAuto-detected login at ${url}`);
        break;
      }
    } catch {
      /* page navigating */
    }
    if (i > 0 && i % 120 === 0) console.log(`…still waiting for login (${i}s)`);
  }
  await new Promise((r) => setTimeout(r, 1500));
}

async function crawlRoutes(page, routes, tag) {
  const collected = [];
  const discovered = new Set();
  for (const route of routes) {
    try {
      await page.goto(`https://naano.com${route}`, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      await new Promise((r) => setTimeout(r, 1200));
      const safe = route.replace(/\W+/g, "_") || "root";
      const data = await dump(page, path.relative(ROOT, path.join(OUT, `${tag}${safe}`)));
      collected.push(data);
      for (const h of data.allLinks || []) discovered.add(h);
      // skip obvious 404s quickly
      if (/404|could not be found/i.test(data.bodySnippet || "")) {
        console.log("  (404)");
      }
    } catch (e) {
      console.log("  fail", route, e.message);
    }
  }

  // Follow a few discovered in-app links not already visited
  const extras = [...discovered]
    .filter((h) => !SHARED_DISCOVER.includes(h))
    .filter((h) => !routes.includes(h))
    .filter((h) => !/\.(png|jpg|svg|css|js)$/i.test(h))
    .slice(0, 20);

  console.log(`Discovered ${discovered.size} links; crawling ${extras.length} extras…`);
  for (const route of extras) {
    try {
      await page.goto(`https://naano.com${route}`, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      await new Promise((r) => setTimeout(r, 1000));
      if (/404|could not be found/i.test(await page.evaluate(() => document.body?.innerText || "")))
        continue;
      const safe = route.replace(/\W+/g, "_").slice(0, 50);
      const data = await dump(page, path.relative(ROOT, path.join(OUT, `extra${safe}`)));
      collected.push(data);
    } catch {}
  }
  return collected;
}

async function main() {
  ensureDir(OUT);
  const browser = await puppeteer.launch({
    headless: false,
    defaultViewport: null,
    args: ["--start-maximized", "--no-sandbox", "--disable-setuid-sandbox"],
  });
  const page = (await browser.pages())[0] || (await browser.newPage());
  await page.goto(
    ROLE === "brand"
      ? "https://naano.com/login"
      : ROLE === "creator"
        ? "https://naano.com/login"
        : "https://naano.com/login",
    { waitUntil: "networkidle2", timeout: 60000 }
  );

  await waitForLogin(page);
  await dump(page, path.relative(ROOT, path.join(OUT, "00-home-after-login")));

  const url = page.url();
  const text = await page.evaluate(() => document.body?.innerText || "");
  const guessRole =
    ROLE !== "auto"
      ? ROLE
      : /creator|opportunities|wallet|media kit|cost \/ post|creator studio|creator workspace/i.test(text + url)
        ? "creator"
        : /campaign|marketplace|brief|pipeline|brand workspace|brand studio/i.test(text + url) || /\/brand/i.test(url)
          ? "brand"
          : "unknown";

  console.log("Role guess:", guessRole);
  const routes =
    guessRole === "creator"
      ? CREATOR_ROUTES
      : guessRole === "brand"
        ? BRAND_ROUTES
        : [...new Set([...CREATOR_ROUTES, ...BRAND_ROUTES])];

  const pages = await crawlRoutes(page, routes, "01-");

  // Click through visible nav items once more from current page
  const navHrefs = await page.evaluate(() =>
    [...document.querySelectorAll("nav a[href], aside a[href], [data-sidebar] a[href]")]
      .map((a) => a.getAttribute("href"))
      .filter(Boolean)
  );
  for (const h of [...new Set(navHrefs)].slice(0, 15)) {
    if (!h.startsWith("/")) continue;
    try {
      await page.goto(h.startsWith("http") ? h : `https://naano.com${h}`, {
        waitUntil: "networkidle2",
        timeout: 45000,
      });
      await new Promise((r) => setTimeout(r, 1000));
      await dump(
        page,
        path.relative(ROOT, path.join(OUT, `nav-${h.replace(/\W+/g, "_").slice(0, 40)}`))
      );
    } catch {}
  }

  const manifest = {
    capturedAt: new Date().toISOString(),
    roleGuess: guessRole,
    startUrl: url,
    pageCount: pages.length,
    urls: pages.map((p) => p.url),
  };
  fs.writeFileSync(path.join(OUT, "manifest.json"), JSON.stringify(manifest, null, 2));
  console.log("\nDone. Leave the window open if you want; closing browser in 5s…");
  await new Promise((r) => setTimeout(r, 5000));
  await browser.close();
  console.log(`Artifacts: ${path.relative(ROOT, OUT)}`);
}

main().catch((e) => {
  console.error(e);
  process.exit(1);
});
