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
        setUser(null);
        setRole(null);
        setLoading(false);
        return;
      }

      setUser(data.user);

      // 1. Check Session Storage Cache first to prevent flickering
      const cached = getCachedProfile();
      if (cached?.userId === data.user.id) {
        setRole(cached.role);
        setLoading(false);
        return;
      }

      // 2. Cache miss — Fetch role from DB
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", data.user.id)
        .single();

      const userRole = profile?.role ?? null;
      setRole(userRole);
      setCachedProfile({ userId: data.user.id, role: userRole });
      setLoading(false);
    });
  }, [pathname, supabase]);

  async function handleLogout() {
    clearCachedProfile();
    await supabase.auth.signOut();
    setUser(null);
    setRole(null);
    router.push("/login");
    router.refresh();
  }

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between shadow-sm">
      <div className="flex items-center gap-8">
        <Link href="/" className="text-blue-700 font-bold text-xl tracking-tight">
          📚 MIST RDS
        </Link>

        <div className="hidden md:flex gap-6 items-center">
          <Link href="/library" className="text-sm font-medium text-gray-600 hover:text-blue-700 transition">
            Browse Library
          </Link>

          {!loading && user && (
            <>
              {/* STUDENT NAVIGATION */}
              {role === "student" && (
                <>
                  <Link href="/dashboard" className="text-sm font-medium text-gray-600 hover:text-blue-700 transition">
                    My Dashboard
                  </Link>
                  <Link href="/submit" className="text-sm font-medium text-gray-600 hover:text-blue-700 transition">
                    Check Idea
                  </Link>
                </>
              )}

              {/* ADVISER NAVIGATION */}
              {role === "research_adviser" && (
                <Link href="/adviser" className="text-sm font-bold text-blue-600 hover:text-blue-800 transition">
                  Adviser Portal
                </Link>
              )}

              {/* ADMIN NAVIGATION */}
              {role === "admin" && (
                <Link href="/admin" className="text-sm font-medium text-purple-600 hover:text-purple-800 transition">
                  Admin Panel
                </Link>
              )}
            </>
          )}
        </div>
      </div>

      <div className="flex gap-4 items-center">
        {!loading && (
          <>
            {user ? (
              <div className="flex items-center gap-4">
                <span className="hidden lg:block text-xs text-gray-400 font-mono">
                  {role?.toUpperCase()}
                </span>
                <button
                  onClick={handleLogout}
                  className="text-sm bg-gray-100 text-gray-700 px-4 py-2 rounded-lg hover:bg-red-50 hover:text-red-600 transition font-medium"
                >
                  Logout
                </button>
              </div>
            ) : (
              <div className="flex items-center gap-2">
                <Link href="/login" className="text-sm text-gray-600 hover:text-blue-700 transition px-3 py-2">
                  Sign In
                </Link>
                <Link 
                  href="/login?mode=register" 
                  className="text-sm bg-blue-700 text-white px-5 py-2 rounded-lg hover:bg-blue-800 transition shadow-sm font-medium"
                >
                  Get Started
                </Link>
              </div>
            )}
          </>
        )}
      </div>
    </nav>
  );
}