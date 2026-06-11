'use client'

import { useState, useCallback } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
const SUITS = ['s', 'h', 'd', 'c'] as const
const SUIT_SYM: Record<string, string> = { s: '♠', h: '♥', d: '♦', c: '♣' }
const RANKS = ['A', 'K', 'Q', 'J', 'T', '9', '8', '7', '6', '5', '4', '3', '2']
const POSITIONS = ['UTG', 'MP', 'CO', 'BTN', 'SB', 'BB']

export default function PlayPage() {
  const [hasHand, setHasHand] = useState(false)
  const [hero, setHero] = useState<{ r: string; s: string }[]>([])
  const [board, setBoard] = useState<(string | null)[]>([null, null, null, null, null])
  const [pot, setPot] = useState(1.5)
  const [position, setPosition] = useState('BTN')
  const [stackSize, setStackSize] = useState(100)
  const [history, setHistory] = useState<string[]>([])
  const [answered, setAnswered] = useState(false)
  const [selectedAction, setSelectedAction] = useState<number | null>(null)
  const [session, setSession] = useState({ hands: 0, correct: 0, streak: 0 })
  const [showSolution, setShowSolution] = useState(false)
  const [solution, setSolution] = useState<{ actions: { name: string; type: string; freq: number; ev: number }[]; bestIdx: number } | null>(null)

  const dealHand = useCallback(() => {
    const deck: { r: string; s: string }[] = []
    for (const r of RANKS) for (const s of SUITS) deck.push({ r, s })
    for (let i = deck.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [deck[i], deck[j]] = [deck[j], deck[i]] }
    let di = 0; const draw = () => deck[di++]
    const h = [draw(), draw()]
    const b: (string | null)[] = [draw().r + draw().s, draw().r + draw().s, draw().r + draw().s, null, null]
    setHero(h)
    setBoard(b)
    setPot(1.5 + Math.random() * 8)
    setHistory([])
    setAnswered(false)
    setSelectedAction(null)
    setShowSolution(false)
    setHasHand(true)

    // Mock solution
    const actions = [
      { name: 'Fold', type: 'fold', freq: Math.round(Math.random() * 30 + 10), ev: 0 },
      { name: 'Check', type: 'check', freq: Math.round(Math.random() * 20 + 5), ev: Math.round((Math.random() * 1.5) * 100) / 100 },
      { name: `Call ${Math.floor(Math.random() * 3 + 2)}bb`, type: 'call', freq: Math.round(Math.random() * 20 + 5), ev: Math.round((Math.random() * 2) * 100) / 100 },
      { name: 'Raise', type: 'raise', freq: Math.round(Math.random() * 15 + 5), ev: Math.round((Math.random() * 3) * 100) / 100 },
      { name: 'All-in', type: 'allin', freq: Math.round(Math.random() * 10), ev: Math.round((Math.random() * 4 - 1) * 100) / 100 },
    ]
    const bestIdx = Math.floor(Math.random() * actions.length)
    actions[bestIdx].freq += 30
    setSolution({ actions, bestIdx })
  }, [])

  const handleAction = (idx: number) => {
    if (!solution || answered) return
    setSelectedAction(idx)
    setAnswered(true)
    const isCorrect = idx === solution.bestIdx
    setHistory(h => [...h, `${solution.actions[idx].name}${isCorrect ? ' ✓' : ''}`])
    setSession(s => ({ hands: s.hands + 1, correct: s.correct + (isCorrect ? 1 : 0), streak: isCorrect ? s.streak + 1 : 0 }))
  }

  const typeColor = (t: string) => ({ fold: '#5b6472', check: '#00a67e', call: '#e09b3d', raise: '#e05a5a', allin: '#e05a5a' }[t] || '#5b6472')

  const suitColor = (s: string) => (s === 'h' || s === 'd') ? '#c41e3a' : '#111'

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d0f', display: 'flex', flexDirection: 'column' }}>
      {/* Config Bar */}
      <div style={{ height: 48, background: '#1a1e23', borderBottom: '1px solid #252b32', display: 'flex', alignItems: 'center', gap: 16, padding: '0 16px' }}>
        <select value={position} onChange={e => setPosition(e.target.value)}
          style={{ background: '#14171b', color: '#d1d7df', border: '1px solid #252b32', borderRadius: 8, padding: '6px 10px', fontSize: 13 }}>
          {['Random', ...POSITIONS].map(p => <option key={p}>{p}</option>)}
        </select>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
          <span style={{ fontSize: 12, color: '#8a94a6' }}>{stackSize}bb</span>
          <input type="range" min={20} max={200} value={stackSize} onChange={e => setStackSize(Number(e.target.value))} style={{ width: 120, accentColor: '#00a98f' }} />
        </div>
        <button onClick={dealHand} style={{ marginLeft: 'auto', background: '#00a98f', color: '#02110e', border: 'none', padding: '8px 14px', borderRadius: 8, fontWeight: 600, fontSize: 13, cursor: 'pointer' }}>New Hand</button>
      </div>

      {/* Main */}
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr 380px' }} className="play-grid">
        <div style={{ padding: 24, display: 'flex', flexDirection: 'column', alignItems: 'center', borderRight: '1px solid #252b32' }}>
          {!hasHand ? (
            <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', height: '100%', color: '#8a94a6', gap: 12 }}>
              <div style={{ fontSize: 48, opacity: 0.5 }}>🎴</div>
              <span style={{ fontSize: 16, color: '#d1d7df' }}>No active hand</span>
              <span style={{ fontSize: 13 }}>Press New Hand to start</span>
              <button onClick={dealHand} style={{ marginTop: 8, background: '#00a98f', color: '#02110e', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, cursor: 'pointer' }}>New Hand</button>
            </div>
          ) : (
            <>
              <div style={{ width: 'min(480px, 90vw)', height: 'min(260px, 40vw)', borderRadius: '50%', background: 'radial-gradient(ellipse at center,#152028 0%,#0f171d 70%)', border: '10px solid #24303b', boxShadow: '0 20px 40px rgba(0,0,0,.5), inset 0 0 60px rgba(0,0,0,.6)', display: 'flex', alignItems: 'center', justifyContent: 'center', flexDirection: 'column', marginTop: 20 }}>
                <div style={{ color: '#8a94a6', fontSize: 13, marginBottom: 10 }}>Pot: <b style={{ color: '#d1d7df' }}>{pot.toFixed(1)}bb</b></div>
                <div style={{ display: 'flex', gap: 8 }}>
                  {board.map((card, i) => (
                    <div key={i} style={{ width: 48, height: 66, borderRadius: 6, background: card ? '#fff' : 'rgba(0,0,0,.35)', border: card ? '1px solid #222' : '1px solid rgba(255,255,255,.06)', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, color: card ? suitColor(card[1]) : 'transparent', boxShadow: card ? '0 2px 6px rgba(0,0,0,.4)' : 'inset 0 2px 4px rgba(0,0,0,.5)' }}>
                      {card && <><div>{card[0]}</div><div style={{ fontSize: 18 }}>{SUIT_SYM[card[1]]}</div></>}
                    </div>
                  ))}
                </div>
              </div>
              <div style={{ display: 'flex', gap: 12, marginTop: 16 }}>
                {hero.map((c, i) => (
                  <div key={i} style={{ width: 64, height: 88, borderRadius: 8, background: '#fff', color: suitColor(c.s), display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 700, boxShadow: '0 3px 10px rgba(0,0,0,.4)' }}>
                    <div style={{ fontSize: 22 }}>{c.r}</div><div style={{ fontSize: 24 }}>{SUIT_SYM[c.s]}</div>
                  </div>
                ))}
              </div>
              <div style={{ marginTop: 8, fontSize: 12, color: '#8a94a6' }}>{position} · {stackSize}bb</div>
              <div style={{ fontSize: 12, color: '#8a94a6', marginTop: 8, minHeight: 24 }}>
                {history.map((h, i) => <span key={i} style={{ margin: '0 4px' }}>{h}</span>)}
              </div>
            </>
          )}
        </div>

        <div style={{ background: '#0f1317', padding: 20, overflow: 'auto' }}>
          <h2 style={{ margin: '0 0 4px', fontSize: 20, color: '#d1d7df' }}>What do you do?</h2>
          <div style={{ color: '#8a94a6', fontSize: 13, marginBottom: 16 }}>{position} · {stackSize}bb</div>
          {solution && (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 8 }}>
              {solution.actions.map((a, i) => (
                <button key={i} onClick={() => handleAction(i)} disabled={answered}
                  style={{
                    background: selectedAction === i ? 'rgba(0,169,143,.08)' : '#1a1e23',
                    border: `1px solid ${selectedAction === i ? '#00a98f' : '#252b32'}`,
                    borderLeft: `3px solid ${typeColor(a.type)}`, borderRadius: 10,
                    padding: '12px 14px', display: 'flex', justifyContent: 'space-between',
                    cursor: answered ? 'default' : 'pointer', width: '100%', color: '#d1d7df',
                    opacity: answered && i !== solution.bestIdx && i !== selectedAction ? 0.4 : 1,
                    outline: solution.bestIdx === i && answered ? '2px solid #00a98f' : 'none',
                    outlineOffset: -2,
                  }}>
                  <span style={{ fontWeight: 600, fontSize: 14 }}>{a.name}</span>
                  <span style={{ textAlign: 'right', fontSize: 12, color: '#8a94a6' }}>
                    {answered ? (
                      <span style={{ color: i === solution.bestIdx ? '#00a67e' : i === selectedAction ? '#e05a5a' : '#8a94a6', fontWeight: 600 }}>
                        {i === solution.bestIdx ? '✓' : i === selectedAction ? '✗' : ''}
                        <br />EV: {a.ev >= 0 ? '+' : ''}{a.ev.toFixed(2)}
                      </span>
                    ) : <><span style={{ color: '#d1d7df' }}>{a.freq}%</span><br />EV: {a.ev >= 0 ? '+' : ''}{a.ev.toFixed(2)}</>}
                  </span>
                </button>
              ))}
            </div>
          )}
          {answered && (
            <div style={{ marginTop: 16 }}>
              <label style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 13, color: '#8a94a6', cursor: 'pointer' }}>
                <input type="checkbox" checked={showSolution} onChange={e => setShowSolution(e.target.checked)} style={{ accentColor: '#00a98f' }} /> Show Solution
              </label>
            </div>
          )}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 8, marginTop: 20 }}>
            {[
              { label: 'Hands', value: session.hands },
              { label: 'Correct', value: `${session.hands ? Math.round(session.correct / session.hands * 100) : 0}%` },
              { label: 'Streak', value: session.streak },
            ].map(s => (
              <div key={s.label} style={{ background: '#1a1e23', borderRadius: 8, padding: 10, textAlign: 'center', border: '1px solid #252b32' }}>
                <div style={{ fontSize: 11, color: '#8a94a6', marginBottom: 4 }}>{s.label}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: '#d1d7df' }}>{s.value}</div>
              </div>
            ))}
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 1100px) { .play-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
