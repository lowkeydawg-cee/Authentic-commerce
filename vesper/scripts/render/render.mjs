// Renders stand-in product posters with headless Chromium.
// Usage: node scripts/render/render.mjs [--only=path-prefix] [--out=public/media] [--specs=file.json]
import { build } from "esbuild";
import { createServer } from "node:http";
import { mkdir, readFile, writeFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { fileURLToPath } from "node:url";
import { createRequire } from "node:module";

// Playwright is provided by the environment (global install), not a project dependency.
const { chromium } = createRequire(import.meta.url)("playwright");

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const args = Object.fromEntries(process.argv.slice(2).map((a) => a.replace(/^--/, "").split("=")));
const outDir = resolve(root, args.out ?? "public/media");

const bundle = await build({
  entryPoints: [join(root, "scripts/render/entry.ts")],
  bundle: true, format: "esm", write: false, target: "es2022",
  alias: { "@": join(root, "src") },
});
const js = bundle.outputFiles[0].text;
const html = `<!doctype html><html><body style="margin:0;background:transparent"><script type="module">${js.replace(/<\/script>/g, "<\\/script>")}</script></body></html>`;
const server = createServer((_, res) => { res.setHeader("content-type", "text/html"); res.end(html); }).listen(0);
const port = server.address().port;

async function catalogueJobs() {
  const out = await build({
    entryPoints: [join(root, "scripts/render/jobs.ts")],
    bundle: true, format: "esm", platform: "node", write: false, external: ["three"],
    alias: { "@": join(root, "src") },
  });
  const mod = await import(`data:text/javascript;base64,${Buffer.from(out.outputFiles[0].text).toString("base64")}`);
  return mod.buildJobs();
}

const jobs = (args.specs ? JSON.parse(await readFile(args.specs, "utf8")) : await catalogueJobs())
  .filter((j) => !args.only || j.file.startsWith(args.only));

const browser = await chromium.launch({ args: ["--use-angle=swiftshader", "--enable-unsafe-swiftshader"] });
const page = await browser.newPage();
page.on("pageerror", (e) => console.error("page error:", e.message));
await page.goto(`http://localhost:${port}/`);
await page.waitForFunction(() => typeof window.renderStandin === "function");
await mkdir(outDir, { recursive: true });
for (const job of jobs) {
  const t = Date.now();
  const format = job.file.endsWith(".webp") ? "image/webp" : "image/png";
  const url = await page.evaluate(({ spec, angle, w, h, format }) => window.renderStandin(spec, angle, w, h, format), { ...job, format });
  const file = join(outDir, job.file);
  await mkdir(dirname(file), { recursive: true });
  await writeFile(file, Buffer.from(url.split(",")[1], "base64"));
  console.log(`rendered ${job.file} (${Date.now() - t} ms)`);
}
await browser.close();
server.close();
