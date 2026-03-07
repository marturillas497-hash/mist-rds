// app/dashboard/[id]/page.js (report page)

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { RISK_COLORS } from "@/lib/constants";

export default function ReportDetailPage() {
  const router   = useRouter();
  const { id }   = useParams();
  const supabase = createClient();

  const [report, setReport]   = useState(null);
  const [loading, setLoading] = useState(true);
  const [notFound, setNotFound] = useState(false);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      fetchReport(data.user.id);
    });
  }, [id]);

  async function fetchReport(userId) {
    const { data, error } = await supabase
      .from("similarity_reports")
      .select("*")
      .eq("id", id)
      .eq("student_id", userId) // ensure students can only see their own
      .single();

    if (error || !data) { setNotFound(true); setLoading(false); return; }
    setReport(data);
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
      year: "numeric", month: "long", day: "numeric",
      hour: "2-digit", minute: "2-digit",
    });
  }

  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    );
  }

  if (notFound) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Navbar onLogout={handleLogout} />
        <div className="max-w-3xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-500 text-sm mb-4">Report not found.</p>
          <Link href="/dashboard" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  const style     = getRiskStyle(report.risk_level);
  const topMatches = report.results_json ?? [];

  return (
    <main className="min-h-screen bg-gray-50">
      <Navbar onLogout={handleLogout} />

      <div className="max-w-3xl mx-auto px-6 py-10">

        {/* BACK */}
        <Link href="/dashboard" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Back to My Submissions
        </Link>

        {/* TITLE + DATE */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">{report.input_title}</h1>
          <p className="text-gray-400 text-sm mt-1">Submitted on {formatDate(report.created_at)}</p>
        </div>

        {/* SCORE CARD */}
        <div className={`rounded-xl border p-6 mb-6 ${style.bg} border-transparent`}>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-500 mb-1">
                Similarity Score
              </p>
              <p className={`text-4xl font-bold ${style.text}`}>
                {report.similarity_score}%
              </p>
            </div>
            <span className={`text-sm font-semibold px-4 py-2 rounded-full bg-white ${style.text} shadow-sm`}>
              {style.label}
            </span>
          </div>
        </div>

        {/* DESCRIPTION */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
          <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
            Your Description
          </h2>
          <p className="text-gray-700 text-sm leading-relaxed">{report.input_description}</p>
        </div>

        {/* TOP MATCHES */}
        {topMatches.length > 0 && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              Top Similar Studies
            </h2>
            <div className="space-y-3">
              {topMatches.map((m, i) => {
                const matchStyle = getRiskStyle(m.color);
                return (
                  <div key={i} className="flex items-start justify-between gap-4 py-3 border-b border-gray-100 last:border-0">
                    <div className="flex-1 min-w-0">
                      <Link
                        href={`/library/${m.id}`}
                        className="text-sm font-medium text-gray-800 hover:text-blue-700 transition line-clamp-2"
                      >
                        {m.title}
                      </Link>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.department} · {m.year}
                      </p>
                    </div>
                    <div className="flex items-center gap-2 shrink-0">
                      <span className="text-sm font-bold text-gray-700">{m.similarity_percent}%</span>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${matchStyle.bg} ${matchStyle.text}`}>
                        {matchStyle.label}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* AI RECOMMENDATIONS */}
        {report.ai_recommendations && (
          <div className="bg-white border border-gray-200 rounded-xl p-6 shadow-sm">
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-4">
              AI Recommendations
            </h2>
            <div className="text-gray-700 text-sm leading-relaxed whitespace-pre-line">
              {report.ai_recommendations}
            </div>
          </div>
        )}

        {/* CHECK AGAIN */}
        <div className="mt-8 text-center">
          <Link
            href="/submit"
            className="inline-block bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Check Another Idea
          </Link>
        </div>

      </div>
    </main>
  );
}

function Navbar({ onLogout }) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <Link href="/" className="text-blue-700 font-bold text-lg tracking-tight">
        📚 Capstone Library
      </Link>
      <div className="flex gap-4 items-center">
        <Link href="/library" className="text-sm text-gray-600 hover:text-blue-700 transition">
          Browse Library
        </Link>
        <button
          onClick={onLogout}
          className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition"
        >
          Logout
        </button>
      </div>
    </nav>
  );
}