import React, { useState, useRef, useEffect, Component } from "react";

class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  componentDidCatch(error, errorInfo) {
    console.error("ErrorBoundary caught an error:", error, errorInfo);
  }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "white", background: "#0f1923", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h1 style={{ color: "#d4af37", fontFamily: "'Playfair Display', serif" }}>Something went wrong.</h1>
          <p style={{ color: "#8899aa" }}>The application encountered an unexpected error during rendering.</p>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", maxWidth: "600px", width: "100%", marginTop: 20 }}>
            <pre style={{ fontSize: 12, color: "#ef4444", whiteSpace: "pre-wrap", textAlign: "left", margin: 0 }}>
              {this.state.error?.toString()}
            </pre>
          </div>
          <button 
            style={{ marginTop: 32, background: "linear-gradient(135deg, #d4af37, #f0d060)", color: "#0f1923", border: "none", padding: "12px 32px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }}
            onClick={() => window.location.reload()}
          >
            Reload BillKaro
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

import { useArchiveExport, saveToLocalArchive, getLocalArchive } from "./hooks/useArchiveExport";
import { useHistoryLookup } from "./hooks/useHistoryLookup";
import { auth, db, googleProvider } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup,
  signInWithRedirect,
  getRedirectResult,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot, query, collection, getDocs, orderBy, where } from "firebase/firestore";


const font = document.createElement("link");
font.rel = "stylesheet";
font.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(font);

const GST_RATES = [0, 5, 12, 18, 28];
const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir"
];
const STATE_CODES = {
  "Jammu & Kashmir": "01", "Himachal Pradesh": "02", "Punjab": "03", "Chandigarh": "04", "Uttarakhand": "05",
  "Haryana": "06", "Delhi": "07", "Rajasthan": "08", "Uttar Pradesh": "09", "Bihar": "10", "Sikkim": "11",
  "Arunachal Pradesh": "12", "Nagaland": "13", "Manipur": "14", "Mizoram": "15", "Tripura": "16",
  "Meghalaya": "17", "Assam": "18", "West Bengal": "19", "Jharkhand": "20", "Odisha": "21",
  "Chhattisgarh": "22", "Madhya Pradesh": "23", "Gujarat": "24", "Maharashtra": "27",
  "Andhra Pradesh": "28", "Karnataka": "29", "Goa": "30", "Kerala": "32", "Tamil Nadu": "33",
  "Telangana": "36"
};

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const invoiceNo = () => Date.now().toString().slice(-6);
const emptyItem = () => ({ id: Date.now(), desc: "", hsn: "", qty: 1, rate: "", gstRate: 18, discount: 0 });

const FREE_LIMIT = 99999; // Set to 99999 for free beta/development phase
const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

// ── localStorage helpers ───────────────────────────────────────────────────────
const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = {
  free: { label: "Free Beta", price: 0, invoices: 10, color: "#8899aa" },
  pro: { label: "Founder Pro", price: 149, invoices: Infinity, color: "#d4af37" },
  business: { label: "Business", price: 399, invoices: Infinity, color: "#14b8a6" },
};
const DAILY_FREE_LIMIT = 10;

// ── Styles ────────────────────────────────────────────────────────────────────
const S = {
  page: { minHeight: "100vh", background: "linear-gradient(135deg, #0f1923 0%, #162032 50%, #0f1923 100%)", fontFamily: "'DM Sans', sans-serif", padding: "0 0 60px" },
  header: { background: "rgba(15, 25, 35, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,175,55,0.3)", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100 },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#d4af37", letterSpacing: "0.05em", fontWeight: 700 },
  badge: { background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", padding: "4px 12px", borderRadius: 20, fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 },
  container: { maxWidth: 1000, margin: "0 auto", padding: "40px 20px" },
  card: { background: "rgba(255,255,255,0.03)", backdropFilter: "blur(8px)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 16, padding: "28px 32px", marginBottom: 24, transition: "transform 0.3s ease, box-shadow 0.3s ease" },
  secTitle: { fontFamily: "'Playfair Display', serif", fontSize: 18, color: "#d4af37", marginBottom: 24, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)", display: "flex", alignItems: "center", gap: 10 },
  label: { display: "block", fontSize: 11, color: "#8899aa", marginBottom: 8, letterSpacing: "0.08em", textTransform: "uppercase", fontWeight: 600 },
  input: { width: "100%", background: "rgba(255,255,255,0.05)", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 10, padding: "12px 16px", color: "#e8edf2", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", transition: "all 0.3s ease", boxSizing: "border-box" },
  select: { width: "100%", background: "#1a2d45", border: "1px solid rgba(255,255,255,0.1)", borderRadius: 8, padding: "10px 14px", color: "#e8edf2", fontSize: 14, outline: "none", fontFamily: "'DM Sans', sans-serif", boxSizing: "border-box" },
  btnPrimary: { background: "linear-gradient(135deg, #d4af37, #f0d060)", color: "#0f1923", border: "none", padding: "12px 28px", borderRadius: 8, fontSize: 14, fontWeight: 700, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  btnSecondary: { background: "transparent", color: "#d4af37", border: "1px solid rgba(212,175,55,0.4)", padding: "10px 20px", borderRadius: 8, fontSize: 13, fontWeight: 500, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  btnTeal: { background: "rgba(20,184,166,0.1)", color: "#14b8a6", border: "1px solid rgba(20,184,166,0.3)", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  btnDanger: { background: "rgba(239,68,68,0.1)", color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)", padding: "6px 12px", borderRadius: 6, fontSize: 12, cursor: "pointer", fontFamily: "'DM Sans', sans-serif" },
  btnAdd: { background: "rgba(212,175,55,0.08)", color: "#d4af37", border: "1px dashed rgba(212,175,55,0.3)", padding: "10px 20px", borderRadius: 8, fontSize: 13, cursor: "pointer", width: "100%", fontFamily: "'DM Sans', sans-serif", marginTop: 12 },
  errText: { color: "#ef4444", fontSize: 11, marginTop: 4 },
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 25, 35, 0.9)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 1000, padding: 20 },
  modalContent: { background: "#1a2d45", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "32px", maxWidth: 400, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }
};

// ── Components ─────────────────────────────────────────────────────────────────
const StatCard = ({ title, value, icon, color }) => (
  <div style={{ ...S.card, padding: 20, marginBottom: 0, borderLeft: `4px solid ${color}` }}>
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ color: "#8899aa", fontSize: 12, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</span>
    </div>
    <div style={{ color: "#e8edf2", fontSize: 22, fontWeight: 800 }}>{value}</div>
  </div>
);

const BreakdownBox = ({ label, value }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
    <div style={{ color: "#8899aa", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
    <div style={{ color: "#e8edf2", fontSize: 16, fontWeight: 700 }}>{value}</div>
  </div>
);

const AuthModal = ({ setShowLogin, setUser, targetPlan, setTargetPlan, setPlan, syncProStatus, openRazorpay, step, handleGoogleLogin, user }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(false);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");

  // Failsafe: Close modal if user is detected
  useEffect(() => {
    if (user) {
      setShowLogin(false);
    }
  }, [user]);

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setAuthError("Please fill all fields");
    setAuthLoading(true);
    setAuthError("");
    try {
      let result;
      if (isSignup) {
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      
      // Close modal immediately on success
      setShowLogin(false);
      setUser(result.user);
      
      // Sync in background
      try {
        await syncProStatus(result.user.uid, targetPlan || "free");
        if (targetPlan === "pro") {
          setTimeout(() => openRazorpay("pro"), 500);
        }
      } catch (syncErr) {
        console.error("Sync Error:", syncErr);
      }
    } catch (err) {
      console.error(err);
      let msg = "Authentication failed. ";
      if (err.code === "auth/invalid-credential") msg = "Wrong email or password.";
      if (err.code === "auth/email-already-in-use") msg = "Email already registered. Try logging in!";
      if (err.code === "auth/user-not-found") msg = "Account not found. Try signing up!";
      if (err.code === "auth/weak-password") msg = "Password is too weak (min 6 characters).";
      setAuthError(msg || err.message);
    } finally {
      setAuthLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return alert("Please enter your email address first.");
    try {
      await sendPasswordResetEmail(auth, email);
      alert("Password reset email sent! Check your inbox.");
    } catch (err) {
      alert(err.message);
    }
  };

  const onGoogleLogin = () => {
    handleGoogleLogin(setAuthLoading, setAuthError);
  };


  const handleAuthSuccess = async (user) => {
    // We no longer sync pro status here. 
    // The App component will detect user + targetPlan and trigger Razorpay.
    setShowLogin(false);
  };

  return (
    <div style={S.modal}>
      <div style={S.modalContent}>
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 20 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "#d4af37" }}>
            {targetPlan ? "Secure Your Pro Account" : (isSignup ? "Create Account" : "Login to BillKaro")}
          </div>
          <button style={{ background: "none", border: "none", color: "#8899aa", cursor: "pointer", fontSize: 20 }} onClick={() => setShowLogin(false)}>✕</button>
        </div>

        {authError && <div style={{ ...S.errText, background: "rgba(239,68,68,0.1)", padding: 10, borderRadius: 8, marginBottom: 16 }}>{authError}</div>}

        <button 
          id="google-login-btn"
          onMouseDown={(e) => {
            console.log("MOUSEDOWN DETECTED");
            onGoogleLogin(e);
          }}
          onClick={(e) => {
            e.preventDefault();
            e.stopPropagation();
            console.log("CLICK DETECTED");
            onGoogleLogin(e);
          }} 
          disabled={authLoading} 
          style={{ 
            background: "#fff", 
            color: "#1a2d45", 
            border: "5px solid #ff4444", // THICKER RED BORDER
            width: "100%", 
            height: 52, 
            borderRadius: 8, 
            fontWeight: 800, 
            fontSize: 15, 
            cursor: "pointer", 
            display: "flex", 
            alignItems: "center", 
            justifyContent: "center", 
            gap: 10, 
            marginBottom: 20,
            position: "relative",
            zIndex: 99999, // OVER EVERYTHING
            pointerEvents: "all",
            userSelect: "none"
          }}
        >
          <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" width="20" alt="G" />
          {authLoading ? "Connecting..." : "Continue with Google"}
        </button>

        <div style={{ textAlign: "center", margin: "16px 0", position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.05)" }}></div>
          <span style={{ background: "#1a2d45", padding: "0 12px", color: "#445566", fontSize: 12, position: "relative" }}>OR</span>
        </div>

        <form onSubmit={onEmailSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Email Address</label>
            <input type="email" style={S.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@company.com" />
          </div>
          <div style={{ marginBottom: 20 }}>
            <label style={S.label}>Password</label>
            <input type="password" style={S.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
            {!isSignup && <div onClick={handleForgotPassword} style={{ fontSize: 11, color: "#d4af37", marginTop: 6, cursor: "pointer", textAlign: "right" }}>Forgot password?</div>}
          </div>

          <button type="submit" disabled={authLoading} style={{ ...S.btnPrimary, width: "100%", height: 48, marginBottom: 12 }}>
            {authLoading ? "Processing..." : (isSignup ? "Create Free Account" : "Sign In")}
          </button>
        </form>



        <div style={{ textAlign: "center", fontSize: 13, color: "#8899aa" }}>
          {isSignup ? "Already have an account?" : "New to BillKaro?"}
          <span style={{ color: "#d4af37", marginLeft: 6, cursor: "pointer", fontWeight: 600 }} onClick={() => setIsSignup(!isSignup)}>
            {isSignup ? "Login here" : "Sign up free"}
          </span>
        </div>
      </div>
    </div>
  );
};

const InvoiceFormView = ({ 
  step, setStep, isPro, plan, dailyLeft, user, invoiceNum, invoiceDate, setInvoiceDate, 
  dueDate, setDueDate, supplyType, setSupplyType, paidStatus, setPaidStatus, 
  docType, setDocType, invoicePrefix, setInvoicePrefix, watermark, setWatermark, 
  showUpiQr, setShowUpiQr, seller, setSeller, sellerLogo, setSellerLogo, 
  sellerSignature, setSellerSignature, handleLogoUpload, handleSignatureUpload, 
  handleSaveSeller, savedSeller, buyer, setBuyer, errors, suggestion, applySuggestion, 
  warnings, hasHistory, savedClients, handleLoadClient, handleDeleteClient, clearBuyerHistory, 
  handleSaveClient, items, updateItem, removeItem, addItem, calcItem, totals, 
  archiveCount, handleSaveAndNext, handlePreview, generateArchive, exporting, 
  saveToast, handleLogout, setShowLogin, showLogin, targetPlan, setTargetPlan, setPlan, syncProStatus, openRazorpay, setUser, dbPro, fmt, STATES = [], GST_RATES = [], PLANS = {}, S, notes, setNotes
}) => {
  return (
    <div style={S.page}>
      <style>{`
        @media print { body { display: none; } }
        input:focus, select:focus { border-color: rgba(212,175,55,1) !important; background: rgba(255,255,255,0.08) !important; box-shadow: 0 0 15px rgba(212,175,55,0.2); }
        input::placeholder { color: #445566; }
        textarea::placeholder { color: #445566; }
        .custom-date::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(1) saturate(5) hue-rotate(5deg); cursor: pointer; }
        @keyframes pulse-gold {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        .pulse-match { animation: pulse-gold 2s infinite ease-in-out; }
      `}</style>

      <div style={S.header} className="bk-header">
        <div style={S.logo}>⬡ BillKaro</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...S.badge, borderColor: (PLANS[plan]?.color || "#8899aa") + "88", color: PLANS[plan]?.color || "#8899aa" }}>
            {(PLANS[plan]?.label || "Free").toUpperCase()} PLAN
          </div>
          {!isPro && <div style={{ color: "#8899aa", fontSize: 12 }}>{dailyLeft} daily invoice{dailyLeft !== 1 ? "s" : ""} left</div>}
        </div>

        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginRight: 8 }}>
            <button 
              style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => setStep("form")}
            >📝 Create</button>
            <button 
              style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => setStep("expenses")}
            >💸 Expenses</button>
            <button 
              style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", transition: "all 0.2s" }}
              onClick={() => setStep("dashboard")}
            >📊 Insights</button>
          </div>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#e8edf2", fontSize: 12, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
                <div style={{ color: "#d4af37", fontSize: 10 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
              </div>
              <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button style={{ ...S.btnSecondary, padding: "6px 16px", fontSize: 12 }} onClick={() => setShowLogin(true)}>
              Login
            </button>
          )}
          <div style={{ color: "#445566", fontSize: 12 }}>#{invoiceNum}</div>
        </div>
      </div>

      {showLogin && <AuthModal setShowLogin={setShowLogin} setUser={setUser} targetPlan={targetPlan} setTargetPlan={setTargetPlan} setPlan={setPlan} syncProStatus={syncProStatus} openRazorpay={openRazorpay} />}


      <div style={S.container} className="bk-container bk-form-bottom-pad">

        {/* Invoice Details */}
        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>📋</span> Invoice Details</div>
          <div className="grid-responsive-3" style={{ gap: 20 }}>
            <div>
              <label style={S.label}>Invoice Number</label>
              <input style={{ ...S.input, color: "#d4af37", fontWeight: 700 }} value={invoiceNum} readOnly />
            </div>
            <div>
              <label style={S.label}>Invoice Date</label>
              <input type="date" style={S.input} className="custom-date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Due Date (Optional)</label>
              <input type="date" style={S.input} className="custom-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid-responsive-2" style={{ gap: 20, marginTop: 24 }}>
            {/* Supply Type */}
            <div>
              <label style={S.label}>Supply Type</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {[["intra", "Intra-State (CGST+SGST)"], ["inter", "Inter-State (IGST)"]].map(([val, lbl]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: supplyType === val ? "#d4af37" : "#8899aa", fontSize: 12, padding: "8px 14px", background: supplyType === val ? "rgba(212,175,55,0.1)" : "transparent", border: `1px solid ${supplyType === val ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8 }}>
                    <input type="radio" value={val} checked={supplyType === val} onChange={() => setSupplyType(val)} style={{ accentColor: "#d4af37" }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            {/* Payment Status */}
            <div>
              <label style={S.label}>Payment Status</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {[["unpaid", "⏳ Unpaid", "#f59e0b"], ["paid", "✅ Paid", "#22c55e"]].map(([val, lbl, col]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: paidStatus === val ? col : "#8899aa", fontSize: 12, padding: "8px 14px", background: paidStatus === val ? col + "18" : "transparent", border: `1px solid ${paidStatus === val ? col + "88" : "rgba(255,255,255,0.08)"}`, borderRadius: 8 }}>
                    <input type="radio" value={val} checked={paidStatus === val} onChange={() => setPaidStatus(val)} style={{ accentColor: col }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        {/* DOCUMENT SETTINGS */}
        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>⚙️</span> Document Settings</div>
          <div className="grid-responsive-3" style={{ gap: 20 }}>
            <div>
              <label style={S.label}>Document Type</label>
              <select style={S.select} value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="Tax Invoice">Tax Invoice</option>
                <option value="Quotation">Quotation</option>
                <option value="Proforma Invoice">Proforma Invoice</option>
                <option value="Delivery Challan">Delivery Challan</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Invoice Prefix</label>
              <input style={S.input} placeholder="e.g. BK/24/" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Watermark</label>
              <select style={S.select} value={watermark} onChange={e => setWatermark(e.target.value)}>
                <option value="">None</option>
                <option value="PAID">PAID</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="DUPLICATE">DUPLICATE</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: showUpiQr ? "#d4af37" : "#8899aa", fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={showUpiQr} onChange={e => setShowUpiQr(e.target.checked)} style={{ accentColor: "#d4af37", width: 18, height: 18 }} />
              Show UPI QR Code on PDF (Instant Payment)
            </label>
          </div>
        </div>

        {/* Seller & Buyer */}
        <div className="grid-responsive-2" style={{ marginBottom: 24 }}>

          {/* Seller */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#d4af37" }}>Seller Details</div>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  🖼️ {sellerLogo ? "Update Logo" : "Logo"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                </label>
                <label style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  🖋️ {sellerSignature ? "Update Sign" : "Sign"}
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: "none" }} />
                </label>
                <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11 }} onClick={handleSaveSeller}>
                  💾 Save Profile
                </button>
              </div>
            </div>

            {sellerLogo && (
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, padding: 10, background: "rgba(212,175,55,0.05)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.2)" }}>
                <img src={sellerLogo} alt="Logo" style={{ height: 40, borderRadius: 4 }} />
                <div style={{ flex: 1, fontSize: 11, color: "#8899aa" }}>Logo will appear on the top-left of the invoice.</div>
                <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }} onClick={() => setSellerLogo("")}>Remove</button>
              </div>
            )}
            {sellerSignature && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, padding: 10, background: "rgba(212,175,55,0.05)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.2)" }}>
                <img src={sellerSignature} alt="Signature" style={{ height: 40, background: "white", borderRadius: 4, padding: 4 }} />
                <div style={{ flex: 1, fontSize: 11, color: "#8899aa" }}>Digital signature uploaded. It will appear above the signatory line.</div>
                <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }} onClick={() => setSellerSignature("")}>Remove</button>
              </div>
            )}
            {savedSeller && (
              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: "#d4af37", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>✓ Saved: {savedSeller.name}</span>
                <button style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer", fontSize: 11 }} onClick={() => setSeller(savedSeller)}>Load →</button>
              </div>
            )}
            {[["Business Name *", "name", "text", errors.sellerName], ["GSTIN *", "gstin", "text", errors.sellerGstin], ["Address", "address", "text", false], ["City", "city", "text", false], ["PIN Code", "pin", "text", false], ["Email", "email", "email", false], ["Phone", "phone", "tel", errors.sellerPhone]].map(([lbl, field, type, hasErr]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={S.label}>{lbl}</label>
                <input type={type} style={{ ...S.input, ...(hasErr ? { borderColor: "#ef4444" } : {}) }}
                  placeholder={field === "gstin" ? "27AAPFU0939F1ZV" : field === "phone" ? "10 digit number" : ""}
                  value={seller[field]} onChange={e => setSeller({ ...seller, [field]: e.target.value })} />
                {hasErr && <div style={S.errText}>{field === "gstin" ? "Enter valid GSTIN" : field === "phone" ? "Enter valid 10-digit phone" : "Required"}</div>}
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>State</label>
              <select style={S.select} value={seller.state} onChange={e => setSeller({ ...seller, state: e.target.value })}>
                {(STATES || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 20, padding: "16px", background: "rgba(212,175,55,0.05)", borderRadius: 12, border: "1px solid rgba(212,175,55,0.1)" }}>
              <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                🏦 Bank / UPI Details (Optional)
              </div>
              <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 12 }}>
                <div>
                  <label style={S.label}>Bank Name</label>
                  <input style={S.input} placeholder="e.g. HDFC Bank" value={seller.bankName} onChange={e => setSeller({ ...seller, bankName: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Account No</label>
                  <input style={S.input} placeholder="Account No" value={seller.accountNum} onChange={e => setSeller({ ...seller, accountNum: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>IFSC Code</label>
                  <input style={S.input} placeholder="IFSC Code" value={seller.ifsc} onChange={e => setSeller({ ...seller, ifsc: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>UPI ID</label>
                  <input style={S.input} placeholder="name@upi" value={seller.upi} onChange={e => setSeller({ ...seller, upi: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          {/* Buyer */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#d4af37" }}>Buyer Details</div>
                <div 
                  className={suggestion ? "pulse-match" : ""}
                  style={{ fontSize: 9, color: hasHistory ? (suggestion ? "#fbbf24" : "#d4af37") : "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800 }}
                >
                  {hasHistory ? (suggestion ? "✨ MATCH FOUND" : "🟢 ENGINE READY") : "⚪ NO DATA YET"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11, color: "#8899aa", borderColor: "rgba(255,255,255,0.1)" }} onClick={() => { if(confirm("Clear all smart history? This won't delete saved clients.")) clearBuyerHistory(); }}>
                  🧹 Clear History
                </button>
                <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11 }} onClick={handleSaveClient}>
                  💾 Save Client
                </button>
              </div>
            </div>

            {/* Saved clients dropdown */}
            {(savedClients || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Load Saved Client</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ ...S.select, flex: 1 }} onChange={e => handleLoadClient(e.target.value)} defaultValue="">
                    <option value="" disabled>Select client…</option>
                    {(savedClients || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {(savedClients || []).map(c => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 8px" }}>
                      <span style={{ fontSize: 11, color: "#8899aa" }}>{c.name}</span>
                      <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: 0 }} onClick={() => handleDeleteClient(c.name)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {[["Business Name *", "name", "text", errors.buyerName], ["GSTIN", "gstin", "text", false], ["Address", "address", "text", false], ["City", "city", "text", false], ["PIN Code", "pin", "text", false], ["Email", "email", "email", false], ["Phone", "phone", "tel", errors.buyerPhone]].map(([lbl, field, type, hasErr]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={S.label}>{lbl}</label>
                <input type={type} style={{ ...S.input, ...(hasErr ? { borderColor: "#ef4444" } : {}) }}
                  placeholder={field === "phone" ? "10 digit number" : ""}
                  value={buyer[field]} onChange={e => setBuyer({ ...buyer, [field]: e.target.value })} />
                {hasErr && <div style={S.errText}>{field === "phone" ? "Enter valid 10-digit phone" : "Required"}</div>}
                
                {/* Smart Suggestions for Buyer */}
                {field === "name" && suggestion && (
                  <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#d4af37", marginBottom: 6 }}>✨ Smart Suggestion — based on {suggestion.invoiceCount} past invoice{suggestion.invoiceCount > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 12, color: "#8899aa", marginBottom: 8 }}>GSTIN: {suggestion.gstin} · {suggestion.state} · Avg: {fmt(suggestion.avgInvoiceValue)}</div>
                    <button style={{ fontSize: 11, color: "#0f1923", background: "#d4af37", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontWeight: 700 }} onClick={() => applySuggestion(setBuyer, setDueDate, setSupplyType, invoiceDate)}>⚡ Apply All</button>
                  </div>
                )}
              </div>
            ))}

            {/* Mismatch Warnings */}
            {(warnings || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                {(warnings || []).map((w, i) => (
                  <div key={i} style={{
                    background: w.level === "error" ? "rgba(239,68,68,0.08)" : w.level === "warning" ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                    border: `1px solid ${w.level === "error" ? "rgba(239,68,68,0.3)" : w.level === "warning" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
                    borderRadius: 8, padding: "8px 14px", fontSize: 12, color: w.level === "error" ? "#ef4444" : w.level === "warning" ? "#f59e0b" : "#60a5fa", marginTop: 8
                  }}>
                    {w.message}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>State</label>
              <select style={S.select} value={buyer.state} onChange={e => setBuyer({ ...buyer, state: e.target.value })}>
                {(STATES || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>📦</span> Items / Services</div>
          {errors.items && <div style={{ ...S.errText, marginBottom: 16, background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: 8 }}>⚠️ Fill all item descriptions and rates</div>}
          <div className="scroll-container">
            <div style={{ display: "grid", gridTemplateColumns: "minmax(180px, 3fr) 90px 70px 100px 70px 80px 100px 40px", gap: 12, marginBottom: 12, minWidth: 750 }}>
            {["Description", "HSN/SAC", "Qty", "Rate (₹)", "Disc %", "GST %", "Amount", ""].map(h => (
              <div key={h} style={{ ...S.label, marginBottom: 0, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</div>
            ))}
          </div>
          {(items || []).map((item, idx) => {
            const c = calcItem(item);
            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(180px, 3fr) 90px 70px 100px 70px 80px 100px 40px", gap: 12, marginBottom: 12, alignItems: "center", minWidth: 750 }}>
                <input style={S.input} placeholder={`Item ${idx + 1}`} value={item.desc} onChange={e => updateItem(item.id, "desc", e.target.value)} />
                <input style={S.input} placeholder="HSN" value={item.hsn} onChange={e => updateItem(item.id, "hsn", e.target.value)} />
                <input type="number" style={S.input} min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} />
                <input type="number" style={S.input} placeholder="0.00" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
                <input type="number" style={S.input} placeholder="0" value={item.discount} onChange={e => updateItem(item.id, "discount", e.target.value)} />
                <select style={S.select} value={item.gstRate} onChange={e => updateItem(item.id, "gstRate", Number(e.target.value))}>
                  {(GST_RATES || []).map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
                <div style={{ color: "#d4af37", fontSize: 13, fontWeight: 700, textAlign: "right", letterSpacing: "0.05em" }}>{fmt(c.total)}</div>
                <button style={{ ...S.btnDanger, height: 40, width: 40, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px" }} onClick={() => removeItem(item.id)}>✕</button>
              </div>
            );
          })}
          </div>
          <button style={S.btnAdd} onClick={addItem}>+ Add Item</button>

          <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 280 }}>
              {[["Taxable Amount", fmt(totals.taxable)], ...(supplyType === "intra" ? [["CGST", fmt(totals.gst / 2)], ["SGST", fmt(totals.gst / 2)]] : [["IGST", fmt(totals.gst)]])].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#8899aa", fontSize: 13 }}>{lbl}</span>
                  <span style={{ color: "#e8edf2", fontSize: 13 }}>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(212,175,55,0.3)", paddingTop: 12, marginTop: 8 }}>
                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 20 }}>{fmt(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={S.card} className="hover-card bk-card">
          <div style={S.secTitle}><span>📝</span> Notes</div>
          <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* Desktop action row */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }} className="no-print">
          {/* Archive counter badge */}
          {archiveCount > 0 && (
            <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 20, padding: "4px 12px" }}>
              📂 {archiveCount} saved
            </span>
          )}
          {/* Save & Next — the quick batch-entry button */}
          <button
            style={{ ...S.btnSecondary, background: "rgba(52,211,153,0.12)", color: "#34d399", borderColor: "rgba(52,211,153,0.4)", fontWeight: 700 }}
            onClick={handleSaveAndNext}
          >
            💾 Save &amp; Next Invoice
          </button>
          <button
            style={{
              ...S.btnSecondary,
              background: exporting ? "#334155" : "rgba(212,175,55,0.12)",
              color: exporting ? "#8899aa" : "#d4af37",
              cursor: exporting ? "not-allowed" : "pointer",
            }}
            onClick={() => {
              const isDirty = buyer.name || items.some(i => i.desc || i.rate);
              generateArchive(isDirty ? {
                invoiceNum, invoiceDate, dueDate, supplyType, paidStatus,
                buyer: { ...buyer }, seller: { ...seller },
                items: items.map(i => ({ ...i })),
                createdAt: new Date().toISOString(),
              } : null);
            }}
            disabled={exporting}
          >
            {exporting ? "⏳ Building…" : "📦 Export All to Excel"}
          </button>
          <button style={S.btnPrimary} onClick={handlePreview}>Preview &amp; Download →</button>
        </div>
      </div>

      {/* Save confirmation toast */}
      {saveToast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(52,211,153,0.95)", color: "#0f1923", padding: "12px 28px", borderRadius: 30, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
          ✅ Invoice saved! Form ready for next invoice.
        </div>
      )}

      {/* Sticky bottom action bar — mobile only */}
      <div className="mobile-action-bar">
        {archiveCount > 0 && (
          <button 
            style={{ ...S.btnSecondary, flex: "0 0 auto", padding: "0 12px", background: "rgba(212,175,55,0.12)", color: "#d4af37" }} 
            onClick={() => {
              const isDirty = buyer.name || items.some(i => i.desc || i.rate);
              generateArchive(isDirty ? {
                invoiceNum, invoiceDate, dueDate, supplyType, paidStatus,
                buyer: { ...buyer }, seller: { ...seller },
                items: items.map(i => ({ ...i })),
                createdAt: new Date().toISOString(),
              } : null);
            }}
          >
            📦
          </button>
        )}
        <button style={{ ...S.btnSecondary, flex: 1, fontSize: 11 }} onClick={handleSaveAndNext}>💾 Save &amp; Next</button>
        <button style={{ ...S.btnPrimary, flex: 1.5 }} onClick={handlePreview}>Preview →</button>
      </div>
    </div>
  );
};



const DashboardView = ({ user, dbPro, plan, expenses, seller, setStep, getLocalArchive, generateArchive, generateGSTR1, handleLogout, setShowLogin, fmt, S }) => {
  const [stats, setStats] = useState(null);
  const [loadingStats, setLoadingStats] = useState(true);

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      let archive = [];
      if (user) {
        try {
          const ref = collection(db, "users", user.uid, "invoices");
          const q = query(ref, orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          archive = snap.docs.map(d => d.data());
        } catch (err) {
          console.error("Dashboard data fetch error:", err);
          archive = getLocalArchive();
        }
      } else {
        archive = getLocalArchive();
      }

      const now = new Date();
      const curM = now.getMonth();
      const curY = now.getFullYear();

      const monthlyData = archive.filter(inv => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d.getMonth() === curM && d.getFullYear() === curY;
      });

      const totals = monthlyData.reduce((acc, inv) => {
        const taxable = (inv.items || []).reduce((sum, item) => sum + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), 0);
        const gst = (inv.items || []).reduce((sum, item) => {
           const it = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
           return sum + it * ((parseFloat(item.gstRate) || 0) / 100);
        }, 0);
        
        acc.sales += taxable + gst;
        acc.taxable += taxable;
        acc.gstTotal += gst;
        if (inv.supplyType === "intra") {
          acc.cgst += gst / 2;
          acc.sgst += gst / 2;
        } else {
          acc.igst += gst;
        }
        return acc;
      }, { sales: 0, taxable: 0, gstTotal: 0, cgst: 0, sgst: 0, igst: 0 });

      const clientMap = {};
      archive.forEach(inv => {
        const name = inv.buyer?.name || "Cash Sale";
        if (!clientMap[name]) clientMap[name] = { billed: 0, paid: 0, outstanding: 0, invoices: [] };
        
        const invTotal = (inv.items || []).reduce((sum, item) => {
          const qty = parseFloat(item.qty) || 0;
          const rate = parseFloat(item.rate) || 0;
          const disc = parseFloat(item.discount) || 0;
          const taxable = (qty * rate) * (1 - disc / 100);
          const gst = taxable * (parseFloat(item.gstRate || 18) / 100);
          return sum + taxable + gst;
        }, 0);

        clientMap[name].billed += invTotal;
        if (inv.paidStatus === "paid") {
          clientMap[name].paid += invTotal;
        } else {
          clientMap[name].outstanding += invTotal;
        }
        clientMap[name].invoices.push({ ...inv, total: invTotal });
      });

      const sortedClients = Object.entries(clientMap)
        .map(([name, data]) => ({ name, ...data }))
        .sort((a, b) => b.outstanding - a.outstanding);

      const totalRevenue = archive.reduce((sum, inv) => {
        return sum + (inv.items || []).reduce((s, it) => {
          const qty = parseFloat(it.qty) || 0;
          const rate = parseFloat(it.rate) || 0;
          const disc = parseFloat(it.discount) || 0;
          const taxable = (qty * rate) * (1 - disc / 100);
          const gst = taxable * (parseFloat(it.gstRate || 18) / 100);
          return sum + taxable + gst;
        }, 0);
      }, 0);

      const totalExpenses = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);
      const totalOutstanding = archive.filter(inv => inv.paidStatus !== "paid").reduce((sum, inv) => {
        return sum + (inv.items || []).reduce((s, it) => {
          const qty = parseFloat(it.qty) || 0;
          const rate = parseFloat(it.rate) || 0;
          const disc = parseFloat(it.discount) || 0;
          const taxable = (qty * rate) * (1 - disc / 100);
          const gst = taxable * (parseFloat(it.gstRate || 18) / 100);
          return sum + taxable + gst;
        }, 0);
      }, 0);

      setStats({
        totals,
        count: monthlyData.length,
        monthName: now.toLocaleString('default', { month: 'long' }),
        recentInvoices: monthlyData.slice(0, 5),
        pendingInvoices: archive.filter(inv => inv.paidStatus !== "paid").slice(0, 5),
        clientBalances: sortedClients,
        totalRevenue,
        totalExpenses,
        totalOutstanding,
        netProfit: totalRevenue - totalExpenses
      });
      setLoadingStats(false);
    };
    loadStats();
  }, [user, expenses]);

  const handleMarkAsPaid = async (inv) => {
    if (user) {
       try {
         const ref = doc(db, "users", user.uid, "invoices", inv.id || inv.invoiceNum);
         await setDoc(ref, { paidStatus: "paid" }, { merge: true });
         alert("Status updated in cloud!");
         setStats(prev => ({
           ...prev,
           pendingInvoices: prev.pendingInvoices.filter(i => i.invoiceNum !== inv.invoiceNum)
         }));
       } catch (err) {
         console.error("Update failed:", err);
       }
    } else {
      const archive = getLocalArchive();
      const idx = archive.findIndex(i => i.invoiceNum === inv.invoiceNum);
      if (idx >= 0) {
        archive[idx].paidStatus = "paid";
        localStorage.setItem("bk_invoice_archive", JSON.stringify(archive));
        alert("Status updated locally!");
        setStats(prev => ({
          ...prev,
          pendingInvoices: prev.pendingInvoices.filter(i => i.invoiceNum !== inv.invoiceNum)
        }));
      }
    }
  };

  const handleViewInvoice = (inv) => {
     // For now just alert, but could be a more complex view logic
     alert(`Viewing Invoice #${inv.invoiceNum}`);
  };

  if (loadingStats) return <div style={{ padding: "100px 0", textAlign: "center", color: "#8899aa" }}>
    <div className="pulse-match" style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
    <div>Crunching your business data...</div>
  </div>;

  if (stats.count === 0) return (
    <div style={{ padding: "80px 20px", textAlign: "center" }}>
      <div style={{ fontSize: 48, marginBottom: 20 }}>📈</div>
      <h3 style={{ color: "#e8edf2", marginBottom: 12 }}>No data for {stats.monthName} yet</h3>
      <p style={{ color: "#8899aa", maxWidth: 400, margin: "0 auto 24px" }}>Start creating invoices to see your monthly GST breakdown and sales analytics here.</p>
      <button style={S.btnPrimary} onClick={() => setStep("form")}>Create First Invoice</button>
    </div>
  );

  return (
    <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16 }}>
        <div>
          <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Business Intelligence</div>
          <h2 style={{ color: "#e8edf2", fontSize: 28, margin: 0 }}>{stats.monthName} Summary</h2>
        </div>
        <div style={{ color: "#8899aa", fontSize: 13 }}>Year: {new Date().getFullYear()}</div>
      </div>
      
      <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
        <StatCard title="Total Revenue" value={fmt(stats.totalRevenue)} icon="💰" color="#d4af37" />
        <StatCard title="Total Expenses" value={fmt(stats.totalExpenses)} icon="💸" color="#ef4444" />
        <StatCard title="Net Profit" value={fmt(stats.netProfit)} icon="📈" color="#14b8a6" />
        <StatCard title="Outstanding" value={fmt(stats.totalOutstanding)} icon="⏳" color="#f59e0b" />
        <StatCard title="Invoices" value={stats.count} icon="📝" color="#a78bfa" />
      </div>

      <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 24, padding: 32, position: "relative", overflow: "hidden" }}>
        <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.03, pointerEvents: "none" }}>🏛️</div>
        <h3 style={{ color: "#e8edf2", marginBottom: 8, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
           GST Settlement Breakdown
           <span style={{ fontSize: 10, background: "rgba(212,175,55,0.1)", color: "#d4af37", padding: "2px 8px", borderRadius: 10 }}>GSTR-1 READY</span>
        </h3>
        <p style={{ color: "#8899aa", fontSize: 13, marginBottom: 24 }}>Use these values to file your monthly returns on the GST portal.</p>
        
        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
          <BreakdownBox label="CGST (Central Tax)" value={`₹${stats.totals.cgst.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
          <BreakdownBox label="SGST (State Tax)" value={`₹${stats.totals.sgst.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
          <BreakdownBox label="IGST (Inter-State)" value={`₹${stats.totals.igst.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
        </div>

        <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "right" }}>
           <button 
              style={{ ...S.btnSecondary, fontSize: 12, padding: "8px 20px" }}
              onClick={() => {
                const text = `GST Summary for ${stats.monthName}:\nTaxable: ₹${stats.totals.taxable.toFixed(2)}\nCGST: ₹${stats.totals.cgst.toFixed(2)}\nSGST: ₹${stats.totals.sgst.toFixed(2)}\nIGST: ₹${stats.totals.igst.toFixed(2)}\nTotal GST: ₹${stats.totals.gstTotal.toFixed(2)}`;
                navigator.clipboard.writeText(text);
                alert("Summary copied to clipboard!");
              }}
           >📋 Copy Summary for CA</button>
        </div>
      </div>

      {/* PARTY LEDGER / CLIENT BALANCES */}
      <div style={{ marginTop: 40 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
          <h3 style={{ color: "#e8edf2", fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
            👤 Party Outstanding
            <span style={{ fontSize: 11, color: "#8899aa", fontWeight: 400 }}>(Statement of Account)</span>
          </h3>
        </div>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>PARTY NAME</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>TOTAL BILLED</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>PAID</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", color: "#f87171", fontWeight: 600 }}>OUTSTANDING</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {stats.clientBalances.slice(0, 10).map((client, idx) => (
                  <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td style={{ padding: "12px 16px", color: "#e8edf2", fontWeight: 600 }}>{client.name}</td>
                    <td style={{ padding: "12px 16px", color: "#8899aa", textAlign: "right" }}>₹{client.billed.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#34d399", textAlign: "right" }}>₹{client.paid.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", color: "#f87171", textAlign: "right", fontWeight: 700 }}>₹{client.outstanding.toLocaleString()}</td>
                    <td style={{ padding: "12px 16px", textAlign: "center" }}>
                       <button 
                         style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                         onClick={() => {
                           const ledgerText = `Statement for ${client.name}:\nTotal Billed: ₹${client.billed.toFixed(2)}\nTotal Paid: ₹${client.paid.toFixed(2)}\nOutstanding Balance: ₹${client.outstanding.toFixed(2)}\n\nThank you!\n- ${seller.name}`;
                           const url = `https://wa.me/${client.invoices[0]?.buyer?.phone?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(ledgerText)}`;
                           window.open(url, "_blank");
                         }}
                       >
                         📲 Ledger
                       </button>
                     </td>
                  </tr>
                ))}
                {stats.clientBalances.length === 0 && (
                  <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>No parties found in records.</td></tr>
                )}
              </tbody>
           </table>
        </div>
      </div>

      {/* Pending Payments Reminders */}
      {stats.pendingInvoices.length > 0 && (
        <div style={{ marginTop: 40, background: "rgba(248,113,113,0.03)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 24, padding: 24 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: "#f87171", fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              🚨 Pending Payments 
              <span style={{ fontSize: 11, background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "2px 8px", borderRadius: 10 }}>{stats.pendingInvoices.length} ACTION NEEDED</span>
            </h3>
          </div>
          
          <div style={{ display: "grid", gap: 12 }}>
            {(stats.pendingInvoices || []).map((inv, idx) => {
              const total = (inv.items || []).reduce((sum, item) => {
                const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                return sum + taxable + (taxable * (parseFloat(item.gstRate) / 100));
              }, 0);
              return (
                <div key={idx} style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                  <div style={{ flex: 1 }}>
                     <div style={{ color: "#e8edf2", fontWeight: 700, fontSize: 14 }}>{inv.buyer?.name || "Cash Sale"}</div>
                     <div style={{ color: "#8899aa", fontSize: 12 }}>#{inv.invoiceNum} · {inv.invoiceDate}</div>
                  </div>
                  <div style={{ textAlign: "right" }}>
                     <div style={{ color: "#f87171", fontWeight: 700, fontSize: 15 }}>₹{total.toLocaleString()}</div>
                     <div style={{ color: "#8899aa", fontSize: 10 }}>DUE NOW</div>
                  </div>
                  <div style={{ display: "flex", gap: 8 }}>
                     <button 
                       style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#8899aa", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                       onClick={() => handleMarkAsPaid(inv)}
                     >✅ Done</button>
                     <button 
                       style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                       onClick={() => handleViewInvoice(inv)}
                     >👁️ View</button>
                     <button 
                       style={{ background: "#25D366", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                       onClick={() => {
                         const msg = `Hi ${inv.buyer?.name},\n\nThis is a friendly reminder for Invoice #${inv.invoiceNum} of ₹${total.toFixed(2)} which is currently pending. \n\nPlease let us know when we can expect the payment.\n\nThank you!\n- ${inv.seller?.name || "BillKaro User"}`;
                         const url = `https://wa.me/${inv.buyer?.phone?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(msg)}`;
                         window.open(url, "_blank");
                       }}
                     >💬 Remind</button>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Recent Invoices Table */}
      <div style={{ marginTop: 40 }}>
        <h3 style={{ color: "#e8edf2", fontSize: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
          Recent Activity 
          <span style={{ fontSize: 11, color: "#8899aa", fontWeight: 400 }}>(Showing last 5)</span>
        </h3>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
           <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>INV #</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>CLIENT</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>DATE</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>AMOUNT</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>STATUS</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>ACTION</th>
                </tr>
              </thead>
              <tbody>
                {(stats.recentInvoices || []).map((inv, idx) => {
                  const total = (inv.items || []).reduce((sum, item) => {
                    const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                    return sum + taxable + (taxable * (parseFloat(item.gstRate) / 100));
                  }, 0);
                  return (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} className="dashboard-row">
                      <td style={{ padding: "12px 16px", color: "#d4af37", fontWeight: 600 }}>{inv.invoiceNum}</td>
                      <td style={{ padding: "12px 16px", color: "#e8edf2" }}>{inv.buyer?.name || "Cash Sale"}</td>
                      <td style={{ padding: "12px 16px", color: "#8899aa" }}>{inv.invoiceDate}</td>
                      <td style={{ padding: "12px 16px", color: "#e8edf2", textAlign: "right", fontWeight: 600 }}>
                        ₹{total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                        <span style={{ 
                          fontSize: 10, 
                          padding: "2px 8px", 
                          borderRadius: 20, 
                          background: inv.paidStatus === "paid" ? "rgba(52,211,153,0.1)" : "rgba(248,113,113,0.1)", 
                          color: inv.paidStatus === "paid" ? "#34d399" : "#f87171",
                          fontWeight: 700,
                          textTransform: "uppercase"
                        }}>
                          {inv.paidStatus || "unpaid"}
                        </span>
                      </td>
                      <td style={{ padding: "12px 16px", textAlign: "center" }}>
                         <button 
                           style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                           onClick={() => handleViewInvoice(inv)}
                         >
                           👁️ View/Print
                         </button>
                       </td>
                    </tr>
                  );
                })}
              </tbody>
           </table>
        </div>
      </div>

      <div style={{ marginTop: 40, background: "rgba(20,184,166,0.05)", borderRadius: 16, padding: 20, border: "1px dashed rgba(20,184,166,0.3)", display: "flex", alignItems: "center", gap: 16 }}>
         <div style={{ fontSize: 24 }}>💡</div>
         <div style={{ flex: 1 }}>
           <div style={{ color: "#e8edf2", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Pro Tip: Tax Season?</div>
           <div style={{ color: "#8899aa", fontSize: 12 }}>You've saved {stats.totals.igst > 0 ? "IGST" : "local"} sales this month. Download the GSTR-1 JSON for your CA.</div>
         </div>
         <div style={{ display: "flex", gap: 10 }}>
            <button style={{ ...S.btnSecondary, padding: "8px 16px", fontSize: 12 }} onClick={() => generateGSTR1(seller)}>📂 GSTR-1 JSON</button>
            <button style={{ ...S.btnTeal, padding: "8px 16px", fontSize: 12 }} onClick={() => generateArchive()}>Export XLSX</button>
         </div>
      </div>
    </div>
  );
};

const ExpensesView = ({ user, dbPro, plan, expenses, setExpenses, expenseForm, setExpenseForm, today, handleLogout, setShowLogin, S }) => {
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount) return alert("Enter amount");
    const newExp = { ...expenseForm, id: Date.now() };
    setExpenses([newExp, ...expenses]);
    setExpenseForm({ category: "Stock Purchase", amount: "", date: today(), notes: "" });
  };

  const removeExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 60px" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32 }}>
        <div>
          <h2 style={{ color: "#e8edf2", fontSize: 28, margin: 0 }}>💸 Expense Tracker</h2>
          <div style={{ color: "#8899aa", fontSize: 13, marginTop: 4 }}>Keep your cashflow healthy</div>
        </div>
        <div style={{ textAlign: "right", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "8px 20px", borderRadius: 12 }}>
          <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 800, textTransform: "uppercase" }}>Total Spending</div>
          <div style={{ fontSize: 24, color: "#ef4444", fontWeight: 800 }}>₹{totalSpend.toLocaleString()}</div>
        </div>
      </div>

      <div style={{ ...S.card, background: "rgba(20, 184, 166, 0.05)", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
        <form onSubmit={handleAddExpense} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, alignItems: "flex-end" }}>
          <div>
            <label style={S.label}>Category</label>
            <select style={S.select} value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
              {["Stock Purchase", "Rent", "Salary", "Electricity", "Tea/Lunch", "Travel", "Marketing", "Other"].map(c => <option key={c}>{c}</option>)}
            </select>
          </div>
          <div>
            <label style={S.label}>Amount (₹)</label>
            <input type="number" style={S.input} placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
          </div>
          <div>
            <label style={S.label}>Date</label>
            <input type="date" style={S.input} value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
          </div>
          <div>
            <label style={S.label}>Notes</label>
            <input style={S.input} placeholder="e.g. 50kg cotton" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} />
          </div>
          <button style={{ ...S.btnTeal, height: 44, fontSize: 14, fontWeight: 700 }} type="submit">➕ Add Expense</button>
        </form>
      </div>

      <div style={{ marginTop: 32 }}>
        <h3 style={{ color: "#e8edf2", fontSize: 18, marginBottom: 16 }}>Recent Expenses</h3>
        <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
          <table style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
            <thead>
              <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa" }}>DATE</th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa" }}>CATEGORY</th>
                <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa" }}>NOTES</th>
                <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa" }}>AMOUNT</th>
                <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa" }}></th>
              </tr>
            </thead>
            <tbody>
              {(expenses || []).map(e => (
                <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "12px 16px", color: "#8899aa" }}>{e.date}</td>
                  <td style={{ padding: "12px 16px", color: "#e8edf2", fontWeight: 600 }}>{e.category}</td>
                  <td style={{ padding: "12px 16px", color: "#8899aa" }}>{e.notes}</td>
                  <td style={{ padding: "12px 16px", color: "#ef4444", textAlign: "right", fontWeight: 700 }}>₹{Number(e.amount).toFixed(2)}</td>
                  <td style={{ padding: "12px 16px", textAlign: "center" }}>
                    <button 
                      style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.5 }} 
                      onClick={() => { if(confirm("Delete this expense?")) removeExpense(e.id); }}
                    >✕</button>
                  </td>
                </tr>
              ))}
              {(expenses || []).length === 0 && (
                <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: "#445566" }}>No expenses recorded yet.</td></tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default function App() {
  // ── Core state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState("form");
  const [invoiceNum, setInvoiceNum] = useState(invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [supplyType, setSupplyType] = useState("intra");
  const [docType, setDocType] = useState("Tax Invoice"); // Tax Invoice, Quotation, Proforma, Delivery Challan
  const [invoicePrefix, setInvoicePrefix] = useState("INV-");
  const [watermark, setWatermark] = useState(""); // PAID, DRAFT, CANCELLED, DUPLICATE
  const [notes, setNotes] = useState("Thank you for your business!");
  const [errors, setErrors] = useState({});
  const [paidStatus, setPaidStatus] = useState("unpaid"); // unpaid | paid
  const previewRef = useRef();
  const { generateArchive, generateGSTR1, exporting } = useArchiveExport();
  const [archiveCount, setArchiveCount] = useState(0);
  const [sessionSavedIds, setSessionSavedIds] = useState(new Set()); // track current session saves to avoid double counting
  const [saveToast, setSaveToast] = useState(false);
  const [expenses, setExpenses] = useState(() => loadJSON("bk_expenses", [])); // NEW: Expense Tracking state
  const [expenseForm, setExpenseForm] = useState({ category: "Stock Purchase", amount: "", date: today(), notes: "" });

  // ── Saved profiles ───────────────────────────────────────────────────────────
  const [savedSeller, setSavedSeller] = useState(() => loadJSON("bk_seller", null));
  const [savedClients, setSavedClients] = useState(() => loadJSON("bk_clients", []));

  // ── Seller / Buyer ────────────────────────────────────────────────────────────
  const [seller, setSeller] = useState(savedSeller || { name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "", bankName: "", accountNum: "", ifsc: "", upi: "" });
  const [sellerLogo, setSellerLogo] = useState("");
  const [sellerSignature, setSellerSignature] = useState("");

  useEffect(() => {
    // ── Load Settings from LocalStorage ───────────────────────────────────────
    const savedSupply = localStorage.getItem("bk_supply_type");
    if (savedSupply) setSupplyType(savedSupply);

    const savedDocType = localStorage.getItem("bk_doc_type");
    if (savedDocType) setDocType(savedDocType);

    const savedPrefix = localStorage.getItem("bk_inv_prefix");
    if (savedPrefix) setInvoicePrefix(savedPrefix);

    const savedWatermark = localStorage.getItem("bk_watermark");
    if (savedWatermark) setWatermark(savedWatermark);

    const savedLogo = localStorage.getItem("bk_seller_logo");
    if (savedLogo) setSellerLogo(savedLogo);

    const savedSig = localStorage.getItem("bk_seller_sig");
    if (savedSig) setSellerSignature(savedSig);
  }, []);
  const [buyer, setBuyer] = useState({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });

  useEffect(() => {
    localStorage.setItem("bk_supply_type", supplyType);
  }, [supplyType]);

  // ── Smart GST Logic: Auto-detect Supply Type ──────────────────────────────
  useEffect(() => {
    const sState = seller.state?.trim().toLowerCase();
    const bState = buyer.state?.trim().toLowerCase();

    if (sState && bState) {
      if (sState === bState) {
        setSupplyType("intra");
      } else {
        setSupplyType("inter");
      }
    }
  }, [seller.state, buyer.state]);

  useEffect(() => {
    localStorage.setItem("bk_doc_type", docType);
  }, [docType]);

  useEffect(() => {
    localStorage.setItem("bk_inv_prefix", invoicePrefix);
  }, [invoicePrefix]);

  useEffect(() => {
    localStorage.setItem("bk_watermark", watermark);
  }, [watermark]);

  useEffect(() => {
    localStorage.setItem("bk_seller_logo", sellerLogo);
  }, [sellerLogo]);

  useEffect(() => {
    localStorage.setItem("bk_seller_sig", sellerSignature);
  }, [sellerSignature]);

  useEffect(() => {
    saveJSON("bk_expenses", expenses);
  }, [expenses]);

  const [showUpiQr, setShowUpiQr] = useState(true);

  const handleLogoUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 500) { // 500KB limit for localStorage safety
        alert("Logo is too large. Please use a file smaller than 500KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSellerLogo(reader.result);
      reader.readAsDataURL(file);
    }
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 1024 * 300) { // 300KB limit for signature
        alert("Signature is too large. Please use a file smaller than 300KB.");
        return;
      }
      const reader = new FileReader();
      reader.onloadend = () => setSellerSignature(reader.result);
      reader.readAsDataURL(file);
    }
  };

  // ── Items ─────────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([emptyItem()]);

  // ── Smart History Lookup ──────────────────────────────────────────────────────
  const { suggestion, warnings, saveToHistory, applySuggestion, clearBuyerHistory, hasHistory } = useHistoryLookup({ buyer, seller, items, supplyType });

  // ── Payment / plan ────────────────────────────────────────────────────────────
  // ── Firebase Auth & Pro Status ───────────────────────────────────────────────
  const [plan, setPlan] = useState(() => localStorage.getItem("bk_plan") || "free");
  const [invoiceCount, setInvoiceCount] = useState(() => parseInt(localStorage.getItem("bk_count") || "0", 10));
  const [user, setUser] = useState(null);
  const [dbPro, setDbPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null);

  // Daily Allowance Logic (Claude Model)
  const [dailyCount, setDailyCount] = useState(() => {
    const saved = localStorage.getItem("bk_daily_v1");
    if (!saved) return 0;
    try {
      const { date, count } = JSON.parse(saved);
      if (date !== new Date().toDateString()) return 0;
      return count;
    } catch { return 0; }
  });

  useEffect(() => {
    localStorage.setItem("bk_daily_v1", JSON.stringify({
      date: new Date().toDateString(),
      count: dailyCount
    }));
  }, [dailyCount]);

  // ── Razorpay Logic (Moved up for visibility in Effects) ────────────────────────
  const openRazorpay = (selectedPlan) => {
    if (!window.Razorpay) return alert("Payment gateway not loaded. Please refresh.");
    
    // CRITICAL: Force login BEFORE payment to ensure the account is linked
    if (!user) {
      setTargetPlan(selectedPlan);
      setShowLogin(true);
      return;
    }

    const amount = selectedPlan === "business" ? 39900 : 14900;
    const desc = selectedPlan === "business" ? "Business Plan — ₹399/month" : "Pro Plan — ₹149/month";
    
    const options = {
      key: RAZORPAY_KEY,
      amount,
      currency: "INR",
      name: "BillKaro",
      description: desc,
      handler: async (response) => {
        await syncProStatus(user.uid, selectedPlan, response);
        localStorage.setItem("bk_plan", selectedPlan);
        setPlan(selectedPlan);
        setStep("preview");
      },
      prefill: { name: seller.name, email: seller.email, contact: seller.phone },
      theme: { color: "#d4af37" },
    };
    new window.Razorpay(options).open();
  };

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) setDbPro(false);
    });
    return unsub;
  }, []);

  useEffect(() => {
    if (!user) return;
    const unsub = onSnapshot(doc(db, "users", user.uid), (docSnap) => {
      if (docSnap.exists()) {
        const data = docSnap.data();
        setDbPro(!!data.isPro);
        if (data.isPro) {
          localStorage.setItem("bk_plan", data.plan || "pro");
          setPlan(data.plan || "pro");
        } else {
          // If Firestore says NOT pro, override local storage
          localStorage.setItem("bk_plan", "free");
          setPlan("free");
        }
      } else {
        // New user or no data: default to free
        setDbPro(false);
        localStorage.setItem("bk_plan", "free");
        setPlan("free");
      }
    });
    return unsub;
  }, [user]);

  // Auto-close login modal if user is detected (failsafe for popup internal crashes)
  useEffect(() => {
    if (user && showLogin) {
      setShowLogin(false);
    }
  }, [user, showLogin]);

  // Trigger Razorpay after login if they were in the middle of upgrading
  useEffect(() => {
    if (user && targetPlan && !loading) {
      const p = targetPlan;
      setTargetPlan(null); // Clear it first to prevent loops
      openRazorpay(p);
    }
  }, [user, targetPlan, loading]);

  // Only consider them Pro if the cloud says so (if logged in) or the local plan is pro (if guest)
  const isPro = user ? dbPro : (plan === "pro" || plan === "business");
  const isBusiness = user ? (plan === "business" && dbPro) : (plan === "business");
  
  // High-value guest logic: 3 free invoices with NO watermark
  // Show watermark only if: Not Pro AND (Logged in Free OR Out of Guest Invoices)
  const showWatermark = !isPro; // Simpler for Beta: keep watermark for free users to spread the brand

  const dailyLeft = Math.max(0, DAILY_FREE_LIMIT - dailyCount);
  const canDownload = isPro || dailyLeft > 0;

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem("bk_plan");
    setPlan("free");
    setDbPro(false);
  };

  const handleGoogleLogin = async (setAuthLoading, setAuthError) => {
    console.log("APP_LOG: handleGoogleLogin - START");
    console.log("APP_LOG: Auth state:", { auth: !!auth, provider: !!googleProvider });
    if (setAuthLoading) {
      console.log("APP_LOG: Setting loading state");
      setAuthLoading(true);
    }
    if (setAuthError) setAuthError("");
    
    try {
      console.log("APP_LOG: Invoking signInWithPopup...");
      if (!auth || !googleProvider) throw new Error("Firebase Auth or Google Provider not initialized!");
      
      const result = await signInWithPopup(auth, googleProvider);
      console.log("APP_LOG: Google Popup Success:", result.user.email);
      
      setUser(result.user);
      setShowLogin(false);
      
      // Handle the target plan logic
      const target = localStorage.getItem("bk_target_plan") || targetPlan;
      if (target && target !== "free") {
        console.log("Post-login: Triggering payment for", target);
        setTimeout(() => openRazorpay(target), 500);
      }
    } catch (err) {
      console.error("Google Login Error:", err);
      if (setAuthError) setAuthError(`Google Login failed: ${err.message}`);
      // Fallback to redirect if popup is blocked
      if (err.code === 'auth/popup-blocked') {
        console.log("Popup blocked, falling back to redirect...");
        localStorage.setItem("bk_target_plan", targetPlan || "free");
        localStorage.setItem("bk_redirect_step", step || "form");
        await signInWithRedirect(auth, googleProvider);
      }
    } finally {
      if (setAuthLoading) setAuthLoading(false);
    }
  };

  const syncProStatus = async (uid, selectedPlan, paymentDetails = null) => {
    const isActuallyPaid = !!(paymentDetails && paymentDetails.razorpay_payment_id);
    
    const updateData = {
      plan: selectedPlan || "free",
      updatedAt: new Date().toISOString()
    };

    if (isActuallyPaid) {
      updateData.isPro = true;
      updateData.paymentId = paymentDetails.razorpay_payment_id;
      updateData.orderId = paymentDetails.razorpay_order_id;
      setDbPro(true);
    }

    await setDoc(doc(db, "users", uid), updateData, { merge: true });
  };

  // Initialize/Sync archive count from Source of Truth
  useEffect(() => {
    if (loading) return; // Wait for Firebase Auth to settle

    if (user) {
      // Sync from Firestore
      const q = query(collection(db, "users", user.uid, "invoices"));
      getDocs(q).then(snap => {
        setArchiveCount(snap.size);
      }).catch(err => {
        console.error("Archive sync error:", err);
        // Fallback to local if Firestore fails (rare)
        setArchiveCount(getLocalArchive().length);
      });
    } else {
      // Sync from Guest LocalStorage
      setArchiveCount(getLocalArchive().length);
    }
  }, [user, loading]);

  const refreshCount = () => {
    if (user) {
      const q = query(collection(db, "users", user.uid, "invoices"));
      getDocs(q).then(snap => setArchiveCount(snap.size));
    } else {
      setArchiveCount(getLocalArchive().length);
    }
  };
  // ── Calculations ──────────────────────────────────────────────────────────────
  const calcItem = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const disc = parseFloat(item.discount) || 0;
    const taxable = (qty * rate) * (1 - disc / 100);
    const gstAmt = taxable * (item.gstRate / 100);
    return { taxable, gstAmt, total: taxable + gstAmt };
  };
  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    acc.taxable += c.taxable; acc.gst += c.gstAmt; acc.total += c.total;
    return acc;
  }, { taxable: 0, gst: 0, total: 0 });

  // ── Item helpers ──────────────────────────────────────────────────────────────
  const updateItem = (id, field, val) => setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  // ── Save seller profile ───────────────────────────────────────────────────────
  const handleSaveSeller = () => {
    saveJSON("bk_seller", seller);
    setSavedSeller(seller);
    alert("✅ Business profile saved!");
  };

  // ── Save / load client ────────────────────────────────────────────────────────
  const handleSaveClient = () => {
    if (!buyer.name) return alert("Enter client name first");
    const exists = savedClients.findIndex(c => c.name === buyer.name);
    let updated;
    if (exists >= 0) { updated = savedClients.map((c, i) => i === exists ? buyer : c); }
    else { updated = [...savedClients, buyer]; }
    setSavedClients(updated);
    saveJSON("bk_clients", updated);
    alert(`✅ Client "${buyer.name}" saved!`);
  };
  const handleLoadClient = (name) => {
    const client = savedClients.find(c => c.name === name);
    if (client) setBuyer(client);
  };
  const handleDeleteClient = (name) => {
    const updated = savedClients.filter(c => c.name !== name);
    setSavedClients(updated);
    saveJSON("bk_clients", updated);
  };

  // ── Validation ────────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!seller.name) e.sellerName = true;
    if (!seller.gstin || seller.gstin.length < 5) e.sellerGstin = true; // Relaxed for easier testing
    if (seller.phone && !/^\d{10}$/.test(seller.phone)) e.sellerPhone = true;
    if (!buyer.name) e.buyerName = true;
    if (buyer.phone && !/^\d{10}$/.test(buyer.phone)) e.buyerPhone = true;
    if (items.some(i => !i.desc || !i.rate)) e.items = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handlePreview = async () => {
    if (!validate()) {
      alert("Validation failed. Please check the highlighted fields (Name, Item descriptions/rates) and ensure Phone is 10 digits and GSTIN is valid.");
      return;
    }
    // ── Save snapshot to Master Archive ────────────────────────────────────
    const snapshot = {
      invoiceNum, invoiceDate, dueDate, supplyType, paidStatus, notes,
      seller: { ...seller },
      buyer:  { ...buyer },
      items:  items.map(i => ({ ...i })),
      createdAt: new Date().toISOString(),
    };
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid, "invoices", invoiceNum), snapshot);
      } catch (err) {
        console.error("Error saving preview snapshot:", err);
      }
    } else {
      saveToLocalArchive(snapshot);
    }
    saveToHistory(snapshot);
    refreshCount();
    setStep("preview");
  };

  // ── New Invoice — fresh ID + full form reset ───────────────────────────────
  const handleNewInvoice = () => {
    setInvoiceNum(invoiceNo());           // brand-new unique invoice number
    setInvoiceDate(today());
    setDueDate("");
    setSupplyType("intra");
    setNotes("Thank you for your business!");
    setPaidStatus("unpaid");
    setBuyer({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });
    setItems([emptyItem()]);
    setErrors({});
    setStep("form");
  };

  // ── Save & Next — save to archive, reset form, no preview needed ────────────
  const handleSaveAndNext = async () => {
    if (!validate()) {
      alert("Validation failed. Please check the highlighted fields (Name, Item descriptions/rates) and ensure Phone is 10 digits and GSTIN is valid.");
      return;
    }
    const snapshot = {
      invoiceNum, invoiceDate, dueDate, supplyType, paidStatus, notes,
      seller: { ...seller },
      buyer:  { ...buyer },
      items:  items.map(i => ({ ...i })),
      createdAt: new Date().toISOString(),
    };
    if (auth.currentUser) {
      try {
        await setDoc(doc(db, "users", auth.currentUser.uid, "invoices", invoiceNum), snapshot);
      } catch (err) {
        console.error("Error saving to Firestore:", err);
      }
    } else {
      saveToLocalArchive(snapshot);
    }
    saveToHistory(snapshot);
    refreshCount();
    // Reset form with fresh invoice number
    setInvoiceNum(invoiceNo());
    setInvoiceDate(today());
    setDueDate("");
    setSupplyType("intra");
    setNotes("Thank you for your business!");
    setPaidStatus("unpaid");
    setBuyer({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });
    setItems([emptyItem()]);
    setErrors({});
    // Show confirmation toast briefly
    setSaveToast(true);
    setTimeout(() => setSaveToast(false), 3000);
  };

  // ── View Invoice from History ──────────────────────────────────────────────
  const handleViewInvoice = (inv) => {
    setInvoiceNum(inv.invoiceNum);
    setInvoiceDate(inv.invoiceDate);
    setDueDate(inv.dueDate || "");
    setSupplyType(inv.supplyType || "intra");
    setPaidStatus(inv.paidStatus || "unpaid");
    setNotes(inv.notes || "");
    setSeller(inv.seller);
    setBuyer(inv.buyer);
    setItems(inv.items);
    setStep("preview");
    window.scrollTo(0, 0);
  };

  // ── WhatsApp share ────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const text = `*TAX INVOICE — ${invoiceNum}*\n\n*From:* ${seller.name}\n*To:* ${buyer.name}\n*Date:* ${invoiceDate}\n*Amount:* ${fmt(totals.total)}\n*Status:* ${paidStatus === "paid" ? "✅ PAID" : "⏳ PAYMENT PENDING"}\n\nGenerated via BillKaro — billkaro-sand.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ── WhatsApp share ────────────────────────────────────────────────────────────


  const doDownload = () => {
    saveToHistory({
      invoiceNum, invoiceDate, dueDate,
      buyer, seller, items, supplyType,
      total: totals.total,
      paidStatus,
    });
    if (!isPro) {
      setDailyCount(prev => prev + 1);
    }
    window.print();
  };

  useEffect(() => {
    const processRedirect = async () => {
      try {
        console.log("Checking for redirect result...");
        const result = await getRedirectResult(auth);
        
        if (result?.user) {
          alert(`Success! Logged in as: ${result.user.email}`);
          setUser(result.user);
          await syncProStatus(result.user.uid);
          
          const savedStep = localStorage.getItem("bk_redirect_step");
          const savedTarget = localStorage.getItem("bk_target_plan");
          
          if (savedStep) setStep(savedStep);
          if (savedTarget === "pro") {
            localStorage.removeItem("bk_target_plan");
            setTimeout(() => openRazorpay("pro"), 1000);
          }
          localStorage.removeItem("bk_redirect_step");
        } else {
          console.log("No redirect result found on this load.");
        }
      } catch (error) {
        console.error("Redirect Result Error:", error);
        alert(`Auth Error: ${error.message}\nCode: ${error.code}`);
      }
    };
    processRedirect();
  }, []);

  const handlePaywall = () => {
    if (isPro) { doDownload(); return; }
    if (dailyLeft > 0) { doDownload(); return; }
    setStep("upgrade");
  };






  // ── UPGRADE PAGE ──────────────────────────────────────────────────────────────
  if (step === "upgrade") return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>

      <div style={S.header}>
        <div style={S.logo}>⬡ BillKaro</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...S.badge, borderColor: (PLANS[plan]?.color || "#8899aa") + "88", color: PLANS[plan]?.color || "#8899aa" }}>
            {(PLANS[plan]?.label || "Free").toUpperCase()} PLAN
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#e8edf2", fontSize: 12, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
                <div style={{ color: "#d4af37", fontSize: 10 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
              </div>
              <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button style={{ ...S.btnSecondary, padding: "6px 16px", fontSize: 12 }} onClick={() => { setTargetPlan("pro"); setShowLogin(true); }}>
              Login
            </button>
          )}
          <button style={S.btnSecondary} onClick={() => setStep("preview")}>← Back</button>
        </div>
      </div>


      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 20px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ background: "rgba(212,175,55,0.1)", color: "#d4af37", display: "inline-block", padding: "4px 12px", borderRadius: 20, fontSize: 11, fontWeight: 700, marginBottom: 16 }}>
            EARLY ACCESS • FOUNDER'S LAUNCH
          </div>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#d4af37", marginBottom: 12 }}>
            You've hit the Daily Limit
          </div>
          <div style={{ color: "#8899aa", fontSize: 15, maxWidth: 400, margin: "0 auto" }}>
            Free users get 10 invoices every 24 hours. Resetting tomorrow morning!
          </div>
        </div>

        <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(260px, 1fr))", gap: 24 }}>
          {/* Free */}
          <div style={{ ...S.card, borderColor: "rgba(136,153,170,0.3)", opacity: 0.6 }} className="hover-card">
            <div style={{ color: "#8899aa", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>FREE</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e8edf2", marginBottom: 4 }}>₹0</div>
            <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 20 }}>3 invoices total</div>
            {["3 invoices", "Basic template", "BillKaro watermark"].map(f => (
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
            {["Unlimited invoices", "No watermark", "3 premium templates", "Save client profiles", "WhatsApp sharing", "Payment tracking"].map(f => (
              <div key={f} style={{ color: "#e8edf2", fontSize: 13, marginBottom: 8 }}>✓ {f}</div>
            ))}
            <button style={{ ...S.btnPrimary, width: "100%", marginTop: 20 }} onClick={() => openRazorpay("pro")}>
              Upgrade to Pro →
            </button>
          </div>
          <div style={{ ...S.card, borderColor: "rgba(20,184,166,0.4)", background: "rgba(20,184,166,0.04)" }} className="hover-card">
            <div style={{ color: "#14b8a6", fontWeight: 700, fontSize: 13, marginBottom: 8 }}>BUSINESS</div>
            <div style={{ fontSize: 28, fontWeight: 800, color: "#e8edf2", marginBottom: 4 }}>₹399<span style={{ fontSize: 13, fontWeight: 400 }}>/mo</span></div>
            <div style={{ color: "#8899aa", fontSize: 12, marginBottom: 20 }}>For agencies & CAs</div>
            {["Everything in Pro", "5 team members", "Business logo", "Recurring invoices", "Payment reports", "Priority support"].map(f => (
              <div key={f} style={{ color: "#e8edf2", fontSize: 13, marginBottom: 8 }}>✓ {f}</div>
            ))}
            <button style={{ ...S.btnTeal, width: "100%", marginTop: 20 }} onClick={() => openRazorpay("business")}>
              Upgrade to Business →
            </button>
          </div>
        </div>

        <div style={{ textAlign: "center", marginTop: 32, color: "#8899aa", fontSize: 12 }}>
          🔒 Secure payment via Razorpay · Cancel anytime · GST invoice provided
        </div>
      </div>
    </div>
  );



  // ── LOADING GUARD ─────────────────────────────────────────────────────────────
  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div style={{ textAlign: "center" }}>
        <style>{`
          @keyframes pulse-gold {
            0% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.6; transform: scale(1); }
          }
          .pulse-match { animation: pulse-gold 2s infinite ease-in-out; }
        `}</style>
        <div className="pulse-match" style={{ fontSize: 48, marginBottom: 20 }}>⬡</div>
        <div style={{ color: "#d4af37", fontWeight: 700, letterSpacing: 2 }}>BILLKARO</div>
        <div style={{ color: "#8899aa", fontSize: 12, marginTop: 8 }}>Securing your session...</div>
      </div>
    </div>
  );

  // ── RENDER ROUTING ───────────────────────────────────────────────────────────

  if (step === "dashboard") return (
    <ErrorBoundary>
      <div style={S.page}>
        <style>{`
          @keyframes pulse-gold {
            0% { opacity: 0.6; transform: scale(1); }
            50% { opacity: 1; transform: scale(1.05); }
            100% { opacity: 0.6; transform: scale(1); }
          }
          .pulse-match { animation: pulse-gold 2s infinite ease-in-out; }
        `}</style>
        <div style={S.header} className="bk-header">
          <div style={S.logo}>⬡ BillKaro</div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginRight: 8 }}>
              <button style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("form")}>📝 Create</button>
              <button style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("expenses")}>💸 Expenses</button>
              <button style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("dashboard")}>📊 Insights</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user ? (
              <div style={{ textAlign: "right", marginRight: 8 }}>
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

        <div style={{ padding: "40px 0" }}>
          <DashboardView 
            user={user} 
            dbPro={dbPro}
            plan={plan}
            expenses={expenses} 
            seller={seller} 
            setStep={setStep} 
            getLocalArchive={getLocalArchive} 
            generateArchive={generateArchive} 
            generateGSTR1={generateGSTR1}
            handleLogout={handleLogout}
            setShowLogin={setShowLogin}
            fmt={fmt} 
            S={S}
          />
        </div>
      </div>
    </ErrorBoundary>
  );

  // ── EXPENSES ──────────────────────────────────────────────────────────────────
  if (step === "expenses") return (
    <ErrorBoundary>
      <div style={S.page}>
        <div style={S.header} className="bk-header">
          <div style={S.logo}>⬡ BillKaro</div>
          <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginRight: 8 }}>
              <button style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("form")}>📝 Create</button>
              <button style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("expenses")}>💸 Expenses</button>
              <button style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("dashboard")}>📊 Insights</button>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
            {user ? (
              <div style={{ textAlign: "right", marginRight: 8 }}>
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

        <div style={{ padding: "40px 0" }}>
          <ExpensesView 
            expenses={expenses} 
            setExpenses={setExpenses} 
            expenseForm={expenseForm} 
            setExpenseForm={setExpenseForm} 
            today={today}
            S={S}
          />
        </div>
      </div>
    </ErrorBoundary>
  );



  // ── FORM ──────────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <ErrorBoundary>
      <InvoiceFormView 
        step={step} setStep={setStep} isPro={isPro} plan={plan} dailyLeft={dailyLeft} user={user} dbPro={dbPro}
        invoiceNum={invoiceNum} invoiceDate={invoiceDate} setInvoiceDate={setInvoiceDate}
        dueDate={dueDate} setDueDate={setDueDate} supplyType={supplyType} setSupplyType={setSupplyType}
        paidStatus={paidStatus} setPaidStatus={setPaidStatus} docType={docType} setDocType={setDocType}
        invoicePrefix={invoicePrefix} setInvoicePrefix={setInvoicePrefix} watermark={watermark} setWatermark={setWatermark}
        showUpiQr={showUpiQr} setShowUpiQr={setShowUpiQr} seller={seller} setSeller={setSeller}
        sellerLogo={sellerLogo} setSellerLogo={setSellerLogo} sellerSignature={sellerSignature} setSellerSignature={setSellerSignature}
        handleLogoUpload={handleLogoUpload} handleSignatureUpload={handleSignatureUpload}
        handleSaveSeller={handleSaveSeller} savedSeller={savedSeller} buyer={buyer} setBuyer={setBuyer}
        errors={errors} suggestion={suggestion} applySuggestion={applySuggestion} warnings={warnings}
        savedClients={savedClients} handleLoadClient={handleLoadClient} handleDeleteClient={handleDeleteClient}
        clearBuyerHistory={clearBuyerHistory} hasHistory={hasHistory} handleSaveClient={handleSaveClient}
        items={items} updateItem={updateItem} removeItem={removeItem} addItem={addItem}
        calcItem={calcItem} totals={totals} archiveCount={archiveCount}
        handleSaveAndNext={handleSaveAndNext} handlePreview={handlePreview}
        generateArchive={generateArchive} exporting={exporting} saveToast={saveToast}
        handleLogout={handleLogout} setShowLogin={setShowLogin} showLogin={showLogin}
        targetPlan={targetPlan} setTargetPlan={setTargetPlan} setPlan={setPlan}
        syncProStatus={syncProStatus} openRazorpay={openRazorpay} setUser={setUser} fmt={fmt} STATES={STATES} GST_RATES={GST_RATES}
        PLANS={PLANS} S={S} notes={notes} setNotes={setNotes}
      />
    </ErrorBoundary>
  );

  // ── PREVIEW ───────────────────────────────────────────────────────────────────
  return (
    <div>

      <style>{`
        @media screen {
          .print-actions {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            background: rgba(15,25,35,0.92); backdrop-filter: blur(12px);
            border-bottom: 1px solid rgba(212,175,55,0.3);
            padding: 12px 32px; display: flex; align-items: center; gap: 10px;
            flex-wrap: wrap;
          }
          .invoice-wrap { max-width: 860px; margin: 80px auto 60px; padding: 0 20px; }
        }
        @media (max-width: 600px) {
          .print-actions { padding: 10px 12px; gap: 6px; }
          .print-actions button { font-size: 11px !important; padding: 7px 10px !important; }
          .invoice-wrap { margin: 76px 8px 20px !important; }
        }
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-actions { display: none !important; }
          .invoice-wrap { 
            margin: 0 !important; 
            padding: 10mm 15mm !important; 
            width: 100% !important;
            max-width: none !important;
          }
          .invoice-wrap > div {
             box-shadow: none !important;
             border: 1px solid #f0f0f0 !important;
             border-radius: 0 !important;
          }
          .watermark { display: block !important; }
        }
        * { box-sizing: border-box; }
        .watermark { display: none; }
      `}</style>

      {/* Toolbar */}
      <div className="print-actions">
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", fontSize: 18, marginRight: 16 }}>⬡ BillKaro</div>
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginRight: "auto" }}>
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
        
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 10 }}>
            <div style={{ textAlign: "right", lineHeight: 1 }}>
              <div style={{ color: "#e8edf2", fontSize: 11, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
              <div style={{ color: "#d4af37", fontSize: 9 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btnSecondary, fontSize: 12, padding: "6px 12px", marginRight: 10 }} onClick={() => setShowLogin(true)}>Login</button>
        )}

        <button style={{ ...S.btnSecondary, fontSize: 13, padding: "8px 20px" }} onClick={() => setStep("form")}>← Back</button>
        <button
          style={{ ...S.btnSecondary, fontSize: 13, padding: "8px 20px", background: "rgba(52,211,153,0.12)", color: "#34d399", borderColor: "rgba(52,211,153,0.4)" }}
          onClick={handleNewInvoice}
          title="Save current invoice and start a fresh one with a new invoice number"
        >✚ New Invoice</button>
        <button style={{ ...S.btnTeal, padding: "10px 20px", fontSize: 13 }} onClick={handleWhatsApp}>
          📲 WhatsApp
        </button>
        {canDownload ? (
          <button style={{ ...S.btnPrimary, padding: "10px 28px", fontSize: 14 }} onClick={handlePaywall}>
            {isPro ? "⬇ Download PDF" : `⬇ Download PDF (${dailyLeft} daily left)`}
          </button>
        ) : (
          <button style={{ ...S.btnPrimary, padding: "10px 28px", fontSize: 14, background: "linear-gradient(135deg, #b8860b, #d4af37)" }} onClick={() => setStep("upgrade")}>
            🔒 Upgrade to Pro — ₹149
          </button>
        )}
      </div>

      {showLogin && <AuthModal setShowLogin={setShowLogin} setUser={setUser} targetPlan={targetPlan} setTargetPlan={setTargetPlan} setPlan={setPlan} syncProStatus={syncProStatus} openRazorpay={openRazorpay} handleGoogleLogin={handleGoogleLogin} user={user} />}


      {/* Invoice */}
      <div 
        className="invoice-wrap no-copy" 
        ref={previewRef} 
        onContextMenu={(e) => e.preventDefault()}
        onCopy={(e) => { e.preventDefault(); alert("⚠️ Professional Copy Protection Active: Text selection and copying are disabled to protect invoice integrity."); }}
        onCut={(e) => e.preventDefault()}
        onPaste={(e) => e.preventDefault()}
        onDragStart={(e) => e.preventDefault()}
      >
        <div style={{ background: "white", borderRadius: 4, boxShadow: "0 20px 80px rgba(0,0,0,0.4)", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", position: "relative" }}>

          {/* Smart Watermarking Logic */}
          {(() => {
            const isOverdue = paidStatus === "unpaid" && dueDate && new Date(dueDate) < new Date(today());
            const activeWatermark = watermark || (isOverdue ? "OVERDUE" : (showWatermark ? "BILLKARO FREE" : ""));
            
            if (!activeWatermark) return null;

            return (
              <div className="watermark" style={{ 
                position: "absolute", 
                top: "50%", 
                left: "50%", 
                transform: "translate(-50%,-50%) rotate(-30deg)", 
                fontSize: (activeWatermark === "OVERDUE" || watermark) ? 120 : 64, 
                fontWeight: 900, 
                color: isOverdue && !watermark ? "rgba(239,68,68,0.08)" : "rgba(212,175,55,0.08)", 
                pointerEvents: "none", 
                whiteSpace: "nowrap", 
                zIndex: 0, 
                fontFamily: "'Playfair Display', serif",
                ...( (watermark || isOverdue) ? { border: `10px solid ${isOverdue && !watermark ? "rgba(239,68,68,0.08)" : "rgba(212,175,55,0.08)"}`, padding: "20px 60px", borderRadius: 30 } : {})
              }}>
                {activeWatermark}
              </div>
            );
          })()}

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a3a5c 100%)", padding: "24px 48px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {sellerLogo && <img src={sellerLogo} alt="Logo" style={{ height: 60, maxWidth: 200, objectFit: "contain", alignSelf: "flex-start", marginBottom: 8 }} />}
              <div>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#d4af37", marginBottom: 2, textTransform: "uppercase" }}>{docType}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>#{invoicePrefix}{invoiceNum}</div>
                <div style={{ marginTop: 8, display: "inline-block", background: paidStatus === "paid" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", border: `1px solid ${paidStatus === "paid" ? "#22c55e" : "#f59e0b"}`, color: paidStatus === "paid" ? "#22c55e" : "#f59e0b", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                  {paidStatus === "paid" ? "✅ PAID" : "⏳ PENDING"}
                </div>
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "white", marginBottom: 4, textTransform: "uppercase" }}>{seller.name || "Your Business"}</div>
              {seller.gstin && <div style={{ fontSize: 12, color: "#d4af37" }}>GSTIN: {seller.gstin}</div>}
              {seller.address && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{seller.address}</div>}
              {seller.city && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.city}, {seller.state} {seller.pin}</div>}
              {seller.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.email}</div>}
              {seller.phone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.phone}</div>}
            </div>
          </div>

          {/* Meta */}
          <div style={{ background: "#f8f9fa", padding: "12px 48px", display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e9ecef" }}>
            {[["Invoice Date", invoiceDate], ["Due Date", dueDate || "On Receipt"], ["Supply Type", supplyType === "intra" ? "Intra-State" : "Inter-State"]].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{lbl}</div>
                <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2d45" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Billed by/to */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "16px 48px", gap: 32, borderBottom: "1px solid #e9ecef" }}>
            {[["Billed By", seller], ["Billed To", buyer]].map(([lbl, data]) => (
              <div key={lbl}>
                <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{lbl}</div>
                <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2d45", marginBottom: 2, textTransform: "capitalize" }}>{data.name || "—"}</div>
                {data.gstin && <div style={{ fontSize: 11, color: "#555" }}>GSTIN: {data.gstin}</div>}
                <div style={{ fontSize: 11, color: "#555", lineHeight: "1.2", textTransform: "capitalize" }}>
                  {data.address && <span>{data.address}, </span>}
                  {data.city && <span>{data.city}, {data.state} {data.pin}</span>}
                </div>
                {data.phone && <div style={{ fontSize: 11, color: "#555" }}>{data.phone}</div>}
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ padding: "0 48px 20px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
              <thead>
                <tr style={{ background: "#0f1923" }}>
                  {["#", "Description", "Qty", "Rate", "Disc %", "GST %", ...(supplyType === "intra" ? ["CGST", "SGST"] : ["IGST"]), "Total"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", color: "#d4af37", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textAlign: h === "Description" ? "left" : h === "#" ? "center" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const c = calcItem(item);
                  return (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? "white" : "#f8f9fa" }}>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#888", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 500, textTransform: "capitalize" }}>{item.desc}</td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.qty}</td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{parseFloat(item.rate || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.discount || 0}%</td>
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.gstRate}%</td>
                      {supplyType === "intra" ? (
                        <>
                          <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </>
                      ) : (
                        <td style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{c.gstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      )}
                      <td style={{ padding: "8px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 700, textAlign: "right" }}>{fmt(c.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
              <div style={{ width: 240 }}>
                {[["Taxable Amount", fmt(totals.taxable)], ...(supplyType === "intra" ? [["CGST", fmt(totals.gst / 2)], ["SGST", fmt(totals.gst / 2)]] : [["IGST", fmt(totals.gst)]])].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #e9ecef" }}>
                    <span style={{ color: "#555", fontSize: 12 }}>{lbl}</span>
                    <span style={{ color: "#333", fontSize: 12 }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", background: "#0f1923", padding: "10px 14px", marginTop: 6, borderRadius: 4 }}>
                  <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 13 }}>TOTAL DUE</span>
                  <span style={{ color: "#d4af37", fontWeight: 800, fontSize: 16 }}>{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Payment & Signatory Section */}
          <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", padding: "0 48px 24px", gap: 32, marginTop: 12, breakInside: "avoid" }}>
            <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: 8, border: "1px solid #e9ecef", display: "flex", gap: 16 }}>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>Bank & Payment Details</div>
                <div style={{ display: "grid", gap: 6 }}>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#777" }}>Bank Name:</span>
                    <span style={{ color: "#333", fontWeight: 600, textTransform: "uppercase" }}>{seller.bankName || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#777" }}>Account No:</span>
                    <span style={{ color: "#333", fontWeight: 600 }}>{seller.accountNum || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                    <span style={{ color: "#777" }}>IFSC Code:</span>
                    <span style={{ color: "#333", fontWeight: 600 }}>{seller.ifsc || "—"}</span>
                  </div>
                  <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: "1px dashed #ddd" }}>
                    <span style={{ color: "#777" }}>UPI ID:</span>
                    <span style={{ color: "#d4af37", fontWeight: 700 }}>{seller.upi || "—"}</span>
                  </div>
                </div>
              </div>
              
              {showUpiQr && seller.upi && (
                <div style={{ textAlign: "center", borderLeft: "1px solid #eee", paddingLeft: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                  <div style={{ fontSize: 8, fontWeight: 800, color: "#1a3a5c", marginBottom: 4, textTransform: "uppercase" }}>Scan to Pay</div>
                  <img 
                    src={`https://quickchart.io/qr?text=${encodeURIComponent(`upi://pay?pa=${seller.upi}&pn=${encodeURIComponent(seller.name)}&am=${totals.total}&cu=INR&tn=${encodeURIComponent(`${docType} ${invoicePrefix}${invoiceNum}`)}`)}&size=150&centerImageUrl=https://upload.wikimedia.org/wikipedia/commons/e/e1/UPI-Logo-vector.png`}
                    alt="Payment QR"
                    style={{ width: 80, height: 80, border: "4px solid white", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", borderRadius: 4 }}
                  />
                  <div style={{ fontSize: 9, color: "#1a3a5c", marginTop: 4, fontWeight: 700 }}>₹{totals.total.toLocaleString()}</div>
                </div>
              )}
            </div>

            <div style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
              <div style={{ fontSize: 12, color: "#1a2d45", fontWeight: 800, textTransform: "uppercase", marginBottom: sellerSignature ? 4 : 45, letterSpacing: "0.03em" }}>
                For {seller.name || "Your Business"}
              </div>
              {sellerSignature && (
                <div style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                  <img src={sellerSignature} alt="Signature" style={{ maxHeight: 50, maxWidth: 150, objectFit: "contain" }} />
                </div>
              )}
              <div>
                <div style={{ height: 1, background: "#1a2d45", width: "100%", marginBottom: 8 }}></div>
                <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2d45" }}>Authorized Signatory</div>
                <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>This is a computer generated invoice</div>
              </div>
            </div>
          </div>

          {notes && (
            <div style={{ padding: "10px 48px", background: "#f8f9fa", borderTop: "1px solid #e9ecef" }}>
              <div style={{ fontSize: 10, color: "#888", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</div>
              <div style={{ fontSize: 12, color: "#444", lineHeight: "1.3" }}>{notes}</div>
            </div>
          )}

          <div style={{ background: "rgba(15, 25, 35, 0.03)", padding: "10px 48px", textAlign: "center", fontSize: 9, color: "#8899aa", borderTop: "1px solid #e9ecef", letterSpacing: "0.05em" }}>
            Generated with <span style={{ color: "#d4af37", fontWeight: 700 }}>BillKaro</span> · Secure GST Compliant Digital Invoice
          </div>
        </div>
      </div>
    </div>
  );
}