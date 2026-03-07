// app/admin/page.js

"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminDashboard() {
  const router = useRouter();
  const supabase = createClient();
  const [abstracts, setAbstracts] = useState([]);
  const [loading, setLoading]     = useState(true);
  const [deleting, setDeleting]   = useState(null);

  useEffect(() => {
    fetchAbstracts();
  }, []);

  async function fetchAbstracts() {
    setLoading(true);
    const res  = await fetch("/api/abstracts");
    const data = await res.json();
    setAbstracts(data.abstracts ?? []);
    setLoading(false);
  }

  async function handleDelete(id, title) {
    if (!confirm(`Delete "${title}"? This cannot be undone.`)) return;
    setDeleting(id);
    await fetch(`/api/abstracts/${id}`, { method: "DELETE" });
    await fetchAbstracts();
    setDeleting(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <span className="text-blue-700 font-bold text-lg tracking-tight">
          📚 Capstone Library — Admin
        </span>
        <div className="flex items-center gap-4">
          <Link href="/" className="text-sm text-gray-500 hover:text-blue-700 transition">
            ← Back to Site
          </Link>
          <button
            onClick={handleLogout}
            className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        </div>
      </nav>

      <div className="max-w-5xl mx-auto px-6 py-10">

        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Abstract Repository</h1>
            <p className="text-gray-500 text-sm mt-1">{abstracts.length} abstracts in the library</p>
          </div>
          <Link
            href="/admin/add"
            className="bg-blue-700 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-blue-800 transition"
          >
            + Add Abstract
          </Link>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm">Loading...</div>
        ) : abstracts.length === 0 ? (
          <div className="text-center py-20 text-gray-400 text-sm">No abstracts yet.</div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl overflow-hidden">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 border-b border-gray-200">
                <tr>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Title</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Department</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Year</th>
                  <th className="text-left px-5 py-3 text-gray-500 font-medium">Embedding</th>
                  <th className="text-right px-5 py-3 text-gray-500 font-medium">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {abstracts.map((a) => (
                  <tr key={a.id} className="hover:bg-gray-50 transition">
                    <td className="px-5 py-4 text-gray-900 font-medium max-w-xs truncate">{a.title}</td>
                    <td className="px-5 py-4 text-gray-500">{a.department ?? "—"}</td>
                    <td className="px-5 py-4 text-gray-500">{a.year ?? "—"}</td>
                    <td className="px-5 py-4">
                      {a.has_embedding ? (
                        <span className="text-green-600 text-xs font-semibold">✓ Ready</span>
                      ) : (
                        <span className="text-blue-500 text-xs font-semibold animate-pulse">⏳ Processing...</span>
                      )}
                    </td>
                    <td className="px-5 py-4 text-right">
                      <div className="flex gap-3 justify-end">
                        <Link
                          href={`/admin/edit/${a.id}`}
                          className="text-blue-600 hover:underline text-xs font-medium"
                        >
                          Edit
                        </Link>
                        <button
                          onClick={() => handleDelete(a.id, a.title)}
                          disabled={deleting === a.id}
                          className="text-red-500 hover:underline text-xs font-medium disabled:opacity-50"
                        >
                          {deleting === a.id ? "Deleting..." : "Delete"}
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </main>
  );
}