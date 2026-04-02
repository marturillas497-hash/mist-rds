// lib/similarity.js
// Shared similarity-computation utilities used by analyze and search API routes

export const EMBEDDING_DIM = 384;

export function cosineSimilarity(a, b) {
  let dot = 0, magA = 0, magB = 0;
  for (let i = 0; i < a.length; i++) {
    dot  += a[i] * b[i];
    magA += a[i] * a[i];
    magB += b[i] * b[i];
  }
  magA = Math.sqrt(magA);
  magB = Math.sqrt(magB);
  if (magA === 0 || magB === 0) return 0;
  return dot / (magA * magB);
}

export function normalizeEmbedding(raw) {
  if (!raw) return null;
  try {
    if (typeof raw === "string") raw = JSON.parse(raw);
    if (Array.isArray(raw[0])) raw = raw[0];
    const embedding = raw.map(Number);
    if (embedding.length !== EMBEDDING_DIM) return null;
    return embedding;
  } catch { return null; }
}

export function getRiskLevel(percent) {
  if (percent >= 80) return { level: "Very High", color: "RED"    };
  if (percent >= 60) return { level: "High",      color: "ORANGE" };
  if (percent >= 40) return { level: "Moderate",  color: "YELLOW" };
  return                    { level: "Low",        color: "GREEN"  };
}
