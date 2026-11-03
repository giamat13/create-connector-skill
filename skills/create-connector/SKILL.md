---
name: create-connector
description: Build a remote MCP server (a claude.ai custom connector) in TypeScript, test it, and deploy it to Vercel. Use when the user wants to "make an MCP", "build a connector", "expose an API/data source to Claude", add tools or inline cards (MCP Apps) to an existing connector, or deploy/debug a remote MCP server.
---

# Create a remote MCP connector

Builds a **stateless Streamable-HTTP MCP server** (TypeScript, `@modelcontextprotocol/sdk`) that works as a claude.ai custom connector, optionally with inline visual cards (MCP Apps), and ships it on Vercel. Proven on a real project with 30+ tools.

Templates live in `templates/` next to this file. Deeper notes are in `references/`; read them only when the step needs them:

- `references/mcp-apps-cards.md` — inline cards: `ui://` resource, postMessage protocol, CSP, clickable lists
- `references/deploy-vercel.md` — Vercel setup, deploy, re-adding the connector in claude.ai
- `references/gotchas.md` — pitfalls that cost real time (read before debugging)

## Workflow

1. **Clarify** (ask only what you cannot infer): what data/API, read-only or writes, needs auth or not, wants cards or text only. Default: public data, read-only, no auth, text + cards.
2. **Probe every upstream API before writing code.** `curl` each endpoint: status, response shape, date formats, rate limits, timeouts, redirects (a `301` means the URL changed, e.g. `api.frankfurter.dev`, not `.app`). Public SPARQL/search endpoints can be slow: measure time, keep queries simple, filter in code.
3. **Scaffold** from `templates/` (copy `package.json`, `tsconfig.json`, `vercel.json`, `api/`, `src/`, `scripts/`), rename `my-connector`, `npm install`.
4. **Write tools** in `src/server.ts` (one `registerTool` each). Rules below.
5. **Add every tool to `scripts/test-client.ts`.** The runner fails on untested tools, empty output and `isError`.
6. **Verify locally**: `npm run typecheck`, start `PORT=<fresh port> npm run dev`, confirm the log says "listening" (not `EADDRINUSE`), then `npm test -- http://localhost:<port>/mcp`. Goal: `Untested tools: none. Problems: 0`.
7. **Document**: README tool table (one row per tool), CONTRIBUTING, LICENSE.
8. **Commit, push, deploy** only with the user's go-ahead (see `references/deploy-vercel.md`), then run the test against the live URL.
9. **Tell the user** to remove and re-add the connector in claude.ai (it caches the tool list) and give 3-5 short test prompts.

## Tool design rules

- Few, genuinely working tools. Names are `snake_case` verbs: `search_x`, `get_x`, `list_x`.
- Zod schema with limits on every input (`min/max`, `default`); describe each field with an example.
- Description says what it returns and when to use it, in one or two sentences. The model reads it to choose the tool.
- Annotations: `readOnlyHint: true, idempotentHint: true, destructiveHint: false`, plus `openWorldHint: true` for external APIs.
- Wrap every handler in `safe(...)`: upstream failures become `isError` results with a readable message, never a crash.
- Name the data source in every result. Say when data is community-edited or provisional.
- Never crash on missing fields; fall back to "unknown".
- Typo tolerance: on no match, return "did you mean" suggestions instead of an empty result.
- Cache upstream calls (the template `getJson`/`getText` has TTL, in-flight dedupe, short failure cache, timeout). Use short TTLs (minutes) for live data, hours for static data. Be kind to free APIs.
- Return both text (for the model) and `structuredContent` (for the card) via a helper like `card(text, data)`.
- No secrets in the repo. If a key is required, read it from `process.env` and document it.
- Filter heavy work in code, not in the upstream query, when the upstream is slow.

## Stateless server (Vercel-friendly)

A fresh `McpServer` and transport are created per request (`src/handler.ts`); no sessions, no memory between requests. The only state is the in-memory cache, which is best-effort. CORS and a body-size limit are in the handler. `api/mcp.ts` exports `{ fetch }` and `maxDuration: 30`; `vercel.json` rewrites `/mcp` to `/api/mcp`.

## Cards (MCP Apps), short version

Register one `ui://…` HTML resource (`mimeType: text/html;profile=mcp-app`), then give each tool `_meta: { ui: { resourceUri }, "ui/resourceUri": resourceUri }` and return `structuredContent` with a `kind` field. The HTML is one self-contained file that renders by `kind`. See `references/mcp-apps-cards.md` and `templates/src/view.ts`.

## Output to the user

Be concise. Report: what was built (tool list), test result, URL, and the exact steps to refresh the connector. State caveats honestly (unverified UI paths, slow upstreams, community data).
