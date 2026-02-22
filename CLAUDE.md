# CLAUDE.md — Clerk MCP Server

## Project Overview

This is a **Model Context Protocol (MCP) server for Clerk**, built with **Nuxt 3** and the **@nuxtjs/mcp-toolkit** module. It exposes Clerk's Backend API (organizations, users, memberships, invitations, metadata) as MCP tools that AI assistants (Claude, Cursor, VS Code Copilot, Windsurf) can call.

The MCP endpoint is served at `/mcp` by the Nuxt dev server.

## Tech Stack

| Dependency | Role | Version |
|---|---|---|
| `nuxt` | Full-stack Vue framework (Nitro server engine) | ^3.17 |
| `@nuxtjs/mcp-toolkit` | Nuxt module — auto-discovers MCP tools/resources/prompts in `server/mcp/` | ^0.5 |
| `@clerk/backend` | Clerk Backend SDK — server-side API client | ^2.30 |
| `zod` | Schema validation for MCP tool input parameters | ^4.0 |
| `typescript` | Type checking | ^5.7 |
| `vue` / `vue-router` | Frontend (minimal — just a landing page) | ^3.5 / ^4.5 |

## Project Structure

```
clerk-mcp-server/
├── server/
│   ├── middleware/
│   │   └── clerk-key.ts                    # Extracts X-Clerk-Secret-Key header (public mode)
│   ├── mcp/
│   │   └── tools/                          # MCP tools (auto-discovered by @nuxtjs/mcp-toolkit)
│   │       ├── clerk-list-organizations.ts
│   │       ├── clerk-get-organization.ts
│   │       ├── clerk-create-organization.ts
│   │       ├── clerk-update-organization-metadata.ts
│   │       ├── clerk-list-organization-members.ts
│   │       ├── clerk-update-member-role.ts
│   │       ├── clerk-update-member-metadata.ts
│   │       ├── clerk-list-organization-invitations.ts
│   │       ├── clerk-delete-organization.ts
│   │       ├── clerk-create-invitation.ts
│   │       ├── clerk-remove-member.ts
│   │       ├── clerk-list-users.ts
│   │       ├── clerk-get-user.ts
│   │       └── clerk-update-user-metadata.ts
│   ├── api/
│   │   └── health.get.ts                   # GET /api/health — readiness probe
│   └── utils/
│       └── clerk.ts                        # Clerk client (dual-mode) + helpers
├── docs/
│   └── USAGE.md                            # Full usage guide for both modes
├── app.vue                                 # Landing page (lists available tools)
├── nuxt.config.ts                          # Nuxt config (modules, runtimeConfig, asyncContext)
├── Dockerfile                              # Multi-stage production Docker build
├── docker-compose.yml                      # Both hosted and public mode services
├── .dockerignore
├── tsconfig.json                           # Extends .nuxt/tsconfig.json
├── package.json
├── package-lock.json
├── .env.example                            # Template for CLERK_SECRET_KEY
├── .github/
│   └── workflows/
│       └── ci.yml                          # GitHub Actions: lint, typecheck, build
├── eslint.config.mjs                       # ESLint flat config (via @nuxt/eslint)
├── .gitignore
├── README.md
└── CLAUDE.md                               # This file
```

## Key Architectural Concepts

### Auto-Discovery

The `@nuxtjs/mcp-toolkit` module auto-discovers files in `server/mcp/tools/`. Each file must `export default defineMcpTool({...})`. No manual registration is needed — just create a file and it appears as an MCP tool.

### Auto-Imports

The following are globally available in `server/` files without explicit imports (provided by Nuxt and @nuxtjs/mcp-toolkit):

- **`defineMcpTool`** — defines an MCP tool
- **`jsonResult(data)`** — wraps data as a JSON MCP response
- **`errorResult(message)`** — returns an error MCP response
- **`useRuntimeConfig()`** — access Nuxt runtime config (e.g., `clerkSecretKey`)

Utilities in `server/utils/` are also auto-imported. So `useClerkClient()`, `clerkCall()`, and `formatDate()` from `server/utils/clerk.ts` are available everywhere in server code without imports.

### Dual-Mode Architecture (Hosted vs Public)

The server supports two operating modes, auto-detected at runtime:

**Hosted mode** — `CLERK_SECRET_KEY` is set in `.env`. The server creates a singleton Clerk client shared by all requests. Best for private/self-hosted deployments.

**Public mode** — No `CLERK_SECRET_KEY` in env. Users provide their own Clerk key via the `X-Clerk-Secret-Key` HTTP header on each request. The middleware in `server/middleware/clerk-key.ts` extracts this header and stores it in `event.context.clerkSecretKey`. A per-request Clerk client is created for each call. Best for shared/multi-tenant deployments.

The `nitro.experimental.asyncContext` setting in `nuxt.config.ts` enables `useEvent()` inside server utility functions (required for public mode to access the request context).

### Clerk Client Pattern

`server/utils/clerk.ts` provides:

- **`useClerkClient()`** — returns a Clerk Backend client. In hosted mode, returns a singleton. In public mode, creates a per-request client using the key from `event.context.clerkSecretKey` (set by the middleware).
- **`clerkCall(fn)`** — wraps any Clerk SDK call with unified error handling. Extracts meaningful error messages from Clerk's error format.
- **`formatDate(timestamp)`** — converts Clerk's millisecond timestamps to ISO strings.

### MCP Tool Anatomy

Every tool file follows this pattern:

```typescript
import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_tool_name',           // Snake-case, prefixed with clerk_
  description: '...',                 // Used by AI to decide when to call the tool
  inputSchema: {                      // Zod v4 schemas for each parameter
    param: z.string().describe('...'),
  },
  annotations: {                      // MCP hints for AI clients
    readOnlyHint: true,               // true for read ops, false for writes
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ param }) {
    const clerk = useClerkClient()
    const result = await clerkCall(() => clerk.someApi.someMethod({ param }))
    return jsonResult(result)
  },
})
```

### Zod v4 Notes

This project uses **Zod v4** (required by `@nuxtjs/mcp-toolkit` ^0.5). Key differences from v3:

- `z.record()` requires two arguments: `z.record(z.string(), z.unknown())` (not `z.record(z.unknown())`)
- String format validators moved to top-level: `z.email()` instead of `z.string().email()`
- `message` param renamed to `error` for custom error messages
- Standard usage (`z.string()`, `.optional()`, `.describe()`, `.min()`, `.max()`, `.enum()`, `.array()`) is unchanged

## Available MCP Tools

| Tool Name | File | Type | Description |
|---|---|---|---|
| `clerk_list_organizations` | `clerk-list-organizations.ts` | Read | List orgs with filtering, pagination, member counts |
| `clerk_get_organization` | `clerk-get-organization.ts` | Read | Get org by ID or slug with metadata |
| `clerk_create_organization` | `clerk-create-organization.ts` | Write | Create a new organization |
| `clerk_update_organization_metadata` | `clerk-update-organization-metadata.ts` | Write | Update org public/private metadata |
| `clerk_list_organization_members` | `clerk-list-organization-members.ts` | Read | List org members with roles and user data |
| `clerk_update_member_role` | `clerk-update-member-role.ts` | Write | Change a member's role |
| `clerk_update_member_metadata` | `clerk-update-member-metadata.ts` | Write | Update membership metadata |
| `clerk_list_organization_invitations` | `clerk-list-organization-invitations.ts` | Read | List org invitations by status |
| `clerk_list_users` | `clerk-list-users.ts` | Read | List users with search/filter |
| `clerk_get_user` | `clerk-get-user.ts` | Read | Get full user profile |
| `clerk_delete_organization` | `clerk-delete-organization.ts` | Write | Delete an organization (irreversible) |
| `clerk_create_invitation` | `clerk-create-invitation.ts` | Write | Invite a user to an org by email |
| `clerk_remove_member` | `clerk-remove-member.ts` | Write | Remove a member from an org |
| `clerk_update_user_metadata` | `clerk-update-user-metadata.ts` | Write | Update user public/private/unsafe metadata |

## Development Commands

```bash
npm install          # Install dependencies (runs `nuxt prepare` via postinstall)
npm run dev          # Start dev server at http://localhost:3000 (MCP at /mcp)
npm run build        # Production build (outputs to .output/)
npm run preview      # Preview production build locally
npm run lint         # Run ESLint
npm run lint:fix     # Run ESLint with auto-fix
npm run typecheck    # Run vue-tsc type checking
```

## Environment Variables

| Variable | Required | Description |
|---|---|---|
| `CLERK_SECRET_KEY` | Hosted mode only | Clerk Backend API secret key (starts with `sk_live_` or `sk_test_`). If set, enables hosted mode. If not set, enables public mode (key from header). |

In hosted mode: set in `.env` (copy from `.env.example`). Accessed via `useRuntimeConfig().clerkSecretKey`.
In public mode: no env var needed — users provide the key via `X-Clerk-Secret-Key` header.

## Conventions for Adding New Tools

1. **Create a file** in `server/mcp/tools/` named `clerk-<action>.ts`
2. **Name the tool** with `clerk_` prefix and snake_case: `clerk_<action>`
3. **Use Zod v4** for `inputSchema` — every parameter needs `.describe()` for AI context
4. **Set `annotations`** — mark `readOnlyHint: true` for read operations
5. **Use `useClerkClient()`** for the Clerk SDK client
6. **Wrap API calls** with `clerkCall()` for consistent error handling
7. **Return `jsonResult()`** for success or `errorResult()` for validation failures
8. **Pagination pattern**: accept `limit`/`offset`, return `{ data, totalCount, count, offset, hasMore }`

## Common Patterns

### Pagination Response

All list endpoints return a consistent pagination shape:

```typescript
return jsonResult({
  items,                                    // The actual data array
  totalCount,                               // Total items matching the query
  count: items.length,                      // Items in this page
  offset: offset ?? 0,                      // Current offset
  hasMore: (offset ?? 0) + items.length < totalCount,
})
```

### Error Handling

- Input validation errors: return `errorResult('message')` directly in the handler
- Clerk API errors: caught by `clerkCall()` wrapper, which throws a formatted `Error`

### Metadata Updates

Clerk metadata is merge-based (not replace). Setting a key to `null` removes it. The `z.record(z.string(), z.unknown())` schema allows arbitrary JSON objects.

## CI / GitHub Actions

`.github/workflows/ci.yml` runs on every push and PR to `master`:

1. **Lint** — `npm run lint` (ESLint via `@nuxt/eslint`)
2. **Type Check** — `npm run typecheck` (vue-tsc via `nuxt typecheck`)
3. **Build** — `npm run build` (runs after lint + typecheck pass)

## Health Check

`GET /api/health` returns the server status:

- **Hosted mode**: verifies Clerk key by making a lightweight API call → `{ status: "ok", mode: "hosted", clerkConnected: true }`
- **Public mode**: confirms server is up → `{ status: "ok", mode: "public", clerkConnected: null }`
- **Degraded**: Clerk key is invalid or API unreachable → `{ status: "degraded", mode: "hosted", clerkConnected: false, error: "..." }`

Useful as a Docker/Kubernetes readiness probe.

## Testing

There are no automated tests yet. To verify tools manually:

1. Start the dev server: `npm run dev`
2. Open `http://localhost:3000/mcp` — should return MCP protocol response
3. Use the Nuxt DevTools MCP Inspector to test individual tools
4. Or connect an AI client (Claude Desktop, Cursor, etc.) and invoke tools

## Docker

A multi-stage `Dockerfile` is included for production builds:

```bash
docker build -t clerk-mcp .

# Hosted mode
docker run -p 3000:3000 -e CLERK_SECRET_KEY=sk_live_xxx clerk-mcp

# Public mode (no key)
docker run -p 3000:3000 clerk-mcp
```

`docker-compose.yml` defines both modes: `clerk-mcp-hosted` (port 3000) and `clerk-mcp-public` (port 3001).

## Deployment

Build and deploy as any Nuxt app:

```bash
npm run build
node .output/server/index.mjs
```

For hosted mode, set `CLERK_SECRET_KEY` in your hosting provider. For public mode, no server-side key is needed. The MCP endpoint will be at `<your-domain>/mcp`.

Compatible with Vercel, Netlify, Cloudflare Workers (with nitro preset), or any Node.js host.

## Important Notes

- **Never commit `.env`** — it contains your Clerk secret key. Use `.env.example` as a template.
- **Clerk SDK calls are server-side only** — the `server/` directory runs on Nitro, never in the browser.
- **`app.vue` is just a landing page** — it lists available tools for human visitors. The real work happens in `server/`.
- **The `@nuxtjs/mcp-toolkit` handles all MCP protocol details** — SSE transport, tool listing, schema validation. Tool files only need to define inputs and handler logic.
