// app/api/search/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service";
import { generateEmbedding } from "@/lib/embeddings";
import { cosineSimilarity, normalizeEmbedding } from "@/lib/similarity";

export async function GET(req) {
  const { searchParams } = new URL(req.url);
  const query = searchParams.get("q")?.trim();
  const dept  = searchParams.get("dept") || null;
  const year  = searchParams.get("year") || null;

  if (!query) {
    return NextResponse.json({ results: [] });
  }

  // 1. Generate embedding for the search query
  let queryEmbedding;
  try {
    queryEmbedding = await generateEmbedding(query, "query");
  } catch (err) {
    console.error("Search embedding failed:", err.message);
    return NextResponse.json({ error: "Search failed." }, { status: 500 });
  }

  // 2. Fetch abstracts (apply dept/year filters if provided)
  let dbQuery = supabase
    .from("abstracts")
    .select("id, title, authors, department, year, keywords, embedding")
    .not("embedding", "is", null);

  if (dept) dbQuery = dbQuery.eq("department", dept);
  if (year) dbQuery = dbQuery.eq("year", parseInt(year));

  const { data, error } = await dbQuery;
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Score and rank by cosine similarity
  const results = data
    .map((a) => {
      const stored = normalizeEmbedding(a.embedding);
      if (!stored) return null;
      const similarity = parseFloat((cosineSimilarity(queryEmbedding, stored) * 100).toFixed(1));
      const { embedding, ...rest } = a; // strip embedding from response
      return { ...rest, similarity };
    })
    .filter(Boolean)
    .sort((a, b) => b.similarity - a.similarity)
    .slice(0, 20); // top 20 results

  return NextResponse.json({ results });
}