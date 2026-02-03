import { NextResponse } from 'next/server'

export async function GET() {
  const x402Config = {
    price: parseFloat(process.env.X402_PRICE || '0.10'),
    currency: 'USDC',
    network: 'solana',
    recipient: process.env.X402_RECIPIENT || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  }

  return NextResponse.json({
    name: 'Protocol Risk Oracle',
    description: 'Game-theoretic risk analysis for DeFi protocols',
    version: '0.3.0',
    author: 'unabotter',
    pricing: {
      model: 'x402',
      price: x402Config.price,
      currency: x402Config.currency,
      network: x402Config.network,
    },
    endpoints: {
      analyze: '/api/analyze',
      demo: '/api/demo',
      quote: '/api/x402/quote',
    },
  })
}
