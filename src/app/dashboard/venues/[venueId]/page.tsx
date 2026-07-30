import Link from "next/link";
import { notFound, redirect } from "next/navigation";
import { getSession, orgFromSession } from "@/lib/auth0";
import { appConfig } from "@/lib/config";
import { countActiveVenues, ensureOrg, getMenu, getVenue } from "@/lib/data";
import { canPublish } from "@/lib/entitlement";
import { seedSampleMenu, togglePublish } from "../../actions";

export const dynamic = "force-dynamic";

export default async function VenuePage({
  params,
  searchParams,
}: {
  params: Promise<{ venueId: string }>;
  searchParams: Promise<{ blocked?: string; ingest?: string }>;
}) {
  if (!appConfig.auth0Configured || !appConfig.dbConfigured) redirect("/dashboard");

  const session = await getSession();
  if (!session) redirect("/auth/login");
  const claim = orgFromSession(session);
  if (!claim) redirect("/dashboard");

  const { venueId } = await params;
  const flags = await searchParams;

  const org = await ensureOrg(claim.auth0OrgId, claim.orgName);
  const venue = await getVenue(venueId);
  if (!venue || venue.org_id !== org.id) notFound();

  const menu = await getMenu(venue.id);
  const activeCount = await countActiveVenues(org.id);
  const publishable = canPublish(org, activeCount);

  return (
    <>
      <p>
        <Link href="/dashboard">← Dashboard</Link>
      </p>
      <h1>
        {venue.name}{" "}
        {venue.published ? (
          <span className="badge live">published</span>
        ) : (
          <span className="badge">draft</span>
        )}
      </h1>

      {flags.blocked && (
        <div className="notice">
          <strong>Publishing is locked.</strong> The subscription is not live —
          entitlement is an identity fact, and this org doesn&rsquo;t have it.
          Activate the subscription from the dashboard first.
        </div>
      )}
      {flags.ingest === "err" && (
        <div className="notice">
          <strong>Menu extraction failed.</strong> Try a sharper photo, or check
          that OpenRouter is configured.
        </div>
      )}

      <div className="card">
        <h2>Guest page</h2>
        <p className="muted">
          Public URL: <code>/m/{venue.slug}</code>
          {venue.published && (
            <>
              {" "}
              — <Link href={`/m/${venue.slug}`}>view it</Link>
            </>
          )}
        </p>
        <form action={togglePublish}>
          <input type="hidden" name="venueId" value={venue.id} />
          <input type="hidden" name="publish" value={venue.published ? "false" : "true"} />
          <button type="submit" disabled={!venue.published && !publishable}>
            {venue.published ? "Unpublish" : "Publish menu"}
          </button>
        </form>
        {!venue.published && !publishable && (
          <p className="muted" style={{ marginBottom: 0 }}>
            Locked: subscription is not live.
          </p>
        )}
      </div>

      <div className="card">
        <h2>Menu</h2>
        {menu.length === 0 && (
          <p className="muted">
            No menu yet. Photograph the paper menu — the guest page builds itself.
          </p>
        )}
        {menu.map((section) => (
          <div className="menu-section" key={section.id}>
            <h3>{section.name}</h3>
            {section.items.map((item) => (
              <div className="menu-item" key={item.id}>
                <span>
                  <strong>{item.name}</strong>
                  {item.description && (
                    <>
                      {" "}
                      <span className="muted">— {item.description}</span>
                    </>
                  )}
                </span>
                {item.price_cents != null && (
                  <span className="price">{(item.price_cents / 100).toFixed(2)}</span>
                )}
              </div>
            ))}
          </div>
        ))}

        <h3 style={{ marginTop: "1.5rem" }}>Replace the menu</h3>
        {appConfig.openrouterConfigured ? (
          <form
            action="/api/menu/ingest"
            method="post"
            encType="multipart/form-data"
            className="inline"
          >
            <input type="hidden" name="venueId" value={venue.id} />
            <input type="file" name="photo" accept="image/*" required />
            <button type="submit">Extract from photo</button>
          </form>
        ) : (
          <p className="muted">
            OpenRouter is not configured — photo extraction is offline.
          </p>
        )}
        <form action={seedSampleMenu} style={{ marginTop: "0.6rem" }}>
          <input type="hidden" name="venueId" value={venue.id} />
          <button type="submit" className="secondary">
            Load sample menu
          </button>
        </form>
      </div>
    </>
  );
}
