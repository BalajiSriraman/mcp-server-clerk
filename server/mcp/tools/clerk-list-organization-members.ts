import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_list_organization_members',
  description:
    'List members of a Clerk organization. Returns each member\'s user ID, role, public user data (name, email, avatar), membership metadata, and timestamps. Supports filtering by role, email, query string, and pagination.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID (e.g. org_2abc...)'),
    limit: z
      .number()
      .min(1)
      .max(100)
      .optional()
      .describe('Max results to return (default 20)'),
    offset: z
      .number()
      .min(0)
      .optional()
      .describe('Number of results to skip for pagination'),
    query: z
      .string()
      .optional()
      .describe('Filter by email, phone, username, web3 wallet, user ID, first/last name (partial match)'),
    role: z
      .array(z.string())
      .optional()
      .describe('Filter by role(s), e.g. ["org:admin", "org:member"]'),
    orderBy: z
      .enum(['-created_at', '+created_at'])
      .optional()
      .describe('Sort order (default -created_at)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ organizationId, limit, offset, query, role, orderBy }) {
    const clerk = useClerkClient()

    const { data, totalCount } = await clerkCall(() =>
      clerk.organizations.getOrganizationMembershipList({
        organizationId,
        limit: limit ?? 20,
        offset: offset ?? 0,
        query: query || undefined,
        role: role || undefined,
        orderBy: orderBy || '-created_at',
      }),
    )

    const members = data.map((m) => ({
      id: m.id,
      userId: m.publicUserData?.userId ?? null,
      role: m.role,
      firstName: m.publicUserData?.firstName ?? null,
      lastName: m.publicUserData?.lastName ?? null,
      identifier: m.publicUserData?.identifier ?? null,
      imageUrl: m.publicUserData?.imageUrl ?? null,
      hasImage: m.publicUserData?.hasImage ?? false,
      publicMetadata: m.publicMetadata,
      createdAt: formatDate(m.createdAt),
      updatedAt: formatDate(m.updatedAt),
    }))

    return jsonResult({
      members,
      totalCount,
      count: members.length,
      offset: offset ?? 0,
      hasMore: (offset ?? 0) + members.length < totalCount,
    })
  },
})
