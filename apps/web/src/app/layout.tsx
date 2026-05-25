import type { Metadata } from 'next'
import Link from 'next/link'
import './globals.css'

export const metadata: Metadata = {
  title: 'GTO Wizard Clone',
  description: 'A GTO poker training and analysis tool',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body>
        <header className="border-b border-gray-800 bg-gray-900/95 backdrop-blur sticky top-0 z-50">
          <nav className="container mx-auto px-4 py-4">
            <div className="flex items-center justify-between">
              <Link href="/" className="text-xl font-bold text-poker-gold">
                GTO Wizard
              </Link>
              <div className="flex gap-6">
                <Link href="/equity" className="hover:text-poker-gold transition-colors">
                  Equity
                </Link>
                <Link href="/train" className="hover:text-poker-gold transition-colors">
                  Train
                </Link>
                <Link href="/analyze" className="hover:text-poker-gold transition-colors">
                  Analyze
                </Link>
                <Link href="/icm" className="hover:text-poker-gold transition-colors">
                  ICM
                </Link>
                <Link href="/ranges" className="hover:text-poker-gold transition-colors">
                  Ranges
                </Link>
              </div>
            </div>
          </nav>
        </header>
        <main>{children}</main>
      </body>
    </html>
  )
}