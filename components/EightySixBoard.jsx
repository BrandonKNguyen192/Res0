import { toggleDish } from '@/app/actions.js';

// The 86 board, live from the store: every row is a real item on the venue's
// stored menu, and the button flips it on the PUBLIC guest page through a
// server action. Server component on purpose — the state lives in the store,
// not in this tree.
export default function EightySixBoard({ venue }) {
  const sections = venue?.menu?.sections || [];
  const items = sections.flatMap((section, si) =>
    (section.items || []).map((item, ii) => ({ si, ii, section: section.name, ...item })),
  );

  if (!items.length) {
    return (
      <p className="empty">
        No menu on {venue?.name || 'this venue'} yet — build it in the venue hub and the
        86 board lights up.
      </p>
    );
  }

  return (
    <div className="w86">
      {items.map((item) => (
        <div className={`wrow ${item.out ? 'out' : ''}`} key={`${item.si}-${item.ii}`}>
          <span className="wdot" />
          <div>
            <div className="wname">{item.name}</div>
            <div className="wnote">
              {item.out
                ? `86'd — pulled from /m/${venue.slug} in real time`
                : `${item.section} · live on the guest menu`}
            </div>
          </div>
          <div className="wact">
            <span className={`badge ${item.out ? 'no' : 'ok'}`}>{item.out ? "86'd" : 'Available'}</span>
            <form action={toggleDish}>
              <input type="hidden" name="venueId" value={venue.id} />
              <input type="hidden" name="section" value={item.si} />
              <input type="hidden" name="item" value={item.ii} />
              <button className="btn" type="submit">{item.out ? 'Restore' : '86 it'}</button>
            </form>
          </div>
        </div>
      ))}
    </div>
  );
}
