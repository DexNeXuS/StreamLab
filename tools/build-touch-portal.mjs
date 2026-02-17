/**
 * Build touch-portal.json from pages/index.json and buttons/index.json.
 * Add files to touch-portal/pages/ or touch-portal/buttons/ and update the JSON —
 * run: node tools/build-touch-portal.mjs
 */
import { readFile, writeFile, readdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, "..");
const PAGES_JSON = path.join(ROOT, "touch-portal", "pages", "index.json");
const BUTTONS_JSON = path.join(ROOT, "touch-portal", "buttons", "index.json");
const OUT_FILE = path.join(ROOT, "assets", "data", "touch-portal.json");
const PAGES_DIR = path.join(ROOT, "touch-portal", "pages");
const BUTTONS_DIR = path.join(ROOT, "touch-portal", "buttons");

async function loadJson(filePath, fallback = []) {
  try {
    const text = await readFile(filePath, "utf8");
    return JSON.parse(text);
  } catch {
    return fallback;
  }
}

async function main() {
  const [pagesRaw, buttonsRaw] = await Promise.all([
    loadJson(PAGES_JSON, []),
    loadJson(BUTTONS_JSON, []),
  ]);

  const pagesDirFiles = await readdir(PAGES_DIR).catch(() => []);
  const buttonsDirFiles = await readdir(BUTTONS_DIR).catch(() => []);

  const pages = pagesRaw
    .filter((p) => typeof p === "object" && (p.name || p.id || p.file))
    .map((p) => ({
      id: p.id || path.basename(p.file || "page", path.extname(p.file || "")),
      name: p.name || p.id || "Untitled",
      description: p.description || "",
      file: p.file || null,
    }));

  const buttons = buttonsRaw
    .filter((b) => typeof b === "object" && (b.name || b.id || b.file))
    .map((b) => ({
      id: b.id || path.basename(b.file || "button", path.extname(b.file || "")),
      name: b.name || b.id || "Untitled",
      description: b.description || "",
      file: b.file || null,
    }));

  const out = { pages, buttons };
  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote touch-portal.json (${pages.length} pages, ${buttons.length} buttons)`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
