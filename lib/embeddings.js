// lib/embeddings.js

import { pipeline } from "@xenova/transformers";

// ── Local (Transformers.js) ──────────────────────────────────────────────────

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

async function localEmbedding(text) {
  const extractor = await getEmbedder();
  const output = await extractor(text, { pooling: "mean", normalize: true });
  return Array.from(output.data);
}

// ── HuggingFace Inference API (production) ───────────────────────────────────

async function hfEmbedding(text) {
  const res = await fetch(
    "https://api-inference.huggingface.co/pipeline/feature-extraction/sentence-transformers/all-MiniLM-L6-v2",
    {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${process.env.HUGGINGFACE_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({ inputs: text, options: { wait_for_model: true } }),
    }
  );

  if (!res.ok) {
    throw new Error(`HuggingFace API error: ${res.status} ${res.statusText}`);
  }

  let embedding = await res.json();
  if (Array.isArray(embedding[0])) embedding = embedding[0]; // unwrap nested array
  return embedding.map(Number);
}

// ── Unified export ───────────────────────────────────────────────────────────

/**
 * Generate a 384-dimensional embedding for the given text.
 * Uses HuggingFace Inference API in production, local Transformers.js in dev.
 * @param {string} text
 * @returns {Promise<number[]>} Array of 384 floats
 */
export async function generateEmbedding(text) {
  if (process.env.NODE_ENV === "production") {
    return hfEmbedding(text);
  }
  return localEmbedding(text);
}