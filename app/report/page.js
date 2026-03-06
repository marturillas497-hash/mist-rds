"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { RISK_COLORS } from "@/lib/constants";

export default function ReportPage() {
  const router = useRouter();
  const [report, setReport] = useState(null);

  useEffect(() => {
    const stored = sessionStorage.getItem("report");
    if (!stored) {
      router.push("/submit");
      return;
    }
    setReport(JSON.parse(stored));
  }, []);

  if (!report) return null;

  const risk = RISK_COLORS[report.risk.color] ?? RISK_COLORS.GREEN;

  return (
    <main className="min-h-screen bg-gray-50">

      {/* NAVBAR */}
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
          <Link href="/register" className="text-sm bg-blue-700 text-white px-4 py-1.5 rounded-md hover:bg-blue-800 transition">
            Register
          </Link>
        </div>
      </nav>

      <div className="max-w-3xl mx-auto px-6 py-10">

        <Link href="/submit" className="text-sm text-blue-600 hover:underline mb-6 inline-block">
          ← Check another idea
        </Link>

        {/* SCORE CARD */}
        <div className={`rounded-xl border p-8 mb-6 text-center ${risk.bg} border-transparent`}>
          <p className="text-sm font-semibold uppercase tracking-widest text-gray-500 mb-2">
            Overall Similarity Score
          </p>
          <p className={`text-6xl font-black mb-3 ${risk.text}`}>
            {report.score}%
          </p>
          <span className={`inline-block px-4 py-1.5 rounded-full text-sm font-semibold ${risk.bg} ${risk.text} border border-current`}>
            {risk.label} — {report.risk.level}
          </span>
        </div>

        {/* TOP MATCHES */}
        <div className="bg-white border border-gray-200 rounded-xl p-6 mb-6">
          <h2 className="font-semibold text-gray-800 mb-4">Top Similar Studies</h2>
          <div className="space-y-4">
            {report.topMatches.map((m, i) => {
              const mRisk = RISK_COLORS[m.color] ?? RISK_COLORS.GREEN;
              return (
                <div key={m.id} className="border border-gray-100 rounded-lg p-4">
                  <div className="flex items-start justify-between gap-4 mb-2">
                    <div className="flex-1">
                      <p className="font-medium text-gray-900 text-sm">{i + 1}. {m.title}</p>
                      <p className="text-xs text-gray-400 mt-0.5">
                        {m.department !== "—" && <span className="text-blue-600 font-medium">{m.department}</span>}
                        {m.year !== "—" && <span> · {m.year}</span>}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className={`text-lg font-bold ${mRisk.text}`}>{m.similarity_percent}%</p>
                      <span className={`text-xs font-semibold px-2 py-0.5 rounded-full ${mRisk.bg} ${mRisk.text}`}>
                        {m.risk_level}
                      </span>
                    </div>
                  </div>
                  {/* SIMILARITY BAR */}
                  <div className="w-full bg-gray-100 rounded-full h-1.5 mt-2">
                    <div
                      className={`h-1.5 rounded-full ${mRisk.bg.replace("bg-", "bg-").replace("-100", "-400")}`}
                      style={{ width: `${m.similarity_percent}%` }}
                    />
                  </div>
                  {m.abstract_preview && (
                    <p className="text-xs text-gray-500 mt-2 line-clamp-2">{m.abstract_preview}...</p>
                  )}
                </div>
              );
            })}
          </div>
        </div>

        {/* AI RECOMMENDATIONS */}
        <div className="bg-white border border-gray-200 rounded-xl p-6">
          <h2 className="font-semibold text-gray-800 mb-4">💡 AI Recommendations</h2>
          <div className="text-sm text-gray-700 leading-relaxed whitespace-pre-wrap">
            {report.recommendations}
          </div>
        </div>

      </div>
    </main>
  );
}