import { withSentryConfig } from '@sentry/nextjs'
import { join, dirname } from 'path'
import '@typebot.io/env/dist/env.mjs'
import { configureRuntimeEnv } from 'next-runtime-env/build/configure.js'
import { fileURLToPath } from 'url'

const __filename = fileURLToPath(import.meta.url)

const __dirname = dirname(__filename)

configureRuntimeEnv()

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  output: 'standalone',
  transpilePackages: [
    '@typebot.io/lib',
    '@typebot.io/schemas',
    '@typebot.io/emails',
    '@typebot.io/env',
  ],
  i18n: {
    defaultLocale: 'en',
    locales: ['en', 'fr', 'pt', 'pt-BR', 'de'],
  },
  experimental: {
    outputFileTracingRoot: join(__dirname, '../../'),
    proxyTimeout: 120000
  },
  headers: async () => {
    return [
      {
        source: '/(.*)?',
        headers: [
          {
            key: 'X-Frame-Options',
            value: 'SAMEORIGIN',
          },
          { key: "Access-Control-Allow-Credentials", value: "true" },
          { key: "Access-Control-Allow-Origin", value: "*" },
          { key: "Access-Control-Allow-Methods", value: "GET,OPTIONS,PATCH,DELETE,POST,PUT" },
          { key: "Access-Control-Allow-Headers", value: "X-CSRF-Token, X-Requested-With, Accept, Accept-Version, Content-Length, Content-MD5, Content-Type, Date, X-Api-Version" },
        ],
      },
    ]
  },
  async rewrites() {
    return process.env.NEXT_PUBLIC_POSTHOG_KEY
      ? [
          {
            source: '/ingest/:path*',
            destination:
              (process.env.NEXT_PUBLIC_POSTHOG_HOST ??
                'https://app.posthog.com') + '/:path*',
          },
        ]
      : []
  },
}

const sentryWebpackPluginOptions = {
  silent: true,
  release: process.env.NEXT_PUBLIC_VERCEL_GIT_COMMIT_SHA + '-builder',
}

export default process.env.NEXT_PUBLIC_SENTRY_DSN
  ? withSentryConfig(
      {
        ...nextConfig,
        sentry: {
          hideSourceMaps: true,
          widenClientFileUpload: true,
        },
      },
      sentryWebpackPluginOptions
    )
  : nextConfig
