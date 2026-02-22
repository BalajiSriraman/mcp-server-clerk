import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_update_user_metadata',
  description:
    'Update a user\'s metadata (public, private, and/or unsafe). Metadata is merged with existing values. Set a key to null to remove it. Returns the updated user.',
  inputSchema: {
    userId: z
      .string()
      .describe('The user ID to update (e.g. user_2abc...)'),
    publicMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Public metadata (readable from Frontend + Backend API). Merged with existing.'),
    privateMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Private metadata (only visible to Backend API). Merged with existing.'),
    unsafeMetadata: z
      .record(z.string(), z.unknown())
      .optional()
      .describe('Unsafe metadata (readable/writable from Frontend API). Merged with existing.'),
  },
  annotations: {
    readOnlyHint: false,
    destructiveHint: false,
    idempotentHint: true,
    openWorldHint: true,
  },
  async handler({ userId, publicMetadata, privateMetadata, unsafeMetadata }) {
    if (!publicMetadata && !privateMetadata && !unsafeMetadata) {
      return errorResult('Provide at least one of publicMetadata, privateMetadata, or unsafeMetadata to update.')
    }

    const clerk = useClerkClient()

    const user = await clerkCall(() =>
      clerk.users.updateUserMetadata(userId, {
        publicMetadata: publicMetadata || undefined,
        privateMetadata: privateMetadata || undefined,
        unsafeMetadata: unsafeMetadata || undefined,
      }),
    )

    return jsonResult({
      id: user.id,
      firstName: user.firstName,
      lastName: user.lastName,
      publicMetadata: user.publicMetadata,
      privateMetadata: user.privateMetadata,
      unsafeMetadata: user.unsafeMetadata,
      updatedAt: formatDate(user.updatedAt),
    })
  },
})
