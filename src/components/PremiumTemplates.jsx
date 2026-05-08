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

// 1. EXECUTIVE PRO (Tech Professional - SaaS Style)
// 1. EXECUTIVE PRO (Wavy Blue Gradient Design)
export const ExecutivePro = ({ data }) => {
  const accent = "#003580"; // Deep Blue
  const gradient = "linear-gradient(90deg, #001f4d 0%, #0047b3 100%)";
  const lightGray = "#f3f4f6";
  const borderGray = "#d1d5db";

  return (
    <div style={{ padding: 0, minHeight: "29.7cm", width: "21cm", background: "#fff", boxSizing: "border-box", color: "#1f2937", fontFamily: "'Inter', sans-serif", position: "relative", overflow: "hidden" }}>
      {/* Wavy Header */}
      <div style={{ position: "relative", height: "240px", background: gradient, padding: "60px", color: "#fff" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
          <div>
            {data.sellerLogo && <img src={data.sellerLogo} alt="Logo" style={{ height: 60, width: "auto", marginBottom: 20, borderRadius: 4 }} />}
            <h1 style={{ fontSize: "64px", fontWeight: "900", margin: 0, letterSpacing: "2px", lineHeight: 1 }}>INVOICE</h1>
          </div>
          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "18px", fontWeight: "700", marginTop: "10px" }}>NO: {data.invoicePrefix}{data.invoiceNum}</div>
            <div style={{ fontSize: "14px", opacity: 0.8, marginTop: 4 }}>Date: {data.invoiceDate}</div>
          </div>
        </div>
        
        {/* Wavy Shape Overlay */}
        <svg viewBox="0 0 500 150" preserveAspectRatio="none" style={{ position: "absolute", bottom: -2, left: 0, width: "100%", height: "100px" }}>
          <path d="M0.00,49.98 C149.99,150.00 349.89,-49.98 500.00,49.98 L500.00,150.00 L0.00,150.00 Z" style={{ stroke: "none", fill: "#fff" }}></path>
        </svg>
      </div>

      <div style={{ padding: "0 60px 60px 60px" }}>
        {/* Contact Info */}
        <div style={{ display: "flex", justifyContent: "space-between", marginBottom: "40px" }}>
          <div style={{ width: "300px" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", color: accent }}>Bill To:</div>
            <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>{data.buyer.name}</div>
            <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.5", whiteSpace: "pre-line" }}>{data.buyer.address}</div>
            <div style={{ fontSize: "13px", color: "#374151", marginTop: 8, fontWeight: 700 }}>GSTIN: {data.buyer.gstin || "N/A"}</div>
          </div>
          <div style={{ width: "300px", textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: "12px", color: accent }}>From:</div>
            <div style={{ fontSize: "18px", fontWeight: "800", marginBottom: "4px" }}>{data.seller.name}</div>
            <div style={{ fontSize: "14px", color: "#6b7280", lineHeight: "1.5", whiteSpace: "pre-line" }}>{data.seller.address}</div>
            <div style={{ fontSize: "13px", color: "#374151", marginTop: 8, fontWeight: 700 }}>GSTIN: {data.seller.gstin || "N/A"}</div>
          </div>
        </div>

        {/* Table Section */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "20px" }}>
          <thead>
            <tr style={{ background: accent, color: "#fff" }}>
              <th style={{ padding: "14px 12px", textAlign: "left", fontSize: "12px", fontWeight: "700", textTransform: "uppercase" }}>Description</th>
              <th style={{ padding: "14px 12px", textAlign: "center", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", width: "80px" }}>Qty</th>
              <th style={{ padding: "14px 12px", textAlign: "right", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", width: "120px" }}>Price</th>
              <th style={{ padding: "14px 12px", textAlign: "right", fontSize: "12px", fontWeight: "700", textTransform: "uppercase", width: "120px" }}>Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${lightGray}` }}>
                <td style={{ padding: "16px 12px", fontSize: "14px", color: "#1f2937", fontWeight: 500 }}>{item.desc}</td>
                <td style={{ padding: "16px 12px", textAlign: "center", fontSize: "14px", color: "#4b5563" }}>{item.qty}</td>
                <td style={{ padding: "16px 12px", textAlign: "right", fontSize: "14px", color: "#4b5563" }}>{fmt(item.rate)}</td>
                <td style={{ padding: "16px 12px", textAlign: "right", fontSize: "14px", color: "#1f2937", fontWeight: 700 }}>{fmt(item.qty * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Subtotal Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "40px" }}>
          <div style={{ width: "320px" }}>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${lightGray}` }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>Sub Total</span>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>{fmt(data.totals.taxable)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "10px 0", borderBottom: `1px solid ${lightGray}` }}>
              <span style={{ fontSize: "14px", color: "#6b7280" }}>GST Amount</span>
              <span style={{ fontSize: "14px", fontWeight: "700" }}>{fmt(data.totals.gst)}</span>
            </div>
            <div style={{ display: "flex", justifyContent: "space-between", padding: "20px 20px", background: accent, color: "#fff", marginTop: "10px", borderRadius: "4px" }}>
              <span style={{ fontSize: "16px", fontWeight: "700" }}>Grand Total</span>
              <span style={{ fontSize: "20px", fontWeight: "900" }}>{fmt(data.totals.total)}</span>
            </div>
          </div>
        </div>

        {/* Footer Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: "40px", alignItems: "flex-start" }}>
          <div>
            <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "12px", color: accent, textTransform: "uppercase" }}>Payment Details</div>
            <div style={{ display: "grid", gridTemplateColumns: "80px 1fr", gap: "6px", fontSize: "13px" }}>
              <span style={{ color: "#6b7280" }}>Bank:</span>
              <span style={{ fontWeight: "700" }}>{data.seller.bankName || "N/A"}</span>
              <span style={{ color: "#6b7280" }}>Account:</span>
              <span style={{ fontWeight: "700" }}>{data.seller.accountNum || "N/A"}</span>
              <span style={{ color: "#6b7280" }}>IFSC:</span>
              <span style={{ fontWeight: "700" }}>{data.seller.ifsc || "N/A"}</span>
              <span style={{ color: "#6b7280" }}>UPI ID:</span>
              <span style={{ fontWeight: "800", color: "#b8860b" }}>{data.seller.upi || "N/A"}</span>
            </div>
          </div>

          <div style={{ textAlign: "center" }}>
            {data.showUpiQr && <UPI_QR seller={data.seller} total={data.totals.total} />}
            <div style={{ fontSize: "42px", fontWeight: "500", color: "#1f2937", fontFamily: "'Playfair Display', serif", marginTop: 20 }}>Thank You!</div>
          </div>

          <div style={{ textAlign: "right" }}>
            <div style={{ fontSize: "14px", fontWeight: "800", marginBottom: "40px", color: accent, textTransform: "uppercase" }}>Authorized Signature</div>
            {data.sellerSignature ? (
              <img src={data.sellerSignature} style={{ maxHeight: 60, marginBottom: 10, mixBlendMode: "multiply" }} alt="Sign" />
            ) : (
              <div style={{ height: 60 }}></div>
            )}
            <div style={{ width: "200px", height: "1px", background: borderGray, marginLeft: "auto", marginBottom: "8px" }}></div>
            <div style={{ fontSize: "13px", fontWeight: "700" }}>{data.seller.name}</div>
          </div>
        </div>

        {/* Notes */}
        {data.notes && (
          <div style={{ marginTop: "40px", padding: "20px", background: "#f9fafb", borderRadius: "8px", borderLeft: `4px solid ${accent}` }}>
            <div style={{ fontSize: "12px", fontWeight: "800", color: accent, marginBottom: "8px", textTransform: "uppercase" }}>Notes & Terms</div>
            <div style={{ fontSize: "13px", color: "#4b5563", lineHeight: "1.6" }}>{data.notes}</div>
          </div>
        )}
      </div>
    </div>
  );
};



// 2. MODERN MINIMAL (Sleek Design Studio Style)
export const ModernMinimal = ({ data }) => {
  const accent = "#6366f1"; // Indigo/Purple
  const lightAccent = "#e0e7ff";
  
  return (
    <div style={{ 
      padding: 0, 
      minHeight: "29.7cm", 
      width: "21cm", 
      background: "#fff", 
      boxSizing: "border-box", 
      color: "#1e293b", 
      fontFamily: "'Inter', sans-serif",
      position: "relative",
      overflow: "hidden"
    }}>
      {/* Header Pattern Background */}
      <div style={{ position: "absolute", top: 0, left: 0, width: "100%", height: "100px", background: "#f1f5f9", zIndex: 0 }}>
         <div style={{ position: "absolute", top: 20, right: "15%", width: 20, height: 20, borderRadius: "50%", border: `4px solid ${accent}`, opacity: 0.2 }}></div>
         <div style={{ position: "absolute", top: 10, right: "5%", width: 40, height: 40, borderRadius: "50%", background: "#f472b6", opacity: 0.1, clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)" }}></div>
      </div>

      <div style={{ position: "relative", zIndex: 1, padding: "60px" }}>
        {/* Logo & Header */}
        <div style={{ marginBottom: "40px" }}>
           <div style={{ display: "flex", alignItems: "center", gap: "10px", marginBottom: "30px" }}>
              {data.sellerLogo ? (
                <img src={data.sellerLogo} style={{ height: 32 }} alt="Logo" />
              ) : (
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <div style={{ width: 24, height: 24, background: accent, borderRadius: "50%", display: "flex", alignItems: "center", justifyContent: "center", color: "#fff" }}>◈</div>
                  <span style={{ fontWeight: 800, fontSize: 18 }}>Your Logo</span>
                </div>
              )}
           </div>
           
           <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div>
                <h1 style={{ fontSize: "56px", fontWeight: "900", color: accent, margin: 0, lineHeight: 1 }}>Invoice</h1>
                <div style={{ fontSize: "14px", marginTop: "10px", fontWeight: "600", color: "#64748b" }}>Date : {data.invoiceDate}</div>
                <div style={{ fontSize: "12px", color: "#94a3b8", marginTop: "8px", maxWidth: "250px" }}>
                  {data.notes?.slice(0, 50) || "Professional invoice generated for your business services."}
                </div>
              </div>
              
              <div style={{ textAlign: "right" }}>
                <div style={{ fontSize: "18px", fontWeight: "800", color: accent, marginBottom: "8px" }}>Billing To</div>
                <div style={{ fontSize: "16px", fontWeight: "700" }}>{data.buyer.name}</div>
                <div style={{ fontSize: "13px", color: "#64748b", lineHeight: "1.5", whiteSpace: "pre-line", maxWidth: "200px", marginLeft: "auto" }}>{data.buyer.address}</div>
                <div style={{ fontSize: "13px", color: "#64748b", marginTop: "4px" }}>{data.buyer.phone}</div>
              </div>
           </div>
        </div>

        {/* Table */}
        <table style={{ width: "100%", borderCollapse: "collapse", marginBottom: "30px" }}>
          <thead>
            <tr style={{ borderBottom: `2px solid ${accent}` }}>
              <th style={{ padding: "15px 0", textAlign: "left", color: accent, fontSize: "14px", fontWeight: "800" }}>Description</th>
              <th style={{ padding: "15px 0", textAlign: "center", color: accent, fontSize: "14px", fontWeight: "800", width: "60px" }}>Qty</th>
              <th style={{ padding: "15px 0", textAlign: "center", color: accent, fontSize: "14px", fontWeight: "800", width: "100px" }}>Price</th>
              <th style={{ padding: "15px 0", textAlign: "right", color: accent, fontSize: "14px", fontWeight: "800", width: "120px" }}>Sub Total</th>
            </tr>
          </thead>
          <tbody>
            {data.items.map((item, i) => (
              <tr key={i} style={{ borderBottom: `1px solid ${lightAccent}` }}>
                <td style={{ padding: "20px 0", fontSize: "14px", fontWeight: "500", color: "#475569" }}>{item.desc}</td>
                <td style={{ padding: "20px 0", textAlign: "center", fontSize: "14px", color: "#64748b" }}>{item.qty}</td>
                <td style={{ padding: "20px 0", textAlign: "center", fontSize: "14px", color: "#64748b" }}>{fmt(item.rate)}</td>
                <td style={{ padding: "20px 0", textAlign: "right", fontSize: "14px", fontWeight: "700", color: accent }}>{fmt(item.qty * item.rate)}</td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* Total Bar */}
        <div style={{ display: "flex", justifyContent: "flex-end", marginBottom: "60px" }}>
          <div style={{ display: "flex", gap: "60px", alignItems: "center" }}>
            <span style={{ fontSize: "18px", fontWeight: "800", color: accent }}>Total</span>
            <span style={{ fontSize: "22px", fontWeight: "900", color: accent }}>{fmt(data.totals.total)}</span>
          </div>
        </div>

        {/* Footer Info Grid */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px" }}>
          <div>
            <div style={{ fontSize: "15px", fontWeight: "800", color: accent, marginBottom: "12px" }}>Payment Info:</div>
            <div style={{ fontSize: "13px", color: "#64748b", display: "grid", gap: "4px" }}>
              <div>Account: {data.seller.accountNum || "N/A"}</div>
              <div>A/C Name: {data.seller.name}</div>
              <div>Bank Details: {data.seller.bankName} {data.seller.ifsc}</div>
            </div>
            
            <div style={{ marginTop: "30px", display: "grid", gap: "8px", fontSize: "12px", color: "#64748b" }}>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: accent }}>📞</span> {data.seller.phone}
              </div>
              <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                <span style={{ color: accent }}>✉</span> {data.seller.email}
              </div>
              {data.seller.website && (
                <div style={{ display: "flex", alignItems: "center", gap: "8px" }}>
                  <span style={{ color: accent }}>🌐</span> {data.seller.website}
                </div>
              )}
            </div>
          </div>
          
          <div style={{ textAlign: "right" }}>
             <div style={{ height: "100px", display: "flex", flexDirection: "column", justifyContent: "flex-end", alignItems: "flex-end" }}>
                {data.sellerSignature && <img src={data.sellerSignature} style={{ height: 50, marginBottom: 8 }} alt="Signature" />}
                <div style={{ width: "200px", height: "1.5px", background: accent }}></div>
                <div style={{ fontSize: "12px", fontWeight: "700", color: "#64748b", marginTop: "8px" }}>Authorised Sign</div>
             </div>
          </div>
        </div>
      </div>

      {/* Footer Illustrations */}
      <div style={{ position: "absolute", bottom: 0, left: 0, width: "100%", height: "150px", background: "#f8fafc", overflow: "hidden", display: "flex", alignItems: "flex-end", padding: "0 40px" }}>
         <div style={{ position: "absolute", bottom: 60, left: "10%", width: 60, height: 60, borderRadius: "50%", background: "#fb923c", opacity: 0.8 }}></div>
         <div style={{ position: "absolute", bottom: 80, left: "25%", width: 120, height: 120, borderRadius: "50%", border: "15px solid #f472b6", opacity: 0.6, clipPath: "polygon(0 0, 100% 0, 100% 50%, 0 50%)", transform: "rotate(180deg)" }}></div>
         
         {/* Simple SVG Tool Illustrations */}
         <div style={{ position: "absolute", bottom: 0, right: "10%", display: "flex", gap: "20px", alignItems: "flex-end", opacity: 0.6 }}>
            <div style={{ width: 15, height: 100, background: "linear-gradient(to top, #4f46e5, #818cf8)", borderRadius: "10px 10px 0 0" }}></div>
            <div style={{ width: 40, height: 40, border: "8px solid #4f46e5", borderRadius: "50%" }}></div>
            <div style={{ width: 15, height: 120, background: "#cbd5e1", borderRadius: "10px 10px 0 0" }}></div>
         </div>
      </div>
    </div>
  );
};

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
    corporate: CorporateGrid,
  };

  const Selected = templates[templateId] || ExecutivePro;
  return <Selected data={props} />;
};

export default PremiumTemplates;
