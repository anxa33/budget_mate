import React from "react";
import ExpensePieChart from "./ExpensePieChart";
export default function ExpenseCategoryChart() {
  return (
    <div className="expense-card">
      <div className="expense-card-title-row">
        <span className="expense-card-title">Expenses by Category</span>
      </div>
      <ExpensePieChart />
    </div>
  );
}
