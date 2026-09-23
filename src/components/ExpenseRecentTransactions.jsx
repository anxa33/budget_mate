import React, { useMemo, useState } from "react";
import {
  FaUtensils,
  FaBus,
  FaShoppingBag,
  FaFilm,
  FaHeartbeat,
  FaHome,
  FaBolt,
  FaGraduationCap,
  FaPlane,
  FaEllipsisH,
} from "react-icons/fa";

const API_BASE = "http://127.0.0.1:8000";
const PAGE_SIZE = 5;

export const CATEGORIES = [
  "Food",
  "Transportation",
  "Shopping",
  "Entertainment",
  "Health & Fitness",
  "Housing",
  "Utilities",
  "Education",
  "Travel",
  "Other",
];

export const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Mobile Banking",
  "eSewa",
  "Khalti",
  "Bank Transfer",
];

const CATEGORY_STYLE = {
  food: { bg: "#FDEDE3", text: "#B5490C", dot: "#EF7B34", icon: <FaUtensils size={14} /> },
  transportation: { bg: "#E6F1FB", text: "#185FA5", dot: "#378ADD", icon: <FaBus size={14} /> },
  shopping: { bg: "#EEEDFE", text: "#534AB7", dot: "#7F77DD", icon: <FaShoppingBag size={14} /> },
  entertainment: { bg: "#FCE9F3", text: "#A3225D", dot: "#E24B94", icon: <FaFilm size={14} /> },
  "health & fitness": { bg: "#E1F5EE", text: "#0F6E56", dot: "#1D9E75", icon: <FaHeartbeat size={14} /> },
  housing: { bg: "#FAEEDA", text: "#854F0B", dot: "#EF9F27", icon: <FaHome size={14} /> },
  utilities: { bg: "#FEF6DA", text: "#8A6D00", dot: "#E2C023", icon: <FaBolt size={14} /> },
  education: { bg: "#E7F3FE", text: "#0B5CAD", dot: "#3C9BEF", icon: <FaGraduationCap size={14} /> },
  travel: { bg: "#E4F7F5", text: "#0D7A6E", dot: "#2CC4B2", icon: <FaPlane size={14} /> },
  other: { bg: "#FCEBEB", text: "#A32D2D", dot: "#E24B4A", icon: <FaEllipsisH size={14} /> },
};

function categoryStyle(category) {
  const key = (category || "").toLowerCase().trim();
  return CATEGORY_STYLE[key] || CATEGORY_STYLE.other;
}

function CategoryBadge({ category }) {
  const style = categoryStyle(category);
  return (
    <span className="category-badge" style={{ background: style.bg, color: style.text }}>
      {style.icon}
      <span>{category}</span>
    </span>
  );
}

const inputStyle = {
  border: "0.5px solid #d1d5db", borderRadius: 6,
  padding: "6px 10px", fontSize: 13, color: "#111827",
  background: "#fff", outline: "none",
};

export default function ExpenseRecentTransactions({
  expenses,
  loading,
  error,
  recentLimit = 10,
  onRefresh,
}) {
  const [search, setSearch] = useState("");
  const [categoryFilter, setCategoryFilter] = useState("All Categories");
  const [page, setPage] = useState(1);

  const [editingId, setEditingId] = useState(null);
  const [editForm, setEditForm] = useState(null);
  const [editSubmitting, setEditSubmitting] = useState(false);

  const authHeaders = () => ({
    Authorization: `Bearer ${localStorage.getItem("token")}`,
  });

  const formattedExpenses = useMemo(
    () =>
      expenses.map((item) => ({
        ...item,
        displayDate: item.expense_date
          ? new Date(item.expense_date).toLocaleDateString("en-US", {
              month: "short", day: "numeric", year: "numeric",
            })
          : "",
      })),
    [expenses]
  );

  const filtered = formattedExpenses.filter((item) => {
    const matchCategory = categoryFilter === "All Categories" || item.category === categoryFilter;
    const matchSearch =
      (item.note || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.category || "").toLowerCase().includes(search.toLowerCase()) ||
      (item.payment_method || "").toLowerCase().includes(search.toLowerCase());
    return matchCategory && matchSearch;
  });

  const totalPages = Math.max(1, Math.ceil(filtered.length / PAGE_SIZE));
  const paged = filtered.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE);

  const handleDelete = async (id) => {
    if (!window.confirm("Are you sure you want to delete this expense?")) return;

    try {
      const res = await fetch(`${API_BASE}/expenses/${id}`, {
        method: "DELETE",
        headers: authHeaders(),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.detail || "Failed to delete expense");
        return;
      }

      onRefresh && onRefresh();
    } catch (err) {
      console.error("Delete failed:", err);
      alert("Backend connection failed");
    }
  };

  const handleEditClick = (expense) => {
    setEditingId(expense.id);
    setEditForm({
      amount: expense.amount,
      category: expense.category,
      payment_method: expense.payment_method,
      expense_date: expense.expense_date ? String(expense.expense_date).split("T")[0] : "",
      note: expense.note || "",
    });
  };

  const closeEditModal = () => {
    setEditingId(null);
    setEditForm(null);
  };

  const handleEditSubmit = async () => {
    if (!editForm.amount || !editForm.category || !editForm.payment_method) {
      alert("Please fill all required fields");
      return;
    }

    setEditSubmitting(true);
    try {
      const res = await fetch(`${API_BASE}/expenses/${editingId}`, {
        method: "PUT",
        headers: {
          "Content-Type": "application/json",
          ...authHeaders(),
        },
        body: JSON.stringify({
          amount: parseFloat(editForm.amount),
          category: editForm.category,
          payment_method: editForm.payment_method,
          expense_date: editForm.expense_date,
          note: editForm.note || "",
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        alert(data.detail || "Failed to update expense");
        return;
      }

      closeEditModal();
      onRefresh && onRefresh();
    } catch (err) {
      console.error("Update failed:", err);
      alert("Backend connection failed");
    } finally {
      setEditSubmitting(false);
    }
  };

  return (
    <div className="expense-card">
      <div className="expense-table-header">
        <span className="expense-card-title">Recent Transactions (Last {recentLimit})</span>
        <div className="expense-table-controls">
          <div style={{ position: "relative" }}>
            <span className="expense-search-icon">🔍</span>
            <input
              type="text"
              placeholder="Search expenses..."
              value={search}
              onChange={(e) => { setSearch(e.target.value); setPage(1); }}
              style={{ ...inputStyle, paddingLeft: 30, width: 160 }}
            />
          </div>
          <select
            value={categoryFilter}
            onChange={(e) => { setCategoryFilter(e.target.value); setPage(1); }}
            style={inputStyle}
          >
            {["All Categories", ...CATEGORIES].map((c) => (
              <option key={c}>{c}</option>
            ))}
          </select>
        </div>
      </div>

      <div style={{ overflowX: "auto" }}>
        <table className="expense-table">
          <thead>
            <tr>
              {["Date", "Category", "Note", "Amount", "Payment Method", "Actions"].map((h) => (
                <th key={h}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {loading ? (
              <tr>
                <td colSpan={6} className="expense-table-empty">Loading...</td>
              </tr>
            ) : error ? (
              <tr>
                <td colSpan={6} className="expense-table-empty error">Error: {error}</td>
              </tr>
            ) : paged.length === 0 ? (
              <tr>
                <td colSpan={6} className="expense-table-empty">No expenses found.</td>
              </tr>
            ) : (
              paged.map((item) => (
                <tr key={item.id}>
                  <td>{item.displayDate}</td>
                  <td><CategoryBadge category={item.category} /></td>
                  <td className="muted">{item.note || "—"}</td>
                  <td className="amount-negative">
                    − Rs. {Number(item.amount).toLocaleString()}
                  </td>
                  <td className="muted">{item.payment_method}</td>
                  <td>
                    <div style={{ display: "flex", gap: 8 }}>
                      <button title="Edit" className="icon-btn edit" onClick={() => handleEditClick(item)}>✏️</button>
                      <button title="Delete" className="icon-btn delete" onClick={() => handleDelete(item.id)}>🗑️</button>
                    </div>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      <div className="expense-pagination">
        <span className="pagination-info">
          Showing {filtered.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1} to {Math.min(page * PAGE_SIZE, filtered.length)} of {filtered.length} entries
        </span>
        <div style={{ display: "flex", gap: 6 }}>
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
          >‹</button>
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((n) => (
            <button
              key={n}
              className={`pagination-btn ${page === n ? "active" : ""}`}
              onClick={() => setPage(n)}
            >{n}</button>
          ))}
          <button
            className="pagination-btn"
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
          >›</button>
        </div>
      </div>

      {/* Edit Expense Modal */}
      {editingId && editForm && (
        <div
          className="modal-overlay"
          onMouseDown={(e) => { if (e.target === e.currentTarget) closeEditModal(); }}
        >
          <div role="dialog" aria-modal="true" className="modal-box">
            <div className="modal-header">
              <div>
                <div className="modal-title">Edit Expense</div>
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
                  <label className="modal-label">Category</label>
                  <select
                    style={{ width: "100%", ...inputStyle }}
                    value={editForm.category}
                    onChange={(e) => setEditForm((f) => ({ ...f, category: e.target.value }))}
                  >
                    <option value="">Select category</option>
                    {CATEGORIES.map((c) => <option key={c} value={c}>{c}</option>)}
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
                    value={editForm.expense_date}
                    onChange={(e) => setEditForm((f) => ({ ...f, expense_date: e.target.value }))}
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
