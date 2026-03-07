// app/page.js

"use client";

import Link from "next/link";
import Navbar from "@/components/Navbar";

export default function Home() {
  return (
    <main className="min-h-screen bg-gray-50">

      <Navbar />

      {/* HERO */}
      <section className="max-w-3xl mx-auto text-center px-6 py-24">
        <h1 className="text-4xl font-bold text-gray-900 mb-4">
          Check Your Research Idea's Originality
        </h1>
        <p className="text-gray-500 text-lg mb-10">
          Compare your capstone proposal against hundreds of existing abstracts
          using AI-powered similarity analysis.
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="bg-blue-700 text-white px-8 py-3 rounded-lg font-semibold hover:bg-blue-800 transition"
          >
            Get Started
          </Link>
          <Link
            href="/library"
            className="border border-gray-300 text-gray-700 px-8 py-3 rounded-lg font-semibold hover:bg-gray-100 transition"
          >
            Browse Abstracts
          </Link>
        </div>
      </section>

      {/* FEATURE CARDS */}
      <section className="max-w-4xl mx-auto px-6 pb-24 grid grid-cols-1 sm:grid-cols-3 gap-6">
        {[
          { icon: "🔍", title: "AI Similarity Check",  desc: "Compare your idea against existing capstone abstracts instantly." },
          { icon: "📊", title: "Risk Level Report",    desc: "Get a color-coded originality score with detailed breakdown." },
          { icon: "💡", title: "Improvement Tips",     desc: "Receive AI-generated suggestions to make your research more unique." },
        ].map((f) => (
          <div key={f.title} className="bg-white rounded-xl border border-gray-200 p-6 text-center shadow-sm">
            <div className="text-3xl mb-3">{f.icon}</div>
            <h3 className="font-semibold text-gray-800 mb-2">{f.title}</h3>
            <p className="text-gray-500 text-sm">{f.desc}</p>
          </div>
        ))}
      </section>

    </main>
  );
}