// lib/embeddings.js

const VOYAGE_MODEL = "voyage-3-lite";

// ── Voyage AI Embedding API ───────────────────────────────────────────────────

async function voyageEmbedding(text, inputType, retries = 3) {
  for (let attempt = 1; attempt <= retries; attempt++) {
    const res = await fetch("https://api.voyageai.com/v1/embeddings", {
      method:  "POST",
      headers: {
        "Authorization": `Bearer ${process.env.VOYAGE_API_KEY}`,
        "Content-Type":  "application/json",
      },
      body: JSON.stringify({
        model:      VOYAGE_MODEL,
        input:      [text],
        input_type: inputType,
      }),
    });

    if (res.status === 429 && attempt < retries) {
      // Exponential backoff: 2s, 4s
      await new Promise(r => setTimeout(r, 1000 * Math.pow(2, attempt)));
      continue;
    }

    if (!res.ok) {
      throw new Error(`Voyage AI API error: ${res.status} ${res.statusText}`);
    }

    const data = await res.json();
    return data.data[0].embedding;
  }
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