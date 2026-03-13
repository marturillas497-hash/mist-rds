// app/api/abstracts/[id]/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { generateEmbedding as getEmbedding } from "@/lib/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

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
  // ── Admin only ──────────────────────────────────────────────────────────
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const { title, abstract_text, authors, year, department, keywords } = body;

  const { error } = await supabase
    .from("abstracts")
    .update({ title, abstract_text, authors, year: year ? parseInt(year) : null, department, keywords, embedding: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget — intentionally not awaited
  embedAndStore(id, `${title}. ${abstract_text}`);

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  // ── Admin only ──────────────────────────────────────────────────────────
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const { error } = await supabase.from("abstracts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}

async function embedAndStore(id, text) {
  try {
    const embedding = await getEmbedding(text); // returns number[] of length 384
    await supabase.from("abstracts").update({ embedding }).eq("id", id);
  } catch (err) {
    console.error("Background embedding error:", err.message);
  }
}