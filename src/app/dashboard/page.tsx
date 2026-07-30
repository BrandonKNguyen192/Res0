import Link from "next/link";
import { redirect } from "next/navigation";
import { getSession, orgFromSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";
import { ensureOrg, listVenues } from "@/lib/data";
import { entitlementLabel, isEntitled } from "@/lib/entitlement";
import { addVenue, closeVenue } from "./actions";

export const dynamic = "force-dynamic";

export default async function Dashboard() {
  if (!appConfig.auth0Configured) {
    return (
      <div className="notice">
        <strong>Auth0 is not configured yet.</strong> Provision it with{" "}
        <code>stripe projects add auth0/client</code>, pull the env, and restart.
      </div>
    );
  }

  const session = await getSession();
  if (!session) redirect("/auth/login");

  const claim = orgFromSession(session);
  if (!claim) {
    return (
      <div className="notice">
        <strong>No organization on this session.</strong> Res0 accounts are Auth0
        Organizations — sign in through an organization (invite yourself to one in
        the Auth0 dashboard), then try again.{" "}
        <a href="/auth/logout">Sign out</a>
      </div>
    );
  }

  if (!appConfig.dbConfigured) {
    return (
      <div className="notice">
        <strong>Neon is not configured yet.</strong> Provision it with{" "}
        <code>stripe projects add neon/postgres</code>, run{" "}
        <code>npm run db:migrate</code>, and restart.
      </div>
    );
  }

  const org = await ensureOrg(claim.auth0OrgId, claim.orgName);
  const venues = await listVenues(org.id);
  const activeVenues = venues.filter((v) => v.active);
  const entitled = isEntitled(org);

  return (
    <>
      <h1>{org.name}</h1>

      <div className="card">
        <h2>
          Billing{" "}
          <span className={`badge ${entitled ? "live" : "off"}`}>
            {entitlementLabel(org)}
          </span>
        </h2>
        <p className="muted">
          {activeVenues.length} active venue{activeVenues.length === 1 ? "" : "s"} ·{" "}
          {org.licensed_venues} licensed. The subscription quantity tracks active
          venues — add a venue and the bill follows.
        </p>
        {appConfig.stripeConfigured && appConfig.stripePriceConfigured ? (
          <div className="inline" style={{ display: "flex", gap: "0.6rem" }}>
            {!entitled && (
              <form action="/api/stripe/checkout" method="post">
                <button type="submit">Activate subscription</button>
              </form>
            )}
            {org.stripe_customer_id && (
              <form action="/api/stripe/portal" method="post">
                <button type="submit" className="secondary">
                  Manage billing
                </button>
              </form>
            )}
          </div>
        ) : (
          <p className="muted">
            Stripe is not configured yet — publishing stays locked until the
            subscription is live.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Venues</h2>
        {venues.length === 0 && (
          <p className="muted">No venues yet. Add the first one below.</p>
        )}
        <ul className="plain">
          {venues.map((venue) => (
            <li key={venue.id}>
              <span>
                <Link href={`/dashboard/venues/${venue.id}`}>{venue.name}</Link>{" "}
                {!venue.active ? (
                  <span className="badge off">closed</span>
                ) : venue.published ? (
                  <span className="badge live">published</span>
                ) : (
                  <span className="badge">draft</span>
                )}
              </span>
              {venue.active && (
                <form action={closeVenue}>
                  <input type="hidden" name="venueId" value={venue.id} />
                  <button type="submit" className="secondary">
                    Close venue
                  </button>
                </form>
              )}
            </li>
          ))}
        </ul>
        <form action={addVenue} className="inline" style={{ marginTop: "1rem" }}>
          <input type="text" name="name" placeholder="Venue name" required />
          <button type="submit">Add venue</button>
        </form>
      </div>
    </>
  );
}
