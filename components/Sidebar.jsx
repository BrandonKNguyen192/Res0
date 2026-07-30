'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ items, orgName }) {
  const path = usePathname();
  const isOn = (href) => path === href || path.startsWith(href + '/');

  return (
    <aside className="sidebar">
      <div className="brand">
        Res0
      </div>
      <div className="brand-sub">Command center</div>
      {items.map((item) => (
        <Link key={item.href} href={item.href} className={`nav-item ${isOn(item.href) ? 'on' : ''}`}>
          {item.label}
        </Link>
      ))}
      <div className="side-foot">
        {orgName ? `${orgName} · ` : ''}Restaurant unification platform
      </div>
    </aside>
  );
}
