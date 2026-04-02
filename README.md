# MIST Research Discovery System

> A web-based capstone and thesis discovery platform for Makilala Institute of Science and Technology — with semantic similarity detection and AI-powered topic recommendations.

**Live:** https://mist-rds-umber.vercel.app &nbsp;|&nbsp; **GitHub:** https://github.com/marturillas497-hash/mist-rds

---

## Overview

MIST RDS helps students explore completed capstone and thesis studies from MIST's own institutional library, check whether their proposed research topics are conceptually similar to existing work, and receive AI-generated guidance for refining their ideas — all before making a single visit to the library.

Librarians, research coordinators, and instructors get a centralized admin dashboard to manage and monitor institutional research outputs by program and academic year.

---

## Features

| Feature | Description |
|---|---|
| **Semantic Library Search** | Search abstracts by concept or topic using vector similarity. Triggers on 3+ words via Enter or Search button. Results tagged with a **Semantic** badge and % match score. |
| **AI Similarity Check** | Compares a proposed research topic against existing abstracts using Voyage AI embeddings + pgvector cosine similarity. |
| **Risk Level Report** | Color-coded originality score based on similarity: GREEN (<40%) · YELLOW (40–59%) · ORANGE (60–79%) · RED (≥80%) |
| **AI Recommendations** | Groq-powered advisory notes tailored to the student's similarity score and research field. |
| **Abstract Library** | Browse and filter completed capstone abstracts by title, department, or year. Login required. |
| **Student Dashboard** | View past similarity check submissions and their full reports. |
| **Admin Dashboard** | Manage the abstract repository (add, edit, delete) and view analytics including Most Viewed Abstracts. |
| **Abstract View Tracking** | Logs student views to the `abstract_views` table for admin analytics. |
| **Rate Limiting** | Students are limited to 5 similarity checks per day. Admins are exempt. |
| **Authentication** | Role-based access control. Students and admins share the same `/login` page; the system redirects based on role. |

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Embeddings | Voyage AI — `voyage-3-lite` (512-dim) |
| Semantic Search | pgvector RPC (`match_abstracts`) with HNSW index |
| AI Recommendations | Groq API `llama-3.3-70b-versatile` via OpenAI-compatible SDK |
| Deployment | Vercel Hobby |

---

## Getting Started

### Prerequisites

- Node.js 18+
- A Supabase project with pgvector enabled
- Voyage AI API key — [dash.voyageai.com](https://dash.voyageai.com/)
- Groq API key — [console.groq.com](https://console.groq.com/)

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/marturillas497-hash/mist-rds.git
cd mist-rds

# 2. Install dependencies
npm install

# 3. Set up environment variables (see below)

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

### Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
VOYAGE_API_KEY=your_voyage_api_key
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ Never commit `.env.local` to version control. It is already gitignored.

The same variables must also be added to **Vercel Dashboard → Settings → Environment Variables** for production.

---

## Database Setup

This project uses Supabase with the following tables:

| Table | Key Fields |
|---|---|
| `abstracts` | `id`, `title`, `abstract_text`, `authors`, `year`, `department`, `keywords`, `embedding vector(512)`, `created_at` |
| `profiles` | `id`, `role`, `full_name`, `department`, `year_level`, `section`, `student_id`, `created_at` |
| `similarity_reports` | `id`, `student_id`, `input_title`, `input_description`, `similarity_score`, `risk_level`, `results_json`, `ai_recommendations`, `created_at` |
| `abstract_views` | `id`, `abstract_id`, `student_id`, `created_at` |

RLS (Row Level Security) is enabled on all tables.

### pgvector RPC Function

The `match_abstracts` RPC function performs semantic search with optional department and year filters:

```sql
match_abstracts(
  query_embedding vector(512),
  match_count      int,
  filter_dept      text,
  filter_year      text
)
-- Returns: id, title, authors, department, year, keywords, abstract_text, similarity
-- similarity is a float 0–1; multiply by 100 for % display
```

### Admin Setup

1. Create a user in the Supabase Authentication dashboard.
2. Run the following SQL to assign the admin role:

```sql
INSERT INTO profiles (id, role, full_name)
VALUES ('<user-uuid>', 'admin', 'Your Name');
```

Admins log in through the same `/login` page as students — the system detects the role and redirects to `/admin` automatically.

---

## How Semantic Search Works

The search pipeline uses two separate services together.

**Voyage AI** is a pure embedding generator. It converts text into a 512-dimensional vector representing its semantic meaning. It runs twice per search:

- When an abstract is saved → generates a **document embedding** stored in the `abstracts` table
- When a student searches → generates a **query embedding** representing the search intent

**Supabase / pgvector** handles the comparison. The `match_abstracts` RPC uses the `<=>` cosine distance operator to score and rank every stored abstract vector directly in Postgres.

**Full flow:**

1. Student types 3+ words and presses Enter or clicks Search
2. Query is committed to the URL (`/library?q=...`)
3. Frontend calls `GET /api/search?q=...`
4. API calls Voyage AI → receives 512-dim query vector
5. API calls `match_abstracts` RPC → pgvector ranks results inside Postgres
6. Top 20 results returned with % match scores
7. Results displayed with a **Semantic** badge

> Voyage handles language understanding. Supabase handles comparison and retrieval. Neither can do the other's job.

---

## Project Structure

```
app/
├── admin/          # Admin dashboard (manage abstracts, view analytics)
├── api/
│   ├── abstracts/  # CRUD for abstracts + embedding generation
│   ├── analyze/    # Similarity check endpoint (rate-limited)
│   ├── auth/       # Student registration
│   └── search/     # Semantic search endpoint
├── dashboard/      # Student submission history and report view
├── library/        # Abstract browser with semantic search (login required)
├── login/          # Shared login + register page (students and admins)
└── submit/         # Similarity check submission page

lib/
├── api-auth.js     # requireAuth / requireAdmin helpers
├── embeddings.js   # Voyage AI embedding generation (query/document types)
├── supabase/       # Supabase client (browser + server + service)
└── constants.js    # Departments list, risk level config, DAILY_LIMIT

components/
├── AdminNavbar.js  # Admin navigation with profile caching
└── Navbar.js       # Student navigation
```

---

## Performance Optimizations

- **Navbar profile caching** — Uses `sessionStorage` under key `mist_profile_cache` to avoid per-route database queries
- **Search state persistence** — URL params (`/library?q=...&dept=...&year=...`) enable back-button support
- **HNSW indexing** — pgvector indexes for fast cosine similarity searches
- **Fire-and-forget embeddings** — Background embedding generation does not block user actions

---

## Known Limitations

- Vercel Hobby plan has a **10-second function timeout** — keep this in mind as the abstract repository grows
- Voyage AI has rate limits — search requires 3+ words and is triggered by Enter/button click, not keystroke
- Semantic search quality improves as more abstracts are added to the repository

---

## Version History

| Version | Date | Changes |
|---|---|---|
| v1.1 | April 2026 | Migrated to Voyage AI embeddings (512-dim), fixed Vercel build errors, updated API integrations, added abstract view tracking |
| v1.0 | March 2026 | Initial release with HuggingFace embeddings |

---

## License

For academic use only — Capstone Project, Makilala Institute of Science and Technology.