import { useState } from "react";
import { FaUser, FaEnvelope, FaSignOutAlt, FaLock } from "react-icons/fa";

const styles = {
  page: {
  minHeight: "100%",
  padding: "20px 30px 25px",
  background:
    "linear-gradient(135deg, #f5f3ff 0%, #f8f7ff 50%, #f0efff 100%)",
  fontFamily: "'Poppins', 'Segoe UI', sans-serif",
  boxSizing: "border-box",
},

topSection: {
  textAlign: "center",
  marginBottom: "20px",
},

topIcon: {
  width: "48px",
  height: "48px",
  borderRadius: "50%",
  background: "#eeebff",
  color: "#6C63FF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  margin: "0 auto 8px",
  fontSize: "20px",
},

title: {
  margin: 0,
  fontSize: "28px",
  fontWeight: "700",
  color: "#16162d",
},

subtitle: {
  margin: "5px 0 0",
  fontSize: "13px",
  color: "#918bb5",
},

card: {
  width: "100%",
  maxWidth: "700px",
  margin: "0 auto",
  background: "#ffffff",
  borderRadius: "20px",
  padding: "25px 30px",
  boxSizing: "border-box",
  boxShadow: "0 12px 35px rgba(108, 99, 255, 0.10)",
},

profileHeader: {
  display: "flex",
  alignItems: "center",
  gap: "18px",
  paddingBottom: "20px",
  borderBottom: "1px solid #eeeaff",
},

avatar: {
  width: "70px",
  height: "70px",
  minWidth: "70px",
  borderRadius: "50%",
  background: "linear-gradient(135deg, #6658f5 0%, #9184ff 100%)",
  color: "#ffffff",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "28px",
  fontWeight: "700",
  boxShadow: "0 8px 20px rgba(108, 99, 255, 0.20)",
},

name: {
  margin: "0 0 6px",
  fontSize: "23px",
  fontWeight: "700",
  color: "#17172d",
},

emailBadge: {
  display: "inline-flex",
  alignItems: "center",
  gap: "7px",
  padding: "6px 11px",
  borderRadius: "20px",
  background: "#f1efff",
  color: "#6558e8",
  fontSize: "12px",
  fontWeight: "600",
},

sectionTitle: {
  display: "flex",
  alignItems: "center",
  gap: "9px",
  margin: "20px 0 12px",
  fontSize: "16px",
  fontWeight: "700",
  color: "#6C63FF",
},

infoBox: {
  display: "flex",
  alignItems: "center",
  gap: "15px",
  background: "#fafaff",
  border: "1px solid #e6e2ff",
  borderRadius: "14px",
  padding: "12px 16px",
  marginBottom: "10px",
},

infoIcon: {
  width: "40px",
  height: "40px",
  minWidth: "40px",
  borderRadius: "50%",
  background: "#f0edff",
  color: "#6C63FF",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  fontSize: "16px",
},

label: {
  fontSize: "11px",
  fontWeight: "600",
  color: "#938db7",
},

value: {
  fontSize: "14px",
  fontWeight: "600",
  color: "#18182e",
},

divider: {
  height: "1px",
  background: "#eeeaff",
  margin: "18px 0",
},

logoutButton: {
  width: "100%",
  padding: "11px",
  borderRadius: "10px",
  border: "1px solid #ffd9df",
  background: "#fff2f4",
  color: "#df5262",
  fontSize: "13px",
  fontWeight: "700",
  fontFamily: "inherit",
  cursor: "pointer",
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "8px",
},

securityText: {
  display: "flex",
  alignItems: "center",
  justifyContent: "center",
  gap: "7px",
  marginTop: "12px",
  color: "#938db7",
  fontSize: "11px",
},

  error: {
    maxWidth: "760px",
    margin: "0 auto",
    padding: "18px",
    borderRadius: "12px",
    background: "#fff0f0",
    color: "#d32f2f",
    textAlign: "center",
    fontSize: "14px",
  },
};

export default function Profile({ onLogout }) {
  const [user] = useState(() => {
    const storedUser = localStorage.getItem("user");

    if (!storedUser) {
      return null;
    }

    try {
      return JSON.parse(storedUser);
    } catch (error) {
      console.error("Could not read user data:", error);
      return null;
    }
  });

  if (!user) {
    return (
      <div style={styles.page}>
        <div style={styles.topSection}>
          <div style={styles.topIcon}>
            <FaUser />
          </div>

          
        </div>

        <div style={styles.error}>
          No logged-in user found. Please login again.
        </div>
      </div>
    );
  }

  const fullName =
    user.full_name ||
    user.fullName ||
    user.name ||
    "User";

  const email =
    user.email ||
    "No email available";

  const initial = fullName.charAt(0).toUpperCase();

  const handleLogout = () => {
    localStorage.removeItem("token");
    localStorage.removeItem("user");

    if (onLogout) {
      onLogout();
    }
  };

  return (
    <div style={styles.page}>

      {/* Page Heading */}
      <div style={styles.topSection}>

      </div>

      {/* Profile Card */}
      <div style={styles.card}>

        {/* User Header */}
        <div style={styles.profileHeader}>

          <div style={styles.avatar}>
            {initial}
          </div>

          <div>
            <h2 style={styles.name}>
              {fullName}
            </h2>
          </div>

        </div>

        {/* Account Information */}
        <div style={styles.sectionTitle}>
          <FaUser style={styles.sectionIcon} />
          <span>Account Information</span>
        </div>

        {/* Full Name */}
        <div style={styles.infoBox}>

          <div style={styles.infoIcon}>
            <FaUser />
          </div>

          <div style={styles.infoContent}>

            <div style={styles.label}>
              Full Name
            </div>

            <div style={styles.value}>
              {fullName}
            </div>

          </div>

        </div>

        {/* Email */}
        <div style={styles.infoBox}>

          <div style={styles.infoIcon}>
            <FaEnvelope />
          </div>

          <div style={styles.infoContent}>

            <div style={styles.label}>
              Email Address
            </div>

            <div style={styles.value}>
              {email}
            </div>

          </div>

        </div>

        {/* Divider */}
        <div style={styles.divider}></div>

        {/* Logout */}
        {/* <button
          style={styles.logoutButton}
          onClick={handleLogout}
        >
          <FaSignOutAlt />
          Logout
        </button> */}

      </div>

      {/* Security Message */}
      <div style={styles.securityText}>
        <FaLock />
        <span>Your information is secure and private.</span>
      
      </div>

    </div>
  );
}