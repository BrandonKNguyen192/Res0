// Simulated operations data for the demo. The real POS/reservations/labor
// connectors are the roadmap; until one is wired, every number from this file
// is labelled "simulated" in the UI — same honesty rule as the menu extractor.
// Real facts (venues, publish state, entitlement) always come from the store,
// never from here.

const OPS = {
  'above-eleven': { covers: 84, revenue: 11340, laborPct: 27, slh: 52, prime: 58, delta: 8 },
  'charcoal-bkk': { covers: 72, revenue: 4460, laborPct: 28, slh: 44, prime: 61, delta: 2 },
};

// Deterministic filler for venues added live during the demo.
function hash(s) {
  let h = 0;
  for (const c of s) h = (h * 31 + c.charCodeAt(0)) % 997;
  return h;
}

export function opsFor(venue) {
  if (OPS[venue.slug]) return OPS[venue.slug];
  const h = hash(venue.slug);
  return {
    covers: 40 + (h % 90),
    revenue: 2400 + (h % 70) * 110,
    laborPct: 24 + (h % 8),
    slh: 38 + (h % 18),
    prime: 54 + (h % 9),
    delta: (h % 11) - 4,
  };
}

export const money = (n) => `$${n.toLocaleString('en-US')}`;

export const TONIGHT = {
  laborLive: 27,
  laborGoal: 28,
  varianceHrs: '+2.1',
  variancePos: 0.56, // 0..1 along the gauge
  overtimeHrs: 0.5,
  covers: 72,
  revenue: 9864,
  avgCheck: 137,
  topPour: 'Pisco Sour',
  topPourNote: '38 poured',
  repeatGuests: 34,
  tableTurns: '1.8×',
  book: {
    covers: 69,
    parties: 25,
    vip: 4,
    noShowRisk: '≈5.9',
    sources: [
      ['Bistrochat', 35],
      ['Google', 12],
      ['Instagram', 12],
      ['Phone', 6],
      ['Walk-in hold', 4],
    ],
    rows: [
      { time: '18:00', name: 'H. Nakamura', size: 3, src: 'Bistrochat' },
      { time: '18:00', name: 'W. Siriporn', size: 4, src: 'Bistrochat' },
      { time: '18:30', name: 'M. Laurent', size: 2, src: 'Google', vip: true },
      { time: '19:00', name: 'K. Anand', size: 6, src: 'Bistrochat' },
      { time: '19:30', name: 'J. Okafor', size: 2, src: 'Instagram' },
      { time: '20:00', name: 'S. Tanaka', size: 4, src: 'Bistrochat', vip: true },
      { time: '20:30', name: 'A. Chen', size: 2, src: 'Phone' },
    ],
  },
};

export const FLOOR = {
  seated: 62,
  booked: 84,
  openTables: '4 / 22',
  waitlist: 6,
  ticketMin: 14,
  laborNow: 27,
  coversVsForecast: '+7%',
  voids: 72,
};

export const WATCH = [
  { id: 'w1', name: 'Hotate batamiso', note: '8 portions left — auto-86 + menu sync at 0', state: 'low' },
  { id: 'w2', name: 'Wagyu nigiri', note: "86'd at 19:40 — pulled from the guest menu", state: 'out' },
  { id: 'w3', name: 'Lomo saltado', note: 'running hot · 19 fired tonight', state: 'ok' },
  { id: 'w4', name: 'Saint-Véran (glass)', note: 'feature — push at the by-the-glass window', state: 'feature' },
];

export const CONNECTORS = [
  { name: 'Square', kind: 'pos', tier: 'Open API' },
  { name: 'Lightspeed (O-Series)', kind: 'pos', tier: 'Open API' },
  { name: 'Toast', kind: 'pos', tier: 'Partner' },
  { name: 'Oracle Simphony', kind: 'pos', tier: 'Partner' },
  { name: 'LINE MAN Wongnai', kind: 'delivery', tier: 'Partner' },
  { name: 'SevenRooms', kind: 'reservations', tier: 'Partner' },
  { name: 'MarginEdge', kind: 'invoices', tier: 'Partner' },
  { name: '7shifts', kind: 'labor', tier: 'Open API' },
];

export const BEVERAGE = {
  kpis: [
    { l: 'Top pour tonight', n: 'Pisco Sour', d: '38 poured · simulated' },
    { l: 'Pour cost', n: '19%', d: 'in band', up: true },
    { l: 'Glass pours', n: '142', d: '+11% vs last Friday', up: true },
    { l: 'Wine GP tonight', n: '$1,860', d: 'simulated' },
  ],
  glassList: [
    { id: 'g1', name: 'Saint-Véran, Domaine des Deux Roches', note: 'feature at the window', on: true },
    { id: 'g2', name: 'Gamay, Julie Balagny "Simone"', note: 'last 4 glasses', on: true },
    { id: 'g3', name: 'Fino en rama, Bodegas Callejuela', note: 'staff pick', on: true },
    { id: 'g4', name: 'Chenin, Terre Brûlée "Le Blanc"', note: 'resting — new vintage lands Tuesday', on: false },
  ],
  watch: [
    { name: 'Yuzu sake (pairing)', note: '2 bottles left — pairing menu needs 3', state: 'low' },
    { name: 'Mezcal Vago Elote', note: "86'd — importer shorted the case", state: 'out' },
  ],
};
