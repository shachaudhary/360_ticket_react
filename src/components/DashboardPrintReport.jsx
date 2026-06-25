import React from "react";
import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  PieChart,
  Pie,
  Cell,
  ResponsiveContainer,
} from "recharts";

const PRIORITY_COLORS = {
  Low: "#3B82F6",
  High: "#F59E0B",
  Urgent: "#EF4444",
};

const STATUS_COLORS = ["#3B82F6", "#FBBF24", "#22C55E", "#F87171"];

function PrintLegend({ items, colors }) {
  return (
    <div className="print-legend">
      {items.map((item, i) => (
        <div key={item.name} className="print-legend-row">
          <span className="print-legend-label">
            <span
              className="print-legend-dot"
              style={{ backgroundColor: colors[item.name] || colors[i] || "#9CA3AF" }}
            />
            {item.name}
          </span>
          <span className="print-legend-value">{item.value}</span>
        </div>
      ))}
    </div>
  );
}

function PrintPieSection({ title, data, colorMap }) {
  const colors = data.map(
    (entry, i) => colorMap[entry.name] || STATUS_COLORS[i % STATUS_COLORS.length]
  );

  return (
    <div className="print-chart-card print-pie-card">
      <h2 className="print-chart-title">{title}</h2>
      {data.length > 0 ? (
        <div className="print-pie-layout">
          <PieChart width={130} height={130}>
            <Pie
              data={data}
              cx={65}
              cy={65}
              innerRadius={28}
              outerRadius={58}
              paddingAngle={2}
              dataKey="value"
              stroke="#fff"
              strokeWidth={2}
            >
              {data.map((entry, i) => (
                <Cell key={entry.name} fill={colors[i]} />
              ))}
            </Pie>
          </PieChart>
          <PrintLegend
            items={data}
            colors={Object.fromEntries(data.map((d, i) => [d.name, colors[i]]))}
          />
        </div>
      ) : (
        <p className="print-empty">No data available</p>
      )}
    </div>
  );
}

export default function DashboardPrintReport({
  dateRange,
  categoryName,
  generatedAt,
  stats,
  chartData,
  statusData,
  priorityData,
}) {
  const lineTickInterval = Math.max(0, Math.floor((chartData.length - 1) / 6));
  const lineHeight = chartData.length > 20 ? 200 : 170;

  return (
    <div className="dashboard-print-report">
      <header className="print-header">
        <div className="print-header-brand">
          <div className="print-header-accent" />
          <div>
            <h1 className="print-title">Ticket Dashboard Report</h1>
            <p className="print-subtitle">Support 360 Overview</p>
          </div>
        </div>
        <div className="print-meta">
          <div className="print-meta-row">
            <span>Period</span>
            <strong>{dateRange}</strong>
          </div>
          <div className="print-meta-row">
            <span>Category</span>
            <strong>{categoryName}</strong>
          </div>
          <div className="print-meta-row">
            <span>Generated</span>
            <strong>{generatedAt}</strong>
          </div>
        </div>
      </header>

      <section className="print-stats">
        {stats.map((s) => (
          <div
            key={s.label}
            className={`print-stat-card print-stat-${s.label.toLowerCase().replace(/\s+/g, "-")}`}
          >
            <div className="print-stat-main">
              <span className="print-stat-label">{s.label}</span>
              <span className="print-stat-value">
                {s.label === "Open Tickets" && typeof s.total === "number" && s.total
                  ? `${s.value} / ${s.total}`
                  : s.value}
              </span>
              {s.label === "Open Tickets" && typeof s.total === "number" && s.total > 0 && (
                <span className="print-stat-hint">{s.total} total tickets</span>
              )}
            </div>
            {s.resolutionTime && (
              <div className="print-stat-extra">
                <span className="print-stat-extra-label">Avg Resolution</span>
                <span className="print-stat-extra-value">{s.resolutionTime}</span>
              </div>
            )}
          </div>
        ))}
      </section>

      <section className="print-chart-card print-line-card">
        <h2 className="print-chart-title">Tickets Created</h2>
        <div className="print-line-wrap">
          <ResponsiveContainer width="100%" height={lineHeight}>
            <LineChart
              data={chartData}
              margin={{ top: 8, right: 16, left: 4, bottom: chartData.length > 14 ? 28 : 8 }}
            >
              <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" vertical={false} />
              <XAxis
                dataKey="name"
                interval={lineTickInterval}
                tick={{ fontSize: 9, fill: "#6b7280" }}
                axisLine={{ stroke: "#d1d5db" }}
                tickLine={false}
                angle={chartData.length > 14 ? -40 : 0}
                textAnchor={chartData.length > 14 ? "end" : "middle"}
                height={chartData.length > 14 ? 36 : 20}
              />
              <YAxis
                tick={{ fontSize: 9, fill: "#6b7280" }}
                axisLine={false}
                tickLine={false}
                width={28}
                allowDecimals={false}
              />
              <Line
                type="monotone"
                dataKey="tickets"
                stroke="#824EF2"
                strokeWidth={2.5}
                dot={{ r: 2.5, fill: "#824EF2", strokeWidth: 0 }}
                activeDot={false}
              />
            </LineChart>
          </ResponsiveContainer>
        </div>
      </section>

      <section className="print-pies-row">
        <PrintPieSection title="Tickets by Status" data={statusData} colorMap={{}} />
        <PrintPieSection title="Tickets by Priority" data={priorityData} colorMap={PRIORITY_COLORS} />
      </section>
    </div>
  );
}
