"use client";

import { cn } from "@/lib/utils";
import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Cell,
} from "recharts";

interface PlayerICM {
  id: string;
  name: string;
  chips: number;
  equity: number;
  prizeEquity: number;
  cashProbability: number;
}

interface ICMResultsProps {
  results?: PlayerICM[];
  prizes?: { place: number; percentage: number }[];
  className?: string;
}

const MOCK_ICM_RESULTS: PlayerICM[] = [
  { id: "1", name: "Player 1", chips: 2000, equity: 28.5, prizeEquity: 285, cashProbability: 85 },
  { id: "2", name: "Player 2", chips: 1500, equity: 22.3, prizeEquity: 223, cashProbability: 72 },
  { id: "3", name: "Player 3", chips: 3000, equity: 35.2, prizeEquity: 352, cashProbability: 94 },
  { id: "4", name: "Player 4", chips: 1200, equity: 18.1, prizeEquity: 181, cashProbability: 58 },
  { id: "5", name: "Player 5", chips: 1500, equity: 22.3, prizeEquity: 223, cashProbability: 71 },
  { id: "6", name: "Player 6", chips: 800, equity: 8.6, prizeEquity: 86, cashProbability: 22 },
];

export function ICMResults({
  results = MOCK_ICM_RESULTS,
  prizes = [
    { place: 1, percentage: 50 },
    { place: 2, percentage: 30 },
    { place: 3, percentage: 20 },
  ],
  className,
}: ICMResultsProps) {
  const sortedByEquity = [...results].sort((a, b) => b.equity - a.equity);

  const chartData = sortedByEquity.map((player, index) => ({
    name: player.name.length > 8 ? player.name.substring(0, 8) + "..." : player.name,
    fullName: player.name,
    equity: player.equity,
    prizeEquity: player.prizeEquity,
    chips: player.chips,
    cashProb: player.cashProbability,
  }));

  return (
    <div className={cn("border border-gray-800 rounded-lg p-4 bg-gray-900/50", className)}>
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-semibold text-poker-gold">ICM Analysis</h3>
        <div className="text-sm text-muted-foreground">
          Independent Chip Model
        </div>
      </div>

      {/* Equity Chart */}
      <div className="h-64 mb-6">
        <ResponsiveContainer width="100%" height="100%">
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 4, bottom: 4, left: 0 }}
            barCategoryGap="20%"
          >
            <CartesianGrid strokeDasharray="3 3" className="stroke-border/50" />
            <XAxis
              dataKey="name"
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
              formatter={(value: number, name: string) => {
                if (name === "equity") return [`${value.toFixed(1)}%`, "ICM Equity"];
                if (name === "prizeEquity") return [`$${value}`, "Prize Equity"];
                if (name === "cashProb") return [`${value.toFixed(0)}%`, "Cash Probability"];
                return [value, name];
              }}
              labelFormatter={(label, payload) => {
                if (payload && payload[0]) {
                  return payload[0].payload.fullName;
                }
                return label;
              }}
            />
            <Bar dataKey="equity" radius={[4, 4, 0, 0]}>
              {chartData.map((entry, index) => (
                <Cell
                  key={`cell-${index}`}
                  fill={index === 0 ? "#d4af37" : index === chartData.length - 1 ? "#ef4444" : "#3b82f6"}
                  fillOpacity={0.8}
                />
              ))}
            </Bar>
          </BarChart>
        </ResponsiveContainer>
      </div>

      {/* Results Table */}
      <div className="overflow-hidden rounded-lg border border-gray-800">
        <table className="w-full text-sm">
          <thead className="bg-gray-800/50">
            <tr>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Rank</th>
              <th className="px-3 py-2 text-left font-medium text-muted-foreground">Player</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Chips</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">ICM %</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Prize $</th>
              <th className="px-3 py-2 text-right font-medium text-muted-foreground">Cash%</th>
            </tr>
          </thead>
          <tbody className="divide-y divide-gray-800">
            {sortedByEquity.map((player, index) => (
              <tr key={player.id} className="hover:bg-gray-800/30 transition-colors">
                <td className="px-3 py-2">
                  <span
                    className={cn(
                      "w-6 h-6 rounded-full flex items-center justify-center text-xs font-semibold",
                      index === 0
                        ? "bg-poker-gold/20 text-poker-gold"
                        : index === sortedByEquity.length - 1
                        ? "bg-red-500/20 text-red-400"
                        : "bg-gray-700 text-gray-300"
                    )}
                  >
                    {index + 1}
                  </span>
                </td>
                <td className="px-3 py-2 font-medium">
                  {player.name}
                  {index === 0 && (
                    <span className="ml-2 text-xs text-poker-gold">★</span>
                  )}
                </td>
                <td className="px-3 py-2 text-right font-mono text-muted-foreground">
                  {player.chips.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <span className={cn(
                    "font-mono font-semibold",
                    index === 0 ? "text-poker-gold" : index === sortedByEquity.length - 1 ? "text-red-400" : "text-blue-400"
                  )}>
                    {player.equity.toFixed(1)}%
                  </span>
                </td>
                <td className="px-3 py-2 text-right font-mono text-green-400">
                  ${player.prizeEquity.toLocaleString()}
                </td>
                <td className="px-3 py-2 text-right">
                  <div className="flex items-center justify-end gap-2">
                    <div className="w-16 h-1.5 bg-gray-800 rounded-full overflow-hidden">
                      <div
                        className={cn(
                          "h-full",
                          player.cashProbability >= 80
                            ? "bg-green-500"
                            : player.cashProbability >= 50
                            ? "bg-yellow-500"
                            : "bg-red-500"
                        )}
                        style={{ width: `${player.cashProbability}%` }}
                      />
                    </div>
                    <span className="font-mono text-muted-foreground w-10 text-right">
                      {player.cashProbability}%
                    </span>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Summary Stats */}
      <div className="mt-4 grid grid-cols-3 gap-4">
        <div className="text-center p-3 rounded bg-gray-800/30">
          <div className="text-xs text-muted-foreground mb-1">Total Prize Pool</div>
          <div className="text-xl font-bold text-poker-gold">
            ${results.reduce((sum, p) => sum + p.prizeEquity, 0).toLocaleString()}
          </div>
        </div>
        <div className="text-center p-3 rounded bg-gray-800/30">
          <div className="text-xs text-muted-foreground mb-1">Avg Stack Value</div>
          <div className="text-xl font-bold text-blue-400">
            ${(results.reduce((sum, p) => sum + p.prizeEquity, 0) / results.length).toLocaleString(undefined, { maximumFractionDigits: 0 })}
          </div>
        </div>
        <div className="text-center p-3 rounded bg-gray-800/30">
          <div className="text-xs text-muted-foreground mb-1">Chip Leader Advantage</div>
          <div className="text-xl font-bold text-green-400">
            +{(results[0]?.equity - (100 / results.length)).toFixed(1)}%
          </div>
        </div>
      </div>
    </div>
  );
}

export default ICMResults;
