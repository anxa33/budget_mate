import React from "react";
import { FaBell } from "react-icons/fa";
import { useNavigate } from "react-router-dom";
import "./Navbar.css";

function Navbar({ onNavigate }) {
  const navigate = useNavigate();

  const user = JSON.parse(localStorage.getItem("user"));

  const name = user?.name || "User";
  const initial = name.charAt(0).toUpperCase();

  const goToProfile = () => {
    if (onNavigate) {
      onNavigate("Profile");
    } else {
      navigate("/profile");
    }
  };

  return (
    <div className="navbar">

      <button
        className="profile-button"
        onClick={goToProfile}
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