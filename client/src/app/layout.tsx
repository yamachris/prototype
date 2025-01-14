import type { Metadata } from 'next'
import './globals.css'
import { Inter } from 'next/font/google'
import './main-app'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'UNIT Card Game',
  description: 'Jeu de cartes stratégique basé sur la Révolution française',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="fr">
      <body className={inter.className}>{children}</body>
    </html>
  )
}
