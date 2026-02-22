import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_get_organization',
  description:
    'Get detailed information about a single Clerk organization by ID or slug. Returns name, slug, metadata (public + private), member limits, and timestamps.',
  inputSchema: {
    organizationId: z
      .string()
      .optional()
      .describe('The organization ID (e.g. org_2abc...)'),
    slug: z
      .string()
      .optional()
      .describe('The organization slug (alternative to organizationId)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ organizationId, slug }) {
    if (!organizationId && !slug) {
      return errorResult('Provide either organizationId or slug.')
    }

    const clerk = useClerkClient()

    const org = await clerkCall(() =>
      clerk.organizations.getOrganization(
        organizationId ? { organizationId } : { slug: slug! },
      ),
    )

    return jsonResult({
      id: org.id,
      name: org.name,
      slug: org.slug,
      imageUrl: org.imageUrl,
      hasImage: org.hasImage,
      membersCount: org.membersCount ?? null,
      maxAllowedMemberships: org.maxAllowedMemberships,
      adminDeleteEnabled: org.adminDeleteEnabled,
      publicMetadata: org.publicMetadata,
      privateMetadata: org.privateMetadata,
      createdAt: formatDate(org.createdAt),
      updatedAt: formatDate(org.updatedAt),
    })
  },
})
