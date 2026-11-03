import { McpServer } from "@modelcontextprotocol/sdk/server/mcp.js";
import { z } from "zod";
import { UpstreamError } from "./lib/http.js";
import { VIEW_CSP, VIEW_HTML, VIEW_MIME, VIEW_URI } from "./view.js";

const READ_ONLY = { readOnlyHint: true, idempotentHint: true, destructiveHint: false, openWorldHint: true } as const;

type Out = { content: { type: "text"; text: string }[]; structuredContent?: Record<string, unknown>; isError?: boolean };
const text = (t: string): Out => ({ content: [{ type: "text", text: t }] });
// Text for the model, plus structured data for the inline card.
const card = (t: string, data: Record<string, unknown>): Out => ({ content: [{ type: "text", text: t }], structuredContent: data });
const fail = (t: string): Out => ({ content: [{ type: "text", text: t }], isError: true });
const UI_META = { ui: { resourceUri: VIEW_URI }, "ui/resourceUri": VIEW_URI };

/** Upstream failures become readable tool errors instead of crashes. */
function safe<A>(fn: (a: A) => Promise<Out>) {
  return async (a: A): Promise<Out> => {
    try {
      return await fn(a);
    } catch (e) {
      if (e instanceof UpstreamError) return fail(`⚠️ ${e.message}`);
      return fail(`⚠️ Unexpected error: ${e instanceof Error ? e.message : String(e)}`);
    }
  };
}

export function createServer(): McpServer {
  const server = new McpServer({ name: "my-connector", title: "My Connector", version: "1.0.0" } as any);

  // Inline card (MCP Apps). Remove this block (and UI_META below) for a text-only connector.
  server.registerResource("card", VIEW_URI, { title: "Card", description: "Visual card for tool results.", mimeType: VIEW_MIME }, async () => ({
    contents: [{ uri: VIEW_URI, mimeType: VIEW_MIME, text: VIEW_HTML, _meta: { ui: { csp: VIEW_CSP, prefersBorder: false } } }],
  }));

  server.registerTool(
    "hello",
    {
      title: "👋 Hello",
      description: "Greets someone. Replace with a real tool: say what it returns and when to use it.",
      inputSchema: { name: z.string().trim().min(1).max(100).describe("Who to greet, e.g. 'World'.") },
      annotations: { title: "Hello", ...READ_ONLY },
      _meta: UI_META,
    },
    safe(async ({ name }: any) =>
      card(`Hello, ${name}!\n\n_Source: example_`, {
        kind: "detail", name: `Hello, ${name}!`, icon: "👋", subtitle: "Example tool", sources: "example", rows: [["Name", name]],
      }),
    ),
  );

  return server;
}
