// components/AdminNavbar.js
"use client";

import Link from "next/link";

/**
 * Reusable admin navigation bar.
 *
 * @param {object} props
 * @param {string}   [props.backHref="/admin"]  - where the back link points
 * @param {string}   [props.backLabel="← Back to Dashboard"] - back link text
 * @param {function} [props.onLogout]  - if provided, renders a Logout button
 */
export default function AdminNavbar({
  backHref  = "/admin",
  backLabel = "← Back to Dashboard",
  onLogout,
}) {
  return (
    <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
      <span className="text-blue-700 font-bold text-lg tracking-tight">
        📚 Capstone Library — Admin
      </span>
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
