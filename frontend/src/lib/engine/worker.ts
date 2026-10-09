// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

// Runs the RoBERTa detector off the main thread so the page stays responsive.

import {
  AutoModelForSequenceClassification,
  AutoTokenizer,
  env,
  type PreTrainedModel,
  type PreTrainedTokenizer,
  type Tensor,
} from "@huggingface/transformers";
import { cleanText } from "./analysis";
import { MODEL_ID, type FromWorker, type ToWorker } from "./protocol";

env.allowLocalModels = false;
const BATCH = 8;

let loaded: Promise<{ tokenizer: PreTrainedTokenizer; model: PreTrainedModel; aiIndex: number }> | null = null;
const post = (msg: FromWorker) => self.postMessage(msg);

function load() {
  loaded ??= (async () => {
    const tokenizer = await AutoTokenizer.from_pretrained(MODEL_ID);
    const model = await AutoModelForSequenceClassification.from_pretrained(MODEL_ID, {
      dtype: "q8",
      device: "wasm",
      progress_callback: (p) => {
        if (p.status === "progress_total") post({ type: "progress", loaded: p.loaded, total: p.total });
      },
    });
    const label2id = Object.fromEntries(
      Object.entries((model.config as { label2id?: Record<string, number> }).label2id ?? {}).map(([k, v]) => [k.toLowerCase(), v]),
    );
    return { tokenizer, model, aiIndex: label2id.ai ?? 1 };
  })();
  return loaded;
}

async function predict(texts: string[]) {
  const { tokenizer, model, aiIndex } = await load();
  const cleaned = texts.map(cleanText);
  // Batching similar lengths together keeps padding, and wasted compute, to a minimum.
  const order = cleaned.map((_, i) => i).sort((a, b) => cleaned[a].length - cleaned[b].length);
  const probs = new Array<number>(texts.length).fill(0);
  for (let start = 0; start < order.length; start += BATCH) {
    const idx = order.slice(start, start + BATCH);
    const inputs = tokenizer(idx.map((i) => cleaned[i]), { padding: true, truncation: true, max_length: 512 });
    const { logits } = (await model(inputs)) as { logits: Tensor };
    const [rows, cols] = logits.dims;
    const data = logits.data as Float32Array;
    for (let r = 0; r < rows; r++) {
      const row = data.subarray(r * cols, (r + 1) * cols);
      const max = Math.max(...row);
      const exps = Array.from(row, (x) => Math.exp(x - max));
      probs[idx[r]] = exps[aiIndex] / exps.reduce((a, b) => a + b, 0);
    }
  }
  return probs;
}

self.onmessage = async ({ data }: MessageEvent<ToWorker>) => {
  try {
    if (data.type === "load") {
      await load();
      post({ type: "ready" });
    } else {
      post({ type: "scores", id: data.id, scores: await predict(data.texts) });
    }
  } catch (err) {
    if (data.type === "load") loaded = null;
    const message = err instanceof Error ? err.message : String(err);
    post({ type: "error", id: data.type === "predict" ? data.id : undefined, message });
  }
};
