# 📚 Capstone Abstract Similarity Library System

A web-based system that allows students to check the originality of their capstone research proposals by comparing them against existing abstracts using AI-powered similarity analysis.

---

## Features

- **AI Similarity Check** — Compares research proposals against existing abstracts using HuggingFace embeddings (all-MiniLM-L6-v2, 384-dim)
- **Risk Level Report** — Color-coded originality score (Low / Moderate / High / Very High)
- **AI Recommendations** — Groq-powered (llama-3.3-70b-versatile) suggestions to improve research originality
- **Abstract Library** — Browse and search existing capstone abstracts by title, department, or year
- **Student Dashboard** — View past similarity check submissions and their reports
- **Admin Dashboard** — Manage the abstract repository (add, edit, delete, embedding status)
- **Authentication** — Student registration/login and admin login with role-based access control

---

## Tech Stack

| Layer | Technology |
|---|---|
| Framework | Next.js 15 (App Router) |
| Styling | Tailwind CSS v4 |
| Database | Supabase (PostgreSQL + pgvector) |
| Auth | Supabase Auth |
| Embeddings | HuggingFace `all-MiniLM-L6-v2` (384-dim) |
| AI Recommendations | Groq API `llama-3.3-70b-versatile` via OpenAI-compatible SDK |

---

## Getting Started

### Prerequisites
- Node.js 18+
- A Supabase project with pgvector enabled
- HuggingFace API key
- Groq API key

### Installation

```bash
# 1. Clone the repository
git clone https://github.com/marturillas497-hash/mist-rds.git
cd mist-rds

# 2. Install dependencies
npm install

# 3. Create your environment file manually
# Copy the variables listed below into a new .env.local file
# Then fill in your actual keys in .env.local

# 4. Run the development server
npm run dev
```

Open [http://localhost:3000](http://localhost:3000) in your browser.

---

## Environment Variables

Create a `.env.local` file in the project root with the following:

```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
GROQ_API_KEY=your_groq_api_key
```

> ⚠️ Never commit `.env.local` to version control. It is already gitignored.

---

## Database Setup

This project uses Supabase with the following tables:

- `abstracts` — stores capstone abstracts and their vector embeddings
- `profiles` — extends Supabase Auth users with role, department, year level, and section
- `similarity_reports` — stores student similarity check results and AI recommendations

RLS (Row Level Security) is enabled on all tables.

---

## Admin Setup

1. Create a user in Supabase Authentication dashboard
2. Run the following SQL to assign the admin role:

```sql
insert into profiles (id, role, full_name)
values ('<user-uuid>', 'admin', 'Your Name');
```

---

## Project Structure

```
app/
├── admin/          # Admin dashboard (manage abstracts)
├── api/            # API routes (abstracts, analyze, auth)
├── dashboard/      # Student submission history
├── library/        # Public abstract browser
├── login/          # Shared login + register page
└── submit/         # Similarity check submission page
lib/
├── supabase/       # Supabase client (browser + server)
└── constants.js    # Departments, risk colors
```

---

## Known Limitations

- API routes do not verify auth on every request (relies on RLS and middleware)
- Embedding generation is asynchronous — newly added abstracts may not be searchable immediately
- The `/library/[id]` detail page uses a static navbar (no auth state) since it is a Server Component

---

## License

For academic use only — 3rd Year Capstone Project.
