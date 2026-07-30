'use client';

import { useState, useRef } from 'react';
import { useRouter } from 'next/navigation';

/**
 * The demo's wow beat: a photograph of a paper menu becomes the guest page.
 *
 * `live` comes back from the API and is rendered honestly — if no model ran, the chip says so
 * rather than letting a canned result pass as AI.
 */
export default function MenuBuilder({ venueId, hasMenu }) {
  const [busy, setBusy] = useState(false);
  const [result, setResult] = useState(null);
  const [error, setError] = useState(null);
  const fileRef = useRef(null);
  const router = useRouter();

  async function run(imageDataUrl) {
    setBusy(true); setError(null); setResult(null);
    try {
      const r = await fetch('/api/menu/extract', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ venueId, imageDataUrl }),
      });
      const j = await r.json();
      if (!r.ok) throw new Error(j?.error || 'Extraction failed');
      setResult(j);
      router.refresh();
    } catch (e) {
      setError(String(e.message || e));
    } finally {
      setBusy(false);
    }
  }

  function onPick(e) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = () => run(String(reader.result));
    reader.readAsDataURL(file);
  }

  return (
    <div className="card">
      <div className="name">Build the menu from a photograph</div>
      <p className="meta">
        Photograph the printed menu. The dishes, descriptions and prices are read off it and
        become the guest page — which is the thing the subscription publishes.
      </p>

      <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPick} />

      <div className="row">
        <button className="btn primary" disabled={busy} onClick={() => fileRef.current?.click()}>
          {busy ? 'Reading the menu…' : 'Upload a photo'}
        </button>
        <button className="btn" disabled={busy} onClick={() => run(null)}>
          {hasMenu ? 'Regenerate sample' : 'Use a sample'}
        </button>
      </div>

      {result && (
        <div className="row" style={{ gap: 8, flexWrap: 'wrap' }}>
          <span className={`pill ${result.live ? 'live' : 'draft'}`}>
            {result.live ? `Read by ${result.model}` : 'Sample — no model ran'}
          </span>
          {result.note && <span className="notice">{result.note}</span>}
        </div>
      )}
      {error && <div className="err">{error}</div>}
    </div>
  );
}
