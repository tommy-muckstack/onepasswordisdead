const basePath = process.env.NEXT_PUBLIC_BASE_PATH ?? "/onepasswordisdead";
export default {
  basePath,
  env: { NEXT_PUBLIC_BASE_PATH: basePath },
  // /f/<id> style public routes live under the same basePath.
  poweredByHeader: false,
  // PostHog reverse proxy (docs/ANALYTICS.md): <basePath>/ingest/* → us.i.posthog.com, passed through without a trailing-slash redirect.
  skipTrailingSlashRedirect: true,
  async rewrites() { return [{ source: "/ingest/static/:path*", destination: "https://us-assets.i.posthog.com/static/:path*" }, { source: "/ingest/:path*", destination: "https://us.i.posthog.com/:path*" }]; },
};
