import { useState } from "react";
// import Navbar from "../components/Navbar";


const CATEGORIES = [
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

const PAYMENT_METHODS = [
  "Cash",
  "Credit Card",
  "Debit Card",
  "Mobile Banking",
  "eSewa",
  "Khalti",
  "Bank Transfer",
];

export default function AddExpense() {
  const [amount, setAmount] = useState("");
  const [category, setCategory] = useState("");
  const [date, setDate] = useState("2026-09-01");
  const [paymentMethod, setPaymentMethod] = useState("");
  const [note, setNote] = useState("");
  const [activeNav, setActiveNav] = useState("Expenses");
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = async () => {
  if (!amount || !category || !paymentMethod) {
    alert("Please fill all required fields");
    return;
  }

  try {
    const response = await fetch("http://127.0.0.1:8000/add-expense", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${localStorage.getItem("token")}`,
      },
      body: JSON.stringify({
        amount: parseFloat(amount),
        category,
        expense_date: date,
        payment_method: paymentMethod,
        note,
      }),
    });

    const data = await response.json();

    if (response.ok) {
      setSubmitted(true);

      setAmount("");
      setCategory("");
      setDate(new Date().toISOString().split("T")[0]);
      setPaymentMethod("");
      setNote("");

      setTimeout(() => setSubmitted(false), 2000);
    } else {
      alert(data.detail || "Failed to add expense");
    }
  } catch (error) {
    console.error(error);
    alert("Backend connection failed");
  }
};

  const formatDate = (val) => {
    const d = new Date(val);
    return d.toLocaleDateString("en-US", { month: "long", day: "numeric", year: "numeric" });
  };

  return (
    <div style={styles.root}>
      <style>{`
        @import url('https://fonts.googleapis.com/css2?family=DM+Sans:wght@300;400;500;600&family=Syne:wght@600;700&display=swap');

        * { box-sizing: border-box; margin: 0; padding: 0; }


        .form-input {
          width: 100%;
          padding: 11px 14px;
          border: 1.5px solid #e8e8f0;
          border-radius: 10px;
          font-family: 'DM Sans', sans-serif;
          font-size: 14px;
          color: #2d2d3a;
          background: #fafafd;
          outline: none;
          transition: border-color 0.2s, box-shadow 0.2s;
          appearance: none;
        }
        .form-input:focus {
          border-color: #33723c;
            box-shadow: 0 0 0 3px rgba(109,93,232,0.1);
          background: #fff;
        }
        .form-input::placeholder {
          color: #b0b0c3;
        }
        .form-input:disabled {
          opacity: 0.6;
        }

        select.form-input {
          cursor: pointer;
          background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%23b0b0c3' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E");
          background-repeat: no-repeat;
          background-position: right 14px center;
          padding-right: 38px;
        }

        .submit-btn {
          width: 100%;
          padding: 14px;
          background: linear-gradient(135deg, #6d5de8 0%, #8b7cf0 100%);
          color: #fff;
          border: none;
          border-radius: 12px;
          font-family: 'DM Sans', sans-serif;
          font-size: 15px;
          font-weight: 600;
          cursor: pointer;
          letter-spacing: 0.02em;
          transition: opacity 0.2s, transform 0.15s, box-shadow 0.2s;
          box-shadow: 0 4px 16px rgba(109,93,232,0.35);
          margin-top: 4px;
        }
        .submit-btn:hover {
          opacity: 0.93;
          transform: translateY(-1px);
          box-shadow: 0 6px 20px rgba(109,93,232,0.45);
        }
        .submit-btn:active {
          transform: translateY(0);
        }
        .submit-btn.success {
          background: linear-gradient(135deg, #34c97e, #2db87a);
          box-shadow: 0 4px 16px rgba(52,201,126,0.35);
        }

        .amount-wrapper {
          position: relative;
        }
        .amount-badge {
          position: absolute;
          right: 12px;
          top: 50%;
          transform: translateY(-50%);
          background: #6d5de8;
          color: #fff;
          font-size: 11px;
          font-weight: 600;
          padding: 3px 8px;
          border-radius: 5px;
          letter-spacing: 0.05em;
        }
        .amount-wrapper .form-input {
          padding-right: 60px;
        }

        .date-wrapper {
          position: relative;
        }
        .date-wrapper input[type="date"] {
          color: #2d2d3a;
          font-family: 'DM Sans', sans-serif;
        }
        .cal-icon {
          position: absolute;
          right: 13px;
          top: 50%;
          transform: translateY(-50%);
          color: #b0b0c3;
          font-size: 16px;
          pointer-events: none;
        }
      `}</style>

 

      {/* Main */}
      <main style={styles.main}>
        {/* <Navbar/> */}
        <div style={styles.card}>
          {/* Header */}
          
          <div style={styles.cardHeader}>
            <div>
              <div style={styles.cardTitle}>Add Expense</div>
              <div style={styles.cardSubtitle}>Enter your expense details</div>
            </div>
          </div>

          {/* Form */}
          <div style={styles.form}>
            {/* Amount */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Amount</label>
              <div className="amount-wrapper">
                <input
                  className="form-input"
                  type="number"
                  min="1"
                  placeholder="Enter amount"
                  value={amount}
                  onChange={(e) => setAmount(e.target.value)}
                />
                <span className="amount-badge">Rs</span>
              </div>
            </div>

            {/* Category */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Category</label>
              <select
                className="form-input"
                value={category}
                onChange={(e) => setCategory(e.target.value)}
              >
                <option value="">Select category</option>
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c}</option>
                ))}
              </select>
            </div>

            {/* Date */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Date</label>
              <div className="date-wrapper">
                <input
                  className="form-input"
                  type="date"
                  value={date}
                  onChange={(e) => setDate(e.target.value)}
                />
              </div>
            </div>

            {/* Payment Method */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Payment Method</label>
              <select
                className="form-input"
                value={paymentMethod}
                onChange={(e) => setPaymentMethod(e.target.value)}
              >
                <option value="">Select method</option>
                {PAYMENT_METHODS.map((m) => (
                  <option key={m} value={m}>{m}</option>
                ))}
              </select>
            </div>

            {/* Note */}
            <div style={styles.fieldGroup}>
              <label style={styles.label}>Note (Optional)</label>
              <textarea
                className="form-input"
                placeholder="Add a note"
                value={note}
                onChange={(e) => setNote(e.target.value)}
                rows={3}
                style={{ resize: "none", lineHeight: "1.5" }}
              />
            </div>

            {/* Submit */}
            <button
              className={`submit-btn ${submitted ? "success" : ""}`}
              onClick={handleSubmit}
            >
              {submitted ? "✓ Expense Added!" : "Add Expense"}
            </button>
          </div>
        </div>
      </main>
    </div>
  );
}

const styles = {
  
  card: {
    background: "#fff",
    borderRadius: 18,
    width: "100%",
    maxWidth: 420,
    boxShadow: "0 8px 40px rgba(0,0,0,0.08)",
    overflow: "hidden",
  },
  cardHeader: {
    display: "flex",
    alignItems: "center",
    gap: 14,
    padding: "22px 26px 18px",
    borderBottom: "1.5px solid #f0f0f7",
  },

  cardTitle: {
    fontFamily: "'Syne', sans-serif",
    fontWeight: 700,
    fontSize: 18,
    color: "#1a1740",
    letterSpacing: "-0.01em",
  },
  cardSubtitle: {
    fontSize: 12.5,
    color: "#6d5de8",
    fontWeight: 400,
    marginTop: 1,
  },
  form: {
    padding: "22px 26px 26px",
    display: "flex",
    flexDirection: "column",
    gap: 16,
  },
  fieldGroup: {
    display: "flex",
    flexDirection: "column",
    gap: 7,
  },
  label: {
    fontSize: 13,
    fontWeight: 500,
    color: "#3d3d52",
    letterSpacing: "0.01em",
  },
};
