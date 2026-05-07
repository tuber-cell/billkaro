import React from "react";
import { S, PLANS } from "./Constants";

const Header = ({ step, setStep, user, dbPro, plan, handleLogout, setShowLogin, children }) => {
  return (
    <div style={S.header} className="bk-header">
      <div style={S.logo} className="bk-header-logo">⬡ BillKaro</div>
      
      {children}

      <div className="header-nav" style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4 }}>
        <button 
          style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} 
          onClick={() => setStep("form")}
        >📝 Create</button>
        <button 
          style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} 
          onClick={() => setStep("expenses")}
        >💸 Expenses</button>
        <button 
          style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} 
          onClick={() => setStep("dashboard")}
        >📊 Insights</button>
      </div>

      <div className="header-user-info" style={{ display: "flex", alignItems: "center", gap: 16 }}>
        {user ? (
          <div style={{ textAlign: "right" }}>
            <div style={{ color: "#e8edf2", fontSize: 12, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
            <div style={{ color: "#d4af37", fontSize: 10 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
          </div>
        ) : null}
        
        {user ? (
          <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }} onClick={handleLogout}>Logout</button>
        ) : (
          <button style={{ ...S.btnSecondary, padding: "6px 16px", fontSize: 12 }} onClick={() => setShowLogin(true)}>Login</button>
        )}
      </div>
    </div>
  );
};

export default Header;
