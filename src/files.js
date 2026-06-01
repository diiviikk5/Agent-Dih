import { mkdir, readdir, stat, writeFile } from "node:fs/promises";
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

export async function latestRun(rootDir) {
  const runsDir = join(rootDir, ".dih", "runs");
  const runs = await listRuns(rootDir);
  if (runs.length === 0) throw new Error(`No runs found in ${runsDir}`);
  return {
    runDir: runs[0].runDir,
    reportPath: join(runs[0].runDir, "report.md"),
    tracePath: join(runs[0].runDir, "trace.json")
  };
}

export async function listRuns(rootDir) {
  const runsDir = join(rootDir, ".dih", "runs");
  const entries = await readdir(runsDir, { withFileTypes: true });
  const runs = await Promise.all(
    entries
      .filter((entry) => entry.isDirectory())
      .map(async (entry) => {
        const runDir = join(runsDir, entry.name);
        const info = await stat(runDir);
        return { runDir, mtimeMs: info.mtimeMs };
      })
  );
  runs.sort((a, b) => b.mtimeMs - a.mtimeMs);
  return runs;
}
