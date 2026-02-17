/**
 * Zip only the backup folders (nothing else).
 * Run: npm run build:backups
 * Creates Backups/OBS.zip, Backups/Touch-Portal.zip, etc.
 */
import { createWriteStream } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import archiver from "archiver";

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const ROOT = path.resolve(__dirname, "..");
const BACKUPS_DIR = path.join(ROOT, "Backups");

// Only these folders get zipped — nothing else
const FOLDERS = ["OBS", "Streamerbot", "Touch-Portal", "VoiceMeeter", "VoiceMod", "StreamElements"];

function zipFolder(sourceDir, zipPath) {
  return new Promise((resolve, reject) => {
    const output = createWriteStream(zipPath);
    const archive = archiver("zip", { zlib: { level: 9 } });

    output.on("close", () => resolve(archive.pointer()));
    archive.on("error", reject);

    archive.pipe(output);
    archive.directory(sourceDir, false);
    archive.finalize();
  });
}

async function buildBackupZips() {
  console.log("Zipping backup folders...\n");

  for (const name of FOLDERS) {
    const folderPath = path.join(BACKUPS_DIR, name);
    const zipPath = path.join(BACKUPS_DIR, `${name}.zip`);

    try {
      const bytes = await zipFolder(folderPath, zipPath);
      const mb = (bytes / 1024 / 1024).toFixed(2);
      console.log(`  ✓ ${name}.zip (${mb} MB)`);
    } catch (err) {
      console.error(`  ✗ ${name}: ${err.message}`);
    }
  }

  console.log("\nDone.");
}

buildBackupZips().catch((err) => {
  console.error(err);
  process.exit(1);
});
