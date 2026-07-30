import { NextResponse, type NextRequest } from "next/server";
import { auth0 } from "./lib/auth0";

// Auth0 SDK v4 mounts /auth/login, /auth/logout and /auth/callback here and
// keeps sessions rolling. Before provisioning (auth0 === null) requests pass
// straight through so the scaffold still boots.
export async function middleware(request: NextRequest) {
  if (!auth0) return NextResponse.next();
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    // Everything except static assets and the Stripe webhook (signature-verified,
    // never session-authenticated).
    "/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)",
  ],
};
