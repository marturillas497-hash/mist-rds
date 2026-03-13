// lib/embeddings.js

import { pipeline } from "@xenova/transformers";

// Singleton pipeline instance — loaded once, reused across calls
let embedder = null;

async function getEmbedder() {
  if (!embedder) {
    embedder = await pipeline("feature-extraction", "Xenova/all-MiniLM-L6-v2");
  }
  return embedder;
}

/**
 * Generate a 384-dimensional embedding for the given text.
 * @param {string} text
 * @returns {Promise<number[]>} Array of 384 floats
 */
export async function generateEmbedding(text) {
  const extractor = await getEmbedder();

  // mean_pooling + normalize mirrors the original sentence-transformers behaviour
  const output = await extractor(text, { pooling: "mean", normalize: true });

  // output.data is a Float32Array — convert to a plain number[]
  return Array.from(output.data);
}