import React from "react";
import { fmt } from "./common/Constants";

const T_S = {
  page: { padding: "50px", minHeight: "29.7cm", width: "21cm", background: "#fff", boxSizing: "border-box", position: "relative", color: "#1e293b", fontFamily: "'Inter', sans-serif" },
  label: { fontSize: "10px", fontWeight: 800, color: "#94a3b8", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "4px", display: "block" },
  address: { fontSize: "12px", lineHeight: "1.6", whiteSpace: "pre-line", color: "#475569" },
  table: { width: "100%", borderCollapse: "collapse", marginTop: "30px" },
  th: { padding: "12px 16px", fontSize: "11px", fontWeight: 800, textAlign: "left", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0", background: "#f8fafc", color: "#64748b" },
  td: { padding: "16px", fontSize: "13px", borderBottom: "1px solid #f1f5f9", verticalAlign: "top" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: "14px", borderBottom: "1px solid #f1f5f9" },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "20px 0", marginTop: "10px", fontWeight: 900, fontSize: "22px" },
  footer: { marginTop: "80px", borderTop: "1px solid #e2e8f0", paddingTop: "40px", display: "flex", justifyContent: "space-between", alignItems: "flex-end" }
};

const UPI_QR = ({ seller, total }) => {
  if (!seller.upi) return null;
  const upiUrl = `upi://pay?pa=${seller.upi}&pn=${encodeURIComponent(seller.name)}&am=${total}&cu=INR`;
  const qrSrc = `https://api.qrserver.com/v1/create-qr-code/?size=120x120&data=${encodeURIComponent(upiUrl)}`;
  return (
    <div style={{ textAlign: "center", border: "1px solid #e2e8f0", padding: 12, borderRadius: 12 }}>
      <img src={qrSrc} style={{ width: 80, height: 80, display: "block", marginBottom: 6 }} alt="QR" />
      <div style={{ fontSize: 9, fontWeight: 800, color: "#1e293b" }}>SCAN TO PAY</div>
    </div>
  );
};

// 1. EXECUTIVE PRO (The Standard for Professionalism)
export const ExecutivePro = ({ data }) => (
  <div style={{ ...T_S.page, borderTop: "10px solid #1a3a5c" }}>
    <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 50 }}>
      <div>
        {data.sellerLogo ? (
          <img src={data.sellerLogo} style={{ maxHeight: 70, maxWidth: 220, marginBottom: 15 }} alt="logo" />
        ) : (
          <h1 style={{ fontSize: 28, fontWeight: 900, color: "#1a3a5c", margin: 0 }}>{data.seller.name}</h1>
        )}
        <div style={T_S.address}>{data.seller.address}</div>
        <div style={{ fontSize: 11, fontWeight: 700, marginTop: 10 }}>GSTIN: {data.seller.gstin}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <h2 style={{ fontSize: 40, fontWeight: 200, color: "#1a3a5c", margin: "0 0 10px 0" }}>{data.docType.toUpperCase()}</h2>
        <div style={{ display: "grid", gap: 5 }}>
          <div><span style={T_S.label}>Invoice Number</span><div style={{ fontWeight: 700 }}>{data.invoicePrefix}{data.invoiceNum}</div></div>
          <div><span style={T_S.label}>Date of Issue</span><div style={{ fontWeight: 700 }}>{data.invoiceDate}</div></div>
          {data.dueDate && <div><span style={T_S.label}>Due Date</span><div style={{ fontWeight: 700, color: "#ef4444" }}>{data.dueDate}</div></div>}
        </div>
      </div>
    </div>

    <div style={{ background: "#f8fafc", padding: 40, borderRadius: 16, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 40 }}>
      <div>
        <span style={T_S.label}>Billed To</span>
        <div style={{ fontSize: 18, fontWeight: 800, color: "#1e293b", marginBottom: 8 }}>{data.buyer.name}</div>
        <div style={T_S.address}>{data.buyer.address}</div>
        {data.buyer.gstin && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 10 }}>GSTIN: {data.buyer.gstin}</div>}
      </div>
      <div>
        <span style={T_S.label}>Payment Details</span>
        <div style={{ fontSize: 13, color: "#475569", lineHeight: 1.8 }}>
          <div><span style={{ fontWeight: 600 }}>Bank:</span> {data.seller.bankName || "N/A"}</div>
          <div><span style={{ fontWeight: 600 }}>A/C No:</span> {data.seller.accountNum || "N/A"}</div>
          <div><span style={{ fontWeight: 600 }}>IFSC:</span> {data.seller.ifsc || "N/A"}</div>
        </div>
      </div>
    </div>

    <table style={T_S.table}>
      <thead>
        <tr>
          <th style={T_S.th}>Description</th>
          <th style={{ ...T_S.th, textAlign: "right", width: 80 }}>Qty</th>
          <th style={{ ...T_S.th, textAlign: "right", width: 120 }}>Rate</th>
          <th style={{ ...T_S.th, textAlign: "right", width: 140 }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={T_S.td}>
              <div style={{ fontWeight: 700, color: "#1e293b" }}>{item.desc}</div>
              {item.hsn && <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>HSN: {item.hsn}</div>}
            </td>
            <td style={{ ...T_S.td, textAlign: "right" }}>{item.qty}</td>
            <td style={{ ...T_S.td, textAlign: "right" }}>{fmt(item.rate)}</td>
            <td style={{ ...T_S.td, textAlign: "right", fontWeight: 700 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 20 }}>
      <UPI_QR seller={data.seller} total={data.totals.total} />
      <div style={{ width: 320 }}>
        <div style={T_S.summaryRow}><span style={{ color: "#64748b" }}>Subtotal</span><span style={{ fontWeight: 600 }}>{fmt(data.totals.subtotal)}</span></div>
        <div style={T_S.summaryRow}><span style={{ color: "#64748b" }}>GST / Tax</span><span style={{ fontWeight: 600 }}>{fmt(data.totals.tax)}</span></div>
        <div style={{ ...T_S.totalRow, color: "#1a3a5c" }}><span>Total Amount</span><span>{fmt(data.totals.total)}</span></div>
      </div>
    </div>

    <div style={T_S.footer}>
      <div>
        <div style={T_S.label}>Terms</div>
        <div style={{ maxWidth: 400, fontSize: 11, color: "#94a3b8" }}>{data.notes || "Please pay within 15 days. Thank you for your business."}</div>
      </div>
      <div style={{ textAlign: "center", width: 200 }}>
        {data.sellerSignature && <img src={data.sellerSignature} style={{ maxHeight: 60, marginBottom: 10 }} alt="sign" />}
        <div style={{ borderTop: "1px solid #cbd5e1", paddingTop: 10, fontSize: 11, fontWeight: 700, color: "#64748b" }}>Authorized Signatory</div>
      </div>
    </div>
  </div>
);

// 3. STANDARD CLEAN (The Classic / Familiar)
export const StandardClean = ({ data }) => (
  <div style={{ background: "white", minHeight: "29.7cm", width: "21cm", fontFamily: "'Inter', sans-serif", overflow: "hidden", position: "relative", color: "#1e293b", padding: 0 }}>
    <div style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a3a5c 100%)", padding: "40px 50px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
      <div>
        {data.sellerLogo && <img src={data.sellerLogo} alt="Logo" style={{ height: 60, maxWidth: 200, objectFit: "contain", marginBottom: 15 }} />}
        <div style={{ fontSize: 24, fontWeight: 800, color: "#d4af37", textTransform: "uppercase" }}>{data.docType}</div>
        <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>#{data.invoicePrefix}{data.invoiceNum}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 22, fontWeight: 900, marginBottom: 5 }}>{data.seller.name || "Your Business"}</div>
        <div style={{ fontSize: 12, color: "#d4af37", fontWeight: 700 }}>GSTIN: {data.seller.gstin || "N/A"}</div>
        <div style={{ fontSize: 11, color: "rgba(255,255,255,0.6)", marginTop: 5, maxWidth: 250, marginLeft: "auto" }}>{data.seller.address}</div>
      </div>
    </div>

    <div style={{ padding: "30px 50px" }}>
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, marginBottom: 40 }}>
        <div>
          <div style={T_S.label}>Billed To</div>
          <div style={{ fontSize: 16, fontWeight: 800, marginBottom: 5 }}>{data.buyer.name}</div>
          <div style={T_S.address}>{data.buyer.address}</div>
          {data.buyer.gstin && <div style={{ fontSize: 11, fontWeight: 700, marginTop: 10 }}>GSTIN: {data.buyer.gstin}</div>}
        </div>
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20 }}>
          <div><div style={T_S.label}>Date</div><div style={{ fontSize: 13, fontWeight: 700 }}>{data.invoiceDate}</div></div>
          <div><div style={T_S.label}>Due Date</div><div style={{ fontSize: 13, fontWeight: 700 }}>{data.dueDate || "On Receipt"}</div></div>
        </div>
      </div>

      <table style={{ ...T_S.table, marginTop: 0 }}>
        <thead>
          <tr style={{ background: "#f8fafc" }}>
            <th style={{ ...T_S.th, padding: "12px" }}>Description</th>
            <th style={{ ...T_S.th, textAlign: "right", width: 80 }}>Qty</th>
            <th style={{ ...T_S.th, textAlign: "right", width: 100 }}>Rate</th>
            <th style={{ ...T_S.th, textAlign: "right", width: 120 }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...T_S.td, padding: "12px" }}>
                <div style={{ fontWeight: 700 }}>{item.desc}</div>
                {item.hsn && <div style={{ fontSize: 10, color: "#94a3b8" }}>HSN: {item.hsn}</div>}
              </td>
              <td style={{ ...T_S.td, textAlign: "right" }}>{item.qty}</td>
              <td style={{ ...T_S.td, textAlign: "right" }}>{fmt(item.rate)}</td>
              <td style={{ ...T_S.td, textAlign: "right", fontWeight: 700 }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30 }}>
        <UPI_QR seller={data.seller} total={data.totals.total} />
        <div style={{ width: 280 }}>
          <div style={T_S.summaryRow}><span style={{ color: "#64748b" }}>Subtotal</span><span>{fmt(data.totals.subtotal)}</span></div>
          <div style={T_S.summaryRow}><span style={{ color: "#64748b" }}>Tax (GST)</span><span>{fmt(data.totals.tax)}</span></div>
          <div style={{ ...T_S.totalRow, color: "#0f1923", borderTop: "2px solid #0f1923", paddingTop: 15, fontSize: 24 }}>
            <span>Total</span><span>{fmt(data.totals.total)}</span>
          </div>
        </div>
      </div>

      <div style={{ marginTop: 50, display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, alignItems: "flex-end" }}>
        <div>
          <div style={T_S.label}>Bank Details</div>
          <div style={{ fontSize: 11, color: "#475569", lineHeight: 1.6 }}>
            <div>Bank: {data.seller.bankName}</div>
            <div>A/C: {data.seller.accountNum}</div>
            <div>IFSC: {data.seller.ifsc}</div>
          </div>
          {data.notes && (
            <div style={{ marginTop: 20 }}>
              <div style={T_S.label}>Notes</div>
              <div style={{ fontSize: 11, color: "#94a3b8" }}>{data.notes}</div>
            </div>
          )}
        </div>
        <div style={{ textAlign: "right" }}>
          {data.sellerSignature && <img src={data.sellerSignature} style={{ maxHeight: 50, marginBottom: 10 }} alt="sign" />}
          <div style={{ borderTop: "1px solid #e2e8f0", paddingTop: 10, fontSize: 11, fontWeight: 800 }}>AUTHORIZED SIGNATORY</div>
        </div>
      </div>
    </div>
    
    <div style={{ position: "absolute", bottom: 40, left: 50, right: 50, textAlign: "center", fontSize: 10, color: "#94a3b8", borderTop: "1px solid #f1f5f9", paddingTop: 20 }}>
      Generated via BillKaro · Secure GST Invoicing
    </div>
  </div>
);

// 2. MODERN MINIMAL (Sleek / Sophisticated)
export const ModernMinimal = ({ data }) => (
  <div style={{ ...T_S.page, padding: "80px", color: "#000" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 100 }}>
      <div>
        <h1 style={{ fontSize: 64, fontWeight: 900, letterSpacing: "-4px", margin: 0 }}>{data.docType.toUpperCase()}</h1>
        <div style={{ fontSize: 18, marginTop: 15, fontWeight: 600 }}>{data.invoicePrefix}{data.invoiceNum}</div>
        <div style={{ color: "#94a3b8", fontSize: 14 }}>Issued on {data.invoiceDate}</div>
      </div>
      {data.sellerLogo && <img src={data.sellerLogo} style={{ height: 50, filter: "grayscale(1)" }} alt="logo" />}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 80, marginBottom: 80 }}>
      <div>
        <span style={{ ...T_S.label, color: "#000", borderBottom: "2px solid #000", paddingBottom: 5, marginBottom: 20 }}>From</span>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{data.seller.name}</div>
        <div style={{ ...T_S.address, fontSize: 14 }}>{data.seller.address}</div>
        <div style={{ fontSize: 12, fontWeight: 800, marginTop: 15 }}>GST {data.seller.gstin}</div>
      </div>
      <div>
        <span style={{ ...T_S.label, color: "#000", borderBottom: "2px solid #000", paddingBottom: 5, marginBottom: 20 }}>To</span>
        <div style={{ fontSize: 20, fontWeight: 700, marginBottom: 10 }}>{data.buyer.name}</div>
        <div style={{ ...T_S.address, fontSize: 14 }}>{data.buyer.address}</div>
        <div style={{ fontSize: 12, fontWeight: 800, marginTop: 15 }}>GST {data.buyer.gstin}</div>
      </div>
    </div>

    <table style={T_S.table}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, background: "transparent", padding: "15px 0", borderBottom: "2px solid #000", color: "#000" }}>Description</th>
          <th style={{ ...T_S.th, background: "transparent", padding: "15px 0", borderBottom: "2px solid #000", color: "#000", textAlign: "right" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={{ ...T_S.td, padding: "25px 0", borderBottom: "1px solid #eee" }}>
              <div style={{ fontWeight: 700, fontSize: 16 }}>{item.desc}</div>
              <div style={{ fontSize: 12, color: "#94a3b8", marginTop: 5 }}>{item.qty} x {fmt(item.rate)}</div>
            </td>
            <td style={{ ...T_S.td, padding: "25px 0", borderBottom: "1px solid #eee", textAlign: "right", fontWeight: 700, fontSize: 16 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginTop: 40 }}>
      <UPI_QR seller={data.seller} total={data.totals.total} />
      <div style={{ width: 300 }}>
        <div style={T_S.summaryRow}><span>Subtotal</span><span>{fmt(data.totals.subtotal)}</span></div>
        <div style={T_S.summaryRow}><span>Tax</span><span>{fmt(data.totals.tax)}</span></div>
        <div style={{ ...T_S.totalRow, borderTop: "4px solid #000", fontSize: 32, paddingTop: 10 }}>
          <span>Total</span><span>{fmt(data.totals.total)}</span>
        </div>
      </div>
    </div>

    <div style={{ ...T_S.footer, marginTop: 100 }}>
      <div style={{ fontSize: 10, letterSpacing: 2, fontWeight: 900 }}>BILLKARO PREMIUM SYSTEM</div>
      <div style={{ textAlign: "right" }}>
        {data.sellerSignature && <img src={data.sellerSignature} style={{ height: 60, filter: "grayscale(1)" }} alt="sign" />}
        <div style={{ fontSize: 11, fontWeight: 800 }}>AUTHORIZED SIGNATURE</div>
      </div>
    </div>
  </div>
);

const PremiumTemplates = ({ templateId, ...props }) => {
  const templates = {
    executive: ExecutivePro,
    minimal: ModernMinimal,
    standard: StandardClean,
  };

  const Selected = templates[templateId] || ExecutivePro;
  return <Selected data={props} />;
};

export default PremiumTemplates;
