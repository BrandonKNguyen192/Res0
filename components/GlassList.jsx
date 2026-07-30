'use client';

import { useState } from 'react';

// The by-the-glass window. Session-local toggles for the demo; the real wiring
// updates the venue's published menu through the same publish gate.
export default function GlassList({ items }) {
  const [list, setList] = useState(items);

  function toggle(id) {
    setList((prev) => prev.map((g) => (g.id === id ? { ...g, on: !g.on } : g)));
  }

  return (
    <div className="w86">
      {list.map((g) => (
        <div className="wrow" key={g.id}>
          <span className="wdot" style={{ background: g.on ? 'var(--accent)' : 'var(--bv)' }} />
          <div>
            <div className="wname">{g.name}</div>
            <div className="wnote">{g.note}</div>
          </div>
          <div className="wact">
            <label className="switch">
              <input
                type="checkbox"
                checked={g.on}
                onChange={() => toggle(g.id)}
                aria-label={`${g.name} — ${g.on ? 'on' : 'off'} the by-the-glass list`}
              />
              <span className="track" />
            </label>
          </div>
        </div>
      ))}
    </div>
  );
}
