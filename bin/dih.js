#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { formatAdapters, listAdapters, runBrowserAdapter } from "../src/adapters.js";
import { evaluateFallback } from "../src/evaluator.js";
import { createRunDir, writeJson, writeText } from "../src/files.js";
import { initProfile, loadProfile, validateProfile } from "../src/profile.js";
import { renderReport } from "../src/report.js";

function printHelp() {
  console.log(`Agent Dih

Usage:
  dih init [profile.json]
  dih check <profile.json>
  dih test <url> --profile <profile.json> --goal "<goal>"
  dih adapters

Environment adapters:
  DIH_BROWSER_COMMAND  Browser agent command. Defaults to agent-browser when available.
  DIH_PI_COMMAND       Optional pi-based agent command.

Examples:
  npm run demo
  node ./bin/dih.js init
  node ./bin/dih.js test https://example.com --profile ./examples/divik.profile.json --goal "decide if this is worth trying"
`);
}

const args = process.argv.slice(2);
const command = args[0];

if (!command || command === "--help" || command === "-h" || command === "help") {
  printHelp();
  process.exit(0);
}

function argValue(name, fallback = null) {
  const index = args.indexOf(name);
  return index >= 0 ? args[index + 1] : fallback;
}

try {
  if (command === "adapters") {
    console.log(formatAdapters(await listAdapters()));
    process.exit(0);
  }

  if (command === "init") {
    const target = resolve(process.cwd(), args[1] || "dih.profile.json");
    await initProfile(target);
    console.log(`Created ${target}`);
    process.exit(0);
  }

  if (command === "check") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const profile = JSON.parse(await readFile(resolve(process.cwd(), path), "utf8"));
    validateProfile(profile);
    console.log(`Profile OK: ${profile.name}`);
    process.exit(0);
  }

  if (command === "test") {
    const url = args[1];
    const profilePath = argValue("--profile");
    const goal = argValue("--goal", "decide whether to continue");
    if (!url) throw new Error("Missing URL.");
    if (!profilePath) throw new Error("Missing --profile.");

    const absoluteProfilePath = resolve(process.cwd(), profilePath);
    const profile = await loadProfile(absoluteProfilePath);
    const runDir = await createRunDir(dirname(absoluteProfilePath), profile.name);
    const browserResult = await runBrowserAdapter({ url, goal, profile, runDir });
    const result = evaluateFallback({ url, goal, profile, browserResult });
    const report = renderReport({ url, goal, profile, result });

    if (browserResult) {
      await writeText(join(runDir, "artifacts", "browser-adapter-output.txt"), [browserResult.stdout, browserResult.stderr].join("\n"));
    }
    await writeJson(join(runDir, "trace.json"), { url, goal, profile, browserResult, result });
    await writeText(join(runDir, "report.md"), report);

    console.log(`Agent Dih run complete: ${result.verdict}`);
    console.log(`Run directory: ${runDir}`);
    console.log(`Report: ${join(runDir, "report.md")}`);
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
} catch (error) {
  console.error(`Agent Dih failed: ${error.message}`);
  process.exit(1);
}
