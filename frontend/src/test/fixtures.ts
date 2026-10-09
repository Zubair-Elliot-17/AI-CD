// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

import type { DetectResult } from "../lib/api";

const text = "I wrote this myself on the train.\n\nMoreover, it is essential to delve into the topic.";

export const result: DetectResult = {
  id: "abc-123",
  verdict: "mixed",
  ai_probability: 0.81,
  confidence: 0.62,
  ai_sentence_share: 0.5,
  word_count: 16,
  char_count: text.length,
  sentences: [
    { start: 0, end: 33, text: text.slice(0, 33), ai_probability: 0.04 },
    { start: 35, end: text.length, text: text.slice(35), ai_probability: 0.991 },
  ],
  text,
  source: "text",
  filename: null,
  model: "fakespot-ai/roberta-base-ai-text-detection-v1",
  elapsed_ms: 412,
};
