import { spawn } from "node:child_process";

export async function listAdapters() {
  return [
    {
      name: "agent-browser",
      repo: "vercel-labs/agent-browser",
      detected: await commandExists("agent-browser"),
      overrideEnv: "DIH_BROWSER_COMMAND",
      purpose: "Browse websites and capture real action evidence."
    },
    {
      name: "pi",
      repo: "earendil-works/pi",
      detected: await commandExists("pi") || Boolean(process.env.DIH_PI_COMMAND),
      overrideEnv: "DIH_PI_COMMAND",
      purpose: "Run a richer profile-aware agent runtime when configured."
    }
  ];
}

export function formatAdapters(adapters) {
  const lines = ["Agent Dih adapters", ""];

  for (const adapter of adapters) {
    lines.push(`${(adapter.detected ? "ready" : "missing").padEnd(8)} ${adapter.name} -> ${adapter.repo}`);
    lines.push(`         purpose: ${adapter.purpose}`);
    lines.push(`         override: ${adapter.overrideEnv}`);
  }

  return lines.join("\n");
}

export async function runBrowserAdapter({ url, goal, profile, runDir }) {
  const configured = process.env.DIH_BROWSER_COMMAND;
  const prompt = [
    `Open ${url}.`,
    `Goal: ${goal}`,
    `Act like this profile: ${JSON.stringify(profile)}`,
    `Write findings and artifacts under ${runDir}.`
  ].join("\n");

  if (configured) {
    return runCommand(configured, prompt);
  }

  if (await commandExists("agent-browser")) {
    return runArgv("agent-browser", ["chat", prompt]);
  }

  return null;
}

function commandExists(command) {
  const detector = process.platform === "win32" ? `where ${command}` : `command -v ${command}`;
  return runCommand(detector, "").then((result) => result.code === 0);
}

function runArgv(command, args) {
  return new Promise((resolve) => {
    const child = spawn(command, args, {
      shell: process.platform === "win32",
      windowsHide: true
    });
    collect(child, resolve);
  });
}

function runCommand(command, stdin) {
  return new Promise((resolve) => {
    const child = spawn(command, {
      shell: true,
      windowsHide: true,
      env: process.env
    });
    collect(child, resolve);
    if (stdin) child.stdin.end(stdin);
  });
}

function collect(child, resolve) {
  let stdout = "";
  let stderr = "";
  child.stdout.on("data", (chunk) => {
    stdout += chunk.toString();
  });
  child.stderr.on("data", (chunk) => {
    stderr += chunk.toString();
  });
  child.on("close", (code) => resolve({ code, stdout, stderr }));
}
