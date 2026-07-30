// The connector registry — the platform's "plug-and-play keys" pattern, written
// for Res0: every capability runs simulated until its key appears in the env,
// and the UI reports live/simulated per connector instead of pretending.
// Status is computed from env PRESENCE only — no key values ever leave here.

export const CONNECTORS = [
  { name: 'Square', kind: 'pos', tier: 'Open API', envKey: 'SQUARE_ACCESS_TOKEN' },
  { name: 'Lightspeed (O-Series)', kind: 'pos', tier: 'Open API', envKey: 'LIGHTSPEED_TOKEN' },
  { name: 'Toast', kind: 'pos', tier: 'Partner', envKey: 'TOAST_API_KEY' },
  { name: 'Oracle Simphony', kind: 'pos', tier: 'Partner', envKey: 'SIMPHONY_API_KEY' },
  { name: 'Bistrochat', kind: 'reservations', tier: 'Partner', envKey: 'BISTROCHAT_API_KEY' },
  { name: 'SevenRooms', kind: 'reservations', tier: 'Partner', envKey: 'SEVENROOMS_API_KEY' },
  { name: 'LINE MAN Wongnai', kind: 'delivery', tier: 'Partner', envKey: 'WONGNAI_API_KEY' },
  { name: 'MarginEdge', kind: 'invoices', tier: 'Partner', envKey: 'MARGINEDGE_API_KEY' },
  { name: '7shifts', kind: 'labor', tier: 'Open API', envKey: 'SEVENSHIFTS_API_KEY' },
];

export function connectorStatus() {
  return CONNECTORS.map((c) => ({ ...c, live: Boolean(process.env[c.envKey]) }));
}

/** Is any connector of this kind live? Drives the honest topbar pills. */
export function kindLive(kind) {
  return connectorStatus().some((c) => c.kind === kind && c.live);
}
