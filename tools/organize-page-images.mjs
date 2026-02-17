/**
 * Organize page-images into subfolders by name prefix.
 * e.g. twitch-hero.png -> twitch/, obs-setup.png -> obs/
 */
import { readdir, mkdir, rename, stat, unlink } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const PAGE_IMAGES = path.resolve(__dirname, "../assets/images/page-images");
const EXTS = [".png", ".jpg", ".jpeg", ".gif", ".webp"];

/** Map prefix -> folder name */
const PREFIX_TO_FOLDER = {
  twitch: "twitch",
  obs: "obs",
  streamerbot: "streamerbot",
  "touch-portal": "touch-portal",
  "html-widgets": "html-widgets",
  voicemeeter: "voicemeeter",
  voicemod: "voicemod",
  streamelements: "streamelements",
  "king-queen": "king-queen",
  rocksmith: "rocksmith",
  "flash-sale": "flash-sale",
  "cmd-ctrl": "cmd-ctrl",
  "get-commands": "get-commands",
  "random-media": "random-media",
  ollama: "ollama",
  about: "about",
  commands: "commands",
  home: "home",
  inventory: "inventory",
  links: "links",
  "streaming-rota": "streaming-rota",
  "zelda-ocarina": "zelda-ocarina",
};

function getFolderFor(filename) {
  const base = path.basename(filename, path.extname(filename));
  for (const [prefix, folder] of Object.entries(PREFIX_TO_FOLDER)) {
    if (base === prefix || base.startsWith(prefix + "-")) return folder;
  }
  return null; // stay at root (about, commands, home, inventory, links, streaming-rota, zelda-ocarina)
}

async function main() {
  const entries = await readdir(PAGE_IMAGES, { withFileTypes: true });
  const toMove = [];

  for (const e of entries) {
    if (!e.isFile()) continue;
    const ext = path.extname(e.name).toLowerCase();
    if (!EXTS.includes(ext)) continue;
    if (e.name === "README.md" || e.name === "create-placeholders.ps1") continue;

    const folder = getFolderFor(e.name);
    if (folder) toMove.push({ file: e.name, folder });
  }

  for (const { file, folder } of toMove) {
    const dirPath = path.join(PAGE_IMAGES, folder);
    try {
      const s = await stat(dirPath);
      if (!s.isDirectory()) {
        await unlink(dirPath);
      }
    } catch {
      // path doesn't exist
    }
    await mkdir(dirPath, { recursive: true });
    const src = path.join(PAGE_IMAGES, file);
    const dest = path.join(dirPath, file);
    await rename(src, dest);
    console.log(`  ${file} -> ${folder}/`);
  }

  console.log(`Moved ${toMove.length} images into subfolders.`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});
