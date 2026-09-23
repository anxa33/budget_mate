import "./StatCard.css";

export default function StatCard({ label, value, change, changeDir, color, icon }) {
  const isUp = changeDir === "up";
  return (
    <div className="card">
      <div className="card-header">
        <span className={`card-icon ${color}`}>{icon}</span>
        <span className="card-label">{label}</span>
      </div>
      <div className={`card-value ${color}`}>{value}</div>
      <div className={`card-change ${isUp ? "up" : "down"}`}>
        <span>{isUp ? "↑" : "↓"}</span>
        <span>{change} vs last month</span>
      </div>
    </div>
  );
}
