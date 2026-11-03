# create-connector

A [Claude Code](https://claude.com/claude-code) skill that walks Claude through building a **remote MCP server** (a claude.ai custom connector) in TypeScript, testing it with a real MCP client, and deploying it to Vercel. It optionally adds inline visual cards ([MCP Apps](https://modelcontextprotocol.io)).

It was distilled from a real connector with 30+ tools, so it includes the pitfalls that cost real time (slow upstream APIs, stale dev servers, tool-list caching in claude.ai).

## What's inside

```
.claude-plugin/plugin.json          plugin manifest
skills/create-connector/
  SKILL.md                          the workflow Claude follows
  references/                       cards (MCP Apps), Vercel deploy, gotchas
  templates/                        working starter: stateless server, cache, dev server, test runner, card view
```

## Install

As a plugin (clone, then add the folder as a local marketplace/plugin), or copy just the skill:

```bash
git clone https://github.com/GIAMAT13/create-connector-skill.git
# personal skill (all projects)
cp -r create-connector-skill/skills/create-connector ~/.claude/skills/
# or per project
cp -r create-connector-skill/skills/create-connector .claude/skills/
```

On Windows PowerShell: `Copy-Item -Recurse create-connector-skill\skills\create-connector $env:USERPROFILE\.claude\skills\`.

## Use

Ask Claude something like:

- "Make me an MCP connector for the X API and deploy it to Vercel."
- "Add a tool with an inline card to my connector."
- "My remote MCP server fails on Vercel, help me debug it."

Claude loads the skill, probes the upstream APIs, scaffolds from `templates/`, writes the tools, runs the test client until `Untested tools: none. Problems: 0`, and (with your approval) deploys.

## Starter template

```bash
cp -r skills/create-connector/templates my-connector && cd my-connector
npm install
npm run dev        # http://localhost:3000/mcp
npm run typecheck
npm test           # calls every tool through a real MCP client
```

Then push to GitHub, import the repo in Vercel, and add `https://<project>.vercel.app/mcp` in claude.ai → Settings → Connectors.

## Contributing

Issues and PRs are welcome; see [CONTRIBUTING.md](CONTRIBUTING.md).

## License

[MIT](LICENSE) © 2026 GIAMAT13
