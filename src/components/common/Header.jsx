import React from "react";
import { S, PLANS } from "./Constants";

const Header = ({ step, setStep, user, dbPro, plan, handleLogout, setShowLogin, children }) => {
  const [menuOpen, setMenuOpen] = React.useState(false);

  return (
    <>
      <div style={S.header} className="bk-header no-print">
        <div style={S.logo} className="bk-header-logo">
          <span style={{ color: "#d4af37", marginRight: 8 }}>⬡</span>
          Billby
        </div>
        
        {/* Mobile Toggle */}
        <button 
          className="mobile-menu-toggle" 
          style={{ display: "none" }} 
          onClick={() => setMenuOpen(true)}
        >
          ☰
        </button>

        <div className="header-nav" style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 12, padding: 4, overflowX: "auto", maxWidth: "100%" }}>
          <button 
            style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} 
            onClick={() => setStep("form")}
          >📝 Create</button>
          <button 
            style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} 
            onClick={() => setStep("expenses")}
          >💸 Expenses</button>
          <button 
            style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "8px 16px", borderRadius: 10, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} 
            onClick={() => setStep("dashboard")}
          >📊 Insights</button>
        </div>

        <div className="header-user-info" style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              {!dbPro && (
                <button 
                  style={{ background: "linear-gradient(135deg, #b8860b, #d4af37)", border: "none", color: "#0f1923", padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 15px rgba(212,175,55,0.3)" }} 
                  onClick={() => setStep("upgrade")}
                >🚀 UPGRADE</button>
              )}
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#e8edf2", fontSize: 12, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
                <div style={{ color: "#d4af37", fontSize: 10 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
              </div>
            </div>
          ) : (
            <button 
              style={{ background: "linear-gradient(135deg, #b8860b, #d4af37)", border: "none", color: "#0f1923", padding: "6px 14px", borderRadius: 6, fontSize: 11, fontWeight: 900, cursor: "pointer", boxShadow: "0 4px 15px rgba(212,175,55,0.3)" }} 
              onClick={() => setStep("upgrade")}
            >🚀 GET PRO</button>
          )}
          
          {user ? (
            <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }} onClick={handleLogout}>Logout</button>
          ) : (
            <button style={{ ...S.btnSecondary, padding: "6px 16px", fontSize: 12 }} onClick={() => setShowLogin(true)}>Login</button>
          )}
        </div>
      </div>

      {/* Mobile Drawer */}
      <div className={`mobile-overlay ${menuOpen ? "open" : ""}`} onClick={() => setMenuOpen(false)}></div>
      <div className={`mobile-drawer ${menuOpen ? "open" : ""}`}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 10 }}>
          <div style={S.logo}>Billby</div>
          <button style={{ background: "none", border: "none", color: "#8899aa", fontSize: 24 }} onClick={() => setMenuOpen(false)}>✕</button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 12, marginTop: 20 }}>
          <button 
            style={{ width: "100%", textAlign: "left", background: step === "form" ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${step === "form" ? "#d4af37" : "rgba(255,255,255,0.1)"}`, color: step === "form" ? "#d4af37" : "#e8edf2", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}
            onClick={() => { setStep("form"); setMenuOpen(false); }}
          >📝 Create Invoice</button>
          <button 
            style={{ width: "100%", textAlign: "left", background: step === "expenses" ? "rgba(20,184,166,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${step === "expenses" ? "#14b8a6" : "rgba(255,255,255,0.1)"}`, color: step === "expenses" ? "#14b8a6" : "#e8edf2", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}
            onClick={() => { setStep("expenses"); setMenuOpen(false); }}
          >💸 Track Expenses</button>
          <button 
            style={{ width: "100%", textAlign: "left", background: step === "dashboard" ? "rgba(212,175,55,0.1)" : "rgba(255,255,255,0.03)", border: `1px solid ${step === "dashboard" ? "#d4af37" : "rgba(255,255,255,0.1)"}`, color: step === "dashboard" ? "#d4af37" : "#e8edf2", padding: "14px", borderRadius: 12, fontSize: 14, fontWeight: 700 }}
            onClick={() => { setStep("dashboard"); setMenuOpen(false); }}
          >📊 Business Insights</button>
        </div>

        <div style={{ marginTop: "auto", borderTop: "1px solid rgba(255,255,255,0.1)", paddingTop: 20 }}>
          {user ? (
            <div style={{ marginBottom: 20 }}>
              <div style={{ color: "#e8edf2", fontSize: 14, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
              <div style={{ color: "#d4af37", fontSize: 12 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
              <button style={{ width: "100%", marginTop: 16, background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "12px", borderRadius: 10 }} onClick={() => { handleLogout(); setMenuOpen(false); }}>Logout</button>
            </div>
          ) : (
            <button style={{ width: "100%", background: "#d4af37", color: "#0f1923", border: "none", padding: "14px", borderRadius: 12, fontWeight: 700 }} onClick={() => { setShowLogin(true); setMenuOpen(false); }}>Login / Signup</button>
          )}
        </div>
      </div>

      {children}
    </>
  );
};

export default Header;
