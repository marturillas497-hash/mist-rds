import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { InferenceClient } from "@huggingface/inference";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

const hfClient = new InferenceClient(process.env.HUGGINGFACE_API_KEY);

export async function GET(req, { params }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("abstracts")
    .select("id, title, abstract_text, authors, year, department, keywords")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ abstract: data });
}

export async function PATCH(req, { params }) {
  const { id } = await params;
  const body = await req.json();
  const { title, abstract_text, authors, year, department, keywords } = body;

  const { error } = await supabase
    .from("abstracts")
    .update({ title, abstract_text, authors, year: year ? parseInt(year) : null, department, keywords, embedding: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  generateEmbedding(id, `${title}. ${abstract_text}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  const { id } = await params;
  const { error } = await supabase.from("abstracts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
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