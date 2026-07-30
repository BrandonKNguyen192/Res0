import '@/app/globals.css';
import { getSession } from '@/lib/contract.js';
import Nav from '@/components/Nav.jsx';

export const metadata = {
  title: 'Res0 — one boundary for identity and billing',
  description: 'Multi-venue hospitality SaaS. The group is the account, the venue is the unit.',
};

export default async function RootLayout({ children }) {
  // The org chip renders on every screen from the SAME session the pages authorise against.
  // When A lands Auth0, this becomes the real org and nothing below changes.
  const session = await getSession();
  const initials = (session?.orgName || '?')
    .split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <header className="topbar">
            <div className="topbar-in">
              <div className="brand"><span className="dot" />Res<span className="zero">0</span></div>
              <Nav />
              {session && (
                <div className="org" title="Auth0 Organization — the boundary everything is scoped to">
                  <div className="mark">{initials}</div>
                  <div className="who">
                    <b>{session.orgName}</b>
                    <span>{session.name} · {session.roles[0]}</span>
                  </div>
                </div>
              )}
            </div>
          </header>
          <main className="main">{children}</main>
        </div>
      </body>
    </html>
  );
}
