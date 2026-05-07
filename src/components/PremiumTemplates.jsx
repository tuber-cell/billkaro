import React from "react";
import { fmt } from "./common/Constants";

// Common Styles & Components for Templates
const T_S = {
  page: { padding: "40px", minHeight: "29.7cm", width: "21cm", background: "#fff", boxSizing: "border-box", position: "relative", color: "#334155", fontFamily: "'Inter', sans-serif", overflow: "hidden" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "40px" },
  logoBox: { maxWidth: "200px" },
  logo: { maxWidth: "100%", height: "auto", maxHeight: "80px", marginBottom: 12 },
  title: { fontSize: "32px", fontWeight: 900, textTransform: "uppercase", letterSpacing: "2px", margin: 0 },
  meta: { textAlign: "right", fontSize: "13px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "50px", marginBottom: "40px" },
  label: { fontSize: "11px", fontWeight: 800, color: "#64748b", textTransform: "uppercase", marginBottom: "6px", display: "block", letterSpacing: "0.05em" },
  address: { fontSize: "13px", lineHeight: "1.6", whiteSpace: "pre-line" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "40px" },
  th: { padding: "14px 12px", fontSize: "12px", fontWeight: 800, textAlign: "left", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc" },
  td: { padding: "14px 12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" },
  summary: { marginLeft: "auto", width: "320px" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "14px", borderBottom: "1px solid #f1f5f9" },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "15px 0", borderTop: "3px solid #1e293b", marginTop: "10px", fontWeight: 900, fontSize: "20px" },
  footer: { marginTop: "60px", borderTop: "1px solid #e2e8f0", paddingTop: "30px", fontSize: "12px", color: "#64748b", display: "flex", justifyContent: "space-between", alignItems: "flex-end" },
  qrBox: { border: "1px solid #e2e8f0", padding: "12px", borderRadius: "12px", textAlign: "center", background: "#fff" },
  signArea: { textAlign: "center", width: "180px" },
  signImg: { maxWidth: "100%", maxHeight: "50px", marginBottom: "8px" },
  watermark: { position: "absolute", top: "45%", left: "50%", transform: "translate(-50%, -50%) rotate(-30deg)", fontSize: "120px", fontWeight: 900, opacity: 0.05, pointerEvents: "none", whiteSpace: "nowrap", zIndex: 0 }
};

const UPI_QR = ({ seller, total, dark = false }) => {
  if (!seller.upi) return null;
  const upiUrl = `upi://pay?pa=${seller.upi}&pn=${encodeURIComponent(seller.name)}&am=${total}&cu=INR`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}`;
  return (
    <div style={{ ...T_S.qrBox, background: dark ? "rgba(255,255,255,0.05)" : "#fff", borderColor: dark ? "rgba(255,255,255,0.1)" : "#e2e8f0" }}>
      <img src={qrSrc} style={{ width: 85, height: 85, display: "block", marginBottom: 8, borderRadius: 6 }} alt="UPI QR" />
      <div style={{ fontSize: 9, fontWeight: 800, color: dark ? "#38bdf8" : "#2563eb", letterSpacing: 1 }}>SCAN TO PAY</div>
    </div>
  );
};

const SignatureArea = ({ signature, label, dark = false }) => (
  <div style={T_S.signArea}>
    {signature ? (
      <img src={signature} style={T_S.signImg} alt="signature" />
    ) : (
      <div style={{ height: 50 }} />
    )}
    <div style={{ borderTop: `1px solid ${dark ? "rgba(255,255,255,0.2)" : "#cbd5e1"}`, paddingTop: 8, fontSize: 11, fontWeight: 700, color: dark ? "#94a3b8" : "#64748b" }}>
      {label}
    </div>
  </div>
);

// 1. MODERN CORPORATE
export const ModernCorporate = ({ data }) => (
  <div style={{ ...T_S.page, borderTop: "12px solid #2563eb" }}>
    <div style={T_S.watermark}>{data.paidStatus.toUpperCase()}</div>
    <div style={T_S.header}>
      <div>
        {data.sellerLogo && <img src={data.sellerLogo} style={T_S.logo} alt="logo" />}
        <h2 style={{ ...T_S.title, color: "#1e293b" }}>{data.docType}</h2>
        <div style={{ color: "#2563eb", fontWeight: 700, fontSize: 14, marginTop: 4 }}>ID: {data.invoicePrefix}{data.invoiceNum}</div>
      </div>
      <div style={T_S.meta}>
        <div style={{ marginBottom: 15 }}>
          <span style={T_S.label}>Date of Issue</span>
          <div style={{ fontWeight: 700, fontSize: 15 }}>{data.invoiceDate}</div>
        </div>
        {data.dueDate && (
          <div>
            <span style={T_S.label}>Due Date</span>
            <div style={{ fontWeight: 700, fontSize: 15, color: "#ef4444" }}>{data.dueDate}</div>
          </div>
        )}
      </div>
    </div>

    <div style={{ ...T_S.grid, background: "#f8fafc", padding: 30, borderRadius: 16 }}>
      <div>
        <span style={T_S.label}>Billing From</span>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>{data.seller.name}</div>
        <div style={T_S.address}>{data.seller.address}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
          <div><span style={T_S.label}>GSTIN</span><div style={{ fontSize: 12, fontWeight: 600 }}>{data.seller.gstin || "N/A"}</div></div>
          {data.seller.phone && <div><span style={T_S.label}>Phone</span><div style={{ fontSize: 12, fontWeight: 600 }}>{data.seller.phone}</div></div>}
        </div>
      </div>
      <div>
        <span style={T_S.label}>Billing To</span>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 6 }}>{data.buyer.name}</div>
        <div style={T_S.address}>{data.buyer.address}</div>
        <div style={{ marginTop: 12, display: "flex", gap: 20 }}>
          <div><span style={T_S.label}>GSTIN</span><div style={{ fontSize: 12, fontWeight: 600 }}>{data.buyer.gstin || "N/A"}</div></div>
          {data.buyer.phone && <div><span style={T_S.label}>Phone</span><div style={{ fontSize: 12, fontWeight: 600 }}>{data.buyer.phone}</div></div>}
        </div>
      </div>
    </div>

    <table style={T_S.table}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, color: "#1e293b" }}>Description</th>
          <th style={{ ...T_S.th, textAlign: "right", width: 80 }}>Qty</th>
          <th style={{ ...T_S.th, textAlign: "right", width: 120 }}>Rate</th>
          <th style={{ ...T_S.th, textAlign: "right", width: 150, background: "#f1f5f9" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={T_S.td}>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{item.desc}</div>
              {item.hsn && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 2 }}>HSN Code: {item.hsn}</div>}
            </td>
            <td style={{ ...T_S.td, textAlign: "right" }}>{item.qty}</td>
            <td style={{ ...T_S.td, textAlign: "right" }}>{fmt(item.rate)}</td>
            <td style={{ ...T_S.td, textAlign: "right", fontWeight: 700, background: "#f8fafc" }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ display: "flex", justifyContent: "space-between" }}>
      <UPI_QR seller={data.seller} total={data.totals.total} />
      <div style={T_S.summary}>
        <div style={T_S.summaryRow}><span style={{ color: "#64748b" }}>Subtotal</span><span style={{ fontWeight: 600 }}>{fmt(data.totals.subtotal)}</span></div>
        <div style={T_S.summaryRow}><span style={{ color: "#64748b" }}>Tax (GST)</span><span style={{ fontWeight: 600 }}>{fmt(data.totals.tax)}</span></div>
        <div style={{ ...T_S.totalRow, color: "#2563eb", borderTopColor: "#2563eb" }}><span>Total Amount</span><span>{fmt(data.totals.total)}</span></div>
      </div>
    </div>

    <div style={T_S.footer}>
      <div>
        <div style={T_S.label}>Terms & Conditions</div>
        <div style={{ maxWidth: 400, fontSize: 11, lineHeight: 1.5 }}>{data.notes || "1. Payment is due within 15 days. 2. Please include invoice number on your check. 3. Late payments are subject to a 1.5% fee."}</div>
      </div>
      <SignatureArea signature={data.sellerSignature} label="Authorized Signatory" />
    </div>
  </div>
);

// 2. MINIMALIST (Clean / Swiss Design)
export const Minimalist = ({ data }) => (
  <div style={{ ...T_S.page, padding: "80px", fontFamily: "'Geist', sans-serif" }}>
    <div style={T_S.watermark}>{data.paidStatus}</div>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 100 }}>
      <div>
        <h1 style={{ fontSize: 64, fontWeight: 200, letterSpacing: "-3px", margin: 0, lineHeight: 1 }}>{data.docType}</h1>
        <div style={{ display: "flex", gap: 30, marginTop: 20 }}>
          <div><span style={T_S.label}>No.</span><div style={{ fontWeight: 600 }}>{data.invoicePrefix}{data.invoiceNum}</div></div>
          <div><span style={T_S.label}>Date</span><div style={{ fontWeight: 600 }}>{data.invoiceDate}</div></div>
        </div>
      </div>
      {data.sellerLogo && <img src={data.sellerLogo} style={{ height: 45, filter: "grayscale(1)" }} alt="logo" />}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 100, marginBottom: 80 }}>
      <div>
        <span style={{ ...T_S.label, borderBottom: "1px solid #000", paddingBottom: 6, marginBottom: 20 }}>Sender</span>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{data.seller.name}</div>
        <div style={{ ...T_S.address, color: "#64748b", marginTop: 10 }}>{data.seller.address}</div>
        <div style={{ fontSize: 11, color: "#000", fontWeight: 700, marginTop: 15 }}>GST: {data.seller.gstin}</div>
      </div>
      <div>
        <span style={{ ...T_S.label, borderBottom: "1px solid #000", paddingBottom: 6, marginBottom: 20 }}>Recipient</span>
        <div style={{ fontSize: 16, fontWeight: 600 }}>{data.buyer.name}</div>
        <div style={{ ...T_S.address, color: "#64748b", marginTop: 10 }}>{data.buyer.address}</div>
        <div style={{ fontSize: 11, color: "#000", fontWeight: 700, marginTop: 15 }}>GST: {data.buyer.gstin}</div>
      </div>
    </div>

    <table style={T_S.table}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, background: "transparent", padding: "10px 0", borderBottom: "2px solid #000" }}>Item Description</th>
          <th style={{ ...T_S.th, background: "transparent", padding: "10px 0", borderBottom: "2px solid #000", textAlign: "right" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={{ ...T_S.td, padding: "24px 0" }}>
              <div style={{ fontWeight: 600, fontSize: 15 }}>{item.desc}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{item.qty} units × {fmt(item.rate)}</div>
            </td>
            <td style={{ ...T_S.td, padding: "24px 0", textAlign: "right", fontSize: 15, fontWeight: 600 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
      <UPI_QR seller={data.seller} total={data.totals.total} />
      <div style={{ width: 300 }}>
        <div style={T_S.summaryRow}><span>Subtotal</span><span>{fmt(data.totals.subtotal)}</span></div>
        <div style={T_S.summaryRow}><span>Tax</span><span>{fmt(data.totals.tax)}</span></div>
        <div style={{ ...T_S.totalRow, borderTopWidth: 2, borderTopColor: "#000", fontSize: 28, paddingTop: 20 }}>
          <span>Total</span><span>{fmt(data.totals.total)}</span>
        </div>
      </div>
    </div>

    <div style={{ ...T_S.footer, marginTop: 100 }}>
      <div style={{ fontSize: 10, letterSpacing: 1, textTransform: "uppercase", fontWeight: 600 }}>Generated via BillKaro Pro</div>
      <SignatureArea signature={data.sellerSignature} label="Signature" />
    </div>
  </div>
);

// 3. MIDNIGHT CYBER (Dark/Neon)
export const MidnightDark = ({ data }) => (
  <div style={{ ...T_S.page, background: "#020617", color: "#f8fafc" }}>
    <div style={{ ...T_S.watermark, color: "#38bdf8", opacity: 0.03 }}>{data.paidStatus}</div>
    <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "6px", background: "linear-gradient(90deg, #38bdf8, #818cf8, #c084fc)" }}></div>
    
    <div style={{ ...T_S.header, marginBottom: 80, marginTop: 20 }}>
      <div>
        <div style={{ color: "#38bdf8", fontWeight: 900, fontSize: 11, letterSpacing: 4, marginBottom: 10 }}>CYBER-FLOW INVOICE</div>
        <h1 style={{ fontSize: 42, fontWeight: 900, letterSpacing: -1 }}>{data.invoicePrefix}{data.invoiceNum}</h1>
        <div style={{ color: "#94a3b8", fontSize: 14, marginTop: 6 }}>TX_DATE: {data.invoiceDate}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        {data.sellerLogo ? <img src={data.sellerLogo} style={{ height: 60, filter: "brightness(1.2)" }} alt="logo" /> : <div style={{ fontSize: 32, fontWeight: 900, color: "#38bdf8" }}>⬡</div>}
        <div style={{ marginTop: 10, background: data.paidStatus === "paid" ? "#22c55e" : "#ef4444", color: "#fff", padding: "4px 12px", borderRadius: 4, fontSize: 10, fontWeight: 900, display: "inline-block" }}>{data.paidStatus.toUpperCase()}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 60 }}>
      <div style={{ background: "rgba(255,255,255,0.03)", padding: 30, borderRadius: 16, border: "1px solid rgba(56,189,248,0.2)" }}>
        <span style={{ ...T_S.label, color: "#38bdf8" }}>Origin Node</span>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{data.seller.name}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{data.seller.address}</div>
        <div style={{ fontSize: 11, color: "#38bdf8", marginTop: 12, fontWeight: 700 }}>HEX_GST: {data.seller.gstin}</div>
      </div>
      <div style={{ background: "rgba(255,255,255,0.03)", padding: 30, borderRadius: 16, border: "1px solid rgba(192,132,252,0.2)" }}>
        <span style={{ ...T_S.label, color: "#c084fc" }}>Target Entity</span>
        <div style={{ fontSize: 18, fontWeight: 800, marginTop: 8 }}>{data.buyer.name}</div>
        <div style={{ color: "#94a3b8", fontSize: 13, marginTop: 6, lineHeight: 1.6 }}>{data.buyer.address}</div>
        <div style={{ fontSize: 11, color: "#c084fc", marginTop: 12, fontWeight: 700 }}>HEX_GST: {data.buyer.gstin}</div>
      </div>
    </div>

    <div style={{ border: "1px solid rgba(255,255,255,0.1)", borderRadius: 16, overflow: "hidden" }}>
      <table style={{ ...T_S.table, marginBottom: 0 }}>
        <thead style={{ background: "rgba(56,189,248,0.1)" }}>
          <tr>
            <th style={{ ...T_S.th, background: "transparent", color: "#38bdf8", borderBottom: "1px solid rgba(56,189,248,0.3)" }}>Component Details</th>
            <th style={{ ...T_S.th, background: "transparent", color: "#38bdf8", borderBottom: "1px solid rgba(56,189,248,0.3)", textAlign: "right" }}>Credits</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i} style={{ background: i % 2 === 0 ? "transparent" : "rgba(255,255,255,0.01)" }}>
              <td style={{ ...T_S.td, borderBottom: "1px solid rgba(255,255,255,0.05)", padding: 20 }}>
                <div style={{ fontWeight: 700, color: "#fff" }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 6 }}>QTY: {item.qty} // RATE: {fmt(item.rate)}</div>
              </td>
              <td style={{ ...T_S.td, borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "right", fontWeight: 800, color: "#38bdf8" }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 50 }}>
      <UPI_QR seller={data.seller} total={data.totals.total} dark />
      <div style={{ ...T_S.summary, width: 350, background: "linear-gradient(135deg, #0f172a, #1e1b4b)", padding: 30, borderRadius: 16, border: "1px solid #38bdf8" }}>
        <div style={{ ...T_S.summaryRow, color: "#94a3b8", borderBottomColor: "rgba(255,255,255,0.05)" }}><span>Base Val</span><span>{fmt(data.totals.subtotal)}</span></div>
        <div style={{ ...T_S.summaryRow, color: "#94a3b8", borderBottomColor: "rgba(255,255,255,0.05)" }}><span>Tax Load</span><span>{fmt(data.totals.tax)}</span></div>
        <div style={{ ...T_S.totalRow, borderTopColor: "#38bdf8", color: "#38bdf8", fontSize: 26, paddingTop: 20 }}>
          <span>FINAL</span><span>{fmt(data.totals.total)}</span>
        </div>
      </div>
    </div>

    <div style={{ ...T_S.footer, borderTop: "1px solid rgba(255,255,255,0.1)" }}>
      <div style={{ fontSize: 10, color: "#475569", fontWeight: 800 }}>SYSTEM_ENCRYPTED_DOC // 256-BIT // PRO_ACTIVE</div>
      <SignatureArea signature={data.sellerSignature} label="System Auth" dark />
    </div>
  </div>
);

// 4. CLASSIC VINTAGE
export const ClassicVintage = ({ data }) => (
  <div style={{ ...T_S.page, background: "#fdfbf7", color: "#433422", border: "1px solid #c9b08d", padding: "60px" }}>
    <div style={{ position: "absolute", top: 20, left: 20, right: 20, bottom: 20, border: "1px solid #e5d8c1", pointerEvents: "none" }}></div>
    <div style={T_S.watermark}>{data.paidStatus.toUpperCase()}</div>
    
    <div style={{ textAlign: "center", marginBottom: 60 }}>
      <div style={{ fontSize: 13, letterSpacing: 8, color: "#c9b08d", fontWeight: 400, marginBottom: 20 }}>MEMORANDUM OF INVOICE</div>
      <h1 style={{ fontSize: 52, fontWeight: 400, margin: 0, fontFamily: "'Playfair Display', serif", fontStyle: "italic" }}>{data.docType}</h1>
      <div style={{ height: 2, width: 100, background: "#c9b08d", margin: "20px auto" }}></div>
      <div style={{ fontSize: 16 }}>№ {data.invoicePrefix}{data.invoiceNum} — Issued {data.invoiceDate}</div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, marginBottom: 60 }}>
      <div style={{ textAlign: "center", border: "1px solid #e5d8c1", padding: 30 }}>
        <span style={{ ...T_S.label, color: "#c9b08d" }}>The Vendor</span>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 10, fontFamily: "'Playfair Display', serif" }}>{data.seller.name}</div>
        <div style={{ fontSize: 13, color: "#795548", marginTop: 8, lineHeight: 1.6 }}>{data.seller.address}</div>
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 12 }}>ID: {data.seller.gstin}</div>
      </div>
      <div style={{ textAlign: "center", border: "1px solid #e5d8c1", padding: 30 }}>
        <span style={{ ...T_S.label, color: "#c9b08d" }}>The Recipient</span>
        <div style={{ fontSize: 20, fontWeight: 600, marginTop: 10, fontFamily: "'Playfair Display', serif" }}>{data.buyer.name}</div>
        <div style={{ fontSize: 13, color: "#795548", marginTop: 8, lineHeight: 1.6 }}>{data.buyer.address}</div>
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 12 }}>ID: {data.buyer.gstin}</div>
      </div>
    </div>

    <table style={{ ...T_S.table, border: "1px solid #c9b08d" }}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, background: "#f4ede1", borderBottom: "1px solid #c9b08d", color: "#433422" }}>Particulars of Service</th>
          <th style={{ ...T_S.th, background: "#f4ede1", borderBottom: "1px solid #c9b08d", color: "#433422", textAlign: "right" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={{ ...T_S.td, borderBottom: "1px dotted #e5d8c1", padding: 20 }}>
              <div style={{ fontWeight: 600, fontSize: 16 }}>{item.desc}</div>
              <div style={{ fontSize: 12, color: "#8d6e63", marginTop: 4 }}>Qty: {item.qty} // Rate: {fmt(item.rate)}</div>
            </td>
            <td style={{ ...T_S.td, borderBottom: "1px dotted #e5d8c1", textAlign: "right", fontWeight: 700, fontSize: 16 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
      <div style={{ background: "#fff", border: "1px solid #e5d8c1", padding: 15 }}>
        <UPI_QR seller={data.seller} total={data.totals.total} />
      </div>
      <div style={{ width: 350 }}>
        <div style={{ ...T_S.summaryRow, borderBottom: "1px solid #e5d8c1" }}><span style={{ fontStyle: "italic" }}>Sum Total</span><span>{fmt(data.totals.subtotal)}</span></div>
        <div style={{ ...T_S.summaryRow, borderBottom: "1px solid #e5d8c1" }}><span style={{ fontStyle: "italic" }}>Levied Tax</span><span>{fmt(data.totals.tax)}</span></div>
        <div style={{ ...T_S.totalRow, borderTop: "2px solid #433422", fontSize: 28, paddingTop: 15 }}>
          <span style={{ fontFamily: "'Playfair Display', serif" }}>Total Due</span><span>{fmt(data.totals.total)}</span>
        </div>
      </div>
    </div>

    <div style={{ ...T_S.footer, borderTop: "1px solid #e5d8c1", marginTop: 80 }}>
      <div style={{ fontSize: 11, fontStyle: "italic", color: "#8d6e63" }}>Authenticated by BillKaro Classical Suite</div>
      <SignatureArea signature={data.sellerSignature} label="Vendor Signature" />
    </div>
  </div>
);

// 5. CREATIVE NEON (Pink/Purple)
export const CreativeVibrant = ({ data }) => (
  <div style={{ ...T_S.page, padding: "50px", borderRadius: 32 }}>
    <div style={{ position: "absolute", top: -150, right: -150, width: 400, height: 400, background: "radial-gradient(circle, rgba(236,72,153,0.15) 0%, transparent 70%)" }}></div>
    <div style={{ position: "absolute", bottom: -100, left: -100, width: 300, height: 300, background: "radial-gradient(circle, rgba(139,92,246,0.15) 0%, transparent 70%)" }}></div>
    
    <div style={{ ...T_S.header, alignItems: "center", marginBottom: 80 }}>
      <div style={{ display: "flex", gap: 20, alignItems: "center" }}>
        <div style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", width: 70, height: 70, borderRadius: 20, display: "flex", alignItems: "center", justifyContent: "center", color: "#fff", fontSize: 32, fontWeight: 900 }}>⬡</div>
        <div>
          <h1 style={{ fontSize: 32, fontWeight: 900, background: "linear-gradient(90deg, #ec4899, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent", margin: 0 }}>{data.docType}</h1>
          <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 700 }}>REF: {data.invoicePrefix}{data.invoiceNum}</div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 12, color: "#ec4899", fontWeight: 900, letterSpacing: 1 }}>{data.invoiceDate}</div>
        <div style={{ background: "#f1f5f9", padding: "6px 16px", borderRadius: 30, fontSize: 11, fontWeight: 800, color: "#6366f1", marginTop: 8 }}>{data.paidStatus.toUpperCase()}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 60 }}>
      <div style={{ background: "#fdf2f8", padding: 35, borderRadius: 24, border: "2px solid #fce7f3" }}>
        <span style={{ ...T_S.label, color: "#db2777" }}>Sender</span>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 10, color: "#831843" }}>{data.seller.name}</div>
        <div style={{ fontSize: 13, color: "#be185d", marginTop: 6, lineHeight: 1.6 }}>{data.seller.address}</div>
        <div style={{ marginTop: 15, background: "#fff", padding: "6px 12px", borderRadius: 8, display: "inline-block", fontSize: 11, fontWeight: 700 }}>GST: {data.seller.gstin}</div>
      </div>
      <div style={{ background: "#f5f3ff", padding: 35, borderRadius: 24, border: "2px solid #ede9fe" }}>
        <span style={{ ...T_S.label, color: "#7c3aed" }}>Client</span>
        <div style={{ fontSize: 22, fontWeight: 900, marginTop: 10, color: "#2e1065" }}>{data.buyer.name}</div>
        <div style={{ fontSize: 13, color: "#5b21b6", marginTop: 6, lineHeight: 1.6 }}>{data.buyer.address}</div>
        <div style={{ marginTop: 15, background: "#fff", padding: "6px 12px", borderRadius: 8, display: "inline-block", fontSize: 11, fontWeight: 700 }}>GST: {data.buyer.gstin}</div>
      </div>
    </div>

    <div style={{ background: "#fff", borderRadius: 32, padding: "10px", boxShadow: "0 10px 30px rgba(0,0,0,0.03)", border: "1px solid #f1f5f9" }}>
      <table style={{ ...T_S.table, marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ ...T_S.th, background: "transparent", borderBottom: "2px solid #f1f5f9", color: "#1e293b" }}>Description</th>
            <th style={{ ...T_S.th, background: "transparent", borderBottom: "2px solid #f1f5f9", color: "#1e293b", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...T_S.td, borderBottom: "1px solid #f8fafc", padding: 25 }}>
                <div style={{ fontWeight: 800, fontSize: 17, color: "#1e293b" }}>{item.desc}</div>
                <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 6 }}>{item.qty} units × {fmt(item.rate)}</div>
              </td>
              <td style={{ ...T_S.td, borderBottom: "1px solid #f8fafc", textAlign: "right", fontWeight: 900, fontSize: 17, color: "#ec4899" }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 50 }}>
      <div style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", padding: 4, borderRadius: 16 }}>
        <div style={{ background: "#fff", borderRadius: 13, padding: 12 }}>
          <UPI_QR seller={data.seller} total={data.totals.total} />
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ color: "#94a3b8", fontSize: 14, marginBottom: 8 }}>Subtotal + Tax: {fmt(data.totals.tax)}</div>
        <div style={{ fontSize: 48, fontWeight: 950, background: "linear-gradient(90deg, #ec4899, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{fmt(data.totals.total)}</div>
      </div>
    </div>

    <div style={{ ...T_S.footer, marginTop: 80 }}>
      <div style={{ fontSize: 11, fontWeight: 700, color: "#cbd5e1" }}>CREATIVE_ENGINE // VER_4.0 // PREMIUM</div>
      <SignatureArea signature={data.sellerSignature} label="Creative Approval" />
    </div>
  </div>
);

// 6. LUXURY GOLD
export const LuxuryGold = ({ data }) => (
  <div style={{ ...T_S.page, background: "#0c121e", color: "#fff", border: "1px solid #d4af37", padding: 0 }}>
    <div style={{ padding: "60px 50px", borderBottom: "1px solid #d4af37", background: "linear-gradient(180deg, #162032 0%, #0c121e 100%)", textAlign: "center" }}>
      <h2 style={{ fontSize: 10, letterSpacing: 10, color: "#d4af37", fontWeight: 400, margin: "0 0 20px 0" }}>OFFICIAL TAX DOCUMENT</h2>
      <h1 style={{ fontSize: 52, fontWeight: 300, color: "#fff", fontFamily: "'Playfair Display', serif", margin: 0 }}>{data.docType}</h1>
      <div style={{ height: 1, width: 200, background: "linear-gradient(90deg, transparent, #d4af37, transparent)", margin: "30px auto" }}></div>
      <div style={{ fontSize: 18, color: "rgba(255,255,255,0.6)", letterSpacing: 2 }}>REF NO: {data.invoicePrefix}{data.invoiceNum}</div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 0, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
      <div style={{ padding: 50, borderRight: "1px solid rgba(212,175,55,0.2)" }}>
        <span style={{ ...T_S.label, color: "#d4af37", marginBottom: 25 }}>Prepared For</span>
        <div style={{ fontSize: 32, fontWeight: 300, marginBottom: 15, fontFamily: "'Playfair Display', serif" }}>{data.buyer.name}</div>
        <div style={{ fontSize: 14, color: "rgba(255,255,255,0.5)", lineHeight: 1.8 }}>{data.buyer.address}</div>
        <div style={{ marginTop: 20, display: "flex", gap: 30 }}>
          <div><span style={T_S.label}>Buyer ID</span><div style={{ color: "#d4af37", fontSize: 13 }}>{data.buyer.gstin || "N/A"}</div></div>
          {data.buyer.phone && <div><span style={T_S.label}>Contact</span><div style={{ color: "#fff", fontSize: 13 }}>{data.buyer.phone}</div></div>}
        </div>
      </div>
      <div style={{ padding: 50, background: "rgba(255,255,255,0.01)" }}>
        <span style={{ ...T_S.label, color: "#d4af37", marginBottom: 25 }}>Issuing Entity</span>
        <div style={{ fontSize: 20, fontWeight: 400, marginBottom: 10 }}>{data.seller.name}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)", lineHeight: 1.6 }}>{data.seller.address}</div>
        <div style={{ marginTop: 25 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.3)", marginBottom: 4 }}>ISSUED DATE</div>
          <div style={{ fontSize: 16, color: "#d4af37" }}>{data.invoiceDate}</div>
        </div>
      </div>
    </div>

    <div style={{ padding: "0 50px" }}>
      <table style={{ ...T_S.table, marginTop: 50, marginBottom: 50 }}>
        <thead>
          <tr>
            <th style={{ ...T_S.th, background: "transparent", color: "#d4af37", borderBottom: "1px solid rgba(212,175,55,0.3)", padding: "20px 0" }}>Service Description</th>
            <th style={{ ...T_S.th, background: "transparent", color: "#d4af37", borderBottom: "1px solid rgba(212,175,55,0.3)", padding: "20px 0", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...T_S.td, borderBottom: "1px solid rgba(255,255,255,0.05)", padding: "30px 0" }}>
                <div style={{ fontSize: 18, fontWeight: 300, color: "#fff" }}>{item.desc}</div>
                <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginTop: 8 }}>{item.qty} units × {fmt(item.rate)}</div>
              </td>
              <td style={{ ...T_S.td, borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "right", fontSize: 18, color: "#d4af37" }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ background: "rgba(212,175,55,0.05)", borderTop: "1px solid #d4af37", padding: 50 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div style={{ display: "flex", gap: 30, alignItems: "center" }}>
          <div style={{ background: "rgba(255,255,255,0.05)", padding: 8, borderRadius: 12, border: "1px solid rgba(212,175,55,0.2)" }}>
            <UPI_QR seller={data.seller} total={data.totals.total} dark />
          </div>
          <SignatureArea signature={data.sellerSignature} label="Director Signature" dark />
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 12, color: "rgba(255,255,255,0.4)", marginBottom: 10 }}>TOTAL PAYABLE AMOUNT</div>
          <div style={{ fontSize: 48, fontWeight: 300, color: "#d4af37", fontFamily: "'Playfair Display', serif" }}>{fmt(data.totals.total)}</div>
        </div>
      </div>
    </div>
  </div>
);

// Main Component
const PremiumTemplates = ({ templateId, ...props }) => {
  const templates = {
    modern: ModernCorporate,
    minimal: Minimalist,
    midnight: MidnightDark,
    classic: ClassicVintage,
    creative: CreativeVibrant,
    luxury: LuxuryGold,
  };

  const Selected = templates[templateId] || LuxuryGold;
  return <Selected data={props} />;
};

export default PremiumTemplates;
