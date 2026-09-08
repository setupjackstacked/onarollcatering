import { chromium } from "playwright";
const pages = ["/", "/services", "/services/modular-kitchens", "/projects", "/projects/sample-construction-site-catering", "/about", "/contact", "/quote"];
const widths = [390, 768, 1440];
const browser = await chromium.launch();
for (const w of widths) {
  const ctx = await browser.newContext({ viewport: { width: w, height: w < 500 ? 844 : 900 }, deviceScaleFactor: 1, reducedMotion: "reduce" });
  const page = await ctx.newPage();
  const errors = [];
  page.on("console", (m) => m.type() === "error" && errors.push(m.text()));
  page.on("pageerror", (e) => errors.push(e.message));
  for (const p of pages) {
    await page.goto("http://localhost:3100" + p, { waitUntil: "networkidle" });
    // reveal everything
    await page.evaluate(() => document.querySelectorAll("[data-reveal],[data-image-reveal]").forEach((el) => el.setAttribute(el.hasAttribute("data-reveal") ? "data-reveal" : "data-image-reveal", "in")));
    await page.evaluate(async () => { for (let y = 0; y < document.body.scrollHeight; y += 600) { window.scrollTo(0, y); await new Promise(r => setTimeout(r, 60)); } window.scrollTo(0, 0); });
    await page.waitForTimeout(600);
    const overflow = await page.evaluate(() => document.documentElement.scrollWidth > document.documentElement.clientWidth ? document.documentElement.scrollWidth : 0);
    const name = (p === "/" ? "home" : p.slice(1).replace(/\//g, "_")) + `_${w}.png`;
    await page.screenshot({ path: "screenshots/" + name, fullPage: true });
    console.log(w, p, overflow ? `OVERFLOW ${overflow}` : "ok");
  }
  if (errors.length) console.log(w, "console errors:", errors.slice(0, 5));
  await ctx.close();
}
await browser.close();
