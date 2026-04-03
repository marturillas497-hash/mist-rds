// app/login/page.js

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function LoginPage() {
  const router   = useRouter();
  const supabase = createClient();

  const [mode, setMode]         = useState("login");
  const [loading, setLoading]   = useState(false);
  const [error, setError]       = useState("");
  const [advisers, setAdvisers] = useState([]);
  const [form, setForm]         = useState({
    email: "", password: "", full_name: "",
    department: "", year_level: "", section: "",
    student_id: "", adviser_id: "",
  });

  // ── Redirect if already logged in ───────────────────────────────────────
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("role")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            router.replace(profile?.role === "admin" ? "/admin" : "/");
          });
      }
    });
  }, [router]);

  // ── Fetch advisers on mount ──────────────────────────────────────────────
  useEffect(() => {
    fetch("/api/advisers")
      .then((r) => r.json())
      .then((d) => setAdvisers(d.advisers ?? []));
  }, []);

  // ── Reset adviser when department changes ────────────────────────────────
  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "department") {
      setForm({ ...form, department: value, adviser_id: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  // ── Advisers filtered to selected department ─────────────────────────────
  const filteredAdvisers = advisers.filter((a) => a.department === form.department);

  async function handleLogin() {
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);

    const { data, error } = await supabase.auth.signInWithPassword({
      email:    form.email.trim(),
      password: form.password,
    });

    if (error) {
      setError(error.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role")
      .eq("id", data.user.id)
      .single();

    router.push(profile?.role === "admin" ? "/admin" : "/");
  }

  async function handleRegister() {
    if (!form.email.trim() || !form.password.trim() || !form.full_name.trim()) {
      setError("Email, password, and full name are required.");
      return;
    }
    setError("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method:  "POST",
      headers: { "Content-Type": "application/json" },
      body:    JSON.stringify({
        email:      form.email.trim(),
        password:   form.password,
        full_name:  form.full_name.trim(),
        department: form.department  || null,
        year_level: form.year_level  || null,
        section:    form.section.trim()    || null,
        student_id: form.student_id.trim() || null,
        adviser_id: form.adviser_id  || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    const { error: signInError } = await supabase.auth.signInWithPassword({
      email:    form.email.trim(),
      password: form.password,
    });

    if (signInError) {
      setError(signInError.message);
      setLoading(false);
      return;
    }

    router.push("/");
  }

  return (
    <main className="min-h-screen bg-gray-50 flex items-center justify-center px-4 py-10">
      <div className="w-full max-w-md">

        <div className="text-center mb-8">
          <span className="text-3xl">📚</span>
          <h1 className="text-2xl font-bold text-gray-900 mt-2">Capstone Library</h1>
          <p className="text-gray-500 text-sm mt-1">
            {mode === "login" ? "Sign in to your account" : "Create a student account"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5">

          <div className="flex bg-gray-100 rounded-lg p-1">
            <button
              onClick={() => { setMode("login"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === "login"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Sign In
            </button>
            <button
              onClick={() => { setMode("register"); setError(""); }}
              className={`flex-1 py-2 text-sm font-medium rounded-md transition ${
                mode === "register"
                  ? "bg-white text-gray-900 shadow-sm"
                  : "text-gray-500 hover:text-gray-700"
              }`}
            >
              Register
            </button>
          </div>

          {mode === "register" && (
            <>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Full Name <span className="text-red-500">*</span>
                </label>
                <input
                  name="full_name" value={form.full_name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                <input
                  name="student_id" value={form.student_id} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="e.g. 1234567"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department" value={form.department} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">Select your department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Research Adviser
                  {form.department && filteredAdvisers.length === 0 && (
                    <span className="text-xs text-gray-400 font-normal ml-2">
                      — no advisers registered for {form.department} yet
                    </span>
                  )}
                </label>
                <select
                  name="adviser_id" value={form.adviser_id} onChange={handleChange}
                  disabled={!form.department || filteredAdvisers.length === 0}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50 disabled:bg-gray-50"
                >
                  <option value="">
                    {!form.department
                      ? "Select a department first"
                      : "Select your adviser (optional)"}
                  </option>
                  {filteredAdvisers.map((a) => (
                    <option key={a.id} value={a.id}>{a.full_name}</option>
                  ))}
                </select>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Year Level</label>
                  <select
                    name="year_level" value={form.year_level} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    <option value="">Select year</option>
                    {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                  </select>
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Section</label>
                  <input
                    name="section" value={form.section} onChange={handleChange}
                    className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
                    placeholder="e.g. A"
                  />
                </div>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Email <span className="text-red-500">*</span>
            </label>
            <input
              name="email" value={form.email} onChange={handleChange} type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Password <span className="text-red-500">*</span>
            </label>
            <input
              name="password" value={form.password} onChange={handleChange} type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm text-gray-900 focus:outline-none focus:ring-2 focus:ring-blue-500"
              placeholder="••••••••"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 text-red-600 text-sm rounded-lg px-4 py-3">
              {error}
            </div>
          )}

          <button
            onClick={mode === "login" ? handleLogin : handleRegister}
            disabled={loading}
            className="w-full bg-blue-700 text-white py-3 rounded-lg font-semibold hover:bg-blue-800 transition disabled:opacity-50"
          >
            {loading
              ? mode === "login" ? "Signing in..." : "Creating account..."
              : mode === "login" ? "Sign In" : "Create Account"
            }
          </button>

        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin?{" "}
          <a href="/admin/login" className="hover:underline">
            Admin login →
          </a>
        </p>

      </div>
    </main>
  );
}