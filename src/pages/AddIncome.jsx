import { useState } from "react";
import "./AddIncome.css";

const SOURCES = [
  "Salary",
  "Business",
  "Investment",
  "Rental Income",
  "Pension",
  "Alimony",
  "Other",
];

const PAYMENT_METHODS = [
  "Cash",
  "Bank Transfer",
  "eSewa",
  "Khalti",
];

export default function AddIncome({ onNavigate }) {
  const [form, setForm] = useState({
    source: "",
    amount: "",
    payment_method: "",
    note: "",
    income_date: new Date().toISOString().split("T")[0],
  });

  const [errors, setErrors] = useState({});
  const [loading, setLoading] = useState(false);
  const [success, setSuccess] = useState("");

  const handleChange = (e) => {
    setForm({
      ...form,
      [e.target.name]: e.target.value,
    });

    setErrors({
      ...errors,
      [e.target.name]: "",
    });
  };

  const validate = () => {
    const newErrors = {};

    if (!form.source)
      newErrors.source = "Please select an income source.";

    if (!form.amount)
      newErrors.amount = "Amount is required.";
    else if (Number(form.amount) <= 0)
      newErrors.amount = "Amount must be greater than zero.";

    if (!form.payment_method)
      newErrors.payment_method = "Please select a payment method.";

    setErrors(newErrors);

    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    setSuccess("");

    if (!validate()) return;

    setLoading(true);

    try {
      const response = await fetch("http://127.0.0.1:8000/add-income", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${localStorage.getItem("token")}`,
        },
        body: JSON.stringify({
          source: form.source,
          amount: parseFloat(form.amount),
          payment_method: form.payment_method,
          note: form.note,
          income_date: form.income_date,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        throw new Error(data.detail || "Failed to add income.");
      }

      setSuccess("Income added successfully!");

        setForm({
        source: "",
        amount: "",
        payment_method: "",
        note: "",
        income_date: new Date().toISOString().split("T")[0],
        });

        // Return to the Income page after 1 second
        setTimeout(() => {
        onNavigate("Income");
        }, 1000);

    } catch (error) {
      setErrors({
        submit: error.message,
      });
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="income-container">

      <form className="income-form" onSubmit={handleSubmit}>

        <h2>Add Income</h2>

        {errors.submit && (
          <div className="error-box">{errors.submit}</div>
        )}

        {success && (
          <div className="success-box">{success}</div>
        )}

        <div className="form-group">
          <label>Income Source</label>

          <select
            name="source"
            value={form.source}
            onChange={handleChange}
          >
            <option value="">Select Source</option>

            {SOURCES.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <small>{errors.source}</small>
        </div>

        <div className="form-group">
          <label>Amount (NPR)</label>

          <input
            type="number"
            name="amount"
            value={form.amount}
            onChange={handleChange}
            placeholder="Enter amount"
          />

          <small>{errors.amount}</small>
        </div>

        <div className="form-group">
          <label>Payment Method</label>

          <select
            name="payment_method"
            value={form.payment_method}
            onChange={handleChange}
          >
            <option value="">Select Payment Method</option>

            {PAYMENT_METHODS.map((item) => (
              <option key={item}>{item}</option>
            ))}
          </select>

          <small>{errors.payment_method}</small>
        </div>

        <div className="form-group">
          <label>Note</label>

          <textarea
            rows="4"
            name="note"
            value={form.note}
            onChange={handleChange}
            placeholder="Optional note..."
          />
        </div>

        <div className="button-group">
            <button
                type="button"
                className="cancel-btn"
                onClick={() => onNavigate("Income")}
            >
                Cancel
            </button>

            <button
                type="submit"
                disabled={loading}
            >
                {loading ? "Saving..." : "Add Income"}
            </button>
        </div>

      </form>
    </div>
  );
}