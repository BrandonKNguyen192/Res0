import { appConfig } from "@/lib/config";

function StatusCell({ label, ok }: { label: string; ok: boolean }) {
  return (
    <div className="cell">
      <span>{label}</span>
      <span className={`badge ${ok ? "live" : "off"}`}>{ok ? "ready" : "missing"}</span>
    </div>
  );
}

export default function Home() {
  return (
    <>
      <section className="hero">
        <h1>Identity and billing share one boundary.</h1>
        <p className="lede">
          The group is the account. The venue is the unit. Entitlement is an
          identity fact. Res0 answers &ldquo;who is the customer?&rdquo; once —
          and both Auth0 and Stripe agree on it.
        </p>
      </section>

      <div className="card">
        <h2>How it works</h2>
        <ul className="plain">
          <li>
            <span>
              <strong>The group is the account.</strong> An Auth0 Organization,
              not a <code>tenant_id</code> column.
            </span>
          </li>
          <li>
            <span>
              <strong>The venue is the unit.</strong> A Stripe subscription
              quantity, not a renegotiation.
            </span>
          </li>
          <li>
            <span>
              <strong>Entitlement is an identity fact.</strong> Publishing a
              guest menu is gated on the subscription being live.
            </span>
          </li>
          <li>
            <span>
              <strong>Menus build themselves.</strong> Photograph a paper menu
              and the venue&rsquo;s guest page appears.
            </span>
          </li>
        </ul>
      </div>

      <div className="card">
        <h2>Setup status</h2>
        <p className="muted">
          Credentials are provisioned with <code>stripe projects add</code> and
          pulled into <code>.env</code> — the app degrades gracefully until then.
        </p>
        <div className="status-grid">
          <StatusCell label="Auth0" ok={appConfig.auth0Configured} />
          <StatusCell label="Neon Postgres" ok={appConfig.dbConfigured} />
          <StatusCell label="Stripe" ok={appConfig.stripeConfigured} />
          <StatusCell label="Stripe webhook" ok={appConfig.stripeWebhookConfigured} />
          <StatusCell label="OpenRouter" ok={appConfig.openrouterConfigured} />
        </div>
      </div>
    </>
  );
}
