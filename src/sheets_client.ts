import { google, sheets_v4 } from "googleapis";
import { DevlogConfig, Node, Run } from "./types";

export class SheetsClient {
  private sheets: sheets_v4.Sheets;
  private sheetId: string;
  private nodesRange: string;
  private runsRange: string;

  constructor(config: DevlogConfig) {
    const auth = new google.auth.JWT(
      config.googleClientEmail,
      undefined,
      config.googlePrivateKey,
      ["https://www.googleapis.com/auth/spreadsheets.readonly"],
      undefined
    );

    this.sheets = google.sheets({ version: "v4", auth });
    this.sheetId = config.ledgerSheetId;
    this.nodesRange = config.nodesRange;
    this.runsRange = config.runsRange;
  }

  async getNodes(): Promise<Node[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: this.nodesRange
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);

    const idx = (name: string) => headers.indexOf(name);

    const iNodeId = idx("node_id");
    const iParent = idx("parent_node_id");
    const iTitle = idx("title");
    const iPromptType = idx("prompt_type");
    const iDocUrl = idx("doc_url");
    const iStatus = idx("status");
    const iTags = idx("tags");
    const iCreated = idx("created_at");
    const iUpdated = idx("updated_at");

    const mapRow = (row: any[]): Node => {
      const get = (i: number) => (i >= 0 ? row[i] ?? "" : "");
      return {
        node_id: get(iNodeId),
        parent_node_id: get(iParent) || null,
        title: get(iTitle),
        prompt_type: get(iPromptType),
        doc_url: get(iDocUrl) || null,
        status: get(iStatus),
        tags: get(iTags) || null,
        created_at: get(iCreated),
        updated_at: get(iUpdated)
      };
    };

    return dataRows
      .map(mapRow)
      .filter((n) => n.node_id && n.title);
  }

  async getRuns(): Promise<Run[]> {
    const res = await this.sheets.spreadsheets.values.get({
      spreadsheetId: this.sheetId,
      range: this.runsRange
    });

    const rows = res.data.values || [];
    if (rows.length <= 1) return [];

    const headers = rows[0];
    const dataRows = rows.slice(1);
    const idx = (name: string) => headers.indexOf(name);

    const iRunId = idx("run_id");
    const iNodeId = idx("node_id");
    const iModel = idx("model");
    const iCtx = idx("run_context");
    const iInput = idx("input_ref");
    const iOutput = idx("output_ref");
    const iScore = idx("score");
    const iNotes = idx("notes");
    const iTime = idx("run_time");

    const mapRow = (row: any[]): Run => {
      const get = (i: number) => (i >= 0 ? row[i] ?? "" : "");
      const scoreVal = get(iScore);
      let score: number | null = null;
      if (scoreVal !== "") {
        const n = Number(scoreVal);
        score = isNaN(n) ? null : n;
      }
      return {
        run_id: get(iRunId),
        node_id: get(iNodeId),
        model: get(iModel),
        run_context: get(iCtx),
        input_ref: get(iInput) || null,
        output_ref: get(iOutput) || null,
        score,
        notes: get(iNotes) || null,
        run_time: get(iTime)
      };
    };

    return dataRows
      .map(mapRow)
      .filter((r) => r.run_id && r.run_time);
  }
}
