// https://nuxt.com/docs/api/configuration/nuxt-config
export default defineNuxtConfig({
  compatibilityDate: '2025-01-01',

  modules: ['@nuxtjs/mcp-toolkit', '@nuxt/eslint'],

  // Runtime config for Clerk secret key (hosted mode)
  runtimeConfig: {
    clerkSecretKey: process.env.CLERK_SECRET_KEY,
  },

  // Enable async context so useEvent() works in server utilities
  nitro: {
    experimental: {
      asyncContext: true,
    },
  },

  devtools: { enabled: true },
})
