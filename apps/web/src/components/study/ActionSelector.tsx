'use client'

type ActionOption = {
  id: string
  label: string
  shortLabel: string
  color: string
  description: string
}

const ACTIONS: ActionOption[] = [
  { id: 'fold', label: 'Fold', shortLabel: 'FOLD', color: '#2a2a2a', description: '0 EV' },
  { id: 'call', label: 'Call', shortLabel: 'CALL', color: '#3A6EA5', description: 'Call bet' },
  { id: 'raise', label: 'Raise', shortLabel: 'RAISE', color: '#E53935', description: 'Raise to 2.5bb' },
  { id: 'all_in', label: 'All In', shortLabel: 'ALL IN', color: '#7B1E1E', description: 'All-in shove' },
]

interface ActionSelectorProps {
  selectedAction: string | null
  onSelect: (action: string) => void
  gtoAction?: string                          // GTO-recommended action for comparison
  gtoFrequency?: number                       // GTO frequency of that action (0-1)
  disabled?: boolean
  locked?: boolean                            // If true, show feedback mode (GTO comparison)
  feedback?: 'correct' | 'incorrect' | null   // Feedback after compare
}

export default function ActionSelector({
  selectedAction,
  onSelect,
  gtoAction,
  gtoFrequency,
  disabled = false,
  locked = false,
  feedback,
}: ActionSelectorProps) {
  return (
    <div>
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 8 }}>
        {ACTIONS.map(a => {
          const isGto = gtoAction === a.id
          const isSelected = selectedAction === a.id
          const isCorrect = feedback === 'correct' && isSelected
          const isWrong = feedback === 'incorrect' && isSelected

          let bg = isSelected ? a.color : '#161616'
          if (isCorrect) bg = '#00C853'
          if (isWrong) bg = '#D32F2F'

          // Show GTO indicator for non-selected GTO actions in locked mode
          const showGtoBadge = isGto && locked && !isSelected

          return (
            <button
              key={a.id}
              onClick={() => !disabled && !locked && onSelect(a.id)}
              title={a.description}
              style={{
                borderRadius: 8,
                padding: '10px 8px',
                background: bg,
                border: isSelected
                  ? `2px solid ${isCorrect ? '#00C853' : isWrong ? '#D32F2F' : '#fff'}`
                  : isGto && locked
                    ? '2px solid #FFD700'
                    : '1px solid #333',
                color: isSelected ? '#fff' : '#aaa',
                cursor: disabled || locked ? 'default' : 'pointer',
                transition: 'all .12s',
                position: 'relative',
                opacity: disabled ? 0.4 : 1,
              }}
            >
              <div style={{ fontSize: 13, fontWeight: 650 }}>{a.shortLabel}</div>
              {showGtoBadge && (
                <div style={{
                  position: 'absolute', top: -6, right: -6,
                  background: '#FFD700', color: '#000',
                  fontSize: 9, fontWeight: 700, padding: '1px 5px',
                  borderRadius: 8, lineHeight: 1.3,
                }}>
                  GTO
                </div>
              )}
              {isSelected && feedback && (
                <div style={{
                  fontSize: 10, marginTop: 3, opacity: 0.9,
                  color: isCorrect ? '#fff' : '#fff',
                }}>
                  {isCorrect ? '✓ Correct' : '✗ Incorrect'}
                </div>
              )}
              {isGto && gtoFrequency !== undefined && locked && (
                <div style={{ fontSize: 10, marginTop: 2, opacity: 0.7 }}>
                  {(gtoFrequency * 100).toFixed(0)}%
                </div>
              )}
            </button>
          )
        })}
      </div>
    </div>
  )
}
