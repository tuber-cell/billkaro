export const GST_RATES = [0, 5, 12, 18, 28];

export const STATES = [
  "Andhra Pradesh", "Arunachal Pradesh", "Assam", "Bihar", "Chhattisgarh",
  "Goa", "Gujarat", "Haryana", "Himachal Pradesh", "Jharkhand", "Karnataka",
  "Kerala", "Madhya Pradesh", "Maharashtra", "Manipur", "Meghalaya", "Mizoram",
  "Nagaland", "Odisha", "Punjab", "Rajasthan", "Sikkim", "Tamil Nadu", "Telangana",
  "Tripura", "Uttar Pradesh", "Uttarakhand", "West Bengal", "Delhi", "Jammu & Kashmir"
];

export const STATE_CODES = {
  "Jammu & Kashmir": "01", "Himachal Pradesh": "02", "Punjab": "03", "Chandigarh": "04", "Uttarakhand": "05",
  "Haryana": "06", "Delhi": "07", "Rajasthan": "08", "Uttar Pradesh": "09", "Bihar": "10", "Sikkim": "11",
  "Arunachal Pradesh": "12", "Nagaland": "13", "Manipur": "14", "Mizoram": "15", "Tripura": "16",
  "Meghalaya": "17", "Assam": "18", "West Bengal": "19", "Jharkhand": "20", "Odisha": "21",
  "Chhattisgarh": "22", "Madhya Pradesh": "23", "Gujarat": "24", "Maharashtra": "27",
  "Andhra Pradesh": "28", "Karnataka": "29", "Goa": "30", "Kerala": "32", "Tamil Nadu": "33",
  "Telangana": "36"
};

export const PLANS = {
  free: { label: "Free Beta", price: 0, invoices: 10, color: "#8899aa" },
  pro: { label: "Founder Pro", price: 149, invoices: Infinity, color: "#d4af37" },
};

export const DAILY_FREE_LIMIT = 10;
export const FREE_LIMIT = 10;

export const S = {
  page: { width: "100%", maxWidth: "100%", minHeight: "100vh", background: "linear-gradient(135deg, #0f1923 0%, #162032 50%, #0f1923 100%)", fontFamily: "'DM Sans', sans-serif", padding: "0 0 60px", overflowX: "hidden", boxSizing: "border-box" },
  header: { width: "100%", maxWidth: "100%", background: "rgba(15, 25, 35, 0.8)", backdropFilter: "blur(12px)", borderBottom: "1px solid rgba(212,175,55,0.3)", padding: "16px 40px", display: "flex", alignItems: "center", justifyContent: "space-between", position: "sticky", top: 0, zIndex: 100, boxSizing: "border-box" },
  logo: { fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#d4af37", letterSpacing: "0.05em", fontWeight: 700 },
  badge: { background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.3)", color: "#d4af37", padding: "4px 12px", borderRadius: 20, fontSize: 11, letterSpacing: "0.1em", fontWeight: 600 },
  container: { width: "100%", maxWidth: 1000, margin: "0 auto", padding: "40px 20px", boxSizing: "border-box" },
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
  modal: { position: "fixed", top: 0, left: 0, right: 0, bottom: 0, background: "rgba(15, 25, 35, 0.95)", display: "flex", alignItems: "center", justifyContent: "center", zIndex: 9999999, padding: 20 },
  modalContent: { background: "#1a2d45", border: "1px solid rgba(212,175,55,0.3)", borderRadius: 16, padding: "32px", maxWidth: 400, width: "100%", boxShadow: "0 20px 40px rgba(0,0,0,0.4)" }
};

export const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
export const today = () => new Date().toISOString().slice(0, 10);
export const invoiceNo = () => Date.now().toString().slice(-6);
export const emptyItem = () => ({ id: Date.now(), desc: "", hsn: "", qty: 1, rate: "", gstRate: 18, discount: 0 });

export const loadJSON = (key, fallback) => { try { return JSON.parse(localStorage.getItem(key)) || fallback; } catch { return fallback; } };
export const saveJSON = (key, val) => localStorage.setItem(key, JSON.stringify(val));
