// app/submit/page.js

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DAILY_LIMIT } from "@/lib/constants";
import Navbar from "@/components/Navbar";

export default function SubmitPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [user, setUser]               = useState(null);
  const [authLoading, setAuthLoading] = useState(true);
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");
  const [remaining, setRemaining]     = useState(null); // null = not yet fetched

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (!data.user) {
        router.replace("/login");
      } else {
        setUser(data.user);
        setAuthLoading(false);
        fetchRemaining(data.user);
      }
    });
  }, []);

  async function fetchRemaining(u) {
    try {
      const { data: { session } } = await supabase.auth.getSession();

      // Fetch today's report count directly from Supabase
      const startOfDay = new Date();
      startOfDay.setUTCHours(0, 0, 0, 0);

      const { count } = await supabase
        .from("similarity_reports")
        .select("id", { count: "exact", head: true })
        .eq("student_id", (u ?? user).id)
        .gte("created_at", startOfDay.toISOString());

      // Also check if admin (admins have no limit)
      const { data: profile } = await supabase
        .from("profiles")
        .select("role")
        .eq("id", (u ?? user).id)
        .single();

      if (profile?.role === "admin") {
        setRemaining(Infinity);
      } else {
        setRemaining(Math.max(0, DAILY_LIMIT - (count ?? 0)));
      }
    } catch {
      setRemaining(null); // fail silently — don't block the page
    }
  }

  async function handleSubmit() {
    if (!title.trim() || !description.trim()) {
      setError("Both fields are required.");
      return;
    }
    if (title.length > 200) {
      setError("Title must be under 200 characters.");
      return;
    }
    if (description.length > 1000) {
      setError("Description must be under 1000 characters.");
      return;
    }

    setError("");
    setLoading(true);

    try {
      const { data: { session } } = await supabase.auth.getSession();

      const res = await fetch("/api/analyze", {
        method:  "POST",
        headers: {
          "Content-Type":  "application/json",
          "Authorization": `Bearer ${session.access_token}`,
        },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();
      if (!res.ok) throw new Error(data.error || "Analysis failed.");

      router.push(`/dashboard/${data.reportId}`);

    } catch (err) {
      setError(err.message);
      // Refresh remaining count in case it was a rate limit error
      fetchRemaining();
    } finally {
      setLoading(false);
    }
  }

  const isLimitReached = remaining === 0;

  if (authLoading) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Check Your Research Idea</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your proposed title and description to check for similarity with existing studies.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

          {/* Daily limit indicator */}
          {remaining !== null && remaining !== Infinity && (
            <div className={`flex items-center justify-between text-xs font-medium rounded-lg px-4 py-2.5 mb-6 ${
              isLimitReached
                ? "bg-red-50 border border-red-200 text-red-600"
                : remaining <= 2
                ? "bg-yellow-50 border border-yellow-200 text-yellow-700"
                : "bg-blue-50 border border-blue-200 text-blue-700"
            }`}>
              <span>
                {isLimitReached
                  ? "You've reached your daily limit. Come back tomorrow."
                  : `${remaining} of ${DAILY_LIMIT} checks remaining today`}
              </span>
              {/* Pip indicators */}
              {!isLimitReached && (
                <div className="flex gap-1">
                  {Array.from({ length: DAILY_LIMIT }).map((_, i) => (
                    <div
                      key={i}
                      className={`w-2 h-2 rounded-full ${
                        i < remaining ? "bg-blue-500" : "bg-blue-200"
                      }`}
                    />
                  ))}
                </div>
              )}
            </div>
          )}

          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mobile Attendance System Using Face Recognition"
              disabled={isLimitReached}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:bg-gray-50 disabled:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</p>
          </div>

          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your research idea, objectives, and methodology..."
              rows={5}
              disabled={isLimitReached}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none disabled:bg-gray-50 disabled:text-gray-400"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading || isLimitReached}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing... this may take a few seconds" : "Check Originality"}
          </button>

        </div>
      </div>
    </main>
  );
}