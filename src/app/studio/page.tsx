import Link from "next/link";
import { StudioShell } from "@/components/studio/StudioShell";
import { listBrands } from "@/lib/peec-rest";

export const dynamic = "force-dynamic";

export default async function StudioPage() {
  const hasPeecApiKey = !!process.env.PEEC_API_KEY;
  const projectId = process.env.PEEC_PROJECT_ID || null;
  let projectName = projectId ? "Project" : "Select project";

  if (hasPeecApiKey && projectId) {
    try {
      const brands = await listBrands(projectId);
      const own = brands.find((b) => b.is_own);
      if (own) projectName = own.name;
    } catch { /* surfaced inside StudioShell on first audit */ }
  }

  if (!hasPeecApiKey) return <PeecSetup />;

  return <StudioShell projectName={projectName} projectId={projectId} />;
}

function PeecSetup() {
  return (
    <main className="min-h-screen flex items-center justify-center p-8" style={{
      background:
        "radial-gradient(800px 380px at 0% 0%, #CFEAD9 0%, transparent 55%)," +
        "radial-gradient(700px 480px at 100% 0%, #FDE3CC 0%, transparent 55%)," +
        "#FAF6EE",
      color: "#1A1612",
      fontFamily: '-apple-system, "SF Pro Text", system-ui, sans-serif',
    }}>
      <section className="max-w-[680px] rounded-[24px] p-8" style={{
        background: "rgba(255,255,255,0.58)",
        border: "1px solid rgba(26,22,18,0.08)",
        boxShadow: "0 24px 60px rgba(26,22,18,0.10)",
        backdropFilter: "blur(14px)",
      }}>
        <div className="text-[10px] font-extrabold uppercase tracking-[0.26em] mb-3" style={{ color: "#B5601E" }}>
          yappr setup
        </div>
        <h1 className="text-[34px] leading-tight font-extrabold tracking-[-0.02em] mb-3">
          Bring your own Peec API key.
        </h1>
        <p className="text-[15px] leading-[1.6] mb-5" style={{ color: "#4A413A", fontFamily: '"New York", Georgia, serif' }}>
          yappr does not ship with a demo Peec account. To see live citations, lints, Forge drafts, and Wire patches for your product, add your own Peec API key and select one of your Peec projects.
        </p>
        <div className="rounded-[16px] p-4 mb-5 font-mono text-[12px] leading-relaxed" style={{
          background: "rgba(26,22,18,0.05)",
          color: "#1A1612",
          border: "1px solid rgba(26,22,18,0.06)",
        }}>
          <div>PEEC_API_KEY=your_peec_api_key</div>
          <div>PEEC_API_URL=https://api.peec.ai/customer/v1</div>
          <div className="opacity-70">PEEC_PROJECT_ID=optional_default_project_id</div>
        </div>
        <div className="flex items-center gap-3">
          <Link href="/" className="px-4 py-2 rounded-full text-[13px] font-bold" style={{ background: "#1A1612", color: "#FAF6EE" }}>
            Back home
          </Link>
          <a href="https://docs.peec.ai/api/introduction" target="_blank" rel="noreferrer" className="px-4 py-2 rounded-full text-[13px] font-bold border" style={{
            borderColor: "rgba(26,22,18,0.10)",
            color: "#4A413A",
          }}>
            Peec API docs ↗
          </a>
        </div>
      </section>
    </main>
  );
}
