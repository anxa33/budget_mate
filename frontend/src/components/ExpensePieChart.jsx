import { useEffect, useState } from "react";
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip } from "recharts";

const COLORS = {
  'Food': "#1215dd",
  Transportation: "#27a7df",
  Shopping: "#cf9736",
  Education: "#12ca87",
  Entertainment: "#b94349",
  Other: "#094f2c",
  'Health':"black",
};

export default function ExpensePieChart() {
  const [data, setData] = useState([]);

  useEffect(() => {
    fetchExpenseChart();
  }, []);

  const fetchExpenseChart = async () => {
    try {
      const response = await fetch("http://127.0.0.1:8000/expense-chart", {
      headers: {
      Authorization: `Bearer ${localStorage.getItem("token")}`,
  },
});
      const result = await response.json();   
      setData(result);
    } catch (err) {
      console.error(err);
    }
  };

  const total = data.reduce((sum, item) => sum + item.value, 0);

  return (
    <div style={{ display: "flex", alignItems: "center", gap: 24 }}>
      <ResponsiveContainer width={160} height={160}>
        <PieChart>
          <Pie
            data={data}
            dataKey="value"
            cx="50%"
            cy="50%"
            innerRadius={48}
            outerRadius={72}
            paddingAngle={2}
          >
            {data.map((entry, index) => (
              <Cell
                key={index}
                fill={COLORS[entry.name] || "#999"}
              />
            ))}
          </Pie>

          <Tooltip />
        </PieChart>
      </ResponsiveContainer>

      <div style={{ display: "flex", flexDirection: "column", gap: 7 }}>
        {data.map((item) => (
          <div
            key={item.name}
            style={{
              display: "flex",
              alignItems: "center",
              gap: 8,
              fontSize: 13,
            }}
          >
            <span
              style={{
                width: 10,
                height: 10,
                borderRadius: "50%",
                background: COLORS[item.name] || "#999",
              }}
            />

            <span style={{ minWidth: 100 }}>{item.name}</span>

            <span style={{ fontWeight: 600 }}>
              {total === 0
                ? "0%"
                : `${((item.value / total) * 100).toFixed(1)}%`}
            </span>
          </div>
        ))}
      </div>
    </div>
  );
}