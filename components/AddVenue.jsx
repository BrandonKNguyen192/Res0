'use client';

import { useState, useTransition } from 'react';
import { addVenue } from '@/app/actions.js';

/**
 * The money moment. Two states in one card:
 *   allowed  → a form
 *   blocked  → the gate, naming the exact number and offering the way through
 *
 * The server re-checks regardless (app/actions.js) — this is the readable half of the rule,
 * not the rule itself.
 */
export default function AddVenue({ allowed, message, count, limit }) {
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [pending, start] = useTransition();

  if (!allowed) {
    return (
      <div className="gate">
        <span className="pill brass">At plan limit</span>
        <div className="count">{count} / {limit}</div>
        <h3>This would be venue number {count + 1}.</h3>
        <p>{message} Add a venue to the plan and it unlocks immediately — the subscription is what decides, so it takes effect the moment Stripe confirms it.</p>
        <a className="btn primary" href="/billing">Add a venue to the plan</a>
      </div>
    );
  }

  if (!open) {
    return (
      <button className="blocked" onClick={() => setOpen(true)} style={{ cursor: 'pointer' }}>
        <div style={{ fontSize: 26, color: 'var(--brass)' }}>+</div>
        <div style={{ color: 'var(--ink-2)', fontWeight: 600 }}>Add a venue</div>
        <div className="notice">{limit - count} left on this plan</div>
      </button>
    );
  }

  return (
    <div className="card">
      <div className="name">New venue</div>
      <form
        action={(fd) => start(async () => {
          const res = await addVenue(fd);
          if (res?.ok) { setOpen(false); setError(null); }
          else setError(res?.message || 'Could not add that venue.');
        })}
        style={{ display: 'flex', flexDirection: 'column', gap: 12 }}
      >
        <div className="field">
          <label htmlFor="name">Name</label>
          <input id="name" name="name" type="text" placeholder="Havana Social" autoFocus required />
        </div>
        <div className="field">
          <label htmlFor="city">City</label>
          <input id="city" name="city" type="text" placeholder="Bangkok" />
        </div>
        {error && <div className="err">{error}</div>}
        <div className="row">
          <button className="btn primary" type="submit" disabled={pending}>
            {pending ? 'Adding…' : 'Add venue'}
          </button>
          <button className="btn" type="button" onClick={() => { setOpen(false); setError(null); }}>
            Cancel
          </button>
        </div>
      </form>
    </div>
  );
}
