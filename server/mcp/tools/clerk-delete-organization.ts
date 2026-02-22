import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_delete_organization',
  description:
    'Delete a Clerk organization by ID. This is irreversible — all memberships, invitations, and associated data will be removed.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID to delete (e.g. org_2abc...)'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: true,
    openWorldHint: true,
  },
  async handler({ organizationId }) {
    const clerk = useClerkClient()

    await clerkCall(() =>
      clerk.organizations.deleteOrganization(organizationId),
    )

    return jsonResult({
      id: organizationId,
      deleted: true,
    })
  },
})
