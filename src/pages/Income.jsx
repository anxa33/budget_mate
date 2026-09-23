import { useEffect, useMemo, useState } from "react";
import Navbar from "../components/Navbar";
import AddIncome from "./AddIncome";
import "./Income.css";

import IncomeStatCards from "../components/IncomeStatCards";
import IncomeTrendChart from "../components/IncomeTrendChart";
import IncomeBySourceChart, { colorForSource } from "../components/IncomeBySourceChart";
import IncomeRecentTransactions from "../components/IncomeRecentTransactions";

const API_BASE = "http://127.0.0.1:8000";
const RECENT_LIMIT = 10;

export default function Income({ onNavigate }) {
  const [transactions, setTransactions] = useState([]);
  const [summary, setSummary] = useState(null);
  const [loadingList, setLoadingList] = useState(true);

  // Add Income popup
  const [showAddIncome, setShowAddIncome] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const fetchIncome = async () => {
    setLoadingList(true);
    try {
      const response = await fetch(`${API_BASE}/income?limit=${RECENT_LIMIT}`, {
        headers: authHeaders(),
      });
      const data = await response.json();

      const formatted = data.map((item) => ({
        id: item.id,
        rawDate: item.income_date,
        date: new Date(item.income_date).toLocaleDateString("en-US", {
          month: "short",
          day: "numeric",
          year: "numeric",
        }),
        source: item.source,
        note: item.note,
        amount: item.amount,
        method: item.payment_method,
      }));

      setTransactions(formatted);
    } catch (err) {
      console.error(err);
    } finally {
      setLoadingList(false);
    }
  };

  const fetchSummary = async () => {
    try {
      const response = await fetch(`${API_BASE}/income-summary`, {
        headers: authHeaders(),
      });
      if (!response.ok) throw new Error("Failed to fetch income summary");
      const data = await response.json();
      setSummary(data);
    } catch (err) {
      console.error(err);
    }
  };

  const refreshAll = () => {
    fetchIncome();
    fetchSummary();
  };

  useEffect(() => {
    refreshAll();
  }, []);
  // Add Income popup handlers

  const handleAddIncomeClick = () => setShowAddIncome(true);

  const handleCloseAddIncome = () => {
    setShowAddIncome(false);
    refreshAll();
  };
  // Derived chart data from /income-summary
  const donutSegments = useMemo(() => {
    if (!summary || !summary.by_source) return [];
    let offset = 0;
    return summary.by_source.map((s) => {
      const seg = {
        label: s.source,
        pct: s.percentage,
        color: colorForSource(s.source),
        offset,
      };
      offset += s.percentage;
      return seg;
    });
  }, [summary]);

  const barData = summary?.monthly_trend || [];

  return (
    <div className="income-page">
      {/* Top Bar */}
      <div className="income-topbar">
        <div className="income-heading">
          <h1>Income</h1>
        </div>
        <div className="income-topbar-right">
          <button type="button" className="add-income-button" onClick={handleAddIncomeClick}>
            Add Income
          </button>
          <Navbar onNavigate={onNavigate} />
        </div>
      </div>

      {/* Add Income Popup */}
      {showAddIncome && (
        <div
          className="income-modal-overlay"
          onMouseDown={(e) => {
            if (e.target === e.currentTarget) handleCloseAddIncome();
          }}
        >
          <div className="income-modal">
            <button className="close-income-modal" onClick={handleCloseAddIncome}>
              ✕
            </button>
            <AddIncome
              onNavigate={(page) => {
                // AddIncome calls onNavigate("Income") both on Cancel and
                // after a successful submit - either way, close the popup.
                if (page === "Income") handleCloseAddIncome();
              }}
            />
          </div>
        </div>
      )}

      {/* Content */}
      <div className="income-page-content">
        <IncomeStatCards summary={summary} />

        <div className="charts-row">
          <IncomeTrendChart data={barData} />
          <IncomeBySourceChart segments={donutSegments} />
        </div>

        <IncomeRecentTransactions
          transactions={transactions}
          loading={loadingList}
          recentLimit={RECENT_LIMIT}
          onRefresh={refreshAll}
        />
      </div>
    </div>
  );
}
