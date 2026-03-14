# 📚 MIST Research Discovery System

A web-based system for Makilala Institute of Science and Technology that allows students to check the originality of their capstone research proposals by comparing them against existing abstracts using AI-powered similarity analysis.

---

## Features

- **AI Similarity Check** — Compares research proposals against existing abstracts using local BGE embeddings (`bge-small-en-v1.5`, 384-dim) in development and HuggingFace Inference API in production
- **Semantic Library Search** — Search abstracts by concept or topic using vector similarity (triggers on 2+ words), with keyword fallback for short queries
- **Risk Level Report** — Color-coded originality score: GREEN (<40%) · YELLOW (40–59%) · ORANGE (60–79%) · RED (≥80%)
- **AI Recommendations** — Groq-powered (`llama-3.3-70b-versatile`) advisory notes tailored to the student's risk level and field
- **Abstract Library** — Browse and search existing capstone abstracts by title, department, or year — requires login
- **Student Dashboard** — View past similarity check submissions and their full reports
- **Admin Dashboard** — Manage the abstract repository (add, edit, delete, embedding status)
- **Rate Limiting** — Students are limited to 5 similarity checks per day; admins are exempt
- **Authentication** — Student registration/login with role-based access control; admins bypass via the same login page

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth (`@supabase/ssr`) |
| Embeddings (dev) | Transformers.js — `Xenova/bge-small-en-v1.5` (local, no API needed) |
| Embeddings (prod) | HuggingFace Inference API — `BAAI/bge-small-en-v1.5` |
| AI Recommendations | Groq API `llama-3.3-70b-versatile` via OpenAI-compatible SDK |
| Deployment | Vercel |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project with pgvector enabled
- HuggingFace API key (production only)
- Groq API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/marturillas497-hash/mist-rds.git
cd mist-rds

# 2. Install dependencies
npm install

# 3. Create your environment file
# Copy the variables listed below into a new .env.local file

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

> **Note:** On first run, Transformers.js will download the `bge-small-en-v1.5` model (~33MB). This only happens once and is cached locally.

---

## Environment Variables

Create a `.env.local` file in the project root:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_ANON_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HUGGINGFACE_API_KEY=your_huggingface_api_key   # production only
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ Never commit `.env.local` to version control. It is already gitignored.

---

## Database Setup

This project uses Supabase with the following tables:

| Table | Description |
|---|---|
| `abstracts` | Capstone abstracts and their 384-dim vector embeddings |
| `profiles` | Extends Supabase Auth users with role, department, year level, section, and student ID |
| `similarity_reports` | Student similarity check results, risk levels, and AI recommendations |

RLS (Row Level Security) is enabled on all tables.

---

## Admin Setup

1. Create a user in the Supabase Authentication dashboard
2. Run the following SQL to assign the admin role:

```sql
INSERT INTO profiles (id, role, full_name)
VALUES ('<user-uuid>', 'admin', 'Your Name');
```

Admins log in through the same `/login` page as students — the system detects the role and redirects to `/admin` automatically.

---

## How Embeddings Work

- **Development** — embeddings are generated locally using Transformers.js (no API key needed)
- **Production (Vercel)** — embeddings are generated via the HuggingFace Inference API due to Vercel's serverless function timeout constraints
- Embeddings are generated **synchronously** when adding abstracts (awaited before response)
- Embeddings are regenerated automatically when an abstract's title or text is edited
- Search queries use a BGE query prefix for improved retrieval accuracy; stored documents do not

---

## Rate Limiting

Students are limited to **5 similarity checks per day**, tracked via the `similarity_reports` table (no external service needed). The submit page shows a live usage indicator. Admins are exempt from this limit.

---

## Project Structure

```
app/
├── admin/          # Admin dashboard (manage abstracts)
├── api/
│   ├── abstracts/  # CRUD for abstracts + embedding generation
│   ├── analyze/    # Similarity check endpoint (rate-limited)
│   ├── auth/       # Student registration
│   └── search/     # Semantic search endpoint
├── dashboard/      # Student submission history and report view
├── library/        # Abstract browser with semantic search (login required)
├── login/          # Shared login + register page
└── submit/         # Similarity check submission page
lib/
├── api-auth.js     # requireAuth / requireAdmin helpers
├── embeddings.js   # Hybrid local/API embedding with BGE query prefix
├── supabase/       # Supabase client (browser + server)
└── constants.js    # Departments list, risk level config
```

---

## Known Limitations

- Vercel Hobby plan has a 10s function timeout — the HuggingFace API is used in production to avoid cold-start timeouts from loading the local ONNX model
- The `all-MiniLM-L6-v2` / `bge-small-en-v1.5` models have a ~380 word effective limit; longer abstracts are silently truncated
- Semantic search quality improves as more abstracts are added to the repository

---

## License

For academic use only — Capstone Project, Makilala Institute of Science and Technology.