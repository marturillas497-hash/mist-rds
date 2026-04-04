// app/dashboard/page.js

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { getRiskStyle, formatDate } from "@/lib/helpers";
import Navbar from "@/components/Navbar";

export default function DashboardPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [user, setUser]           = useState(null);
  const [profile, setProfile]     = useState(null);
  const [advisers, setAdvisers]   = useState([]);
  const [adviserId, setAdviserId] = useState("");
  const [saving, setSaving]       = useState(false);
  const [saveMsg, setSaveMsg]     = useState("");
  const [reports, setReports]     = useState([]);
  const [loading, setLoading]     = useState(true);

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) { router.replace("/login"); return; }
      setUser(data.user);
      fetchAll(data.user.id);
    });
  }, []);

  async function fetchAll(userId) {
    const [{ data: p }, { data: reps }] = await Promise.all([
      supabase.from("profiles").select("*").eq("id", userId).single(),
      supabase
        .from("similarity_reports")
        .select("id, input_title, similarity_score, risk_level, created_at")
        .eq("student_id", userId)
        .order("created_at", { ascending: false }),
    ]);

    if (p) {
      setProfile(p);
      setAdviserId(p.adviser_id ?? "");
      const { data: advList } = await supabase
        .from("research_advisers")
        .select("id, full_name")
        .eq("department", p.department)
        .order("full_name");
      setAdvisers(advList ?? []);
    }

    setReports(reps ?? []);
    setLoading(false);
  }

  async function saveAdviser() {
    setSaving(true);
    setSaveMsg("");
    const res = await fetch("/api/profile", {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ adviser_id: adviserId || null }),
    });
    setSaving(false);
    setSaveMsg(res.ok ? "Saved." : "Failed to save. Try again.");
  }

  function initials(name = "") {
    return name.split(" ").map((w) => w[0]).join("").slice(0, 2).toUpperCase();
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
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex gap-6 items-start">

          {/* ── Profile card ── */}
          {profile && (
            <aside className="w-72 shrink-0 bg-white border border-gray-200 rounded-xl shadow-sm p-5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full bg-blue-100 flex items-center justify-center text-blue-800 font-semibold text-sm">
                  {initials(profile.full_name)}
                </div>
                <div className="min-w-0">
                  <p className="font-semibold text-gray-900 text-sm truncate">{profile.full_name}</p>
                  <p className="text-xs text-gray-400">{profile.department}</p>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4 space-y-2 text-sm">
                <div className="flex justify-between">
                  <span className="text-gray-400">Year level</span>
                  <span className="text-gray-700 font-medium">{profile.year_level ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Section</span>
                  <span className="text-gray-700 font-medium">{profile.section ?? "—"}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-gray-400">Student ID</span>
                  <span className="text-gray-700 font-medium">{profile.student_id ?? "—"}</span>
                </div>
              </div>

              <div className="border-t border-gray-100 pt-4">
                <p className="text-xs text-gray-400 mb-1.5">Research adviser</p>
                {advisers.length === 0 ? (
                  <p className="text-xs text-gray-400 italic">No advisers for your department.</p>
                ) : (
                  <>
                    <select
                      value={adviserId}
                      onChange={(e) => { setAdviserId(e.target.value); setSaveMsg(""); }}
                      className="w-full text-sm border border-gray-200 rounded-lg px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-300"
                    >
                      <option value="">— Not assigned —</option>
                      {advisers.map((a) => (
                        <option key={a.id} value={a.id}>{a.full_name}</option>
                      ))}
                    </select>
                    <button
                      onClick={saveAdviser}
                      disabled={saving}
                      className="mt-2 w-full text-sm bg-blue-700 text-white px-4 py-2 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
                    >
                      {saving ? "Saving…" : "Save adviser"}
                    </button>
                    {saveMsg && <p className="text-xs text-gray-400 mt-1">{saveMsg}</p>}
                  </>
                )}
              </div>
            </aside>
          )}

          {/* ── Submissions list ── */}
          <div className="flex-1 min-w-0">
            <div className="flex items-center justify-between mb-8">
              <div>
                <h1 className="text-2xl font-bold text-gray-900">My Submissions</h1>
                <p className="text-gray-500 text-sm mt-1">
                  {reports.length} similarity check{reports.length !== 1 ? "s" : ""} submitted
                </p>
              </div>
              <Link
                href="/submit"
                className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
              >
                + Check Again
              </Link>
            </div>

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

        </div>
      </div>
    </main>
  );
}