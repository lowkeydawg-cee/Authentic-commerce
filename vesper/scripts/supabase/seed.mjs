// Writes supabase/seed.sql from the catalogue:  npm run supabase:seed
import { build } from "esbuild";
import { mkdir, writeFile } from "node:fs/promises";
import { dirname, join } from "node:path";
import { fileURLToPath, pathToFileURL } from "node:url";

const root = join(dirname(fileURLToPath(import.meta.url)), "../..");
const out = await build({
  entryPoints: [join(root, "scripts/supabase/seed-entry.ts")],
  bundle: true, format: "esm", platform: "node", write: false, external: ["three"], alias: { "@": join(root, "src") }, logLevel: "error",
});
const cache = join(root, "node_modules/.cache/vesper-seed");
await mkdir(cache, { recursive: true });
await writeFile(join(cache, "seed.mjs"), out.outputFiles[0].text);
const { seedSql } = await import(pathToFileURL(join(cache, "seed.mjs")).href);
await writeFile(join(root, "supabase/seed.sql"), seedSql());
console.log("wrote supabase/seed.sql");
