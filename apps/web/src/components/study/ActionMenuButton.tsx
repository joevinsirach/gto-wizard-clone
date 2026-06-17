import { useState } from 'react'

interface ActionMenuButtonProps {
  label: string
  stack: number
  selected: boolean
  onSelect: (action: string) => void
}

export default function ActionMenuButton({ label, stack, selected, onSelect }: ActionMenuButtonProps) {
  const [open, setOpen] = useState(false)

  const actions = [
    { id: 'open', label: 'Open Raise' },
    { id: 'call', label: 'Call' },
    { id: 'fold', label: 'Fold' },
    { id: 'allin', label: 'All In' },
  ]

  return (
    <div style={{ position: 'relative' }}>
      <button
        onClick={() => setOpen(!open)}
        style={{
          background: selected ? '#16241a' : '#161616',
          border: selected ? '2px solid #7CFC7C' : '1px solid #262626',
          color: selected ? '#fff' : '#b5b5b5',
          padding: '6px 14px 5px',
          borderRadius: 8,
          fontSize: 13,
          whiteSpace: 'nowrap',
          cursor: 'pointer',
          textAlign: 'center',
          minWidth: 78,
          lineHeight: 1.2,
          transition: 'all .1s',
        }}
      >
        {label} {stack.toFixed(1).replace(/\.0$/, '')}
        {selected && (
          <span style={{ display: 'block', fontSize: 10, color: '#7CFC7C', marginTop: 2, fontWeight: 600 }}>
            Take action
          </span>
        )}
      </button>

      {open && (
        <div
          style={{
            position: 'absolute',
            top: '100%',
            left: 0,
            zIndex: 100,
            background: '#1C1C1C',
            border: '1px solid #262626',
            borderRadius: 8,
            minWidth: 120,
            overflow: 'hidden',
            boxShadow: '0 4px 12px rgba(0,0,0,0.5)',
            marginTop: 4,
          }}
        >
          {actions.map((a) => (
            <div
              key={a.id}
              onClick={() => {
                onSelect(a.id)
                setOpen(false)
              }}
              style={{
                padding: '8px 12px',
                fontSize: 12,
                color: '#ccc',
                cursor: 'pointer',
                transition: 'background .1s',
                borderBottom: '1px solid #262626',
              }}
              onMouseEnter={(e) => (e.currentTarget.style.background = '#262626')}
              onMouseLeave={(e) => (e.currentTarget.style.background = 'transparent')}
            >
              {a.label}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
