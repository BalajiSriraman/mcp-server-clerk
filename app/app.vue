<template>
  <div style="max-width: 640px; margin: 4rem auto; font-family: system-ui, sans-serif; padding: 0 1rem;">
    <h1>🔑 Clerk MCP Server</h1>
    <p>This Nuxt app exposes a <strong>Model Context Protocol (MCP)</strong> server for <a href="https://clerk.com" target="_blank">Clerk</a>.</p>
    <p>Connect your AI assistant (Claude, Cursor, VS Code Copilot, etc.) to:</p>
    <pre style="background: #f4f4f5; padding: 1rem; border-radius: 8px; overflow-x: auto;">{{ mcpUrl }}</pre>
    <h2>Available Tools</h2>
    <ul>
      <li><code>clerk_list_organizations</code> — List all orgs</li>
      <li><code>clerk_get_organization</code> — Get org details + metadata</li>
      <li><code>clerk_create_organization</code> — Create a new org</li>
      <li><code>clerk_update_organization_metadata</code> — Update org metadata</li>
      <li><code>clerk_list_organization_members</code> — List org members</li>
      <li><code>clerk_update_member_role</code> — Change a member's role</li>
      <li><code>clerk_update_member_metadata</code> — Update membership metadata</li>
      <li><code>clerk_list_organization_invitations</code> — List org invitations</li>
      <li><code>clerk_list_users</code> — List all users</li>
      <li><code>clerk_get_user</code> — Get user details</li>
      <li><code>clerk_update_user_metadata</code> — Update user metadata</li>
    </ul>
  </div>
</template>

<script setup>
const mcpUrl = typeof window !== 'undefined'
  ? `${window.location.origin}/mcp`
  : 'http://localhost:3000/mcp'
</script>
