export interface Node {
  node_id: string;
  parent_node_id: string | null;
  title: string;
  prompt_type: string;
  doc_url: string | null;
  status: string;
  tags: string | null;
  created_at: string;
  updated_at: string;
}

export interface Run {
  run_id: string;
  node_id: string;
  model: string;
  run_context: string;
  input_ref: string | null;
  output_ref: string | null;
  score: number | null;
  notes: string | null;
  run_time: string;
}

export interface DevlogEntry {
  node_id: string;
  title: string;
  prompt_type: string;
  run_count: number;
  contexts: string[];
  first_run_time: string;
  last_run_time: string;
  sample_outputs: string[]; // small snippets from output_ref / notes
}

export interface DevlogData {
  periodLabel: string; // e.g. "2025-11-01 → 2025-11-13"
  fromDate: string;
  toDate: string;
  totalRuns: number;
  totalNodes: number;
  entries: DevlogEntry[];
  summary?: string; // optional AI-produced summary
}

export interface DevlogConfig {
  googleProjectId?: string;
  googleClientEmail: string;
  googlePrivateKey: string;
  ledgerSheetId: string;
  nodesRange: string;
  runsRange: string;
  geminiApiKey?: string;
  geminiModelId?: string;
  outputDir: string;
}
