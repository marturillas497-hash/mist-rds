// lib/embeddings.js

const VOYAGE_MODEL = "voyage-3-lite";

// ── Voyage AI Embedding API ───────────────────────────────────────────────────

async function voyageEmbedding(text, inputType) {
  const res = await fetch("https://api.voyageai.com/v1/embeddings", {
    method:  "POST",
    headers: {
      "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
      "Content-Type":  "application/json",
    },
    body: JSON.stringify({
      model:      VOYAGE_MODEL,
      input:      [text],
      input_type: inputType, // "query" or "document"
    }),
  });

  if (!res.ok) {
    throw new Error(`Voyage AI API error: ${res.status} ${res.statusText}`);
  }

  const data = await res.json();
  return data.data[0].embedding; // number[]
}

// ── Unified export ────────────────────────────────────────────────────────────

/**
 * Generate a 512-dimensional embedding for the given text.
 * Uses Voyage AI (voyage-3-lite).
 *
 * @param {string} text
 * @param {"document"|"query"} type
 *   - "document" (default) — for abstracts being stored
 *   - "query" — for search queries and analyze input
 * @returns {Promise<number[]>} Array of 512 floats
 */
export async function generateEmbedding(text, type = "document") {
  const inputType = type === "query" ? "query" : "document";
  return voyageEmbedding(text, inputType);
}