import React from 'react'
import type { ButtonHTMLAttributes } from 'react'

type ButtonVariant = 'primary' | 'secondary' | 'outline'

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: ButtonVariant
}

const variantStyles: Record<ButtonVariant, string> = {
  primary: 'bg-blue-600 text-white hover:bg-blue-700',
  secondary: 'bg-gray-700 text-white hover:bg-gray-600',
  outline: 'border border-gray-600 text-gray-300 hover:bg-gray-800',
}

export function Button({ variant = 'primary', className = '', children, ...props }: ButtonProps) {
  return (
    <button
      className={`px-4 py-2 rounded-lg font-semibold transition-colors disabled:opacity-50 ${variantStyles[variant]} ${className}`}
      {...props}
    >
      {children}
    </button>
  )
}

interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string
}

export function Input({ label, className = '', ...props }: InputProps) {
  return (
    <div className="flex flex-col gap-1">
      {label && <label className="text-sm text-gray-400">{label}</label>}
      <input
        className={`px-3 py-2 bg-gray-800 border border-gray-700 rounded-lg text-white focus:outline-none focus:border-blue-500 ${className}`}
        {...props}
      />
    </div>
  )
}

interface CardProps {
  title?: string
  children: React.ReactNode
  className?: string
}

export function Card({ title, children, className = '' }: CardProps) {
  return (
    <div className={`border border-gray-800 rounded-lg p-4 bg-gray-900/50 ${className}`}>
      {title && <h3 className="text-lg font-semibold mb-3">{title}</h3>}
      {children}
    </div>
  )
}

const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2'] as const

interface RangeGridProps {
  selectedHands: Set<string>
  onToggle: (hand: string) => void
}

export function RangeGrid({ selectedHands, onToggle }: RangeGridProps) {
  const getHand = (row: number, col: number) => {
    const rank1 = RANKS[row]
    const rank2 = RANKS[col]
    if (row === col) return `${rank1}${rank2}`
    return `${rank1}${rank2}o`
  }

  const isSelected = (hand: string) => selectedHands.has(hand)

  return (
    <div className="grid grid-cols-13 gap-0.5 bg-gray-800 p-2 rounded-lg">
      {RANKS.map((rank, row) => (
        <div key={rank} className="contents">
          {RANKS.map((_, col) => {
            const hand = getHand(row, col)
            return (
              <button
                key={hand}
                onClick={() => onToggle(hand)}
                className={`w-8 h-8 text-xs font-medium rounded transition-colors ${
                  isSelected(hand)
                    ? 'bg-blue-600 text-white'
                    : 'bg-gray-700 text-gray-400 hover:bg-gray-600'
                }`}
              >
                {hand}
              </button>
            )
          })}
        </div>
      ))}
    </div>
  )
}

interface EquityBarProps {
  value: number // 0-100
  label?: string
}

export function EquityBar({ value, label }: EquityBarProps) {
  return (
    <div className="flex items-center gap-2">
      {label && <span className="text-sm text-gray-400 w-20">{label}</span>}
      <div className="flex-1 bg-gray-800 rounded-full h-4 overflow-hidden">
        <div
          className="h-full bg-gradient-to-r from-blue-600 to-blue-400 transition-all"
          style={{ width: `${value}%` }}
        />
      </div>
      <span className="text-sm font-mono w-16 text-right">{value.toFixed(1)}%</span>
    </div>
  )
}

interface StrategyMatrixProps {
  data: Record<string, { raise: number; call: number; fold: number }>
}

export function StrategyMatrix({ data }: StrategyMatrixProps) {
  const getColor = (value: number) => {
    if (value > 0.6) return 'bg-green-600'
    if (value > 0.3) return 'bg-yellow-600'
    return 'bg-gray-700'
  }

  return (
    <div className="grid grid-cols-13 gap-0.5 bg-gray-800 p-2 rounded-lg">
      {RANKS.map((rank, row) => (
        <div key={rank} className="contents">
          {RANKS.map((_, col) => {
            const hand = getHand(row, col)
            const strategy = data[hand]
            return (
              <div
                key={hand}
                className={`w-8 h-8 rounded text-xs flex items-center justify-center ${getColor(strategy?.raise || 0)}`}
                title={`${hand}: Raise ${((strategy?.raise || 0) * 100).toFixed(0)}%`}
              >
                {(strategy?.raise || 0) > 0 ? `${((strategy?.raise || 0) * 100).toFixed(0)}` : '-'}
              </div>
            )
          })}
        </div>
      ))}
    </div>
  )
}

function getHand(row: number, col: number): string {
  const rank1 = RANKS[row]
  const rank2 = RANKS[col]
  if (row === col) return `${rank1}${rank2}`
  return `${rank1}${rank2}o`
}