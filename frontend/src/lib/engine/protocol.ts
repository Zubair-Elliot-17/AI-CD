// AI Content Detector - CSC3003S Capstone Project (2025)
// Authors: Meekaaeel Booley, Mubashir Dawood, Zubair Elliot

/** 8-bit ONNX export of fakespot-ai/roberta-base-ai-text-detection-v1. */
export const MODEL_ID = "ZubairElliot17/aicd-roberta-onnx";

export type ToWorker = { type: "load" } | { type: "predict"; id: number; texts: string[] };

export type FromWorker =
  | { type: "progress"; loaded: number; total: number }
  | { type: "ready" }
  | { type: "scores"; id: number; scores: number[] }
  | { type: "error"; id?: number; message: string };
