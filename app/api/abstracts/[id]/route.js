// app/api/abstracts/[id]/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/api-auth";
import { generateEmbedding } from "@/lib/embeddings";

export async function GET(req, { params }) {
  const { id } = await params;
  const { data, error } = await supabase
    .from("abstracts")
    .select("id, accession_id, title, abstract_text, authors, year, department, keywords")
    .eq("id", id)
    .single();

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ abstract: data });
}

export async function PATCH(req, { params }) {
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const body = await req.json();
  const { title, abstract_text, authors, year, department, keywords, accession_id } = body;

  const { error } = await supabase
    .from("abstracts")
    .update({ title, abstract_text, authors, year: year ? parseInt(year) : null, department, keywords, accession_id, embedding: null })
    .eq("id", id);

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });

  // Fire-and-forget embedding generation — intentionally not awaited
  (async () => {
    try {
      const embedding = await generateEmbedding(`${title}. ${abstract_text}`, "document");
      await supabase.from("abstracts").update({ embedding }).eq("id", id);
    } catch (err) {
      console.error("Background embedding error:", err.message);
    }
  })();

  return NextResponse.json({ success: true });
}

export async function DELETE(req, { params }) {
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const { error } = await supabase.from("abstracts").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}