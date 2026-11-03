// Calls EVERY tool through a real MCP client. Usage: npm test [-- <url>]
// Fails (exit 1) on errors, empty output, or any registered tool missing from `calls`.
import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

const url = process.argv[2] ?? "http://localhost:3000/mcp";
const client = new Client({ name: "my-connector-test", version: "1.0.0" });
await client.connect(new StreamableHTTPClientTransport(new URL(url)));

// Add one entry per tool (plus edge cases: typos, unknown names, empty results).
const calls: [string, Record<string, unknown>][] = [
  ["hello", { name: "World" }],
];

const tools = await client.listTools();
console.log(`Connected to ${url}. ${tools.tools.length} tools: ${tools.tools.map((t) => t.name).join(", ")}`);
const untested = tools.tools.filter((t) => !calls.some(([n]) => n === t.name)).map((t) => t.name);
let bad = 0;
for (const [name, args] of calls) {
  const t0 = Date.now();
  const r: any = await client.callTool({ name, arguments: args });
  const txt: string = r.content?.map((c: any) => c.text).join("\n") ?? "";
  const empty = txt.trim().length < 5;
  if (r.isError || empty) bad++;
  console.log(`\n=== ${name} ${JSON.stringify(args)} — ${Date.now() - t0}ms ${r.isError ? "ERROR" : empty ? "EMPTY" : "ok"} ===`);
  console.log(process.env.FULL ? txt : txt.split("\n").slice(0, 14).join("\n"));
}
console.log(`\nUntested tools: ${untested.join(", ") || "none"}. Problems: ${bad}`);
await client.close();
process.exit(bad || untested.length ? 1 : 0);
