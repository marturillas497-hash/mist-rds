// lib/api-auth.js
// Reusable auth helpers for API route protection

import { createClient } from "@supabase/supabase-js";
import { NextResponse } from "next/server";

// Service-role client for admin checks
const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL,
  process.env.SUPABASE_SERVICE_ROLE_KEY
);

/**
 * Extracts the Bearer token from the Authorization header.
 */
function getToken(req) {
  const auth = req.headers.get("authorization") ?? "";
  return auth.startsWith("Bearer ") ? auth.slice(7) : null;
}

/**
 * Returns the authenticated user from the request, or null.
 */
export async function getUser(req) {
  const token = getToken(req);
  if (!token) return null;

  const { data, error } = await supabase.auth.getUser(token);
  if (error || !data?.user) return null;
  return data.user;
}

/**
 * Returns the user's profile role, or null.
 */
export async function getUserRole(userId) {
  const { data } = await supabase
    .from("profiles")
    .select("role")
    .eq("id", userId)
    .single();
  return data?.role ?? null;
}

/**
 * Guards a route to authenticated users only.
 * Returns a 401 response if not authenticated, otherwise returns the user.
 */
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

/**
 * Guards a route to admin users only.
 * Returns a 401/403 response if not authenticated or not an admin.
 */
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