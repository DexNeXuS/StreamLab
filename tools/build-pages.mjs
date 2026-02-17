import { readdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const CONTENT_DIR = path.join(ROOT, "content");
const OUT_FILE = path.join(ROOT, "assets", "data", "pages.json");

function splitNameAndTags(filename) {
  // Optional filename tags:
  //   50-my-page__obs,streamerbot.html
  // -> title base: "my-page", tags: ["obs","streamerbot"]
  const base = filename.replace(/\.html$/i, "").replace(/^\d+\-/, "");
  const parts = base.split("__").map((p) => p.trim()).filter(Boolean);
  if (parts.length <= 1) return { base: base, tags: [] };
  const namePart = parts[0];
  const tagsPart = parts.slice(1).join("__");
  const tags = tagsPart
    .split(/[,+]/g)
    .map((t) => t.trim())
    .filter(Boolean);
  return { base: namePart, tags };
}

function filenameToTitle(filename) {
  const { base } = splitNameAndTags(filename);
  return base
    .replace(/[-_]+/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

function filenameToOrder(filename) {
  const m = filename.match(/^(\d+)\-/);
  return m ? Number.parseInt(m[1], 10) : 9999;
}

function filenameToSlug(filename) {
  const { base } = splitNameAndTags(filename);
  const normalized = base.trim().toLowerCase();
  return normalized
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^\-+|\-+$/g, "")
    .replace(/\-+/g, "-") || "page";
}

function parseDexMeta(fileText) {
  // Looks for:
  // <!--dex
  // key: value
  // -->
  const m = fileText.match(/<!--dex\s*\n([\s\S]*?)\n-->/i);
  if (!m) return null;

  const raw = m[1];
  /** @type {Record<string, string>} */
  const meta = {};
  for (const line of raw.split(/\r?\n/)) {
    const trimmed = line.trim();
    if (!trimmed) continue;
    const idx = trimmed.indexOf(":");
    if (idx === -1) continue;
    const key = trimmed.slice(0, idx).trim().toLowerCase();
    const value = trimmed.slice(idx + 1).trim();
    meta[key] = value;
  }
  return meta;
}

function parseTags(tagValue) {
  if (!tagValue) return [];
  return tagValue
    .split(",")
    .map((t) => t.trim())
    .filter(Boolean);
}

function sortPages(a, b) {
  const ao = Number.isFinite(a.order) ? a.order : 9999;
  const bo = Number.isFinite(b.order) ? b.order : 9999;
  if (ao !== bo) return ao - bo;
  return (a.title || "").localeCompare(b.title || "");
}

async function main() {
  const files = (await readdir(CONTENT_DIR)).filter((f) => f.toLowerCase().endsWith(".html"));

  const pages = [];

  for (const filename of files) {
    const fullPath = path.join(CONTENT_DIR, filename);
    const text = await readFile(fullPath, "utf8");
    const meta = parseDexMeta(text) || {};
    const fromName = splitNameAndTags(filename);

    const title = meta.title || filenameToTitle(filename);
    const slug = meta.slug || filenameToSlug(filename);
    const group = meta.group || "Pages";
    const description = meta.description || "";
    const order = meta.order ? Number.parseInt(meta.order, 10) : filenameToOrder(filename);
    const tags = meta.tags ? parseTags(meta.tags) : fromName.tags;
    const cardImage = (meta.og_image || meta.card_image || "").trim();
    const hideFromNav = /^(false|no|0)$/i.test(String(meta.nav || "").trim());

    pages.push({
      slug,
      title,
      description,
      group,
      order,
      tags,
      cardImage: cardImage || undefined,
      hideFromNav: hideFromNav || undefined,
      contentFile: `content/${filename}`,
    });
  }

  pages.sort(sortPages);

  const out = {
    pages,
  };

  await writeFile(OUT_FILE, JSON.stringify(out, null, 2) + "\n", "utf8");
  console.log(`Wrote ${pages.length} pages to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

