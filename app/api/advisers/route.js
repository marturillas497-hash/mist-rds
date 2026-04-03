// app/api/advisers/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service";
import { requireAdmin } from "@/lib/api-auth";

// ── GET /api/advisers ────────────────────────────────────────────────────────

export async function GET() {
  const { data, error } = await supabase
    .from("research_advisers")
    .select("id, full_name, department, email, created_at")
    .order("department", { ascending: true })
    .order("full_name", { ascending: true });

  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  return NextResponse.json({ advisers: data });
}

// ── POST /api/advisers ───────────────────────────────────────────────────────

export async function POST(req) {
  const { error: authError } = await requireAdmin(req);
  if (authError) return authError;

  const { full_name, department, email } = await req.json();

  if (!full_name?.trim() || !department?.trim() || !email?.trim()) {
    return NextResponse.json(
      { error: "Name, department, and email are required." },
      { status: 400 }
    );
  }

  const { data, error } = await supabase
    .from("research_advisers")
    .insert({ full_name: full_name.trim(), department: department.trim(), email: email.trim() })
    .select("id")
    .single();

  if (error) {
    const isDuplicate = error.message.includes("unique") || error.message.includes("email");
    return NextResponse.json(
      { error: isDuplicate ? "An adviser with that email already exists." : error.message },
      { status: 500 }
    );
  }

  return NextResponse.json({ id: data.id });
}