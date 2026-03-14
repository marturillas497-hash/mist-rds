// app/api/search/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { generateEmbedding } from "@/lib/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
    return NextResponse.json({ error: err.message }, { status: 500 });
  }

  // 2. Run pgvector similarity search via RPC
  const { data, error } = await supabase.rpc("match_abstracts", {
    query_embedding: queryEmbedding,
    match_count:     20,
    filter_dept:     dept,
    filter_year:     year ? parseInt(year) : null,
  });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // 3. Format scores as percentages
  const results = data.map((a) => ({
    ...a,
    similarity: parseFloat((a.similarity * 100).toFixed(1)),
  }));

  return NextResponse.json({ results });
}