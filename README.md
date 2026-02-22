# Clerk MCP Server

A [Model Context Protocol (MCP)](https://modelcontextprotocol.io/) server for [Clerk](https://clerk.com), built with **Nuxt** and the **@nuxtjs/mcp-toolkit**.

Query and manage your Clerk organizations, members, users, roles, and metadata directly from AI assistants like Claude, Cursor, VS Code Copilot, Windsurf, and more.

---

## Getting Your Clerk API Key

You need a **Clerk Secret Key** to use this server.

1. Go to [dashboard.clerk.com](https://dashboard.clerk.com) and sign in (or create an account)
2. Select your application (or create one)
3. Navigate to **Configure** → **API Keys**
4. Copy the **Secret Key** — it starts with `sk_test_` (development) or `sk_live_` (production)

> **Never commit your secret key to git.** Use environment variables or pass it via headers.

---

## Two Operating Modes

The server supports two modes, auto-detected at startup:

### Hosted Mode (Private)

The server owns the Clerk secret key. Set `CLERK_SECRET_KEY` in your `.env` file and all requests use that single key. No headers needed from clients.

**Best for:** Personal use, internal teams, self-hosted deployments.

### Public Mode (Per-Request Key)

No secret key on the server. Each client passes their own key via the `X-Clerk-Secret-Key` HTTP header on every request. The server creates a fresh Clerk client per request.

**Best for:** Shared deployments, multi-tenant setups, or when you don't want the key stored on the server.

| | Hosted Mode | Public Mode |
|---|---|---|
| Key stored on server | Yes (in `.env`) | No |
| Key sent per request | No | Yes (via header) |
| Setup complexity | Simpler | Slightly more config |
| Multi-user support | Single Clerk account | Multiple Clerk accounts |

---

## Quick Start

### 1. Clone & install

```bash
git clone https://github.com/BalajiSriraman/Clerk-MCP.git
cd Clerk-MCP
npm install
```

### 2. Configure & run

**Hosted mode** — set the key once on the server:

```bash
cp .env.example .env
# Edit .env and paste your secret key:
# CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx
npm run dev
```

**Public mode** — no `.env` needed, clients provide the key:

```bash
npm run dev
```

Your MCP endpoint is now live at **`http://localhost:3000/mcp`**.

### 3. Verify

```bash
curl http://localhost:3000/api/health
```

- **Hosted mode**: `{"status":"ok","mode":"hosted","clerkConnected":true}`
- **Public mode**: `{"status":"ok","mode":"public","clerkConnected":null}`

---

## Connect to AI Assistants

### Claude Code (CLI)

**Hosted mode:**

```bash
claude mcp add --transport http clerk http://localhost:3000/mcp
```

**Public mode:**

```bash
claude mcp add --transport http \
  --header "X-Clerk-Secret-Key: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx" \
  clerk http://localhost:3000/mcp
```

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
        "X-Clerk-Secret-Key: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ]
    }
  }
}
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
        "X-Clerk-Secret-Key": "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      }
    }
  }
}
```

### VS Code (GitHub Copilot)

Add to your workspace `.vscode/mcp.json`:

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
          "X-Clerk-Secret-Key": "sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
        }
      }
    }
  }
}
```

### Windsurf

Add to MCP settings:

**Hosted mode:**

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

**Public mode:**

```json
{
  "context_servers": {
    "clerk": {
      "source": "custom",
      "command": "npx",
      "args": [
        "mcp-remote",
        "http://localhost:3000/mcp",
        "--header",
        "X-Clerk-Secret-Key: sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx"
      ],
      "env": {}
    }
  }
}
```

---

## Docker

### Build the image

```bash
docker build -t clerk-mcp .
```

### Run in hosted mode

```bash
docker run -d -p 3000:3000 -e CLERK_SECRET_KEY=sk_test_xxxxxxxxxxxxxxxxxxxxxxxxxxxxx clerk-mcp
```

### Run in public mode

```bash
docker run -d -p 3000:3000 clerk-mcp
```

### Docker Compose

Both modes are defined in `docker-compose.yml`:

```bash
# Hosted mode on port 3000 — set CLERK_SECRET_KEY in .env first
docker compose up clerk-mcp-hosted

# Public mode on port 3001 — no key needed on the server
docker compose up clerk-mcp-public
```

---

## Available Tools

### Organizations

| Tool | Description |
|------|-------------|
| `clerk_list_organizations` | List orgs with filtering by name/slug, pagination, and member counts |
| `clerk_get_organization` | Get org details by ID or slug (includes metadata, timestamps) |
| `clerk_create_organization` | Create a new organization with name, slug, and metadata |
| `clerk_update_organization_metadata` | Update org public/private metadata |
| `clerk_delete_organization` | Delete an organization permanently (irreversible) |

### Members

| Tool | Description |
|------|-------------|
| `clerk_list_organization_members` | List org members with roles, user data, and metadata |
| `clerk_update_member_role` | Change a member's role (e.g. `org:admin`, `org:member`) |
| `clerk_update_member_metadata` | Update membership public/private metadata |
| `clerk_remove_member` | Remove a member from an organization |

### Invitations

| Tool | Description |
|------|-------------|
| `clerk_list_organization_invitations` | List invitations by status (pending/accepted/revoked) |
| `clerk_create_invitation` | Invite a user to an org by email |

### Users

| Tool | Description |
|------|-------------|
| `clerk_list_users` | List all instance users with search by name/email/phone |
| `clerk_get_user` | Get full user profile: emails, phones, external accounts, metadata |
| `clerk_update_user_metadata` | Update user public/private/unsafe metadata |

---

## Example Prompts

Once connected, try asking your AI assistant:

```
List all organizations in my Clerk instance.
How many members does the "engineering" organization have?
Create a new organization called "Design Team" with slug "design-team".
Show me all pending invitations for organization org_2abc123.
Find all users with email addresses containing "@example.com".
Update the public metadata for user user_2xyz789 to set plan: "pro".
```

---

## Deploying to Production

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

After deploying, replace `http://localhost:3000/mcp` with your production URL in all client configs.

Compatible with: **Vercel**, **Netlify**, **Cloudflare Workers** (with nitro preset), **Railway**, **Fly.io**, or any Node.js host.

---

## Project Structure

```
Clerk-MCP/
├── server/
│   ├── middleware/
│   │   └── clerk-key.ts                    # Extracts X-Clerk-Secret-Key header (public mode)
│   ├── mcp/
│   │   └── tools/                          # MCP tools (auto-discovered)
│   │       ├── clerk-list-organizations.ts
│   │       ├── clerk-get-organization.ts
│   │       ├── clerk-create-organization.ts
│   │       ├── clerk-update-organization-metadata.ts
│   │       ├── clerk-list-organization-members.ts
│   │       ├── clerk-update-member-role.ts
│   │       ├── clerk-update-member-metadata.ts
│   │       ├── clerk-list-organization-invitations.ts
│   │       ├── clerk-create-invitation.ts
│   │       ├── clerk-delete-organization.ts
│   │       ├── clerk-remove-member.ts
│   │       ├── clerk-list-users.ts
│   │       ├── clerk-get-user.ts
│   │       └── clerk-update-user-metadata.ts
│   ├── api/
│   │   └── health.get.ts                   # GET /api/health — readiness probe
│   └── utils/
│       └── clerk.ts                        # Clerk client (dual-mode) + helpers
├── app.vue                                 # Landing page
├── nuxt.config.ts
├── Dockerfile
├── docker-compose.yml
├── package.json
└── .env.example
```

## Adding New Tools

Create a new file in `server/mcp/tools/` — it's automatically discovered by the MCP toolkit:

```typescript
// server/mcp/tools/clerk-my-new-tool.ts
import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_my_new_tool',
  description: 'Description of what this tool does',
  inputSchema: {
    param: z.string().describe('Parameter description'),
  },
  annotations: {
    readOnlyHint: true,
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

## Tech Stack

- [Nuxt 3](https://nuxt.com) — Full-stack Vue framework
- [@nuxtjs/mcp-toolkit](https://mcp-toolkit.nuxt.dev) — MCP server module for Nuxt
- [@clerk/backend](https://clerk.com/docs/reference/backend/overview) — Clerk Backend SDK
- [Zod](https://zod.dev) — Schema validation

## License

MIT
