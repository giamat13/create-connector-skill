# Inline cards (MCP Apps)

claude.ai can render an HTML view next to a tool result. The view is a sandboxed iframe that talks to the host with `postMessage` JSON-RPC. No bundler or external scripts are needed; one self-contained HTML string is enough (`templates/src/view.ts`).

## Server side
1. Register the resource once:
   ```ts
   server.registerResource("card", VIEW_URI, { title: "Card", mimeType: "text/html;profile=mcp-app" },
     async () => ({ contents: [{ uri: VIEW_URI, mimeType: "text/html;profile=mcp-app", text: VIEW_HTML,
       _meta: { ui: { csp: VIEW_CSP, prefersBorder: false } } }] }));
   ```
   `VIEW_URI` looks like `ui://my-connector/card.html`.
2. On each tool that should render a card: `_meta: { ui: { resourceUri: VIEW_URI }, "ui/resourceUri": VIEW_URI }`.
3. Return text for the model **and** `structuredContent` for the card: `{ content: [{type:"text", text}], structuredContent: { kind: "list", ... } }`.
4. **CSP**: list every image/asset host the view loads in `resourceDomains` (e.g. cover-image CDNs; redirecting CDNs such as `archive.org` need their own entry). Anything not listed is blocked.

## View side (postMessage, spec 2026-01-26)
- View → host request `ui/initialize` with `{ appInfo, appCapabilities: {}, protocolVersion: "2026-01-26" }`; on the result read `hostContext` (theme), then send notification `ui/notifications/initialized`.
- Host → view notification `ui/notifications/tool-result` with `params.structuredContent` — render by `kind`.
- Host → view `ui/notifications/host-context-changed` — apply light/dark theme.
- View → host notification `ui/notifications/size-changed` `{ width, height }` (use a `ResizeObserver`).
- Host → view request `ui/resource-teardown` — answer with `{ id, result: {} }`.
- View → host request `tools/call` `{ name, arguments }` — lets the card page, open details or refresh by calling your tools again.
- All messages carry `jsonrpc: "2.0"`; requests have an `id`, notifications do not.

## Card kinds that worked well
`list` (rows with image/icon/title/sub, optional `section` headers, `url` for external links, `call` for in-card navigation, `nav` for paging), `detail` (hero, badges, summary, rows, chips, links), `status`, `compare`, `text` (fallback), plus domain-specific ones (e.g. an SVG tree).

Conventions:
- A row with `call` is clickable and loads another tool's result; keep a back stack in the view.
- A row with `url` opens an external link (`target=_blank`, `rel=noopener noreferrer`).
- Always handle missing images (`onerror` → icon fallback) and missing fields.
- Build DOM with `textContent`, never `innerHTML` with data.
- Use CSS variables and honour the host theme.
- If the HTML is inside a JS template literal (`String.raw`), avoid backticks and `${` in the view code.
