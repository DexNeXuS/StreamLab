/**
 * Create placeholder SVG images for inventory items.
 * Run: node tools/create-inventory-placeholders.mjs
 */
import { writeFile, mkdir } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const OUT_DIR = path.resolve(__dirname, "../assets/images/inventory");

const ITEMS = [
  "black-candle",
  "blood-contract",
  "hex-coin",
  "trap-card",
  "veil-of-ash",
  "moment-of-silence",
  "reality-tear",
  "mirror-of-malice",
  "smoke-bomb",
  "soul-thief",
  "phantoms-veil",
  "chaos-orb",
  "deaths-whisper",
  "shadow-weave",
  "bone-fragment",
  "cursed-essence",
  "echo-stone",
  "soul-anchor",
  "blood-moon-token",
  "void-shard",
  "necrotic-catalyst",
  "silence-curse",
];

function titleCase(str) {
  return str
    .replace(/-/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase())
    .replace(/ S /g, "'s ");
}

function createSvg(id) {
  const name = titleCase(id);
  return `<svg xmlns="http://www.w3.org/2000/svg" width="200" height="200" viewBox="0 0 200 200">
  <defs>
    <linearGradient id="bg" x1="0%" y1="0%" x2="100%" y2="100%">
      <stop offset="0%" style="stop-color:#2d1b4e"/>
      <stop offset="100%" style="stop-color:#1a0f2e"/>
    </linearGradient>
  </defs>
  <rect width="200" height="200" fill="url(#bg)" rx="8"/>
  <rect x="10" y="10" width="180" height="180" fill="none" stroke="rgba(139,92,246,0.4)" stroke-width="2" rx="4"/>
  <text x="100" y="95" text-anchor="middle" fill="rgba(245,247,255,0.7)" font-family="system-ui,sans-serif" font-size="14" font-weight="600">${name}</text>
  <text x="100" y="115" text-anchor="middle" fill="rgba(245,247,255,0.4)" font-family="system-ui,sans-serif" font-size="11">Replace with real image</text>
</svg>`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  for (const id of ITEMS) {
    const svg = createSvg(id);
    const file = `${id}.svg`;
    await writeFile(path.join(OUT_DIR, file), svg, "utf8");
    console.log(`  ${file}`);
  }
  console.log(`Created ${ITEMS.length} placeholder images in assets/images/inventory/`);
}

main().catch((e) => {
  console.error(e);
  process.exitCode = 1;
});
