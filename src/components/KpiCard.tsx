interface KpiCardProps {
  label: string;
  plan: string;
  fact: string;
  deviation: number | null;
}

export default function KpiCard({ label, plan, fact, deviation }: KpiCardProps) {
  const isPositive = deviation !== null && deviation > 0;
  const isNegative = deviation !== null && deviation < 0;

  return (
    <div className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col gap-2">
      <span className="text-xs font-medium text-gray-500 uppercase tracking-wide">
        {label}
      </span>

      <div className="flex flex-col gap-0.5">
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-400">Факт</span>
          <span className="text-base font-bold text-gray-900">{fact}</span>
        </div>
        <div className="flex items-baseline justify-between">
          <span className="text-xs text-gray-400">План</span>
          <span className="text-sm text-gray-500">{plan}</span>
        </div>
      </div>

      {deviation !== null && (
        <div
          className={`text-xs font-semibold px-2 py-0.5 rounded-full self-start ${
            isPositive
              ? "bg-green-100 text-green-700"
              : isNegative
              ? "bg-red-100 text-red-600"
              : "bg-gray-100 text-gray-600"
          }`}
        >
          {deviation > 0 ? "+" : ""}
          {deviation.toFixed(1)}%
        </div>
      )}
    </div>
  );
}
