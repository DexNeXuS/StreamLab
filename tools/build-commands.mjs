import { readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { fileURLToPath } from "node:url";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

// Streaming/tools -> Streaming -> QuickWebsite
const STREAMING_ROOT = path.resolve(__dirname, "..");
const WORKSPACE_ROOT = path.resolve(STREAMING_ROOT, "..");

const IN_FILE = path.join(WORKSPACE_ROOT, "commands.json");
const OUT_FILE = path.join(STREAMING_ROOT, "assets", "data", "commands.json");

async function main() {
  const raw = await readFile(IN_FILE, "utf8");
  const data = JSON.parse(raw);

  // Keep full structure; renderer can filter per page.
  await writeFile(OUT_FILE, JSON.stringify(data, null, 2) + "\n", "utf8");
  console.log(`Wrote commands catalog to ${OUT_FILE}`);
}

main().catch((err) => {
  console.error(err);
  process.exitCode = 1;
});

