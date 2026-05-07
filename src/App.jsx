import React, { useState, useRef, useEffect, Component, Suspense } from "react";
import { db } from "./lib/firebase";
import { doc, setDoc, query, collection, getDocs } from "firebase/firestore";

// Hooks
import { useArchiveExport, saveToLocalArchive, getLocalArchive } from "./hooks/useArchiveExport";
import { useHistoryLookup } from "./hooks/useHistoryLookup";
import { useAuthSync } from "./hooks/useAuthSync";
import { useInvoiceForm } from "./hooks/useInvoiceForm";
import { useDailyLimit } from "./hooks/useDailyLimit";
import { useGSTReconciliation } from "./hooks/useGSTReconciliation";

// Constants
import { 
  S, GST_RATES, STATES, fmt, today, saveJSON, PLANS 
} from "./components/common/Constants";

// Lazy Components
const InvoiceFormView = React.lazy(() => import("./components/InvoiceFormView"));
const DashboardView = React.lazy(() => import("./components/DashboardView"));
const ExpensesView = React.lazy(() => import("./components/ExpensesView"));
const UpgradeView = React.lazy(() => import("./components/UpgradeView"));
const PreviewView = React.lazy(() => import("./components/PreviewView"));
import AuthModal from "./components/AuthModal";
const ReconciliationView = React.lazy(() => import("./components/ReconciliationView"));

class ErrorBoundary extends Component {
  constructor(props) { super(props); this.state = { hasError: false, error: null }; }
  static getDerivedStateFromError(error) { return { hasError: true, error }; }
  componentDidCatch(error, errorInfo) { console.error("ErrorBoundary caught an error:", error, errorInfo); }
  render() {
    if (this.state.hasError) {
      return (
        <div style={{ padding: 40, color: "white", background: "#0f1923", minHeight: "100vh", display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", textAlign: "center" }}>
          <h1 style={{ color: "#d4af37", fontFamily: "'Playfair Display', serif" }}>Something went wrong.</h1>
          <p style={{ color: "#8899aa" }}>The application encountered an unexpected error during rendering.</p>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 20, borderRadius: 12, border: "1px solid rgba(239,68,68,0.2)", maxWidth: "600px", width: "100%", marginTop: 20 }}>
            <pre style={{ fontSize: 12, color: "#ef4444", whiteSpace: "pre-wrap", textAlign: "left", margin: 0 }}>{this.state.error?.toString()}</pre>
          </div>
          <button style={{ marginTop: 32, background: "linear-gradient(135deg, #d4af37, #f0d060)", color: "#0f1923", border: "none", padding: "12px 32px", borderRadius: 8, cursor: "pointer", fontWeight: 700, fontSize: 14 }} onClick={() => window.location.reload()}>Reload BillKaro</button>
        </div>
      );
    }
    return this.props.children;
  }
}

const RAZORPAY_KEY = import.meta.env.VITE_RAZORPAY_KEY;

export default function App() {
  const [step, setStep] = useState("form");
  const previewRef = useRef();
  
  // Custom Hooks
  const { 
    user, setUser, dbPro, loading, authLoading, setAuthLoading, authError, setAuthError,
    plan, setPlan, handleLogout, handleGoogleLogin, syncProStatus 
  } = useAuthSync();

  const {
    invoiceNum, setInvoiceNum, invoiceDate, setInvoiceDate, dueDate, setDueDate,
    supplyType, setSupplyType, docType, setDocType, invoicePrefix, setInvoicePrefix,
    watermark, setWatermark, notes, setNotes, paidStatus, setPaidStatus,
    sellerLogo, setSellerLogo, sellerSignature, setSellerSignature,
    seller, setSeller, buyer, setBuyer, items, setItems, errors, setErrors,
    savedSeller, setSavedSeller, savedClients, setSavedClients,
    calcItem, totals, updateItem, addItem, removeItem, validate, resetForm,
    handleSaveSeller, handleSaveClient, handleLoadClient, handleDeleteClient,
    showUpiQr, setShowUpiQr, trackInvoiceEvent, getInvoiceStatus, INVOICE_STATUSES
  } = useInvoiceForm();

  const { dailyCount, incrementDailyCount, dailyLeft } = useDailyLimit();
  const { generateArchive, generateGSTR1, exporting } = useArchiveExport();
  const { suggestion, warnings, saveToHistory, applySuggestion, clearBuyerHistory, hasHistory } = useHistoryLookup({ buyer, seller, items, supplyType, user });
  const { reconciling, reconciliationResults, reconciliationError, runReconciliation, exportReconciliationReport } = useGSTReconciliation();

  const [archiveCount, setArchiveCount] = useState(0);
  const [saveToast, setSaveToast] = useState(false);
  const [expenses, setExpenses] = useState(() => JSON.parse(localStorage.getItem("bk_expenses") || "[]"));
  const [expenseForm, setExpenseForm] = useState({ category: "Stock Purchase", amount: "", date: today(), notes: "" });
  const [showLogin, setShowLogin] = useState(false);
  const [targetPlan, setTargetPlan] = useState(null);
  const [cameFromDashboard, setCameFromDashboard] = useState(false);

  useEffect(() => { saveJSON("bk_expenses", expenses); }, [expenses]);

  const openRazorpay = (selectedPlan) => {
    if (!window.Razorpay) return alert("Payment gateway not loaded. Please refresh.");
    if (!user) { setTargetPlan(selectedPlan); setShowLogin(true); return; }

    const amount = 14900;
    const options = {
      key: RAZORPAY_KEY,
      amount,
      currency: "INR",
      name: "BillKaro",
      description: "Pro Plan — ₹149/month",
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
    if (user && targetPlan && !loading) {
      const p = targetPlan;
      setTargetPlan(null);
      openRazorpay(p);
    }
  }, [user, targetPlan, loading]);

  useEffect(() => {
    if (loading) return;
    const refresh = () => {
      if (user) {
        getDocs(query(collection(db, "users", user.uid, "invoices")))
          .then(s => setArchiveCount(s.size))
          .catch(err => {
            console.warn("Failed to fetch archive count:", err);
            setArchiveCount(0);
          });
      }
      else setArchiveCount(getLocalArchive().length);
    };
    refresh();
  }, [user, loading, step]);

  const isPro = user ? dbPro : plan === "pro";
  const canDownload = isPro || dailyLeft > 0;


  const handlePreview = async () => {
    try {
      if (!validate()) {
        alert("⚠️ Please fill: Seller Business Name, Buyer Business Name, and at least one Item with Description & Rate.");
        return;
      }
      const activeItems = items.filter(i => i.desc?.trim() || i.rate);
      const snapshot = { invoiceNum, invoiceDate, dueDate, supplyType, paidStatus, notes, seller, buyer, items: activeItems, createdAt: new Date().toISOString() };
      
      if (user) {
        await setDoc(doc(db, "users", user.uid, "invoices", invoiceNum), snapshot);
      } else {
        saveToLocalArchive(snapshot);
      }
      
      saveToHistory(snapshot);
      trackInvoiceEvent(invoiceNum, "VIEWED");
      setStep("preview");
    } catch (err) {
      console.error("Failed to preview/save invoice:", err);
      alert("❌ Failed to save invoice. Please check your internet connection or try again.");
    }
  };

  const handleSaveAndNext = async () => {
    try {
      if (!validate()) {
          alert("⚠️ Please fill: Seller Business Name, Buyer Business Name, and at least one Item with Description & Rate.");
          return;
      }
      const activeItems = items.filter(i => i.desc?.trim() || i.rate);
      const snapshot = { invoiceNum, invoiceDate, dueDate, supplyType, paidStatus, notes, seller, buyer, items: activeItems, createdAt: new Date().toISOString() };
      
      if (user) {
        await setDoc(doc(db, "users", user.uid, "invoices", invoiceNum), snapshot);
      } else {
        saveToLocalArchive(snapshot);
      }
      
      saveToHistory(snapshot);
      resetForm();
      setSaveToast(true); 
      setTimeout(() => setSaveToast(false), 3000);
    } catch (err) {
      console.error("Failed to save invoice:", err);
      alert("❌ Failed to save invoice. Please check your internet connection or try again.");
    }
  };

  const handleWhatsApp = () => {
    const text = `*TAX INVOICE — ${invoiceNum}*\n*From:* ${seller.name}\n*To:* ${buyer.name}\n*Amount:* ${fmt(totals.total)}\nGenerated via BillKaro`;
    trackInvoiceEvent(invoiceNum, "SENT");
    window.open(`https://wa.me/?text=${encodeURIComponent(text)}`, "_blank");
  };

  const handleLogoUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 500 * 1024) return alert("Logo too large. Max 500KB.");
    const reader = new FileReader();
    reader.onloadend = () => setSellerLogo(reader.result);
    reader.readAsDataURL(file);
  };

  const handleSignatureUpload = (e) => {
    const file = e.target.files?.[0];
    if (!file) return;
    if (file.size > 300 * 1024) return alert("Signature too large. Max 300KB.");
    const reader = new FileReader();
    reader.onloadend = () => setSellerSignature(reader.result);
    reader.readAsDataURL(file);
  };

  const handlePaywall = () => {
    if (isPro || dailyLeft > 0) {
      if (!isPro) incrementDailyCount();
      window.print();
    } else setStep("upgrade");
  };



  if (loading) return (
    <div style={{ ...S.page, display: "flex", alignItems: "center", justifyContent: "center", minHeight: "100vh" }}>
      <div className="pulse-match" style={{ fontSize: 48 }}>⬡</div>
    </div>
  );

  return (
    <ErrorBoundary>
      <div style={{ minHeight: "100vh", background: "#0f1923" }}>
        <Suspense fallback={<div style={S.page}><div className="pulse-match">⬡</div></div>}>
          {showLogin && (
            <AuthModal 
              setShowLogin={setShowLogin} setUser={setUser} targetPlan={targetPlan} 
              setTargetPlan={setTargetPlan} syncProStatus={syncProStatus} 
              openRazorpay={openRazorpay} triggerGoogleLogin={() => handleGoogleLogin(setShowLogin)} 
              user={user} authLoading={authLoading} setAuthLoading={setAuthLoading}
              authError={authError} setAuthError={setAuthError}
            />
          )}

          {step === "form" && (
            <InvoiceFormView 
              {...{ step, setStep, isPro, plan, dailyLeft, user, dbPro, invoiceNum, invoiceDate, setInvoiceDate,
                dueDate, setDueDate, supplyType, setSupplyType, paidStatus, setPaidStatus, docType, setDocType,
                invoicePrefix, setInvoicePrefix, watermark, setWatermark, seller, setSeller, sellerLogo,
                setSellerLogo, sellerSignature, setSellerSignature, handleSaveSeller, savedSeller, buyer,
                setBuyer, errors, suggestion, applySuggestion, warnings, savedClients, handleLoadClient,
                handleDeleteClient, clearBuyerHistory, hasHistory, handleSaveClient, items, updateItem,
                removeItem, addItem, calcItem, totals, archiveCount, handleSaveAndNext, handlePreview,
                generateArchive, exporting, saveToast, handleLogout, setShowLogin, showLogin, targetPlan,
                setTargetPlan, setPlan, syncProStatus, openRazorpay, setUser, dbPro, notes, setNotes,
                showUpiQr, setShowUpiQr, handleLogoUpload, handleSignatureUpload, triggerGoogleLogin: () => handleGoogleLogin(setShowLogin) }} 
            />
          )}

          {step === "dashboard" && (
            <DashboardView 
              step={step}
              setStep={setStep}
              user={user}
              dbPro={dbPro}
              plan={plan}
              handleLogout={handleLogout}
              setShowLogin={setShowLogin}
              expenses={expenses}
              generateGSTR1={generateGSTR1}
              generateArchive={generateArchive}
              seller={seller}
              setInvoiceNum={setInvoiceNum}
              setInvoiceDate={setInvoiceDate}
              setDueDate={setDueDate}
              setSupplyType={setSupplyType}
              setPaidStatus={setPaidStatus}
              setNotes={setNotes}
              setSeller={setSeller}
              setBuyer={setBuyer}
              setItems={setItems}
              setDocType={setDocType}
              setInvoicePrefix={setInvoicePrefix}
              setWatermark={setWatermark}
              setCameFromDashboard={setCameFromDashboard}
              getInvoiceStatus={getInvoiceStatus}
              trackInvoiceEvent={trackInvoiceEvent}
              INVOICE_STATUSES={INVOICE_STATUSES}
            />
          )}

          {step === "expenses" && (
            <ExpensesView 
              {...{ step, setStep, user, dbPro, plan, handleLogout, setShowLogin, expenses, 
                setExpenses, expenseForm, setExpenseForm, today }} 
            />
          )}

          {step === "upgrade" && (
            <UpgradeView 
              {...{ step, setStep, user, dbPro, plan, openRazorpay, handleLogout, setShowLogin }} 
            />
          )}

          {step === "reconciliation" && (
            <ReconciliationView 
              {...{ reconciling, reconciliationResults, reconciliationError, runReconciliation, exportReconciliationReport, setStep }}
            />
          )}

          {step === "preview" && (
            <PreviewView 
              {...{ step, setStep, user, dbPro, plan, PLANS, handleLogout, setShowLogin, showLogin, 
                handleNewInvoice: resetForm, handleWhatsApp, handlePaywall, canDownload, isPro, dailyLeft,
                previewRef, paidStatus, dueDate, watermark, showWatermark: !isPro, docType, invoicePrefix, invoiceNum,
                seller, sellerLogo, sellerSignature, buyer, items, calcItem, totals, notes, supplyType, invoiceDate,
                showUpiQr, cameFromDashboard, setCameFromDashboard,
                trackInvoiceEvent, getInvoiceStatus, INVOICE_STATUSES }} 
            />
          )}
        </Suspense>
      </div>
    </ErrorBoundary>
  );
}