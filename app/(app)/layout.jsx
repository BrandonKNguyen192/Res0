import '@/app/globals.css';
import { getSession } from '@/lib/contract.js';
import { navFor, ROLE_LABEL } from '@/lib/roles.js';
import Sidebar from '@/components/Sidebar.jsx';
import RoleSwitcher from '@/components/RoleSwitcher.jsx';
import { auth0 } from '@/lib/auth0.js';
import { kindLive } from '@/lib/connectors.js';

export const metadata = {
  title: 'Res0 — command center',
  description: 'Multi-venue hospitality. The group is the account, the venue is the unit.',
};

export default async function AppLayout({ children }) {
  const session = await getSession();
  const initials = (session?.name || '?')
    .split(/\s+/).slice(0, 2).map((w) => w[0]).join('').toUpperCase();

  return (
    <html lang="en">
      <body>
        <div className="shell">
          <Sidebar items={session ? navFor(session.role) : []} orgName={session?.orgName} />
          <div className="content">
            <header className="topbar">
              <div className="hstatus">
                <span className="hs on"><i className="hdot" />API live</span>
                <span className={`hs ${kindLive('pos') ? 'on' : 'warn'}`}>
                  <i className="hdot" />POS · {kindLive('pos') ? 'live' : 'simulated'}
                </span>
              </div>
              <span className="tspacer" />
              {session?.demo && <RoleSwitcher current={session.role} />}
              {session && (
                <div className="org" title={`${session.orgName} — role from ${session.demo ? 'demo persona (Auth0 pending)' : 'the Auth0 token'}`}>
                  <div className="mark">{initials}</div>
                  <div className="who">
                    <b>{session.name}</b>
                    <span>{session.orgName} · {ROLE_LABEL[session.role]}</span>
                  </div>
                </div>
              )}
              {auth0 && <a className="btn" href="/auth/logout">Sign out</a>}
            </header>
            <main className="main">{children}</main>
          </div>
        </div>
      </body>
    </html>
  );
}
