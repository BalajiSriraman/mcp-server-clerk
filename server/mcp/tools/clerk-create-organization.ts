import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_create_organization',
  description:
    'Create a new Clerk organization. Requires a name; optionally set slug, max memberships, a creating user, and initial metadata.',
  inputSchema: {
    name: z
      .string()
      .describe('The name of the organization'),
    slug: z
      .string()
      .optional()
      .describe('URL-friendly slug (auto-generated from name if omitted)'),
    createdBy: z
      .string()
      .optional()
      .describe('User ID of the creator (will be added as admin)'),
    maxAllowedMemberships: z
      .number()
      .min(1)
      .optional()
      .describe('Maximum number of members allowed'),
    publicMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Public metadata (readable from Frontend + Backend API)'),
    privateMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Private metadata (only visible to Backend API)'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ name, slug, createdBy, maxAllowedMemberships, publicMetadata, privateMetadata }) {
    const clerk = useClerkClient()

    const org = await clerkCall(() =>
      clerk.organizations.createOrganization({
        name,
        slug: slug || undefined,
        createdBy: createdBy || undefined,
        maxAllowedMemberships: maxAllowedMemberships || undefined,
        publicMetadata: publicMetadata || undefined,
        privateMetadata: privateMetadata || undefined,
      }),
    )

    return jsonResult({
      id: org.id,
      name: org.name,
      slug: org.slug,
      maxAllowedMemberships: org.maxAllowedMemberships,
      publicMetadata: org.publicMetadata,
      privateMetadata: org.privateMetadata,
      createdAt: formatDate(org.createdAt),
    })
  },
})
