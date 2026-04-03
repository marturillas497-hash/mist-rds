# Changelog

All notable changes to the MIST Research Discovery System will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.0.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

---

## [1.1.0] - 2026-04-02

### Added
- **Voyage AI Integration** — Replaced HuggingFace with Voyage AI (`voyage-3-lite`, 512-dim embeddings) for improved semantic search accuracy
- **Abstract View Tracking** — Logs student views to `abstract_views` table with admin analytics dashboard
- **Most Viewed Abstracts Section** — New analytics panel in admin dashboard showing popular abstracts
- **Navbar Profile Caching** — Uses `sessionStorage` to cache user role and profile, eliminating per-route database queries
- **URL Param Persistence** — Search state now persists in URL (`/library?q=...&dept=...&year=...`) for back-button support
- **Semantic Search Threshold** — Search now triggers on 3+ words (was 2+) to avoid Voyage rate limits
- **Consolidated Login** — Removed redundant `/admin/login` page; admins now use `/login` with role-based redirect

### Changed
- **Embedding Migration** — All abstracts re-embedded with Voyage AI (512-dim), replacing BGE (384-dim)
- **Similarity Scoring** — Migrated from client-side JavaScript cosine to pgvector RPC (`match_abstracts`) with HNSW indexing for faster, more accurate results
- **Search Behavior** — Library search now triggers on Enter key or Search button press, not on keystroke, to respect API rate limits
- **API Architecture** — Search pipeline now clearly separates Voyage AI (embedding generation) from pgvector (similarity comparison)
- **ESLint Configuration** — Updated to handle React Hook dependencies and unescaped entities properly for Vercel builds

### Fixed
- **Vercel Build Errors** — Fixed unescaped apostrophe on homepage (`Idea's` → `Idea&apos;s`)
- **Missing useEffect Dependencies** — Added missing dependencies across multiple components
- **API Import Errors** — Fixed missing `requireAuth` import in `/api/analyze/route.js`
- **Environment Variables** — Updated invalid/revoked API keys (Groq and Voyage AI)

### Removed
- **Transformers.js** — Removed webpack config and client-side embedding generation (fully migrated to Voyage AI)
- **HuggingFace Inference API** — Removed all BGE embedding code and dependencies
- **Redundant Admin Login** — Removed `/admin/login` page (now consolidated with `/login`)
- **Client-side Cosine Similarity** — Removed JavaScript-based similarity calculation in favor of pgvector RPC

### Security
- **Environment Variables** — All sensitive keys now properly scoped to server-side only where applicable
- **API Authentication** — Strengthened `requireAuth` and `requireAdmin` helpers

### Performance
- **HNSW Indexing** — Added pgvector HNSW indexes for faster cosine similarity searches
- **Profile Caching** — Reduced database queries by caching profile data in `sessionStorage`
- **Background Embeddings** — Fire-and-forget embedding generation doesn't block user actions

---

## [1.0.0] - 2026-03-15

### Added
- **Initial Release** — First production version of MIST RDS
- **AI Similarity Check** — Compare research proposals against existing abstracts using BGE embeddings (384-dim) via HuggingFace Inference API
- **Semantic Library Search** — Search abstracts by concept or topic using vector similarity with keyword fallback
- **Risk Level Report** — Color-coded originality scores (GREEN / YELLOW / ORANGE / RED) with detailed breakdown
- **AI Recommendations** — Groq-powered (`llama-3.3-70b-versatile`) advisory notes tailored to risk level and field
- **Abstract Library** — Browse and search existing capstone abstracts with department/year filters
- **Student Dashboard** — View past similarity check submissions and full reports
- **Admin Dashboard** — Manage abstract repository (add, edit, delete, check embedding status)
- **Rate Limiting** — Students limited to 5 similarity checks per day; admins exempt
- **Authentication** — Student registration/login with role-based access control
- **Supabase Integration** — PostgreSQL with pgvector for vector storage and similarity search
- **RLS Policies** — Row Level Security enabled on all tables
- **Responsive Design** — Mobile-friendly UI with Tailwind CSS v4

---

[1.1.0]: https://github.com/marturillas497-hash/mist-rds/compare/v1.0.0...v1.1.0
[1.0.0]: https://github.com/marturillas497-hash/mist-rds/releases/tag/v1.0.0