import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_list_organizations',
  description:
    'List all Clerk organizations. Supports filtering by name/slug/ID, pagination, and optional member counts. Returns org ID, name, slug, metadata, and timestamps.',
  inputSchema: {
    query: z
      .string()
      .optional()
      .describe('Filter orgs by name, slug, or ID (partial match for name/slug, exact for ID)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Max results to return (default 20, max 100)'),
    offset: z
      .number()
      .min(0)
      .optional()
      .describe('Number of results to skip for pagination'),
    includeMembersCount: z
      .boolean()
      .optional()
      .describe('Include member count for each org (default true)'),
    orderBy: z
      .enum(['-created_at', '+created_at', '-name', '+name', '-members_count', '+members_count'])
      .optional()
      .describe('Sort order (default -created_at)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ query, limit, offset, includeMembersCount, orderBy }) {
    const clerk = useClerkClient()

    const { data, totalCount } = await clerkCall(() =>
      clerk.organizations.getOrganizationList({
        query: query || undefined,
        limit: limit ?? 20,
        offset: offset ?? 0,
        includeMembersCount: includeMembersCount ?? true,
        orderBy: orderBy || '-created_at',
      }),
    )

    const organizations = data.map((org) => ({
      id: org.id,
      name: org.name,
      slug: org.slug,
      membersCount: org.membersCount ?? null,
      maxAllowedMemberships: org.maxAllowedMemberships,
      publicMetadata: org.publicMetadata,
      privateMetadata: org.privateMetadata,
      createdAt: formatDate(org.createdAt),
      updatedAt: formatDate(org.updatedAt),
    }))

    return jsonResult({
      organizations,
      totalCount,
      count: organizations.length,
      offset: offset ?? 0,
      hasMore: (offset ?? 0) + organizations.length < totalCount,
    })
  },
})
