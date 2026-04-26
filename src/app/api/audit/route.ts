import { NextRequest, NextResponse } from "next/server";
import {
  listBrands,
  listTopics,
  getBrandReport,
  getURLReport,
  type Brand,
  type Topic,
  type BrandReportRow,
  type URLReportRow,
} from "@/lib/peec-rest";
import { computeAllLints } from "@/lib/lints";
import { parseDoc } from "@/lib/parse-doc";

export const dynamic = "force-dynamic";

function lastNDays(n: number): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const startD = new Date(now);
  startD.setDate(now.getDate() - n);
  return { start: startD.toISOString().slice(0, 10), end };
}

export async function POST(req: NextRequest) {
  let body: { html?: string; projectId?: string } = {};
  try { body = await req.json(); }
  catch { return NextResponse.json({ ok: false, error: "invalid JSON body" }, { status: 400 }); }

  const projectId = body.projectId || process.env.PEEC_PROJECT_ID;
  if (!projectId) {
    return NextResponse.json({ ok: false, error: "no project selected" }, { status: 500 });
  }

  const html = typeof body.html === "string" ? body.html : "";
  const { start, end } = lastNDays(30);
  const errors: string[] = [];
  const safe = async <T,>(label: string, fn: () => Promise<T>, fallback: T): Promise<T> => {
    try { return await fn(); }
    catch (err) { errors.push(`${label}: ${(err as Error).message}`); return fallback; }
  };

  const [brands, topics, topicRows, urlRows] = await Promise.all([
    safe<Brand[]>("listBrands", () => listBrands(projectId), []),
    safe<Topic[]>("listTopics", () => listTopics(projectId), []),
    safe<BrandReportRow[]>("getBrandReport(topic)", () =>
      getBrandReport({ projectId, startDate: start, endDate: end, dimensions: ["topic_id"], limit: 500 }), []),
    safe<URLReportRow[]>("getURLReport", () => getURLReport({ projectId, startDate: start, endDate: end, limit: 100 }), []),
  ]);

  const ownBrand = brands.find((b) => b.is_own);
  const competitorNames = brands.filter((b) => !b.is_own).map((b) => b.name);
  const doc = html ? parseDoc(html, { competitorNames }) : undefined;

  const lints = computeAllLints({
    project: {
      ownBrandId: ownBrand?.id,
      ownBrandName: ownBrand?.name,
      brands, topics, topicRows, urlRows,
    },
    doc,
  });

  return NextResponse.json({
    ok: true,
    range: { start, end },
    counts: { brands: brands.length, topics: topics.length, topicRows: topicRows.length, urlRows: urlRows.length },
    errors, lints,
    docFacts: doc ? {
      h1: doc.h1, h2Count: doc.h2s.length, hasJsonLd: doc.hasJsonLd,
      hasFAQPattern: doc.hasFAQPattern, hasComparisonPattern: doc.hasComparisonPattern,
      mentionedCompetitors: doc.mentionedCompetitors, wordCount: doc.wordCount,
      claimCount: doc.claimSentences.length,
    } : null,
    activeProject: { id: projectId, name: ownBrand?.name },
  });
}
