"use client";

import {
  Area,
  AreaChart,
  CartesianGrid,
  Cell,
  Legend,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

interface Point { date: string; screenings: number; flagged: number }
interface Slice { name: string; value: number; fill: string }

export function ScreeningChart({ data, riskBreakdown }: { data: Point[]; riskBreakdown: Slice[] }) {
  return (
    <div className="grid md:grid-cols-3 gap-6">
      <div className="md:col-span-2 h-64">
        <ResponsiveContainer width="100%" height="100%">
          <AreaChart data={data}>
            <defs>
              <linearGradient id="g1" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(199 89% 48%)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(199 89% 48%)" stopOpacity={0} />
              </linearGradient>
              <linearGradient id="g2" x1="0" y1="0" x2="0" y2="1">
                <stop offset="0%" stopColor="hsl(0 84% 60%)" stopOpacity={0.5} />
                <stop offset="100%" stopColor="hsl(0 84% 60%)" stopOpacity={0} />
              </linearGradient>
            </defs>
            <CartesianGrid stroke="hsl(217 33% 18%)" strokeDasharray="3 3" />
            <XAxis dataKey="date" stroke="hsl(215 20% 65%)" fontSize={11} />
            <YAxis stroke="hsl(215 20% 65%)" fontSize={11} />
            <Tooltip
              contentStyle={{
                background: "hsl(222 40% 9%)",
                border: "1px solid hsl(217 33% 18%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Area
              type="monotone"
              dataKey="screenings"
              stroke="hsl(199 89% 48%)"
              strokeWidth={2}
              fill="url(#g1)"
              name="Screenings"
            />
            <Area
              type="monotone"
              dataKey="flagged"
              stroke="hsl(0 84% 60%)"
              strokeWidth={2}
              fill="url(#g2)"
              name="Flagged"
            />
          </AreaChart>
        </ResponsiveContainer>
      </div>
      <div className="h-64">
        <ResponsiveContainer width="100%" height="100%">
          <PieChart>
            <Pie
              data={riskBreakdown}
              dataKey="value"
              nameKey="name"
              cx="50%"
              cy="50%"
              innerRadius={45}
              outerRadius={80}
              paddingAngle={2}
            >
              {riskBreakdown.map((s, i) => (
                <Cell key={i} fill={s.fill} stroke="hsl(222 40% 9%)" strokeWidth={2} />
              ))}
            </Pie>
            <Tooltip
              contentStyle={{
                background: "hsl(222 40% 9%)",
                border: "1px solid hsl(217 33% 18%)",
                borderRadius: 8,
                fontSize: 12,
              }}
            />
            <Legend wrapperStyle={{ fontSize: 11 }} />
          </PieChart>
        </ResponsiveContainer>
      </div>
    </div>
  );
}
