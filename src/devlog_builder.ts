import { DevlogConfig, DevlogData, DevlogEntry, Node, Run } from "./types";
import Handlebars from "handlebars";
import fs from "fs";
import path from "path";
import { GeminiClient } from "./gemini_client";

function parseDate(d: string): Date | null {
  const dt = new Date(d);
  return isNaN(dt.getTime()) ? null : dt;
}

export interface BuildOptions {
  since?: string; // ISO date
  until?: string; // ISO date
  windowDays?: number; // e.g. last 7 days
}

export async function buildDevlog(
  cfg: DevlogConfig,
  nodes: Node[],
  runs: Run[],
  opts: BuildOptions
): Promise<DevlogData> {
  let sinceDate: Date;
  let untilDate: Date;

  if (opts.windowDays && (!opts.since && !opts.until)) {
    const now = new Date();
    untilDate = now;
    sinceDate = new Date(now.getTime() - opts.windowDays * 24 * 60 * 60 * 1000);
  } else {
    sinceDate = opts.since ? new Date(opts.since) : new Date("1970-01-01");
    untilDate = opts.until ? new Date(opts.until) : new Date();
  }

  const filteredRuns = runs.filter((run) => {
    const d = parseDate(run.run_time);
    if (!d) return false;
    return d >= sinceDate && d <= untilDate;
  });

  const runsByNode = new Map<string, Run[]>();
  filteredRuns.forEach((run) => {
    if (!run.node_id) return;
    const arr = runsByNode.get(run.node_id) || [];
    arr.push(run);
    runsByNode.set(run.node_id, arr);
  });

  const entries: DevlogEntry[] = [];
  for (const [nodeId, nodeRuns] of runsByNode.entries()) {
    const node = nodes.find((n) => n.node_id === nodeId);
    const title = node?.title || `(Unlabeled node ${nodeId})`;
    const promptType = node?.prompt_type || "unknown";

    const times = nodeRuns
      .map((r) => parseDate(r.run_time))
      .filter((d): d is Date => !!d)
      .sort((a, b) => a.getTime() - b.getTime());

    const firstRun = times[0];
    const lastRun = times[times.length - 1];

    const contexts = Array.from(
      new Set(nodeRuns.map((r) => r.run_context || "unknown"))
    );

    const sampleOutputs: string[] = [];
    for (const r of nodeRuns) {
      if (r.output_ref) sampleOutputs.push(r.output_ref);
      if (sampleOutputs.length >= 3) break;
    }

    entries.push({
      node_id: nodeId,
      title,
      prompt_type: promptType,
      run_count: nodeRuns.length,
      contexts,
      first_run_time: firstRun ? firstRun.toISOString() : "",
      last_run_time: lastRun ? lastRun.toISOString() : "",
      sample_outputs: sampleOutputs
    });
  }

  // Sort entries by last_run_time descending
  entries.sort((a, b) =>
    b.last_run_time.localeCompare(a.last_run_time)
  );

  const periodLabel =
    sinceDate.toISOString().slice(0, 10) +
    " → " +
    untilDate.toISOString().slice(0, 10);

  const data: DevlogData = {
    periodLabel,
    fromDate: sinceDate.toISOString(),
    toDate: untilDate.toISOString(),
    totalRuns: filteredRuns.length,
    totalNodes: entries.length,
    entries
  };

  // Optional: Gemini summary if API key is set
  if (cfg.geminiApiKey && cfg.geminiModelId && filteredRuns.length > 0) {
    const ctxLines: string[] = [];

    ctxLines.push(`Period: ${periodLabel}`);
    ctxLines.push(`Total runs: ${filteredRuns.length}`);
    ctxLines.push(`Total active nodes: ${entries.length}`);
    ctxLines.push("");

    entries.forEach((e) => {
      ctxLines.push(
        `Node ${e.node_id} — ${e.title} [${e.prompt_type}] (${e.run_count} runs, contexts: ${e.contexts.join(
          ", "
        )})`
      );
    });

    const summaryContext = ctxLines.join("\n");
    const gemini = new GeminiClient({
      apiKey: cfg.geminiApiKey,
      modelId: cfg.geminiModelId
    });

    try {
      const summary = await gemini.summarizeDevlogContext(summaryContext);
      data.summary = summary;
    } catch (err) {
      console.warn("[devlog] Failed to generate Gemini summary:", err);
    }
  }

  return data;
}

export function renderDevlogMarkdown(data: DevlogData): string {
  const templatePath = path.join(
    __dirname,
    "..",
    "templates",
    "devlog_post.md.hbs"
  );
  const raw = fs.readFileSync(templatePath, "utf-8");
  const tpl = Handlebars.compile(raw);

  const ctx = {
    period: data.periodLabel,
    totalRuns: data.totalRuns,
    totalNodes: data.totalNodes,
    summary: data.summary,
    entries: data.entries
  };

  return tpl(ctx);
}
