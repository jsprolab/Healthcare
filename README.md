# HealthNavigator.ai

California healthcare provider discovery platform.

## Tech Stack

| Layer     | Technology                        |
| --------- | --------------------------------- |
| Framework | Next.js 15 (App Router)           |
| UI        | React 19 + TailwindCSS v3         |
| Language  | TypeScript (strict)               |
| ORM       | Prisma 6                          |
| Database  | PostgreSQL 15+                    |
| Testing   | Jest 29 + Testing Library         |
| Linting   | ESLint 9 flat config + Prettier 3 |
| Git hooks | Husky v9 + lint-staged            |

---

## Prerequisites

- Node.js ≥ 20 (developed on v25)
- PostgreSQL 15+ (local or Docker)
- npm ≥ 10

---

## Local Setup

### 1. Install dependencies

```bash
npm install
```

`npm install` also runs the `prepare` script, which installs the Husky pre-commit hook automatically.

### 2. Configure environment variables

```bash
cp .env.example .env.local
```

Edit `.env.local`:

```bash
DATABASE_URL="postgresql://postgres:password@localhost:5432/healthnavigator_dev"
NEXT_PUBLIC_BASE_URL="http://localhost:3000"
```

---

## Database Setup

### Option A — Docker (recommended)

```bash
docker run --name healthnav-pg \
  -e POSTGRES_USER=postgres \
  -e POSTGRES_PASSWORD=password \
  -e POSTGRES_DB=healthnavigator_dev \
  -p 5432:5432 \
  -d postgres:15-alpine
```

### Option B — Local PostgreSQL

```sql
CREATE DATABASE healthnavigator_dev;
```

### Apply migrations

```bash
# Create and apply all pending migrations (dev only — prompts for a migration name)
npm run db:migrate

# Generate the TypeScript Prisma client from the schema
npm run db:generate
```

### Seed reference data

Seeds 16 specialties and 30 California cities. Idempotent — safe to run multiple times.

```bash
npm run db:seed
```

### Open Prisma Studio (optional)

```bash
npm run db:studio
# → http://localhost:5555
```

---

## Development Workflow

```bash
# Start dev server
npm run dev               # → http://localhost:3000

# Type-check without building
npm run type-check

# Lint
npm run lint
npm run lint:fix

# Format
npm run format
npm run format:check

# Test
npm test
npm run test:watch
npm run test:coverage
```

### Pre-commit hook

Every commit automatically runs `lint-staged`:

- `*.{ts,tsx}` → `eslint --fix` + `prettier --write`
- `*.{json,css,md}` → `prettier --write`

---

## Project Structure

```
src/
├── app/                    # Next.js App Router
│   ├── api/
│   │   ├── providers/      # GET /api/providers
│   │   │   └── [id]/       # GET /api/providers/:id
│   │   ├── specialties/    # GET /api/specialties
│   │   └── cities/         # GET /api/cities
│   ├── layout.tsx
│   ├── page.tsx
│   ├── error.tsx           # Global error boundary (Client Component)
│   └── not-found.tsx
│
├── components/             # Shared presentational components
├── features/               # Feature modules (co-locate logic + UI + tests)
├── hooks/                  # Custom React hooks
├── lib/
│   └── prisma.ts           # PrismaClient singleton
├── services/               # Server-side data access (pure async functions)
│   ├── providers.ts
│   ├── specialties.ts
│   └── cities.ts
├── styles/
│   └── globals.css
├── types/
│   └── index.ts            # Re-exports Prisma types + app-level interfaces
└── utils/
    └── index.ts            # Pure utility functions
```

---

## API Reference

### `GET /api/providers`

| Param     | Type   | Description                              |
| --------- | ------ | ---------------------------------------- |
| specialty | string | Specialty slug (`cardiology`)            |
| city      | string | City slug (`san-francisco-ca`)           |
| state     | string | 2-letter state code (`CA`)               |
| name      | string | Partial name search                      |
| page      | number | Page number (default: 1)                 |
| limit     | number | Results per page (default: 20, max: 100) |

Response envelope:

```json
{
  "success": true,
  "data": {
    "data": [...],
    "total": 500,
    "page": 1,
    "limit": 20,
    "totalPages": 25
  }
}
```

### `GET /api/providers/:id`

Returns a single provider by CUID. 404 if not found.

### `GET /api/specialties`

All specialties sorted alphabetically. Cached 1 hour.

### `GET /api/cities?state=CA`

Cities filtered by state. Omit `state` to return all. Cached 1 hour.

---

## Database Scripts

| Command                     | Description                                      |
| --------------------------- | ------------------------------------------------ |
| `npm run db:generate`       | Regenerate Prisma client after schema changes    |
| `npm run db:push`           | Push schema changes without creating a migration |
| `npm run db:migrate`        | Create and apply a migration (dev)               |
| `npm run db:migrate:deploy` | Apply pending migrations (CI / production)       |
| `npm run db:seed`           | Seed specialties + California cities             |
| `npm run db:studio`         | Prisma Studio at http://localhost:5555           |
| `npm run db:reset`          | Drop DB, re-run all migrations, re-seed          |

---

## Production Deployment

1. Set `DATABASE_URL` and `NEXT_PUBLIC_BASE_URL` in your environment.
2. Apply migrations: `npm run db:migrate:deploy`
3. Build: `npm run build`
4. Start: `npm run start`

For Vercel: add environment variables in project settings. Build command: `npm run build`. Install command: `npm install`.
