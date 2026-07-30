import { Auth0Client } from '@auth0/nextjs-auth0/server';

// Auth0 SDK v4: /auth/login, /auth/logout and /auth/callback are mounted by middleware.js —
// the callback path is /auth/callback, NOT /api/auth/callback (that's v3, and failure #1).
// Reads AUTH0_DOMAIN / AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET / AUTH0_SECRET / APP_BASE_URL.
// Null until `stripe projects add auth0/client` lands — the seam stubs cover for it.
const configured = Boolean(
  process.env.AUTH0_DOMAIN &&
    process.env.AUTH0_CLIENT_ID &&
    process.env.AUTH0_CLIENT_SECRET &&
    process.env.AUTH0_SECRET,
);

export const auth0 = configured ? new Auth0Client() : null;
