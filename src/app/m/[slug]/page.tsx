import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { appConfig } from "@/lib/config";
import { getMenu, getPublishedVenueBySlug } from "@/lib/data";

export const dynamic = "force-dynamic";

// The guest page. Public, unauthenticated, and only exists while the venue is
// published — which only happens while the org's subscription is live.
export async function generateMetadata({
  params,
}: {
  params: Promise<{ slug: string }>;
}): Promise<Metadata> {
  if (!appConfig.dbConfigured) return { title: "Menu" };
  const { slug } = await params;
  const venue = await getPublishedVenueBySlug(slug);
  return { title: venue ? `${venue.name} — Menu` : "Menu" };
}

export default async function GuestMenuPage({
  params,
}: {
  params: Promise<{ slug: string }>;
}) {
  if (!appConfig.dbConfigured) notFound();
  const { slug } = await params;
  const venue = await getPublishedVenueBySlug(slug);
  if (!venue) notFound();

  const menu = await getMenu(venue.id);

  return (
    <>
      <section className="hero" style={{ paddingBottom: 0 }}>
        <h1>{venue.name}</h1>
      </section>
      <div className="card">
        {menu.length === 0 && <p className="muted">Menu coming soon.</p>}
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
      </div>
    </>
  );
}
