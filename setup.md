# 🛠️ Setup Guide — Capstone Abstract Similarity Library System

This guide will walk you through setting up the project on your local machine from scratch.

---

## Prerequisites

Before anything else, make sure you have the following installed:

### 1. Node.js 18+
Download and install the **LTS version** from [nodejs.org](https://nodejs.org).

Verify the installation:
```powershell
node -v
npm -v
```
You should see version numbers for both. If not, restart your terminal and try again.

### 2. Git
Download and install from [git-scm.com](https://git-scm.com).

Verify the installation:
```powershell
git --version
```

---

## Installation

### Step 1 — Clone the repository
Open a terminal and navigate to where you want to put the project (e.g. your Documents folder):
```powershell
cd C:\Users\yourname\Documents
git clone https://github.com/marturillas497-hash/capstone-library.git
cd capstone-library
```

### Step 2 — Install dependencies
Run this inside the project folder:
```powershell
npm install
```
This installs everything the project needs — Next.js, Supabase, HuggingFace, Tailwind CSS, and more. It may take a minute.

### Step 3 — Create the environment file
Still inside the project folder, create a `.env.local` file:
```powershell
notepad .env.local
```
Paste the following and fill in the actual values (get these from the project owner):
```env
NEXT_PUBLIC_SUPABASE_URL=your_supabase_project_url
NEXT_PUBLIC_SUPABASE_KEY=your_supabase_anon_key
SUPABASE_SERVICE_ROLE_KEY=your_supabase_service_role_key
HUGGINGFACE_API_KEY=your_huggingface_api_key
GROQ_API_KEY=your_groq_api_key
```
Save and close Notepad.

> ⚠️ Never share or commit this file. It is already in `.gitignore`.

### Step 4 — Run the development server
```powershell
npm run dev
```
Open [http://localhost:3000](http://localhost:3000) in your browser. You should see the Capstone Library homepage.

---

## Where to Get the API Keys

| Key | Where to Find It |
|-----|-----------------|
| `NEXT_PUBLIC_SUPABASE_URL` | Supabase → Project Settings → API → Project URL |
| `NEXT_PUBLIC_SUPABASE_KEY` | Supabase → Project Settings → API → anon public key |
| `SUPABASE_SERVICE_ROLE_KEY` | Supabase → Project Settings → API → service_role secret key |
| `HUGGINGFACE_API_KEY` | [huggingface.co](https://huggingface.co) → Settings → Access Tokens |
| `GROQ_API_KEY` | [console.groq.com](https://console.groq.com) → API Keys |

---

## Important Notes

- ✅ You use the **same Supabase project** as the project owner — no need to set up a new database
- ✅ All abstracts, embeddings, and data are already in the database
- ⚠️ Never share your `SUPABASE_SERVICE_ROLE_KEY` or `GROQ_API_KEY` with anyone
- ⚠️ If you see a warning about multiple lockfiles, delete any `package-lock.json` outside the project folder

---

## Common Issues

**White text / invisible text on inputs**
Make sure `globals.css` does not have a dark mode block. The project is light mode only.

**`tailwindcss` not found error**
Check for stray `package.json` or `package-lock.json` files outside the project folder and delete them.

**`supabase` RLS error on register**
Make sure `SUPABASE_SERVICE_ROLE_KEY` is correctly set in `.env.local`.

**Filters not working on Library page**
Run this SQL in your Supabase SQL editor to fix trailing whitespace in department values:
```sql
update abstracts set department = regexp_replace(department, '\s+$', '', 'g') where department is not null;
```

---

## Accounts

### Student
Register at [http://localhost:3000/login](http://localhost:3000/login) using the Register tab.

### Admin
Admin accounts are created manually. Ask the project owner to set up your account.