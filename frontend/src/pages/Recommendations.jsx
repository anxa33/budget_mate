import React, { useEffect, useState } from "react";
import { FaCalendarCheck, FaExclamationTriangle, FaArrowUp, FaArrowDown } from "react-icons/fa";
import Navbar from "../components/Navbar";
import "./Recommendations.css";

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

// Break the backend's long forecast message into short, readable points.
// Splits on sentence ends (but not on "Rs.") and on semicolons.
function splitMessage(message) {
  if (!message) return [];
  return message
    .split(/(?<!Rs)(?<=[.!?])\s+(?=[A-Z0-9])|;\s+/)
    .map((s) => s.trim())
    .filter(Boolean);
}

const money = (n) => `Rs.${Math.abs(Math.round(Number(n))).toLocaleString()}`;
const fmtDate = (d) =>
  d.toLocaleDateString("en-US", { month: "short", year: "numeric" });

const DAYS_PER_MONTH = 30.44;
const monthsUntil = (date) =>
  Math.ceil((date.getTime() - Date.now()) / (DAYS_PER_MONTH * 86400000));

// Backend field names for the completion date aren't guaranteed, so try a few.
// If none exist, estimate from the projected monthly saving.
function getGoalHit(forecast, remaining, deadline) {
  if (remaining <= 0) return { value: "Achieved", hint: "You have reached your target" };

  const keys = [
    "goal_hit_date",
    "estimated_completion_date",
    "projected_completion_date",
    "completion_date",
    "estimated_date",
    "predicted_date",
  ];
  let date = null;
  for (const k of keys) {
    if (forecast[k]) {
      const d = new Date(forecast[k]);
      if (!isNaN(d)) date = d;
      break;
    }
  }

  // The backend message usually states the date ("...by March 2027..."), so use that.
  if (!date && forecast.message) {
    const m = forecast.message.match(/by\s+([A-Za-z]+\s+\d{4})/);
    if (m) {
      const d = new Date(`${m[1]} 1`);
      if (!isNaN(d)) date = d;
    }
  }

  const pace = Number(forecast.projected_next_month_saving);
  if (!date && pace > 0) {
    date = new Date();
    date.setMonth(date.getMonth() + Math.ceil(remaining / pace));
  }
  if (!date) return { value: "Not reachable", hint: "At your current saving pace" };

  let hint = "Estimated at your current pace";
  if (deadline) {
    const diff = Math.round((deadline - date) / (DAYS_PER_MONTH * 86400000));
    if (diff > 0) hint = `About ${diff} month${diff > 1 ? "s" : ""} before deadline`;
    else if (diff < 0) hint = `About ${-diff} month${diff < -1 ? "s" : ""} after deadline`;
    else hint = "Right around your deadline";
  }
  return { value: fmtDate(date), hint };
}

function ForecastBlock({ forecast, item }) {
  const isWarning = forecast.feasible === false;
  const [summary, ...details] = splitMessage(forecast.message);

  const remaining = Math.max(
    0,
    Number(item.target_amount || 0) - Number(item.current_savings || 0)
  );
  const deadline = item.deadline ? new Date(item.deadline) : null;
  const validDeadline = deadline && !isNaN(deadline) ? deadline : null;
  const monthsLeft = validDeadline ? monthsUntil(validDeadline) : null;

  // How much to save each month from now to still hit the deadline.
  let need = null;
  if (remaining <= 0) need = { value: money(0), hint: "Nothing left to save" };
  else if (monthsLeft !== null && monthsLeft > 0)
    need = {
      value: `${money(remaining / monthsLeft)}/mo`,
      hint: `${money(remaining)} over ${monthsLeft} month${monthsLeft > 1 ? "s" : ""}`,
    };
  else if (monthsLeft !== null)
    need = { value: money(remaining), hint: "Deadline has passed" };

  const goalHit = getGoalHit(forecast, remaining, validDeadline);

  const slope = forecast.monthly_trend_slope;
  const hasSlope = slope !== undefined && slope !== null;
  const slopeUp = hasSlope && slope >= 0;
  const proj = forecast.projected_next_month_saving;
  const hasProj = proj !== undefined && proj !== null;

  return (
    <div className={`rec-forecast ${isWarning ? "rec-forecast-warning" : ""}`}>
      <div className="rec-forecast-head">
        {/* <div className="rec-forecast-title">
          {isWarning ? <FaExclamationTriangle /> : <FaCalendarCheck />}
          Linear Regression Forecast
        </div> */}
        <p className="rec-forecast-summary">
          {summary || "Not enough transaction history yet to build a forecast."}
        </p>
      </div>

      <div className="rec-tiles">
        <div className="rec-tile">
          <span className="rec-tile-label">Projected Goal Date</span>
          <span className="rec-tile-value">{goalHit.value}</span>
          <span className="rec-tile-hint">{goalHit.hint}</span>
        </div>

        {hasSlope && (
          <div className={`rec-tile ${slopeUp ? "rec-tile-good" : "rec-tile-bad"}`}>
            <span className="rec-tile-label">Monthly Saving Trend</span>
            <span className="rec-tile-value">
              {slopeUp ? <FaArrowUp /> : <FaArrowDown />} {money(slope)}/mo
            </span>
            <span className="rec-tile-hint">
              {slopeUp ? "Savings are growing" : "Savings are shrinking"}
            </span>
          </div>
        )}

        {hasProj && (
          <div className="rec-tile">
            <span className="rec-tile-label">Next Month Saving</span>
            <span className="rec-tile-value">{money(proj)}</span>
            <span className="rec-tile-hint">Expected to be saved</span>
          </div>
        )}

        {need && (
          <div className="rec-tile rec-tile-accent">
            <span className="rec-tile-label">Required Monthly Saving</span>
            <span className="rec-tile-value">{need.value}</span>
            <span className="rec-tile-hint">{need.hint}</span>
          </div>
        )}
      </div>

      {details.length > 0 && (
        <ul className="rec-forecast-points">
          {details.map((d, i) => (
            <li key={i}>{d}</li>
          ))}
        </ul>
      )}
    </div>
  );
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
        <div className="rec-progress-fill" style={{ width: `${pct}%` }} />
      </div>
      <div className="rec-progress-label">{pct}% complete</div>

      <ForecastBlock forecast={forecast} item={item} />
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
      <Navbar/>
      <div className="recommendations-topbar">
       
        
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