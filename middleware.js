import { NextResponse } from 'next/server';
import { auth0 } from '@/lib/auth0.js';

// Mounts /auth/* (login, logout, callback) and keeps sessions rolling. Before Auth0 is
// provisioned (auth0 === null) every request passes straight through.
export async function middleware(request) {
  if (!auth0) return NextResponse.next();
  return auth0.middleware(request);
}

export const config = {
  matcher: [
    // Everything except static assets and the Stripe webhook (signature-verified, never
    // session-authenticated).
    '/((?!_next/static|_next/image|favicon.ico|api/stripe/webhook).*)',
  ],
};
