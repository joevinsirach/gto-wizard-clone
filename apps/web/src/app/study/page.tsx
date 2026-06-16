'use client'

import { useState, useEffect, useMemo } from 'react'
import PostflopTraining from '@/components/study/PostflopTraining'

const RED = '#D32F2F'
const RED_BRIGHT = '#E53935'
const RED_DARK = '#7B1E1E'
const BLUE = '#3A6EA5'
const GREEN = '#00C853'
const GRAY = '#2a2a2a'

const POSITIONS = [
  { id: 'UTG', label: 'UTG', stack: 100 },
  { id: 'HJ', label: 'HJ', stack: 100 },
  { id: 'CO', label: 'CO', stack: 100 },
  { id: 'BTN', label: 'BTN', stack: 100 },
  { id: 'SB', label: 'SB', stack: 99.5 },
  { id: 'BB', label: 'BB', stack: 99 },
]

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

  // Fetch solver data when position changes
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
            stack_depth: POSITIONS.find(p => p.id === activePosition)?.stack || 100,
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
  }, [activePosition])

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
      {/* Position Bar */}
      <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 16px 8px', overflowX: 'auto', background: '#0E0E0E', borderBottom: '1px solid #141414' }}>
        <div style={{ background: '#1A1A1A', border: '1px solid #2a2a2a', color: '#d0d0d0', padding: '8px 12px', borderRadius: 8, fontSize: 13, display: 'flex', alignItems: 'center', gap: 6, whiteSpace: 'nowrap' }}>
          {loading ? <span style={{ color: GREEN }}>●</span> : error ? <span style={{ color: RED }}>●</span> : <span style={{ color: GREEN }}>●</span>}
          {loading ? 'Solving...' : error ? 'Offline' : 'GTO'}
        </div>
        {POSITIONS.map(pos => (
          <button key={pos.id} onClick={() => setActivePosition(pos.id)}
            style={{
              background: activePosition === pos.id ? '#16241a' : '#161616',
              border: activePosition === pos.id ? `2px solid #7CFC7C` : '1px solid #262626',
              color: activePosition === pos.id ? '#fff' : '#b5b5b5',
              padding: '6px 14px 5px', borderRadius: 8, fontSize: 13, whiteSpace: 'nowrap', cursor: 'pointer',
              textAlign: 'center', minWidth: 78, lineHeight: 1.2,
            }}>
            {pos.label} {pos.stack}
            {activePosition === pos.id && <span style={{ display: 'block', fontSize: 10, color: '#7CFC7C', marginTop: 2, fontWeight: 600 }}>Take action</span>}
          </button>
        ))}
      </div>

      {/* Main Grid */}
      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.45fr) minmax(0, 1fr)', gap: 16, padding: 16, maxWidth: 1640, margin: '0 auto' }}>
        {/* Matrix Panel */}
        <div style={{ background: '#1C1C1C', border: '1px solid #262626', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '11px 14px', borderBottom: '1px solid #262626' }}>
            <div style={{ display: 'flex', gap: 22, alignItems: 'center' }}>
              {['Strategy ▾', 'Ranges', 'Breakdown', 'Reports: Flops'].map((tab, i) => (
                <span key={tab} style={{ fontSize: 13.5, color: i === 0 ? '#fff' : '#8e8e8e', cursor: 'pointer', padding: '5px 0', position: 'relative', fontWeight: 500 }}>
                  {tab}{i === 0 && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -11, height: 2, background: GREEN }} />}
                </span>
              ))}
            </div>
            <span style={{ color: '#777', fontSize: 12 }}>◀ <span>1/100</span> ▶</span>
          </div>
          <div style={{ padding: 14 }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(13, 1fr)', gap: 2, background: '#222', border: '1px solid #222', borderRadius: 6, overflow: 'hidden' }}>
              {handCells.map(hand => {
                const data = rangeData.get(hand)
                const opacity = getCellOpacity(hand)
                return (
                  <div key={hand} onClick={() => setSelectedCell(selectedCell === hand ? null : hand)}
                    style={{
                      aspectRatio: '1/1', display: 'flex', alignItems: 'center', justifyContent: 'center',
                      fontSize: 11.5, fontWeight: 650, color: '#fff', letterSpacing: 0.2,
                      textShadow: '0 1px 1px rgba(0,0,0,.45)', cursor: 'pointer', userSelect: 'none',
                      transition: 'transform .07s', background: getCellColor(hand), opacity,
                      border: selectedCell === hand ? '2px solid #fff' : 'none',
                    }}>
                    {hand}
                  </div>
                )
              })}
            </div>
          </div>
          {/* Legend */}
          <div style={{ display: 'flex', gap: 14, padding: '0 14px 12px', fontSize: 11, color: '#999' }}>
            <span><span style={{ display:'inline-block', width:12, height:12, background:RED_BRIGHT, borderRadius:2, marginRight:4, verticalAlign:'middle' }}></span> Raise</span>
            <span><span style={{ display:'inline-block', width:12, height:12, background:BLUE, borderRadius:2, marginRight:4, verticalAlign:'middle' }}></span> Call</span>
            <span><span style={{ display:'inline-block', width:12, height:12, background:GRAY, borderRadius:2, marginRight:4, verticalAlign:'middle' }}></span> Fold</span>
          </div>
        </div>

        {/* Details Panel */}
        <div style={{ background: '#1C1C1C', border: '1px solid #262626', borderRadius: 10, overflow: 'hidden' }}>
          <div style={{ display: 'flex', gap: 22, padding: '12px 14px 0', borderBottom: '1px solid transparent' }}>
            {['Overview', 'Table', 'Equity chart'].map((tab, i) => (
              <span key={tab} style={{ fontSize: 13, color: i === 0 ? '#fff' : '#8b8b8b', paddingBottom: 10, cursor: 'pointer', borderBottom: i === 0 ? `2px solid ${GREEN}` : '2px solid transparent' }}>{tab}</span>
            ))}
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, padding: '12px 14px 6px', flexWrap: 'wrap' }}>
            {POSITIONS.map(pos => (
              <span key={pos.id} style={{ background: activePosition === pos.id ? '#1a3a2b' : '#262626', color: activePosition === pos.id ? '#7CFC7C' : '#b9b9b9', padding: '5px 10px', borderRadius: 6, fontSize: 12, fontWeight: 500, border: activePosition === pos.id ? '1px solid #2a6b4a' : '1px solid #2e2e2e' }}>{pos.label} {pos.stack}</span>
            ))}
            <div style={{ marginLeft: 'auto', textAlign: 'right', fontSize: 12, color: '#9a9a9a', lineHeight: 1.35 }}>
              {activePosition === 'UTG' ? <><b style={{ color:'#ddd',fontWeight:500 }}>2.5 BB</b><br />Pot odds: 40%</> : <><b style={{ color:'#ddd',fontWeight:500 }}>1.5 BB</b><br />Pot odds: 33%</>}
            </div>
          </div>

          {/* Selected hand action breakdown with interactive buttons */}
          {selectedHandData ? (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c8c8c8', margin: '10px 0', fontWeight: 500 }}>
                GTO Action for {selectedCell}
                <span style={{ fontSize: 10, color: '#888', fontWeight: 400, marginLeft: 'auto' }}>
                  Equity: {(selectedHandData.equity * 100).toFixed(1)}%
                </span>
              </div>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[
                  { action: 'fold', label: 'Fold', bg: GRAY },
                  { action: 'call', label: 'Call', bg: BLUE },
                  { action: 'raise', label: 'Raise', bg: RED_BRIGHT },
                ].map(a => {
                  const isGto = selectedHandData.action.startsWith(a.action)
                  const freq = isGto ? selectedHandData.frequency : 0
                  const combos = isGto ? Math.round(freq * 6) : 0
                  return (
                    <div key={a.action} style={{
                      borderRadius: 8, padding: '12px 12px 10px', color: '#fff',
                      background: isGto ? a.bg : '#1a1a1a',
                      border: isGto ? 'none' : '1px solid #333',
                      cursor: 'pointer', transition: 'all .1s',
                      opacity: isGto ? 1 : 0.4,
                    }}>
                      <div style={{ fontSize: 13, fontWeight: 600, opacity: .95 }}>
                        {a.label}
                        {isGto && <span style={{ fontSize: 9, marginLeft: 6, opacity: .7 }}>GTO ✓</span>}
                      </div>
                      <div style={{ fontSize: 24, fontWeight: 750, lineHeight: 1.1, marginTop: 4 }}>
                        {isGto ? `${(freq * 100).toFixed(0)}%` : '—'}
                      </div>
                      <div style={{ fontSize: 11, opacity: .85, marginTop: 3 }}>
                        {isGto ? `${combos} combos` : ''}
                      </div>
                    </div>
                  )
                })}
              </div>
            </div>
          ) : (
            <div style={{ padding: '0 14px 14px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, color: '#c8c8c8', margin: '10px 0', fontWeight: 500 }}>Actions ▾</div>
              <div className="cards-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 10 }}>
                {[['raise', RED_BRIGHT], ['call', BLUE], ['fold', GRAY]].map(([action, bg]) => {
                  const s = actionSummary[action] || { count: 0, totalFreq: 0 }
                  const pct = totalCombos > 0 ? ((s.count / 169) * 100).toFixed(1) : '0.0'
                  const combos = Math.round((s.count / 169) * totalCombos)
                  return (
                    <div key={action} style={{ borderRadius: 8, padding: '12px 12px 10px', color: '#fff', background: bg as string }}>
                      <div style={{ fontSize: 13, fontWeight: 600, opacity: .95 }}>{actionLabels[action] || action}</div>
                      <div style={{ fontSize: 24, fontWeight: 750, lineHeight: 1.1, marginTop: 4 }}>{pct}%</div>
                      <div style={{ fontSize: 11, opacity: .85, marginTop: 3 }}>{combos} combos</div>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Hand combos section */}
          <div style={{ borderTop: '1px solid #262626', marginTop: 6 }}>
            <div style={{ display: 'flex', gap: 18, padding: '10px 14px', borderBottom: '1px solid #262626' }}>
              {['Summary', 'Filters', 'Blockers', 'Hands'].map((t, i) => (
                <span key={t} style={{ fontSize: 12.5, color: i === 3 ? '#fff' : '#888', cursor: 'pointer', padding: '4px 0', position: 'relative' }}>
                  {t}{i === 3 && <span style={{ position: 'absolute', left: 0, right: 0, bottom: -10, height: 2, background: GREEN }} />}
                </span>
              ))}
            </div>
            {selectedCell ? (
              <div className="hand-grid" style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 8, padding: '12px 14px 16px' }}>
                {selectedHandCombos.map(([s1, s2], i) => (
                  <div key={i} style={{ background: '#2f4d73', border: '1px solid #3d5f8a', borderRadius: 8, padding: '8px 9px', position: 'relative', minHeight: 72 }}>
                    <div style={{ fontWeight: 700, fontSize: 15, marginBottom: 6, letterSpacing: 0.3 }}>
                      {selectedCell[0]}<span className={s1 === 'h' || s1 === 'd' ? 'suit-heart' : 'suit-spade'}>{SUIT_SYM[s1]}</span>
                      {selectedCell[1]}<span className={s2 === 'h' || s2 === 'd' ? 'suit-heart' : 'suit-spade'}>{SUIT_SYM[s2]}</span>
                    </div>
                    <div style={{ fontSize: 11, color: '#cfe0f5', lineHeight: 1.5 }}>
                      <div>{selectedHandData?.action || 'Fold'} <span style={{ float: 'right', color: '#fff', fontWeight: 600 }}>{selectedHandData ? `${(selectedHandData.frequency * 100).toFixed(0)}%` : '100'}</span></div>
                    </div>
                  </div>
                ))}
              </div>
            ) : (
              <div style={{ textAlign: 'center', color: '#666', padding: 20, fontSize: 13 }}>Click a hand in the matrix to see combo details</div>
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