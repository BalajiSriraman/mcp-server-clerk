export default defineEventHandler(async () => {
  const config = useRuntimeConfig()
  const envKey = config.clerkSecretKey || process.env.CLERK_SECRET_KEY

  const mode = envKey ? 'hosted' : 'public'

  // In hosted mode, verify the key works by making a lightweight API call
  if (envKey) {
    try {
      const clerk = useClerkClient()
      await clerkCall(() => clerk.organizations.getOrganizationList({ limit: 1 }))
      return { status: 'ok', mode, clerkConnected: true }
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : 'Unknown error'
      return { status: 'degraded', mode, clerkConnected: false, error: message }
    }
  }

  // In public mode, we can't verify without a key — just confirm the server is up
  return { status: 'ok', mode, clerkConnected: null }
})
