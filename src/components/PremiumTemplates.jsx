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

// 3. STANDARD CLEAN (The BillKaro Classic - Pixel Perfect Version)
export const StandardClean = ({ data }) => {
  const isPaid = data.paidStatus === "paid";
  return (
    <div style={{ 
      background: "white", 
      minHeight: "29.7cm", 
      width: "21cm", 
      fontFamily: "'Inter', sans-serif", 
      overflow: "hidden", 
      position: "relative", 
      color: "#1e293b", 
      padding: "0 40px",
      borderTop: "6px solid #f8fafc"
    }}>
      {/* Header Section */}
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", padding: "40px 0 20px" }}>
        <div>
          {data.sellerLogo && <img src={data.sellerLogo} alt="Logo" style={{ height: 85, width: 85, objectFit: "cover", borderRadius: 8, marginBottom: 20 }} />}
          <h1 style={{ 
            fontFamily: "'Playfair Display', serif", 
            fontSize: 40, 
            color: "#b8860b", 
            margin: 0, 
            fontWeight: 400, 
            letterSpacing: "1px",
            lineHeight: 1.1
          }}>
            {data.docType.toUpperCase()}
          </h1>
          <div style={{ fontSize: 15, color: "#8899aa", marginTop: 4 }}>
            #{data.invoicePrefix}{data.invoiceNum}
          </div>
          
          <div style={{ marginTop: 15 }}>
              <span style={{ 
                  border: "1.5px solid #d4af37", 
                  color: "#d4af37", 
                  padding: "6px 16px", 
                  borderRadius: 20, 
                  fontSize: 11, 
                  fontWeight: 700,
                  display: "inline-flex",
                  alignItems: "center",
                  gap: 8,
                  textTransform: "uppercase"
              }}>
                  {isPaid ? "● PAYMENT SUCCESS" : "⌛ PAYMENT PENDING"}
              </span>
          </div>
        </div>
        
        <div style={{ textAlign: "right", maxWidth: 350 }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#888", marginBottom: 6, fontWeight: 400 }}>
            {data.seller.name}
          </div>
          <div style={{ fontSize: 13, fontWeight: 700, color: "#b8860b", marginBottom: 6 }}>
            GSTIN: {data.seller.gstin || "N/A"}
          </div>
          <div style={{ fontSize: 12, color: "#888", lineHeight: "1.5", whiteSpace: "pre-line" }}>
              {data.seller.address}
          </div>
          <div style={{ fontSize: 12, color: "#888", marginTop: 4 }}>
              {data.seller.email}<br/>
              {data.seller.phone}
          </div>
        </div>
      </div>

      {/* Meta Column Labels */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 20, padding: "20px 0", borderTop: "1px solid #f1f5f9", marginBottom: 30 }}>
        <div>
          <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Invoice Date</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a5c" }}>{data.invoiceDate}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Due Date</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a5c" }}>{data.dueDate || data.invoiceDate}</div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 8 }}>Supply Type</div>
          <div style={{ fontSize: 17, fontWeight: 700, color: "#1a3a5c" }}>{data.supplyType === "intra" ? "Intra-State" : "Inter-State"}</div>
        </div>
      </div>

      {/* Billing By/To Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 50, marginBottom: 40, borderTop: "1px solid #f1f5f9", paddingTop: 30 }}>
        <div>
          <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Billed By</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a3a5c", marginBottom: 4 }}>{data.seller.name}</div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: "1.6" }}>
            GSTIN: {data.seller.gstin}<br/>
            {data.seller.address}<br/>
            {data.seller.email}<br/>
            {data.seller.phone}
          </div>
        </div>
        <div>
          <div style={{ fontSize: 10, color: "#888", fontWeight: 700, letterSpacing: "1px", textTransform: "uppercase", marginBottom: 12 }}>Billed To</div>
          <div style={{ fontSize: 20, fontWeight: 700, color: "#1a3a5c", marginBottom: 4 }}>{data.buyer.name}</div>
          <div style={{ fontSize: 12, color: "#475569", lineHeight: "1.6" }}>
            GSTIN: {data.buyer.gstin}<br/>
            {data.buyer.address}<br/>
            {data.buyer.email}<br/>
            {data.buyer.phone}
          </div>
        </div>
      </div>

      {/* Items Table */}
      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 20 }}>
        <thead>
          <tr style={{ borderBottom: "1px solid #f1f5f9" }}>
            <th style={{ textAlign: "left", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase", width: 40 }}>#</th>
            <th style={{ textAlign: "left", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Description</th>
            <th style={{ textAlign: "center", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Qty</th>
            <th style={{ textAlign: "right", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Rate</th>
            <th style={{ textAlign: "right", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>GST %</th>
            <th style={{ textAlign: "right", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>CGST</th>
            <th style={{ textAlign: "right", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>SGST</th>
            <th style={{ textAlign: "right", padding: "12px 10px", fontSize: 12, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => {
            const c = data.calcItem(item);
            return (
              <tr key={i} style={{ borderBottom: "1px solid #f8fafc" }}>
                <td style={{ padding: "16px 10px", fontSize: 13, color: "#1e293b" }}>{i + 1}</td>
                <td style={{ padding: "16px 10px", fontSize: 14, fontWeight: 600, color: "#1a3a5c" }}>{item.desc}</td>
                <td style={{ padding: "16px 10px", fontSize: 13, textAlign: "center", color: "#1e293b" }}>{item.qty}</td>
                <td style={{ padding: "16px 10px", fontSize: 13, textAlign: "right", color: "#1e293b" }}>₹{parseFloat(item.rate).toLocaleString()}</td>
                <td style={{ padding: "16px 10px", fontSize: 13, textAlign: "right", color: "#1e293b" }}>{item.gstRate}%</td>
                <td style={{ padding: "16px 10px", fontSize: 13, textAlign: "right", color: "#1e293b" }}>₹{(c.gstAmt / 2).toFixed(2)}</td>
                <td style={{ padding: "16px 10px", fontSize: 13, textAlign: "right", color: "#1e293b" }}>₹{(c.gstAmt / 2).toFixed(2)}</td>
                <td style={{ padding: "16px 10px", fontSize: 15, fontWeight: 700, textAlign: "right", color: "#1a3a5c" }}>₹{c.total.toLocaleString()}</td>
              </tr>
            );
          })}
        </tbody>
      </table>

      {/* Summary Section */}
      <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 30 }}>
        <div style={{ width: 320 }}>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
            <span>Taxable Amount</span>
            <span style={{ fontWeight: 600 }}>₹{data.totals.taxable.toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
            <span>CGST</span>
            <span style={{ fontWeight: 600 }}>₹{(data.totals.gst / 2).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", fontSize: 14, color: "#64748b", borderBottom: "1px solid #f1f5f9" }}>
            <span>SGST</span>
            <span style={{ fontWeight: 600 }}>₹{(data.totals.gst / 2).toLocaleString()}</span>
          </div>
          <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 0", marginTop: 15 }}>
            <span style={{ fontSize: 18, fontWeight: 700, color: "#b8860b", textTransform: "uppercase" }}>TOTAL DUE</span>
            <span style={{ fontSize: 26, fontWeight: 900, color: "#b8860b" }}>₹{data.totals.total.toLocaleString()}</span>
          </div>
        </div>
      </div>

      {/* Bank & Payment Details Section */}
      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40, alignItems: "flex-end" }}>
        <div style={{ background: "#fff", border: "1px solid #f1f5f9", padding: "24px", borderRadius: 12, width: 380 }}>
          <div style={{ fontSize: 11, color: "#1a3a5c", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 20 }}>Bank & Payment Details</div>
          <div style={{ display: "grid", gap: 12 }}>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#777" }}>Bank Name:</span>
              <span style={{ fontWeight: 700, color: "#1a3a5c" }}>{data.seller.bankName}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#777" }}>Account No:</span>
              <span style={{ fontWeight: 700, color: "#1a3a5c" }}>{data.seller.accountNum}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#777" }}>IFSC Code:</span>
              <span style={{ fontWeight: 700, color: "#1a3a5c" }}>{data.seller.ifsc}</span>
            </div>
            <div style={{ height: 1, borderTop: "1px dashed #e2e8f0", margin: "10px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", fontSize: 13 }}>
              <span style={{ color: "#777" }}>UPI ID:</span>
              <span style={{ fontWeight: 800, color: "#b8860b" }}>{data.seller.upi}</span>
            </div>
          </div>
        </div>
        
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 14, fontWeight: 800, color: "#1a3a5c", marginBottom: 40 }}>For {data.seller.name}</div>
          <div style={{ textAlign: "center" }}>
            {data.sellerSignature && <img src={data.sellerSignature} style={{ maxHeight: 70, marginBottom: 10, mixBlendMode: "multiply" }} alt="sign" />}
            <div style={{ fontSize: 13, fontWeight: 800, color: "#1a3a5c" }}>Authorized Signatory</div>
            <div style={{ fontSize: 11, color: "#8899aa", marginTop: 4 }}>This is a computer generated invoice</div>
          </div>
        </div>
      </div>

      {/* Notes Section */}
      {data.notes && (
        <div style={{ marginTop: 40, padding: "20px 0", borderTop: "1px solid #f1f5f9" }}>
          <div style={{ fontSize: 11, color: "#888", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px", marginBottom: 12 }}>Notes</div>
          <div style={{ fontSize: 13, color: "#475569" }}>{data.notes}</div>
        </div>
      )}

      {/* Footer Branding */}
      <div style={{ borderTop: "1px solid #f1f5f9", marginTop: 40, padding: "30px 0", textAlign: "center", fontSize: 11, color: "#94a3b8" }}>
          Generated with <span style={{ fontWeight: 700, color: "#b8860b" }}>BillKaro</span> · Secure GST Compliant Digital Invoice
      </div>
    </div>
  );
};

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

// 4. CORPORATE GRID (Structured & Formal)
export const CorporateGrid = ({ data }) => {
  const isPaid = data.paidStatus === "paid";
  return (
    <div style={{ 
      background: "white", 
      minHeight: "29.7cm", 
      width: "21cm", 
      fontFamily: "'Inter', sans-serif", 
      overflow: "hidden", 
      position: "relative", 
      color: "#000", 
      padding: "40px",
      border: "1px solid #000",
      margin: "0 auto"
    }}>
      {/* Top Right Pattern */}
      <div style={{ position: "absolute", top: 0, right: 0, width: 200, height: 100, overflow: "hidden" }}>
          <svg width="200" height="100" viewBox="0 0 200 100">
              <path d="M150 0 L200 50 L200 0 Z" fill="#007bff" opacity="0.8" />
              <path d="M100 0 L150 50 L200 0 Z" fill="#00c4cc" opacity="0.6" />
              <path d="M180 0 L200 20 L200 0 Z" fill="#333" opacity="0.2" />
          </svg>
      </div>

      <div style={{ marginBottom: 30, border: "1px solid #000", padding: 20 }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            <h2 style={{ fontSize: 24, fontWeight: 900, margin: "0 0 10px 0" }}>{data.seller.name}</h2>
            <div style={{ fontSize: 13, color: "#666", lineHeight: "1.6", maxWidth: 300 }}>
              {data.seller.address}
            </div>
            <div style={{ fontSize: 13, fontWeight: 700, marginTop: 5 }}>GSTIN: {data.seller.gstin}</div>
          </div>
          <h1 style={{ fontSize: 60, fontWeight: 300, color: "#1a3a5c", margin: 0, letterSpacing: 2 }}>INVOICE</h1>
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #000", marginBottom: 0 }}>
        <div style={{ padding: 15, borderRight: "1px solid #000" }}>
          <div style={{ display: "grid", gridTemplateColumns: "100px 1fr", gap: 10, fontSize: 13 }}>
            <span style={{ color: "#666" }}>Invoice#</span>
            <span style={{ fontWeight: 700 }}>{data.invoicePrefix}{data.invoiceNum}</span>
            <span style={{ color: "#666" }}>Invoice Date</span>
            <span style={{ fontWeight: 700 }}>{data.invoiceDate}</span>
            <span style={{ color: "#666" }}>Terms</span>
            <span style={{ fontWeight: 700 }}>{data.notes ? "Custom" : "Due on Receipt"}</span>
            <span style={{ color: "#666" }}>Due Date</span>
            <span style={{ fontWeight: 700 }}>{data.dueDate || data.invoiceDate}</span>
          </div>
        </div>
        <div style={{ padding: 15 }}>
          {/* Empty section in screenshot */}
        </div>
      </div>

      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", border: "1px solid #000", borderTop: 0 }}>
        <div style={{ borderRight: "1px solid #000" }}>
          <div style={{ background: "#f8fafc", padding: "8px 15px", borderBottom: "1px solid #000", fontSize: 13, fontWeight: 700 }}>Bill To</div>
          <div style={{ padding: 15 }}>
            <div style={{ fontSize: 16, fontWeight: 900, marginBottom: 5 }}>{data.buyer.name}</div>
            <div style={{ fontSize: 13, color: "#555", lineHeight: "1.5" }}>{data.buyer.address}</div>
            {data.buyer.gstin && <div style={{ fontSize: 12, fontWeight: 700, marginTop: 8 }}>GST: {data.buyer.gstin}</div>}
          </div>
        </div>
        <div>
          <div style={{ background: "#f8fafc", padding: "8px 15px", borderBottom: "1px solid #000", fontSize: 13, fontWeight: 700 }}>Ship To</div>
          <div style={{ padding: 15, fontSize: 13, color: "#555", lineHeight: "1.5" }}>
            {data.buyer.address}
          </div>
        </div>
      </div>

      <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 0, border: "1px solid #000" }}>
        <thead>
          <tr style={{ background: "#1a3a5c", color: "white" }}>
            <th style={{ padding: "12px 10px", textAlign: "left", fontSize: 12, border: "1px solid #000" }}>#</th>
            <th style={{ padding: "12px 10px", textAlign: "left", fontSize: 12, border: "1px solid #000" }}>Item & Description</th>
            <th style={{ padding: "12px 10px", textAlign: "right", fontSize: 12, border: "1px solid #000", width: 80 }}>Qty</th>
            <th style={{ padding: "12px 10px", textAlign: "right", fontSize: 12, border: "1px solid #000", width: 100 }}>Rate</th>
            <th style={{ padding: "12px 10px", textAlign: "right", fontSize: 12, border: "1px solid #000", width: 120 }}>Amount</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ padding: "15px 10px", border: "1px solid #000", verticalAlign: "top", textAlign: "center" }}>{i + 1}</td>
              <td style={{ padding: "15px 10px", border: "1px solid #000", verticalAlign: "top" }}>
                <div style={{ fontWeight: 700, marginBottom: 5 }}>{item.desc}</div>
                <div style={{ fontSize: 12, color: "#666" }}>{item.hsn ? `HSN: ${item.hsn}` : ""}</div>
              </td>
              <td style={{ padding: "15px 10px", border: "1px solid #000", verticalAlign: "top", textAlign: "right" }}>{parseFloat(item.qty).toFixed(2)}</td>
              <td style={{ padding: "15px 10px", border: "1px solid #000", verticalAlign: "top", textAlign: "right" }}>₹{parseFloat(item.rate).toLocaleString()}</td>
              <td style={{ padding: "15px 10px", border: "1px solid #000", verticalAlign: "top", textAlign: "right", fontWeight: 700 }}>₹{(item.qty * item.rate).toLocaleString()}</td>
            </tr>
          ))}
          <tr style={{ border: "1px solid #000" }}>
            <td colSpan="4" style={{ textAlign: "right", padding: "10px 15px", fontWeight: 700, fontSize: 13 }}>Sub Total</td>
            <td style={{ textAlign: "right", padding: "10px 15px", fontWeight: 700, fontSize: 13 }}>₹{data.totals.taxable.toLocaleString()}</td>
          </tr>
        </tbody>
      </table>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 0, border: "1px solid #000", borderTop: 0 }}>
        <div style={{ padding: 20, flex: 1 }}>
          <div style={{ fontSize: 13, color: "#666", marginBottom: 20 }}>Thanks for shopping with us.</div>
          <div style={{ fontSize: 13, fontWeight: 900, marginBottom: 5 }}>Terms & Conditions</div>
          <div style={{ fontSize: 11, color: "#666", lineHeight: "1.6", maxWidth: 400 }}>
            {data.notes || "Full payment is due upon receipt of this invoice. Late payments may incur additional charges or interest as per the applicable laws."}
          </div>
        </div>
        <div style={{ width: 300, background: "#d1e9ff", padding: 20, borderLeft: "1px solid #000" }}>
           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>Tax Rate</span>
              <span style={{ fontWeight: 700 }}>{data.items[0]?.gstRate || 0}%</span>
           </div>
           <div style={{ display: "flex", justifyContent: "space-between", marginBottom: 10, fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>Total</span>
              <span style={{ fontWeight: 900, fontSize: 18 }}>₹{data.totals.total.toLocaleString()}</span>
           </div>
           <div style={{ display: "flex", justifyContent: "space-between", fontSize: 14 }}>
              <span style={{ fontWeight: 700 }}>Balance Due</span>
              <span style={{ fontWeight: 900, fontSize: 18 }}>₹{data.totals.total.toLocaleString()}</span>
           </div>
        </div>
      </div>

      <div style={{ display: "flex", justifyContent: "space-between", marginTop: 40 }}>
          <div style={{ flex: 1 }}>
             <UPI_QR seller={data.seller} total={data.totals.total} />
          </div>
          <div style={{ textAlign: "right", minWidth: 250 }}>
             <div style={{ fontSize: 14, fontWeight: 900, marginBottom: 40 }}>For {data.seller.name}</div>
             <div style={{ textAlign: "center" }}>
                {data.sellerSignature && <img src={data.sellerSignature} style={{ maxHeight: 60, marginBottom: 10 }} alt="sign" />}
                <div style={{ borderTop: "1px solid #000", paddingTop: 10, fontSize: 13, fontWeight: 900 }}>Authorized Signatory</div>
                <div style={{ fontSize: 11, color: "#666", marginTop: 5 }}>This is a computer generated invoice</div>
             </div>
          </div>
      </div>

      {/* Bottom Left Pattern */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: 200, height: 100, overflow: "hidden" }}>
          <svg width="200" height="100" viewBox="0 0 200 100">
              <path d="M0 100 L50 50 L0 50 Z" fill="#007bff" opacity="0.8" />
              <path d="M0 100 L100 0 L0 0 Z" fill="#00c4cc" opacity="0.4" />
              <path d="M0 80 L20 100 L0 100 Z" fill="#333" opacity="0.2" />
          </svg>
      </div>
    </div>
  );
};

const PremiumTemplates = ({ templateId, ...props }) => {
  const templates = {
    executive: ExecutivePro,
    minimal: ModernMinimal,
    standard: StandardClean,
    corporate: CorporateGrid,
  };

  const Selected = templates[templateId] || ExecutivePro;
  return <Selected data={props} />;
};

export default PremiumTemplates;
