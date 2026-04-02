// components/Navbar.js
"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

const PROFILE_CACHE_KEY = "mist_profile_cache";

function getCachedProfile() {
  try {
    const raw = sessionStorage.getItem(PROFILE_CACHE_KEY);
    return raw ? JSON.parse(raw) : null;
  } catch { return null; }
}

function setCachedProfile(profile) {
  try {
    sessionStorage.setItem(PROFILE_CACHE_KEY, JSON.stringify(profile));
  } catch {}
}

function clearCachedProfile() {
  try {
    sessionStorage.removeItem(PROFILE_CACHE_KEY);
  } catch {}
}

export default function Navbar() {
  const router   = useRouter();
  const pathname = usePathname();
  const supabase = createClient();

  const [user, setUser]       = useState(null);
  const [role, setRole]       = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(async ({ data }) => {
      if (!data.user) {
        clearCachedProfile();
        setLoading(false);
        return;
      }

      setUser(data.user);

      // Return cached role if available — skip the DB query
      const cached = getCachedProfile();
      if (cached?.userId === data.user.id) {
        setRole(cached.role);
        setLoading(false);
        return;
      }

      // Cache miss — fetch from DB and store
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const role = profile?.role ?? null;
      setRole(role);
      setCachedProfile({ userId: data.user.id, role });
      setLoading(false);
    });
  }, [pathname]);

  async function handleLogout() {
    clearCachedProfile();
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-blue-700 font-bold text-lg tracking-tight">
        📚 Capstone Library
      </Link>

      <div className="flex gap-4 items-center">
        <Link href="/library" className="text-sm text-gray-600 hover:text-blue-700 transition">
          Browse Library
        </Link>

        {!loading && (
          <>
            {user && role === "admin" && (
              <Link href="/admin" className="text-sm text-gray-600 hover:text-blue-700 transition">
                Admin Panel
              </Link>
            )}

            {user && role === "student" && (
              <>
                <Link href="/dashboard" className="text-sm text-gray-600 hover:text-blue-700 transition">
                  My Dashboard
                </Link>
                <Link href="/submit" className="text-sm text-gray-600 hover:text-blue-700 transition">
                  Check Idea
                </Link>
              </>
            )}

            {user ? (
              <button
                onClick={handleLogout}
                className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition"
              >
                Logout
              </button>
            ) : (
              <>
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-700 transition">
                  Login
                </Link>
                <Link href="/login" className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition">
                  Register
                </Link>
              </>
            )}
          </>
        )}
      </div>
    </nav>
  );
}