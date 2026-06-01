#!/usr/bin/env node
import { readdir, readFile } from "node:fs/promises";
import { dirname, join, resolve } from "node:path";
import { formatAdapters, listAdapters, runBrowserAdapter } from "../src/adapters.js";
import { renderBrief } from "../src/brief.js";
import { evaluateFallback } from "../src/evaluator.js";
import { createRunDir, latestRun, listRuns, writeJson, writeText } from "../src/files.js";
import { collectPageEvidence } from "../src/pageEvidence.js";
import { explainProfile, initProfile, loadProfile, validateProfile } from "../src/profile.js";
import { renderReport } from "../src/report.js";

function printHelp() {
  console.log(`Agent Dih

Usage:
  dih init [profile.json]
  dih profiles
  dih evidence <url>
  dih check <profile.json>
  dih explain <profile.json>
  dih test <url> --profile <profile.json> --goal "<goal>"
  dih compare <url...> --profile <profile.json> --goal "<goal>"
  dih runs <profile.json>
  dih latest <profile.json>
  dih summary <profile.json> [--format text|json]
  dih brief <profile.json>
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

const format = argValue("--format", "text");

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

  if (command === "profiles") {
    const examplesDir = resolve(process.cwd(), "examples");
    const files = (await readdir(examplesDir)).filter((file) => file.endsWith(".profile.json"));
    for (const file of files) {
      const profile = await loadProfile(join(examplesDir, file));
      console.log(`${profile.name}\t${file}\t${profile.summary || ""}`);
    }
    process.exit(0);
  }

  if (command === "evidence") {
    const url = args[1];
    if (!url) throw new Error("Missing URL.");
    console.log(JSON.stringify(await collectPageEvidence(url), null, 2));
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

  if (command === "explain") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const profile = await loadProfile(resolve(process.cwd(), path));
    console.log(explainProfile(profile));
    process.exit(0);
  }

  if (command === "latest") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const absoluteProfilePath = resolve(process.cwd(), path);
    const latest = await latestRun(dirname(absoluteProfilePath));
    console.log(`Latest run: ${latest.runDir}`);
    console.log(`Report: ${latest.reportPath}`);
    console.log(`Trace: ${latest.tracePath}`);
    process.exit(0);
  }

  if (command === "runs") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const absoluteProfilePath = resolve(process.cwd(), path);
    const runs = await listRuns(dirname(absoluteProfilePath));
    for (const run of runs.slice(0, 10)) {
      console.log(run.runDir);
    }
    process.exit(0);
  }

  if (command === "summary") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const absoluteProfilePath = resolve(process.cwd(), path);
    const latest = await latestRun(dirname(absoluteProfilePath));
    const trace = JSON.parse(await readFile(latest.tracePath, "utf8"));
    const result = trace.result || trace.results?.[0]?.result;
    if (!result) throw new Error("Latest trace does not include a result.");
    const summary = {
      verdict: result.verdict,
      mode: result.mode,
      scores: result.scores,
      reportPath: latest.reportPath
    };
    if (format === "json") {
      console.log(JSON.stringify(summary, null, 2));
      process.exit(0);
    }
    console.log(`Verdict: ${result.verdict}`);
    console.log(`Mode: ${result.mode}`);
    console.log(`Fit: ${result.scores.fit}/100`);
    console.log(`Trust: ${result.scores.trust}/100`);
    console.log(`Friction: ${result.scores.friction}/100`);
    console.log(`Conversion: ${result.scores.conversion}/100`);
    console.log(`Report: ${latest.reportPath}`);
    process.exit(0);
  }

  if (command === "brief") {
    const path = args[1];
    if (!path) throw new Error("Missing profile path.");
    const absoluteProfilePath = resolve(process.cwd(), path);
    const latest = await latestRun(dirname(absoluteProfilePath));
    const trace = JSON.parse(await readFile(latest.tracePath, "utf8"));
    console.log(renderBrief({ trace, reportPath: latest.reportPath }));
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
    const pageEvidence = await collectPageEvidence(url);
    const browserResult = await runBrowserAdapter({ url, goal, profile, runDir });
    const result = evaluateFallback({ url, goal, profile, browserResult, pageEvidence });
    const report = renderReport({ url, goal, profile, result });

    if (browserResult) {
      await writeText(join(runDir, "artifacts", "browser-adapter-output.txt"), [browserResult.stdout, browserResult.stderr].join("\n"));
    }
    await writeJson(join(runDir, "trace.json"), { url, goal, profile, pageEvidence, browserResult, result });
    await writeText(join(runDir, "report.md"), report);

    console.log(`Agent Dih run complete: ${result.verdict}`);
    console.log(`Run directory: ${runDir}`);
    console.log(`Report: ${join(runDir, "report.md")}`);
    process.exit(0);
  }

  if (command === "compare") {
    const profilePath = argValue("--profile");
    const goal = argValue("--goal", "decide which option is best");
    if (!profilePath) throw new Error("Missing --profile.");
    const urls = args.slice(1, args.indexOf("--profile") >= 0 ? args.indexOf("--profile") : args.length);
    if (urls.length < 2) throw new Error("Compare needs at least two URLs before --profile.");

    const absoluteProfilePath = resolve(process.cwd(), profilePath);
    const profile = await loadProfile(absoluteProfilePath);
    const runDir = await createRunDir(dirname(absoluteProfilePath), `${profile.name}-compare`);
    const results = [];

    for (const url of urls) {
      const pageEvidence = await collectPageEvidence(url);
      const result = evaluateFallback({ url, goal, profile, pageEvidence });
      results.push({ url, pageEvidence, result });
    }

    results.sort((a, b) => b.result.scores.conversion - a.result.scores.conversion);
    const report = [
      "# Agent Dih Compare",
      "",
      `Profile: **${profile.name}**`,
      `Goal: ${goal}`,
      "",
      "| Rank | URL | Verdict | Conversion | Fit | Trust | Friction |",
      "| --- | --- | --- | ---: | ---: | ---: | ---: |",
      ...results.map((item, index) => `| ${index + 1} | ${item.url} | ${item.result.verdict} | ${item.result.scores.conversion} | ${item.result.scores.fit} | ${item.result.scores.trust} | ${item.result.scores.friction} |`)
    ].join("\n");

    await writeJson(join(runDir, "trace.json"), { goal, profile, results });
    await writeText(join(runDir, "report.md"), report);
    console.log(`Agent Dih compare complete: ${results[0].url}`);
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
