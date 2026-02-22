import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_list_organization_invitations',
  description:
    'List invitations for a Clerk organization. Filter by status (pending, accepted, revoked). Returns invitee email, role, status, and timestamps.',
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
    status: z
      .enum(['pending', 'accepted', 'revoked'])
      .optional()
      .describe('Filter by invitation status'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ organizationId, limit, offset, status }) {
    const clerk = useClerkClient()

    const { data, totalCount } = await clerkCall(() =>
      clerk.organizations.getOrganizationInvitationList({
        organizationId,
        limit: limit ?? 20,
        offset: offset ?? 0,
        status: status ? [status] : undefined,
      }),
    )

    const invitations = data.map((inv) => ({
      id: inv.id,
      emailAddress: inv.emailAddress,
      role: inv.role,
      status: inv.status,
      publicMetadata: inv.publicMetadata,
      createdAt: formatDate(inv.createdAt),
      updatedAt: formatDate(inv.updatedAt),
    }))

    return jsonResult({
      invitations,
      totalCount,
      count: invitations.length,
      offset: offset ?? 0,
      hasMore: (offset ?? 0) + invitations.length < totalCount,
    })
  },
})
