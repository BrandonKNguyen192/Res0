'use server';

import { revalidatePath } from 'next/cache';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { getSession, getEntitlement, canAddVenue, canPublish } from '@/lib/contract.js';
import { listVenues, createVenue, getVenue, updateVenue, seed } from '@/lib/db.js';
import { ROLES, homeFor } from '@/lib/roles.js';
import { createOrder } from '@/lib/supplies.js';

/** Demo-only "View as": swaps the stub persona via cookie, server-side — the
 *  same round-trip a real login would make. Live Auth0 sessions ignore it. */
export async function setDemoRole(formData) {
  const role = String(formData.get('role') || '');
  if (!ROLES.includes(role)) return;
  const jar = await cookies();
  jar.set('res0_demo_role', role, { path: '/', sameSite: 'lax' });
  redirect(homeFor(role));
}

/** Managing venues is for operators — owner or GM. Role comes from the token. */
function canOperate(session) {
  return session.role === 'owner' || session.role === 'general_manager';
}

/**
 * Add a venue — and the one place the premise is enforced.
 *
 * The check happens HERE, on the server, not in the button's disabled state. A paywall that
 * lives only in the UI is decoration; this one is the actual rule, so it holds whether the
 * request came from our form, a stale tab, or curl.
 */
export async function addVenue(formData) {
  const session = await getSession();
  if (!session) return { ok: false, message: 'Not signed in.' };
  if (!canOperate(session)) return { ok: false, message: 'Your role can’t add venues.' };

  await seed(session.orgId);
  const entitlement = await getEntitlement(session.orgId);
  const venues = await listVenues(session.orgId);

  const verdict = canAddVenue(entitlement, venues.length);
  if (!verdict.ok) return { ok: false, reason: verdict.reason, message: verdict.message };

  const name = String(formData.get('name') || '').trim();
  if (!name) return { ok: false, message: 'Give the venue a name.' };

  await createVenue(session.orgId, { name, city: String(formData.get('city') || '').trim() });
  revalidatePath('/');
  return { ok: true };
}

/** Publishing is gated on the same subscription fact — entitlement is an identity fact. */
export async function publishVenue(venueId) {
  const session = await getSession();
  if (!session) return { ok: false, message: 'Not signed in.' };
  if (!canOperate(session)) return { ok: false, message: 'Your role can’t publish menus.' };

  const entitlement = await getEntitlement(session.orgId);
  if (!canPublish(entitlement)) {
    return { ok: false, message: 'Publishing needs an active subscription.' };
  }

  const v = await updateVenue(session.orgId, venueId, { published: true });
  if (!v) return { ok: false, message: 'No such venue.' };

  revalidatePath('/');
  revalidatePath(`/m/${v.slug}`);
  return { ok: true };
}

/**
 * 86 a dish (or restore it) — the floor decision that reaches the public
 * surface. Flips the `out` flag on the item INSIDE the venue's stored menu and
 * revalidates the guest page, so /m/<slug> changes the moment service does.
 * Every service role can 86; venue-scoped roles only at their own venue.
 */
/**
 * Place a supply reorder — creates a pending order that the client then pays
 * for via POST /api/stripe/pay. No subscription check; pay-per-order only.
 * Role-gated to owner + general_manager.
 */
export async function placeSupplyReorder(formData) {
  const session = await getSession();
  if (!session) return { ok: false, message: 'Not signed in.' };
  if (session.role !== 'owner' && session.role !== 'general_manager') {
    return { ok: false, message: 'Your role cannot reorder supplies.' };
  }

  const raw = formData.get('items');
  if (!raw) return { ok: false, message: 'No items in the order.' };

  let items;
  try { items = JSON.parse(raw); } catch { return { ok: false, message: 'Invalid items.' }; }
  if (!Array.isArray(items) || items.length === 0) {
    return { ok: false, message: 'Order must have at least one item.' };
  }
  for (const item of items) {
    if (!item.id || typeof item.quantity !== 'number' || item.quantity < 1) {
      return { ok: false, message: 'Each item needs a valid id and quantity.' };
    }
  }

  try {
    const order = createOrder(session.orgId, items);
    revalidatePath('/supplies');
    return { ok: true, orderId: order.id, total: order.total };
  } catch (e) {
    return { ok: false, message: e.message };
  }
}

export async function toggleDish(formData) {
  const session = await getSession();
  if (!session) redirect('/auth/login');

  const venueId = String(formData.get('venueId') || '');
  const sectionIdx = Number(formData.get('section'));
  const itemIdx = Number(formData.get('item'));

  const venue = await getVenue(session.orgId, venueId);
  if (!venue || !venue.menu) redirect('/live-ops');
  if (session.venueSlug && venue.slug !== session.venueSlug) redirect('/live-ops');

  const menu = structuredClone(venue.menu);
  const item = menu.sections?.[sectionIdx]?.items?.[itemIdx];
  if (!item) redirect('/live-ops');
  item.out = !item.out;
  await updateVenue(session.orgId, venueId, { menu });

  revalidatePath('/live-ops');
  revalidatePath(`/venues/${venueId}`);
  revalidatePath(`/m/${venue.slug}`);
}
