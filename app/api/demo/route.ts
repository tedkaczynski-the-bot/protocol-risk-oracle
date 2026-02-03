import { NextResponse } from 'next/server'
import { analyzeProtocol, sampleProtocol } from '@/lib/analyze'

export async function GET() {
  const result = analyzeProtocol(sampleProtocol)
  return NextResponse.json(result)
}
