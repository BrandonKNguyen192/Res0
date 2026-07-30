import { Auth0Client } from "@auth0/nextjs-auth0/server";
import { appConfig } from "./config";

// Auth0 SDK v4: /auth/login, /auth/logout, /auth/callback are mounted by the
// middleware — the callback path is /auth/callback, NOT /api/auth/callback.
// The client reads AUTH0_DOMAIN / AUTH0_CLIENT_ID / AUTH0_CLIENT_SECRET /
// AUTH0_SECRET / APP_BASE_URL from the environment.
export const auth0 = appConfig.auth0Configured ? new Auth0Client() : null;

export async function getSession() {
  if (!auth0) return null;
  return auth0.getSession();
}

// The Auth0 Organization is the account boundary. No org claim, no tenant.
export function orgFromSession(session: { user: Record<string, unknown> }): {
  auth0OrgId: string;
  orgName: string;
} | null {
  const auth0OrgId = session.user.org_id;
  if (typeof auth0OrgId !== "string" || auth0OrgId.length === 0) return null;
  const orgName =
    typeof session.user.org_name === "string" && session.user.org_name.length > 0
      ? session.user.org_name
      : "Your group";
  return { auth0OrgId, orgName };
}
