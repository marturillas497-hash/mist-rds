// app/admin/advisers/page.js

"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import AdminNavbar from "@/components/AdminNavbar";

export default function AdvisersPage() {
  const router = useRouter();
  const supabase = createClient();

  const [advisers, setAdvisers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioning, setActioning] = useState(null);

  useEffect(() => {
    fetchActiveAdvisers();
  }, []);

  async function fetchActiveAdvisers() {
    setLoading(true);
    // Fetch directly from profiles: role is research_adviser and status is active
    const { data, error } = await supabase
      .from("profiles")
      .select("id, full_name, email, department, created_at")
      .eq("role", "research_adviser")
      .eq("status", "active")
      .order("full_name", { ascending: true });

    if (error) {
      console.error("Error fetching advisers:", error.message);
    } else {
      setAdvisers(data ?? []);
    }
    setLoading(false);
  }

  async function handleRevokeAccess(id, name) {
    if (!confirm(`Revoke access for "${name}"? This will move them to the rejected list and block their login.`)) return;
    
    setActioning(id);

    // Update status to 'rejected' instead of a hard DELETE
    const { error } = await supabase
      .from("profiles")
      .update({ status: "rejected" })
      .eq("id", id);

    if (error) {
      alert("Failed to revoke access: " + error.message);
    } else {
      // Optimistically update UI
      setAdvisers((prev) => prev.filter((a) => a.id !== id));
    }
    
    setActioning(null);
  }

  async function handleLogout() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  // Grouping logic remains the same
  const grouped = advisers.reduce((acc, a) => {
    const dept = a.department || "No Department Assigned";
    if (!acc[dept]) acc[dept] = [];
    acc[dept].push(a);
    return acc;
  }, {});

  return (
    <main className="min-h-screen bg-gray-50">
      <AdminNavbar backHref="/admin" backLabel="← Back to Dashboard" onLogout={handleLogout} />

      <div className="max-w-5xl mx-auto px-6 py-10">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">Research Advisers</h1>
            <p className="text-gray-500 text-sm mt-1">
              {advisers.length} active adviser{advisers.length !== 1 ? "s" : ""} verified
            </p>
          </div>
          {/* Removed the Link button for "+ Add Adviser" per migration task list */}
          <div className="text-xs text-gray-400 italic bg-gray-100 px-3 py-2 rounded-md">
            Advisers now self-register and require admin approval.
          </div>
        </div>

        {loading ? (
          <div className="text-center py-20 text-gray-400 text-sm italic">Loading active advisers...</div>
        ) : advisers.length === 0 ? (
          <div className="text-center py-20 bg-white border border-dashed rounded-2xl text-gray-400 text-sm">
            No active advisers found in the profiles table.
          </div>
        ) : (
          <div className="space-y-8">
            {Object.entries(grouped).sort().map(([dept, list]) => (
              <div key={dept}>
                <h2 className="text-xs font-bold text-blue-600 uppercase tracking-widest mb-3 px-1">{dept}</h2>
                <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
                  <table className="w-full text-sm">
                    <thead className="bg-gray-50 border-b border-gray-200">
                      <tr>
                        <th className="text-left px-6 py-3 text-gray-500 font-semibold uppercase text-[10px]">Name</th>
                        <th className="text-left px-6 py-3 text-gray-500 font-semibold uppercase text-[10px]">Email</th>
                        <th className="text-right px-6 py-3 text-gray-500 font-semibold uppercase text-[10px]">Management</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {list.map((a) => (
                        <tr key={a.id} className="hover:bg-blue-50/20 transition">
                          <td className="px-6 py-4 font-semibold text-gray-900">{a.full_name}</td>
                          <td className="px-6 py-4 text-gray-600">{a.email}</td>
                          <td className="px-6 py-4 text-right">
                            <button
                              onClick={() => handleRevokeAccess(a.id, a.full_name)}
                              disabled={actioning === a.id}
                              className="text-red-500 hover:text-red-700 font-bold text-xs disabled:opacity-50 transition"
                            >
                              {actioning === a.id ? "Processing..." : "Revoke Access"}
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </main>
  );
}