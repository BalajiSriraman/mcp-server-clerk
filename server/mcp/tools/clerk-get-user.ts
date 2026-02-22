import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_get_user',
  description:
    'Get detailed information about a single Clerk user by their user ID. Returns full profile, email addresses, phone numbers, metadata, external accounts, and timestamps.',
  inputSchema: {
    userId: z
      .string()
      .describe('The user ID (e.g. user_2abc...)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ userId }) {
    const clerk = useClerkClient()

    const u = await clerkCall(() => clerk.users.getUser(userId))

    return jsonResult({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      primaryEmailAddress: u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? null,
      emailAddresses: u.emailAddresses?.map((e) => ({
        id: e.id,
        emailAddress: e.emailAddress,
        verified: e.verification?.status === 'verified',
      })) ?? [],
      phoneNumbers: u.phoneNumbers?.map((p) => ({
        id: p.id,
        phoneNumber: p.phoneNumber,
        verified: p.verification?.status === 'verified',
      })) ?? [],
      externalAccounts: u.externalAccounts?.map((ea) => ({
        provider: ea.provider,
        identificationId: ea.identificationId,
        emailAddress: ea.emailAddress,
        firstName: ea.firstName,
        lastName: ea.lastName,
        username: ea.username,
      })) ?? [],
      imageUrl: u.imageUrl,
      hasImage: u.hasImage,
      publicMetadata: u.publicMetadata,
      privateMetadata: u.privateMetadata,
      unsafeMetadata: u.unsafeMetadata,
      banned: u.banned,
      locked: u.locked,
      lastActiveAt: formatDate(u.lastActiveAt),
      lastSignInAt: formatDate(u.lastSignInAt),
      createdAt: formatDate(u.createdAt),
      updatedAt: formatDate(u.updatedAt),
    })
  },
})
