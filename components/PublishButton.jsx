'use client';

import { useState, useTransition } from 'react';
import { publishVenue } from '@/app/actions.js';

export default function PublishButton({ venueId, hasMenu }) {
  const [error, setError] = useState(null);
  const [pending, start] = useTransition();

  if (!hasMenu) {
    return <a className="btn" href={`/venues/${venueId}`}>Build the menu first</a>;
  }

  return (
    <>
      <button
        className="btn primary"
        disabled={pending}
        onClick={() => start(async () => {
          const res = await publishVenue(venueId);
          if (!res?.ok) setError(res?.message || 'Could not publish.');
        })}
      >
        {pending ? 'Publishing…' : 'Publish'}
      </button>
      {error && <span className="err">{error}</span>}
    </>
  );
}
