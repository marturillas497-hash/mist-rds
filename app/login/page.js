//app/login/page.js

"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation"; // Added useSearchParams
import { createClient } from "@/lib/supabase/client";
import { DEPARTMENTS } from "@/lib/constants";

const YEAR_LEVELS = ["1st Year", "2nd Year", "3rd Year", "4th Year"];

export default function LoginPage() {
  const router = useRouter();
  const searchParams = useSearchParams(); // To catch ?error=pending from middleware
  const supabase = createClient();

  const [mode, setMode] = useState("login");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState(searchParams.get("error") === "pending" 
    ? "Your account is awaiting admin approval." 
    : "");
  const [success, setSuccess] = useState(""); // For "Pending" message
  const [advisers, setAdvisers] = useState([]);
  const [form, setForm] = useState({
    email: "", password: "", full_name: "",
    role: "student", // Default role
    department: "", year_level: "", section: "",
    student_id: "", adviser_id: "",
  });

  // Redirect if already logged in
  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      if (data.user) {
        supabase
          .from("profiles")
          .select("role, status")
          .eq("id", data.user.id)
          .single()
          .then(({ data: profile }) => {
            if (profile?.status === 'active') {
              router.replace(profile?.role === "admin" ? "/admin" : profile?.role === "research_adviser" ? "/adviser" : "/");
            }
          });
      }
    });
  }, [router]);

  useEffect(() => {
    fetch("/api/advisers")
      .then((r) => r.json())
      .then((d) => setAdvisers(d.advisers ?? []));
  }, []);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "department") {
      setForm({ ...form, department: value, adviser_id: "" });
    } else {
      setForm({ ...form, [name]: value });
    }
  }

  const filteredAdvisers = advisers.filter((a) => a.department === form.department);

  async function handleLogin() {
    if (!form.email.trim() || !form.password.trim()) {
      setError("Email and password are required.");
      return;
    }
    setError("");
    setLoading(true);

    const { data, error: authErr } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
      password: form.password,
    });

    if (authErr) {
      setError(authErr.message);
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("role, status")
      .eq("id", data.user.id)
      .single();

    if (profile?.status !== "active") {
      await supabase.auth.signOut();
      setError("Your account is pending approval or has been restricted.");
      setLoading(false);
      return;
    }

    if (profile?.role === "admin") router.push("/admin");
    else if (profile?.role === "research_adviser") router.push("/adviser");
    else router.push("/");
  }

  async function handleRegister() {
    if (!form.email.trim() || !form.password.trim() || !form.full_name.trim()) {
      setError("Email, password, and full name are required.");
      return;
    }
    setError("");
    setSuccess("");
    setLoading(true);

    const res = await fetch("/api/auth/register", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({
        ...form,
        // Ensure values are trimmed/nullified
        email: form.email.trim(),
        full_name: form.full_name.trim(),
        section: form.section.trim() || null,
        student_id: form.student_id.trim() || null,
      }),
    });

    const data = await res.json();

    if (!res.ok) {
      setError(data.error ?? "Registration failed.");
      setLoading(false);
      return;
    }

    // ADVISER FLOW: Show message, don't auto-login
    if (form.role === "research_adviser") {
      setSuccess("Account created! Please wait for admin approval before logging in.");
      setMode("login");
      setLoading(false);
      return;
    }

    // STUDENT FLOW: Auto-login
    const { error: signInError } = await supabase.auth.signInWithPassword({
      email: form.email.trim(),
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
            {mode === "login" ? "Sign in to your account" : "Create your account"}
          </p>
        </div>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm space-y-5">
          {/* Login/Register Toggle */}
          <div className="flex bg-gray-100 rounded-lg p-1">
            {["login", "register"].map((m) => (
              <button
                key={m}
                onClick={() => { setMode(m); setError(""); setSuccess(""); }}
                className={`flex-1 py-2 text-sm font-medium rounded-md transition capitalize ${
                  mode === m ? "bg-white text-gray-900 shadow-sm" : "text-gray-500"
                }`}
              >
                {m}
              </button>
            ))}
          </div>

          {/* Success Message */}
          {success && (
            <div className="bg-green-50 border border-green-200 text-green-700 text-sm rounded-lg px-4 py-3">
              {success}
            </div>
          )}

          {mode === "register" && (
            <>
              {/* Role Selection */}
              <div className="flex gap-4 p-1 bg-gray-50 border rounded-lg">
                <button
                  onClick={() => setForm({...form, role: 'student'})}
                  className={`flex-1 py-1.5 text-xs rounded-md transition ${form.role === 'student' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                >
                  I am a Student
                </button>
                <button
                  onClick={() => setForm({...form, role: 'research_adviser'})}
                  className={`flex-1 py-1.5 text-xs rounded-md transition ${form.role === 'research_adviser' ? 'bg-blue-600 text-white' : 'text-gray-500'}`}
                >
                  I am an Adviser
                </button>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Full Name *</label>
                <input
                  name="full_name" value={form.full_name} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                  placeholder="Juan Dela Cruz"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Department</label>
                <select
                  name="department" value={form.department} onChange={handleChange}
                  className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                >
                  <option value="">Select your department</option>
                  {DEPARTMENTS.map((d) => <option key={d} value={d}>{d}</option>)}
                </select>
              </div>

              {/* Student Specific Fields */}
              {form.role === "student" && (
                <>
                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Student ID</label>
                    <input
                      name="student_id" value={form.student_id} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                      placeholder="e.g. 1234567"
                    />
                  </div>

                  <div>
                    <label className="block text-sm font-medium text-gray-700 mb-1">Research Adviser</label>
                    <select
                      name="adviser_id" value={form.adviser_id} onChange={handleChange}
                      disabled={!form.department || filteredAdvisers.length === 0}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm disabled:opacity-50"
                    >
                      <option value="">{!form.department ? "Select department first" : "Select adviser (optional)"}</option>
                      {filteredAdvisers.map((a) => (
                        <option key={a.id} value={a.id}>{a.full_name}</option>
                      ))}
                    </select>
                  </div>

                  <div className="grid grid-cols-2 gap-4">
                    <select
                      name="year_level" value={form.year_level} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                    >
                      <option value="">Year Level</option>
                      {YEAR_LEVELS.map((y) => <option key={y} value={y}>{y}</option>)}
                    </select>
                    <input
                      name="section" value={form.section} onChange={handleChange}
                      className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
                      placeholder="Section"
                    />
                  </div>
                </>
              )}
            </>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Email *</label>
            <input
              name="email" value={form.email} onChange={handleChange} type="email"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Password *</label>
            <input
              name="password" value={form.password} onChange={handleChange} type="password"
              className="w-full border border-gray-300 rounded-lg px-4 py-2.5 text-sm"
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
            {loading ? "Processing..." : mode === "login" ? "Sign In" : "Create Account"}
          </button>
        </div>

        <p className="text-center text-xs text-gray-400 mt-6">
          Admin? <a href="/login" className="hover:underline">Login here →</a>
        </p>
      </div>
    </main>
  );
}