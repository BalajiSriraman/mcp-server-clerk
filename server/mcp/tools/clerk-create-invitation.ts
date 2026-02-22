import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_create_invitation',
  description:
    'Invite a user to a Clerk organization by email. Sends an invitation email and creates a pending invitation record. Requires the inviter\'s user ID.',
  inputSchema: {
    organizationId: z
      .string()
      .describe('The organization ID to invite the user to (e.g. org_2abc...)'),
    emailAddress: z
      .string()
      .describe('The email address to send the invitation to'),
    role: z
      .string()
      .describe('The role to assign (e.g. "org:admin", "org:member")'),
    inviterUserId: z
      .string()
      .describe('The user ID of the person sending the invitation'),
    redirectUrl: z
      .string()
      .optional()
      .describe('URL where the user lands after accepting the invitation'),
    publicMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Public metadata for the invitation'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ organizationId, emailAddress, role, inviterUserId, redirectUrl, publicMetadata }) {
    const clerk = useClerkClient()

    const invitation = await clerkCall(() =>
      clerk.organizations.createOrganizationInvitation({
        organizationId,
        emailAddress,
        role,
        inviterUserId,
        redirectUrl: redirectUrl || undefined,
        publicMetadata: publicMetadata || undefined,
      }),
    )

    return jsonResult({
      id: invitation.id,
      emailAddress: invitation.emailAddress,
      role: invitation.role,
      status: invitation.status,
      publicMetadata: invitation.publicMetadata,
      createdAt: formatDate(invitation.createdAt),
      updatedAt: formatDate(invitation.updatedAt),
    })
  },
})
