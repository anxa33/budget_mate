// import { FaBullseye, FaChartLine, FaCog, FaFileAlt } from "react-icons/fa";
import {
  FaHome,
  FaWallet,
  FaChartPie,
  FaBullseye,
  FaChartLine,
  FaFileAlt,
  FaCog,
  FaBriefcase,
  FaPowerOff,
  FaUser,
} 
from "react-icons/fa";
import { LuSparkles } from "react-icons/lu";
import "./Sidebar.css";
import Logout from "./Logout";
import logo from "../assets/logo.png";
const navItems = [
  { label: "Dashboard", icon:<FaHome/>},
  { label: "Expenses", icon: <FaWallet/> },
  { label: "Income", icon:  <FaWallet/> },
  // { label: "Budgets", icon:<FaChartPie/> },
  { label: "Goals", icon:<FaBullseye/> },
  // { label: "Analytics", icon: <FaChartLine/> },
  // { label: "Reports", icon: <FaFileAlt/> },
  { label: "Recommendations", icon: <LuSparkles/> },
  { label: "Profile", icon: <FaUser/> },
];

export default function Sidebar({ activePage, onNavigate, onLogout }) {
  return (
    <aside className="sidebar">
      <div className="sidebar-logo">
        <span className="logo-icon"><img src={logo}/></span>
        <span className="logo-text">BudgetMate</span>
      </div>

      <nav className="sidebar-nav">
        {navItems.map((item) => (
          <button
            key={item.label}
            className={`nav-item ${activePage === item.label ? "active" : ""}`}
            onClick={() => onNavigate(item.label)}
          >
            <span className="nav-icon">{item.icon}</span>
            <span className="nav-label">{item.label}</span>
          </button>
        ))}
      </nav>
      <Logout onLogout={onLogout} />
    </aside>
  );
}
