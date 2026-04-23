"use client";

import { useState } from "react";
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

type MetricRow = {
  week_start: string;
  metric: string;
  plan: number | null;
  fact: number | null;
};

interface MetricsChartProps {
  data: MetricRow[];
}

const METRICS = ["Бюджет", "Просмотры", "Клики", "Запланировано", "Вышло"];

export default function MetricsChart({ data }: MetricsChartProps) {
  const [selectedMetric, setSelectedMetric] = useState("Бюджет");

  // Build chart data grouped by week
  const chartData = Array.from(
    data
      .filter((r) => r.metric === selectedMetric)
      .reduce((acc, r) => {
        const key = r.week_start;
        if (!acc.has(key)) {
          acc.set(key, {
            week: new Date(r.week_start).toLocaleDateString("ru-RU", {
              day: "numeric",
              month: "short",
            }),
            plan: 0,
            fact: 0,
          });
        }
        const entry = acc.get(key)!;
        entry.plan = r.plan ?? 0;
        entry.fact = r.fact ?? 0;
        return acc;
      }, new Map<string, { week: string; plan: number; fact: number }>())
      .values()
  );

  const formatYAxis = (value: number) => {
    if (value >= 1_000_000) return `${(value / 1_000_000).toFixed(1)}М`;
    if (value >= 1_000) return `${(value / 1_000).toFixed(0)}К`;
    return String(value);
  };

  return (
    <div>
      {/* Metric selector */}
      <div className="flex gap-2 mb-4 flex-wrap">
        {METRICS.map((m) => (
          <button
            key={m}
            onClick={() => setSelectedMetric(m)}
            className={`px-3 py-1 rounded-lg text-xs font-medium transition-colors ${
              selectedMetric === m
                ? "bg-blue-600 text-white"
                : "bg-gray-100 text-gray-600 hover:bg-gray-200"
            }`}
          >
            {m}
          </button>
        ))}
      </div>

      {chartData.length === 0 ? (
        <div className="text-center py-12 text-gray-400 text-sm">
          Нет данных для отображения
        </div>
      ) : (
        <ResponsiveContainer width="100%" height={260}>
          <BarChart
            data={chartData}
            margin={{ top: 4, right: 16, left: 0, bottom: 4 }}
            barCategoryGap="30%"
          >
            <CartesianGrid strokeDasharray="3 3" stroke="#f0f0f0" />
            <XAxis
              dataKey="week"
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
            />
            <YAxis
              tickFormatter={formatYAxis}
              tick={{ fontSize: 11, fill: "#6b7280" }}
              axisLine={false}
              tickLine={false}
              width={48}
            />
            <Tooltip
              formatter={(value: number) =>
                new Intl.NumberFormat("ru-RU").format(value)
              }
              contentStyle={{
                borderRadius: 8,
                border: "1px solid #e5e7eb",
                fontSize: 12,
              }}
            />
            <Legend
              wrapperStyle={{ fontSize: 12 }}
              formatter={(value) => (value === "plan" ? "План" : "Факт")}
            />
            <Bar dataKey="plan" fill="#93c5fd" radius={[4, 4, 0, 0]} name="plan" />
            <Bar dataKey="fact" fill="#2563eb" radius={[4, 4, 0, 0]} name="fact" />
          </BarChart>
        </ResponsiveContainer>
      )}
    </div>
  );
}
