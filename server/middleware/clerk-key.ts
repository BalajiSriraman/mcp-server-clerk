/**
 * Extracts X-Clerk-Secret-Key header from incoming requests
 * and stores it in event.context for use by useClerkClient().
 *
 * This enables "public mode" where users provide their own Clerk key.
 */
export default defineEventHandler((event) => {
  const header = getHeader(event, 'x-clerk-secret-key')
  if (header) {
    event.context.clerkSecretKey = header
  }
})
