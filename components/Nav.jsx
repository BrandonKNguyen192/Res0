'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';

const LINKS = [
  { href: '/', label: 'Venues' },
  { href: '/members', label: 'Team' },
  { href: '/billing', label: 'Billing' },
];

export default function Nav() {
  const path = usePathname();
  return (
    <nav className="nav">
      {LINKS.map((l) => (
        <Link key={l.href} href={l.href} className={path === l.href ? 'on' : ''}>
          {l.label}
        </Link>
      ))}
    </nav>
  );
}
