import { useState } from "react";
import {
  BrowserRouter,
  Routes,
  Route,
  Navigate,
} from "react-router-dom";

import Sidebar from "./components/Sidebar";
import Dashboard from "./pages/Dashboard";
import ExpensesDashboard from "./pages/ExpensesDashboard";
import Income from "./pages/Income";
import AddIncome from "./pages/AddIncome";
import Login from "./pages/Login";
import Register from "./pages/Register";
import Profile from "./pages/Profile";

import "./App.css";
import GoalOptimizer from "./pages/Goals";
import Recommendations from "./pages/Recommendations";


function App() {

  const [user, setUser] = useState(() => {
    const savedUser = localStorage.getItem("user");

    return savedUser
      ? JSON.parse(savedUser)
      : null;
  });

  const [activePage, setActivePage] = useState("Dashboard");


  const handleLoginSuccess = (loggedInUser) => {
    setUser(loggedInUser);
  };


  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    setUser(null);
  };


  return (
    <BrowserRouter>

      <Routes>

        {/* PROFILE */}

        <Route path="/profile" element={<Profile />} />

        {/* LOGIN */}

        <Route
          path="/login"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Login
                onLoginSuccess={handleLoginSuccess}
              />
            )
          }
        />


        {/* REGISTER */}

        <Route
          path="/register"
          element={
            user ? (
              <Navigate to="/dashboard" replace />
            ) : (
              <Register />
            )
          }
        />


        {/* DASHBOARD */}

        <Route
          path="/dashboard"
          element={
            user ? (
              <div className="app-layout">

                <Sidebar
                  activePage={activePage}
                  onNavigate={setActivePage}
                  onLogout={handleLogout}
                />

                <main className="main-content">

                  {activePage === "Profile" && (
                    <Profile onLogout={handleLogout} />
                  )}

                  {activePage === "Dashboard" && (
                    <Dashboard />
                  )}

                  {activePage === "Expenses" && (
                    <ExpensesDashboard />
                  )}

                  {activePage === "Goals" && (
                    <GoalOptimizer />
                  )}

                  {activePage === "Income" && (
                    <Income
                      onNavigate={setActivePage}
                    />
                  )}

                  {activePage === "Add Income" && (
                    <AddIncome
                      onNavigate={setActivePage}
                    />
                  )}
                  {activePage==="Recommendations"&&(
                    <Recommendations
                      onNavigate={setActivePage}
                      />
                  )}
               
                </main>

              </div>
            ) : (
              <Navigate to="/login" replace />
            )
          }
        />


        {/* DEFAULT */}

        <Route
          path="/"
          element={
            <Navigate
              to={user ? "/dashboard" : "/login"}
              replace
            />
          }
        />


        {/* UNKNOWN URL */}

        <Route
          path="*"
          element={
            <Navigate
              to={user ? "/dashboard" : "/login"}
              replace
            />
          }
        />

      </Routes>

    </BrowserRouter>
  );
}

export default App;