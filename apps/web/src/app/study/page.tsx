'use client'

import { useState, useEffect, useMemo, useCallback } from 'react'
import PostflopTraining from '@/components/study/PostflopTraining'
import ActionSelector from '@/components/study/ActionSelector'

const RED = '#D32F2F'
const RED_BRIGHT = '#E53935'
const RED_DARK = '#7B1E1E'
const BLUE = '#3A6EA5'
const GREEN = '#00C853'
const GRAY = '#2a2a2a'

const MATRIX_HANDS: string[][] = [
  ['AA','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s'],
  ['AKo','KK','KQs','KJs','KTs','K9s','K8s','K7s','K6s','K5s','K4s','K3s','K2s'],
  ['AQo','KQo','QQ','QJs','QTs','Q9s','Q8s','Q7s','Q6s','Q5s','Q4s','Q3s','Q2s'],
  ['AJo','KJo','QJo','JJ','JTs','J9s','J8s','J7s','J6s','J5s','J4s','J3s','J2s'],
  ['ATo','KTo','QTo','JTo','TT','T9s','T8s','T7s','T6s','T5s','T4s','T3s','T2s'],
  ['A9o','K9o','Q9o','J9o','T9o','99','98s','97s','96s','95s','94s','93s','92s'],
  ['A8o','K8o','Q8o','J8o','T8o','98o','88','87s','86s','85s','84s','83s','82s'],
  ['A7o','K7o','Q7o','J8o','T7o','97o','87o','77','76s','75s','74s','73s','72s'],
  ['A6o','K6o','Q6o','J6o','T6o','96o','86o','76o','66','65s','64s','63s','62s'],
  ['A5o','K5o','Q5o','J5o','T5o','95o','85o','75o','65o','55','54s','53s','52s'],
  ['A4o','K4o','Q4o','J4o','T4o','94o','84o','74o','64o','54o','44','43s','42s'],
  ['A3o','K3o','Q3o','J3o','T3o','93o','83o','73o','63o','53o','43o','33','32s'],
  ['A2o','K2o','Q2o','J2o','T2o','92o','82o','72o','62o','52o','42o','32o','22'],
]

const SUIT_SYM: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'

type HandData = { hand: string; action: string; frequency: number; equity: number }

const ACTION_COLORS: Record<string, string> = {
  'raise': RED_BRIGHT,
  'call': BLUE,
  'fold': GRAY,
  'all_in': RED_DARK,
}

export default function StudyPage() {
  const [mode, setMode] = useState<'preflop' | 'postflop'>('preflop')
  const [activePosition, setActivePosition] = useState('UTG')
  const [selectedCell, setSelectedCell] = useState<string | null>(null)
  const [rangeData, setRangeData] = useState<Map<string, HandData>>(new Map())
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [isSolverMode, setIsSolverMode] = useState(false)
  const [userAction, setUserAction] = useState<string | null>(null)
  const [actionFeedback, setActionFeedback] = useState<'correct' | 'incorrect' | null>(null)
  const [stackDepth, setStackDepth] = useState(100)
  const [availableDepths, setAvailableDepths] = useState<{value: number; label: string}[]>([
    { value: 50, label: '50bb' },
    { value: 100, label: '100bb' },
    { value: 150, label: '150bb' },
    { value: 200, label: '200bb' },
  ])

  const positions = useMemo(() => [
    { id: 'UTG', label: 'UTG', stack: stackDepth },
    { id: 'HJ', label: 'HJ', stack: stackDepth },
    { id: 'CO', label: 'CO', stack: stackDepth },
    { id: 'BTN', label: 'BTN', stack: stackDepth },
    { id: 'SB', label: 'SB', stack: stackDepth - 0.5 },
    { id: 'BB', label: 'BB', stack: stackDepth - 1 },
  ], [stackDepth])

  // Fetch available stack depths and solver data when position/depth changes
  useEffect(() => {
    async function fetchDepths() {
      try {
        const res = await fetch(`${API_BASE}/strategy-lookup/stack-depths`)
        if (res.ok) {
          const data = await res.json()
          if (data.stack_depths?.length) {
            setAvailableDepths(data.stack_depths)
            // If current depth isn't available, use the closest
            const values = data.stack_depths.map((d: any) => d.value)
            if (!values.includes(stackDepth)) {
              const closest = values.reduce((a: number, b: number) =>
                Math.abs(b - stackDepth) < Math.abs(a - stackDepth) ? b : a
              )
              setStackDepth(closest)
            }
          }
        }
      } catch {
        // Keep defaults if API is unavailable
      }
    }
    fetchDepths()
  }, [])

  // Fetch solver data when position or stack depth changes
  useEffect(() => {
    async function fetchRange() {
      setLoading(true)
      setError(null)
      try {
        const res = await fetch(`${API_BASE}/solver/preflop-range`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            position: activePosition,
            stack_depth: positions.find(p => p.id === activePosition)?.stack || stackDepth,
          }),
        })
        if (!res.ok) throw new Error(`HTTP ${res.status}`)
        const data = await res.json()
        const map = new Map<string, HandData>()
        for (const h of data.hands || []) {
          map.set(h.hand, h)
        }
        setRangeData(map)
        setIsSolverMode(true)
      } catch (err: any) {
        setError(err.message)
        setIsSolverMode(false)
      } finally {
        setLoading(false)
      }
    }
    fetchRange()
  }, [activePosition, stackDepth])

  const handCells = MATRIX_HANDS.flat()

  function getCellColor(hand: string): string {
    if (isSolverMode) {
      const data = rangeData.get(hand)
      if (!data || data.action === 'fold') return GRAY
      return ACTION_COLORS[data.action] || RED
    }
    // Fallback to hardcoded colors
    const redSet = new Set(['AA','AKs','AQs','AJs','ATs','A9s','A8s','A7s','A6s','A5s','A4s','A3s','A2s','AKo','KK','KQs','KJs','KTs','K9s','K8s','K7s','AQo','KQo','QQ','QJs','QTs','AJo','KJo','JJ','JTs','ATo','TT','99','98s','88','87s'])
    if (redSet.has(hand)) return RED
    return BLUE
  }

  function getCellOpacity(hand: string): number {
    if (!isSolverMode) return 1.0
    const data = rangeData.get(hand)
    if (!data) return 0.3
    if (data.action === 'fold') return 0.3
    return 0.5 + data.frequency * 0.5
  }

  // Compute action summary from solver data
  const actionSummary = useMemo(() => {
    const counts: Record<string, { count: number; totalFreq: number }> = {}
    rangeData.forEach((h) => {
      const action = h.action.startsWith('raise') ? 'raise' : h.action
      if (!counts[action]) counts[action] = { count: 0, totalFreq: 0 }
      counts[action].count++
      counts[action].totalFreq += h.frequency
    })
    return counts
  }, [rangeData])

  const totalCombos = 1326 // 52 choose 2

  const actionLabels: Record<string, string> = {
    raise: 'Raise 2.5',
    call: 'Call',
    fold: 'Fold',
    all_in: 'All In',
  }

  const actionLabelsShort: Record<string, string> = {
    raise: 'RAISE',
    call: 'CALL',
    fold: 'FOLD',
    all_in: 'ALL IN',
  }
  const selectedHandData = useMemo(() => {
    if (!selectedCell) return null
    return rangeData.get(selectedCell) || null
  }, [selectedCell, rangeData])

  const selectedHandCombos = useMemo(() => {
    if (!selectedCell) return []
    const suits = ['s', 'h', 'd', 'c']; const combos: [string, string][] = []
    for (const s1 of suits) for (const s2 of suits) if (s1 !== s2) combos.push([s1, s2])
    return combos.slice(0, 12)
  }, [selectedCell])

  // Reset user selection when hand changes
  useEffect(() => {
    setUserAction(null)
    setActionFeedback(null)
  }, [selectedCell])

  const handleCheckAction = useCallback(() => {
    if (!userAction || !selectedHandData) return
    const gtoBase = selectedHandData.action.startsWith('raise') ? 'raise' : selectedHandData.action
    setActionFeedback(userAction === gtoBase ? 'correct' : 'incorrect')
  }, [userAction, selectedHandData])

  return (
    <div style={{ minHeight: '100vh', background: '#0E0E0E' }}>
      {/* Mode Toggle */}
      <div style={{ display: 'flex', gap: 8, padding: '8px 16px', borderBottom: '1px solid #141414', background: '#0E0E0E' }}>
        <button onClick={() => setMode('preflop')}
          style={{
            background: mode === 'preflop' ? '#16241a' : '#161616',
            border: mode === 'preflop' ? `1px solid ${GREEN}` : '1px solid #262626',
            color: mode === 'preflop' ? '#fff' : '#888',
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all .1s',
          }}>
          Preflop Ranges
        </button>
        <button onClick={() => setMode('postflop')}
          style={{
            background: mode === 'postflop' ? '#16241a' : '#161616',
            border: mode === 'postflop' ? `1px solid ${GREEN}` : '1px solid #262626',
            color: mode === 'postflop' ? '#fff' : '#888',
            padding: '6px 16px', borderRadius: 8, fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all .1s',
          }}>
          Postflop Training
        </button>
      </div>

      {mode === 'preflop' ? (<div>
      {/* Stack Depth Selector */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '8px 16px', background: '#0E0E0E', borderBottom: '1px solid #141414' }}>
        <span style={{ color: '#999', fontSize: 12, fontWeight: 500, whiteSpace: 'nowrap' }}>Stack:</span>
        {availableDepths.map(d => (
          <button key={d.value} onClick={() => setStackDepth(d.value)}
            style={{
              background: stackDepth === d.value ? '#16241a' : '#161616',
              border: stackDepth === d.value ? `1px solid ${GREEN}` : '1px solid #262626',
              color: stackDepth === d.value ? '#fff' : '#888',
              padding: '4px 14px', borderRadius: 6, fontSize: 12, fontWeight: 600,
              cursor: 'pointer', transition: 'all .1s',
            }}>
            {d.label}
          </button>
        ))}
      </div>
      {/* Position Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 8px', overflowX: 'auto', background: '#0E0E0E', borderBottom: '1px solid #141414' }}>
        <div style={{ background: '#1A1A1A', border: '1px solid #2a2a2a', color: '#d0d0d0', padding: '8px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          {loading ? <span style={{ color: GREEN }}>●</span> : error ? <span style={{ color: RED }}>●</span> : <span style={{ color: GREEN }}>●</span>}
          {loading ? 'Solving...' : error ? 'Offline' : 'GTO'}
        </div>
        {positions.map(pos => (
          <button key={pos.id} onClick={() => setActivePosition(pos.id)}
            style={{
              background: activePosition === pos.id ? '#16241a' : '#161616',
              border: activePosition === pos.id ? `2px solid #7CFC7C` : '1px solid #262626',
              color: activePosition === pos.id ? '#fff' : '#b5b5b5',
              padding: '6px 14px 5px', borderRadius: 8, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer',
              textAlign: 'center', minWidth: 78, lineHeight: 1.2,
            }}>
            {pos.label} {pos.stack.toFixed(1).replace(/\.0$/, '')}
            {activePosition === pos.id && <span style={{ display: 'block', fontSize: 10, color: '#7CFC7C', marginTop: 2, fontWeight: 600 }}>Take action</span>}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.6fr) minmax(340px, 1fr)', gap: 12, padding: '0 16px', maxWidth: 1640, margin: '0 auto' }}>
        {/* Matrix Panel */}
        <div style={{ background: '#1C1C1C', border: '1px solid #262626', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '8px 12px', borderBottom: '1px solid #262626' }}>
            <div style={{ display: 'flex', gap: 16, alignItems: 'center' }}>
              {['Strategy ▾', 'Ranges', 'Breakdown'].map((tab, i) => (
                <span key={tab} style={{ fontSize: 13, color: i === 0 ? '#fff' : '#8e8e8e', cursor: 'pointer', padding: '4px 0', position: 'relative', fontWeight: 500 }}>
                  {tab}{i === 0 && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -8, height: 2, background: GREEN }} />}
                </span>
              ))}
            </div>
          </div>
          <div style={{ padding: 8 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 1, background: '#222', border: '1px solid #222', borderRadius: 4, overflow: 'hidden' }}>
              {handCells.map(hand => {
                const data = rangeData.get(hand)
                const opacity = getCellOpacity(hand)
                return (
                  <div key={hand} onClick={() => setSelectedCell(selectedCell === hand ? null : hand)}
                    title={hand}
                    style={{
                      height: 22, display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 9, fontWeight: 650, color: '#fff', letterSpacing: 0,
                      textShadow: '0 1px 1px rgba(0,0,0,.6)', cursor: 'pointer', userSelect: 'none',
                      background: getCellColor(hand), opacity,
                      border: selectedCell === hand ? '1px solid #fff' : 'none',
                    }}>
                    {hand}
                  </div>
                )
              })}
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 12, padding: '0 12px 8px', fontSize: 10, color: '#999' }}>
            <span><span style={{ display:'inline-block', width:10, height:10, background:RED_BRIGHT, borderRadius:2, marginRight:3, verticalAlign:'middle' }}></span>Raise</span>
            <span><span style={{ display:'inline-block', width:10, height:10, background:BLUE, borderRadius:2, marginRight:3, verticalAlign:'middle' }}></span>Call</span>
            <span><span style={{ display:'inline-block', width:10, height:10, background:GRAY, borderRadius:2, marginRight:3, verticalAlign:'middle' }}></span>Fold</span>
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ background: '#1C1C1C', border: '1px solid #262626', borderRadius: 10, overflow: 'hidden', minHeight: 0 }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 6, padding: '6px 10px 4px', flexWrap: 'wrap' }}>
            {positions.map(pos => (
              <span key={pos.id} style={{ background: activePosition === pos.id ? '#1a3a2b' : '#262626', color: activePosition === pos.id ? '#7CFC7C' : '#b9b9b9', padding: '3px 8px', borderRadius: 4, fontSize: 11, fontWeight: 500, border: activePosition === pos.id ? '1px solid #2a6b4a' : '1px solid #2e2e2e' }}>{pos.label}</span>
            ))}
          </div>

          {/* Action selection */}
          <div style={{ padding: '0 10px 10px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 4, fontSize: 12, color: '#c8c8c8', margin: '4px 0', fontWeight: 500 }}>
              {selectedHandData ? (
                <>Pick Your Action</>
              ) : (
                <>Select a hand</>
              )}
              {selectedHandData && (
                <span style={{ fontSize: 10, color: '#888', fontWeight: 400, marginLeft: 'auto' }}>
                  Eq: {(selectedHandData.equity * 100).toFixed(0)}%
                </span>
              )}
            </div>

            <ActionSelector
              selectedAction={userAction}
              onSelect={(action) => {
                setUserAction(action)
                setActionFeedback(null)
              }}
              gtoAction={selectedHandData ? (selectedHandData.action.startsWith('raise') ? 'raise' : selectedHandData.action) : undefined}
              gtoFrequency={selectedHandData ? selectedHandData.frequency : undefined}
              disabled={!selectedHandData}
              locked={actionFeedback !== null}
              feedback={actionFeedback}
            />

            {selectedHandData && !actionFeedback && (
              <button
                onClick={handleCheckAction}
                disabled={!userAction}
                style={{
                  width: '100%', marginTop: 8,
                  padding: '8px', borderRadius: 6,
                  background: userAction ? '#16241a' : '#1a1a1a',
                  border: userAction ? `1px solid ${GREEN}` : '1px solid #333',
                  color: userAction ? '#fff' : '#666',
                  fontSize: 12, fontWeight: 600,
                  cursor: userAction ? 'pointer' : 'default',
                }}
              >
                {userAction ? 'Check vs GTO' : 'Select an action above'}
              </button>
            )}

            {actionFeedback && (
              <div style={{ marginTop: 8 }}>
                <button
                  onClick={() => { setUserAction(null); setActionFeedback(null) }}
                  style={{
                    width: '100%', padding: '8px', borderRadius: 6,
                    background: '#1a1a1a', border: '1px solid #333',
                    color: '#aaa', fontSize: 12, fontWeight: 600,
                    cursor: 'pointer',
                  }}
                >
                  Try Again
                </button>
              </div>
            )}

          </div>
        </div>
      </div>
      </div>) : (
        <PostflopTraining />
      )}
    </div>
  )
}