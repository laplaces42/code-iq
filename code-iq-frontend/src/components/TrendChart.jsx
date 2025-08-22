import {
  LineChart,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
  Legend,
} from "recharts";
import styles from "./TrendChart.module.css";

function TrendChart({ data, title, height = 300, showLegend = true }) {
  const formatDate = (dateStr) => {
    const date = new Date(dateStr);
    return date.toLocaleDateString("en-US", { month: "short", day: "numeric" });
  };

  const CustomTooltip = ({ active, payload, label }) => {
    if (active && payload && payload.length) {
      return (
        <div className={styles.tooltip}>
          <p className={styles.tooltipDate}>{formatDate(label)}</p>
          {payload.map((entry, index) => (
            <p
              key={index}
              className={styles.tooltipValue}
              style={{ color: entry.color }}
            >
              {`${entry.name}: ${entry.value.toFixed(1)}`}
            </p>
          ))}
        </div>
      );
    }
    return null;
  };

  return (
    <div className={styles.chartContainer}>
      <h3 className={styles.chartTitle}>{title}</h3>
      <ResponsiveContainer width="100%" height={height}>
        <LineChart
          data={data}
          margin={{ top: 5, right: 30, left: 20, bottom: 5 }}
        >
          <CartesianGrid strokeDasharray="3 3" stroke="#374151" />
          <XAxis
            dataKey="date"
            tickFormatter={formatDate}
            stroke="#9ca3af"
            fontSize={12}
          />
          <YAxis domain={[0, 10]} stroke="#9ca3af" fontSize={12} />
          <Tooltip content={<CustomTooltip />} />
          {showLegend && <Legend />}

          <Line
            type="monotone"
            dataKey="overall"
            stroke="#3b82f6"
            strokeWidth={2}
            dot={{ fill: "#3b82f6", strokeWidth: 2, r: 3 }}
            name="Overall"
          />
          <Line
            type="monotone"
            dataKey="health"
            stroke="#10b981"
            strokeWidth={2}
            dot={{ fill: "#10b981", strokeWidth: 2, r: 3 }}
            name="Health"
          />
          <Line
            type="monotone"
            dataKey="security"
            stroke="#f59e0b"
            strokeWidth={2}
            dot={{ fill: "#f59e0b", strokeWidth: 2, r: 3 }}
            name="Security"
          />
          <Line
            type="monotone"
            dataKey="knowledge"
            stroke="#8b5cf6"
            strokeWidth={2}
            dot={{ fill: "#8b5cf6", strokeWidth: 2, r: 3 }}
            name="Knowledge"
          />
        </LineChart>
      </ResponsiveContainer>
    </div>
  );
}

export default TrendChart;
