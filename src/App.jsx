import { useState, useRef, useEffect } from "react";
import { useArchiveExport, saveToLocalArchive, getLocalArchive } from "./hooks/useArchiveExport";
import { auth, db, googleProvider } from "./lib/firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  sendPasswordResetEmail
} from "firebase/auth";
import { doc, getDoc, setDoc, onSnapshot } from "firebase/firestore";


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

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const invoiceNo = () => "INV-" + Date.now().toString().slice(-6);
const emptyItem = () => ({ id: Date.now(), desc: "", qty: 1, rate: "", gstRate: 18 });

const FREE_LIMIT = 3;
const RAZORPAY_KEY = "rzp_live_Satm4gnMnwdY91";

// ── localStorage helpers ───────────────────────────────────────────────────────
const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
const saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));

// ── Plans ─────────────────────────────────────────────────────────────────────
const PLANS = {
  free: { label: "Free", price: 0, invoices: 3, color: "#8899aa" },
  pro: { label: "Pro", price: 149, invoices: Infinity, color: "#d4af37" },
  business: { label: "Business", price: 399, invoices: Infinity, color: "#14b8a6" },
};

export default function App() {
  // ── Core state ───────────────────────────────────────────────────────────────
  const [step, setStep] = useState("form");
  const [invoiceNum, setInvoiceNum] = useState(invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [supplyType, setSupplyType] = useState("intra");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [errors, setErrors] = useState({});
  const [paidStatus, setPaidStatus] = useState("unpaid"); // unpaid | paid
  const previewRef = useRef();
  const { generateArchive, exporting } = useArchiveExport();
  const [archiveCount, setArchiveCount] = useState(() => getLocalArchive().length);
  const [saveToast, setSaveToast] = useState(false);

  // ── Saved profiles ───────────────────────────────────────────────────────────
  const [savedSeller, setSavedSeller] = useState(() => loadJSON("bk_seller", null));
  const [savedClients, setSavedClients] = useState(() => loadJSON("bk_clients", []));

  // ── Seller / Buyer ────────────────────────────────────────────────────────────
  const [seller, setSeller] = useState(savedSeller || { name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });
  const [buyer, setBuyer] = useState({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });

  // ── Items ─────────────────────────────────────────────────────────────────────
  const [items, setItems] = useState([emptyItem()]);

  // ── Payment / plan ────────────────────────────────────────────────────────────
  // ── Firebase Auth & Pro Status ───────────────────────────────────────────────
  const [plan, setPlan] = useState(() => localStorage.getItem("bk_plan") || "free");
  const [invoiceCount, setInvoiceCount] = useState(() => parseInt(localStorage.getItem("bk_count") || "0", 10));
  const [user, setUser] = useState(null);
  const [dbPro, setDbPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [showLogin, setShowLogin] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null);

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

  // Only consider them Pro if the cloud says so (if logged in) or the local plan is pro (if guest)
  const isPro = user ? dbPro : (plan === "pro" || plan === "business");
  const isBusiness = user ? (plan === "business" && dbPro) : (plan === "business");
  
  // High-value guest logic: 3 free invoices with NO watermark
  // Show watermark only if: Not Pro AND (Logged in Free OR Out of Guest Invoices)
  const showWatermark = !isPro && (user || invoiceCount >= FREE_LIMIT);

  const freeLeft = Math.max(0, FREE_LIMIT - invoiceCount);
  const canDownload = isPro || (freeLeft > 0 && !user);

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem("bk_plan");
    setPlan("free");
    setDbPro(false);
  };

  const syncProStatus = async (uid, selectedPlan) => {
    await setDoc(doc(db, "users", uid), {
      isPro: true,
      plan: selectedPlan,
      updatedAt: new Date().toISOString()
    }, { merge: true });
    setDbPro(true);
  };


  // ── Calculations ──────────────────────────────────────────────────────────────
  const calcItem = (item) => {
    const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
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
    if (!seller.gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(seller.gstin)) e.sellerGstin = true;
    if (!buyer.name) e.buyerName = true;
    if (items.some(i => !i.desc || !i.rate)) e.items = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };
  const handlePreview = () => {
    if (!validate()) return;
    // ── Save snapshot to Master Archive ────────────────────────────────────
    const snapshot = {
      invoiceNum, invoiceDate, dueDate, supplyType, paidStatus, notes,
      seller: { ...seller },
      buyer:  { ...buyer },
      items:  items.map(i => ({ ...i })),
      createdAt: new Date().toISOString(),
    };
    if (auth.currentUser) {
      // Firestore save (fire-and-forget — doesn't block UI)
      setDoc(
        doc(db, "users", auth.currentUser.uid, "invoices", invoiceNum),
        snapshot
      ).catch(console.error);
    } else {
      saveToLocalArchive(snapshot);
    }
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
  const handleSaveAndNext = () => {
    if (!validate()) return;
    const snapshot = {
      invoiceNum, invoiceDate, dueDate, supplyType, paidStatus, notes,
      seller: { ...seller },
      buyer:  { ...buyer },
      items:  items.map(i => ({ ...i })),
      createdAt: new Date().toISOString(),
    };
    if (auth.currentUser) {
      setDoc(
        doc(db, "users", auth.currentUser.uid, "invoices", invoiceNum),
        snapshot
      ).catch(console.error);
    } else {
      saveToLocalArchive(snapshot);
    }
    const newCount = getLocalArchive().length;
    setArchiveCount(newCount);
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

  // ── WhatsApp share ────────────────────────────────────────────────────────────
  const handleWhatsApp = () => {
    const text = `*TAX INVOICE — ${invoiceNum}*\n\n*From:* ${seller.name}\n*To:* ${buyer.name}\n*Date:* ${invoiceDate}\n*Amount:* ${fmt(totals.total)}\n*Status:* ${paidStatus === "paid" ? "✅ PAID" : "⏳ PAYMENT PENDING"}\n\nGenerated via BillKaro — billkaro-sand.vercel.app`;
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  // ── Razorpay ──────────────────────────────────────────────────────────────────
  // ── Razorpay ──────────────────────────────────────────────────────────────────
  const openRazorpay = (selectedPlan) => {
    if (!window.Razorpay) return alert("Payment gateway not loaded. Please refresh.");
    const amount = selectedPlan === "business" ? 39900 : 14900;
    const desc = selectedPlan === "business" ? "Business Plan — ₹399/month" : "Pro Plan — ₹149/month";
    
    const options = {
      key: RAZORPAY_KEY,
      amount,
      currency: "INR",
      name: "BillKaro",
      description: desc,
      handler: async (response) => {
        if (user) {
          await syncProStatus(user.uid, selectedPlan);
          localStorage.setItem("bk_plan", selectedPlan);
          setPlan(selectedPlan);
          setStep("preview");
        } else {
          // If not logged in, show login modal and remember the plan
          setTargetPlan(selectedPlan);
          setShowLogin(true);
        }
      },
      prefill: { name: seller.name, email: seller.email, contact: seller.phone },
      theme: { color: "#d4af37" },
    };
    new window.Razorpay(options).open();
  };


  const doDownload = () => {
    if (!isPro) {
      const n = invoiceCount + 1;
      setInvoiceCount(n);
      localStorage.setItem("bk_count", String(n));
    }
    window.print();
  };

  const handlePaywall = () => {
    if (isPro) { doDownload(); return; }
    if (freeLeft > 0) { doDownload(); return; }
    setStep("upgrade");
  };

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

  // ── Auth Modal (Email & Google) ─────────────────────────────────────────────
  const AuthModal = () => {
    const [email, setEmail] = useState("");
    const [password, setPassword] = useState("");
    const [isSignup, setIsSignup] = useState(false);
    const [authLoading, setAuthLoading] = useState(false);

    const [authError, setAuthError] = useState("");

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
        await handleAuthSuccess(result.user);
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

    const handleGoogleLogin = async () => {
      setAuthLoading(true);
      try {
        const result = await signInWithPopup(auth, googleProvider);
        await handleAuthSuccess(result.user);
      } catch (err) {
        console.error(err);
        alert(`Google Login failed: ${err.code}`);
      } finally {
        setAuthLoading(false);
      }
    };

    const handleAuthSuccess = async (user) => {
      if (targetPlan) {
        await syncProStatus(user.uid, targetPlan);
        localStorage.setItem("bk_plan", targetPlan);
        setPlan(targetPlan);
      }
      setShowLogin(false);
      setTargetPlan(null);
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

          <button 
            type="button"
            style={{ ...S.btnSecondary, width: "100%", background: "white", color: "#0f1923", border: "none", display: "flex", alignItems: "center", justifyContent: "center", gap: 10, fontWeight: 700, height: 48, borderRadius: 10 }}
            onClick={handleGoogleLogin}
            disabled={authLoading}
          >
            <img src="https://www.gstatic.com/firebasejs/ui/2.0.0/images/auth/google.svg" width="20" alt="G" />
            Continue with Google
          </button>

          <div style={{ display: "flex", alignItems: "center", gap: 12, margin: "24px 0" }}>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", flex: 1 }}></div>
            <div style={{ color: "#445566", fontSize: 11, fontWeight: 700, letterSpacing: "0.1em" }}>OR EMAIL</div>
            <div style={{ height: 1, background: "rgba(255,255,255,0.1)", flex: 1 }}></div>
          </div>

          <form onSubmit={onEmailSubmit}>
            {authError && <div style={{ color: "#ef4444", fontSize: 13, textAlign: "center", marginBottom: 16 }}>⚠️ {authError}</div>}

            <div style={{ marginBottom: 16 }}>
              <label style={S.label}>Email Address</label>
              <input style={S.input} type="email" autoFocus placeholder="name@company.com" value={email} onChange={e => { setEmail(e.target.value); setAuthError(""); }} />
            </div>
            
            <div style={{ marginBottom: 8 }}>
              <div style={{ display: "flex", justifyContent: "space-between" }}>
                <label style={S.label}>Password</label>
                {!isSignup && (
                  <button type="button" onClick={handleForgotPassword} style={{ background: "none", border: "none", color: "#8899aa", fontSize: 11, cursor: "pointer", textDecoration: "underline" }}>
                    Forgot Password?
                  </button>
                )}
              </div>
              <input style={S.input} type="password" placeholder="••••••••" value={password} onChange={e => { setPassword(e.target.value); setAuthError(""); }} />
            </div>

            <button style={{ ...S.btnPrimary, width: "100%", height: 48, borderRadius: 10, fontSize: 15, marginTop: 24 }} type="submit" disabled={authLoading}>
              {authLoading ? "One moment..." : (isSignup ? "Create Free Account →" : "Sign In →")}
            </button>

            <div style={{ textAlign: "center", marginTop: 20 }}>
              <button 
                type="button"
                style={{ background: "none", border: "none", color: "#8899aa", fontSize: 13, cursor: "pointer", textDecoration: "underline" }}
                onClick={() => setIsSignup(!isSignup)}
              >
                {isSignup ? "Already have an account? Log In" : "Don't have an account? Sign Up"}
              </button>
            </div>
          </form>
        </div>
      </div>
    );
  };


  // ── UPGRADE PAGE ──────────────────────────────────────────────────────────────
  if (step === "upgrade") return (
    <div style={{ ...S.page, display: "flex", flexDirection: "column" }}>
      <div style={S.header}>
        <div style={S.logo}>⬡ BillKaro</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...S.badge, borderColor: PLANS[plan].color + "88", color: PLANS[plan].color }}>
            {PLANS[plan].label.toUpperCase()} PLAN
          </div>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#e8edf2", fontSize: 12, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
                <div style={{ color: "#d4af37", fontSize: 10 }}>Pro Account</div>
              </div>
              <button style={{ background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.1)", color: "#8899aa", padding: "6px 12px", borderRadius: 6, fontSize: 11, cursor: "pointer" }} onClick={handleLogout}>Logout</button>
            </div>
          ) : (
            <button style={{ ...S.btnSecondary, padding: "6px 16px", fontSize: 12 }} onClick={() => setShowLogin(true)}>
              Login
            </button>
          )}
          <button style={S.btnSecondary} onClick={() => setStep("preview")}>← Back</button>
        </div>
      </div>
      {showLogin && <AuthModal />}

      <div style={{ maxWidth: 800, margin: "60px auto", padding: "0 20px", width: "100%" }}>
        <div style={{ textAlign: "center", marginBottom: 48 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#d4af37", marginBottom: 12 }}>
            Upgrade BillKaro
          </div>
          <div style={{ color: "#8899aa", fontSize: 15 }}>
            You've used your 3 free invoices. Upgrade to keep going.
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

          {/* Business */}
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

  // ── FORM ──────────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <div style={S.page}>
      <style>{`
        @media print { body { display: none; } }
        input:focus, select:focus { border-color: rgba(212,175,55,1) !important; background: rgba(255,255,255,0.08) !important; box-shadow: 0 0 15px rgba(212,175,55,0.2); }
        input::placeholder { color: #445566; }
        textarea::placeholder { color: #445566; }
        .custom-date::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(1) saturate(5) hue-rotate(5deg); cursor: pointer; }
      `}</style>

      <div style={S.header} className="bk-header">
        <div style={S.logo}>⬡ BillKaro</div>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...S.badge, borderColor: PLANS[plan].color + "88", color: PLANS[plan].color }}>
            {PLANS[plan].label.toUpperCase()} PLAN
          </div>
          {!isPro && <div style={{ color: "#8899aa", fontSize: 12 }}>{freeLeft} free invoice{freeLeft !== 1 ? "s" : ""} left</div>}
        </div>
        
        <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
          {user ? (
            <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
              <div style={{ textAlign: "right" }}>
                <div style={{ color: "#e8edf2", fontSize: 12, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
                <div style={{ color: "#d4af37", fontSize: 10 }}>Pro Account</div>
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

      {showLogin && <AuthModal />}


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

        {/* Seller & Buyer */}
        <div className="grid-responsive-2" style={{ marginBottom: 24 }}>

          {/* Seller */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#d4af37" }}>Seller Details</div>
              <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11 }} onClick={handleSaveSeller}>
                💾 Save Profile
              </button>
            </div>
            {savedSeller && (
              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: "#d4af37", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>✓ Saved: {savedSeller.name}</span>
                <button style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer", fontSize: 11 }} onClick={() => setSeller(savedSeller)}>Load →</button>
              </div>
            )}
            {[["Business Name *", "name", "text", errors.sellerName], ["GSTIN *", "gstin", "text", errors.sellerGstin], ["Address", "address", "text", false], ["City", "city", "text", false], ["PIN Code", "pin", "text", false], ["Email", "email", "email", false], ["Phone", "phone", "tel", false]].map(([lbl, field, type, hasErr]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={S.label}>{lbl}</label>
                <input type={type} style={{ ...S.input, ...(hasErr ? { borderColor: "#ef4444" } : {}) }}
                  placeholder={field === "gstin" ? "27AAPFU0939F1ZV" : ""}
                  value={seller[field]} onChange={e => setSeller({ ...seller, [field]: e.target.value })} />
                {hasErr && <div style={S.errText}>{field === "gstin" ? "Enter valid 15-digit GSTIN" : "Required"}</div>}
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>State</label>
              <select style={S.select} value={seller.state} onChange={e => setSeller({ ...seller, state: e.target.value })}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>

          {/* Buyer */}
          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#d4af37" }}>Buyer Details</div>
              <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11 }} onClick={handleSaveClient}>
                💾 Save Client
              </button>
            </div>

            {/* Saved clients dropdown */}
            {savedClients.length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Load Saved Client</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ ...S.select, flex: 1 }} onChange={e => handleLoadClient(e.target.value)} defaultValue="">
                    <option value="" disabled>Select client…</option>
                    {savedClients.map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {savedClients.map(c => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 8px" }}>
                      <span style={{ fontSize: 11, color: "#8899aa" }}>{c.name}</span>
                      <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: 0 }} onClick={() => handleDeleteClient(c.name)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {[["Business Name *", "name", "text", errors.buyerName], ["GSTIN", "gstin", "text", false], ["Address", "address", "text", false], ["City", "city", "text", false], ["PIN Code", "pin", "text", false], ["Email", "email", "email", false], ["Phone", "phone", "tel", false]].map(([lbl, field, type, hasErr]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={S.label}>{lbl}</label>
                <input type={type} style={{ ...S.input, ...(hasErr ? { borderColor: "#ef4444" } : {}) }}
                  value={buyer[field]} onChange={e => setBuyer({ ...buyer, [field]: e.target.value })} />
                {hasErr && <div style={S.errText}>Required</div>}
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>State</label>
              <select style={S.select} value={buyer.state} onChange={e => setBuyer({ ...buyer, state: e.target.value })}>
                {STATES.map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        {/* Items */}
        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>📦</span> Items / Services</div>
          {errors.items && <div style={{ ...S.errText, marginBottom: 16, background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: 8 }}>⚠️ Fill all item descriptions and rates</div>}
          <div className="scroll-container">
            <div style={{ display: "grid", gridTemplateColumns: "minmax(200px, 3fr) 80px 120px 100px 110px 40px", gap: 12, marginBottom: 12, minWidth: 700 }}>
            {["Description", "Qty", "Rate (₹)", "GST %", "Amount", ""].map(h => (
              <div key={h} style={{ ...S.label, marginBottom: 0, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</div>
            ))}
          </div>
          {items.map((item, idx) => {
            const c = calcItem(item);
            return (
              <div key={item.id} style={{ display: "grid", gridTemplateColumns: "minmax(200px, 3fr) 80px 120px 100px 110px 40px", gap: 12, marginBottom: 12, alignItems: "center", minWidth: 700 }}>
                <input style={S.input} placeholder={`Item ${idx + 1}`} value={item.desc} onChange={e => updateItem(item.id, "desc", e.target.value)} />
                <input type="number" style={S.input} min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} />
                <input type="number" style={S.input} placeholder="0.00" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
                <select style={S.select} value={item.gstRate} onChange={e => updateItem(item.id, "gstRate", Number(e.target.value))}>
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
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
            onClick={() => generateArchive({
              invoiceNum, invoiceDate, dueDate, supplyType, paidStatus,
              buyer: { ...buyer }, seller: { ...seller },
              items: items.map(i => ({ ...i })),
              createdAt: new Date().toISOString(),
            })}
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
        <button style={{ ...S.btnSecondary, flex: 1, fontSize: 11 }} onClick={handleSaveAndNext}>💾 Save &amp; Next</button>
        <button style={{ ...S.btnPrimary, flex: 2 }} onClick={handlePreview}>Preview →</button>
      </div>
    </div>
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
          .print-actions { display: none !important; }
          .invoice-wrap  { margin: 0; padding: 0; }
          body { background: white !important; }
          .watermark { display: block !important; }
        }
        * { box-sizing: border-box; }
        .watermark { display: none; }
      `}</style>

      {/* Toolbar */}
      <div className="print-actions">
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", fontSize: 18, marginRight: "auto" }}>⬡ BillKaro</div>
        <div style={{ ...S.badge, borderColor: PLANS[plan].color + "88", color: PLANS[plan].color, fontSize: 10 }}>{PLANS[plan].label}</div>
        
        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 10 }}>
            <div style={{ textAlign: "right", lineHeight: 1 }}>
              <div style={{ color: "#e8edf2", fontSize: 11, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
              <div style={{ color: "#d4af37", fontSize: 9 }}>Logged In</div>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btnSecondary, fontSize: 12, padding: "6px 12px", marginRight: 10 }} onClick={() => setShowLogin(true)}>Login</button>
        )}

        <button style={{ ...S.btnSecondary, fontSize: 13, padding: "8px 20px" }} onClick={() => setStep("form")}>← Edit</button>
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
            {isPro ? "⬇ Download PDF" : `⬇ Download PDF (${freeLeft} free left)`}
          </button>
        ) : (
          <button style={{ ...S.btnPrimary, padding: "10px 28px", fontSize: 14, background: "linear-gradient(135deg, #b8860b, #d4af37)" }} onClick={() => setStep("upgrade")}>
            🔒 Upgrade to Pro — ₹149
          </button>
        )}
      </div>

      {showLogin && <AuthModal />}


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

          {/* Watermark for free/exhausted users */}
          {showWatermark && (
            <div className="watermark" style={{ position: "absolute", top: "50%", left: "50%", transform: "translate(-50%,-50%) rotate(-30deg)", fontSize: 64, fontWeight: 900, color: "rgba(212,175,55,0.08)", pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0, fontFamily: "'Playfair Display', serif" }}>
              BILLKARO FREE
            </div>
          )}

          {/* Header */}
          <div style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a3a5c 100%)", padding: "40px 48px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#d4af37", marginBottom: 4 }}>TAX INVOICE</div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>#{invoiceNum}</div>
              {/* Paid badge */}
              <div style={{ marginTop: 12, display: "inline-block", background: paidStatus === "paid" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", border: `1px solid ${paidStatus === "paid" ? "#22c55e" : "#f59e0b"}`, color: paidStatus === "paid" ? "#22c55e" : "#f59e0b", padding: "4px 14px", borderRadius: 20, fontSize: 12, fontWeight: 700 }}>
                {paidStatus === "paid" ? "✅ PAID" : "⏳ PAYMENT PENDING"}
              </div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "white", marginBottom: 4 }}>{seller.name || "Your Business"}</div>
              {seller.gstin && <div style={{ fontSize: 12, color: "#d4af37" }}>GSTIN: {seller.gstin}</div>}
              {seller.address && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{seller.address}</div>}
              {seller.city && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.city}, {seller.state} {seller.pin}</div>}
              {seller.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.email}</div>}
              {seller.phone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.phone}</div>}
            </div>
          </div>

          {/* Meta */}
          <div style={{ background: "#f8f9fa", padding: "16px 48px", display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e9ecef" }}>
            {[["Invoice Date", invoiceDate], ["Due Date", dueDate || "On Receipt"], ["Supply Type", supplyType === "intra" ? "Intra-State" : "Inter-State"]].map(([lbl, val]) => (
              <div key={lbl}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{lbl}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2d45" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Billed by/to */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "28px 48px", gap: 32, borderBottom: "1px solid #e9ecef" }}>
            {[["Billed By", seller], ["Billed To", buyer]].map(([lbl, data]) => (
              <div key={lbl}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>{lbl}</div>
                <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2d45", marginBottom: 4 }}>{data.name || "—"}</div>
                {data.gstin && <div style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>GSTIN: {data.gstin}</div>}
                {data.address && <div style={{ fontSize: 12, color: "#555" }}>{data.address}</div>}
                {data.city && <div style={{ fontSize: 12, color: "#555" }}>{data.city}, {data.state} - {data.pin}</div>}
                {data.email && <div style={{ fontSize: 12, color: "#555" }}>{data.email}</div>}
                {data.phone && <div style={{ fontSize: 12, color: "#555" }}>{data.phone}</div>}
              </div>
            ))}
          </div>

          {/* Items */}
          <div style={{ padding: "0 48px 28px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
              <thead>
                <tr style={{ background: "#0f1923" }}>
                  {["#", "Description", "Qty", "Rate", "GST %", ...(supplyType === "intra" ? ["CGST", "SGST"] : ["IGST"]), "Total"].map(h => (
                    <th key={h} style={{ padding: "10px 12px", color: "#d4af37", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textAlign: h === "Description" ? "left" : h === "#" ? "center" : "right" }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const c = calcItem(item);
                  return (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? "white" : "#f8f9fa" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#888", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 500 }}>{item.desc}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.qty}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{parseFloat(item.rate || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.gstRate}%</td>
                      {supplyType === "intra" ? (
                        <>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        </>
                      ) : (
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{c.gstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      )}
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 700, textAlign: "right" }}>{fmt(c.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: 280 }}>
                {[["Taxable Amount", fmt(totals.taxable)], ...(supplyType === "intra" ? [["CGST", fmt(totals.gst / 2)], ["SGST", fmt(totals.gst / 2)]] : [["IGST", fmt(totals.gst)]])].map(([lbl, val]) => (
                  <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e9ecef" }}>
                    <span style={{ color: "#555", fontSize: 13 }}>{lbl}</span>
                    <span style={{ color: "#333", fontSize: 13 }}>{val}</span>
                  </div>
                ))}
                <div style={{ display: "flex", justifyContent: "space-between", background: "#0f1923", padding: "12px 16px", marginTop: 8, borderRadius: 4 }}>
                  <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 15 }}>TOTAL DUE</span>
                  <span style={{ color: "#d4af37", fontWeight: 800, fontSize: 20 }}>{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {notes && (
            <div style={{ padding: "16px 48px", background: "#f8f9fa", borderTop: "1px solid #e9ecef" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</div>
              <div style={{ fontSize: 13, color: "#444" }}>{notes}</div>
            </div>
          )}

          <div style={{ background: "linear-gradient(90deg, #0f1923, #1a3a5c)", padding: "12px 48px", textAlign: "center", fontSize: 11, color: "rgba(255,255,255,0.4)" }}>
            Generated with BillKaro · GST Compliant Invoice{!isPro ? " · Free Plan" : ""}
          </div>
        </div>
      </div>
    </div>
  );
}