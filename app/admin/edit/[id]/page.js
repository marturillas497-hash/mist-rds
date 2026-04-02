"use client";
// app/admin/edit/[id]/page.js

import { useState, useEffect } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";
import AdminNavbar from "@/components/AdminNavbar";

export default function EditAbstractPage({ params }) {
  const router   = useRouter();
  const supabase = createClient();
  const [loading, setLoading]   = useState(false);
  const [fetching, setFetching] = useState(true);
  const [error, setError]       = useState("");
  const [abstractId, setAbstractId] = useState(null);
  const [form, setForm]         = useState({
    title: "", abstract_text: "", authors: "",
    year: "", department: "", keywords: "",
  });

  useEffect(() => {
    async function loadAbstract() {
      const { id } = await params;
      setAbstractId(id);

      const res  = await fetch(`/api/abstracts/${id}`);
      const data = await res.json();

      if (data.abstract) {
        setForm({
          title:         data.abstract.title         ?? "",
          abstract_text: data.abstract.abstract_text ?? "",
          authors:       data.abstract.authors       ?? "",
          year:          data.abstract.year          ?? "",
          department:    data.abstract.department    ?? "",
          keywords:      data.abstract.keywords      ?? "",
        });
      }
      setFetching(false);
    }
    loadAbstract();
  }, [params]);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.abstract_text.trim()) {
      setError("Title and abstract text are required.");
      return;
    }
    setError("");
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch(`/api/abstracts/${abstractId}`, {
      method:  "PATCH",
      headers: {
        "Content-Type": "application/json",
        "Authorization": `Bearer ${session.access_token}`,
      },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setLoading(false);
      return;
    }

    router.push("/admin");
  }

  if (fetching) {
    return (
      <main className="min-h-screen bg-gray-50 flex items-center justify-center">
        <p className="text-gray-400 text-sm">Loading abstract...</p>
      </main>
    );
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <AdminNavbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Abstract</h1>

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
              {loading ? "Saving..." : "Save Changes"}
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