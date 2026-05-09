# admitus

admitus is a graduate admissions workspace for finding programs, tracking applications, managing documents, logging supervisor outreach, and monitoring funding readiness.

## Features

- Program search with AI-assisted extraction
- Application pipeline and deadline tracking
- Document and recommender management
- Supervisor outreach tracking
- Insights dashboard with deadline pressure, communication gaps, professor reply rates, and FAFO Funding Meter
- Email/password authentication with email verification

## Tech Stack

- Next.js 16
- React 19
- Tailwind CSS
- Drizzle ORM
- Bun SQLite runtime
- OpenRouter for LLM features
- Resend for verification emails

## Getting Started

Install dependencies:

```bash
bun install
```

Create `.env.local`:

```bash
AUTH_SECRET="replace-with-a-long-random-secret"
OPENROUTER_API_KEY="your-openrouter-key"
RESEND_API_KEY="your-resend-key"
EMAIL_FROM="admitus <your-verified-sender@example.com>"
NEXT_PUBLIC_APP_URL="http://localhost:3000"
```

Run the development server:

```bash
bun run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Authentication

Users register with name, email, and password. Passwords are hashed server-side with `scrypt`. New accounts must verify their email before signing in.

In development, if `RESEND_API_KEY` is not configured, the app prints and displays a dev verification link so local testing is still possible.

## Database

The current app uses SQLite through `bun:sqlite`. Local database files are ignored by git.

For a production web deployment with multiple users, migrate the database to a hosted persistent database such as Postgres, Neon, Turso, or another managed provider, and add per-user ownership columns to all user data tables.

## Scripts

```bash
bun run dev       # start development server
bun run build     # production build
bun run start     # start production server
bun run lint      # run eslint
bun run db:seed   # seed local database
```

## Deployment Notes

Set these environment variables in production:

- `AUTH_SECRET`
- `OPENROUTER_API_KEY`
- `RESEND_API_KEY`
- `EMAIL_FROM`
- `NEXT_PUBLIC_APP_URL`

Use a verified sender/domain in Resend before sending verification emails to real users.
