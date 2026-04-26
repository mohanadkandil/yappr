import { peecClient, decodeColumnar } from "@/lib/peec";
import { NextResponse } from "next/server";

/**
 * Non-fabrication gate.
 *
 * Hit GET /api/smoke after setting your env keys. If you see real tool names
 * and your real project ID/name in the response, MCP is wired correctly and
 * you can proceed to building Studio. If anything fails, fix the env or URL
 * before writing UI — every lint downstream depends on this connection.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const client = await peecClient();

    // 1. List available MCP tools.
    const tools = await client.listTools();
    const toolNames = tools.tools.map((t) => t.name);

    // 2. Call list_projects (no project_id needed).
    const projectsResult = await client.callTool({
      name: "list_projects",
      arguments: {},
    });

    // The result content is an array of { type: "text", text: "..." } parts.
    // For Peec's columnar JSON, the text is a JSON string we have to parse.
    let projects: unknown = null;
    const content = (projectsResult as { content?: { type: string; text: string }[] }).content;
    if (Array.isArray(content) && content[0]?.type === "text") {
      try {
        projects = JSON.parse(content[0].text);
      } catch {
        projects = { raw: content[0].text };
      }
    }

    const projectsRows = decodeColumnar(projects);

    await client.close();

    return NextResponse.json({
      ok: true,
      mcp: {
        url: process.env.PEEC_MCP_URL,
        toolCount: toolNames.length,
        tools: toolNames,
      },
      projects: {
        rowCount: projectsRows.length,
        rows: projectsRows,
        raw: projects,
      },
      env: {
        hasApiKey: !!process.env.PEEC_API_KEY,
        configuredProjectId: process.env.PEEC_PROJECT_ID || null,
      },
    });
  } catch (err) {
    const e = err as Error;
    return NextResponse.json(
      {
        ok: false,
        error: e.message,
        stack: e.stack?.split("\n").slice(0, 5),
        hint: "Check PEEC_MCP_URL and PEEC_API_KEY in .env.local. The endpoint URL may differ from the default — confirm with docs.peec.ai/mcp/setup.",
      },
      { status: 500 }
    );
  }
}
