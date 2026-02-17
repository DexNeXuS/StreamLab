/**
 * Scans assets/images recursively and builds a map: filename -> path.
 * Output: assets/data/image-map.json
 * The site uses this so you can reference images by filename only — put them
 * anywhere under assets/images/ and they'll be found.
 */
import { readdir, stat, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const IMAGES_DIR = path.join(ROOT, "assets", "images");
const OUT_FILE = path.join(ROOT, "assets", "data", "image-map.json");
const EXTS = new Set([".png", ".jpg", ".jpeg", ".gif", ".webp", ".svg"]);

/** @type {Record<string, string>} */
const map = {};

async function walk(dir, relPath = "") {
  const entries = await readdir(dir, { withFileTypes: true });
  for (const e of entries) {
    const childRel = relPath ? `${relPath}/${e.name}` : e.name;
    const fullPath = path.join(dir, e.name);
    if (e.isDirectory()) {
      await walk(fullPath, childRel);
    } else if (e.isFile() && EXTS.has(path.extname(e.name).toLowerCase())) {
      const normalized = `assets/images/${childRel}`.replace(/\\/g, "/");
      map[e.name] = normalized;
    }
  }
}

async function main() {
  await walk(IMAGES_DIR);
  await writeFile(OUT_FILE, JSON.stringify(map, null, 2) + "\n", "utf8");
  console.log(`Wrote image-map.json (${Object.keys(map).length} images)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
