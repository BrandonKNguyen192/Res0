'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

// The floating nav card. Items arrive already filtered by role (server-side) —
// this component only paints them; it can't grant anything the token didn't.
export default function Sidebar({ items, orgName }) {
  const path = usePathname();
  const isOn = (href) =>
    href === '/' ? path === '/' : path === href || path.startsWith(href + '/');

  return (
    <aside className="sidebar">
      <div className="brand">
        Res<span className="zero">0</span>
      </div>
      <div className="brand-sub eyebrow">Command center</div>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={`nav-item ${isOn(item.href) ? 'on' : ''}`}>
          {item.label}
        </Link>
      ))}
      <div className="side-foot eyebrow">
        {orgName ? `${orgName} · ` : ''}Restaurant unification platform
      </div>
    </aside>
  );
}
