'use client'

import { useState, useCallback, useEffect } from 'react'

const API_BASE = process.env.NEXT_PUBLIC_API_URL || '/api/v1'
const CATEGORIES = ['All', '3-bet pot', 'Open-raise pot', 'Overcard board', 'Monoboard', 'Paired board', 'Wet board']
const DIFFICULTIES = ['All', 'Beginner', 'Intermediate', 'Advanced']

interface Spot { category: string; difficulty: string; position: string; hero_hand: string; board: string | null; pot_size: number; stack_depth: number; gto_action: string; gto_frequency: number; gto_ev: number; options: { action: string; frequency: number; ev: number; is_gto: boolean }[] }

function mockSpot(): Spot {
  const cats = CATEGORIES.slice(1); const diffs = DIFFICULTIES.slice(1); const actions = ['Fold', 'Call', 'Raise', 'All-in']
  const gtoIdx = Math.floor(Math.random() * 4)
  return {
    category: cats[Math.floor(Math.random() * cats.length)], difficulty: diffs[Math.floor(Math.random() * diffs.length)],
    position: ['UTG', 'HJ', 'CO', 'BTN', 'SB', 'BB'][Math.floor(Math.random() * 6)],
    hero_hand: ['AKs', 'AA', 'KK', 'QQ', 'AQs', 'JJ', 'TT', 'AKo', 'KQs', 'AJs'][Math.floor(Math.random() * 10)],
    board: Math.random() > 0.3 ? 'Kd7h2c' : null,
    pot_size: Math.floor(Math.random() * 80) + 15, stack_depth: [50, 75, 100, 125, 150, 200][Math.floor(Math.random() * 6)],
    gto_action: actions[gtoIdx], gto_frequency: Math.round(30 + Math.random() * 50), gto_ev: Math.round((Math.random() * 4 - 0.5) * 100) / 100,
    options: actions.map((a, i) => ({ action: a, frequency: Math.round(Math.random() * 60 + 5), ev: Math.round((Math.random() * 5 - 1) * 100) / 100, is_gto: i === gtoIdx })),
  }
}

const SUIT_SYM: Record<string, string> = { h: '♥', d: '♦', c: '♣', s: '♠' }

export default function PracticePage() {
  const [category, setCategory] = useState('All')
  const [difficulty, setDifficulty] = useState('All')
  const [sessionActive, setSessionActive] = useState(false)
  const [spot, setSpot] = useState<Spot | null>(null)
  const [answered, setAnswered] = useState(false)
  const [selectedAction, setSelectedAction] = useState<string | null>(null)
  const [stats, setStats] = useState({ total: 0, correct: 0, streak: 0 })

  const fetchSpot = useCallback(async () => {
    setAnswered(false); setSelectedAction(null)
    try {
      const params = new URLSearchParams()
      if (category !== 'All') params.set('category', category)
      if (difficulty !== 'All') params.set('difficulty', difficulty.toLowerCase())
      const res = await fetch(`${API_BASE}/quiz/random?${params.toString()}`)
      if (res.ok) { const d = await res.json(); if (d?.options) { setSpot(d); return } }
    } catch { /* fallback */ }
    setSpot(mockSpot())
  }, [category, difficulty])

  const startSession = () => { setSessionActive(true); setStats({ total: 0, correct: 0, streak: 0 }); fetchSpot() }

  const handleAnswer = (actionName: string) => {
    if (answered || !spot) return
    setSelectedAction(actionName); setAnswered(true)
    const isCorrect = spot.options.find(o => o.action === actionName)?.is_gto ?? false
    setStats(prev => ({ total: prev.total + 1, correct: prev.correct + (isCorrect ? 1 : 0), streak: isCorrect ? prev.streak + 1 : 0 }))
  }

  const renderBoard = (board: string | null) => {
    if (!board) return null
    const cards = []
    for (let i = 0; i < board.length; i += 2) cards.push({ r: board[i], s: board[i + 1]?.toLowerCase() || '' })
    return <div style={{ display: 'flex', gap: 6, justifyContent: 'center', margin: '10px 0' }}>
      {cards.map((c, i) => (
        <div key={i} style={{ width: 44, height: 62, background: '#fff', borderRadius: 6, display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', fontWeight: 700, fontSize: 16, boxShadow: '0 2px 6px rgba(0,0,0,.3)', color: (c.s === 'h' || c.s === 'd') ? '#c41e3a' : '#111' }}>
          <div>{c.r}</div><div style={{ fontSize: 18 }}>{SUIT_SYM[c.s] || ''}</div>
        </div>
      ))}
    </div>
  }

  if (!sessionActive) return (
    <div style={{ minHeight: '100vh', background: '#0b0d0f', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: 16, padding: 20 }}>
      <div style={{ fontSize: 48, opacity: 0.5 }}>📚</div>
      <h2 style={{ margin: 0, color: '#d1d7df', fontSize: 22 }}>Ready to practice?</h2>
      <p style={{ margin: 0, color: '#8a94a6', fontSize: 14, maxWidth: 360, textAlign: 'center' }}>Select filters and start a practice session to test your GTO knowledge.</p>
      <div style={{ display: 'flex', flexWrap: 'wrap', gap: 12, justifyContent: 'center', marginTop: 8 }}>
        {[
          { label: 'Category', options: CATEGORIES, sel: category, set: setCategory },
          { label: 'Difficulty', options: DIFFICULTIES, sel: difficulty, set: setDifficulty },
        ].map(g => (
          <div key={g.label} style={{ textAlign: 'center' }}>
            <div style={{ fontSize: 11, color: '#6b7585', marginBottom: 4, fontWeight: 500 }}>{g.label}</div>
            <div style={{ display: 'flex', gap: 4 }}>
              {g.options.map(o => (
                <button key={o} onClick={() => g.set(o)}
                  style={{ padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer', background: g.sel === o ? '#00a98f' : '#1a1e23', color: g.sel === o ? '#02110e' : '#8a94a6', border: `1px solid ${g.sel === o ? '#00a98f' : '#252b32'}`, fontWeight: g.sel === o ? 600 : 400 }}>{o}</button>
              ))}
            </div>
          </div>
        ))}
      </div>
      <button onClick={startSession} style={{ marginTop: 16, background: '#00a98f', color: '#02110e', border: 'none', padding: '12px 32px', borderRadius: 10, fontWeight: 600, fontSize: 15, cursor: 'pointer' }}>Start Practice Session</button>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#0b0d0f', display: 'flex', flexDirection: 'column' }}>
      <div style={{ height: 52, background: '#14171b', borderBottom: '1px solid #252b32', display: 'flex', alignItems: 'center', padding: '0 16px', gap: 16 }}>
        <span style={{ fontWeight: 700, fontSize: 15 }}>Practice</span>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 14, fontSize: 12, color: '#8a94a6' }}>
          <span>Spots: <b style={{ color: '#d1d7df' }}>{stats.total}</b></span>
          <span>Correct: <b style={{ color: stats.total > 0 && stats.correct / stats.total >= 0.6 ? '#00a67e' : '#e09b3d' }}>{stats.total ? Math.round(stats.correct / stats.total * 100) : 0}%</b></span>
          <span>Streak: <b style={{ color: stats.streak >= 3 ? '#00a67e' : '#d1d7df' }}>{stats.streak}</b></span>
        </div>
        <button onClick={() => setSessionActive(false)} style={{ background: '#1a1e23', border: '1px solid #252b32', color: '#8a94a6', padding: '6px 12px', borderRadius: 6, fontSize: 12, cursor: 'pointer' }}>End</button>
      </div>
      <div style={{ flex: 1, display: 'grid', gridTemplateColumns: '1.3fr 1fr' }} className="practice-grid">
        <div style={{ padding: 24, borderRight: '1px solid #252b32' }}>
          {spot && (
            <>
              <div style={{ display: 'flex', gap: 8, marginBottom: 14, flexWrap: 'wrap' }}>
                <span style={{ background: '#1a1e23', color: '#00a98f', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{spot.category}</span>
                <span style={{ background: '#1a1e23', color: '#e09b3d', padding: '4px 10px', borderRadius: 6, fontSize: 12, fontWeight: 600 }}>{spot.difficulty}</span>
                <span style={{ background: '#1a1e23', color: '#8a94a6', padding: '4px 10px', borderRadius: 6, fontSize: 12 }}>{spot.position}</span>
              </div>
              <div style={{ textAlign: 'center', marginBottom: 10 }}>
                <div style={{ fontSize: 12, color: '#8a94a6', marginBottom: 6 }}>Your Hand</div>
                <div style={{ display: 'inline-flex', background: '#1a1e23', border: '1px solid #252b32', borderRadius: 10, padding: '10px 24px' }}>
                  <span style={{ fontSize: 28, fontWeight: 700, color: '#d1d7df', letterSpacing: 2 }}>{spot.hero_hand}</span>
                </div>
              </div>
              {renderBoard(spot.board)}
              <div style={{ display: 'flex', justifyContent: 'center', gap: 20, margin: '10px 0 18px', fontSize: 13, color: '#8a94a6' }}>
                <span>Pot: <b style={{ color: '#d1d7df' }}>{spot.pot_size}bb</b></span>
                <span>Stack: <b style={{ color: '#d1d7df' }}>{spot.stack_depth}bb</b></span>
                <span>Position: <b style={{ color: '#d1d7df' }}>{spot.position}</b></span>
              </div>
              <div style={{ fontSize: 15, fontWeight: 600, color: '#d1d7df', marginBottom: 12 }}>What&apos;s the GTO play?</div>
              {spot.options.map(opt => {
                const isSelected = selectedAction === opt.action
                const isCorrect = opt.is_gto
                return (
                  <button key={opt.action} onClick={() => handleAnswer(opt.action)} disabled={answered}
                    style={{
                      display: 'flex', justifyContent: 'space-between', alignItems: 'center', width: '100%',
                      padding: '12px 16px', marginBottom: 8, borderRadius: 10, cursor: answered ? 'default' : 'pointer',
                      background: isSelected ? (isCorrect ? 'rgba(0,169,143,.12)' : 'rgba(224,90,90,.12)') : '#1a1e23',
                      border: `1px solid ${isSelected ? (isCorrect ? '#00a98f' : '#e05a5a') : '#252b32'}`,
                      color: '#d1d7df', opacity: answered && !isSelected && !isCorrect ? 0.4 : 1,
                      outline: answered && isCorrect ? '2px solid #00a98f' : 'none', outlineOffset: -2,
                    }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                      {answered && isCorrect && <span style={{ color: '#00a67e' }}>✓</span>}
                      {answered && isSelected && !isCorrect && <span style={{ color: '#e05a5a' }}>✗</span>}
                      <span style={{ fontWeight: 600, fontSize: 14 }}>{opt.action}</span>
                    </div>
                    {answered
                      ? <span style={{ fontSize: 12, color: '#8a94a6' }}>EV: <b style={{ color: opt.ev >= 0 ? '#00a67e' : '#e05a5a' }}>{opt.ev >= 0 ? '+' : ''}{opt.ev.toFixed(2)}</b></span>
                      : <span style={{ fontSize: 12, color: '#8a94a6' }}>{opt.frequency}%</span>}
                  </button>
                )
              })}
              {answered && (
                <div style={{ marginTop: 16, textAlign: 'center' }}>
                  <div style={{ fontSize: 14, color: selectedAction === spot.options.find(o => o.is_gto)?.action ? '#00a67e' : '#e05a5a', fontWeight: 600, marginBottom: 10 }}>
                    {selectedAction === spot.options.find(o => o.is_gto)?.action ? '✓ Correct!' : `✗ GTO: ${spot.gto_action}`}
                  </div>
                  <button onClick={fetchSpot} style={{ background: '#00a98f', color: '#02110e', border: 'none', padding: '10px 24px', borderRadius: 8, fontWeight: 600, fontSize: 14, cursor: 'pointer' }}>Next</button>
                </div>
              )}
            </>
          )}
        </div>
        <div style={{ background: '#0f1317', padding: 20 }}>
          <h3 style={{ margin: '0 0 16px', fontSize: 14, color: '#d1d7df' }}>Session</h3>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 10 }}>
            {[
              { l: 'Spots', v: stats.total },
              { l: 'Correct', v: `${stats.total ? Math.round(stats.correct / stats.total * 100) : 0}%`, c: stats.total && stats.correct / stats.total >= 0.6 ? '#00a67e' : '#e09b3d' },
              { l: 'Streak', v: stats.streak, c: stats.streak >= 3 ? '#00a67e' : '#d1d7df' },
            ].map(s => (
              <div key={s.l} style={{ background: '#1a1e23', borderRadius: 8, padding: 10, textAlign: 'center', border: '1px solid #252b32' }}>
                <div style={{ fontSize: 11, color: '#8a94a6', marginBottom: 4 }}>{s.l}</div>
                <div style={{ fontSize: 20, fontWeight: 700, color: s.c || '#d1d7df' }}>{s.v}</div>
              </div>
            ))}
          </div>
          <div style={{ marginTop: 16 }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: 12, color: '#8a94a6', marginBottom: 4 }}><span>Accuracy</span><span>{stats.total ? Math.round(stats.correct / stats.total * 100) : 0}%</span></div>
            <div style={{ height: 6, background: '#1a1e23', borderRadius: 3, overflow: 'hidden' }}>
              <div style={{ width: `${stats.total ? stats.correct / stats.total * 100 : 0}%`, height: '100%', background: '#00a98f', borderRadius: 3, transition: 'width .3s' }} />
            </div>
          </div>
        </div>
      </div>
      <style>{`@media (max-width: 1100px) { .practice-grid { grid-template-columns: 1fr !important; } }`}</style>
    </div>
  )
}
