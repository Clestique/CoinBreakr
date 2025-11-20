'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Header() {
  const [isMenuOpen, setIsMenuOpen] = useState(false)

  return (
    <header className="bg-white shadow-sm sticky top-0 z-50">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          <div className="flex items-center">
            <Link href="/" className="flex items-center space-x-3">
              <img
                src="/adaptive-icon.png"
                alt="Splitlyr Logo"
                className="w-10 h-10 object-contain"
              />
              <span className="text-xl font-bold" style={{ color: '#0F172A' }}>Splitlyr</span>
            </Link>
          </div>

          <nav className="hidden md:flex space-x-8">
            <Link href="/" className="nav-link transition-colors" style={{ color: '#334155' }}>
              Home
            </Link>
            <Link href="#features" className="nav-link transition-colors" style={{ color: '#334155' }}>
              Features
            </Link>
            <Link href="#how-it-works" className="nav-link transition-colors" style={{ color: '#334155' }}>
              How it Works
            </Link>
            <Link href="/faq" className="nav-link transition-colors" style={{ color: '#334155' }}>
              FAQ
            </Link>
            <Link href="/contact" className="nav-link transition-colors" style={{ color: '#334155' }}>
              Contact
            </Link>
          </nav>

          <div className="hidden md:flex items-center space-x-4">
            <a
              href="/#download"
              className="text-white px-4 py-2 rounded-lg transition-opacity font-medium hover:opacity-90"
              style={{ backgroundColor: '#14B8A6' }}
            >
              Download App
            </a>
          </div>

          <button
            className="md:hidden"
            onClick={() => setIsMenuOpen(!isMenuOpen)}
          >
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 12h16M4 18h16" />
            </svg>
          </button>
        </div>

        {isMenuOpen && (
          <div className="md:hidden py-4 border-t" style={{ borderColor: '#E2E8F0' }}>
            <div className="flex flex-col space-y-4">
              <Link href="/" className="transition-colors" style={{ color: '#334155' }}>
                Home
              </Link>
              <Link href="#features" className="transition-colors" style={{ color: '#334155' }}>
                Features
              </Link>
              <Link href="#how-it-works" className="transition-colors" style={{ color: '#334155' }}>
                How it Works
              </Link>
              <Link href="/faq" className="transition-colors" style={{ color: '#334155' }}>
                FAQ
              </Link>
              <Link href="/contact" className="transition-colors" style={{ color: '#334155' }}>
                Contact
              </Link>
              <a
                href="/#download"
                className="text-white px-4 py-2 rounded-lg hover:opacity-90 transition-opacity font-medium text-center"
                style={{ backgroundColor: '#14B8A6' }}
              >
                Download App
              </a>
            </div>
          </div>
        )}
      </div>
    </header>
  )
}