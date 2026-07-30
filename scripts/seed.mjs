// Demo dataset — the app should open on something lived-in, not empty states.
//
// Usage:
//   npm run db:seed                                  # placeholder Auth0 org id
//   npm run db:seed -- --org org_AbC123 --name "Soho Hospitality"
//
// Re-run with --org once the real Auth0 Organization exists; it updates the
// same seed row (keyed on name) rather than duplicating.
//
// Deliberate: subscription_status stays 'none' and venues stay UNPUBLISHED so
// the demo beat (publish blocked → checkout 4242… → publish flows) still lands.
import pg from "pg";

const connectionString = process.env.NEON_POSTGRES_CONNECTION_STRING;
if (!connectionString) {
  console.error(
    "NEON_POSTGRES_CONNECTION_STRING is not set — run `stripe projects env --pull` first.",
  );
  process.exit(1);
}

const args = process.argv.slice(2);
function argValue(flag, fallback) {
  const i = args.indexOf(flag);
  return i !== -1 && args[i + 1] ? args[i + 1] : fallback;
}
const auth0OrgId = argValue("--org", "org_seed_soho");
const orgName = argValue("--name", "Soho Hospitality");

const VENUES = [
  {
    name: "Soho Noodle Bar",
    slug: "soho-noodle-bar",
    menu: [
      {
        name: "Noodles",
        items: [
          { name: "Khao soi", description: "chicken, pickled mustard greens, crispy noodle", price: 21 },
          { name: "Boat noodles", description: "beef, dark broth, morning glory", price: 18 },
          { name: "Pad see ew", description: "wide rice noodle, chinese broccoli, egg", price: 17 },
        ],
      },
      {
        name: "Sides",
        items: [
          { name: "Fried wontons", description: "sweet chili", price: 9 },
          { name: "Cucumber salad", description: "peanut, lime, fish sauce", price: 8 },
        ],
      },
    ],
  },
  {
    name: "Harbourline",
    slug: "harbourline",
    menu: [
      {
        name: "Raw bar",
        items: [
          { name: "Oysters (6)", description: "mignonette, lemon", price: 24 },
          { name: "Tuna crudo", description: "yuzu kosho, olive oil", price: 19 },
        ],
      },
      {
        name: "Mains",
        items: [
          { name: "Whole roasted branzino", description: "lemongrass, chili-lime", price: 38 },
          { name: "Grilled hanger steak", description: "jaew, sticky rice", price: 34 },
          { name: "Miso black cod", description: "charred scallion", price: 41 },
        ],
      },
      {
        name: "Dessert",
        items: [
          { name: "Mango sticky rice", description: "salted coconut cream", price: 11 },
          { name: "Burnt basque cheesecake", price: 12 },
        ],
      },
    ],
  },
  {
    name: "Peak & Pine",
    slug: "peak-and-pine",
    menu: [
      {
        name: "Small plates",
        items: [
          { name: "Charred padrón peppers", description: "smoked salt, lemon", price: 9 },
          { name: "Burrata", description: "heirloom tomato, basil oil", price: 16 },
          { name: "Crispy pork belly bites", description: "tamarind glaze, herbs", price: 14 },
        ],
      },
      {
        name: "Wood fire",
        items: [
          { name: "Half chicken", description: "chimichurri, grilled lemon", price: 26 },
          { name: "Mushroom & taleggio flatbread", description: "thyme, honey", price: 19 },
        ],
      },
    ],
  },
];

const client = new pg.Client({
  connectionString,
  ssl: /localhost|127\.0\.0\.1/.test(connectionString)
    ? undefined
    : { rejectUnauthorized: true },
});

await client.connect();
try {
  await client.query("begin");

  // Keyed on name so re-seeding with the real --org updates in place.
  const existing = await client.query(`select id, auth0_org_id from orgs where name = $1`, [
    orgName,
  ]);
  let orgId;
  if (existing.rows[0]) {
    orgId = existing.rows[0].id;
    await client.query(`update orgs set auth0_org_id = $2 where id = $1`, [orgId, auth0OrgId]);
  } else {
    const inserted = await client.query(
      `insert into orgs (auth0_org_id, name) values ($1, $2) returning id`,
      [auth0OrgId, orgName],
    );
    orgId = inserted.rows[0].id;
  }

  for (const venue of VENUES) {
    const venueRow = await client.query(
      `insert into venues (org_id, name, slug)
       values ($1, $2, $3)
       on conflict (slug) do update set name = excluded.name, org_id = excluded.org_id
       returning id`,
      [orgId, venue.name, venue.slug],
    );
    const venueId = venueRow.rows[0].id;
    await client.query(`delete from menu_sections where venue_id = $1`, [venueId]);
    for (const [i, section] of venue.menu.entries()) {
      const sectionRow = await client.query(
        `insert into menu_sections (venue_id, name, position) values ($1, $2, $3) returning id`,
        [venueId, section.name, i],
      );
      for (const [j, item] of section.items.entries()) {
        await client.query(
          `insert into menu_items (section_id, name, description, price_cents, position)
           values ($1, $2, $3, $4, $5)`,
          [
            sectionRow.rows[0].id,
            item.name,
            item.description ?? null,
            item.price != null ? Math.round(item.price * 100) : null,
            j,
          ],
        );
      }
    }
  }

  await client.query("commit");
  console.log(`Seeded "${orgName}" (auth0 org: ${auth0OrgId}) with ${VENUES.length} venues:`);
  for (const venue of VENUES) {
    console.log(`  - ${venue.name}  →  /m/${venue.slug} (draft until published)`);
  }
  console.log(
    "\nSubscription status is 'none' on purpose — the publish-block demo beat depends on it.",
  );
} catch (error) {
  await client.query("rollback");
  throw error;
} finally {
  await client.end();
}
