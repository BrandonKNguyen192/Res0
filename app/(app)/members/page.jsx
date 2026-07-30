import { redirect } from 'next/navigation';
import { getSession } from '@/lib/contract.js';
import { listMembers, listVenues, seed } from '@/lib/db.js';

export default async function MembersPage() {
  const session = await getSession();
  if (!session) redirect('/auth/login');
  await seed(session.orgId);

  const [members, venues] = await Promise.all([
    listMembers(session.orgId),
    listVenues(session.orgId),
  ]);
  const venueName = (id) => venues.find((v) => v.id === id)?.name || 'All venues';

  return (
    <>
      <div className="head">
        <div>
          <div className="eyebrow">{session.orgName}</div>
          <h1>Team</h1>
          <p className="lede">
            Everyone belongs to the group, not to a shared login. A manager sees their venue;
            an owner sees the portfolio. The role decides, and the role comes from the token.
          </p>
        </div>
      </div>

      <div className="card" style={{ padding: 0 }}>
        <table>
          <thead>
            <tr>
              <th>Name</th>
              <th>Email</th>
              <th>Role</th>
              <th>Scope</th>
            </tr>
          </thead>
          <tbody>
            {members.map((m) => (
              <tr key={m.id}>
                <td style={{ fontWeight: 600 }}>{m.name}</td>
                <td style={{ color: 'var(--ink-2)' }}>{m.email}</td>
                <td><span className="pill brass">{m.role}</span></td>
                <td style={{ color: 'var(--ink-2)' }}>{venueName(m.venueId)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* A owns this. Invitations belong to Auth0 Organizations, not to a local table —
          which is the point: we never build our own user directory. */}
      <p className="notice" style={{ marginTop: 18 }}>
        Invitations are issued through the Auth0 Organization, so membership lives with the
        identity provider rather than in this app&rsquo;s database.
      </p>
    </>
  );
}
