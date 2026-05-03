# WealthPlanrAI

AI-powered financial planning platform for modern advisors.

## Tech Stack

| Layer      | Technology                  |
|------------|-----------------------------|
| Frontend   | Next.js 14 (App Router)     |
| Styling    | Tailwind CSS                |
| Backend    | Next.js API Routes          |
| Database   | Supabase (PostgreSQL)       |
| Auth       | Supabase Auth               |
| Hosting    | Vercel                      |
| Language   | TypeScript                  |

---

## Quick Start

### 1. Clone and install

```bash
git clone <your-repo>
cd wealthplanrai
npm install
```

### 2. Set up Supabase

1. Go to [supabase.com](https://supabase.com) and create a new project
2. In your project dashboard, go to **Settings → API**
3. Copy your **Project URL** and **anon public** key
4. Copy your **service_role** key (keep this secret)

### 3. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local` with your values:

```env
NEXT_PUBLIC_SUPABASE_URL=https://your-project-ref.supabase.co
NEXT_PUBLIC_SUPABASE_ANON_KEY=your-anon-key
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
NEXT_PUBLIC_APP_URL=http://localhost:3000
```

### 4. Run the database migration

In your Supabase project → SQL Editor, paste and run:

```
supabase/migrations/001_initial_schema.sql
```

Or with Supabase CLI:

```bash
npx supabase db push
```

### 5. Run the development server

```bash
npm run dev
```

Open [http://localhost:3000](http://localhost:3000)

---

## Project Structure

```
src/
├── app/
│   ├── page.tsx              ← Homepage (marketing)
│   ├── assessment/page.tsx   ← Multi-step wealth assessment
│   ├── results/page.tsx      ← Assessment results
│   ├── dashboard/
│   │   ├── layout.tsx        ← Sidebar layout (auth protected)
│   │   └── page.tsx          ← Dashboard overview
│   ├── auth/login/page.tsx   ← Sign in / Sign up
│   └── api/
│       ├── auth/callback/    ← Supabase auth callback
│       └── assessment/       ← Assessment scoring API
├── components/
│   ├── ui/                   ← Button, Card, Input, Badge, etc.
│   └── layout/               ← Navbar, Sidebar
├── lib/
│   ├── supabase/             ← Browser + server clients
│   └── utils.ts              ← cn(), formatters, scoring logic
└── types/index.ts            ← All TypeScript interfaces
```

---

## Deploy to Vercel

```bash
npm install -g vercel
vercel
```

Set the same environment variables in your Vercel project settings.

In Supabase, set your **Site URL** and **Redirect URLs**:
- Site URL: `https://your-app.vercel.app`
- Redirect URLs: `https://your-app.vercel.app/api/auth/callback`

---

## Pages

| Route          | Description                          | Auth required |
|----------------|--------------------------------------|---------------|
| `/`            | Marketing homepage                   | No            |
| `/assessment`  | 4-step wealth assessment form        | No            |
| `/results`     | Assessment results + allocation      | No            |
| `/dashboard`   | Advisor dashboard overview           | Yes           |
| `/auth/login`  | Sign in / Sign up                    | No            |

---

## Next Steps to Build

- [ ] `/dashboard/clients` — Client list + profiles
- [ ] `/dashboard/advisor` — AI chat interface (Claude API)
- [ ] `/dashboard/documents` — Document upload + analysis
- [ ] `/dashboard/compliance` — Compliance center
- [ ] Stripe subscription integration
- [ ] SendGrid email reports
- [ ] Monte Carlo simulation tool
- [ ] Tax-loss harvesting analyzer

---

## Regulatory Notice

This platform is designed for use by licensed financial advisors only.
All AI-generated content requires professional review before client use.
Not investment advice. Subject to FINRA, SEC, and applicable regulations.
