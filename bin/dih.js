#!/usr/bin/env node
import { readFile } from "node:fs/promises";
import { resolve } from "node:path";

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
  if (command === "check") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const profile = JSON.parse(await readFile(resolve(process.cwd(), path), "utf8"));
    if (!profile.name) throw new Error("Profile must include name.");
    console.log(`Profile OK: ${profile.name}`);
    process.exit(0);
  }

  console.error(`Unknown command: ${command}`);
  printHelp();
  process.exit(1);
} catch (error) {
  console.error(`Agent Dih failed: ${error.message}`);
  process.exit(1);
}
