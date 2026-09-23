import React, { useEffect, useState } from "react";
import { LuSparkles } from "react-icons/lu";
import { FaCalendarCheck, FaExclamationTriangle } from "react-icons/fa";
import Navbar from "../components/Navbar";
import "./Recommendations.css";
// import { Link } from "react-router-dom";


const API_BASE = "http://127.0.0.1:8000";

function statusStyle(status) {
  switch (status) {
    case "early":
      return { badge: "rec-badge-early", label: "Ahead of Schedule" };
    case "late":
      return { badge: "rec-badge-late", label: "Behind Schedule" };
    case "on_time":
      return { badge: "rec-badge-ontime", label: "On Schedule" };
    case "achieved":
      return { badge: "rec-badge-ontime", label: "Achieved" };
    case "unreachable":
      return { badge: "rec-badge-late", label: "Needs Attention" };
    default:
      return { badge: "rec-badge-default", label: "Forecast" };
  }
}

function RecommendationCard({ item }) {
  const forecast = item.ml_forecast || {};
  const style = statusStyle(forecast.status);
  const pct = item.progress_percentage ?? 0;

  return (
    <div className="rec-card">
      <div className="rec-card-top">
        <div>
          <div className="rec-goal-name">{item.goal_name}</div>
          <div className="rec-goal-sub">
            Target: Rs.{Number(item.target_amount).toLocaleString()} &middot; Saved: Rs.
            {Number(item.current_savings).toLocaleString()}
            {item.deadline && <> &middot; Deadline: {item.deadline}</>}
          </div>
        </div>
        <span className={`rec-badge ${style.badge}`}>{style.label}</span>
      </div>

      <div className="rec-progress-track">
        <div
          className="rec-progress-fill"
          style={{ width: `${pct}%` }}
        />
      </div>
      <div className="rec-progress-label">{pct}% complete</div>

      <div className={`rec-forecast-box ${forecast.feasible === false ? "rec-forecast-warning" : ""}`}>
        <div className="rec-forecast-icon">
          {forecast.feasible === false ? <FaExclamationTriangle /> : <FaCalendarCheck />}
        </div>
        <div>
          <div className="rec-forecast-title">Linear Regression Forecast</div>
          <p className="rec-forecast-message">
            {forecast.message || "Not enough transaction history yet to build a forecast."}
          </p>
          {forecast.monthly_trend_slope !== undefined && forecast.monthly_trend_slope !== null && (
            <div className="rec-forecast-meta">
              Real monthly saving trend: Rs.{forecast.monthly_trend_slope.toLocaleString()}/mo change
              {forecast.projected_next_month_saving !== undefined && (
                <> &middot; Next month projection: Rs.{forecast.projected_next_month_saving.toLocaleString()}</>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}

export default function Recommendations({ onNavigate }) {
  const [recommendations, setRecommendations] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    fetchRecommendations();
  }, []);

  const fetchRecommendations = async () => {
    setLoading(true);
    setError(null);
    try {
      const token = localStorage.getItem("token");
      const response = await fetch(`${API_BASE}/goals-recommendations`, {
        headers: { Authorization: `Bearer ${token}` },
      });

      if (!response.ok) throw new Error("Failed to load recommendations");

      const data = await response.json();
      setRecommendations(data);
    } catch (err) {
      console.error(err);
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="recommendations-page">
      <div className="recommendations-topbar">
        <div className="recommendations-toptitle">
          <h1> Recommendations</h1>
        </div>
        <Navbar onNavigate={onNavigate} />
      </div>
      <div className="recommendations-content">
        {loading ? (
          <p className="rec-empty-text">Loading recommendations...</p>
        ) : error ? (
          <p className="rec-empty-text rec-error-text">{error}</p>
        ) : recommendations.length === 0 ? (
          <div className="rec-empty-box">
            <h3>Add Goals to see Recommendations</h3>
          </div>
        ) : (
          recommendations.map((item) => (
            <RecommendationCard key={item.goal_id} item={item} />
          ))
        )}
      </div>
    </div>
  );
}
