import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    status: 'healthy',
    version: '0.3.0',
    x402: process.env.X402_ENABLED === 'true',
    analyzers: ['economic', 'governance', 'mev', 'liquidity', 'gameTheory', 'composability'],
  })
}
