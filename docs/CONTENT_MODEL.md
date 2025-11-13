# MindsEye Devlog – Content Model

This repo turns `nodes` + `runs` from the MindsEye ledger into a single `DevlogData` structure that you can render into markdown.

---

## 1. Input: Ledger

We expect the standard ledger from `mindseye-google-ledger`:

### `nodes` sheet

- `node_id`
- `parent_node_id`
- `title`
- `prompt_type`
- `doc_url`
- `status`
- `tags`
- `created_at`
- `updated_at`

### `runs` sheet

- `run_id`
- `node_id`
- `model`
- `run_context`
- `input_ref`
- `output_ref`
- `score`
- `notes`
- `run_time`

---

## 2. Intermediate: DevlogEntry

Aggregated per node:

```ts
interface DevlogEntry {
  node_id: string;
  title: string;
  prompt_type: string;
  run_count: number;
  contexts: string[];
  first_run_time: string;
  last_run_time: string;
  sample_outputs: string[];
}
