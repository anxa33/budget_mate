import React from "react";
import { useNavigate } from "react-router-dom";
import { FaPowerOff } from "react-icons/fa";
export default function Logout({ onLogout }) {
  const navigate = useNavigate();

  const handleLogout = () => {
    localStorage.removeItem("user");
    localStorage.removeItem("token");

    if (onLogout) {
      onLogout();
    }

    navigate("/login", { replace: true });
  };

  return (
    <button className="nav-item logout-btn" onClick={handleLogout}>
      <span className="nav-icon">
        <FaPowerOff />
      </span>

      <span className="nav-label">
        Logout
      </span>
    </button>
  );
}