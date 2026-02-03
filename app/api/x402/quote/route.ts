import { NextResponse } from 'next/server'

export async function GET() {
  return NextResponse.json({
    service: 'Protocol Risk Oracle',
    version: '0.3.0',
    x402: {
      enabled: process.env.X402_ENABLED === 'true',
      price: parseFloat(process.env.X402_PRICE || '0.10'),
      currency: 'USDC',
      network: 'solana',
      recipient: process.env.X402_RECIPIENT || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
    },
  })
}
