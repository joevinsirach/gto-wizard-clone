"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";

export interface EquityEntry {
  hand: string;
  heroEquity: number;
  heroWin: number;
  heroTie: number;
  villainEquity: number;
  villainWin: number;
  villainTie: number;
}

export const MOCK_EQUITY_DATA: EquityEntry[] = [
  { hand: "AA", heroEquity: 81.2, heroWin: 79.1, heroTie: 2.1, villainEquity: 18.8, villainWin: 17.2, villainTie: 1.6 },
  { hand: "KK", heroEquity: 79.8, heroWin: 77.5, heroTie: 2.3, villainEquity: 20.2, villainWin: 18.4, villainTie: 1.8 },
  { hand: "QQ", heroEquity: 77.1, heroWin: 74.2, heroTie: 2.9, villainEquity: 22.9, villainWin: 20.8, villainTie: 2.1 },
  { hand: "AKs", heroEquity: 65.4, heroWin: 62.1, heroTie: 3.3, villainEquity: 34.6, villainWin: 31.9, villainTie: 2.7 },
  { hand: "AKo", heroEquity: 63.2, heroWin: 59.8, heroTie: 3.4, villainEquity: 36.8, villainWin: 34.1, villainTie: 2.7 },
  { hand: "JJ", heroEquity: 71.5, heroWin: 68.3, heroTie: 3.2, villainEquity: 28.5, villainWin: 25.9, villainTie: 2.6 },
  { hand: "TT", heroEquity: 69.2, heroWin: 65.7, heroTie: 3.5, villainEquity: 30.8, villainWin: 28.1, villainTie: 2.7 },
  { hand: "99", heroEquity: 66.8, heroWin: 62.9, heroTie: 3.9, villainEquity: 33.2, villainWin: 30.4, villainTie: 2.8 },
];

interface EquityChartProps {
  data?: EquityEntry[];
}

export function EquityChart({ data = MOCK_EQUITY_DATA }: EquityChartProps) {
  return (
    <div className="w-full h-80">
      <ResponsiveContainer width="100%" height="100%">
        <BarChart
          data={data}
          margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
          barCategoryGap="20%"
        >
          <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
          <XAxis
            dataKey="hand"
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "var(--color-muted-foreground)" }}
            tickLine={false}
            axisLine={false}
            domain={[0, 100]}
            label={{ value: "%", angle: -90, position: "insideLeft", fontSize: 10, fill: "var(--color-muted-foreground)" }}
          />
          <Tooltip
            contentStyle={{
              background: "var(--color-popover)",
              border: "1px solid var(--color-border)",
              borderRadius: "6px",
              fontSize: 12,
              color: "var(--color-popover-foreground)",
            }}
            labelStyle={{ color: "var(--color-foreground)" }}
          />
          <Legend
            wrapperStyle={{ fontSize: 12, paddingTop: "8px" }}
            formatter={(value) => {
              const labels: Record<string, string> = {
                heroWin: "Hero Win%",
                heroTie: "Hero Tie%",
                villainWin: "Villain Win%",
                villainTie: "Villain Tie%",
              };
              return labels[value] || value;
            }}
          />
          <Bar dataKey="heroWin" stackId="hero" fill="#22c55e" fillOpacity={0.9} radius={[0, 0, 0, 0]} />
          <Bar dataKey="heroTie" stackId="hero" fill="#22c55e" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
          <Bar dataKey="villainWin" stackId="villain" fill="#ef4444" fillOpacity={0.9} radius={[0, 0, 0, 0]} />
          <Bar dataKey="villainTie" stackId="villain" fill="#ef4444" fillOpacity={0.4} radius={[4, 4, 0, 0]} />
        </BarChart>
      </ResponsiveContainer>
    </div>
  );
}
