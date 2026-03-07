"use client";
// app/admin/login/page.js
import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";

export default function AdminLoginPage() {
  const router = useRouter();
  const [form, setForm] = useState({ email: "", password: "" });
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  function handleChange(e) {
    setForm({ ...form, [e.target.name]: e.target.value });
  }

  useEffect(() => {
  const supabase = createClient();
  supabase.auth.getUser().then(({ data }) => {
    if (data.user) {
      router.replace("/admin");
    }
  });
  }, []);

  async function handleSubmit() {
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);

    const supabase = createClient();

    const { data, error: authError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (authError) {
      setError("Invalid email or password.");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    if (profile?.role !== "admin") {
      await supabase.auth.signOut();
      setError("You do not have admin access.");
      setLoading(false);
      return;
    }

    router.push("/admin");
    router.refresh();
  }

  return (
    <main className="min-h-screen bg-slate-900 flex items-center justify-center px-4">
      <div className="w-full max-w-sm">

        <div className="text-center mb-8">
          <span className="text-3xl">🛡️</span>
          <h1 className="text-2xl font-bold text-white mt-2">Admin Panel</h1>
          <p className="text-slate-400 text-sm mt-1">Capstone Abstract Library</p>
        </div>

        <div className="bg-slate-800 border border-slate-700 rounded-xl p-8 shadow-sm space-y-5">
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              type="email"
              placeholder="admin@school.edu"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1">Password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              type="password"
              placeholder="••••••••"
              className="w-full bg-slate-700 border border-slate-600 rounded-lg px-4 py-2.5 text-sm text-white placeholder-slate-500 focus:outline-none focus:ring-2 focus:ring-amber-500"
            />
          </div>

          {error && (
            <div className="bg-red-900/40 border border-red-700 text-red-400 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={handleSubmit}
            disabled={loading}
            className="w-full bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-slate-900 font-semibold py-3 rounded-lg transition"
          >
            {loading ? "Signing in..." : "Sign In as Admin"}
          </button>
        </div>

        <p className="text-center text-xs text-slate-500 mt-6">
          Student?{" "}
          <a href="/login" className="hover:text-slate-300 transition">
            Student login →
          </a>
        </p>

      </div>
    </main>
  );
}