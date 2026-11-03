# Deploy to Vercel

## Files
- `api/mcp.ts` — `export const config = { maxDuration: 30 }; export default { fetch: (request: Request) => handleMcp(request) };`
- `vercel.json` — `{ "framework": null, "rewrites": [{ "source": "/mcp", "destination": "/api/mcp" }] }`
- No build step is needed: Vercel compiles the TypeScript function.

## First deploy
1. Push the repo to GitHub (ask the user first; create the repo under the user's own account).
2. In Vercel: **Add New → Project → import the repo**. Framework preset: *Other*. No env vars for public-data connectors.
3. Wait for the build, then open `https://<project>.vercel.app/mcp` — a `GET` should answer `405 Method not allowed. Use POST` (that proves the function runs).
4. Pushes to `main` redeploy automatically (allow about a minute).

## Verify the live URL
```bash
npm test -- https://<project>.vercel.app/mcp
```
Expect `Untested tools: none. Problems: 0`. If a tool errors only on Vercel, check its timeout against `maxDuration` and read the runtime logs (Vercel dashboard, or the Vercel MCP `get_runtime_logs`).

## Add to claude.ai
1. claude.ai → Settings → Connectors → **Add custom connector**.
2. Name it, paste `https://<project>.vercel.app/mcp`, leave auth empty for public servers.
3. After every deploy that adds or changes tools or cards: **remove the connector and add it again** (the tool list is cached).
4. Test with a few short prompts that each hit one tool.

## Auth (when needed)
Public, read-only servers need none. For private data use a header token checked in `handleMcp`, or OAuth per the MCP authorization spec; never commit secrets, store them as Vercel environment variables.
