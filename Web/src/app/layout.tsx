import type { Metadata } from 'next'
import { Inter } from 'next/font/google'
import './globals.css'
import Header from '@/components/Header'
import Footer from '@/components/Footer'

const inter = Inter({ subsets: ['latin'] })

export const metadata: Metadata = {
  title: 'Splitlyr - Smart Expense Splitting App',
  description: 'Split expenses with friends and family effortlessly. Track shared costs, settle debts, and manage group expenses. Download Splitlyr for free.',
  keywords: 'expense splitting, bill splitting, shared expenses, group expenses, expense tracker, split bills, settle debts, expense sharing app',
  authors: [{ name: 'Splitlyr Team' }],
  creator: 'Splitlyr',
  publisher: 'Splitlyr',
  icons: {
    icon: '/splash-icon.png',
    apple: '/splash-icon.png',
  },
  openGraph: {
    title: 'Splitlyr - Smart Expense Splitting App',
    description: 'Split expenses with friends and family effortlessly. Track shared costs, settle debts, and manage group expenses.',
    url: 'https://splitlyr.clestiq.com',
    siteName: 'Splitlyr',
    type: 'website',
    images: ['/icon.png'],
  },
  twitter: {
    card: 'summary_large_image',
    title: 'Splitlyr - Smart Expense Splitting App',
    description: 'Split expenses with friends and family effortlessly. Track shared costs, settle debts, and manage group expenses.',
    images: ['/icon.png'],
  },
  robots: {
    index: true,
    follow: true,
  },
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="en">
      <body className={inter.className}>
        <Header />
        {children}
        <Footer />
      </body>
    </html>
  )
}