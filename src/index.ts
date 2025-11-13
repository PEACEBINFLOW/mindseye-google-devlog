import fs from "fs";
import path from "path";
import { loadConfig } from "./config";
import { SheetsClient } from "./sheets_client";
import { buildDevlog, renderDevlogMarkdown } from "./devlog_builder";

function parseArgs() {
  const args = process.argv.slice(2);
  const opts: { since?: string; until?: string; windowDays?: number } = {};

  const idxSince = args.indexOf("--since");
  if (idxSince !== -1 && args[idxSince + 1]) {
    opts.since = args[idxSince + 1];
  }

  const idxUntil = args.indexOf("--until");
  if (idxUntil !== -1 && args[idxUntil + 1]) {
    opts.until = args[idxUntil + 1];
  }

  const idxWindow = args.indexOf("--window");
  if (idxWindow !== -1 && args[idxWindow + 1]) {
    const n = Number(args[idxWindow + 1]);
    if (!isNaN(n) && n > 0) {
      opts.windowDays = n;
    }
  }

  return opts;
}

async function main() {
  const cfg = loadConfig();
  const args = parseArgs();

  if (!args.since && !args.until && !args.windowDays) {
    console.log(
      "Usage:\n" +
        "  ts-node src/index.ts --since 2025-11-01 --until 2025-11-13\n" +
        "  ts-node src/index.ts --window 7   # last 7 days\n"
    );
    process.exit(0);
  }

  const sheets = new SheetsClient(cfg);
  const [nodes, runs] = await Promise.all([
    sheets.getNodes(),
    sheets.getRuns()
  ]);

  const devlogData = await buildDevlog(cfg, nodes, runs, {
    since: args.since,
    until: args.until,
    windowDays: args.windowDays
  });

  if (!fs.existsSync(cfg.outputDir)) {
    fs.mkdirSync(cfg.outputDir, { recursive: true });
  }

  const from = devlogData.fromDate.slice(0, 10);
  const to = devlogData.toDate.slice(0, 10);
  const fileName = `devlog-${from}_to_${to}.md`;
  const filePath = path.join(cfg.outputDir, fileName);

  const markdown = renderDevlogMarkdown(devlogData);
  fs.writeFileSync(filePath, markdown, "utf-8");

  console.log(`[devlog] Wrote devlog to ${filePath}`);
}

main().catch((err) => {
  console.error("[devlog] Fatal error:", err);
  process.exit(1);
});
