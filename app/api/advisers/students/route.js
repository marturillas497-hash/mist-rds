// app/api/advisers/students/route.js

import { NextResponse } from "next/server";
import { createServerClient } from "@supabase/ssr";
import { cookies } from "next/headers";

export async function GET() {
  const cookieStore = cookies();
  const supabase = createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL,
    process.env.NEXT_PUBLIC_SUPABASE_KEY,
    {
      cookies: {
        getAll() { return cookieStore.getAll(); },
      },
    }
  );

  // 1. Get the current logged-in user (the Adviser)
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  
  if (authError || !user) {
    return NextResponse.json({ error: "Unauthorized access" }, { status: 401 });
  }

  // 2. Fetch students who have THIS user's ID as their adviser_id
  // We also pull their latest submission to show progress on the dashboard
  const { data: students, error: dbError } = await supabase
    .from("profiles")
    .select(`
      id,
      full_name,
      student_id,
      department,
      section,
      year_level,
      submissions (
        id,
        title,
        similarity_score,
        created_at
      )
    `)
    .eq("adviser_id", user.id) // The core of the migration logic
    .eq("role", "student")
    .order("full_name", { ascending: true });

  if (dbError) {
    return NextResponse.json({ error: dbError.message }, { status: 500 });
  }

  return NextResponse.json({ students: students ?? [] });
}