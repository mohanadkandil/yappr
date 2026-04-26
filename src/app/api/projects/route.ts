import { listProjects } from "@/lib/peec-rest";
import { NextResponse } from "next/server";

export const dynamic = "force-dynamic";

export async function GET() {
  try {
    const projects = await listProjects();
    return NextResponse.json({ ok: true, projects });
  } catch (err) {
    return NextResponse.json({ ok: false, error: (err as Error).message }, { status: 500 });
  }
}
