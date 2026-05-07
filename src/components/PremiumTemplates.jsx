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

// 3. STANDARD CLEAN (The BillKaro Classic)
export const StandardClean = ({ data }) => (
  <div style={{ background: "white", minHeight: "29.7cm", width: "21cm", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", position: "relative", color: "#1e293b", padding: "0 40px" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "40px 0 20px" }}>
      <div>
        {data.sellerLogo && <img src={data.sellerLogo} alt="Logo" style={{ height: 60, maxWidth: 200, objectFit: "contain", marginBottom: 20 }} />}
        <h1 style={{ fontFamily: "'Playfair Display', serif", fontSize: 42, color: "#b8860b", margin: 0, fontWeight: 400, letterSpacing: "1px" }}>{data.docType.toUpperCase()}</h1>
        <div style={{ fontSize: 14, color: "#8899aa", marginTop: 4 }}>#{data.invoicePrefix}{data.invoiceNum}</div>
        <div style={{ marginTop: 15 }}>
            <span style={{ 
                border: "1px solid #d4af37", 
                color: "#d4af37", 
                padding: "6px 14px", 
                borderRadius: 20, 
                fontSize: 11, 
                fontWeight: 700,
                display: "inline-flex",
                alignItems: "center",
                gap: 6
            }}>
                ⌛ {data.paidStatus === "paid" ? "PAYMENT SUCCESS" : "PAYMENT PENDING"}
            </span>
        </div>
      </div>
      <div style={{ textAlign: "right", maxWidth: 300 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#888", marginBottom: 6, fontWeight: 400 }}>{data.seller.name || "Your Business"}</div>
        <div style={{ fontSize: 12, fontWeight: 700, color: "#b8860b", marginBottom: 4 }}>GSTIN: {data.seller.gstin || "N/A"}</div>
        <div style={{ fontSize: 11, color: "#64748b", lineHeight: "1.5" }}>
            {data.seller.address}<br/>
            {data.seller.email}<br/>
            {data.seller.phone}
        </div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, padding: "20px 0", borderTop: "1px solid #f1f5f9", borderBottom: "1px solid #f1f5f9", marginBottom: 30 }}>
      <div>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Invoice Date</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{data.invoiceDate}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Due Date</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{data.dueDate || data.invoiceDate}</div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Supply Type</div>
        <div style={{ fontSize: 16, fontWeight: 700 }}>{data.supplyType === "intra" ? "Intra-State" : "Inter-State"}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, marginBottom: 40 }}>
      <div>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Billed By</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{data.seller.name}</div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: "1.6" }}>
          GSTIN: {data.seller.gstin}<br/>
          {data.seller.address}<br/>
          {data.seller.email}<br/>
          {data.seller.phone}
        </div>
      </div>
      <div>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Billed To</div>
        <div style={{ fontSize: 20, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{data.buyer.name}</div>
        <div style={{ fontSize: 12, color: "#475569", lineHeight: "1.6" }}>
          GSTIN: {data.buyer.gstin}<br/>
          {data.buyer.address}<br/>
          {data.buyer.email}<br/>
          {data.buyer.phone}
        </div>
      </div>
    </div>

    <table style={{ width: "100%", borderCollapse: "collapse" }}>
      <thead>
        <tr>
          <th style={{ textAlign: "left", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase", width: 40 }}>#</th>
          <th style={{ textAlign: "left", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Description</th>
          <th style={{ textAlign: "center", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Qty</th>
          <th style={{ textAlign: "right", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Rate</th>
          <th style={{ textAlign: "right", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>GST %</th>
          <th style={{ textAlign: "right", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>CGST</th>
          <th style={{ textAlign: "right", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>SGST</th>
          <th style={{ textAlign: "right", padding: "12px 0", fontSize: 11, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Total</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => {
          const c = data.calcItem(item);
          return (
            <tr key={i} style={{ borderBottom: "1px solid #f1f5f9" }}>
              <td style={{ padding: "15px 0", fontSize: 13 }}>{i + 1}</td>
              <td style={{ padding: "15px 0", fontSize: 14, fontWeight: 600 }}>{item.desc}</td>
              <td style={{ padding: "15px 0", fontSize: 13, textAlign: "center" }}>{item.qty}</td>
              <td style={{ padding: "15px 0", fontSize: 13, textAlign: "right" }}>₹{parseFloat(item.rate).toLocaleString()}</td>
              <td style={{ padding: "15px 0", fontSize: 13, textAlign: "right" }}>{item.gstRate}%</td>
              <td style={{ padding: "15px 0", fontSize: 13, textAlign: "right" }}>₹{(c.gstAmt / 2).toFixed(2)}</td>
              <td style={{ padding: "15px 0", fontSize: 13, textAlign: "right" }}>₹{(c.gstAmt / 2).toFixed(2)}</td>
              <td style={{ padding: "15px 0", fontSize: 14, fontWeight: 700, textAlign: "right", color: "#1a3a5c" }}>₹{c.total.toLocaleString()}</td>
            </tr>
          );
        })}
      </tbody>
    </table>

    <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
      <div style={{ width: 280 }}>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, color: "#64748b" }}>
          <span>Taxable Amount</span>
          <span style={{ fontWeight: 600 }}>₹{data.totals.taxable.toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, color: "#64748b" }}>
          <span>CGST</span>
          <span style={{ fontWeight: 600 }}>₹{(data.totals.gst / 2).toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: 14, color: "#64748b" }}>
          <span>SGST</span>
          <span style={{ fontWeight: 600 }}>₹{(data.totals.gst / 2).toLocaleString()}</span>
        </div>
        <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", marginTop: 10, borderTop: "2px solid #f1f5f9" }}>
          <span style={{ fontSize: 20, fontWeight: 700, color: "#b8860b" }}>TOTAL DUE</span>
          <span style={{ fontSize: 24, fontWeight: 900, color: "#b8860b" }}>₹{data.totals.total.toLocaleString()}</span>
        </div>
      </div>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, alignItems: "flex-end" }}>
      <div style={{ background: "#fff", border: "1px solid #e2e8f0", padding: "20px", borderRadius: 12, width: 340 }}>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 15 }}>Bank & Payment Details</div>
        <div style={{ display: "grid", gap: 10 }}>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#777" }}>Bank Name:</span>
            <span style={{ fontWeight: 700 }}>{data.seller.bankName}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#777" }}>Account No:</span>
            <span style={{ fontWeight: 700 }}>{data.seller.accountNum}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#777" }}>IFSC Code:</span>
            <span style={{ fontWeight: 700 }}>{data.seller.ifsc}</span>
          </div>
          <div style={{ height: 1, borderTop: "1px dashed #e2e8f0", margin: "5px 0" }}></div>
          <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
            <span style={{ color: "#777" }}>UPI ID:</span>
            <span style={{ fontWeight: 800, color: "#b8860b" }}>{data.seller.upi}</span>
          </div>
        </div>
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 13, fontWeight: 800, color: "#1a3a5c", marginBottom: 40 }}>For {data.seller.name}</div>
        <div style={{ textAlign: "center" }}>
          {data.sellerSignature && <img src={data.sellerSignature} style={{ maxHeight: 60, marginBottom: 10 }} alt="sign" />}
          <div style={{ fontSize: 12, fontWeight: 800, color: "#1a3a5c" }}>Authorized Signatory</div>
          <div style={{ fontSize: 10, color: "#8899aa", marginTop: 4 }}>This is a computer generated invoice</div>
        </div>
      </div>
    </div>

    {data.notes && (
      <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid #f1f5f9" }}>
        <div style={{ fontSize: 10, color: "#888", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 8 }}>Notes</div>
        <div style={{ fontSize: 12, color: "#475569" }}>{data.notes}</div>
      </div>
    </div>
    )}

    <div style={{ textAlign: "center", padding: "40px 0", fontSize: 10, color: "#94a3b8" }}>
        Generated with <span style={{ fontWeight: 700, color: "#b8860b" }}>BillKaro</span> · Secure GST Compliant Digital Invoice
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
