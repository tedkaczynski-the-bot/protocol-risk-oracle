import type { Metadata } from "next"
import { Inter, JetBrains_Mono } from "next/font/google"
import "./globals.css"
import { WalletProvider } from "./providers"

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
})

const mono = JetBrains_Mono({
  subsets: ["latin"],
  variable: "--font-mono",
})

export const metadata: Metadata = {
  title: "Protocol Risk Oracle",
  description: "Game-theoretic risk analysis for DeFi protocols. Identifies Nash equilibria, dominant strategies, and exploit vectors.",
  openGraph: {
    title: "Protocol Risk Oracle",
    description: "Game-theoretic risk analysis for DeFi protocols",
    type: "website",
  },
  twitter: {
    card: "summary",
    title: "Protocol Risk Oracle",
    description: "Game-theoretic risk analysis for DeFi protocols",
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en" className={`${inter.variable} ${mono.variable}`}>
      <body>
        <WalletProvider>{children}</WalletProvider>
      </body>
    </html>
  )
}
