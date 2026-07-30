// Which services have credentials. The scaffold predates provisioning: every
// integration must degrade to a visible "not configured" state, never a crash.
export const appConfig = {
  auth0Configured: Boolean(
    process.env.AUTH0_DOMAIN &&
      process.env.AUTH0_CLIENT_ID &&
      process.env.AUTH0_CLIENT_SECRET &&
      process.env.AUTH0_SECRET,
  ),
  dbConfigured: Boolean(process.env.NEON_POSTGRES_CONNECTION_STRING),
  stripeConfigured: Boolean(process.env.STRIPE_SECRET_KEY),
  stripeWebhookConfigured: Boolean(process.env.STRIPE_WEBHOOK_SECRET),
  stripePriceConfigured: Boolean(process.env.STRIPE_PRICE_VENUE_MONTHLY),
  openrouterConfigured: Boolean(process.env.OPENROUTER_API_KEY),
  appBaseUrl: process.env.APP_BASE_URL ?? "http://localhost:3000",
};
