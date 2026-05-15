import { useState, useEffect } from "react";
import { auth, db, googleProvider } from "../lib/firebase";
import { 
  onAuthStateChanged, 
  signOut, 
  signInWithPopup,
  signInWithRedirect
} from "firebase/auth";
import { doc, setDoc, onSnapshot } from "firebase/firestore";

export function useAuthSync() {
  const [user, setUser] = useState(null);
  const [dbPro, setDbPro] = useState(false);
  const [loading, setLoading] = useState(true);
  const [authLoading, setAuthLoading] = useState(false);
  const [authError, setAuthError] = useState("");
  const [plan, setPlan] = useState(() => localStorage.getItem("bb_plan") || "free");

  useEffect(() => {
    const unsub = onAuthStateChanged(auth, (u) => {
      setUser(u);
      setLoading(false);
      if (!u) {
        setDbPro(false);
        setPlan("free");
        localStorage.removeItem("bb_plan");
      }
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
          localStorage.setItem("bb_plan", data.plan || "pro");
          setPlan(data.plan || "pro");
        } else {
          localStorage.setItem("bb_plan", "free");
          setPlan("free");
        }
      }
    }, (err) => {
      console.warn("Firestore snapshot error:", err);
      setDbPro(false);
      setPlan("free");
    });
    return unsub;
  }, [user]);

  const handleLogout = () => {
    signOut(auth);
    localStorage.removeItem("bb_plan");
    setPlan("free");
    setDbPro(false);
  };

  const handleGoogleLogin = async (setShowLogin) => {
    setAuthLoading(true);
    setAuthError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      setUser(result.user);
      if (setShowLogin) setShowLogin(false);
      return result.user;
    } catch (err) {
      if (err.code === 'auth/popup-blocked') await signInWithRedirect(auth, googleProvider);
      else setAuthError(`Login failed: ${err.message}`);
      throw err;
    } finally { setAuthLoading(false); }
  };

  const syncProStatus = async (uid, selectedPlan, paymentDetails = null) => {
    const updateData = { plan: selectedPlan || "free", updatedAt: new Date().toISOString() };
    if (paymentDetails?.razorpay_payment_id) {
      updateData.isPro = true;
      updateData.paymentId = paymentDetails.razorpay_payment_id;
      setDbPro(true);
    }
    await setDoc(doc(db, "users", uid), updateData, { merge: true });
  };

  return {
    user, setUser, dbPro, loading, authLoading, setAuthLoading, authError, setAuthError,
    plan, setPlan, handleLogout, handleGoogleLogin, syncProStatus
  };
}
