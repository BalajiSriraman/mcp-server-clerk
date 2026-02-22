import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_update_organization_metadata',
  description:
    'Update an organization\'s public and/or private metadata. Metadata is merged (deep merge) with existing values. Set a key to null to remove it. Returns the updated organization.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID to update'),
    publicMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Public metadata object (readable from Frontend + Backend API). Merged with existing.'),
    privateMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Private metadata object (only visible to Backend API). Merged with existing.'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async handler({ organizationId, publicMetadata, privateMetadata }) {
    if (!publicMetadata && !privateMetadata) {
      return errorResult('Provide at least one of publicMetadata or privateMetadata to update.')
    }

    const clerk = useClerkClient()

    const org = await clerkCall(() =>
      clerk.organizations.updateOrganizationMetadata(organizationId, {
        publicMetadata: publicMetadata || undefined,
        privateMetadata: privateMetadata || undefined,
      }),
    )

    return jsonResult({
      id: org.id,
      name: org.name,
      slug: org.slug,
      publicMetadata: org.publicMetadata,
      privateMetadata: org.privateMetadata,
      updatedAt: formatDate(org.updatedAt),
    })
  },
})
