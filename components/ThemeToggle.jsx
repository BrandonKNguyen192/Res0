'use client';

import { useEffect, useState } from 'react';

const NEXT = { light: 'white', white: 'dark', dark: 'light' };
const LABEL = { light: 'Warm', white: 'White', dark: 'Dark' };

// Cycles Warm → White → Dark, persisted; the boot script in the layout applies
// the stored theme before first paint.
export default function ThemeToggle() {
  const [theme, setTheme] = useState('light');

  useEffect(() => {
    setTheme(document.documentElement.getAttribute('data-theme') || 'light');
  }, []);

  function cycle() {
    const next = NEXT[theme] || 'light';
    document.documentElement.setAttribute('data-theme', next);
    try { localStorage.setItem('res0_theme', next); } catch {}
    setTheme(next);
  }

  return (
    <button type="button" className="btn" onClick={cycle} aria-label={`Theme: ${LABEL[theme]}. Switch theme`}>
      {LABEL[theme]}
    </button>
  );
}
