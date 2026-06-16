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

interface StreetRecord {
  street: string
  action: string | null
  amount?: number
}

const POSITIONS = ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB']
const STREET_NAMES = ['preflop', 'flop', 'turn', 'river'] as const

// Default actions for the breadcrumb on unplayed streets
const DEFAULT_PREFLOP: StreetRecord = {
  street: 'preflop',
  action: 'BTN raise 2.5, BB call',
}

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

// Compute the new pot size after a given action is taken
function computeNextPot(action: string, currentPot: number, stackDepth: number): number {
  if (action === 'check' || action === 'fold') return currentPot
  if (action === 'call') return currentPot * 2
  if (action.startsWith('bet:')) {
    const pct = parseFloat(action.split(':')[1])
    return currentPot + 2 * currentPot * pct
  }
  if (action.startsWith('raise:')) {
    const pct = parseFloat(action.split(':')[1])
    return currentPot + 2 * currentPot * pct
  }
  if (action.startsWith('all_in')) return stackDepth * 2
  return currentPot
}

// Get the display label and amount for a street's action
function streetActionLabel(action: string, potSize: number, stackDepth: number): string {
  if (action === 'check') return 'Check'
  if (action === 'fold') return 'Fold'
  if (action === 'call') return 'Call'
  if (action.startsWith('bet:')) {
    const pct = parseFloat(action.split(':')[1])
    return `Bet ${(pct * 100).toFixed(0)}%`
  }
  if (action.startsWith('raise:')) {
    const pct = parseFloat(action.split(':')[1])
    return `Raise ${(pct * 100).toFixed(0)}%`
  }
  if (action.startsWith('all_in')) return 'All In'
  return action
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

// ── Street Breadcrumb Component ──────────────────────────
function StreetBreadcrumb({
  streetIndex,
  streetActions,
}: {
  streetIndex: number
  streetActions: (string | null)[]
}) {
  const allStreets = ['Preflop', 'Flop', 'Turn', 'River']
  const actionLabels = ['BTN raise 2.5, BB call', ...streetActions.map((a, i) =>
    a ? streetActionLabel(a, 0, 0) : null
  )]

  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: 4,
      marginBottom: 12, flexWrap: 'wrap',
    }}>
      {allStreets.map((name, i) => {
        // streetIndex 0=flop, so street i=1=flop, i=2=turn, i=3=river
        // preflop (i=0) is always completed
        const isPreflop = i === 0
        const isPast = isPreflop || i - 1 < streetIndex
        const isCurrent = !isPreflop && i - 1 === streetIndex
        const isFuture = !isPreflop && i - 1 > streetIndex
        const hasAction = isPreflop || (streetActions[i - 1] != null)

        return (
          <div key={name} style={{ display: 'flex', alignItems: 'center', gap: 2 }}>
            <div style={{
              display: 'flex', alignItems: 'center', gap: 6,
              background: isCurrent ? '#16241a' : isPast ? '#151515' : '#111',
              border: isCurrent ? `1px solid ${GREEN}55` : isPast ? '1px solid #2a2a2a' : '1px solid #1a1a1a',
              borderRadius: 6, padding: '5px 10px',
              opacity: isFuture ? 0.4 : 1,
            }}>
              <span style={{
                width: 6, height: 6, borderRadius: '50%',
                background: isCurrent ? GREEN : isPast ? '#555' : '#222',
                flexShrink: 0,
              }} />
              <span style={{
                fontSize: 11, fontWeight: 600,
                color: isCurrent ? GREEN : isPast ? TEXT_BRIGHT : TEXT_DIM,
                textTransform: 'uppercase', letterSpacing: 0.3,
              }}>
                {name}
              </span>
              {hasAction && (
                <span style={{
                  fontSize: 10, color: TEXT_DIM, marginLeft: 2,
                  maxWidth: 120, overflow: 'hidden', textOverflow: 'ellipsis',
                  whiteSpace: 'nowrap',
                }}>
                  {actionLabels[i]}
                </span>
              )}
              {isFuture && (
                <span style={{ fontSize: 10, color: '#444', marginLeft: 2 }}>
                  🔒
                </span>
              )}
            </div>
            {i < allStreets.length - 1 && (
              <span style={{ color: '#333', fontSize: 12, margin: '0 2px' }}>→</span>
            )}
          </div>
        )
      })}
    </div>
  )
}

// ── Main Component ───────────────────────────────────────
interface PostflopTrainingProps {
  onToggle?: () => void
}

export default function PostflopTraining({ onToggle }: PostflopTrainingProps) {
  const [boardStr, setBoardStr] = useState('KsKc3s5h9d')
  const [potSize, setPotSize] = useState(5.5)
  const [stackDepth, setStackDepth] = useState(100)
  const [streetIndex, setStreetIndex] = useState(0) // 0=flop, 1=turn, 2=river
  const [activePosition, setActivePosition] = useState('BTN')
  const [handPositions, setHandPositions] = useState<string[]>(['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'])
  const [heroCards, setHeroCards] = useState('')
  const [configOpen, setConfigOpen] = useState(false)
  const [history] = useState<ActionHistory[]>([])
  const [strategy, setStrategy] = useState<StrategyResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [userChoice, setUserChoice] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)
  // Track actions taken per street (index 0=flop, 1=turn, 2=river)
  const [streetActions, setStreetActions] = useState<(string | null)[]>([null, null, null])

  const allBoardCards = parseBoardCards(boardStr)

  // Reveal cards progressively based on street
  const cardsToShow = streetIndex === 0
    ? allBoardCards.slice(0, 3)       // Flop: first 3 cards
    : streetIndex === 1
      ? allBoardCards.slice(0, 4)     // Turn: first 4 cards
      : allBoardCards.slice(0, 5)     // River: all 5 cards

  const currentStreet = STREET_NAMES[streetIndex + 1] // +1 because index 0 in STREET_NAMES is preflop

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
          street: currentStreet,
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
  }, [boardStr, activePosition, currentStreet, potSize, stackDepth])

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

  const actionTaken = streetActions[streetIndex] != null
  const isLastStreet = streetIndex >= 2

  const handleAction = (action: string) => {
    setUserChoice(action)
    // Record the action for this street
    const updated = [...streetActions]
    updated[streetIndex] = action
    setStreetActions(updated)
    if (!strategy) {
      fetchStrategy()
    }
  }

  const advanceToNextStreet = () => {
    if (isLastStreet) return

    // Calculate new pot based on the action taken
    const currentAction: string = streetActions[streetIndex] ?? 'check'
    const nextPot = computeNextPot(currentAction, potSize, stackDepth)
    setPotSize(nextPot)

    // Advance to next street
    const nextIndex = streetIndex + 1
    setStreetIndex(nextIndex)
    setUserChoice(null)
    setStrategy(null)
    setError(null)

    // Fetch strategy for the new street on next render
    // Use setTimeout to let state settle
    setTimeout(() => {
      setLoading(true)
      const nextStreet = STREET_NAMES[nextIndex + 1]
      fetch(`${API_BASE}/solver/postflop-strategy`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          board: boardStr,
          position: activePosition,
          street: nextStreet,
          pot_size: nextPot,
          stack_depth: stackDepth,
        }),
      })
        .then(res => {
          if (!res.ok) throw new Error(`HTTP ${res.status}`)
          return res.json()
        })
        .then((data: StrategyResponse) => {
          setStrategy(data)
          setLoading(false)
        })
        .catch((err: any) => {
          setError(err.message)
          setLoading(false)
        })
    }, 0)
  }

  return (
    <div style={{ padding: 16 }}>
      {/* Street breadcrumb */}
      <StreetBreadcrumb
        streetIndex={streetIndex}
        streetActions={streetActions}
      />

      {/* Configure Spot Button & Panel */}
      <div style={{ marginBottom: 12 }}>
        <button onClick={() => setConfigOpen(!configOpen)}
          style={{
            background: configOpen ? '#1a3a2b' : '#161616',
            border: configOpen ? `1px solid ${GREEN}` : '1px solid #262626',
            color: configOpen ? GREEN : '#ccc',
            padding: '8px 16px', borderRadius: 8, fontSize: 12, fontWeight: 600,
            cursor: 'pointer', transition: 'all .1s', display: 'flex', alignItems: 'center', gap: 6,
          }}>
          <span style={{ fontSize: 14 }}>{configOpen ? '▾' : '▸'}</span>
          Configure Spot
        </button>

        {configOpen && (
          <div style={{
            marginTop: 8, background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
            padding: '14px 16px',
          }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(160px, 1fr))', gap: 16 }}>

              {/* Position selection */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Positions in Hand
                </label>
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {POSITIONS.map(pos => (
                    <label key={pos} style={{
                      fontSize: 12, color: TEXT_BRIGHT, cursor: 'pointer',
                      display: 'flex', alignItems: 'center', gap: 4,
                      background: handPositions.includes(pos) ? '#1a3a2b' : '#151515',
                      border: `1px solid ${handPositions.includes(pos) ? GREEN + '44' : '#2a2a2a'}`,
                      borderRadius: 6, padding: '4px 8px',
                    }}>
                      <input type="checkbox" checked={handPositions.includes(pos)}
                        onChange={(e) => {
                          if (e.target.checked) {
                            setHandPositions([...handPositions, pos])
                          } else {
                            const next = handPositions.filter(p => p !== pos)
                            if (next.length > 0) {
                              setHandPositions(next)
                              if (activePosition === pos) setActivePosition(next[0])
                            }
                          }
                        }}
                        style={{ accentColor: GREEN, width: 14, height: 14 }} />
                      {pos}
                    </label>
                  ))}
                </div>
              </div>

              {/* Active position */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Active Position
                </label>
                <select value={activePosition} onChange={(e) => setActivePosition(e.target.value)}
                  style={{
                    background: '#151515', border: `1px solid ${BORDER}`, borderRadius: 6,
                    color: TEXT_BRIGHT, padding: '6px 8px', fontSize: 12, width: '100%',
                  }}>
                  {handPositions.map(pos => (
                    <option key={pos} value={pos}>{pos}</option>
                  ))}
                </select>
              </div>

              {/* Board cards */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Board Cards (e.g. KsKc3s5h9d)
                </label>
                <input type="text" value={boardStr} onChange={(e) => {
                  setBoardStr(e.target.value)
                  // Reset street navigation when board changes
                  setStreetIndex(0)
                  setStreetActions([null, null, null])
                  setUserChoice(null)
                  setStrategy(null)
                  setError(null)
                }}
                  placeholder="KsKc3s5h9d"
                  style={{
                    background: '#151515', border: `1px solid ${BORDER}`, borderRadius: 6,
                    color: TEXT_BRIGHT, padding: '6px 8px', fontSize: 12, width: '100%',
                  }} />
                <div style={{ fontSize: 10, color: TEXT_DIM, marginTop: 4 }}>
                  Enter up to 5 cards. First 3 = flop, 4th = turn, 5th = river.
                </div>
              </div>

              {/* Pot size */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Pot Size (bb)
                </label>
                <input type="number" value={potSize} onChange={(e) => {
                  setPotSize(Number(e.target.value))
                  setStreetIndex(0)
                  setStreetActions([null, null, null])
                  setUserChoice(null)
                  setStrategy(null)
                }}
                  min={0} step={0.1}
                  style={{
                    background: '#151515', border: `1px solid ${BORDER}`, borderRadius: 6,
                    color: TEXT_BRIGHT, padding: '6px 8px', fontSize: 12, width: '100%',
                  }} />
              </div>

              {/* Stack depth */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Stack Depth (bb)
                </label>
                <input type="number" value={stackDepth} onChange={(e) => {
                  setStackDepth(Number(e.target.value))
                  setStreetIndex(0)
                  setStreetActions([null, null, null])
                  setUserChoice(null)
                  setStrategy(null)
                }}
                  min={0} step={5}
                  style={{
                    background: '#151515', border: `1px solid ${BORDER}`, borderRadius: 6,
                    color: TEXT_BRIGHT, padding: '6px 8px', fontSize: 12, width: '100%',
                  }} />
              </div>

              {/* Street (read-only indicator) */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Starting Street
                </label>
                <div style={{
                  background: '#151515', border: `1px solid ${BORDER}`, borderRadius: 6,
                  color: GREEN, padding: '6px 8px', fontSize: 12, fontWeight: 600,
                }}>
                  Flop
                </div>
              </div>

              {/* Hero cards (optional) */}
              <div>
                <label style={{ fontSize: 11, color: TEXT_DIM, fontWeight: 600, display: 'block', marginBottom: 6, textTransform: 'uppercase' }}>
                  Hero Cards (optional)
                </label>
                <input type="text" value={heroCards} onChange={(e) => {
                  setHeroCards(e.target.value)
                  setStreetIndex(0)
                  setStreetActions([null, null, null])
                  setStrategy(null)
                }}
                  placeholder="e.g. AhKh"
                  style={{
                    background: '#151515', border: `1px solid ${BORDER}`, borderRadius: 6,
                    color: TEXT_BRIGHT, padding: '6px 8px', fontSize: 12, width: '100%',
                  }} />
              </div>
            </div>
          </div>
        )}
      </div>

      {/* Board display */}
      <div style={{
        background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
        padding: '14px 16px', marginBottom: 12,
      }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, flexWrap: 'wrap' }}>
          {/* Board cards - progressive reveal */}
          <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <span style={{
              fontSize: 11, color: TEXT_DIM, fontWeight: 600,
              textTransform: 'uppercase', letterSpacing: 1,
            }}>
              {currentStreet}
            </span>
            {cardsToShow.map((c, i) => (
              <CardDisplay key={i} {...c} />
            ))}
            {/* Show empty slots for unrevealed cards */}
            {streetIndex === 0 && allBoardCards.length >= 4 && (
              <>
                <div style={{
                  width: 36, height: 50, borderRadius: 6,
                  background: '#111', border: '1px dashed #2a2a2a',
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  fontSize: 10, color: '#444',
                }}>+1</div>
                {allBoardCards.length >= 5 && (
                  <div style={{
                    width: 36, height: 50, borderRadius: 6,
                    background: '#111', border: '1px dashed #2a2a2a',
                    display: 'flex', alignItems: 'center', justifyContent: 'center',
                    fontSize: 10, color: '#444',
                  }}>+1</div>
                )}
              </>
            )}
            {streetIndex === 1 && allBoardCards.length >= 5 && (
              <div style={{
                width: 36, height: 50, borderRadius: 6,
                background: '#111', border: '1px dashed #2a2a2a',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
                fontSize: 10, color: '#444',
              }}>+1</div>
            )}
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
          {handPositions.map(pos => {
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
          {actionTaken && <span style={{ marginLeft: 8, fontSize: 10, color: GREEN, textTransform: 'none' }}>✓ Action selected</span>}
        </div>
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
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
                  opacity: (loading || actionTaken) ? 0.5 : 1,
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

        {/* Advance to Next Street button */}
        {actionTaken && !isLastStreet && (
          <div style={{ marginTop: 12, display: 'flex', justifyContent: 'center' }}>
            <button onClick={advanceToNextStreet}
              style={{
                background: '#1a3a2b', border: `1px solid ${GREEN}66`, borderRadius: 8,
                color: GREEN, padding: '10px 24px', fontSize: 13, fontWeight: 700,
                cursor: 'pointer', transition: 'all .15s',
                display: 'flex', alignItems: 'center', gap: 8,
              }}>
              <span>▶</span>
              Advance to {streetIndex === 0 ? 'Turn' : 'River'}
              <span style={{ fontSize: 10, fontWeight: 400, opacity: 0.7 }}>
                (new board card + updated pot)
              </span>
            </button>
          </div>
        )}

        {actionTaken && isLastStreet && (
          <div style={{ marginTop: 12, textAlign: 'center', color: GREEN, fontSize: 12, fontWeight: 600 }}>
            ✓ Hand complete — all streets played on river
          </div>
        )}
      </div>

      {/* GTO Comparison */}
      {(strategy || loading || error) && (
        <div style={{
          background: BG_CARD, border: `1px solid ${BORDER}`, borderRadius: 10,
          padding: '14px 16px',
        }}>
          <div style={{ fontSize: 12, color: TEXT_DIM, fontWeight: 600, marginBottom: 10, textTransform: 'uppercase', letterSpacing: 0.5 }}>
            GTO Strategy Breakdown — {currentStreet}
            {strategy && (
              <span style={{ marginLeft: 8, fontSize: 10, fontWeight: 400, color: GREEN, textTransform: 'none' }}>
                ({strategy.source === 'cached' ? 'cached' : 'live-solver'})
              </span>
            )}
          </div>

          {loading && (
            <div style={{ textAlign: 'center', padding: 20, color: TEXT_DIM }}>
              <span style={{ color: GREEN }}>●</span> Solving with MCCFR... (street: {currentStreet})
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
                  (userChoice.startsWith(a.action.split(/[:\\d+]/)[0]))
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
