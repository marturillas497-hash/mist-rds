// lib/embeddings.js

import { pipeline } from "@xenova/transformers";

const LOCAL_MODEL = "Xenova/bge-small-en-v1.5";
const HF_MODEL    = "BAAI/bge-small-en-v1.5";

// BGE models perform better with this prefix on search queries (not documents)
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

// ── Local (Transformers.js) ──────────────────────────────────────────────────

let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", LOCAL_MODEL);
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
    `https://api-inference.huggingface.co/pipeline/feature-extraction/${HF_MODEL}`,
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
  if (Array.isArray(embedding[0])) embedding = embedding[0];
  return embedding.map(Number);
}

// ── Unified export ───────────────────────────────────────────────────────────

/**
 * Generate a 384-dimensional embedding for the given text.
 * Uses HuggingFace Inference API in production, local Transformers.js in dev.
 *
 * @param {string} text
 * @param {"document"|"query"} type
 *   - "document" (default) — for abstracts being stored
 *   - "query" — for search queries and analyze input (adds BGE prefix)
 * @returns {Promise<number[]>} Array of 384 floats
 */
export async function generateEmbedding(text, type = "document") {
  const input = type === "query" ? `${QUERY_PREFIX}${text}` : text;

  if (process.env.NODE_ENV === "production") {
    return hfEmbedding(input);
  }
  return localEmbedding(input);
}