import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, Cell } from "recharts";

export interface LeakEntry {
  category: string;
  amount: number;   // big blinds lost per 100 hands
  expected: number; // expected loss (legitimate)
  delta: number;    // amount - expected
}

export const MOCK_LEAKS: LeakEntry[] = [
  { category: "VPIP", amount: 3.2, expected: 2.1, delta: 1.1 },
  { category: "PFR", amount: 1.4, expected: 1.6, delta: -0.2 },
  { category: "3-Bet", amount: 2.8, expected: 2.5, delta: 0.3 },
  { category: "CBet Flop", amount: 4.1, expected: 3.8, delta: 0.3 },
  { category: "Fold to 3-Bet", amount: 1.9, expected: 1.2, delta: 0.7 },
  { category: "Check-Raise", amount: 0.6, expected: 0.8, delta: -0.2 },
  { category: "River Bet", amount: 2.2, expected: 1.9, delta: 0.3 },
  { category: "Bluff%", amount: 3.5, expected: 2.8, delta: 0.7 },
];

interface LeakChartProps {
  data?: LeakEntry[];
}

export function LeakChart({ data = MOCK_LEAKS }: LeakChartProps) {
  return (
    <div className="w-full h-64">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart data={data} margin={{ top: 4, right: 4, bottom: 4, left: 0 }}>
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="category"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            label={{ value: "bb/100", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--color-muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: 12,
              color: "var(--color-popover-foreground)",
            }}
            formatter={(value) => [typeof value === "number" ? value.toFixed(2) : value, "Leak (delta)"]}
            labelStyle={{ color: "var(--color-foreground)" }}
          />
          <Bar dataKey="delta" name="Leak (delta)" radius={[4, 4, 0, 0]}>
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={entry.delta > 0 ? "#ef4444" : "#22c55e"}
                fillOpacity={0.8}
              />
            ))}
          </Bar>
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}