import { NextResponse } from 'next/server';
import { getSession } from '@/lib/contract.js';
import { getVenue, updateVenue, seed } from '@/lib/db.js';

// Photograph a paper menu → the venue's guest page builds itself.
//
// Runs through OpenRouter (one key, every model), which is provisioned by
// `stripe projects add openrouter/api`. VERIFY THE MODEL ID against the catalogue before
// relying on it — model names move, and the CLI is the source of truth, not this comment.
//
// DEGRADES, NEVER FAILS. With no key configured the route returns a clearly-labelled sample
// menu so the flow is demoable, and `live: false` says plainly that no model ran. A demo that
// silently passes off a canned result as AI is the one failure mode worth engineering out.

const MODEL = process.env.OPENROUTER_MODEL || 'google/gemini-2.0-flash-001';

const SCHEMA_HINT = `Return ONLY JSON of this exact shape, no prose, no markdown fence:
{"title":string,"subtitle":string,"sections":[{"name":string,"items":[{"name":string,"desc":string,"price":string}]}]}
Rules: keep prices exactly as printed including the currency symbol. If a description is not
printed, write a short one from the dish name. Never invent dishes that are not visible.`;

export async function POST(req) {
  const session = await getSession();
  if (!session) return NextResponse.json({ error: 'Not signed in.' }, { status: 401 });
  await seed(session.orgId);

  let body;
  try { body = await req.json(); } catch { return NextResponse.json({ error: 'Bad request.' }, { status: 400 }); }

  const { venueId, imageDataUrl } = body || {};
  const venue = await getVenue(session.orgId, venueId);
  if (!venue) return NextResponse.json({ error: 'No such venue.' }, { status: 404 });

  const key = process.env.OPENROUTER_API_KEY;
  if (!key || !imageDataUrl) {
    const menu = sampleMenu(venue);
    await updateVenue(session.orgId, venueId, { menu });
    return NextResponse.json({
      ok: true, live: false, menu,
      note: key ? 'No image supplied — sample menu used.'
                : 'OPENROUTER_API_KEY is not set, so no model ran. This is a sample menu.',
    });
  }

  try {
    const r = await fetch('https://openrouter.ai/api/v1/chat/completions', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${key}` },
      body: JSON.stringify({
        model: MODEL,
        messages: [{
          role: 'user',
          content: [
            { type: 'text', text: `Read this restaurant menu photograph.\n\n${SCHEMA_HINT}` },
            { type: 'image_url', image_url: { url: imageDataUrl } },
          ],
        }],
        temperature: 0.2,
      }),
      signal: AbortSignal.timeout(60000),
    });

    const json = await r.json();
    const text = json?.choices?.[0]?.message?.content;
    if (!text) throw new Error(json?.error?.message || 'No content returned');

    const menu = parseMenu(text);
    if (!menu) throw new Error('Model returned unparseable JSON');

    await updateVenue(session.orgId, venueId, { menu });
    return NextResponse.json({ ok: true, live: true, model: MODEL, menu });
  } catch (e) {
    // Fall back rather than leaving the operator with nothing mid-demo — but say so.
    const menu = sampleMenu(venue);
    await updateVenue(session.orgId, venueId, { menu });
    return NextResponse.json({
      ok: true, live: false, menu,
      note: `Extraction failed (${String(e.message || e).slice(0, 120)}) — sample menu used.`,
    });
  }
}

/** Models like to wrap JSON in prose or a fence. Take the outermost object. */
function parseMenu(text) {
  const s = String(text);
  const start = s.indexOf('{');
  const end = s.lastIndexOf('}');
  if (start === -1 || end <= start) return null;
  try {
    const parsed = JSON.parse(s.slice(start, end + 1));
    if (!Array.isArray(parsed?.sections)) return null;
    return parsed;
  } catch { return null; }
}

function sampleMenu(venue) {
  return {
    title: venue.name,
    subtitle: venue.city ? `${venue.city} · Sample menu` : 'Sample menu',
    sections: [
      {
        name: 'To begin',
        items: [
          { name: 'Oysters, three ways', desc: 'Mignonette, ponzu, or simply cold', price: '¥360' },
          { name: 'Charred leeks', desc: 'Romesco, aged sherry, toasted hazelnut', price: '¥290' },
        ],
      },
      {
        name: 'Mains',
        items: [
          { name: 'Whole sea bass', desc: 'Salt-baked, fennel, brown butter', price: '¥980' },
          { name: 'Dry-aged duck', desc: 'Forty days, plum, burnt honey', price: '¥1,120' },
        ],
      },
    ],
  };
}
