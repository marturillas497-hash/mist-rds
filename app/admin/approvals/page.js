// app/admin/approvals/page.js
"use client";

import { useState, useEffect } from "react";
import AdminNavbar from "@/components/AdminNavbar";

export default function AdminApprovalsPage() {
  const [approvals, setApprovals] = useState([]);
  const [loading, setLoading] = useState(true);
  const [actioningId, setActioningId] = useState(null);

  useEffect(() => {
    fetchApprovals();
  }, []);

  async function fetchApprovals() {
    setLoading(true);
    try {
      // CRITICAL: This URL must match your folder structure exactly
      const res = await fetch("/api/admin/approvals");
      
      // Safety check for HTML responses (the 404 error you saw)
      const contentType = res.headers.get("content-type");
      if (!contentType || !contentType.includes("application/json")) {
        throw new Error("Server returned HTML instead of JSON. Check API path.");
      }

      const data = await res.json();
      setApprovals(data.approvals || []);
    } catch (error) {
      console.error("Failed to fetch approvals:", error);
    } finally {
      setLoading(false);
    }
  }

  async function handleUpdateStatus(id, newStatus) {
    setActioningId(id);
    try {
      const res = await fetch("/api/admin/approvals", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ id, status: newStatus }),
      });

      if (res.ok) {
        // Optimistic UI: remove from list immediately
        setApprovals((prev) => prev.filter((item) => item.id !== id));
      } else {
        const err = await res.json();
        alert(err.error || "Update failed");
      }
    } catch (error) {
      alert("An error occurred. Please check your connection.");
    } finally {
      setActioningId(null);
    }
  }

  return (
    <div className="min-h-screen bg-gray-50 text-gray-900">
      <AdminNavbar backHref="/admin" backLabel="← Admin Dashboard" />

      <main className="p-8 max-w-6xl mx-auto">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-2xl font-bold">Pending Adviser Approvals</h1>
            <p className="text-sm text-gray-500 mt-1">
              Verify research advisers before they can access student data.
            </p>
          </div>
          <div className="bg-blue-100 text-blue-700 px-4 py-1 rounded-full text-xs font-bold uppercase">
            {approvals.length} Request{approvals.length !== 1 ? "s" : ""}
          </div>
        </div>

        {loading ? (
          <div className="flex flex-col items-center py-20">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-700 mb-4"></div>
            <p className="text-gray-400 text-sm">Checking for new registrations...</p>
          </div>
        ) : approvals.length === 0 ? (
          <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-16 text-center shadow-sm">
            <span className="text-4xl">✨</span>
            <h3 className="mt-4 text-lg font-medium">All caught up!</h3>
            <p className="text-gray-400 text-sm">No pending adviser accounts to review.</p>
          </div>
        ) : (
          <div className="bg-white border border-gray-200 rounded-xl shadow-sm overflow-hidden">
            <table className="w-full text-left">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-200">
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Adviser</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Department</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest">Registered</th>
                  <th className="px-6 py-4 text-[10px] font-bold text-gray-400 uppercase tracking-widest text-right">Actions</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {approvals.map((adviser) => (
                  <tr key={adviser.id} className="hover:bg-blue-50/20 transition-colors">
                    <td className="px-6 py-5">
                      <div className="font-semibold">{adviser.full_name}</div>
                      <div className="text-xs text-gray-400">{adviser.email}</div>
                    </td>
                    <td className="px-6 py-5">
                      <span className="bg-gray-100 text-gray-600 px-2 py-1 rounded text-[10px] font-bold uppercase">
                        {adviser.department}
                      </span>
                    </td>
                    <td className="px-6 py-5 text-sm text-gray-500">
                      {new Date(adviser.created_at).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-5 text-right space-x-2">
                      <button
                        onClick={() => handleUpdateStatus(adviser.id, "active")}
                        disabled={actioningId === adviser.id}
                        className="px-4 py-2 bg-blue-600 text-white text-xs font-bold rounded-lg hover:bg-blue-700 disabled:opacity-50"
                      >
                        Approve
                      </button>
                      <button
                        onClick={() => handleUpdateStatus(adviser.id, "rejected")}
                        disabled={actioningId === adviser.id}
                        className="px-4 py-2 border border-red-200 text-red-600 text-xs font-bold rounded-lg hover:bg-red-50 disabled:opacity-50"
                      >
                        Reject
                      </button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </main>
    </div>
  );
}