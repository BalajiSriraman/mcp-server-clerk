import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_remove_member',
  description:
    'Remove a member from a Clerk organization. The user will lose access to the organization but their Clerk user account is not deleted.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID (e.g. org_2abc...)'),
    userId: z
      .string()
      .describe('The user ID of the member to remove'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  async handler({ organizationId, userId }) {
    const clerk = useClerkClient()

    const membership = await clerkCall(() =>
      clerk.organizations.deleteOrganizationMembership({
        organizationId,
        userId,
      }),
    )

    return jsonResult({
      id: membership.id,
      userId: membership.publicUserData?.userId ?? null,
      role: membership.role,
      firstName: membership.publicUserData?.firstName ?? null,
      lastName: membership.publicUserData?.lastName ?? null,
      removed: true,
    })
  },
})
