"use client";

import { useEffect, useState } from "react";
import { SupabaseClient } from "@supabase/supabase-js";

type MetricRow = {
  week_start: string;
  week_end: string;
  metric: string;
  plan: number | null;
  fact: number | null;
  deviation_pct: number | null;
};

interface MetricsTableProps {
  managerId: number;
  supabase: SupabaseClient;
}

const METRICS_ORDER = ["Бюджет", "Просмотры", "Клики", "Запланировано", "Вышло"];

function fmt(val: number | null, metric: string): string {
  if (val == null) return "—";
  if (metric === "Бюджет") {
    return new Intl.NumberFormat("ru-RU", {
      style: "currency",
      currency: "RUB",
      maximumFractionDigits: 0,
    }).format(val);
  }
  return new Intl.NumberFormat("ru-RU").format(val);
}

function DeviationBadge({ value }: { value: number | null }) {
  if (value == null) return <span className="text-gray-400">—</span>;
  const isPos = value > 0;
  const isNeg = value < 0;
  return (
    <span
      className={`inline-block px-1.5 py-0.5 rounded text-xs font-semibold ${
        isPos
          ? "bg-green-100 text-green-700"
          : isNeg
          ? "bg-red-100 text-red-600"
          : "bg-gray-100 text-gray-600"
      }`}
    >
      {value > 0 ? "+" : ""}
      {value.toFixed(1)}%
    </span>
  );
}

export default function MetricsTable({ managerId, supabase }: MetricsTableProps) {
  const [rows, setRows] = useState<MetricRow[]>([]);
  const [weeks, setWeeks] = useState<string[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setLoading(true);
    supabase
      .from("weekly_metrics")
      .select("week_start, week_end, metric, plan, fact, deviation_pct")
      .eq("manager_id", managerId)
      .order("week_start", { ascending: true })
      .then(({ data }) => {
        if (data) {
          setRows(data as MetricRow[]);
          const uniqueWeeks = Array.from(new Set(data.map((r) => r.week_start)));
          setWeeks(uniqueWeeks);
        }
        setLoading(false);
      });
  }, [managerId]);

  if (loading) {
    return (
      <div className="animate-pulse space-y-2">
        {[...Array(5)].map((_, i) => (
          <div key={i} className="h-8 bg-gray-100 rounded" />
        ))}
      </div>
    );
  }

  const getCell = (metric: string, week: string) =>
    rows.find((r) => r.metric === metric && r.week_start === week);

  return (
    <div className="overflow-x-auto">
      <table className="w-full text-sm">
        <thead>
          <tr className="border-b border-gray-200">
            <th className="text-left py-2 px-3 text-xs font-medium text-gray-500 w-36">
              Метрика
            </th>
            {weeks.map((w) => (
              <th
                key={w}
                className="text-center py-2 px-2 text-xs font-medium text-gray-500"
                colSpan={3}
              >
                {new Date(w).toLocaleDateString("ru-RU", {
                  day: "numeric",
                  month: "short",
                })}
              </th>
            ))}
          </tr>
          <tr className="border-b border-gray-100 bg-gray-50">
            <th className="py-1.5 px-3" />
            {weeks.map((w) => (
              <>
                <th key={w + "-p"} className="py-1.5 px-2 text-center text-xs text-gray-400 font-normal">
                  План
                </th>
                <th key={w + "-f"} className="py-1.5 px-2 text-center text-xs text-gray-400 font-normal">
                  Факт
                </th>
                <th key={w + "-d"} className="py-1.5 px-2 text-center text-xs text-gray-400 font-normal">
                  %
                </th>
              </>
            ))}
          </tr>
        </thead>
        <tbody>
          {METRICS_ORDER.map((metric, idx) => (
            <tr
              key={metric}
              className={`border-b border-gray-100 ${
                idx % 2 === 0 ? "bg-white" : "bg-gray-50/50"
              } hover:bg-blue-50/30 transition-colors`}
            >
              <td className="py-2 px-3 font-medium text-gray-700">{metric}</td>
              {weeks.map((w) => {
                const cell = getCell(metric, w);
                return (
                  <>
                    <td key={w + "-p"} className="py-2 px-2 text-center text-gray-500 text-xs">
                      {fmt(cell?.plan ?? null, metric)}
                    </td>
                    <td key={w + "-f"} className="py-2 px-2 text-center text-gray-900 font-medium text-xs">
                      {fmt(cell?.fact ?? null, metric)}
                    </td>
                    <td key={w + "-d"} className="py-2 px-2 text-center">
                      <DeviationBadge value={cell?.deviation_pct ?? null} />
                    </td>
                  </>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
