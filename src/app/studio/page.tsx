import Link from "next/link";
import { StudioShell } from "@/components/studio/StudioShell";
import { listBrands } from "@/lib/peec-rest";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const projectId = process.env.PEEC_PROJECT_ID || null;
  let projectName = "Project";

  if (projectId) {
    try {
      const brands = await listBrands(projectId);
      const own = brands.find((b) => b.is_own);
      if (own) projectName = own.name;
    } catch { /* surfaced inside StudioShell on first audit */ }
  }

  if (!projectId) {
    // No env project — show a small notice with a link back home where the
    // user can confirm Peec connectivity. Project picker in chrome will let
    // them pick a project once they're inside.
    return (
      <main className="min-h-screen p-12 flex flex-col gap-4 items-start" style={{ background: "#FAF6EE" }}>
        <h1 className="text-2xl font-bold">Pick a Peec project to start</h1>
        <p className="text-sm" style={{ color: "#4A413A" }}>
          Go back to <Link href="/" className="underline">the landing</Link>, copy a project ID into <code>PEEC_PROJECT_ID</code> in <code>.env.local</code>, and refresh.
          Or use the project selector once Studio loads.
        </p>
      </main>
    );
  }

  return <StudioShell projectName={projectName} projectId={projectId} />;
}
