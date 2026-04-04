import type { Metadata } from 'next'
import './globals.css'
import { MainLayout } from '@/components/layout/MainLayout'

export const metadata: Metadata = {
  title: 'OutBid - Real-time Competitive Bidding',
  description: 'Strategic real-time competitive bidding game with real-money escrow and instant settlements',
  keywords: 'bidding, game, competitive, strategy, real-time',
  openGraph: {
    title: 'OutBid',
    description: 'Real-time competitive bidding game',
    type: 'website',
  },
}

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <head>
        <meta name="theme-color" content="#0f172a" />
        <meta name="mobile-web-app-capable" content="yes" />
        <meta name="apple-mobile-web-app-capable" content="yes" />
      </head>
      <body>
        <MainLayout>{children}</MainLayout>
      </body>
    </html>
  )
}
