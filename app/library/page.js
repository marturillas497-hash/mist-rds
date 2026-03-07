// app/library/page.js

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";

export default function LibraryPage() {
  const supabase = createClient();

  const [abstracts, setAbstracts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [search, setSearch]       = useState("");
  const [dept, setDept]           = useState("");
  const [year, setYear]           = useState("");

  useEffect(() => {
    fetchAbstracts();
  }, [search, dept, year]);

  async function fetchAbstracts() {
    setLoading(true);

    let query = supabase
      .from("abstracts")
      .select("id, title, authors, department, year, keywords")
      .order("created_at", { ascending: false });

    if (dept)   query = query.eq("department", dept);
    if (year)   query = query.eq("year", parseInt(year));
    if (search) query = query.ilike("title", `%${search}%`);

    const { data, error } = await query;

    if (error) console.error("Fetch error:", error.message);
    else setAbstracts(data ?? []);

    setLoading(false);
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-700 font-bold text-lg tracking-tight">
          📚 Capstone Library
        </Link>
        <div className="flex gap-4">
          <Link href="/library" className="text-sm text-blue-700 font-semibold">
            Browse Library
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-blue-700 transition">
            Login
          </Link>
          <Link href="/login" className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition">
            Register
          </Link>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        {/* HEADER */}
        <div className="mb-8">
          <h1 className="text-2xl font-bold text-gray-900">Abstract Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            Browse existing capstone and thesis abstracts.
          </p>
        </div>

        {/* FILTERS */}
        <div className="bg-white border border-gray-200 rounded-xl p-4 mb-6 flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by title..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 border border-gray-300 rounded-lg px-3 py-2 text-sm text-gray-900 placeholder-gray-400 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
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
            onClick={() => { setSearch(""); setDept(""); setYear(""); }}
            className="text-sm text-gray-500 hover:text-red-500 transition whitespace-nowrap"
          >
            Clear filters
          </button>
        </div>

        {/* RESULTS */}
        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading abstracts...</div>
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
                      {a.authors && <span>{a.authors} · </span>}
                      {a.department && <span className="text-blue-600 font-medium">{a.department}</span>}
                      {a.year && <span> · {a.year}</span>}
                    </p>
                    {a.keywords && (
                      <p className="text-xs text-gray-400 mt-2">🏷 {a.keywords}</p>
                    )}
                  </div>
                  <span className="text-gray-300 text-xl">→</span>
                </div>
              </Link>
            ))}
          </div>
        )}

      </div>
    </main>
  );
}