// app/dashboard/page.js

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RISK_COLORS } from "@/lib/constants";

export default function DashboardPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [user, setUser]           = useState(null);
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
        return;
      }
      setUser(data.user);
      fetchReports(data.user.id);
    });
  }, []);

  async function fetchReports(userId) {
    const { data, error } = await supabase
      .from("similarity_reports")
      .select("id, input_title, similarity_score, risk_level, created_at")
      .eq("student_id", userId)
      .order("created_at", { ascending: false });

    if (!error) setReports(data ?? []);
    setLoading(false);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  function getRiskStyle(risk_level) {
    const key = risk_level?.toUpperCase();
    return RISK_COLORS[key] ?? { bg: "bg-gray-100", text: "text-gray-600", label: risk_level };
  }

  function formatDate(iso) {
    return new Date(iso).toLocaleDateString("en-PH", {
      year: "numeric", month: "short", day: "numeric",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-700 font-bold text-lg tracking-tight">
          📚 Capstone Library
        </Link>
        <div className="flex gap-4 items-center">
          <Link href="/library" className="text-sm text-gray-600 hover:text-blue-700 transition">
            Browse Library
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-4xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
            <p className="text-gray-500 text-sm mt-1">{reports.length} similarity check{reports.length !== 1 ? "s" : ""} submitted</p>
          </div>
          <Link
            href="/submit"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
          >
            + Check Again
          </Link>
        </div>

        {/* EMPTY STATE */}
        {reports.length === 0 ? (
          <div className="bg-white border border-gray-200 rounded-xl p-16 text-center shadow-sm">
            <p className="text-4xl mb-4">🔍</p>
            <p className="text-gray-700 font-semibold mb-1">No submissions yet</p>
            <p className="text-gray-400 text-sm mb-6">Run your first similarity check to get started.</p>
            <Link
              href="/submit"
              className="bg-blue-700 text-white px-6 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
            >
              Check My Research Idea
            </Link>
          </div>
        ) : (
          <div className="space-y-3">
            {reports.map((r) => {
              const style = getRiskStyle(r.risk_level);
              return (
                <Link
                  key={r.id}
                  href={`/dashboard/${r.id}`}
                  className="bg-white border border-gray-200 rounded-xl px-6 py-5 flex items-center justify-between hover:border-blue-300 hover:shadow-sm transition group"
                >
                  <div className="flex-1 min-w-0 mr-6">
                    <p className="text-gray-900 font-semibold truncate group-hover:text-blue-700 transition">
                      {r.input_title}
                    </p>
                    <p className="text-gray-400 text-xs mt-1">{formatDate(r.created_at)}</p>
                  </div>
                  <div className="flex items-center gap-4 shrink-0">
                    <span className="text-sm font-bold text-gray-700">
                      {r.similarity_score}%
                    </span>
                    <span className={`text-xs font-semibold px-3 py-1 rounded-full ${style.bg} ${style.text}`}>
                      {style.label}
                    </span>
                    <span className="text-gray-300 group-hover:text-blue-400 transition text-sm">→</span>
                  </div>
                </Link>
              );
            })}
          </div>
        )}
      </div>
    </main>
  );
}