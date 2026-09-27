import React, { useEffect, useState } from "react";
import {
  ComposedChart,
  Bar,
  Line,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer
} from "recharts";

import "./MonthlyOverviewChart.css";

function MonthlyOverviewChart() {

  const [data, setData] = useState([]);

  useEffect(() => {

    const token = localStorage.getItem("token");

    fetch("http://127.0.0.1:8000/monthly-overview", {
      headers: {
        Authorization: `Bearer ${token}`
      }
    })
      .then((response) => response.json())
      .then((result) => {
        setData(result);
      })
      .catch((error) => {
        console.error("Error fetching monthly overview:", error);
      });

  }, []);

  return (
    <div className="monthly-chart-card">

      {/* <h2>Monthly Overview</h2> */}

      <div className="chart-container">

        <ResponsiveContainer width="100%" height={350}>

          <ComposedChart data={data}>

            <CartesianGrid
              strokeDasharray="3 3"
              vertical={false}
            />

            <XAxis dataKey="month" />

            <YAxis
              tickFormatter={(value) => `${value / 1000}k`}
            />

            <Tooltip
              formatter={(value) =>
                `NPR ${Number(value).toLocaleString()}`
              }
            />

            <Legend />

            <Bar
              dataKey="income"
              name="Income"
              fill="#20c45a"
              barSize={30}
              radius={[5, 5, 0, 0]}
            />

            <Bar
              dataKey="expenses"
              name="Expenses"
              fill="#e82116"
              barSize={30}
              radius={[5, 5, 0, 0]}
            />

            <Line
              type="monotone"
              dataKey="savings"
              name="Savings"
              stroke="#7183f5"
              strokeWidth={3}
              dot={{
                r: 5
              }}
            />

          </ComposedChart>

        </ResponsiveContainer>

      </div>

    </div>
  );
}

export default MonthlyOverviewChart;