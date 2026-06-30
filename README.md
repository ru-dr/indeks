<p align="center">
  <img src="https://ucarecdn.com/c5a29e25-d71b-45c0-89e0-7653eea0b7cf/INDEKSdark.svg" alt="Indeks" width="280"/>
</p>

<p align="center">
  Self-hosted, privacy-first web analytics platform — the dashboard and ingestion service that powers the
  <a href="https://github.com/ru-dr/indeks-sdk"><code>@indeks/*</code> SDK</a>.
</p>

<p align="center">
  <a href="https://www.typescriptlang.org/"><img src="https://img.shields.io/badge/TypeScript-5.0-blue?style=flat-square&logo=typescript" alt="TypeScript"></a>
  <a href="https://nextjs.org/"><img src="https://img.shields.io/badge/Next.js-16-black?style=flat-square&logo=next.js" alt="Next.js"></a>
  <a href="https://bun.sh"><img src="https://img.shields.io/badge/Bun-1.0-orange?style=flat-square&logo=bun" alt="Bun"></a>
  <a href="https://clickhouse.com/"><img src="https://img.shields.io/badge/ClickHouse-events-yellow?style=flat-square&logo=clickhouse" alt="ClickHouse"></a>
</p>

## What is this

Indeks is the dashboard + ingestion backend you self-host to receive, store, and visualize events sent
by the [Indeks SDK](https://github.com/ru-dr/indeks-sdk) (`@indeks/core`, `@indeks/react`). Events land in
ClickHouse for fast analytical queries, while app data — users, projects, auth — lives in Postgres.

## Architecture

| Layer | Tech |
|---|---|
| Dashboard UI | Next.js 16 (Turbopack), Tailwind v4, Radix UI / Base UI, `lucide-react` |
| Ingestion API | [Elysia](https://elysiajs.com/) (`@elysiajs/cors`, `@elysiajs/openapi`) |
| Event storage | ClickHouse (`@clickhouse/client`) |
| App data | PostgreSQL via [Neon](https://neon.tech) (`@neondatabase/serverless`) + [Drizzle ORM](https://orm.drizzle.team/) |
| Auth | [better-auth](https://www.better-auth.com/) |
| Email | [Plunk](https://useplunk.com/), React Email, Nodemailer |
| Live visitor view | [cobe](https://cobe.vercel.app/) (interactive globe) |

Events captured by the SDK are processed by the ingestion service and persisted to the database — see
[`indeks.md`](./indeks.md) for the full event schema (clicks, scrolls, sessions, rage clicks, form
abandonment, performance metrics, and more).

## Getting Started

### Prerequisites

- [Bun](https://bun.sh)
- A PostgreSQL database (Neon recommended)
- A ClickHouse instance

### Installation

```bash
git clone https://github.com/ru-dr/indeks.git
cd indeks
bun install
```

### Environment Variables

Create a `.env` in the project root. At minimum you'll need credentials for:

```
# Postgres (app data — users, projects, sessions)
DATABASE_URL=

# ClickHouse (event storage)
CLICKHOUSE_URL=
CLICKHOUSE_USER=
CLICKHOUSE_PASSWORD=

# Auth
BETTER_AUTH_SECRET=

# Email (Plunk)
PLUNK_API_KEY=
```

> Exact variable names should match what's read in your config/auth setup — adjust these to whatever your
> code actually expects.

### Development

```bash
bun run dev      # start dev server (Turbopack)
bun run build    # production build
bun run start    # start production server
bun run check    # typecheck + lint
bun run lint     # lint only
```

Open <http://localhost:3000>.

### Database

Schema is managed with [Drizzle](https://orm.drizzle.team/) (`drizzle.config.ts`). Use the Drizzle Kit CLI
directly for generating/running migrations, e.g.:

```bash
bunx drizzle-kit generate
bunx drizzle-kit migrate
```

## Event Schema

Full documentation of every event type and its payload — base event fields, device data, session events,
rage/frustration detection, form events, performance metrics, and custom events — lives in
[`indeks.md`](./indeks.md).

## Privacy

Indeks is self-hosted by design: your event data stays in your own ClickHouse and Postgres instances.
Nothing is sent to a third party.

## Related

- [`indeks-sdk`](https://github.com/ru-dr/indeks-sdk) — `@indeks/core`, `@indeks/react`, `@indeks/shared`,
  the client SDK that sends events to this platform.

## Deployment

Includes a `vercel.json` — deployable to [Vercel](https://vercel.com) out of the box for the Next.js app.
ClickHouse and Postgres should be hosted separately.

## License

No license file is currently set on this repo. Add a `LICENSE` to make the terms explicit (the SDK repo
uses MIT, for reference).
