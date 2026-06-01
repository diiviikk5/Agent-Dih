# Agent Dih

Agent Dih is a personal website-testing agent. It uses a profile to browse and judge a website like a specific user instead of a generic AI persona.

The point is not "AI user testing." The point is a reusable synthetic version of a real person's taste, patience, budget, risk tolerance, and decision style.

## Reference repos

- [vercel-labs/agent-browser](https://github.com/vercel-labs/agent-browser) for browser-agent execution.
- [earendil-works/pi](https://github.com/earendil-works/pi) for agent runtime/tooling inspiration.

## Run

```bash
npm run check
npm run demo
node ./bin/dih.js adapters
```

Runs create:

```txt
.dih/runs/<timestamp>-<profile>/
  report.md
  trace.json
  artifacts/
```

## Commands

```bash
node ./bin/dih.js check ./examples/divik.profile.json
node ./bin/dih.js test https://example.com --profile ./examples/divik.profile.json --goal "decide if this product is worth trying"
node ./bin/dih.js compare https://example.com https://vercel.com --profile ./examples/divik.profile.json --goal "pick the more interesting product"
node ./bin/dih.js latest ./examples/divik.profile.json
node ./bin/dih.js summary ./examples/divik.profile.json
```
