// app/library/[id]/page.js

import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";

export default async function AbstractDetailPage({ params, searchParams }) {
  const { id } = await params;
  const from = (await searchParams)?.from;
  const supabase = await createClient();

  const { data: abstract, error } = await supabase
    .from("abstracts")
    .select("*")
    .eq("id", id)
    .single();

  if (error || !abstract) return notFound();

  const backHref  = from === "admin" ? "/admin" : "/library";
  const backLabel = from === "admin" ? "← Back to Admin Panel" : "← Back to Library";

  return (
    <main className="min-h-screen bg-gray-50">

      <nav className="bg-white border-b border-gray-200 px-6 py-4 flex items-center justify-between">
        <Link href="/" className="text-blue-700 font-bold text-lg tracking-tight">
          📚 Capstone Library
        </Link>
        <div className="flex gap-4">
          <Link href="/library" className="text-sm text-gray-600 hover:text-blue-700 transition">
            Browse Library
          </Link>
          <Link href="/login" className="text-sm text-gray-600 hover:text-blue-700 transition">
            Login
          </Link>
          <Link href="/login" className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition">
            Register
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <Link href={backHref} className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          {backLabel}
        </Link>

        <div className="bg-white border border-gray-200 rounded-xl p-8 shadow-sm">

          <div className="flex gap-2 mb-4">
            {abstract.department && (
              <span className="bg-blue-100 text-blue-700 text-xs font-semibold px-3 py-1 rounded-full">
                {abstract.department}
              </span>
            )}
            {abstract.year && (
              <span className="bg-gray-100 text-gray-600 text-xs font-semibold px-3 py-1 rounded-full">
                {abstract.year}
              </span>
            )}
          </div>

          <h1 className="text-2xl font-bold text-gray-900 mb-3">
            {abstract.title}
          </h1>

          {abstract.authors && (
            <p className="text-sm text-gray-500 mb-6">
              👤 {abstract.authors}
            </p>
          )}

          <hr className="border-gray-100 mb-6" />

          <div>
            <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-3">
              Abstract
            </h2>
            <p className="text-gray-700 leading-relaxed">
              {abstract.abstract_text}
            </p>
          </div>

          {abstract.keywords && (
            <div className="mt-6">
              <h2 className="text-xs font-semibold text-gray-400 uppercase tracking-widest mb-2">
                Keywords
              </h2>
              <p className="text-sm text-gray-500">🏷 {abstract.keywords}</p>
            </div>
          )}

        </div>
      </div>
    </main>
  );
}