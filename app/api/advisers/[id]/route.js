// app/api/advisers/[id]/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/api-auth";

// ── DELETE /api/advisers/[id] ────────────────────────────────────────────────

export async function DELETE(req, { params }) {
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { id } = await params;
  const { error } = await supabase.from("research_advisers").delete().eq("id", id);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ success: true });
}