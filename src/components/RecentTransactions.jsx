import { useEffect, useState } from "react";
import "./RecentTransactions.css";
import {
  FaShoppingCart,
  FaFilm,
  FaBolt,
  FaDumbbell,
  FaCar,
  FaHome,
  FaGraduationCap,
  FaPlane,
  FaWallet,
  FaEllipsisH,
} from "react-icons/fa";

const API="/api"

const categoryIcons = {
  "Food & Dining": <FaShoppingCart />,
  Transportation: <FaCar />,
  Shopping: <FaShoppingCart />,
  Entertainment: <FaFilm />,
  "Health & Fitness": <FaDumbbell />,
  Housing: <FaHome />,
  Utilities: <FaBolt />,
  Education: <FaGraduationCap />,
  Travel: <FaPlane />,
  Other: <FaEllipsisH />,
};

export default function RecentTransactions() {
  const [transactions, setTransactions] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetchExpenses();
  }, []);

  const fetchExpenses = async () => {
    try {
      const token = localStorage.getItem("token");

      const response = await fetch(`${API}/expenses`, {
      headers: {
        Authorization: `Bearer ${token}`,
      },
    });
      const data = await response.json();

      if (response.ok) {
        setTransactions(data);
      } else {
        console.error(data.detail);
      }
    } catch (err) {
      console.error("Failed to fetch expenses:", err);
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (date) => {
    return new Date(date).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  if (loading) {
    return <div className="transactions-list">Loading expenses...</div>;
  }

  return (
    <div className="transactions-list">
      {transactions.length === 0 ? (
        <p className="no-transactions">No expenses found.</p>
      ) : (
        transactions.slice(0,6).map((tx) => (
          <div key={tx.id} className="transaction-item">
            <div className="tx-icon">
              {categoryIcons[tx.category] || <FaWallet />}
            </div>

            <div className="tx-info">
              <span className="tx-title">
                {tx.note || tx.category}
              </span>

              <span className="tx-date">
                {formatDate(tx.expense_date)}
              </span>
            </div>

            <span className="tx-category">{tx.category}</span>

            <span className="tx-amount negative">
              - NPR {Number(tx.amount).toLocaleString()}
            </span>
          </div>
        ))
      )}
    </div>
  );
}