import Link from 'next/link';
import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { homeFor } from '@/lib/roles.js';

export default async function LandingPage() {
  // A real signed-in session skips the landing page entirely — straight to the
  // role's home. Stub/demo sessions fall through so the landing stays reachable.
  const session = await getSession();
  if (session && !session.demo) redirect(homeFor(session.role));

  return (
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <nav style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: 'clamp(16px, 4vw, var(--spacing-29)) clamp(16px, 6vw, var(--spacing-144))', borderTop: '1.5px solid var(--color-ash)' }}>
        <div style={{ fontFamily: 'var(--font-editorial-new)', fontSize: 28, color: 'var(--color-voltage-blue)', letterSpacing: '-0.02em' }}>
          Res0
        </div>
        <div style={{ display: 'flex', gap: 12, alignItems: 'center' }}>
          <Link href="/dashboard" className="btn">Sign in</Link>
          <Link href="/dashboard" className="btn primary">Get started</Link>
        </div>
      </nav>

      <main style={{ flex: 1, maxWidth: 1200, width: '100%', margin: '0 auto', padding: 'clamp(48px, 10vw, var(--spacing-150)) clamp(16px, 6vw, var(--spacing-144))', display: 'flex', flexDirection: 'column', alignItems: 'center', textAlign: 'center' }}>
        <h1 style={{ fontFamily: 'var(--font-editorial-new)', fontWeight: 300, fontSize: 'clamp(40px, 6vw, 77px)', lineHeight: 0.95, letterSpacing: '-0.02em', color: 'var(--color-voltage-blue)', maxWidth: 900, marginBottom: 32 }}>
          The restaurant operating system
        </h1>
        <p style={{ fontFamily: 'var(--font-founders-grotesk)', fontWeight: 400, fontSize: 'clamp(18px, 2vw, 21px)', lineHeight: 1.5, letterSpacing: '-0.02em', color: 'var(--color-ink)', maxWidth: 600, marginBottom: 48 }}>
          From venue to guest, Res0 unifies your operations, menu, billing, and team into one platform. One subscription, every venue.
        </p>
        <Link href="/dashboard" className="btn primary" style={{ fontSize: 18, padding: '16px 56px' }}>
          Start
        </Link>

        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(min(260px, 100%), 1fr))', gap: 24, marginTop: 'clamp(48px, 10vw, 120px)', width: '100%' }}>
          <div className="card" style={{ textAlign: 'left', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-editorial-new)', fontSize: 21, color: 'var(--color-voltage-blue)', letterSpacing: '-0.02em' }}>Venue hub</div>
            <p style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.5 }}>Manage every location from one place. Add a venue and the subscription scales with you.</p>
          </div>
          <div className="card" style={{ textAlign: 'left', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-editorial-new)', fontSize: 21, color: 'var(--color-voltage-blue)', letterSpacing: '-0.02em' }}>Live ops</div>
            <p style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.5 }}>Real-time 86 boards, service watch, and by-the-glass management across all venues.</p>
          </div>
          <div className="card" style={{ textAlign: 'left', gap: 14 }}>
            <div style={{ fontFamily: 'var(--font-editorial-new)', fontSize: 21, color: 'var(--color-voltage-blue)', letterSpacing: '-0.02em' }}>Guest menu</div>
            <p style={{ fontSize: 16, fontWeight: 400, color: 'var(--color-ink)', lineHeight: 1.5 }}>Publish a living menu from a photograph. Changes reach guests instantly.</p>
          </div>
        </div>
      </main>

      <footer style={{ padding: 'clamp(24px, 5vw, var(--spacing-64)) clamp(16px, 6vw, var(--spacing-144))', borderTop: '1.5px solid var(--color-ash)', textAlign: 'center', fontFamily: 'var(--font-founders-grotesk)', fontWeight: 300, fontSize: 16, color: 'var(--color-voltage-blue)', letterSpacing: '-0.02em' }}>
        Res0 — Restaurant unification platform
      </footer>
    </div>
  );
}
