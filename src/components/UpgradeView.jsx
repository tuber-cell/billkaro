import React from "react";
import { S, PLANS } from "./common/Constants";
import Header from "./common/Header";

const UpgradeView = ({ 
  step, setStep, user, dbPro, plan, openRazorpay, handleLogout, setShowLogin
}) => {
  return (
    <div style={S.page}>
      <Header step={step} setStep={setStep} user={user} dbPro={dbPro} plan={plan} handleLogout={handleLogout} setShowLogin={setShowLogin} />
      
      <div style={{ maxWidth: 900, margin: "40px auto", padding: "0 20px" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <h2 style={{ color: "#e8edf2", fontSize: 32, marginBottom: 12 }}>Choose Your Plan</h2>
          <p style={{ color: "#8899aa", fontSize: 16 }}>Scale your business with premium features</p>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {/* Free */}
          <div style={{ ...S.card, borderColor: "rgba(136,153,170,0.3)", opacity: 0.6 }} className="hover-card">
            <div style={{ color: "#8899aa", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>FREE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e8edf2", marginBottom: 4 }}>₹0</div>
            <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 20 }}>10 invoices total</div>
            {["10 invoices", "Basic template", "BillKaro watermark"].map(f => (
              <div key={f} style={{ color: "#8899aa", fontSize: 13, marginBottom: 8 }}>✓ {f}</div>
            ))}
            <div style={{ marginTop: 20, color: "#ef4444", fontSize: 13, fontWeight: 600 }}>Current Plan</div>
          </div>

          {/* Pro */}
          <div style={{ ...S.card, borderColor: "rgba(212,175,55,0.5)", background: "rgba(212,175,55,0.06)", position: "relative" }} className="hover-card">
            <div style={{ position: "absolute", top: -12, left: "50%", transform: "translateX(-50%)", background: "#d4af37", color: "#0f1923", fontSize: 10, fontWeight: 700, padding: "3px 12px", borderRadius: 20 }}>MOST POPULAR</div>
            <div style={{ color: "#d4af37", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>PRO</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e8edf2", marginBottom: 4 }}>₹149<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span></div>
            <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 20 }}>Unlimited invoices</div>
            {["Unlimited invoices", "No watermark", "3 premium templates", "Save client profiles", "WhatsApp sharing", "Payment tracking", "GST Reconciliation (Coming Soon)"].map(f => (
              <div key={f} style={{ color: "#e8edf2", fontSize: 13, marginBottom: 8 }}>✓ {f}</div>
            ))}
            <button style={{ ...S.btnPrimary, width: "100%", marginTop: 20 }} onClick={() => openRazorpay("pro")}>
              Upgrade to Pro →
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, color: "#8899aa", fontSize: 12 }}>
          🔒 Secure payment via Razorpay · Cancel anytime · GST invoice provided
        </div>
      </div>
    </div>
  );
};

export default UpgradeView;
