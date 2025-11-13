import fs from "fs";
import path from "path";
import { DevlogConfig } from "./types";

function loadJsonConfig(): Partial<DevlogConfig> {
  const configPath = path.join(__dirname, "..", "config", "config.json");
  if (!fs.existsSync(configPath)) return {};
  try {
    const raw = fs.readFileSync(configPath, "utf-8");
    return JSON.parse(raw);
  } catch (err) {
    console.warn("[config] Failed to parse config/config.json:", err);
    return {};
  }
}

export function loadConfig(): DevlogConfig {
  const fileConfig = loadJsonConfig();
  const env = process.env;

  const privateKeyRaw =
    env.GOOGLE_PRIVATE_KEY || (fileConfig.googlePrivateKey ?? "");
  const normalizedKey = privateKeyRaw.replace(/\\n/g, "\n");

  const cfg: DevlogConfig = {
    googleProjectId:
      env.GOOGLE_PROJECT_ID || fileConfig.googleProjectId || undefined,
    googleClientEmail:
      env.GOOGLE_CLIENT_EMAIL || fileConfig.googleClientEmail || "",
    googlePrivateKey: normalizedKey,
    ledgerSheetId:
      env.LEDGER_SHEET_ID || fileConfig.ledgerSheetId || "",
    nodesRange:
      env.LEDGER_NODES_RANGE || fileConfig.nodesRange || "nodes!A:I",
    runsRange:
      env.LEDGER_RUNS_RANGE || fileConfig.runsRange || "runs!A:I",
    geminiApiKey:
      env.GEMINI_API_KEY || fileConfig.geminiApiKey || "",
    geminiModelId:
      env.GEMINI_MODEL_ID || fileConfig.geminiModelId || "gemini-1.5-pro",
    outputDir:
      env.OUTPUT_DIR || fileConfig.outputDir || "devlogs"
  };

  const required: (keyof DevlogConfig)[] = [
    "googleClientEmail",
    "googlePrivateKey",
    "ledgerSheetId",
    "nodesRange",
    "runsRange",
    "outputDir"
  ];

  const missing = required.filter((k) => !cfg[k]);
  if (missing.length > 0) {
    throw new Error(
      `[config] Missing required devlog config keys: ${missing.join(", ")}`
    );
  }

  return cfg;
}
