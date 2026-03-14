// lib/embeddings.js

const HF_MODEL     = "BAAI/bge-small-en-v1.5";
const QUERY_PREFIX = "Represent this sentence for searching relevant passages: ";

// ── HuggingFace Inference API ─────────────────────────────────────────────────

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

// ── Unified export ────────────────────────────────────────────────────────────

/**
 * Generate a 384-dimensional embedding for the given text.
 * Always uses the HuggingFace Inference API (BAAI/bge-small-en-v1.5).
 *
 * @param {string} text
 * @param {"document"|"query"} type
 *   - "document" (default) — for abstracts being stored
 *   - "query" — for search queries and analyze input (adds BGE prefix)
 * @returns {Promise<number[]>} Array of 384 floats
 */
export async function generateEmbedding(text, type = "document") {
  const input = type === "query" ? `${QUERY_PREFIX}${text}` : text;
  return hfEmbedding(input);
}