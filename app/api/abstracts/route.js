// api/abstracts/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";
import { requireAdmin } from "@/lib/api-auth";
import { generateEmbedding as getEmbedding } from "@/lib/embeddings";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

// ── GET /api/abstracts ───────────────────────────────────────────────────────

export async function GET() {
  const { data, error } = await supabase
    .from("abstracts")
    .select("id, title, department, year, embedding")
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

  const { title, abstract_text, authors, year, department, keywords } =
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

  // Fire-and-forget — intentionally not awaited
  embedAndStore(data.id, `${title}. ${abstract_text}`);

  return NextResponse.json({ id: data.id });
}

// ── Helpers ──────────────────────────────────────────────────────────────────

async function embedAndStore(id, text) {
  try {
    const embedding = await getEmbedding(text); // returns number[] of length 384
    await supabase.from("abstracts").update({ embedding }).eq("id", id);
  } catch (err) {
    console.error("Background embedding error:", err.message);
  }
}