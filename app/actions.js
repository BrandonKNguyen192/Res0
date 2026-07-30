'use server';

import { revalidatePath } from 'next/cache';
import { getSession, getEntitlement, canAddVenue, canPublish } from '@/lib/contract.js';
import { listVenues, createVenue, updateVenue, seed } from '@/lib/db.js';

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

  seed(session.orgId);
  const entitlement = await getEntitlement(session.orgId);
  const venues = listVenues(session.orgId);

  const verdict = canAddVenue(entitlement, venues.length);
  if (!verdict.ok) return { ok: false, reason: verdict.reason, message: verdict.message };

  const name = String(formData.get('name') || '').trim();
  if (!name) return { ok: false, message: 'Give the venue a name.' };

  createVenue(session.orgId, { name, city: String(formData.get('city') || '').trim() });
  revalidatePath('/');
  return { ok: true };
}

/** Publishing is gated on the same subscription fact — entitlement is an identity fact. */
export async function publishVenue(venueId) {
  const session = await getSession();
  if (!session) return { ok: false, message: 'Not signed in.' };

  const entitlement = await getEntitlement(session.orgId);
  if (!canPublish(entitlement)) {
    return { ok: false, message: 'Publishing needs an active subscription.' };
  }

  const v = updateVenue(session.orgId, venueId, { published: true });
  if (!v) return { ok: false, message: 'No such venue.' };

  revalidatePath('/');
  revalidatePath(`/m/${v.slug}`);
  return { ok: true };
}
