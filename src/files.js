import { mkdir, writeFile } from "node:fs/promises";
import { join } from "node:path";

export async function createRunDir(rootDir, profileName) {
  const safeName = profileName.toLowerCase().replace(/[^a-z0-9]+/g, "-").replace(/(^-|-$)/g, "");
  const stamp = new Date().toISOString().replace(/[:.]/g, "-");
  const runDir = join(rootDir, ".dih", "runs", `${stamp}-${safeName}`);
  await mkdir(join(runDir, "artifacts"), { recursive: true });
  return runDir;
}

export async function writeJson(path, value) {
  await writeFile(path, JSON.stringify(value, null, 2), "utf8");
}

export async function writeText(path, value) {
  await writeFile(path, value, "utf8");
}
