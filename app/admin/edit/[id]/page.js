//capstone-library app/admin/edit/[id]/page.js

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter, useParams } from "next/navigation";
import { DEPARTMENTS } from "@/lib/constants";

export default function EditAbstractPage() {
  const router = useRouter();
  const { id } = useParams();

  const [loading, setLoading]   = useState(true);
  const [saving, setSaving]     = useState(false);
  const [error, setError]       = useState("");
  const [notFound, setNotFound] = useState(false);
  const [form, setForm]         = useState({
    title: "", abstract_text: "", authors: "",
    year: "", department: "", keywords: "",
  });

  useEffect(() => {
    if (!id) return;
    fetchAbstract();
  }, [id]);

  async function fetchAbstract() {
    setLoading(true);
    const res = await fetch(`/api/abstracts/${id}`);

    if (res.status === 404) {
      setNotFound(true);
      setLoading(false);
      return;
    }

    const data = await res.json();
    const a = data.abstract ?? data; // handle either shape

    setForm({
      title:         a.title         ?? "",
      abstract_text: a.abstract_text ?? "",
      authors:       a.authors       ?? "",
      year:          a.year          ?? "",
      department:    a.department    ?? "",
      keywords:      a.keywords      ?? "",
    });
    setLoading(false);
  }

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    if (!form.title.trim() || !form.abstract_text.trim()) {
      setError("Title and abstract text are required.");
      return;
    }
    setError("");
    setSaving(true);

    const res = await fetch(`/api/abstracts/${id}`, {
      method: "PATCH",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Something went wrong.");
      setSaving(false);
      return;
    }

    router.push("/admin");
  }

  /* ── Loading state ── */
  if (loading) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Nav />
        <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
      </main>
    );
  }

  /* ── Not found state ── */
  if (notFound) {
    return (
      <main className="min-h-screen bg-gray-50">
        <Nav />
        <div className="max-w-2xl mx-auto px-6 py-20 text-center">
          <p className="text-gray-500 text-sm mb-4">Abstract not found.</p>
          <Link href="/admin" className="text-blue-600 hover:underline text-sm">
            ← Back to Dashboard
          </Link>
        </div>
      </main>
    );
  }

  /* ── Edit form ── */
  return (
    <main className="min-h-screen bg-gray-50">
      <Nav />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Edit Abstract</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Title <span className="text-red-500">*</span>
            </label>
            <input
              name="title" value={form.title} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="Research title"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Authors</label>
            <input
              name="authors" value={form.authors} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Juan Dela Cruz, Maria Santos"
            />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
              <select
                name="department" value={form.department} onChange={handleChange}
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                <option value="">Select department</option>
                {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
              </select>
            </div>
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Year</label>
              <input
                name="year" value={form.year} onChange={handleChange} type="number"
                className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                placeholder="e.g. 2024"
              />
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Keywords</label>
            <input
              name="keywords" value={form.keywords} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. machine learning, attendance, face recognition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Abstract Text <span className="text-red-500">*</span>
            </label>
            <textarea
              name="abstract_text" value={form.abstract_text} onChange={handleChange} rows={6}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
              placeholder="Full abstract text..."
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              onClick={handleSubmit} disabled={saving}
              className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
            >
              {saving ? "Saving..." : "Save Changes"}
            </button>
            <Link
              href="/admin"
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition text-center"
            >
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}

/* Shared navbar — matches admin/page.js and admin/add/page.js exactly */
function Nav() {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <span className="text-blue-700 font-bold text-lg tracking-tight">
        📚 Capstone Library — Admin
      </span>
      <Link href="/admin" className="text-sm text-gray-500 hover:text-blue-700 transition">
        ← Back to Dashboard
      </Link>
    </nav>
  );
}