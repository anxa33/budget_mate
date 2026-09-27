import React, { useState } from "react";
import {
  FaBriefcase,
  FaLaptopCode,
  FaStore,
  FaChartLine,
  FaGift,
  FaMoneyBillWave,
} from "react-icons/fa";
import { SOURCE_COLORS } from "./IncomeBySourceChart";

const API_BASE = "http://127.0.0.1:8000";
const PAGE_SIZE = 5;

export const INCOME_SOURCES = ["Salary", "Freelance", "Business", "Investment", "Other"];
export const PAYMENT_METHODS = ["Cash", "eSewa", "Khalti", "Bank Transfer"];

function SourceBadge({ source }) {
  const key = (source || "").toLowerCase().replace(/\s+/g, "");
  const style = SOURCE_COLORS[key] || SOURCE_COLORS.other;
  const icons = {
    salary: <FaBriefcase size={14} />,
    freelance: <FaLaptopCode size={14} />,
    business: <FaStore size={14} />,
    investment: <FaChartLine size={14} />,
    other: <FaGift size={14} />,
  };
  return (
    <span className="source-badge" style={{ background: style.bg, color: style.text }}>
      <span style={{ display: "flex", alignItems: "center", justifyContent: "center" }}>
        {icons[key] || <FaMoneyBillWave size={14} />}
      </span>
      <span>{source}</span>
    </span>
  );
}

const inputStyle = {
  border: "0.5px solid #d1d5db", borderRadius: 6,
  padding: "6px 10px", fontSize: 13, color: "#111827",
  background: "#fff", outline: "none",
};

export default function IncomeRecentTransactions({
  transactions,
  loading,
  recentLimit = 10,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [sourceFilter, setSourceFilter] = useState("All Sources");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const filtered = transactions.filter((t) => {
    const matchSource = sourceFilter === "All Sources" || t.source === sourceFilter;
    const matchSearch =
      (t.note || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.source || "").toLowerCase().includes(search.toLowerCase()) ||
      (t.method || "").toLowerCase().includes(search.toLowerCase());
    return matchSource && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id) => {
    if (!window.confirm("Delete this income transaction?")) return;

    try {
      const res = await fetch(`${API_BASE}/income/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.detail || "Failed to delete income");
        return;
      }

      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      alert("Backend connection failed");
    }
  };

  const handleEdit = (id) => {
    const tx = transactions.find((t) => t.id === id);
    if (!tx) return;

    setEditingId(id);
    setEditForm({
      amount: tx.amount,
      source: tx.source,
      payment_method: tx.method,
      income_date: tx.rawDate ? String(tx.rawDate).split("T")[0] : "",
      note: tx.note || "",
    });
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditSubmit = async () => {
    if (!editForm.amount || !editForm.source || !editForm.payment_method) {
      alert("Please fill all required fields");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/income/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          source: editForm.source,
          payment_method: editForm.payment_method,
          income_date: editForm.income_date,
          note: editForm.note || "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.detail || "Failed to update income");
        return;
      }

      closeEditModal();
      onRefresh && onRefresh();
    } catch (err) {
      console.error(err);
      alert("Backend connection failed");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="income-card-panel">
      <div className="income-table-header">
        <span className="expense-card-title">Recent Income Transactions (Last {recentLimit})</span>
        <div className="income-table-controls">
          <div style={{ position: "relative" }}>
            <span className="income-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search income..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputStyle, paddingLeft: 30, width: 160 }}
            />
          </div>
          <select
            value={sourceFilter}
            onChange={(e) => { setSourceFilter(e.target.value); setPage(1); }}
            style={inputStyle}
          >
            {["All Sources", ...INCOME_SOURCES].map((s) => (
              <option key={s}>{s}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="income-table">
          <thead>
            <tr>
              {["Date", "Source", "Note", "Amount", "Payment Method", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="income-table-empty">Loading...</td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="income-table-empty">No transactions found.</td>
              </tr>
            ) : (
              paged.map((t) => (
                <tr key={t.id}>
                  <td>{t.date}</td>
                  <td><SourceBadge source={t.source} /></td>
                  <td className="muted">{t.note}</td>
                  <td className="amount-positive">
                    + Rs. {Number(t.amount).toLocaleString()}
                  </td>
                  <td className="muted">{t.method}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button title="Edit" className="icon-btn edit" onClick={() => handleEdit(t.id)}>✏️</button>
                      <button title="Delete" className="icon-btn delete" onClick={() => handleDelete(t.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="income-pagination">
        <span className="pagination-info">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button className="pagination-btn" onClick={() => setPage((p) => Math.max(1, p - 1))} disabled={page === 1}>‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`pagination-btn ${page === n ? "active" : ""}`}
              onClick={() => setPage(n)}
            >{n}</button>
          ))}
          <button className="pagination-btn" onClick={() => setPage((p) => Math.min(totalPages, p + 1))} disabled={page === totalPages}>›</button>
        </div>
      </div>

      {/* Edit Income Modal */}
      {editingId && editForm && (
        <div className="modal-overlay" onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}>
          <div role="dialog" aria-modal="true" className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit Income</div>
                <div className="modal-subtitle">Update transaction details</div>
              </div>
              <button type="button" onClick={closeEditModal} className="modal-close" aria-label="Close">✕</button>
            </div>

            <div className="modal-body">
              <div className="modal-grid">
                <div style={{ gridColumn: "1 / -1" }}>
                  <label className="modal-label">Amount</label>
                  <input
                    style={{ width: "100%", ...inputStyle }}
                    type="number" min="0" step="0.01"
                    value={editForm.amount}
                    onChange={(e) => setEditForm((f) => ({ ...f, amount: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="modal-label">Source</label>
                  <select
                    style={{ width: "100%", ...inputStyle }}
                    value={editForm.source}
                    onChange={(e) => setEditForm((f) => ({ ...f, source: e.target.value }))}
                  >
                    <option value="">Select source</option>
                    {INCOME_SOURCES.map((s) => <option key={s} value={s}>{s}</option>)}
                  </select>
                </div>

                <div>
                  <label className="modal-label">Payment Method</label>
                  <select
                    style={{ width: "100%", ...inputStyle }}
                    value={editForm.payment_method}
                    onChange={(e) => setEditForm((f) => ({ ...f, payment_method: e.target.value }))}
                  >
                    <option value="">Select method</option>
                    {PAYMENT_METHODS.map((m) => <option key={m} value={m}>{m}</option>)}
                  </select>
                </div>

                <div>
                  <label className="modal-label">Date</label>
                  <input
                    style={{ width: "100%", ...inputStyle }}
                    type="date"
                    value={editForm.income_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, income_date: e.target.value }))}
                  />
                </div>

                <div>
                  <label className="modal-label">Note</label>
                  <input
                    style={{ width: "100%", ...inputStyle }}
                    type="text" placeholder="Optional note"
                    value={editForm.note}
                    onChange={(e) => setEditForm((f) => ({ ...f, note: e.target.value }))}
                  />
                </div>
              </div>

              <div className="modal-actions">
                <button type="button" onClick={closeEditModal} className="btn-secondary">Cancel</button>
                <button type="button" onClick={handleEditSubmit} disabled={editSubmitting} className="btn-primary">
                  {editSubmitting ? "Saving..." : "Save Changes"}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
