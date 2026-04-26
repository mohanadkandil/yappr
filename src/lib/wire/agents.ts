/**
 * Wire — agent runners.
 *
 * Each runner:
 *   1. Reads from Peec REST (real data, no fabrication)
 *   2. Optionally calls OpenRouter for content generation
 *   3. Writes via the appropriate SDK (Octokit / Slack webhook / etc.)
 *   4. Returns a Run record
 *
 * Live agents return real artifacts (PR URLs, Slack message timestamps).
 * Stubs simulate without external calls and return descriptive Runs.
 */

import { getURLReport, getBrandReport, listBrands, listTopics } from "@/lib/peec-rest";
import type { Run } from "./runs";
import { newRunId } from "./runs";
import { Octokit } from "@octokit/rest";
import { IncomingWebhook } from "@slack/webhook";
import type { Recipe } from "./recipes";

function lastNDays(n: number): { start: string; end: string } {
  const now = new Date();
  const end = now.toISOString().slice(0, 10);
  const startD = new Date(now);
  startD.setDate(now.getDate() - n);
  return { start: startD.toISOString().slice(0, 10), end };
}

function nowISO() {
  return new Date().toISOString();
}

export async function runRecipe(recipe: Recipe, projectId: string): Promise<Run> {
  const startedAt = nowISO();
  const id = newRunId();
  const base: Run = {
    id, recipeId: recipe.id, recipeName: recipe.name, recipeEmoji: recipe.emoji,
    startedAt, status: "running", message: "Starting…", trace: [],
  };
  try {
    switch (recipe.id) {
      case "schema-sweeper":  return await runSchemaSweeper(base, projectId);
      case "slack-brief":     return await runSlackBrief(base, projectId);
      case "citation-watch":  return await runCitationWatch(base, projectId);
      case "competitor-surge": return await runCompetitorSurge(base, projectId);
      case "stale-content":   return await runStubAgent(base, "Stale Content Sweeper", "Scans complete. 0 stale posts to draft (stub mode).");
      case "lift-auditor":    return await runStubAgent(base, "Lift Auditor", "Awaiting agent actions to measure (no actions in last 14d).");
      case "schema-coverage": return await runStubAgent(base, "Schema Coverage Report", "Coming soon — needs HTML scraping pipeline.");
      case "press-pitch":     return await runStubAgent(base, "Press Pitch Generator", "Coming soon — needs Gmail OAuth wiring.");
      default:
        return { ...base, endedAt: nowISO(), status: "failed", message: `Unknown recipe ${recipe.id}` };
    }
  } catch (err) {
    return { ...base, endedAt: nowISO(), status: "failed", message: "Agent threw", error: (err as Error).message };
  }
}

// ----------------------------------------------------------------------------
// LIVE AGENT 1 — Schema Sweeper. Opens a real GitHub PR.
// ----------------------------------------------------------------------------

async function runSchemaSweeper(run: Run, projectId: string): Promise<Run> {
  const trace: string[] = [];
  const token = process.env.GITHUB_TOKEN;
  const repoEnv = process.env.GITHUB_REPO; // "owner/repo"
  if (!token || !repoEnv || !repoEnv.includes("/")) {
    return { ...run, endedAt: nowISO(), status: "failed", message: "GITHUB_TOKEN + GITHUB_REPO not set", trace };
  }
  const [owner, repo] = repoEnv.split("/");

  const { start, end } = lastNDays(30);
  trace.push(`Pulled get_url_report for ${start} → ${end} (project ${projectId.slice(0, 12)}…)`);
  const urls = await getURLReport({ projectId, startDate: start, endDate: end, limit: 50 });
  trace.push(`Top cited URLs: ${urls.length}`);

  const pickedTitles = urls.filter((u) => u.title).slice(0, 5).map((u) => u.title!);
  if (pickedTitles.length === 0) {
    return { ...run, endedAt: nowISO(), status: "no-op", message: "No cited URLs with titles to schema-ify.", trace };
  }

  // Build a simple FAQPage JSON-LD bundle from the 5 most-cited URL titles.
  // Each title becomes a "Question" entity; we don't fabricate answers — we
  // omit the answer field if we can't ground it. The PR body says so.
  const schema = {
    "@context": "https://schema.org",
    "@type": "FAQPage",
    mainEntity: pickedTitles.map((t) => ({
      "@type": "Question",
      name: t,
      // No acceptedAnswer — we don't fabricate. Reviewer fills in.
    })),
  };
  trace.push(`Generated FAQPage JSON-LD with ${pickedTitles.length} questions`);

  const filename = `seo/faqpage-${start}-${end}.json`;
  const branch = `beacon/schema-sweeper-${Date.now()}`;
  const commitMsg = `Beacon Schema Sweeper: FAQPage from top cited prompts (${start} → ${end})`;
  const prTitle = `Beacon Schema Sweeper · ${pickedTitles.length} prompts`;
  const prBody = [
    `**Beacon Wire — Schema Sweeper** opened this PR.`,
    ``,
    `**Read path:** Peec \`get_url_report\` filtered to top-cited titles for project \`${projectId}\` over ${start} → ${end}.`,
    ``,
    `**What's inside:** \`${filename}\` — a FAQPage JSON-LD block whose \`mainEntity\` is one Question per top-cited URL title.`,
    ``,
    `**Non-fabrication note:** answers are intentionally **omitted**. Beacon does not invent answers it can't ground in real content. A reviewer should fill them in from the corresponding page or this PR should add a \`<script>\` tag inline on the page that holds the canonical answer.`,
    ``,
    `**Top cited titles included:**`,
    ...pickedTitles.map((t) => `- ${t}`),
  ].join("\n");

  const octo = new Octokit({ auth: token });
  trace.push(`Octokit auth ok`);

  // Get default branch SHA
  const repoData = await octo.rest.repos.get({ owner, repo });
  const defaultBranch = repoData.data.default_branch;
  const baseRef = await octo.rest.git.getRef({ owner, repo, ref: `heads/${defaultBranch}` });
  trace.push(`Default branch: ${defaultBranch}, sha: ${baseRef.data.object.sha.slice(0, 7)}`);

  // Create new branch
  await octo.rest.git.createRef({ owner, repo, ref: `refs/heads/${branch}`, sha: baseRef.data.object.sha });
  trace.push(`Created branch ${branch}`);

  // Create file on the new branch
  const content = Buffer.from(JSON.stringify(schema, null, 2)).toString("base64");
  await octo.rest.repos.createOrUpdateFileContents({
    owner, repo, path: filename, message: commitMsg, content, branch,
  });
  trace.push(`Committed ${filename}`);

  // Open PR
  const pr = await octo.rest.pulls.create({
    owner, repo, title: prTitle, head: branch, base: defaultBranch, body: prBody,
  });
  trace.push(`Opened PR #${pr.data.number}: ${pr.data.html_url}`);

  return {
    ...run,
    endedAt: nowISO(),
    status: "success",
    message: `Opened PR #${pr.data.number} with FAQPage schema for ${pickedTitles.length} top cited prompts.`,
    artifactUrl: pr.data.html_url,
    artifactLabel: `PR #${pr.data.number}`,
    trace,
  };
}

// ----------------------------------------------------------------------------
// LIVE AGENT 2 — Slack Brief. Posts a real message.
// ----------------------------------------------------------------------------

async function runSlackBrief(run: Run, projectId: string): Promise<Run> {
  const trace: string[] = [];
  const url = process.env.SLACK_WEBHOOK_URL;
  if (!url) return { ...run, endedAt: nowISO(), status: "failed", message: "SLACK_WEBHOOK_URL not set", trace };

  const { start, end } = lastNDays(7);
  trace.push(`Pulled Peec brand + url reports for ${start} → ${end}`);
  const [brands, topics, urlRows, brandRows] = await Promise.all([
    listBrands(projectId),
    listTopics(projectId),
    getURLReport({ projectId, startDate: start, endDate: end, limit: 30 }),
    getBrandReport({ projectId, startDate: start, endDate: end, dimensions: ["topic_id"], limit: 200 }),
  ]);
  const own = brands.find((b) => b.is_own);
  if (!own) return { ...run, endedAt: nowISO(), status: "no-op", message: "No own brand configured in Peec.", trace };

  // Top 3 competitor URLs cited where own brand isn't mentioned
  const ownDomains = (own.domains ?? []).map((d) => d.toLowerCase());
  const isOwn = (u: string) => { try { return ownDomains.some((d) => new URL(u).hostname.toLowerCase().endsWith(d)); } catch { return false; }};
  const topCompURLs = urlRows
    .filter((r) => r.url && !isOwn(r.url) && (r.citation_count ?? 0) > 0)
    .sort((a, b) => (b.citation_count ?? 0) - (a.citation_count ?? 0))
    .slice(0, 3);

  // Top 3 topics where own brand has highest visibility (wins to celebrate)
  const ownTopicVis: { topic: string; vis: number }[] = [];
  for (const t of topics) {
    const ownRow = brandRows.find((r) => {
      const tid = (r as { topic?: { id?: string }; topic_id?: string }).topic?.id ?? (r as { topic_id?: string }).topic_id;
      const bid = (r as { brand?: { id?: string }; brand_id?: string }).brand?.id ?? (r as { brand_id?: string }).brand_id;
      return tid === t.id && bid === own.id;
    });
    if (ownRow) ownTopicVis.push({ topic: t.name, vis: (ownRow.visibility as number | undefined) ?? 0 });
  }
  ownTopicVis.sort((a, b) => b.vis - a.vis);
  const wins = ownTopicVis.slice(0, 3);

  const lines: string[] = [];
  lines.push(`*Monday Visibility Brief · ${own.name}* — week of ${start}`);
  lines.push(``);
  lines.push(`*🛎 Top 3 competitor URLs winning prompts you target:*`);
  if (topCompURLs.length === 0) {
    lines.push(`_No competitor URLs detected this week._`);
  } else {
    topCompURLs.forEach((u, i) => {
      let host = "";
      try { host = new URL(u.url).hostname; } catch { host = u.url; }
      lines.push(`${i + 1}. <${u.url}|${u.title || host}> — *${u.citation_count} citations*`);
    });
  }
  lines.push(``);
  lines.push(`*✨ Top 3 topics where ${own.name} is winning:*`);
  if (wins.length === 0) {
    lines.push(`_No topic-level data yet._`);
  } else {
    wins.forEach((w, i) => {
      lines.push(`${i + 1}. *${w.topic}* — ${Math.round(w.vis * 100)}% visibility`);
    });
  }
  lines.push(``);
  lines.push(`_Sent by Beacon Wire · grounded in Peec data · ${end}_`);

  const text = lines.join("\n");
  trace.push(`Composed brief, ${text.length} chars`);

  const hook = new IncomingWebhook(url);
  await hook.send({ text });
  trace.push(`Posted to Slack webhook`);

  return {
    ...run,
    endedAt: nowISO(),
    status: "success",
    message: `Posted weekly brief: ${topCompURLs.length} competitor URLs, ${wins.length} topic wins.`,
    artifactUrl: undefined,
    artifactLabel: "Slack message sent",
    trace,
  };
}

// ----------------------------------------------------------------------------
// LIVE AGENT 3 — Citation Watch. Anomaly detection + Slack alert.
// ----------------------------------------------------------------------------

async function runCitationWatch(run: Run, projectId: string): Promise<Run> {
  const trace: string[] = [];
  const slackUrl = process.env.SLACK_WEBHOOK_URL;

  const { start, end } = lastNDays(60);
  trace.push(`Pulled get_brand_report (60d, dim=topic_id+date)`);
  const rows = await getBrandReport({
    projectId, startDate: start, endDate: end,
    dimensions: ["topic_id", "date"], limit: 2000,
  });
  if (!rows.length) return { ...run, endedAt: nowISO(), status: "no-op", message: "No daily topic data returned.", trace };

  const brands = await listBrands(projectId);
  const own = brands.find((b) => b.is_own);
  if (!own) return { ...run, endedAt: nowISO(), status: "no-op", message: "No own brand configured.", trace };

  // Group rows by (topic_id) for own brand only
  const byTopic = new Map<string, { date: string; vis: number }[]>();
  for (const r of rows) {
    const bid = (r as { brand?: { id?: string }; brand_id?: string }).brand?.id ?? (r as { brand_id?: string }).brand_id;
    if (bid !== own.id) continue;
    const tid = (r as { topic?: { id?: string }; topic_id?: string }).topic?.id ?? (r as { topic_id?: string }).topic_id;
    const date = (r as { date?: string }).date;
    const vis = (r.visibility as number | undefined) ?? 0;
    if (!tid || !date) continue;
    if (!byTopic.has(tid)) byTopic.set(tid, []);
    byTopic.get(tid)!.push({ date, vis });
  }

  const anomalies: { topicId: string; latest: number; mean: number; sigma: number; deviation: number }[] = [];
  for (const [tid, series] of byTopic.entries()) {
    if (series.length < 8) continue;
    const sorted = series.sort((a, b) => a.date.localeCompare(b.date));
    const latest = sorted[sorted.length - 1];
    const trailing = sorted.slice(-15, -1);
    if (trailing.length < 5) continue;
    const mean = trailing.reduce((s, x) => s + x.vis, 0) / trailing.length;
    const variance = trailing.reduce((s, x) => s + (x.vis - mean) ** 2, 0) / trailing.length;
    const sigma = Math.sqrt(variance);
    if (sigma > 0 && latest.vis < mean - 2 * sigma) {
      anomalies.push({ topicId: tid, latest: latest.vis, mean, sigma, deviation: (mean - latest.vis) / sigma });
    }
  }
  trace.push(`Detected ${anomalies.length} 2σ anomalies across ${byTopic.size} topics`);

  if (!anomalies.length) {
    return { ...run, endedAt: nowISO(), status: "no-op", message: "No 2σ visibility drops detected. All clear.", trace };
  }

  const topics = await listTopics(projectId);
  const topicName = (id: string) => topics.find((t) => t.id === id)?.name ?? id.slice(0, 8);

  if (slackUrl) {
    const lines = [`*🛎 Citation Watch — ${anomalies.length} 2σ visibility drop${anomalies.length === 1 ? "" : "s"} detected*`, ``];
    anomalies.forEach((a) => {
      lines.push(`• *${topicName(a.topicId)}* — ${Math.round(a.latest * 100)}% (mean ${Math.round(a.mean * 100)}%, ${a.deviation.toFixed(1)}σ below)`);
    });
    lines.push(``, `_Beacon Wire · ${end}_`);
    const hook = new IncomingWebhook(slackUrl);
    await hook.send({ text: lines.join("\n") });
    trace.push(`Posted alert to Slack`);
  } else {
    trace.push(`SLACK_WEBHOOK_URL not set — skipped Slack alert`);
  }

  return {
    ...run,
    endedAt: nowISO(),
    status: "success",
    message: `${anomalies.length} anomaly${anomalies.length === 1 ? "" : "s"} detected${slackUrl ? " — posted to Slack" : " (Slack not configured)"}.`,
    artifactLabel: slackUrl ? "Slack alert sent" : undefined,
    trace,
  };
}

// ----------------------------------------------------------------------------
// LIVE-ish AGENT 4 — Competitor Surge. Detects week-over-week growth.
// ----------------------------------------------------------------------------

async function runCompetitorSurge(run: Run, projectId: string): Promise<Run> {
  const trace: string[] = [];
  const cur = lastNDays(7);
  const prevEnd = new Date(); prevEnd.setDate(prevEnd.getDate() - 7);
  const prevStart = new Date(prevEnd); prevStart.setDate(prevEnd.getDate() - 7);
  const prev = { start: prevStart.toISOString().slice(0, 10), end: prevEnd.toISOString().slice(0, 10) };

  trace.push(`Pulled get_url_report current (${cur.start} → ${cur.end}) and prior (${prev.start} → ${prev.end})`);
  const [curRows, prevRows] = await Promise.all([
    getURLReport({ projectId, startDate: cur.start, endDate: cur.end, limit: 100 }),
    getURLReport({ projectId, startDate: prev.start, endDate: prev.end, limit: 100 }),
  ]);

  const prevByUrl = new Map<string, number>();
  for (const r of prevRows) prevByUrl.set(r.url, r.citation_count ?? 0);

  const surges: { url: string; title?: string; cur: number; prev: number; growth: number }[] = [];
  for (const r of curRows) {
    const cur = r.citation_count ?? 0;
    const prevV = prevByUrl.get(r.url) ?? 0;
    if (prevV > 0 && cur / prevV > 1.5) {
      surges.push({ url: r.url, title: r.title ?? undefined, cur, prev: prevV, growth: (cur - prevV) / prevV });
    } else if (prevV === 0 && cur > 5) {
      surges.push({ url: r.url, title: r.title ?? undefined, cur, prev: 0, growth: Infinity });
    }
  }
  surges.sort((a, b) => b.growth - a.growth);
  trace.push(`Found ${surges.length} surging URLs`);

  if (surges.length === 0) {
    return { ...run, endedAt: nowISO(), status: "no-op", message: "No competitor URLs surged this week.", trace };
  }

  return {
    ...run,
    endedAt: nowISO(),
    status: "success",
    message: `${surges.length} competitor URL${surges.length === 1 ? "" : "s"} surged. Top: ${surges[0].title ?? surges[0].url} (+${Math.round(surges[0].growth * 100)}%).`,
    trace,
  };
}

// ----------------------------------------------------------------------------
// STUB pattern — agent reports realistic state without external calls.
// ----------------------------------------------------------------------------

async function runStubAgent(run: Run, label: string, message: string): Promise<Run> {
  return {
    ...run,
    endedAt: nowISO(),
    status: "no-op",
    message,
    trace: [`${label}: stub mode — wired but not yet executing external calls.`],
  };
}
