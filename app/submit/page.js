"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";

export default function SubmitPage() {
  const router = useRouter();
  const [title, setTitle]             = useState("");
  const [description, setDescription] = useState("");
  const [loading, setLoading]         = useState(false);
  const [error, setError]             = useState("");

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
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ title, description }),
      });

      const data = await res.json();

      if (!res.ok) throw new Error(data.error || "Analysis failed.");

      // Store result in sessionStorage and redirect to report page
      sessionStorage.setItem("report", JSON.stringify(data));
      router.push("/report");

    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-700 font-bold text-lg tracking-tight">
          📚 Capstone Library
        </Link>
        <div className="flex gap-4">
          <Link href="/library" className="text-sm text-gray-600 hover:text-blue-700 transition">
            Browse Library
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-blue-700 transition">
            Login
          </Link>
          <Link href="/register" className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition">
            Register
          </Link>
        </div>
      </nav>

      <div className="max-w-2xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Check Your Research Idea</h1>
          <p className="text-gray-500 text-sm mt-1">
            Enter your proposed title and description to check for similarity with existing studies.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

          {/* TITLE */}
          <div className="mb-5">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Proposed Title
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="e.g. Mobile Attendance System Using Face Recognition"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{title.length}/200</p>
          </div>

          {/* DESCRIPTION */}
          <div className="mb-6">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Research Description
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Briefly describe your research idea, objectives, and methodology..."
              rows={5}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            />
            <p className="text-xs text-gray-400 mt-1 text-right">{description.length}/1000</p>
          </div>

          {/* ERROR */}
          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3 mb-4">
              {error}
            </div>
          )}

          {/* SUBMIT */}
          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? "Analyzing... this may take a few seconds" : "Check Originality"}
          </button>

        </div>
      </div>
    </main>
  );
}