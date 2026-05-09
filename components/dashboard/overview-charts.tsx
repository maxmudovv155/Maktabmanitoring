"use client";

import {
  Area,
  AreaChart,
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Legend,
  Line,
  LineChart,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from "recharts";

import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { DashboardGrowthPoint } from "@/lib/queries/dashboard-metrics";

type Props = {
  male: number;
  female: number;
  growth: DashboardGrowthPoint[];
};

const palette = ["hsl(var(--primary))", "hsl(var(--accent))", "hsl(var(--success))", "hsl(var(--danger))"];

export function OverviewCharts({ male, female, growth }: Props) {
  const genderData = [
    { name: "Erkak", value: male },
    { name: "Ayol", value: female },
  ];

  const barData = [
    { name: "Erkak", total: male },
    { name: "Ayol", total: female },
  ];

  return (
    <div className="grid gap-6 xl:grid-cols-3">
      <Card className="glass-card border border-border/70 shadow-glass xl:col-span-2">
        <CardHeader>
          <CardTitle className="text-base">So‘nggi 14 kun — yangi o‘quvchilar</CardTitle>
        </CardHeader>
        <CardContent className="h-[320px]">
          <ResponsiveContainer width="100%" height="100%">
            <AreaChart data={growth}>
              <defs>
                <linearGradient id="growthFill" x1="0" y1="0" x2="0" y2="1">
                  <stop offset="5%" stopColor="hsl(var(--primary))" stopOpacity={0.9} />
                  <stop offset="95%" stopColor="hsl(var(--accent))" stopOpacity={0} />
                </linearGradient>
              </defs>
              <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" opacity={0.45} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} stroke="hsl(var(--muted-foreground))" />
              <Tooltip
                contentStyle={{
                  borderRadius: 16,
                  border: "1px solid hsl(var(--border))",
                  background: "hsl(var(--card))",
                }}
              />
              <Area type="monotone" dataKey="total" stroke="hsl(var(--primary))" fill="url(#growthFill)" strokeWidth={3} />
            </AreaChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      <div className="space-y-6">
        <Card className="glass-card border border-border/70 shadow-glass">
          <CardHeader>
            <CardTitle className="text-base">Gender pie</CardTitle>
          </CardHeader>
          <CardContent className="h-[240px]">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Legend verticalAlign="bottom" iconType="circle" />
                <Tooltip />
                <Pie data={genderData} dataKey="value" nameKey="name" outerRadius={90} paddingAngle={4}>
                  {genderData.map((entry, index) => (
                    <Cell key={`cell-${entry.name}`} fill={palette[index % palette.length]} />
                  ))}
                </Pie>
              </PieChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>

        <Card className="glass-card border border-border/70 shadow-glass">
          <CardHeader>
            <CardTitle className="text-base">Gender bar</CardTitle>
          </CardHeader>
          <CardContent className="h-[220px]">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={barData}>
                <CartesianGrid strokeDasharray="4 6" opacity={0.45} stroke="hsl(var(--border))" />
                <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                <YAxis allowDecimals={false} tick={{ fontSize: 12 }} />
                <Tooltip />
                <Bar dataKey="total" radius={[14, 14, 0, 0]}>
                  {barData.map((entry, index) => (
                    <Cell key={entry.name} fill={palette[index % palette.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>

      <Card className="glass-card border border-border/70 shadow-glass xl:col-span-3">
        <CardHeader>
          <CardTitle className="text-base">Monitoring line</CardTitle>
        </CardHeader>
        <CardContent className="h-[280px]">
          <ResponsiveContainer width="100%" height="100%">
            <LineChart data={growth}>
              <CartesianGrid strokeDasharray="4 6" stroke="hsl(var(--border))" opacity={0.45} />
              <XAxis dataKey="label" tick={{ fontSize: 11 }} />
              <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
              <Tooltip />
              <Line type="monotone" dataKey="total" stroke="hsl(var(--accent))" strokeWidth={3} dot={false} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
