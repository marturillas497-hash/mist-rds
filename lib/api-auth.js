// lib/api-auth.js
// Reusable auth helpers for API route protection

import { NextResponse } from "next/server";
import { supabase } from "@/lib/supabase/service";

function getToken(req) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

export async function getUser(req) {
  const token = getToken(req);
  if (!token) return null;
  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

export async function getUserRole(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? null;
}

export async function requireAuth(req) {
  const user = await getUser(req);
  if (!user) {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Unauthorized. Please log in." },
        { status: 401 }
      ),
    };
  }
  return { user, error: null };
}

export async function requireAdmin(req) {
  const { user, error } = await requireAuth(req);
  if (error) return { user: null, error };
  const role = await getUserRole(user.id);
  if (role !== "admin") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Forbidden. Admin access required." },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}

export async function requireAdviser(req) {
  const { user, error } = await requireAuth(req);
  if (error) return { user: null, error };
  const role = await getUserRole(user.id);
  if (role !== "research_adviser") {
    return {
      user: null,
      error: NextResponse.json(
        { error: "Forbidden. Research adviser access required." },
        { status: 403 }
      ),
    };
  }
  return { user, error: null };
}