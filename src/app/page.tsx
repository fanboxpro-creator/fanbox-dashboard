"use client";

import { useState, useEffect } from "react";
import { createClient } from "@supabase/supabase-js";
import KpiCard from "@/components/KpiCard";
import MetricsChart from "@/components/MetricsChart";
import MetricsTable from "@/components/MetricsTable";

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL!,
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!
);

type Manager = { id: number; name: string };
type WeekOption = { week_start: string; week_end: string };
type MetricRow = {
  id: number;
  manager_id: number;
  week_start: string;
  week_end: string;
  metric: string;
  plan: number | null;
  fact: number | null;
  deviation_pct: number | null;
};

const METRICS = [
  { key: "Бюджет", label: "Бюджет", format: "currency" },
  { key: "Просмотры", label: "Просмотры", format: "number" },
  { key: "Клики", label: "Клики", format: "number" },
  { key: "Запланировано", label: "Запланировано", format: "number" },
  { key: "Вышло", label: "Вышло", format: "number" },
] as const;

export default function Home() {
  const [managers, setManagers] = useState<Manager[]>([]);
  const [selectedManager, setSelectedManager] = useState<number | null>(null);
  const [weeks, setWeeks] = useState<WeekOption[]>([]);
  const [selectedWeek, setSelectedWeek] = useState<string | null>(null);
  const [data, setData] = useState<MetricRow[]>([]);
  const [allData, setAllData] = useState<MetricRow[]>([]);
  const [loading, setLoading] = useState(true);

  // Load managers
  useEffect(() => {
    supabase
      .from("managers")
      .select("id, name")
      .then(({ data }) => {
        if (data) setManagers(data);
      });
  }, []);

  // Load all weeks
  useEffect(() => {
    supabase
      .from("weekly_metrics")
      .select("week_start, week_end")
      .order("week_start", { ascending: false })
      .then(({ data }) => {
        if (data) {
          const unique = Array.from(
            new Map(data.map((r) => [r.week_start, r])).values()
          ) as WeekOption[];
          setWeeks(unique);
          if (unique.length > 0 && !selectedWeek) {
            setSelectedWeek(unique[0].week_start);
          }
        }
      });
  }, []);

  // Load all data for chart
  useEffect(() => {
    if (!selectedManager) return;
    supabase
      .from("weekly_metrics")
      .select("*")
      .eq("manager_id", selectedManager)
      .order("week_start", { ascending: true })
      .then(({ data }) => {
        if (data) setAllData(data as MetricRow[]);
      });
  }, [selectedManager]);

  // Load filtered data
  useEffect(() => {
    if (!selectedManager || !selectedWeek) {
      setLoading(false);
      return;
    }
    setLoading(true);
    supabase
      .from("weekly_metrics")
      .select("*")
      .eq("manager_id", selectedManager)
      .eq("week_start", selectedWeek)
      .then(({ data }) => {
        if (data) setData(data as MetricRow[]);
        setLoading(false);
      });
  }, [selectedManager, selectedWeek]);

  const getMetric = (key: string) =>
    data.find((r) => r.metric === key);

  const formatValue = (val: number | null, fmt: string) => {
    if (val == null) return "—";
    if (fmt === "currency")
      return new Intl.NumberFormat("ru-RU", { style: "currency", currency: "RUB", maximumFractionDigits: 0 }).format(val);
    return new Intl.NumberFormat("ru-RU").format(val);
  };

  return (
    <main className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4">
        <div className="max-w-7xl mx-auto flex items-center justify-between">
          <h1 className="text-xl font-bold text-gray-900">
            Fanbox — Внешняя реклама
          </h1>
          <span className="text-sm text-gray-500">Дашборд по неделям</span>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-6 py-6 space-y-6">
        {/* Filters */}
        <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-wrap gap-4 items-end">
          {/* Manager tabs */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Менеджер
            </label>
            <div className="flex gap-2">
              {managers.map((m) => (
                <button
                  key={m.id}
                  onClick={() => setSelectedManager(m.id)}
                  className={`px-4 py-1.5 rounded-lg text-sm font-medium transition-colors ${
                    selectedManager === m.id
                      ? "bg-blue-600 text-white"
                      : "bg-gray-100 text-gray-700 hover:bg-gray-200"
                  }`}
                >
                  {m.name}
                </button>
              ))}
            </div>
          </div>

          {/* Week selector */}
          <div>
            <label className="block text-xs font-medium text-gray-500 mb-1.5">
              Неделя
            </label>
            <select
              value={selectedWeek || ""}
              onChange={(e) => setSelectedWeek(e.target.value)}
              className="border border-gray-200 rounded-lg px-3 py-1.5 text-sm text-gray-700 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {weeks.map((w) => (
                <option key={w.week_start} value={w.week_start}>
                  {new Date(w.week_start).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                  {" — "}
                  {new Date(w.week_end).toLocaleDateString("ru-RU", { day: "numeric", month: "short" })}
                </option>
              ))}
            </select>
          </div>
        </div>

        {!selectedManager && (
          <div className="text-center py-16 text-gray-400 text-sm">
            Выберите менеджера для просмотра данных
          </div>
        )}

        {selectedManager && (
          <>
            {/* KPI Cards */}
            {loading ? (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {METRICS.map((m) => (
                  <div key={m.key} className="bg-white rounded-xl border border-gray-200 p-4 animate-pulse h-24" />
                ))}
              </div>
            ) : (
              <div className="grid grid-cols-2 md:grid-cols-5 gap-4">
                {METRICS.map((m) => {
                  const row = getMetric(m.key);
                  return (
                    <KpiCard
                      key={m.key}
                      label={m.label}
                      plan={formatValue(row?.plan ?? null, m.format)}
                      fact={formatValue(row?.fact ?? null, m.format)}
                      deviation={row?.deviation_pct ?? null}
                    />
                  );
                })}
              </div>
            )}

            {/* Chart */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Динамика по неделям
              </h2>
              <MetricsChart data={allData} />
            </div>

            {/* Table */}
            <div className="bg-white rounded-xl border border-gray-200 p-5">
              <h2 className="text-sm font-semibold text-gray-700 mb-4">
                Детализация по неделям
              </h2>
              <MetricsTable
                managerId={selectedManager}
                supabase={supabase}
              />
            </div>
          </>
        )}
      </div>
    </main>
  );
}
