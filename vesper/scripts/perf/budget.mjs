// Performance budget (Step 8 targets, milestone 9). Fails with exit code 1 if any budget is exceeded.
//   npm run perf:budget                      → asset + 3D model budgets
//   npm run perf:budget -- --url=http://localhost:3000   → also page budgets on a throttled phone
import { build } from "esbuild";
import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
import { createRequire } from "node:module";
import { dirname, join, relative } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));

export const BUDGET = {
  mediaFileKB: 150, // any single poster / still
  triangles: { footwear: 60_000, garment: 40_000, accessory: 40_000 },
  page: { firstLoadJsKB: 180, lcpMs: 3000, cls: 0.05 },
};
const ROUTES = ["/", "/collections", "/collections/sneakers", "/products/nocturne-low", "/bag", "/checkout", "/journal", "/journal/chapter-i-the-nocturne", "/search?q=calf", "/account"];

const failures = [];
const row = (ok, label, value, limit) => {
  console.log(`${ok ? "  ok " : "  FAIL"}  ${label.padEnd(46)} ${String(value).padStart(10)}  (budget ${limit})`);
  if (!ok) failures.push(label);
};

// 1. Media files
console.log("Media files");
async function* walk(dir) {
  for (const e of await readdir(dir, { withFileTypes: true })) {
    const p = join(dir, e.name);
    if (e.isDirectory()) yield* walk(p);
    else yield p;
  }
}
let biggest = { file: "", kb: 0 }, count = 0;
for await (const f of walk(join(root, "public/media"))) {
  const kb = Math.round((await stat(f)).size / 1024);
  count++;
  if (kb > biggest.kb) biggest = { file: relative(root, f), kb };
  if (kb > BUDGET.mediaFileKB) row(false, relative(root, f), `${kb} KB`, `${BUDGET.mediaFileKB} KB`);
}
row(biggest.kb <= BUDGET.mediaFileKB, `largest of ${count}: ${biggest.file.replace("public/media/", "")}`, `${biggest.kb} KB`, `${BUDGET.mediaFileKB} KB`);

// 2. 3D models
console.log("3D models (triangles)");
const out = await build({
  entryPoints: [join(root, "scripts/perf/models.ts")],
  bundle: true, format: "esm", platform: "node", write: false, external: ["three"], alias: { "@": join(root, "src") }, logLevel: "error",
});
// Written inside node_modules so the bundle resolves `three` like the app does.
const cache = join(root, "node_modules/.cache/vesper-perf");
await mkdir(cache, { recursive: true });
await writeFile(join(cache, "models.mjs"), out.outputFiles[0].text);
const { modelTriangles } = await import(pathToFileURL(join(cache, "models.mjs")).href);
for (const m of modelTriangles()) row(m.tris <= BUDGET.triangles[m.kind], `${m.slug} (${m.kind})`, `${Math.round(m.tris / 1000)}k`, `${BUDGET.triangles[m.kind] / 1000}k`);

// 3. Pages on a throttled phone (needs a running production server)
if (args.url) {
  console.log(`Pages (390×844 phone, 4× CPU slowdown, 1.6 Mbps / 150 ms RTT) at ${args.url}`);
  const { chromium } = createRequire(import.meta.url)("playwright");
  const browser = await chromium.launch();
  for (const route of ROUTES) {
    const ctx = await browser.newContext({ viewport: { width: 390, height: 844 }, isMobile: true, hasTouch: true, deviceScaleFactor: 2 });
    const page = await ctx.newPage();
    const cdp = await ctx.newCDPSession(page);
    await cdp.send("Network.enable");
    await cdp.send("Network.emulateNetworkConditions", { offline: false, latency: 150, downloadThroughput: (1.6 * 1024 * 1024) / 8, uploadThroughput: (750 * 1024) / 8 });
    await cdp.send("Emulation.setCPUThrottlingRate", { rate: 4 });
    const scripts = new Map();
    cdp.on("Network.responseReceived", (e) => e.type === "Script" && scripts.set(e.requestId, 0));
    cdp.on("Network.loadingFinished", (e) => scripts.has(e.requestId) && scripts.set(e.requestId, e.encodedDataLength));
    await page.addInitScript(() => {
      window.__lcp = 0; window.__cls = 0;
      new PerformanceObserver((l) => { for (const e of l.getEntries()) window.__lcp = e.startTime; }).observe({ type: "largest-contentful-paint", buffered: true });
      new PerformanceObserver((l) => { for (const e of l.getEntries()) if (!e.hadRecentInput) window.__cls += e.value; }).observe({ type: "layout-shift", buffered: true });
    });
    await page.goto(args.url + route, { waitUntil: "load" });
    await page.waitForTimeout(2500);
    const { lcp, cls } = await page.evaluate(() => ({ lcp: Math.round(window.__lcp), cls: window.__cls }));
    const jsKB = Math.round([...scripts.values()].reduce((a, b) => a + b, 0) / 1024);
    row(jsKB <= BUDGET.page.firstLoadJsKB, `${route}  first-load JS`, `${jsKB} KB`, `${BUDGET.page.firstLoadJsKB} KB`);
    row(lcp <= BUDGET.page.lcpMs, `${route}  LCP`, `${lcp} ms`, `${BUDGET.page.lcpMs} ms`);
    row(cls <= BUDGET.page.cls, `${route}  CLS`, cls.toFixed(3), BUDGET.page.cls);
    await ctx.close();
  }
  await browser.close();
} else {
  console.log("Pages: skipped (pass --url=http://localhost:3000 with `npm start` running)");
}

if (failures.length) {
  console.error(`\n${failures.length} budget(s) exceeded.`);
  process.exit(1);
}
console.log("\nAll budgets met.");
