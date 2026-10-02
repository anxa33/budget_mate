import React, { useEffect, useRef, useState } from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

const API = import.meta.env.VITE_API_URL || "http://127.0.0.1:8000";

function Navbar({ onNavigate }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const name = user?.name || "User";
  const initial = name.charAt(0).toUpperCase();

  const [alerts, setAlerts] = useState([]);
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");
  const wrapperRef = useRef(null);

  const goToProfile = () => {
    if (onNavigate) {
      onNavigate("Profile");
    } else {
      navigate("/profile");
    }
  };

  // DBSCAN unusual-spending alerts
  const fetchAlerts = async () => {
    try {
      const token = localStorage.getItem("token");
      if (!token) {
        setError("You are not logged in. Please log in again.");
        return;
      }

      const response = await fetch(`${API}/notifications/unusual-spending`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (response.status === 401) {
        setError("Session expired. Please log out and log in again.");
        return;
      }
      if (response.status === 404) {
        setError("Alerts endpoint not found. Restart the backend server.");
        return;
      }
      if (!response.ok) {
        setError(`Could not load alerts (HTTP ${response.status}).`);
        return;
      }

      const data = await response.json();
      setAlerts(data.alerts || []);
      setError("");
    } catch (err) {
      console.error("Notification alerts fetch failed:", err);
      setError(`Cannot reach the backend at ${API}. Is it running?`);
    } finally {
      setLoading(false);
    }
  };

  // load on mount
  useEffect(() => {
    fetchAlerts();
  }, []);

  // refresh every time the bell is opened, so new expenses show up
  const toggleBell = () => {
    setOpen((wasOpen) => {
      if (!wasOpen) fetchAlerts();
      return !wasOpen;
    });
  };

  // close dropdown when clicking outside
  useEffect(() => {
    const handleClick = (e) => {
      if (wrapperRef.current && !wrapperRef.current.contains(e.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClick);
    return () => document.removeEventListener("mousedown", handleClick);
  }, []);

  return (
    <div className="navbar">

      <div className="notif-wrapper" ref={wrapperRef}>
        <button
          className="notif-button"
          onClick={toggleBell}
          aria-label="Notifications"
        >
          <FaBell />
          {alerts.length > 0 && (
            <span className="notif-badge">{alerts.length}</span>
          )}
        </button>

        {open && (
          <div className="notif-dropdown">
            <div className="notif-header">
              <span>Notifications</span>
            </div>

            <div className="notif-list">
              {loading && <p className="notif-empty">Checking your spending...</p>}

              {!loading && error && (
                <p className="notif-empty notif-error">{error}</p>
              )}

              {!loading && !error && alerts.length === 0 && (
                <p className="notif-empty">No unusual spending detected.</p>
              )}

              {alerts.map((a) => (
                <div key={a.id} className={`notif-item ${a.severity}`}>
                  <div className="notif-title">
                    Unusual {a.category} spending
                    <span className={`notif-severity ${a.severity}`}>
                      {a.severity}
                    </span>
                  </div>
                  <div className="notif-message">
                    NPR {Number(a.amount).toLocaleString()} on {a.expense_date}
                    {a.note ? ` (${a.note})` : ""}
                  </div>
                  <div className="notif-sub">
                    {a.times_typical}x your usual Rs.{" "}
                    {Number(a.typical_amount).toLocaleString()}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}
      </div>

      <button
        className="profile-button"
      >
        <span className="name">{name}</span>

        <div className="avatar">
          {initial}
        </div>
      </button>

    </div>
  );
}

export default Navbar;