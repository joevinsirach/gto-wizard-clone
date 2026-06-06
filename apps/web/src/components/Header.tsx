'use client'

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'
import { Menu, X, Upload, HelpCircle, Settings, User } from 'lucide-react'
import { cn } from '@/lib/utils'

const navTabs = [
  { href: '/study', label: 'STUDY' },
  { href: '/practice', label: 'PRACTICE' },
  { href: '/analyze', label: 'ANALYZE' },
]

export default function Header() {
  const [isOpen, setIsOpen] = useState(false)
  const pathname = usePathname()

  return (
    <header className="sticky top-0 z-50" style={{ backgroundColor: '#1a1a2e' }}>
      <nav className="mx-auto max-w-7xl px-4 sm:px-6 lg:px-8">
        <div className="flex h-14 items-center justify-between">
          {/* Left: Logo */}
          <Link
            href="/"
            className="flex items-center gap-2 text-lg font-bold text-white hover:opacity-80 transition-opacity shrink-0"
          >
            <span className="text-xl">🧙</span>
            <span>GTO Wizard</span>
          </Link>

          {/* Middle: Nav Tabs (Desktop) */}
          <div className="hidden md:flex items-center h-full gap-1">
            {navTabs.map((tab) => {
              const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
              return (
                <Link
                  key={tab.href}
                  href={tab.href}
                  className={cn(
                    'relative flex items-center h-full px-4 text-sm font-medium transition-colors',
                    isActive
                      ? 'text-white'
                      : 'text-gray-400 hover:text-gray-200'
                  )}
                >
                  {tab.label}
                  {isActive && (
                    <span
                      className="absolute bottom-0 left-2 right-2 h-0.5 rounded-full"
                      style={{ backgroundColor: '#22c55e' }}
                    />
                  )}
                </Link>
              )
            })}
          </div>

          {/* Right: Actions (Desktop) */}
          <div className="hidden md:flex items-center gap-2">
            {/* Upload Button */}
            <button
              type="button"
              className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:text-white"
              style={{ backgroundColor: '#2d2d44' }}
            >
              <Upload size={16} />
              <span>UPLOAD</span>
            </button>

            {/* Icon buttons */}
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
              aria-label="Help"
            >
              <HelpCircle size={18} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
              aria-label="Settings"
            >
              <Settings size={18} />
            </button>
            <button
              type="button"
              className="p-2 text-gray-400 hover:text-white transition-colors rounded-md hover:bg-white/5"
              aria-label="Profile"
            >
              <User size={18} />
            </button>
          </div>

          {/* Mobile Menu Button */}
          <button
            type="button"
            className="md:hidden p-2 text-gray-400 hover:text-white transition-colors"
            onClick={() => setIsOpen(!isOpen)}
            aria-label={isOpen ? 'Close menu' : 'Open menu'}
            aria-expanded={isOpen}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Navigation */}
        {isOpen && (
          <div className="md:hidden border-t border-gray-700/50 pb-4 pt-4">
            <div className="flex flex-col gap-2">
              {navTabs.map((tab) => {
                const isActive = pathname === tab.href || pathname.startsWith(tab.href + '/')
                return (
                  <Link
                    key={tab.href}
                    href={tab.href}
                    className={cn(
                      'flex items-center gap-2 rounded-md px-4 py-2.5 text-sm font-medium transition-colors',
                      isActive
                        ? 'text-white'
                        : 'text-gray-400 hover:text-gray-200 hover:bg-white/5'
                    )}
                    onClick={() => setIsOpen(false)}
                    style={isActive ? { backgroundColor: '#22c55e20', borderLeft: '3px solid #22c55e' } : {}}
                  >
                    {tab.label}
                  </Link>
                )
              })}
              {/* Mobile action buttons */}
              <div className="mt-3 flex items-center gap-2 px-4">
                <button
                  type="button"
                  className="flex items-center gap-1.5 rounded-md px-3 py-1.5 text-sm font-medium text-gray-300 transition-colors hover:text-white"
                  style={{ backgroundColor: '#2d2d44' }}
                >
                  <Upload size={16} />
                  <span>UPLOAD</span>
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-white" aria-label="Help">
                  <HelpCircle size={18} />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-white" aria-label="Settings">
                  <Settings size={18} />
                </button>
                <button type="button" className="p-2 text-gray-400 hover:text-white" aria-label="Profile">
                  <User size={18} />
                </button>
              </div>
            </div>
          </div>
        )}
      </nav>
    </header>
  )
}
