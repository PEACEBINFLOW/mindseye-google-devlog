# MindsEye Google Devlog

Generates **Dev.to-style markdown posts** from the **MindsEye ledger**  
(`nodes` + `runs` Google Sheet) and optionally uses **Gemini** to polish or expand the content.

This repo is meant to sit on top of:

- `mindseye-google-ledger` — source of truth for prompt nodes and runs
- `mindseye-gemini-orchestrator` — where the actual runs happen
- `mindseye-workspace-automation` — Gmail / Docs / Drive flows that also log runs

`mindseye-google-devlog` then:

1. Reads recent activity from the ledger.
2. Groups runs by prompt node / context.
3. Builds a **devlog narrative** (what changed, what we learned, what’s next).
4. Writes out markdown files you can post to Dev.to, Medium, Substack, etc.

---

## ⚙️ Configuration

You can configure via `config/config.json` (copied from `config/config.example.json`)  
or via environment variables.

### Required

- `LEDGER_SHEET_ID` — same as in `mindseye-google-ledger`
- `LEDGER_NODES_RANGE` — e.g. `nodes!A:I`
- `LEDGER_RUNS_RANGE` — e.g. `runs!A:I`

### Optional but recommended

- `GEMINI_API_KEY` — if you want AI-assisted narrative
- `GEMINI_MODEL_ID` — e.g. `gemini-1.5-pro`

### Example config

See `config/config.example.json`.

---

## 🧱 Data model

The devlog generator expects the ledger schema from `mindseye-google-ledger`:

**Nodes (`nodes` sheet):**

- `node_id`
- `parent_node_id`
- `title`
- `prompt_type`
- `doc_url`
- `status`
- `tags`
- `created_at`
- `updated_at`

**Runs (`runs` sheet):**

- `run_id`
- `node_id`
- `model`
- `run_context`
- `input_ref`
- `output_ref`
- `score`
- `notes`
- `run_time`

These are turned into an internal `DevlogEntry` structure (see `docs/CONTENT_MODEL.md`).

---

## 🧪 Usage

Install deps:

```bash
npm install
