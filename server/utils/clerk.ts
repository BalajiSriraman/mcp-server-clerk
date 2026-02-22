import { createClerkClient } from '@clerk/backend'

let _hostedClient: ReturnType<typeof createClerkClient> | null = null

/**
 * Returns a Clerk Backend client.
 *
 * **Hosted mode** (CLERK_SECRET_KEY set in .env):
 *   Returns a singleton client — all requests share the same key.
 *
 * **Public mode** (no CLERK_SECRET_KEY in env):
 *   Creates a per-request client using the key from the
 *   `X-Clerk-Secret-Key` header provided by the caller.
 */
export function useClerkClient() {
  const config = useRuntimeConfig()
  const envKey = config.clerkSecretKey || process.env.CLERK_SECRET_KEY

  // Hosted mode: CLERK_SECRET_KEY is set, use singleton
  if (envKey) {
    if (!_hostedClient) {
      _hostedClient = createClerkClient({ secretKey: envKey })
    }
    return _hostedClient
  }

  // Public mode: get key from request header via middleware
  let requestKey: string | undefined
  try {
    const event = useEvent()
    requestKey = event.context.clerkSecretKey as string | undefined
  } catch {
    // useEvent() not available outside request context
  }

  if (!requestKey) {
    throw new Error(
      'No Clerk secret key found. Either set CLERK_SECRET_KEY in .env (hosted mode) or pass the X-Clerk-Secret-Key header with each request (public mode).',
    )
  }

  return createClerkClient({ secretKey: requestKey })
}

/**
 * Format a Clerk timestamp (ms) to a human-readable ISO string.
 */
export function formatDate(timestamp: number | null | undefined): string | null {
  if (!timestamp) return null
  return new Date(timestamp).toISOString()
}

/**
 * Wraps a Clerk SDK call with consistent error handling for MCP tools.
 */
export async function clerkCall<T>(fn: () => Promise<T>): Promise<T> {
  try {
    return await fn()
  } catch (error: unknown) {
    const err = error as Record<string, unknown>
    const errors = err?.errors as Array<Record<string, string>> | undefined
    const message = errors?.[0]?.longMessage
      || errors?.[0]?.message
      || (err?.message as string)
      || 'Unknown Clerk API error'
    const code = (err?.status as number) || 500
    throw new Error(`Clerk API error (${code}): ${message}`)
  }
}
