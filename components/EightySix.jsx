'use client';

import { useState } from 'react';

const STATE_META = {
  ok: { cls: '', badge: ['ok', 'Available'], action: '86 it' },
  low: { cls: 'low', badge: ['warn', 'Low'], action: '86 it' },
  out: { cls: 'out', badge: ['no', "86'd"], action: 'Restore' },
  feature: { cls: '', badge: ['ok', 'Feature'], action: '86 it' },
};

// The 86 board. Session-local state for the demo — the real version syncs the
// published guest menu, which is exactly what "entitlement is an identity fact"
// buys: one boundary, so a floor decision can reach the public surface.
export default function EightySix({ items }) {
  const [list, setList] = useState(items);

  function toggle(id) {
    setList((prev) =>
      prev.map((item) =>
        item.id === id
          ? item.state === 'out'
            ? { ...item, state: 'ok', note: 'restored just now — back on the guest menu' }
            : { ...item, state: 'out', note: "86'd just now — pulled from the guest menu" }
          : item,
      ),
    );
  }

  return (
    <div className="w86">
      {list.map((item) => {
        const meta = STATE_META[item.state] ?? STATE_META.ok;
        return (
          <div className={`wrow ${meta.cls}`} key={item.id}>
            <span className="wdot" />
            <div>
              <div className="wname">{item.name}</div>
              <div className="wnote">{item.note}</div>
            </div>
            <div className="wact">
              <span className={`badge ${meta.badge[0]}`}>{meta.badge[1]}</span>
              <button type="button" className="btn" onClick={() => toggle(item.id)}>
                {meta.action}
              </button>
            </div>
          </div>
        );
      })}
    </div>
  );
}
