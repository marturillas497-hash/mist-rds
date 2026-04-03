// app/admin/add/page.js

"use client";

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";
import AdminNavbar from "@/components/AdminNavbar";

export default function AddAbstractPage() {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading]       = useState(false);
  const [error, setError]           = useState("");
  const [lastAccession, setLastAccession] = useState(null);
  const [form, setForm]             = useState({
    title: "", abstract_text: "", authors: "",
    year: "", department: "", keywords: "", accession_id: "",
  });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  // ── Fetch last accession ID when dept or year changes ────────────────────
  useEffect(() => {
    if (!form.department || !form.year) {
      setLastAccession(null);
      return;
    }

    async function fetchLastAccession() {
      const { data } = await supabase
        .from("abstracts")
        .select("accession_id")
        .eq("department", form.department)
        .eq("year", parseInt(form.year))
        .not("accession_id", "is", null)
        .order("accession_id", { ascending: false })
        .limit(1)
        .single();

      setLastAccession(data?.accession_id ?? null);
    }

    fetchLastAccession();
  }, [form.department, form.year]);

  async function handleSubmit() {
    if (!form.title.trim() || !form.abstract_text.trim()) {
      setError("Title and abstract text are required.");
      return;
    }
    setError("");
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch("/api/abstracts", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      const isDuplicate = data.error?.includes("unique") || data.error?.includes("accession_id");
      setError(isDuplicate
        ? `Accession ID "${form.accession_id}" is already in use. Check the last used ID above and enter the next one.`
        : data.error ?? "Something went wrong."
      );
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <AdminNavbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Add Abstract</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Title <span className="text-red-500">*</span></label>
            <input name="title" value={form.title} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Research title" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
            <input name="authors" value={form.authors} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Juan Dela Cruz, Maria Santos" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select name="department" value={form.department} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input name="year" value={form.year} onChange={handleChange} type="number"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2024" />
            </div>
          </div>

          <div>
            <div className="flex items-center justify-between mb-1">
              <label className="block text-sm font-medium text-gray-700">Accession ID</label>
              {lastAccession && (
                <span className="text-xs text-gray-400">
                  Last used: <span className="font-mono text-gray-500">{lastAccession}</span>
                </span>
              )}
              {form.department && form.year && !lastAccession && (
                <span className="text-xs text-gray-400">
                  No entries yet for {form.department} {form.year} — start at{" "}
                  <span className="font-mono text-gray-500">{form.department}-{form.year}-001</span>
                </span>
              )}
            </div>
            <input name="accession_id" value={form.accession_id} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. BSIS-2024-003" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input name="keywords" value={form.keywords} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. machine learning, attendance, face recognition" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Abstract Text <span className="text-red-500">*</span></label>
            <textarea name="abstract_text" value={form.abstract_text} onChange={handleChange} rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Full abstract text..." />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save Abstract"}
            </button>
            <Link href="/admin"
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition text-center">
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}