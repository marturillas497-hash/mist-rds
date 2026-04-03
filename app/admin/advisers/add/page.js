// app/admin/advisers/add/page.js

"use client";

import { useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";
import AdminNavbar from "@/components/AdminNavbar";

export default function AddAdviserPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [loading, setLoading] = useState(false);
  const [error, setError]     = useState("");
  const [form, setForm]       = useState({ full_name: "", department: "", email: "" });

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  async function handleSubmit() {
    if (!form.full_name.trim() || !form.department || !form.email.trim()) {
      setError("All fields are required.");
      return;
    }
    setError("");
    setLoading(true);

    const { data: { session } } = await supabase.auth.getSession();

    const res = await fetch("/api/advisers", {
      method: "POST",
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

    router.push("/admin/advisers");
  }

  return (
    <main className="min-h-screen bg-gray-50">

      <AdminNavbar />

      <div className="max-w-2xl mx-auto px-6 py-10">
        <h1 className="text-2xl font-bold text-gray-900 mb-8">Add Research Adviser</h1>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5">

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Full Name <span className="text-red-500">*</span></label>
            <input name="full_name" value={form.full_name} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. Dr. Juan Dela Cruz" />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Department <span className="text-red-500">*</span></label>
            <select name="department" value={form.department} onChange={handleChange}
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500">
              <option value="">Select department</option>
              {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email <span className="text-red-500">*</span></label>
            <input name="email" value={form.email} onChange={handleChange} type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="e.g. jdelacruz@gmail.com" />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button onClick={handleSubmit} disabled={loading}
              className="flex-1 bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50">
              {loading ? "Saving..." : "Save Adviser"}
            </button>
            <Link href="/admin/advisers"
              className="px-6 py-3 border border-gray-300 rounded-lg text-sm text-gray-600 hover:bg-gray-50 transition text-center">
              Cancel
            </Link>
          </div>

        </div>
      </div>
    </main>
  );
}