'use client';

import { useState, useTransition } from 'react';
import { useRouter } from 'next/navigation';

export default function SuppliesOrder({ catalog, categories, history }) {
  const [cart, setCart] = useState({});
  const [error, setError] = useState(null);
  const [pending, start] = useTransition();
  const router = useRouter();

  const update = (id, qty) => {
    setCart((prev) => {
      const next = { ...prev };
      if (qty < 1) delete next[id];
      else next[id] = qty;
      return next;
    });
    setError(null);
  };

  const cartItems = catalog.filter((s) => cart[s.id]);
  const cartTotal = cartItems.reduce((sum, s) => sum + s.unitPrice * cart[s.id], 0);
  const itemCount = Object.values(cart).reduce((a, b) => a + b, 0);

  const placeOrder = () => {
    const items = Object.entries(cart).map(([id, quantity]) => ({ id, quantity }));

    start(async () => {
      try {
        const res = await fetch('/api/stripe/pay', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({ items }),
        });
        const data = await res.json();
        if (!res.ok) { setError(data.error || 'Could not start payment.'); return; }
        window.location.href = data.url;
      } catch {
        setError('Network error. Please try again.');
      }
    });
  };

  return (
    <>
      <div className="grid" style={{ gridTemplateColumns: '1fr 320px', alignItems: 'start' }}>
        <div>
          {categories.map((cat) => (
            <div key={cat} style={{ marginBottom: 24 }}>
              <h3 style={{ marginBottom: 8 }}>{cat}</h3>
              <div className="grid" style={{ gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))' }}>
                {catalog.filter((s) => s.category === cat).map((supply) => (
                  <div className="card" key={supply.id} style={{ gap: 4, padding: 12 }}>
                    <div style={{ fontSize: 24 }}>{supply.icon}</div>
                    <div className="name" style={{ fontSize: 14 }}>{supply.name}</div>
                    <div className="meta">{supply.unit}</div>
                    <div style={{ fontWeight: 600 }}>${supply.unitPrice}</div>
                    <div className="row" style={{ gap: 6, marginTop: 4 }}>
                      <button
                        className="btn"
                        style={{ padding: '2px 10px', minWidth: 0 }}
                        onClick={() => update(supply.id, (cart[supply.id] || 0) - 1)}
                        disabled={(cart[supply.id] || 0) < 1}
                      >−</button>
                      <input
                        type="number"
                        min="0"
                        max="99"
                        value={cart[supply.id] || 0}
                        onChange={(e) => update(supply.id, Math.max(0, parseInt(e.target.value) || 0))}
                        style={{ width: 48, textAlign: 'center' }}
                      />
                      <button
                        className="btn"
                        style={{ padding: '2px 10px', minWidth: 0 }}
                        onClick={() => update(supply.id, (cart[supply.id] || 0) + 1)}
                      >+</button>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>

        <div className="card" style={{ position: 'sticky', top: 24 }}>
          <div className="meta">Your order</div>
          {itemCount === 0 ? (
            <div className="notice">Select items and quantities to begin.</div>
          ) : (
            <>
              <div style={{ margin: '8px 0', fontSize: 13 }}>
                {itemCount} item{itemCount !== 1 ? 's' : ''}
              </div>
              {cartItems.map((s) => (
                <div key={s.id} className="row" style={{ justifyContent: 'space-between', fontSize: 13, padding: '4px 0' }}>
                  <span>{s.name} ×{cart[s.id]}</span>
                  <span>${(s.unitPrice * cart[s.id]).toLocaleString()}</span>
                </div>
              ))}
              <hr style={{ margin: '8px 0', border: 'none', borderTop: '1.5px solid var(--color-ash)' }} />
              <div className="row" style={{ justifyContent: 'space-between', fontWeight: 700 }}>
                <span>Total</span>
                <span>${cartTotal.toLocaleString()}</span>
              </div>
              <button className="btn primary" style={{ marginTop: 12, width: '100%' }} onClick={placeOrder} disabled={pending || itemCount === 0}>
                {pending ? 'Processing…' : 'Place reorder & pay'}
              </button>
              {error && <div className="err" style={{ marginTop: 8 }}>{error}</div>}
            </>
          )}
        </div>
      </div>

      {history.length > 0 && (
        <div style={{ marginTop: 32 }}>
          <h2>Order history</h2>
          <table style={{ width: '100%', marginTop: 8 }}>
            <thead>
              <tr className="meta">
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Order</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Items</th>
                <th style={{ textAlign: 'right', padding: '6px 8px' }}>Total</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Status</th>
                <th style={{ textAlign: 'left', padding: '6px 8px' }}>Date</th>
              </tr>
            </thead>
            <tbody>
              {history.slice().reverse().map((o) => (
                <tr key={o.id}>
                  <td style={{ padding: '6px 8px', fontFamily: 'monospace', fontSize: 12 }}>{o.id}</td>
                  <td style={{ padding: '6px 8px' }}>{o.items.map((i) => `${i.name} ×${i.quantity}`).join(', ')}</td>
                  <td style={{ padding: '6px 8px', textAlign: 'right' }}>${o.total.toLocaleString()}</td>
                  <td style={{ padding: '6px 8px' }}>
                    <span className={`pill ${o.status === 'paid' ? 'live' : 'draft'}`}>
                      {o.status === 'paid' ? 'Paid' : 'Pending'}
                    </span>
                  </td>
                  <td style={{ padding: '6px 8px', fontSize: 13 }}>{new Date(o.createdAt).toLocaleDateString()}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </>
  );
}
