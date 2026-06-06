export const gtoTheme = {
  // Background / felt
  felt: '#1a1a2e',
  feltLight: '#16213e',
  surface: '#1f2937',
  surfaceHover: '#374151',
  surfaceActive: '#4b5563',
  border: '#2d3748',
  borderLight: '#4a5568',

  // Brand
  gold: '#d4af37',
  goldHover: '#e6c34a',
  greenAccent: '#22c55e',
  greenDark: '#166534',

  // Cell colors (hand matrix)
  cell: {
    unselected: '#1f2937',
    selected: '#374151',
    hover: '#4b5563',
    border: '#d4af37',
  },

  // Equity mapping (HSL hue ranges)
  equity: {
    hueLow: 0,      // red
    hueMid: 60,     // yellow
    hueHigh: 120,   // green
  },

  // Hand type colors (for range selection)
  handType: {
    pocket: '#f59e0b',
    suited: '#22c55e',
    offsuit: '#3b82f6',
  },

  // Strategy action colors (matching GTO Wizard)
  strategy: {
    fold: '#4a4a4a',         // gray
    check: '#166534',        // dark green
    bet33: '#22c55e',        // bright green (1/3 pot)
    bet50: '#84cc16',        // lime (1/2 pot)
    bet75: '#f59e0b',        // amber (3/4 pot)
    bet100: '#f97316',       // orange (pot)
    bet150: '#ef4444',       // red (1.5x pot)
    bet200: '#dc2626',       // dark red (2x pot)
    raise: '#7c3aed',        // purple
    allin: '#991b1b',        // dark red
  },

  // Strength colors (for equity-based coloring)
  strength: {
    strong: '#22c55e',       // green - high equity
    medium: '#f59e0b',       // amber - medium equity
    weak: '#6b7280',         // gray - low equity
    trash: '#4b5563',        // dark gray - very low equity
  },

  // Equity bucket colors
  bucket: {
    best: '#22c55e',
    good: '#84cc16',
    weak: '#f59e0b',
    trash: '#ef4444',
  },

  // Position colors
  position: {
    utg: '#60a5fa',
    hj: '#818cf8',
    co: '#a78bfa',
    btn: '#c084fc',
    sb: '#34d399',
    bb: '#f87171',
  },

  // Nav tabs
  nav: {
    active: '#22c55e',
    inactive: '#9ca3af',
    bg: '#111827',
  },

  // Text
  text: {
    primary: '#f9fafb',
    secondary: '#9ca3af',
    muted: '#6b7280',
  },

  // Stats
  stat: {
    positive: '#22c55e',
    negative: '#ef4444',
    neutral: '#f59e0b',
  },
} as const;

export type GtoTheme = typeof gtoTheme;

// Helper: get strategy color for a bet size
export function getBetColor(betSize: number): string {
  if (betSize <= 0) return gtoTheme.strategy.check;
  if (betSize <= 1.0) return gtoTheme.strategy.bet33;
  if (betSize <= 1.8) return gtoTheme.strategy.bet33;
  if (betSize <= 2.75) return gtoTheme.strategy.bet50;
  if (betSize <= 4.1) return gtoTheme.strategy.bet75;
  if (betSize <= 6.9) return gtoTheme.strategy.bet100;
  return gtoTheme.strategy.bet150;
}

// Helper: get strength color from equity value (0-100)
export function getStrengthColor(equity: number): string {
  if (equity >= 60) return gtoTheme.strength.strong;
  if (equity >= 35) return gtoTheme.strength.medium;
  if (equity >= 20) return gtoTheme.strength.weak;
  return gtoTheme.strength.trash;
}

// Helper: get equity bucket label from equity value
export function getEquityBucket(equity: number): { label: string; color: string } {
  if (equity >= 60) return { label: 'BEST', color: gtoTheme.bucket.best };
  if (equity >= 35) return { label: 'GOOD', color: gtoTheme.bucket.good };
  if (equity >= 20) return { label: 'WEAK', color: gtoTheme.bucket.weak };
  return { label: 'TRASH', color: gtoTheme.bucket.trash };
}
