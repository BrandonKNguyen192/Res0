import { getPool, query } from "./db";
import type { ExtractedMenu } from "./openrouter";

// ── Orgs ─────────────────────────────────────────────────────────────────────

export type OrgRow = {
  id: string;
  auth0_org_id: string;
  name: string;
  stripe_customer_id: string | null;
  stripe_subscription_id: string | null;
  subscription_status: string;
  licensed_venues: number;
};

export async function ensureOrg(auth0OrgId: string, name: string): Promise<OrgRow> {
  const rows = await query<OrgRow>(
    `insert into orgs (auth0_org_id, name)
     values ($1, $2)
     on conflict (auth0_org_id) do update set name = excluded.name
     returning *`,
    [auth0OrgId, name],
  );
  return rows[0];
}

export async function getOrgById(id: string): Promise<OrgRow | null> {
  const rows = await query<OrgRow>(`select * from orgs where id = $1`, [id]);
  return rows[0] ?? null;
}

export async function getOrgByStripeCustomer(customerId: string): Promise<OrgRow | null> {
  const rows = await query<OrgRow>(`select * from orgs where stripe_customer_id = $1`, [
    customerId,
  ]);
  return rows[0] ?? null;
}

export async function setOrgStripeCustomer(orgId: string, customerId: string): Promise<void> {
  await query(`update orgs set stripe_customer_id = $2 where id = $1`, [orgId, customerId]);
}

export async function setOrgSubscription(
  orgId: string,
  subscriptionId: string | null,
  status: string,
  licensedVenues: number,
): Promise<void> {
  await query(
    `update orgs
     set stripe_subscription_id = $2, subscription_status = $3, licensed_venues = $4
     where id = $1`,
    [orgId, subscriptionId, status, licensedVenues],
  );
}

// ── Venues ───────────────────────────────────────────────────────────────────

export type VenueRow = {
  id: string;
  org_id: string;
  name: string;
  slug: string;
  active: boolean;
  published: boolean;
};

export async function listVenues(orgId: string): Promise<VenueRow[]> {
  return query<VenueRow>(
    `select * from venues where org_id = $1 order by created_at asc`,
    [orgId],
  );
}

export async function countActiveVenues(orgId: string): Promise<number> {
  const rows = await query<{ count: string }>(
    `select count(*)::text as count from venues where org_id = $1 and active`,
    [orgId],
  );
  return Number(rows[0].count);
}

export async function getVenue(venueId: string): Promise<VenueRow | null> {
  const rows = await query<VenueRow>(`select * from venues where id = $1`, [venueId]);
  return rows[0] ?? null;
}

export async function getPublishedVenueBySlug(slug: string): Promise<VenueRow | null> {
  const rows = await query<VenueRow>(
    `select * from venues where slug = $1 and active and published`,
    [slug],
  );
  return rows[0] ?? null;
}

function slugify(name: string): string {
  const base = name
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/^-+|-+$/g, "")
    .slice(0, 40);
  const suffix = Math.random().toString(36).slice(2, 6);
  return base ? `${base}-${suffix}` : suffix;
}

export async function createVenue(orgId: string, name: string): Promise<VenueRow> {
  const rows = await query<VenueRow>(
    `insert into venues (org_id, name, slug) values ($1, $2, $3) returning *`,
    [orgId, name, slugify(name)],
  );
  return rows[0];
}

export async function setVenuePublished(venueId: string, published: boolean): Promise<void> {
  await query(`update venues set published = $2 where id = $1`, [venueId, published]);
}

export async function deactivateVenue(venueId: string): Promise<void> {
  await query(`update venues set active = false, published = false where id = $1`, [venueId]);
}

// ── Menus ────────────────────────────────────────────────────────────────────

export type MenuSection = {
  id: string;
  name: string;
  items: { id: string; name: string; description: string | null; price_cents: number | null }[];
};

export async function getMenu(venueId: string): Promise<MenuSection[]> {
  const sections = await query<{ id: string; name: string }>(
    `select id, name from menu_sections where venue_id = $1 order by position asc`,
    [venueId],
  );
  const result: MenuSection[] = [];
  for (const section of sections) {
    const items = await query<MenuSection["items"][number]>(
      `select id, name, description, price_cents
       from menu_items where section_id = $1 order by position asc`,
      [section.id],
    );
    result.push({ ...section, items });
  }
  return result;
}

export async function replaceMenu(venueId: string, menu: ExtractedMenu): Promise<void> {
  const client = await getPool().connect();
  try {
    await client.query("begin");
    await client.query(`delete from menu_sections where venue_id = $1`, [venueId]);
    for (const [i, section] of menu.sections.entries()) {
      const inserted = await client.query<{ id: string }>(
        `insert into menu_sections (venue_id, name, position) values ($1, $2, $3) returning id`,
        [venueId, section.name, i],
      );
      const sectionId = inserted.rows[0].id;
      for (const [j, item] of (section.items ?? []).entries()) {
        await client.query(
          `insert into menu_items (section_id, name, description, price_cents, position)
           values ($1, $2, $3, $4, $5)`,
          [
            sectionId,
            item.name,
            item.description ?? null,
            item.price != null ? Math.round(item.price * 100) : null,
            j,
          ],
        );
      }
    }
    await client.query("commit");
  } catch (error) {
    await client.query("rollback");
    throw error;
  } finally {
    client.release();
  }
}
