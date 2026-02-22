import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_update_member_role',
  description:
    'Change a member\'s role within a Clerk organization. Common roles: "org:admin", "org:member", or any custom role defined in your Clerk dashboard.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID (e.g. org_2abc...)'),
    userId: z
      .string()
      .describe('The user ID of the member whose role to change'),
    role: z
      .string()
      .describe('The new role to assign (e.g. "org:admin", "org:member")'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async handler({ organizationId, userId, role }) {
    const clerk = useClerkClient()

    const membership = await clerkCall(() =>
      clerk.organizations.updateOrganizationMembership({
        organizationId,
        userId,
        role,
      }),
    )

    return jsonResult({
      id: membership.id,
      userId: membership.publicUserData?.userId ?? null,
      role: membership.role,
      firstName: membership.publicUserData?.firstName ?? null,
      lastName: membership.publicUserData?.lastName ?? null,
      identifier: membership.publicUserData?.identifier ?? null,
      updatedAt: formatDate(membership.updatedAt),
    })
  },
})
