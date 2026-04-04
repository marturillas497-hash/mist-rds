// components/AdminNavbar.js
"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function AdminNavbar({
  backHref  = "/admin",
  backLabel = "← Back to Dashboard",
  onLogout,
}) {
  const pathname = usePathname();

  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <div className="flex items-center gap-6">
        <Link href="/admin" className="text-blue-700 font-bold text-lg tracking-tight">
          📚 Capstone Library — Admin
        </Link>
        {/* New Approvals Link */}
        <Link 
          href="/admin/approvals" 
          className={`text-sm font-medium transition ${
            pathname === "/admin/approvals" ? "text-blue-700" : "text-gray-500 hover:text-blue-700"
          }`}
        >
          Pending Approvals
        </Link>
      </div>
      
      <div className="flex items-center gap-4">
        <Link href={backHref} className="text-sm text-gray-500 hover:text-blue-700 transition">
          {backLabel}
        </Link>
        {onLogout && (
          <button
            onClick={onLogout}
            className="text-sm bg-red-500 text-white px-4 py-1.5 rounded-md hover:bg-red-600 transition"
          >
            Logout
          </button>
        )}
      </div>
    </nav>
  );
}