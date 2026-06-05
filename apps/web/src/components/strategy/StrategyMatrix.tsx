'use client'

import { useState, useCallback, useMemo } from 'react'
import { cn, RANKS, getHand } from '@/lib/utils'

// ============================================================================
// Types
// ============================================================================

export interface StrategyCell {
  /** Primary action: 'bet' | 'raise' | 'check' | 'call' | 'fold' */
  action: string
  /** Frequency of this action (0–1) */
  frequency: number
  /** Expected value */
  ev: number
}

export interface StrategyMatrixProps {
  /** Strategy data keyed by hand string (e.g., "AKs", "TT", "72o") */
  strategy: Record<string, StrategyCell>
  /** Custom className */
  className?: string
  /** Callback when a cell is clicked */
  onCellClick?: (hand: string, data: StrategyCell | undefined) => void
}

// ============================================================================
// Color helpers
// ============================================================================

/** Classify an action into one of three categories */
type ActionCategory = 'bet' | 'check' | 'fold'

function categorizeAction(action: string): ActionCategory {
  const lower = action.toLowerCase()
  if (lower.includes('bet') || lower.includes('raise') || lower.includes('push')) return 'bet'
  if (lower.includes('check') || lower.includes('call')) return 'check'
  return 'fold'
}

function getColorForCategory(category: ActionCategory): string {
  switch (category) {
    case 'bet':   return '#3b82f6' // blue
    case 'check': return '#22c55e' // green
    case 'fold':  return '#ef4444' // red
  }
}

function getIndicatorForCategory(category: ActionCategory): string {
  switch (category) {
    case 'bet':   return '↑'
    case 'check': return '●'
    case 'fold':  return '✕'
  }
}

function getIndicatorLabel(category: ActionCategory): string {
  switch (category) {
    case 'bet':   return 'Bet/Raise'
    case 'check': return 'Check/Call'
    case 'fold':  return 'Fold'
  }
}

// ============================================================================
// Sub-components
// ============================================================================

interface LegendProps {
  show: boolean
}

function Legend({ show }: LegendProps) {
  if (!show) return null

  const items: { category: ActionCategory; color: string }[] = [
    { category: 'bet',   color: '#3b82f6' },
    { category: 'check', color: '#22c55e' },
    { category: 'fold',  color: '#ef4444' },
  ]

  return (
    <div className="flex flex-wrap items-center gap-4 mb-3 text-xs">
      <span className="text-gray-400 font-medium mr-1">Action:</span>
      {items.map(({ category, color }) => (
        <div key={category} className="flex items-center gap-1.5">
          <div
            className="w-3 h-3 rounded-sm"
            style={{ backgroundColor: color, opacity: 0.7 }}
          />
          <span className="text-gray-400">
            {getIndicatorForCategory(category)} {getIndicatorLabel(category)}
          </span>
        </div>
      ))}
    </div>
  )
}

interface MatrixCellProps {
  hand: string
  data: StrategyCell | undefined
  onCellClick?: (hand: string, data: StrategyCell | undefined) => void
}

function MatrixCell({ hand, data, onCellClick }: MatrixCellProps) {
  const [isHovered, setIsHovered] = useState(false)

  const category = data ? categorizeAction(data.action) : 'check'
  const baseColor = getColorForCategory(category)
  const indicator = data ? getIndicatorForCategory(category) : '—'
  const opacity = data ? Math.max(0.15, data.frequency) : 0.1
  const freqPct = data ? `${(data.frequency * 100).toFixed(0)}%` : ''

  return (
    <div
      className={cn(
        'relative flex items-center justify-center cursor-pointer rounded text-[11px] font-medium transition-all select-none',
        'border border-transparent',
        isHovered && data ? 'ring-2 ring-poker-gold ring-offset-1 ring-offset-gray-900 z-10 scale-110' : '',
      )}
      style={{
        backgroundColor: data ? `${baseColor}${Math.round(opacity * 255).toString(16).padStart(2, '0')}` : 'rgba(31,41,55,0.5)',
        width: '100%',
        aspectRatio: '1',
      }}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      onClick={() => onCellClick?.(hand, data)}
      role="gridcell"
      aria-label={`${hand}${data ? `: ${data.action} ${freqPct}` : ''}`}
      title={`${hand}${data ? `\n${data.action} ${freqPct}` : '\nno data'}`}
    >
      <span className="pointer-events-none text-white/90">{indicator}</span>
      {data && (
        <span className="absolute -bottom-3.5 text-[9px] text-gray-500 pointer-events-none whitespace-nowrap">
          {freqPct}
        </span>
      )}
    </div>
  )
}

// ============================================================================
// Main component
// ============================================================================

export function StrategyMatrix({ strategy, className, onCellClick }: StrategyMatrixProps) {
  const [selectedHand, setSelectedHand] = useState<string | null>(null)

  const handleCellClick = useCallback(
    (hand: string, data: StrategyCell | undefined) => {
      setSelectedHand(hand)
      onCellClick?.(hand, data)
    },
    [onCellClick],
  )

  const selectedData = selectedHand ? strategy[selectedHand] : null

  // Build grid data
  const gridRows = useMemo(() => {
    return RANKS.map((rowRank, row) => {
      const cells = RANKS.map((colRank, col) => {
        const hand = getHand(row, col)
        return { hand, data: strategy[hand] }
      })
      return { rank: rowRank, cells }
    })
  }, [strategy])

  return (
    <div className={cn('space-y-4', className)}>
      <Legend show={true} />

      {/* Grid container */}
      <div className="overflow-x-auto">
        <div className="inline-block">
          {/* Header row — rank labels across top */}
          <div className="flex items-center mb-1">
            <div className="w-7 shrink-0" /> {/* corner spacer */}
            {RANKS.map((rank) => (
              <div
                key={rank}
                className="text-[11px] font-semibold text-gray-500 text-center flex items-center justify-center"
                style={{ width: '100%', aspectRatio: '1', minWidth: 28 }}
              >
                {rank}
              </div>
            ))}
          </div>

          {/* Grid rows */}
          {gridRows.map(({ rank, cells }) => (
            <div key={rank} className="flex items-center mb-0.5">
              {/* Row label */}
              <div className="w-7 shrink-0 text-[11px] font-semibold text-gray-500 text-center">
                {rank}
              </div>
              {/* Cells */}
              {cells.map(({ hand, data }) => (
                <div
                  key={hand}
                  className="flex items-center justify-center"
                  style={{ width: '100%', minWidth: 28 }}
                >
                  <MatrixCell
                    hand={hand}
                    data={data}
                    onCellClick={handleCellClick}
                  />
                </div>
              ))}
            </div>
          ))}
        </div>
      </div>

      {/* Selected hand detail */}
      {selectedHand && selectedData && (
        <div className="mt-4 p-3 rounded-lg border border-gray-700 bg-gray-800/40">
          <div className="flex items-center justify-between">
            <div>
              <span className="font-bold text-base text-poker-gold">{selectedHand}</span>
              <span className="text-gray-400 text-xs ml-2">
                {selectedData.action.charAt(0).toUpperCase() + selectedData.action.slice(1)}
              </span>
            </div>
            <button
              onClick={() => setSelectedHand(null)}
              className="text-xs text-gray-500 hover:text-white transition-colors"
            >
              Dismiss
            </button>
          </div>
          <div className="mt-2 flex gap-4 text-sm text-gray-300">
            <div>
              <span className="text-gray-500">Frequency:</span>{' '}
              <span className="font-medium">{(selectedData.frequency * 100).toFixed(1)}%</span>
            </div>
            <div>
              <span className="text-gray-500">EV:</span>{' '}
              <span className={cn('font-medium', selectedData.ev >= 0 ? 'text-green-400' : 'text-red-400')}>
                {selectedData.ev >= 0 ? '+' : ''}{selectedData.ev.toFixed(4)}
              </span>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

export default StrategyMatrix
