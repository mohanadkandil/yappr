import { Client } from "@modelcontextprotocol/sdk/client/index.js";
import { StreamableHTTPClientTransport } from "@modelcontextprotocol/sdk/client/streamableHttp.js";

/**
 * Peec MCP client.
 *
 * Non-fabrication rule: if the MCP returns nothing, the caller renders empty.
 * Never invent data when the server returns no rows.
 */
export async function peecClient() {
  const url = process.env.PEEC_MCP_URL;
  const apiKey = process.env.PEEC_API_KEY;
  if (!url) throw new Error("PEEC_MCP_URL not set in .env.local");
  if (!apiKey) throw new Error("PEEC_API_KEY not set in .env.local");

  const transport = new StreamableHTTPClientTransport(new URL(url), {
    requestInit: {
      headers: { Authorization: `Bearer ${apiKey}` },
    },
  });
  const client = new Client(
    { name: "beacon-studio", version: "0.1.0" },
    { capabilities: {} }
  );
  await client.connect(transport);
  return client;
}

/**
 * Decode Peec's compact columnar JSON into row objects.
 * Most Peec tools return { columns: string[], rows: any[][], rowCount: number }.
 * get_chat is the exception — it returns the full chat object directly.
 */
export function decodeColumnar<T = Record<string, unknown>>(
  payload: unknown
): T[] {
  if (!payload || typeof payload !== "object") return [];
  const p = payload as { columns?: string[]; rows?: unknown[][] };
  if (!Array.isArray(p.columns) || !Array.isArray(p.rows)) return [];
  return p.rows.map((row) => {
    const obj: Record<string, unknown> = {};
    p.columns!.forEach((col, i) => {
      obj[col] = row[i];
    });
    return obj as T;
  });
}
