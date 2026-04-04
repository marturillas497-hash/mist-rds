// App/api/profile/route.js

import { createClient } from "@supabase/supabase-js";
import { requireAuth } from "@/lib/api-auth";

const supabaseAdmin = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function PATCH(req) {
  const authResult = await requireAuth(req);
  if (authResult.error) {
    return Response.json({ error: authResult.error }, { status: 401 });
  }

  const { adviser_id } = await req.json();

  if (adviser_id !== null && adviser_id !== undefined && typeof adviser_id !== "string") {
    return Response.json({ error: "Invalid adviser_id" }, { status: 400 });
  }

  if (adviser_id) {
    const [{ data: profile }, { data: adviser }] = await Promise.all([
      supabaseAdmin.from("profiles").select("department").eq("id", authResult.user.id).single(),
      supabaseAdmin.from("research_advisers").select("department").eq("id", adviser_id).single(),
    ]);

    if (!adviser) {
      return Response.json({ error: "Adviser not found" }, { status: 404 });
    }
    if (adviser.department !== profile?.department) {
      return Response.json({ error: "Adviser department does not match your department" }, { status: 400 });
    }
  }

  const { error } = await supabaseAdmin
    .from("profiles")
    .update({ adviser_id: adviser_id ?? null })
    .eq("id", authResult.user.id);

  if (error) {
    console.error("PATCH /api/profile:", error);
    return Response.json({ error: "Failed to update profile" }, { status: 500 });
  }

  return Response.json({ success: true });
}