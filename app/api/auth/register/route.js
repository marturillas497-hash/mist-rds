// app/api/auth/register/route.js

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service"; // Service role client

export async function POST(req) {
  try {
    const { 
      email, 
      password, 
      full_name, 
      role, // New: 'student' or 'research_adviser'
      department, 
      year_level, 
      section, 
      student_id, 
      adviser_id 
    } = await req.json();

    // Basic validation
    if (!email?.trim() || !password?.trim() || !full_name?.trim()) {
      return NextResponse.json(
        { error: "Email, password, and full name are required." },
        { status: 400 }
      );
    }

    // 1. Create auth user via Admin API
    const { data, error: signUpError } = await supabase.auth.admin.createUser({
      email: email.trim(),
      password: password,
      email_confirm: true, // Auto-confirm for capstone ease of use
      user_metadata: { full_name: full_name.trim(), role: role || "student" }
    });

    if (signUpError) {
      return NextResponse.json({ error: signUpError.message }, { status: 400 });
    }

    // 2. Prepare Profile Data
    const isAdviser = role === "research_adviser";
    
    const profileData = {
      id: data.user.id,
      email: email.trim(), // Storing email in profile for Admin/Adviser dashboard lists
      full_name: full_name.trim(),
      role: role || "student",
      department: department || null,
      // Advisers start as 'pending', students as 'active'
      status: isAdviser ? "pending" : "active", 
      // Student-only fields (null for advisers)
      year_level: isAdviser ? null : (year_level || null),
      section: isAdviser ? null : (section || null),
      student_id: isAdviser ? null : (student_id || null),
      adviser_id: isAdviser ? null : (adviser_id || null),
    };

    // 3. Insert into public.profiles
    const { error: profileError } = await supabase
      .from("profiles")
      .insert(profileData);

    if (profileError) {
      // Cleanup: If profile fails, delete the auth user to prevent "ghost" accounts
      await supabase.auth.admin.deleteUser(data.user.id);
      return NextResponse.json({ error: profileError.message }, { status: 500 });
    }

    return NextResponse.json({ 
      success: true, 
      status: profileData.status // Let frontend know if they are pending
    });

  } catch (err) {
    return NextResponse.json({ error: err.message }, { status: 500 });
  }
}