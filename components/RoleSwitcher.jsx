'use client';

import { useTransition } from 'react';
import { setDemoRole } from '@/app/actions.js';
import { ROLES, ROLE_LABEL } from '@/lib/roles.js';

// Demo-only. Visible while Auth0 is unprovisioned: switches the stub persona
// through a server action, exercising the same server-side role enforcement a
// real token would. Disappears the moment real Auth0 sessions exist.
export default function RoleSwitcher({ current }) {
  const [pending, start] = useTransition();

  return (
    <div className="seg-toggle" role="group" aria-label="View as role (demo)">
      {ROLES.map((role) => (
        <button
          key={role}
          type="button"
          className={role === current ? 'on' : ''}
          disabled={pending}
          onClick={() => start(async () => {
            const fd = new FormData();
            fd.set('role', role);
            await setDemoRole(fd);
          })}
        >
          {ROLE_LABEL[role]}
        </button>
      ))}
    </div>
  );
}
