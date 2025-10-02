import { DailyQueryCount, Summary, TopQuery } from "../lib/types";

const API_BASE = process.env.NEXT_PUBLIC_API_BASE || "http://localhost:3001";

async function fetchJSON<T>(path: string): Promise<T> {
  const response = await fetch(`${API_BASE}${path}`);
  if (!response.ok) throw new Error(`HTTP ${response.status}`);
  return response.json();
}

function BarChart({ data }: { data: DailyQueryCount[] }) {
  const max = Math.max(
    1,
    ...data.map((dailyQueryCount) => dailyQueryCount.hits),
  );
  const width = 600;
  const height = 200;
  const pad = 28;
  const barWidth = (width - pad * 2) / data.length;

  return (
    <svg width={width} height={height} className="rounded-lg border">
      {data.map((dailyQueryCount, i) => {
        const barHeight = (dailyQueryCount.hits / max) * (height - pad * 2);
        return (
          <g
            key={dailyQueryCount.day}
            transform={`translate(${pad + i * barWidth},0)`}
          >
            <rect
              x={0}
              y={height - pad - barHeight}
              width={barWidth - 8}
              height={barHeight}
              fill="#111827"
              opacity={0.9}
            />
            <text
              x={(barWidth - 8) / 2}
              y={height - 8}
              textAnchor="middle"
              fontSize="10"
              fill="#6b7280"
            >
              {dailyQueryCount.day.slice(5)}
            </text>
          </g>
        );
      })}
      <text x={pad} y={14} fontSize="12" fill="#6b7280">
        Queries (last {data.length} days)
      </text>
    </svg>
  );
}

export default async function Dashboard() {
  const [summary, top, dailyQueryCount] = await Promise.all([
    fetchJSON<Summary>("/analytics/summary"),
    fetchJSON<{ items: TopQuery[] }>("/analytics/top-queries?limit=10"),
    fetchJSON<{ items: DailyQueryCount[] }>("/analytics/daily?days=7"),
  ]);

  console.log("top--------------------------", top);

  return (
    <div className="space-y-6">
      <h1 className="text-2xl font-semibold">Analytics Dashboard</h1>

      {/* KPI cards */}
      <section className="grid grid-cols-1 gap-3 sm:grid-cols-2 lg:grid-cols-4">
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Total Queries</div>
          <div className="text-2xl font-bold">{summary.total_queries}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Today</div>
          <div className="text-2xl font-bold">{summary.today_queries}</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Avg Latency</div>
          <div className="text-2xl font-bold">{summary.avg_latency_ms} ms</div>
        </div>
        <div className="rounded-lg border p-4">
          <div className="text-sm text-gray-500">Avg Results</div>
          <div className="text-2xl font-bold">{summary.avg_results}</div>
        </div>
      </section>

      {/* Daily chart */}
      <section>
        <BarChart data={dailyQueryCount.items} />
      </section>

      {/* Top queries table */}
      <section>
        <h2 className="mb-2 text-lg font-semibold">Top Queries</h2>
        <div className="overflow-x-auto rounded-lg border">
          <table className="w-full border-collapse text-sm">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Query
                </th>
                <th className="px-3 py-2 text-left font-medium text-gray-600">
                  Hits
                </th>
              </tr>
            </thead>
            <tbody>
              {top.items.map((topQuery) => (
                <tr key={topQuery.query} className="border-t">
                  <td className="px-3 py-2">{topQuery.query}</td>
                  <td className="px-3 py-2">{topQuery.hits}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </section>
    </div>
  );
}
