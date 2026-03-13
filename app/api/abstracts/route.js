// app/api/abstracts/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { InferenceClient } from "@huggingface/inference";
import { requireAdmin } from "@/lib/api-auth";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export async function GET() {
  const { data, error } = await supabase
    .from("abstracts")
    .select("id, title, department, year, embedding")
    .order("created_at", { ascending: false });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  const abstracts = data.map((a) => ({
    ...a,
    has_embedding: a.embedding !== null,
    embedding: undefined,
  }));

  return NextResponse.json({ abstracts });
}

export async function POST(req) {
  // ── Admin only ──────────────────────────────────────────────────────────
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const body = await req.json();
  const { title, abstract_text, authors, year, department, keywords } = body;

  if (!title?.trim() || !abstract_text?.trim()) {
    return NextResponse.json({ error: "Title and abstract text are required." }, { status: 400 });
  }

  const { data, error } = await supabase
    .from("abstracts")
    .insert({ title, abstract_text, authors, year: year ? parseInt(year) : null, department, keywords })
    .select("id")
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  generateEmbedding(data.id, `${title}. ${abstract_text}`);

  return NextResponse.json({ id: data.id });
}

async function generateEmbedding(id, text) {
  try {
    const result = await hfClient.featureExtraction({
      model: "sentence-transformers/all-MiniLM-L6-v2",
      inputs: text,
    });

    let embedding = result;
    if (ArrayBuffer.isView(embedding)) embedding = Array.from(embedding);
    if (Array.isArray(embedding[0])) embedding = embedding[0];
    embedding = embedding.map(Number);

    await supabase.from("abstracts").update({ embedding }).eq("id", id);
  } catch (err) {
    console.error("Background embedding error:", err.message);
  }
}