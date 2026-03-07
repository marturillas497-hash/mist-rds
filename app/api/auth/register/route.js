// app/api/auth/register/route.js

import { NextResponse } from "next/server";
import { createClient } from "@supabase/supabase-js";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

export async function POST(req) {
  try {
    const { email, password, full_name, department, year_level, section, student_id } = await req.json();

    if (!email?.trim() || !password?.trim() || !full_name?.trim()) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    // 1. Create auth user
    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email:         email.trim(),
      password,
      email_confirm: true,
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    // 2. Create profile row with all student info
    const { error: profileError } = await supabase.from("profiles").insert({
      id:         data.user.id,
      role:       "student",
      full_name:  full_name.trim(),
      department: department  || null,
      year_level: year_level  || null,
      section:    section     || null,
      student_id: student_id  || null,
    });

    if (profileError) {
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}