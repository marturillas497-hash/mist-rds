// app/api/abstracts/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/api-auth";
import { generateEmbedding } from "@/lib/embeddings";

// ── GET /api/abstracts ───────────────────────────────────────────────────────

export async function GET() {
  const { data, error } = await supabase
    .from("abstracts")
    .select("id, accession_id, title, department, year, embedding")
    .order("created_at", { ascending: false });

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  const abstracts = data.map(({ embedding, ...rest }) => ({
    ...rest,
    has_embedding: embedding !== null,
  }));

  return NextResponse.json({ abstracts });
}

// ── POST /api/abstracts ──────────────────────────────────────────────────────

export async function POST(req) {
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { title, abstract_text, authors, year, department, keywords} =
    await req.json();

  if (!title?.trim() || !abstract_text?.trim()) {
    return NextResponse.json(
      { error: "Title and abstract text are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("abstracts")
    .insert({
      title,
      abstract_text,
      authors,
      year: year ? parseInt(year, 10) : null,
      department,
      keywords,
    })
    .select("id")
    .single();

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  // Fire-and-forget embedding generation — intentionally not awaited
  (async () => {
    try {
      const embedding = await generateEmbedding(`${title}. ${abstract_text}`, "document");
      await supabase.from("abstracts").update({ embedding }).eq("id", data.id);
    } catch (err) {
      console.error("Background embedding error:", err.message);
    }
  })();

  return NextResponse.json({ id: data.id });
}