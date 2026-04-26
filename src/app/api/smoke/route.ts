import { smoke } from "@/lib/peec-rest";
import { NextResponse } from "next/server";

/**
 * Non-fabrication gate.
 *
 * Hits Peec's /projects endpoint to verify auth + connectivity. If you see real
 * projects with real IDs in the response, REST is wired correctly and you can
 * proceed to building Studio. If anything fails, fix the env or URL before
 * writing UI — every lint downstream depends on this connection.
 */
export const dynamic = "force-dynamic";

export async function GET() {
  const result = await smoke();
  if (!result.ok) {
    return NextResponse.json(
      {
        ok: false,
        error: result.error,
        env: {
          hasApiKey: !!process.env.PEEC_API_KEY,
          apiUrl: process.env.PEEC_API_URL,
          configuredProjectId: process.env.PEEC_PROJECT_ID || null,
        },
        hint: "Verify PEEC_API_KEY (X-API-Key auth) and PEEC_API_URL in .env.local. Default: https://api.peec.ai/customer/v1.",
      },
      { status: 500 }
    );
  }
  return NextResponse.json({
    ok: true,
    api: { url: process.env.PEEC_API_URL },
    projects: result.projects,
    env: {
      hasApiKey: !!process.env.PEEC_API_KEY,
      configuredProjectId: process.env.PEEC_PROJECT_ID || null,
    },
  });
}
