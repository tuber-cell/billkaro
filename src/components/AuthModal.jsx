import React, { useState, useEffect } from "react";
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  sendPasswordResetEmail,
  signInWithPopup
} from "firebase/auth";
import { auth, googleProvider } from "../lib/firebase";
import { S } from "./common/Constants";

const AuthModal = ({ 
  setShowLogin, 
  setUser, 
  targetPlan, 
  syncProStatus, 
  openRazorpay 
}) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSignup, setIsSignup] = useState(targetPlan ? true : false);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [resetSent, setResetSent] = useState(false);

  // Handle successful login
  const handleSuccess = async (user) => {
    try {
      setLoading(true);
      setError("");
      
      try {
        await syncProStatus(user.uid, targetPlan || "free");
      } catch (syncErr) {
        console.error("Non-critical sync error:", syncErr);
        // If it's just a free user, don't block them from entering
        if (targetPlan === "pro") {
          throw new Error("Failed to secure Pro status: " + syncErr.message);
        }
      }

      setUser(user);
      setShowLogin(false);
      if (targetPlan === "pro") setTimeout(() => openRazorpay("pro"), 500);
    } catch (err) {
      console.error("Auth success but post-process failed:", err);
      setError(err.message || "Finalizing login failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const onGoogleLogin = async () => {
    setLoading(true);
    setError("");
    try {
      const result = await signInWithPopup(auth, googleProvider);
      await handleSuccess(result.user);
    } catch (err) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  const onEmailSubmit = async (e) => {
    e.preventDefault();
    if (!email || !password) return setError("Please fill all fields");
    setLoading(true);
    setError("");
    
    try {
      let result;
      if (isSignup) {
        if (password.length < 6) throw new Error("Password must be at least 6 characters");
        result = await createUserWithEmailAndPassword(auth, email, password);
      } else {
        result = await signInWithEmailAndPassword(auth, email, password);
      }
      await handleSuccess(result.user);
    } catch (err) {
      console.error(err);
      let msg = "";
      if (err.code === "auth/invalid-credential") msg = "Wrong email or password.";
      else if (err.code === "auth/email-already-in-use") msg = "Email already registered.";
      else if (err.code === "auth/weak-password") msg = "Password is too weak.";
      else if (err.code === "auth/operation-not-allowed") msg = "Email/Password sign-in is not enabled in Firebase Console.";
      else if (err.code === "auth/too-many-requests") msg = "Too many attempts. Try again later.";
      
      setError(msg || err.message || "Authentication failed. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    if (!email) return setError("Enter email first to reset password");
    try {
      await sendPasswordResetEmail(auth, email);
      setResetSent(true);
      setError("");
    } catch (err) { setError(err.message); }
  };

  return (
    <div style={S.modal} onClick={() => setShowLogin(false)}>
      <div className="bk-auth-modal" style={S.modalContent} onClick={e => e.stopPropagation()}>
        
        {/* Header */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 28, alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontFamily: "'Playfair Display', serif", fontSize: 26, color: "#d4af37", marginBottom: 8, margin: 0 }}>
              {isSignup ? "Create Account" : "Welcome Back"}
            </h2>
            <p style={{ color: "#8899aa", fontSize: 13, margin: 0 }}>
              {isSignup ? "Join Billby for professional invoicing" : "Continue your professional journey"}
            </p>
          </div>
          <button style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#8899aa", cursor: "pointer", width: 32, height: 32, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center" }} onClick={() => setShowLogin(false)}>✕</button>
        </div>

        {/* Error / Success Messages */}
        {error && (
          <div style={{ background: "rgba(239,68,68,0.1)", color: "#ef4444", padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 20, border: "1px solid rgba(239,68,68,0.2)" }}>
            {error}
          </div>
        )}
        {resetSent && (
          <div style={{ background: "rgba(52,211,153,0.1)", color: "#34d399", padding: "12px 16px", borderRadius: 12, fontSize: 13, marginBottom: 20, border: "1px solid rgba(52,211,153,0.2)" }}>
            Password reset link sent to your email!
          </div>
        )}

        {/* Tabs */}
        <div style={{ display: "flex", background: "rgba(255,255,255,0.03)", borderRadius: 12, padding: 4, marginBottom: 24 }}>
          <button 
            onClick={() => { setIsSignup(false); setError(""); }}
            style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, background: !isSignup ? "#d4af37" : "transparent", color: !isSignup ? "#0f1923" : "#8899aa", transition: "all 0.3s" }}
          >
            Login
          </button>
          <button 
            onClick={() => { setIsSignup(true); setError(""); }}
            style={{ flex: 1, padding: "10px", border: "none", borderRadius: 10, cursor: "pointer", fontSize: 14, fontWeight: 600, background: isSignup ? "#d4af37" : "transparent", color: isSignup ? "#0f1923" : "#8899aa", transition: "all 0.3s" }}
          >
            Sign Up
          </button>
        </div>

        {/* Google Login */}
        <button 
          type="button"
          disabled={loading} 
          onClick={onGoogleLogin}
          style={{ 
            background: "#fff", color: "#1a2d45", border: "none", width: "100%", height: 50, borderRadius: 12, fontWeight: 700, fontSize: 14, cursor: "pointer", display: "flex", alignItems: "center", justifyContent: "center", gap: 12, marginBottom: 20, boxShadow: "0 4px 12px rgba(0,0,0,0.1)"
          }}
        >
          <img src="https://fonts.gstatic.com/s/i/productlogos/googleg/v6/24px.svg" width="18" alt="" />
          Continue with Google
        </button>

        <div style={{ textAlign: "center", margin: "20px 0", position: "relative" }}>
          <div style={{ position: "absolute", top: "50%", left: 0, right: 0, height: 1, background: "rgba(255,255,255,0.08)" }}></div>
          <span style={{ background: "#1a2d45", padding: "0 15px", color: "#8899aa", fontSize: 11, position: "relative", fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}>OR</span>
        </div>

        {/* Email Form */}
        <form onSubmit={onEmailSubmit}>
          <div style={{ marginBottom: 16 }}>
            <label style={S.label}>Email Address</label>
            <input required type="email" style={S.input} value={email} onChange={e => setEmail(e.target.value)} placeholder="name@example.com" />
          </div>
          <div style={{ marginBottom: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
              <label style={{...S.label, marginBottom: 0}}>Password</label>
              {!isSignup && <span onClick={handleForgotPassword} style={{ fontSize: 11, color: "#d4af37", cursor: "pointer", fontWeight: 600 }}>Forgot?</span>}
            </div>
            <input required type="password" style={S.input} value={password} onChange={e => setPassword(e.target.value)} placeholder="••••••••" />
          </div>

          <button type="submit" disabled={loading} style={{ ...S.btnPrimary, width: "100%", height: 50, fontSize: 15, borderRadius: 12, boxShadow: "0 8px 24px rgba(212,175,55,0.2)" }}>
            {loading ? "Please wait..." : (isSignup ? "Create My Account" : "Sign In to Billby")}
          </button>
        </form>

        <p style={{ textAlign: "center", color: "#8899aa", fontSize: 12, marginTop: 24, margin: "24px 0 0" }}>
          By continuing, you agree to Billby's Terms of Service.
        </p>
      </div>
    </div>
  );
};

export default AuthModal;
