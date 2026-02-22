# Usage Guide — Clerk MCP Server

This server exposes Clerk's Backend API as MCP tools. AI assistants (Claude, Cursor, VS Code Copilot, Windsurf) can call these tools to manage your Clerk organizations, users, memberships, invitations, and metadata.

---

## Two Operating Modes

### 1. Hosted Mode (Private)

The server owns the Clerk secret key. You set `CLERK_SECRET_KEY` in the `.env` file (or environment variable) and all requests use that single key.

**Best for:** Personal use, internal teams, self-hosted deployments.

```bash
# .env
CLERK_SECRET_KEY=sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

```bash
npm run dev
# MCP endpoint: http://localhost:3000/mcp
```

### 2. Public Mode (Multi-Tenant)

No `CLERK_SECRET_KEY` is set on the server. Each user provides their own Clerk secret key via the `X-Clerk-Secret-Key` HTTP header on every request.

**Best for:** Shared/public deployments where multiple users connect with their own Clerk accounts.

```bash
# No .env needed — just start the server
npm run dev
```

Clients must pass the header:

```
X-Clerk-Secret-Key: sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
```

The mode is **auto-detected**: if `CLERK_SECRET_KEY` is set in the environment, it runs in hosted mode. If not, it runs in public mode.

---

## Connecting AI Clients

### Claude Desktop

Add to `~/Library/Application Support/Claude/claude_desktop_config.json` (macOS) or `%APPDATA%\Claude\claude_desktop_config.json` (Windows):

**Hosted mode:**

```json
{
  "mcpServers": {
    "clerk": {
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp"]
    }
  }
}
```

**Public mode:**

```json
{
  "mcpServers": {
    "clerk": {
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3000/mcp",
        "--header",
        "X-Clerk-Secret-Key: sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
```

### Claude Code (CLI)

**Hosted mode:**

```bash
claude mcp add --transport http clerk http://localhost:3000/mcp
```

**Public mode:**

```bash
claude mcp add --transport http \
  --header "X-Clerk-Secret-Key: sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  clerk http://localhost:3000/mcp
```

### Cursor

Go to **Settings → MCP → Add Server**:

**Hosted mode:**

```json
{
  "mcpServers": {
    "clerk": {
      "url": "http://localhost:3000/mcp"
    }
  }
}
```

**Public mode:**

```json
{
  "mcpServers": {
    "clerk": {
      "url": "http://localhost:3000/mcp",
      "headers": {
        "X-Clerk-Secret-Key": "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to `.vscode/mcp.json` in your workspace:

**Hosted mode:**

```json
{
  "mcp": {
    "servers": {
      "clerk": {
        "url": "http://localhost:3000/mcp"
      }
    }
  }
}
```

**Public mode:**

```json
{
  "mcp": {
    "servers": {
      "clerk": {
        "url": "http://localhost:3000/mcp",
        "headers": {
          "X-Clerk-Secret-Key": "sk_live_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        }
      }
    }
  }
}
```

### Windsurf

Add to MCP settings:

```json
{
  "context_servers": {
    "clerk": {
      "source": "custom",
      "command": "npx",
      "args": ["mcp-remote", "http://localhost:3000/mcp"],
      "env": {}
    }
  }
}
```

For public mode, add `"--header", "X-Clerk-Secret-Key: sk_live_xxx"` to the `args` array.

---

## Running with Docker

### Build the image

```bash
docker build -t clerk-mcp .
```

### Hosted mode

```bash
docker run -p 3000:3000 -e CLERK_SECRET_KEY=sk_live_xxx clerk-mcp
```

### Public mode

```bash
docker run -p 3000:3000 clerk-mcp
```

### Docker Compose

```bash
# Hosted mode (port 3000) — set CLERK_SECRET_KEY in .env first
docker compose up clerk-mcp-hosted

# Public mode (port 3001) — no key needed on server
docker compose up clerk-mcp-public
```

---

## Available Tools

Once connected, your AI assistant can call any of these tools:

### Organizations

| Tool | What it does |
|------|-------------|
| `clerk_list_organizations` | List orgs with filtering by name/slug, pagination, and member counts |
| `clerk_get_organization` | Get full org details by ID or slug (metadata, member limits, timestamps) |
| `clerk_create_organization` | Create a new org with name, slug, metadata, and optional creator |
| `clerk_update_organization_metadata` | Merge-update org public/private metadata (set key to `null` to delete) |
| `clerk_delete_organization` | Delete an organization permanently (irreversible) |

### Members

| Tool | What it does |
|------|-------------|
| `clerk_list_organization_members` | List org members with roles, user data, and membership metadata |
| `clerk_update_member_role` | Change a member's role (e.g. `org:admin`, `org:member`, or custom) |
| `clerk_update_member_metadata` | Update a member's public/private membership metadata |
| `clerk_remove_member` | Remove a member from an organization |

### Invitations

| Tool | What it does |
|------|-------------|
| `clerk_list_organization_invitations` | List invitations filtered by status (pending, accepted, revoked) |
| `clerk_create_invitation` | Invite a user to an org by email (sends invitation email) |

### Users

| Tool | What it does |
|------|-------------|
| `clerk_list_users` | List all instance users with search by name/email/phone |
| `clerk_get_user` | Get full user profile: emails, phones, external accounts, metadata |
| `clerk_update_user_metadata` | Update user public/private/unsafe metadata |

---

## Example Prompts

Here are things you can ask your AI assistant once the MCP server is connected:

```
List all organizations in my Clerk instance.

How many members does the "engineering" organization have?

Create a new organization called "Design Team" with slug "design-team".

Show me all pending invitations for organization org_2abc123.

Update the public metadata for user user_2xyz789 to set plan: "pro".

What role does user_2abc in the engineering org have? Change it to org:admin.

Find all users with email addresses containing "@example.com".

Get the full profile for user user_2abc123 including external accounts.
```

---

## Pagination

All list tools support pagination:

- **`limit`** — Max results per page (default 20)
- **`offset`** — Skip this many results

The response includes:

```json
{
  "totalCount": 150,
  "count": 20,
  "offset": 0,
  "hasMore": true
}
```

Ask the assistant to "show the next page" and it will increment the offset automatically.

---

## Metadata

Clerk metadata is **merge-based** — updating metadata merges new keys with existing ones. To remove a key, set it to `null`.

Three types of metadata:
- **Public** — readable from Frontend + Backend API
- **Private** — only readable from Backend API (server-side)
- **Unsafe** — readable and writable from Frontend API (users only, not orgs)

---

## Deployment

Build and deploy as any Nuxt/Node.js app:

```bash
npm run build
node .output/server/index.mjs
```

Or use Docker:

```bash
docker build -t clerk-mcp .
docker run -p 3000:3000 -e CLERK_SECRET_KEY=sk_live_xxx clerk-mcp
```

Replace `http://localhost:3000/mcp` with your production URL in all client configs.

Compatible with: Vercel, Netlify, Cloudflare Workers (with nitro preset), Railway, Fly.io, or any Node.js host.
