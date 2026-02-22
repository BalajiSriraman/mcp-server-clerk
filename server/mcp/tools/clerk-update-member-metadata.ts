import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_update_member_metadata',
  description:
    'Update a member\'s public metadata within a Clerk organization. Metadata is merged with existing values. Set a key to null to remove it.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID (e.g. org_2abc...)'),
    userId: z
      .string()
      .describe('The user ID of the member'),
    publicMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Public metadata to merge with existing membership metadata'),
    privateMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Private metadata to merge with existing membership metadata'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async handler({ organizationId, userId, publicMetadata, privateMetadata }) {
    if (!publicMetadata && !privateMetadata) {
      return errorResult('Provide at least one of publicMetadata or privateMetadata to update.')
    }

    const clerk = useClerkClient()

    const membership = await clerkCall(() =>
      clerk.organizations.updateOrganizationMembershipMetadata({
        organizationId,
        userId,
        publicMetadata: publicMetadata || undefined,
        privateMetadata: privateMetadata || undefined,
      }),
    )

    return jsonResult({
      id: membership.id,
      userId: membership.publicUserData?.userId ?? null,
      role: membership.role,
      publicMetadata: membership.publicMetadata,
      updatedAt: formatDate(membership.updatedAt),
    })
  },
})
