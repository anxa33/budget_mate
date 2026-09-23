import React, { useState, useEffect } from "react";
import AddExpense from "./AddExpense";
import AddCsv from "./AddCsv";

import Navbar from "../components/Navbar";
import ExpenseStatCards from "../components/ExpenseStatCards";
import ExpenseTrendChart from "../components/ExpenseTrendChart";
import ExpenseCategoryChart from "../components/ExpenseCategoryChart";
import ExpenseRecentTransactions from "../components/ExpenseRecentTransactions";
import "./ExpensesDashboard.css";

const API_BASE = "http://127.0.0.1:8000";
const RECENT_LIMIT = 10;

function ExpensesDashboard({ onNavigate }) {
  const [showAddExpense, setShowAddExpense] = useState(false);

  const [expenses, setExpenses] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingList, setLoadingList] = useState(true);
  const [error, setError] = useState(null);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  // ==========================================
  // FETCH EXPENSES + SUMMARY FROM BACKEND
  // ==========================================
  const fetchExpenses = async () => {
    setLoadingList(true);
    try {
      const response = await fetch(`${API_BASE}/expenses?limit=${RECENT_LIMIT}`, {
        headers: authHeaders(),
      });
      if (!response.ok) {
        throw new Error(`Server error: ${response.status}`);
      }
      const data = await response.json();
      setExpenses(data);
    } catch (err) {
      console.error("Error fetching expenses:", err);
      setError(err.message);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/expense-summary`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch expense summary");
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    fetchExpenses();
    fetchSummary();
  };

  useEffect(() => {
    refreshAll();
  }, []);

  // ==========================================
  // ADD EXPENSE MODAL HANDLERS
  // ==========================================
  const handleAddExpenseClick = () => setShowAddExpense(true);

  const handleCloseAddExpense = () => {
    setShowAddExpense(false);
    refreshAll();
  };

  const barData = summary?.monthly_trend || [];

  return (
    <div className="expenses-dashboard">
      {/* Header */}
      <div className="headsection">
        <div className="expenses-heading">
          <h1>Expenses</h1>
        </div>
        <div className="expenses-header-right">
          <button className="add-expense-button" onClick={handleAddExpenseClick}>
            Add Expense
          </button>

          <AddCsv apiBase={API_BASE} authHeaders={authHeaders} onImported={refreshAll} />

          <Navbar onNavigate={onNavigate} />
        </div>
      </div>

      {/* Add Expense Popup */}
      {showAddExpense && (
        <div className="expense-modal-overlay">
          <div className="expense-modal">
            <button className="close-expense-modal" onClick={handleCloseAddExpense}>
              ✕
            </button>
            <AddExpense onClose={handleCloseAddExpense} />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="expense-page-content">
        <ExpenseStatCards summary={summary} />

        <div className="charts-row">
          <ExpenseTrendChart data={barData} />
          <ExpenseCategoryChart />
        </div>

        <ExpenseRecentTransactions
          expenses={expenses}
          loading={loadingList}
          error={error}
          recentLimit={RECENT_LIMIT}
          onRefresh={refreshAll}
        />

      </div>
    </div>
  );
}

export default ExpensesDashboard;