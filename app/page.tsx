"use client"

import { useState, useCallback } from "react"
import { useWallet, useConnection } from "@solana/wallet-adapter-react"
import { WalletMultiButton } from "@solana/wallet-adapter-react-ui"
import {
  PublicKey,
  Transaction,
  SystemProgram,
  LAMPORTS_PER_SOL,
} from "@solana/web3.js"
import {
  createTransferInstruction,
  getAssociatedTokenAddress,
  TOKEN_PROGRAM_ID,
} from "@solana/spl-token"

// USDC on Solana mainnet
const USDC_MINT = new PublicKey("EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v")
const USDC_DECIMALS = 6

interface AnalysisResult {
  protocol?: string
  overallScore?: number
  overallSeverity?: string
  categories?: Record<string, unknown>
  summary?: string
  recommendations?: string[]
  nashEquilibria?: string[]
  dominantStrategies?: string[]
  error?: string
}

export default function Home() {
  const { publicKey, signTransaction, connected } = useWallet()
  const { connection } = useConnection()

  const [form, setForm] = useState({
    name: "",
    address: "",
    chain: "solana",
    context: "",
  })
  const [loading, setLoading] = useState(false)
  const [result, setResult] = useState<AnalysisResult | null>(null)
  const [error, setError] = useState<string | null>(null)
  const [quote, setQuote] = useState<{
    price: number
    recipient: string
    currency: string
    network: string
  } | null>(null)

  // Fetch quote on mount
  useState(() => {
    fetch("/api/x402/quote")
      .then((r) => r.json())
      .then((data) => setQuote(data.x402))
      .catch(console.error)
  })

  const runDemo = async () => {
    setLoading(true)
    setError(null)
    setResult(null)

    try {
      const res = await fetch("/api/demo")
      const data = await res.json()
      setResult(data)
    } catch (err) {
      setError(err instanceof Error ? err.message : "Demo failed")
    } finally {
      setLoading(false)
    }
  }

  const sendPayment = useCallback(async (): Promise<string | null> => {
    if (!publicKey || !signTransaction || !quote) {
      setError("Wallet not connected or quote not loaded")
      return null
    }

    try {
      const recipientPubkey = new PublicKey(quote.recipient)
      const amount = Math.floor(quote.price * Math.pow(10, USDC_DECIMALS))

      // Get token accounts
      const fromAta = await getAssociatedTokenAddress(USDC_MINT, publicKey)
      const toAta = await getAssociatedTokenAddress(USDC_MINT, recipientPubkey)

      // Create transfer instruction
      const transferIx = createTransferInstruction(
        fromAta,
        toAta,
        publicKey,
        amount,
        [],
        TOKEN_PROGRAM_ID
      )

      // Build and sign transaction
      const { blockhash, lastValidBlockHeight } =
        await connection.getLatestBlockhash()

      const tx = new Transaction({
        blockhash,
        lastValidBlockHeight,
        feePayer: publicKey,
      }).add(transferIx)

      const signedTx = await signTransaction(tx)
      const signature = await connection.sendRawTransaction(signedTx.serialize())

      // Wait for confirmation
      await connection.confirmTransaction({
        signature,
        blockhash,
        lastValidBlockHeight,
      })

      return signature
    } catch (err) {
      console.error("Payment error:", err)
      if (err instanceof Error) {
        if (err.message.includes("User rejected")) {
          setError("Transaction rejected")
        } else if (err.message.includes("insufficient")) {
          setError("Insufficient USDC balance")
        } else {
          setError(`Payment failed: ${err.message}`)
        }
      }
      return null
    }
  }, [publicKey, signTransaction, connection, quote])

  const runAnalysis = async () => {
    if (!form.name || !form.address) {
      setError("Protocol name and address are required")
      return
    }

    setLoading(true)
    setError(null)
    setResult(null)

    // First, send payment
    const txSignature = await sendPayment()
    if (!txSignature) {
      setLoading(false)
      return
    }

    // Then, call analyze API with payment proof
    try {
      const res = await fetch("/api/analyze", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          "x-402-payment": txSignature,
        },
        body: JSON.stringify({
          name: form.name,
          address: form.address,
          context: form.context,
          chain: form.chain,
        }),
      })

      const data = await res.json()

      if (!res.ok) {
        setError(data.error || "Analysis failed")
      } else {
        setResult(data)
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : "Analysis failed")
    } finally {
      setLoading(false)
    }
  }

  const getSeverityColor = (severity?: string) => {
    switch (severity) {
      case "low":
        return "text-green-500 bg-green-500/10"
      case "medium":
        return "text-yellow-500 bg-yellow-500/10"
      case "high":
        return "text-orange-500 bg-orange-500/10"
      case "critical":
        return "text-red-500 bg-red-500/10"
      default:
        return "text-zinc-400 bg-zinc-500/10"
    }
  }

  return (
    <main className="min-h-screen">
      {/* Header */}
      <header className="border-b border-zinc-800 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between">
          <div>
            <h1 className="text-lg font-semibold tracking-tight">
              Protocol Risk Oracle
            </h1>
            <p className="text-sm text-zinc-500">
              Game-theoretic risk analysis for DeFi
            </p>
          </div>
          <div className="flex items-center gap-4">
            <div className="text-sm text-zinc-500 hidden sm:block">
              {quote && (
                <span className="text-green-500 font-medium">
                  ${quote.price} USDC
                </span>
              )}{" "}
              / analysis
            </div>
            <WalletMultiButton />
          </div>
        </div>
      </header>

      <div className="max-w-5xl mx-auto px-6 py-8">
        <div className="grid lg:grid-cols-2 gap-6">
          {/* Input Panel */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-lg">
            <div className="px-4 py-3 border-b border-zinc-800">
              <h2 className="font-medium">Analysis Input</h2>
            </div>
            <div className="p-4 space-y-4">
              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Protocol Name <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.name}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, name: e.target.value }))
                  }
                  placeholder="e.g., Uniswap V3"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Contract Address <span className="text-red-500">*</span>
                </label>
                <input
                  type="text"
                  value={form.address}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, address: e.target.value }))
                  }
                  placeholder="Solana or EVM address"
                />
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Chain
                </label>
                <select
                  value={form.chain}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, chain: e.target.value }))
                  }
                >
                  <option value="solana">Solana</option>
                  <option value="ethereum">Ethereum</option>
                  <option value="base">Base</option>
                  <option value="arbitrum">Arbitrum</option>
                  <option value="polygon">Polygon</option>
                </select>
              </div>

              <div>
                <label className="block text-sm text-zinc-400 mb-1.5">
                  Additional Context
                </label>
                <textarea
                  value={form.context}
                  onChange={(e) =>
                    setForm((f) => ({ ...f, context: e.target.value }))
                  }
                  placeholder="Docs, tokenomics, governance parameters, specific concerns..."
                  rows={3}
                />
              </div>

              <div className="flex gap-3 pt-2">
                <button
                  onClick={runAnalysis}
                  disabled={loading || !connected || !form.name || !form.address}
                  className="flex-1 py-2.5 px-4 bg-green-600 text-white font-medium rounded hover:bg-green-700 disabled:bg-zinc-700 disabled:text-zinc-500"
                >
                  {loading ? "Processing..." : `Analyze ($${quote?.price || "0.10"})`}
                </button>
                <button
                  onClick={runDemo}
                  disabled={loading}
                  className="py-2.5 px-4 border border-zinc-700 text-zinc-400 font-medium rounded hover:border-zinc-600 hover:text-zinc-300"
                >
                  Demo
                </button>
              </div>

              {!connected && (
                <p className="text-sm text-zinc-500 text-center">
                  Connect wallet to run paid analysis
                </p>
              )}
            </div>
          </div>

          {/* Output Panel */}
          <div className="border border-zinc-800 bg-zinc-900/50 rounded-lg flex flex-col">
            <div className="px-4 py-3 border-b border-zinc-800 flex items-center justify-between">
              <h2 className="font-medium">Analysis Output</h2>
              {result?.overallScore !== undefined && (
                <span
                  className={`px-2 py-0.5 text-sm font-medium rounded ${getSeverityColor(
                    result.overallSeverity
                  )}`}
                >
                  {result.overallScore}/10 {result.overallSeverity}
                </span>
              )}
            </div>
            <div className="p-4 flex-1 overflow-auto">
              {error && (
                <div className="text-red-400 text-sm p-3 bg-red-500/10 border border-red-500/20 rounded">
                  {error}
                </div>
              )}

              {!result && !error && !loading && (
                <div className="text-zinc-500 text-sm">
                  <p>Enter protocol details and click Analyze to begin.</p>
                  <p className="mt-2">
                    Or click Demo to see a sample analysis.
                  </p>
                </div>
              )}

              {loading && (
                <div className="text-zinc-400 text-sm">
                  <p>Processing analysis...</p>
                  <p className="mt-1 text-zinc-500">This may take 10-30 seconds.</p>
                </div>
              )}

              {result && !error && (
                <div className="space-y-4">
                  {result.summary && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-1">
                        Summary
                      </h3>
                      <p className="text-sm">{result.summary}</p>
                    </div>
                  )}

                  {result.nashEquilibria && result.nashEquilibria.length > 0 && (
                    <div>
                      <h3 className="text-sm font-medium text-zinc-400 mb-1">
                        Nash Equilibria
                      </h3>
                      <ul className="text-sm space-y-1">
                        {result.nashEquilibria.map((eq, i) => (
                          <li key={i} className="text-zinc-300">
                            {eq}
                          </li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {result.dominantStrategies &&
                    result.dominantStrategies.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">
                          Dominant Strategies
                        </h3>
                        <ul className="text-sm space-y-1">
                          {result.dominantStrategies.map((strat, i) => (
                            <li key={i} className="text-zinc-300">
                              {strat}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  {result.recommendations &&
                    result.recommendations.length > 0 && (
                      <div>
                        <h3 className="text-sm font-medium text-zinc-400 mb-1">
                          Recommendations
                        </h3>
                        <ul className="text-sm space-y-1">
                          {result.recommendations.map((rec, i) => (
                            <li key={i} className="text-zinc-300">
                              {rec}
                            </li>
                          ))}
                        </ul>
                      </div>
                    )}

                  <details className="mt-4">
                    <summary className="text-sm text-zinc-500 cursor-pointer hover:text-zinc-400">
                      Full JSON Response
                    </summary>
                    <pre className="mt-2 p-3 bg-zinc-950 border border-zinc-800 rounded text-xs overflow-auto max-h-80 font-mono">
                      {JSON.stringify(result, null, 2)}
                    </pre>
                  </details>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Categories */}
        <div className="mt-8 border border-zinc-800 bg-zinc-900/50 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-medium">Analysis Categories</h2>
          </div>
          <div className="p-4 grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[
              {
                name: "Game Theory",
                desc: "Equilibria, dominant strategies, mechanism design flaws",
              },
              {
                name: "Economic Risk",
                desc: "Token concentration, flash loans, incentive misalignment",
              },
              {
                name: "Governance",
                desc: "Quorum attacks, timelocks, voting concentration",
              },
              {
                name: "Liquidity",
                desc: "Bank run dynamics, IL exposure, TVL mismatches",
              },
              {
                name: "MEV",
                desc: "Sandwiches, JIT liquidity, oracle front-running",
              },
              {
                name: "Composability",
                desc: "Dependencies, oracle risk, bridge exposure",
              },
            ].map((cat) => (
              <div key={cat.name} className="p-3 border border-zinc-800 rounded">
                <h3 className="font-medium text-sm mb-1">{cat.name}</h3>
                <p className="text-sm text-zinc-500">{cat.desc}</p>
              </div>
            ))}
          </div>
        </div>

        {/* API Reference */}
        <div className="mt-8 border border-zinc-800 bg-zinc-900/50 rounded-lg">
          <div className="px-4 py-3 border-b border-zinc-800">
            <h2 className="font-medium">API Integration</h2>
          </div>
          <div className="p-4 space-y-4 text-sm">
            <div>
              <h3 className="text-zinc-400 mb-2">Get pricing</h3>
              <code className="block p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-xs overflow-x-auto">
                curl https://protocol-risk-oracle.vercel.app/api/x402/quote
              </code>
            </div>
            <div>
              <h3 className="text-zinc-400 mb-2">Run analysis</h3>
              <code className="block p-3 bg-zinc-950 border border-zinc-800 rounded font-mono text-xs overflow-x-auto whitespace-pre">
{`curl -X POST https://protocol-risk-oracle.vercel.app/api/analyze \\
  -H "Content-Type: application/json" \\
  -H "x-402-payment: TX_SIGNATURE" \\
  -d '{"address": "...", "name": "Protocol"}'`}
              </code>
            </div>
          </div>
        </div>
      </div>

      {/* Footer */}
      <footer className="border-t border-zinc-800 mt-12 px-6 py-4">
        <div className="max-w-5xl mx-auto flex items-center justify-between text-sm text-zinc-500">
          <span>unabotter</span>
          <div className="flex gap-4">
            <a href="/skill.md" className="hover:text-zinc-300">
              Skill
            </a>
            <a href="/agent.json" className="hover:text-zinc-300">
              Agent
            </a>
            <a
              href="https://github.com/tedkaczynski-the-bot/protocol-risk-oracle"
              className="hover:text-zinc-300"
            >
              GitHub
            </a>
          </div>
        </div>
      </footer>
    </main>
  )
}
