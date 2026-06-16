'use client'

import { useState, useCallback } from 'react'

// ── Colours ──────────────────────────────────────────────
const RED = '#D32F2F'
const RED_BRIGHT = '#E53935'
const RED_DARK = '#7B1E1E'
const BLUE = '#3A6EA5'
const GREEN = '#00C853'
const GRAY = '#2a2a2a'
const BG_CARD = '#1C1C1C'
const BORDER = '#262626'
const TEXT_DIM = '#999'
const TEXT_BRIGHT = '#ddd'

const SUIT_SYMBOL: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
const SUIT_COLOR: Record<string, string> = { s: '#fff', h: RED, d: '#FF6B35', c: '#fff' }

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

// ── Types ────────────────────────────────────────────────
interface StrategyAction {
  action: string
  frequency: number
  ev: number
}

interface StrategyResponse {
  actions: StrategyAction[]
  source: string
  status: string
  error?: string
  message?: string
}

interface ActionHistory {
  position: string
  action: string
  amount?: number
}

const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']

// ── Helpers ──────────────────────────────────────────────
function parseBoardCards(boardStr: string): { rank: string; suit: string }[] {
  const cards: { rank: string; suit: string }[] = []
  const cleaned = boardStr.replace(/[^2-9TJQKAtshdch]/gi, '')
  for (let i = 0; i < cleaned.length; i += 2) {
    if (i + 1 < cleaned.length) {
      const rank = cleaned[i].toUpperCase()
      const suit = cleaned[i + 1].toLowerCase()
      cards.push({ rank, suit })
    }
  }
  return cards
}

function formatActionButton(action: string, potSize: number, stackDepth: number): { label: string; amount?: number } {
  if (action === 'check') return { label: 'CHECK' }
  if (action === 'fold') return { label: 'FOLD' }
  if (action === 'call') return { label: 'CALL', amount: Math.round(potSize * 0.5) }
  if (action.startsWith('all_in')) {
    const amt = action.includes(':') ? parseFloat(action.split(':')[1]) : stackDepth
    return { label: `ALL IN ${amt.toFixed(1)}`, amount: amt }
  }
  if (action.startsWith('bet')) {
    const pct = action.includes(':') ? parseFloat(action.split(':')[1]) : 0.33
    return { label: `BET ${(pct * 100).toFixed(0)}%`, amount: Math.round(potSize * pct) }
  }
  if (action.startsWith('raise')) {
    const pct = action.includes(':') ? parseFloat(action.split(':')[1]) : 0.5
    return { label: `RAISE ${(pct * 100).toFixed(0)}%`, amount: Math.round(potSize * pct) }
  }
  return { label: action.toUpperCase() }
}

// Button color based on action type
function actionColor(action: string): string {
  if (action === 'fold') return GRAY
  if (action === 'check') return '#555'
  if (action === 'call') return BLUE
  if (action.startsWith('bet')) return '#E65100'
  if (action.startsWith('raise')) return RED_BRIGHT
  if (action.startsWith('all_in')) return RED_DARK
  return '#555'
}

// ── Card Display Component ───────────────────────────────
function CardDisplay({ rank, suit, small }: { rank: string; suit: string; small?: boolean }) {
  const size = small ? 36 : 48
  return (
    <div style={{
      width: size, height: size * 1.4, borderRadius: 6,
      background: '#0a0a0a', border: '1px solid #333',
      display: 'flex', flexDirection: 'column', alignItems: 'center',
      justifyContent: 'center', fontSize: small ? 11 : 14,
      fontWeight: 700, color: SUIT_COLOR[suit] || '#fff',
    }}>
      <span>{rank}</span>
      <span style={{ fontSize: small ? 10 : 12, marginTop: -2 }}>{SUIT_SYMBOL[suit] || suit}</span>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────
interface PostflopTrainingProps {
  onToggle?: () => void
}

export default function PostflopTraining({ onToggle }: PostflopTrainingProps) {
  const [boardStr, setBoardStr] = useState('KsKc3s')
  const [potSize, setPotSize] = useState(5.5)
  const [stackDepth] = useState(97.5)
  const [street] = useState('flop')
  const [activePosition] = useState('BTN')
  const [history] = useState<ActionHistory[]>([])
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [userChoice, setUserChoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  const boardCards = parseBoardCards(boardStr)

  const fetchStrategy = useCallback(async () => {
    setLoading(true)
    setError(null)
    setUserChoice(null)
    try {
      const res = await fetch(`${API_BASE}/solver/postflop-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: boardStr,
          position: activePosition,
          street,
          pot_size: potSize,
          stack_depth: stackDepth,
        }),
      })
      if (!res.ok) throw new Error(`HTTP ${res.status}`)
      const data: StrategyResponse = await res.json()
      setStrategy(data)
    } catch (err: any) {
      setError(err.message)
      setStrategy(null)
    } finally {
      setLoading(false)
    }
  }, [boardStr, activePosition, street, potSize, stackDepth])

  // Group strategy actions by type for display
  const groupedActions = strategy?.actions?.reduce((acc, a) => {
    const key = a.action.startsWith('bet') ? 'bet' :
                a.action.startsWith('raise') ? 'raise' :
                a.action.startsWith('all_in') ? 'all_in' : a.action
    if (!acc[key]) acc[key] = []
    acc[key].push(a)
    return acc
  }, {} as Record<string, StrategyAction[]>) ?? {}

  // Best action per type (highest frequency)
  const bestActions = Object.entries(groupedActions).map(([key, actions]) => {
    const best = actions.sort((a, b) => b.frequency - a.frequency)[0]
    return { key, ...best }
  }).sort((a, b) => b.frequency - a.frequency)

  const handleAction = (action: string) => {
    setUserChoice(action)
    if (!strategy) {
      fetchStrategy()
    }
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Board display */}
      <div style={{
        background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Board cards */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, textTransform: 'uppercase', letterSpacing: 1 }}>
              {street}
            </span>
            {boardCards.map((c, i) => (
              <CardDisplay key={i} {...c} />
            ))}
          </div>

          {/* Pot size */}
          <div style={{
            background: '#111', border: '1px solid #2a2a2a', borderRadius: 8,
            padding: '6px 14px', textAlign: 'center',
          }}>
            <div style={{ fontSize: 10, color: TEXT_DIM, textTransform: 'uppercase' }}>Pot</div>
            <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_BRIGHT }}>{potSize.toFixed(1)}</div>
          </div>

          {/* Refresh strategy */}
          <button onClick={fetchStrategy} disabled={loading} style={{
            background: '#16241a', border: `1px solid ${GREEN}33`, borderRadius: 8,
            color: GREEN, padding: '8px 16px', fontSize: 12, fontWeight: 600, cursor: 'pointer',
            marginLeft: 'auto', opacity: loading ? 0.6 : 1,
          }}>
            {loading ? 'Solving...' : strategy ? '⟳ Refresh' : 'Get GTO Strategy'}
          </button>
        </div>

        {/* Position columns */}
        <div style={{ display: 'flex', gap: 10, marginTop: 14, flexWrap: 'wrap' }}>
          {POSITIONS.map(pos => {
            const hist = history.find(h => h.position === pos)
            const isActive = pos === activePosition
            return (
              <div key={pos} style={{
                background: isActive ? '#16241a' : '#111',
                border: isActive ? `2px solid ${GREEN}` : '1px solid #222',
                borderRadius: 8, padding: '6px 12px', textAlign: 'center',
                minWidth: 70, flex: 1,
              }}>
                <div style={{ fontSize: 12, fontWeight: 600, color: isActive ? GREEN : TEXT_BRIGHT }}>
                  {pos}
                </div>
                <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 2 }}>
                  {hist ? `${hist.action}${hist.amount ? ' ' + hist.amount.toFixed(1) : ''}` : isActive ? '◀ Acting' : '—'}
                </div>
              </div>
            )
          })}
        </div>
      </div>

      {/* Action Buttons */}
      <div style={{
        background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
          Your Action — {activePosition}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {/* Dedicated buttons matching the spec */}
          {[
            { action: 'check', label: 'CHECK', bg: '#555' },
            { action: 'bet:0.33', label: 'BET 33%', bg: '#E65100', amount: Math.round(potSize * 0.33) },
            { action: 'bet:0.5', label: 'BET 50%', bg: '#E65100', amount: Math.round(potSize * 0.5) },
            { action: 'bet:0.75', label: 'BET 75%', bg: '#E65100', amount: Math.round(potSize * 0.75) },
            { action: 'bet:1.25', label: 'BET 125%', bg: '#E65100', amount: Math.round(potSize * 1.25) },
            { action: 'fold', label: 'FOLD', bg: GRAY },
            { action: 'call', label: 'CALL', bg: BLUE, amount: Math.round(potSize * 0.5) },
            { action: 'raise:0.5', label: 'RAISE 50%', bg: RED_BRIGHT, amount: Math.round(potSize * 0.5) },
            { action: 'raise:1.0', label: 'RAISE 100%', bg: RED_BRIGHT, amount: Math.round(potSize) },
            { action: 'all_in', label: `ALL IN ${stackDepth.toFixed(1)}`, bg: RED_DARK, amount: stackDepth },
          ].map(btn => {
            const isSelected = userChoice === btn.action
            return (
              <button key={btn.action} onClick={() => handleAction(btn.action)}
                style={{
                  background: isSelected ? btn.bg : '#1a1a1a',
                  border: isSelected ? 'none' : `1px solid #333`,
                  color: isSelected ? '#fff' : btn.bg,
                  borderRadius: 8, padding: '10px 14px', cursor: 'pointer',
                  fontSize: 12, fontWeight: 600, transition: 'all .1s',
                  textAlign: 'center', minWidth: 80,
                  opacity: loading ? 0.5 : 1,
                }}>
                <div>{btn.label}</div>
                {btn.amount != null && (
                  <div style={{ fontSize: 10, fontWeight: 400, opacity: 0.7, marginTop: 2 }}>
                    {btn.amount.toFixed(1)} ({potSize > 0 ? ((btn.amount / potSize) * 100).toFixed(0) : '0'}%)
                  </div>
                )}
              </button>
            )
          })}
        </div>
      </div>

      {/* GTO Comparison */}
      {(strategy || loading || error) && (
        <div style={{
          background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            GTO Strategy Breakdown
            {strategy && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: GREEN, textTransform: 'none' }}>
                ({strategy.source === 'cached' ? 'cached' : 'live-solver'})
              </span>
            )}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: TEXT_DIM }}>
              <span style={{ color: GREEN }}>●</span> Solving with MCCFR...
            </div>
          )}

          {error && (
            <div style={{ textAlign: 'center', padding: 20, color: RED }}>
              Error: {error}
            </div>
          )}

          {strategy && !loading && (
            <div style={{ display: 'flex', gap: 10, flexWrap: 'wrap' }}>
              {bestActions.map((a) => {
                const btnInfo = formatActionButton(a.action, potSize, stackDepth)
                const isUserPick = userChoice && (
                  userChoice === a.action ||
                  (userChoice.startsWith(a.action.split(/[:\d+]/)[0]))
                )
                return (
                  <div key={a.key} style={{
                    borderRadius: 8, padding: '12px 14px', flex: '1 0 140px',
                    background: isUserPick ? (actionColor(a.action) + '44') : '#151515',
                    border: isUserPick ? `1px solid ${actionColor(a.action)}` : '1px solid #2a2a2a',
                  }}>
                    <div style={{ fontSize: 12, fontWeight: 700, color: TEXT_BRIGHT }}>
                      {btnInfo.label}
                      {isUserPick && <span style={{ color: GREEN, fontSize: 10, marginLeft: 6 }}>✓ Your pick</span>}
                    </div>
                    <div style={{ fontSize: 22, fontWeight: 750, color: '#fff', marginTop: 4 }}>
                      {(a.frequency * 100).toFixed(0)}%
                    </div>
                    <div style={{ fontSize: 11, color: TEXT_DIM, marginTop: 2 }}>
                      EV: {a.ev.toFixed(2)}
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {strategy && !loading && strategy.actions.length === 0 && (
            <div style={{ textAlign: 'center', padding: 16, color: TEXT_DIM, fontSize: 13 }}>
              No actions returned from solver. Try a different board or position.
            </div>
          )}
        </div>
      )}
    </div>
  )
}
