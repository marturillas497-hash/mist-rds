// app/library/page.js

"use client";

import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";
import Navbar from "@/components/Navbar";

// Queries with more than 3 words are treated as semantic searches
const SEMANTIC_THRESHOLD = 3;

export default function LibraryPage() {
  const supabase = createClient();

  const [abstracts, setAbstracts]           = useState([]);
  const [loading, setLoading]               = useState(true);
  const [search, setSearch]                 = useState("");
  const [dept, setDept]                     = useState("");
  const [year, setYear]                     = useState("");
  const [isSemanticMode, setIsSemanticMode] = useState(false);

  const debounceRef = useRef(null);

  useEffect(() => {
    // Debounce — wait 500ms after user stops typing before searching
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      const wordCount = search.trim().split(/\s+/).filter(Boolean).length;
      const semantic  = wordCount > SEMANTIC_THRESHOLD;
      setIsSemanticMode(semantic && search.trim().length > 0);

      if (semantic && search.trim().length > 0) {
        fetchSemantic();
      } else {
        fetchKeyword();
      }
    }, 500);

    return () => clearTimeout(debounceRef.current);
  }, [search, dept, year]);

  // ── Keyword search (existing behaviour) ───────────────────────────────────
  async function fetchKeyword() {
    setLoading(true);

    let query = supabase
      .from("abstracts")
      .select("id, title, authors, department, year, keywords")
      .order("created_at", { ascending: false });

    if (dept)          query = query.eq("department", dept);
    if (year)          query = query.eq("year", parseInt(year));
    if (search.trim()) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;
    if (error) console.error("Fetch error:", error.message);
    else setAbstracts(data ?? []);

    setLoading(false);
  }

  // ── Semantic search ────────────────────────────────────────────────────────
  async function fetchSemantic() {
    setLoading(true);

    const params = new URLSearchParams({ q: search.trim() });
    if (dept) params.set("dept", dept);
    if (year) params.set("year", year);

    const res  = await fetch(`/api/search?${params}`);
    const data = await res.json();

    if (!res.ok) console.error("Semantic search error:", data.error);
    else setAbstracts(data.results ?? []);

    setLoading(false);
  }

  function clearFilters() {
    setSearch("");
    setDept("");
    setYear("");
    setIsSemanticMode(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />

      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Abstract Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse existing capstone and thesis abstracts.
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <div className="flex-1 relative">
            <input
              type="text"
              placeholder="Search by title or describe a topic..."
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              className="w-full border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            {/* Semantic mode badge */}
            {isSemanticMode && (
              <span className="absolute right-2 top-1/2 -translate-y-1/2 text-xs bg-blue-100 text-blue-700 font-medium px-2 py-0.5 rounded-full">
                ✦ Semantic
              </span>
            )}
          </div>
          <select
            value={dept}
            onChange={(e) => setDept(e.target.value)}
            className="border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Departments</option>
            {DEPARTMENTS.map((d) => (
              <option key={d} value={d}>{d}</option>
            ))}
          </select>
          <input
            type="number"
            placeholder="Year (e.g. 2024)"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            className="w-36 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={clearFilters}
            className="text-sm text-gray-500 hover:text-red-500 transition whitespace-nowrap"
          >
            Clear filters
          </button>
        </div>

        {/* Semantic search hint */}
        {isSemanticMode && (
          <p className="text-xs text-blue-600 mb-4 -mt-2">
            Showing semantically similar results for &ldquo;{search}&rdquo;
          </p>
        )}

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">
            {isSemanticMode ? "Running semantic search..." : "Loading abstracts..."}
          </div>
        ) : abstracts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No abstracts found.</div>
        ) : (
          <div className="grid gap-4">
            {abstracts.map((a) => (
              <Link
                key={a.id}
                href={`/library/${a.id}`}
                className="bg-white border border-gray-200 rounded-xl p-5 hover:border-blue-400 hover:shadow-sm transition block"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex-1">
                    <h2 className="font-semibold text-gray-900 mb-1">{a.title}</h2>
                    <p className="text-sm text-gray-500">
                      {a.authors    && <span>{a.authors} · </span>}
                      {a.department && <span className="text-blue-600 font-medium">{a.department}</span>}
                      {a.year       && <span> · {a.year}</span>}
                    </p>
                    {a.keywords && (
                      <p className="text-xs text-gray-400 mt-2">🏷 {a.keywords}</p>
                    )}
                  </div>
                  <div className="flex flex-col items-end gap-1">
                    {isSemanticMode && a.similarity !== undefined && (
                      <span className="text-xs bg-blue-50 text-blue-600 font-semibold px-2 py-0.5 rounded-full">
                        {a.similarity}% match
                      </span>
                    )}
                    <span className="text-gray-300 text-xl">→</span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}