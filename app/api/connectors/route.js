import { NextResponse } from 'next/server';
import { connectorStatus } from '@/lib/connectors.js';

// The connector rail as an API — names, tiers and live/simulated booleans only.
// Env key NAMES tell an operator exactly which credential activates what; the
// values never appear anywhere.
export async function GET() {
  const connectors = connectorStatus();
  return NextResponse.json({
    connectors,
    live: connectors.filter((c) => c.live).length,
    simulated: connectors.filter((c) => !c.live).length,
  });
}
