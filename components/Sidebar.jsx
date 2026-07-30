'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar({ items, orgName }) {
  const [open, setOpen] = useState(false);
  const path = usePathname();
  const isOn = (href) => path === href || path.startsWith(href + '/');

  return (
    <>
      <button className="nav-toggle" onClick={() => setOpen(true)} aria-label="Open navigation">
        <span /><span /><span />
      </button>
      {open && <div className="nav-overlay" onClick={() => setOpen(false)} />}
      <aside className={`sidebar ${open ? 'open' : ''}`}>
        <div className="sidebar-brand-watermark">Res0</div>
        <div className="sidebar-header">
          <Link href="/" className="brand" onClick={() => setOpen(false)}>Res0</Link>
          <button className="nav-close" onClick={() => setOpen(false)} aria-label="Close navigation">×</button>
        </div>
        <div className="brand-sub">Command center</div>
        {items.map((item) => (
          <Link key={item.href} href={item.href} className={`nav-item ${isOn(item.href) ? 'on' : ''}`} onClick={() => setOpen(false)}>
            {item.label}
          </Link>
        ))}
        <div className="side-foot">
          {orgName ? `${orgName} · ` : ''}Restaurant unification platform
        </div>
        <Link href="/" className="nav-item" style={{ marginTop: 'auto', borderTop: '1.5px solid var(--color-ash)', paddingTop: 12, borderRadius: 0 }} onClick={() => setOpen(false)}>Sign out</Link>
      </aside>
    </>
  );
}
