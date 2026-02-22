import { z } from 'zod'

export default defineMcpTool({
  name: 'clerk_list_users',
  description:
    'List Clerk users across the entire instance. Supports filtering by email, phone, username, user IDs, and more. Returns user profile data, metadata, and timestamps.',
  inputSchema: {
    limit: z
      .number()
      .min(1)
      .max(200)
      .optional()
      .describe('Max results to return (default 20, max 200)'),
    offset: z
      .number()
      .min(0)
      .optional()
      .describe('Number of results to skip'),
    query: z
      .string()
      .optional()
      .describe('Search by name, email, phone, username, or web3 wallet (partial match)'),
    emailAddress: z
      .array(z.string())
      .optional()
      .describe('Filter by exact email addresses'),
    userId: z
      .array(z.string())
      .optional()
      .describe('Filter by exact user IDs'),
    orderBy: z
      .enum(['-created_at', '+created_at', '-updated_at', '+updated_at', '-last_active_at', '+last_active_at'])
      .optional()
      .describe('Sort order (default -created_at)'),
  },
  annotations: {
    readOnlyHint: true,
    destructiveHint: false,
    openWorldHint: true,
  },
  async handler({ limit, offset, query, emailAddress, userId, orderBy }) {
    const clerk = useClerkClient()

    const { data, totalCount } = await clerkCall(() =>
      clerk.users.getUserList({
        limit: limit ?? 20,
        offset: offset ?? 0,
        query: query || undefined,
        emailAddress: emailAddress || undefined,
        userId: userId || undefined,
        orderBy: orderBy || '-created_at',
      }),
    )

    const users = data.map((u) => ({
      id: u.id,
      firstName: u.firstName,
      lastName: u.lastName,
      username: u.username,
      primaryEmailAddress: u.emailAddresses?.find((e) => e.id === u.primaryEmailAddressId)?.emailAddress ?? null,
      emailAddresses: u.emailAddresses?.map((e) => e.emailAddress) ?? [],
      imageUrl: u.imageUrl,
      hasImage: u.hasImage,
      publicMetadata: u.publicMetadata,
      privateMetadata: u.privateMetadata,
      unsafeMetadata: u.unsafeMetadata,
      lastActiveAt: formatDate(u.lastActiveAt),
      createdAt: formatDate(u.createdAt),
      updatedAt: formatDate(u.updatedAt),
    }))

    return jsonResult({
      users,
      totalCount,
      count: users.length,
      offset: offset ?? 0,
      hasMore: (offset ?? 0) + users.length < totalCount,
    })
  },
})
