# Lista de Presença e Presentes

Aplicativo web para confirmar presença em eventos e reservar presentes sem duplicidade, com uma área privada para o anfitrião acompanhar as respostas.

## Run & Operate

- `pnpm --filter @workspace/api-server run dev` — run the API server (port 5000)
- `pnpm run typecheck` — full typecheck across all packages
- `pnpm run build` — typecheck + build all packages
- `pnpm --filter @workspace/api-spec run codegen` — regenerate API hooks and Zod schemas from the OpenAPI spec
- `pnpm --filter @workspace/db run push` — push DB schema changes (dev only)
- Required env: `DATABASE_URL` — Postgres connection string

## Stack

- pnpm workspaces, Node.js 24, TypeScript 5.9
- API: Express 5
- DB: PostgreSQL + Drizzle ORM
- Authentication: Replit-managed Clerk
- Validation: Zod (`zod/v4`), `drizzle-zod`
- API codegen: Orval (from OpenAPI spec)
- Build: esbuild (CJS bundle)

## Where things live

- `artifacts/lista-presenca` — frontend React/Vite, public, guest, and host routes.
- `artifacts/api-server` — Express API, Clerk authentication, and reservation rules.
- `lib/api-spec/openapi.yaml` — single source of truth for API routes and types.
- `lib/db/src/schema` — event, gift, and RSVP tables.

## Architecture decisions

- Clerk managed authentication is used; the browser sends its session cookie and the API protects private routes.
- Exclusive gift reservation is guaranteed by a database unique index and reinforced by visual availability feedback.
- The attached image was transformed into an initial catalog grouped by room/house area.
- The host area compares the signed-in user's primary Clerk email with `ADMIN_EMAIL`.

## Product

- Public invitation page with date, location, and RSVP deadline.
- Branded login and signup screens aligned with the invitation.
- Private guest portal to confirm attendance, add a plus-one, leave a note, and choose or release one gift.
- Host dashboard with metrics, search, filters, and the full guest-to-gift list.

## User preferences

- Interface and copy in Brazilian Portuguese.
- Professional, welcoming editorial identity.

## Gotchas

- To activate host access, set `ADMIN_EMAIL` to one or more primary Clerk emails separated by commas.
- After changing `lib/api-spec/openapi.yaml`, run codegen before using new hooks.
- The frontend uses `/` and the shared API uses `/api`.

## Pointers

- See the `pnpm-workspace` skill for workspace structure, TypeScript setup, and package details