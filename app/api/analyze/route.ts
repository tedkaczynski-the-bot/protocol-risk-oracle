import { NextRequest, NextResponse } from 'next/server'
import { analyzeProtocol } from '@/lib/analyze'
import { ProtocolData } from '@/src/types/risk'

// X402 config
const x402Config = {
  enabled: process.env.X402_ENABLED === 'true',
  pricePerAnalysis: parseFloat(process.env.X402_PRICE || '0.10'),
  recipientAddress: process.env.X402_RECIPIENT || 'HN7cABqLq46Es1jh92dQQisAq662SmxELLLsHHe4YWrH',
  network: 'solana' as const,
}

export async function POST(request: NextRequest) {
  // Check x402 payment
  if (x402Config.enabled) {
    const paymentProof = request.headers.get('x-402-payment')
    if (!paymentProof || paymentProof.length < 64) {
      return NextResponse.json(
        {
          error: 'Payment Required',
          x402: {
            price: x402Config.pricePerAnalysis,
            currency: 'USDC',
            network: x402Config.network,
            recipient: x402Config.recipientAddress,
          },
        },
        { status: 402 }
      )
    }
    // Note: In production, verify the Solana transaction here
    // using @solana/web3.js to confirm payment was actually made
  }

  try {
    const data = (await request.json()) as ProtocolData
    if (!data.address || !data.name) {
      return NextResponse.json(
        { error: 'Missing required fields: address, name' },
        { status: 400 }
      )
    }
    const result = analyzeProtocol(data)
    return NextResponse.json(result)
  } catch (error) {
    return NextResponse.json(
      { error: 'Analysis failed', details: String(error) },
      { status: 500 }
    )
  }
}
