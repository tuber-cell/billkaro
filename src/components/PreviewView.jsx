import React, { useState, useEffect } from "react";
import { S, fmt, today } from "./common/Constants";
import Header from "./common/Header";
import PremiumTemplate from "./PremiumTemplate";

const PreviewView = ({ 
  step, setStep, user, dbPro, plan, PLANS, 
  handleLogout, setShowLogin, showLogin, 
  handleNewInvoice, handleWhatsApp, handlePaywall, canDownload, isPro, dailyLeft,
  previewRef, paidStatus, dueDate, watermark, showWatermark, docType, invoicePrefix, invoiceNum,
  seller, sellerLogo, sellerSignature, buyer, items, calcItem, totals, notes,
  invoiceDate, supplyType, showUpiQr,
  cameFromDashboard, setCameFromDashboard,
  trackInvoiceEvent, getInvoiceStatus, INVOICE_STATUSES
}) => {
  const [showEwayHelper, setShowEwayHelper] = useState(false);

  useEffect(() => {
    // Only track viewed if it was draft
    if (getInvoiceStatus(invoiceNum) === "DRAFT") {
      trackInvoiceEvent(invoiceNum, "VIEWED");
    }
  }, [invoiceNum]);

  const currentStatus = getInvoiceStatus(invoiceNum);
  const sInfo = INVOICE_STATUSES[currentStatus] || INVOICE_STATUSES.DRAFT;
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
        @media (max-width: 768px) {
          .print-actions { padding: 10px 12px; gap: 6px; position: absolute !important; }
          .print-actions button { font-size: 11px !important; padding: 7px 10px !important; }
          .invoice-wrap { margin: 120px 8px 20px !important; }
          
          /* Invoice stacking */
          .invoice-header { flex-direction: column !important; align-items: center !important; padding: 24px 20px !important; text-align: center !important; }
          .invoice-header > div { align-items: center !important; text-align: center !important; width: 100% !important; }
          .invoice-billed-container { grid-template-columns: 1fr !important; gap: 24px !important; padding: 20px !important; }
          .invoice-meta { flex-wrap: wrap !important; padding: 12px 20px !important; gap: 12px !important; }
          .invoice-meta > div { flex: 1 1 100px; text-align: center; }
          
          .invoice-items-table thead { display: none; }
          .invoice-items-table tr { display: block; border-bottom: 1px solid #eee; padding: 12px 0; }
          .invoice-items-table td { display: flex; justify-content: space-between; padding: 5px 0 !important; text-align: right !important; border: none !important; }
          .invoice-items-table td::before { content: attr(data-label); color: #888; font-size: 10px; text-transform: uppercase; font-weight: 700; text-align: left; }
          .invoice-items-table td:nth-child(1) { display: none; } /* Hide # on mobile */
          .invoice-items-table td:nth-child(2) { display: block; text-align: center !important; font-weight: 700; font-size: 14px; margin-bottom: 8px; background: #f8f9fa; padding: 8px !important; border-radius: 6px !important; }
          .invoice-items-table td:nth-child(2)::before { display: none; }
          
          .invoice-footer-grid { grid-template-columns: 1fr !important; gap: 20px !important; padding: 20px !important; }
          .invoice-footer-grid > div { width: 100% !important; text-align: center !important; }
          .invoice-footer-grid > div > div { justify-content: center !important; }
          .invoice-sign-area { align-items: center !important; text-align: center !important; }
        }
        @media print {
          @page { margin: 0; size: auto; }
          body { background: white !important; -webkit-print-color-adjust: exact !important; print-color-adjust: exact !important; }
          .print-actions { display: none !important; }
          .invoice-wrap { 
            margin: 0 !important; 
            padding: 10mm 15mm !important; 
            width: 100% !important;
            max-width: none !important;
          }
          .invoice-wrap > div {
             box-shadow: none !important;
             border: 1px solid #f0f0f0 !important;
             border-radius: 0 !important;
          }
          .watermark { display: block !important; }
        }
        * { box-sizing: border-box; }
        .watermark { display: none; }
      `}</style>

      {/* Toolbar - Use Header for consistent nav, but keep print actions */}
      <div className="print-actions">
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", fontSize: 18, marginRight: 16 }}>⬡ BillKaro</div>
        
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginRight: "auto" }}>
            <button style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("form")}>📝 Create</button>
            <button style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("expenses")}>💸 Expenses</button>
            <button style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer" }} onClick={() => setStep("dashboard")}>📊 Insights</button>
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 10 }}>
            <div style={{ textAlign: "right", lineHeight: 1 }}>
              <div style={{ color: "#e8edf2", fontSize: 11, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
              <div style={{ color: "#d4af37", fontSize: 9 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
            </div>
          </div>
        ) : (
          <button style={{ ...S.btnSecondary, fontSize: 12, padding: "6px 12px", marginRight: 10 }} onClick={() => setShowLogin(true)}>Login</button>
        )}

        <button style={{ ...S.btnSecondary, fontSize: 13, padding: "8px 20px" }} onClick={() => {
          if (cameFromDashboard) {
            setCameFromDashboard(false);
            setStep("dashboard");
          } else {
            setStep("form");
          }
        }}>← Back</button>

        {/* Status Badge */}
        <div style={{ 
          display: "flex", 
          alignItems: "center", 
          gap: 6, 
          background: `${sInfo.color}15`, 
          border: `1px solid ${sInfo.color}30`, 
          padding: "6px 12px", 
          borderRadius: 8,
          marginRight: 10
        }}>
          <span style={{ fontSize: 14 }}>{sInfo.icon}</span>
          <span style={{ color: sInfo.color, fontSize: 11, fontWeight: 700, textTransform: "uppercase", letterSpacing: 0.5 }}>{sInfo.label}</span>
        </div>

        <button
          style={{ ...S.btnSecondary, fontSize: 13, padding: "8px 20px", background: "rgba(52,211,153,0.12)", color: "#34d399", borderColor: "rgba(52,211,153,0.4)" }}
          onClick={handleNewInvoice}
          title="Save current invoice and start a fresh one with a new invoice number"
        >✚ New Invoice</button>
        <button style={{ ...S.btnTeal, padding: "10px 20px", fontSize: 13 }} onClick={handleWhatsApp}>
          📲 WhatsApp
        </button>

        {/* E-Way Bill Button - shows only if invoice > ₹50,000 */}
        {totals.total > 50000 && (
            <button 
                onClick={() => setShowEwayHelper(true)}
                style={{
                    ...S.btnTeal,
                    padding: "10px 20px",
                    fontSize: 13,
                    display: "flex",
                    alignItems: "center",
                    gap: 6,
                    background: "rgba(20,184,166,0.15)",
                    color: "#14b8a6",
                    borderColor: "rgba(20,184,166,0.3)"
                }}
            >
                🚚 E-Way Bill
            </button>
        )}
        {canDownload ? (
          <button style={{ ...S.btnPrimary, padding: "10px 28px", fontSize: 14 }} onClick={handlePaywall}>
            {isPro ? "⬇ Download PDF" : `⬇ Download PDF (${dailyLeft} daily left)`}
          </button>
        ) : (
          <button style={{ ...S.btnPrimary, padding: "10px 28px", fontSize: 14, background: "linear-gradient(135deg, #b8860b, #d4af37)" }} onClick={() => setStep("upgrade")}>
            🔒 Upgrade to Pro — ₹149
          </button>
        )}
      </div>

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
        {isPro ? (
          <PremiumTemplate
            docType={docType} invoicePrefix={invoicePrefix} invoiceNum={invoiceNum}
            invoiceDate={invoiceDate} dueDate={dueDate} supplyType={supplyType}
            paidStatus={paidStatus} seller={seller} sellerLogo={sellerLogo}
            sellerSignature={sellerSignature} buyer={buyer} items={items}
            calcItem={calcItem} totals={totals} notes={notes} showUpiQr={showUpiQr}
            getInvoiceStatus={getInvoiceStatus} INVOICE_STATUSES={INVOICE_STATUSES}
          />
        ) : (
          <div style={{ background: "white", borderRadius: 4, boxShadow: "0 20px 80px rgba(0,0,0,0.4)", fontFamily: "'DM Sans', sans-serif", overflow: "hidden", position: "relative" }}>

            {/* Smart Watermarking Logic */}
            {(() => {
              const isOverdue = paidStatus === "unpaid" && dueDate && new Date(dueDate) < new Date(today());
              const activeWatermark = watermark || (isOverdue ? "OVERDUE" : (showWatermark ? "BILLKARO FREE" : ""));
              
              if (!activeWatermark) return null;

              return (
                <div className="watermark" style={{ 
                  position: "absolute", 
                  top: "50%", 
                  left: "50%", 
                  transform: "translate(-50%,-50%) rotate(-30deg)", 
                  fontSize: (activeWatermark === "OVERDUE" || watermark) ? 120 : 64, 
                  fontWeight: 900, 
                  color: isOverdue && !watermark ? "rgba(239,68,68,0.08)" : "rgba(212,175,55,0.08)", 
                  pointerEvents: "none", 
                  whiteSpace: "nowrap", 
                  zIndex: 0, 
                  fontFamily: "'Playfair Display', serif",
                  ...( (watermark || isOverdue) ? { border: `10px solid ${isOverdue && !watermark ? "rgba(239,68,68,0.08)" : "rgba(212,175,55,0.08)"}`, padding: "20px 60px", borderRadius: 30 } : {})
                }}>
                  {activeWatermark}
                </div>
              );
            })()}

            {/* Header */}
            <div className="invoice-header" style={{ background: "linear-gradient(135deg, #0f1923 0%, #1a3a5c 100%)", padding: "24px 48px", color: "white", display: "flex", justifyContent: "space-between", alignItems: "flex-start" }}>
              <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
                {sellerLogo && <img src={sellerLogo} alt="Logo" style={{ height: 60, maxWidth: 200, objectFit: "contain", alignSelf: "flex-start", marginBottom: 8 }} />}
                <div>
                  <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#d4af37", marginBottom: 2, textTransform: "uppercase" }}>{docType}</div>
                  <div style={{ fontSize: 12, color: "rgba(255,255,255,0.5)" }}>#{invoicePrefix}{invoiceNum}</div>
                  <div style={{ marginTop: 8, display: "flex", gap: 8, alignItems: "center" }}>
                    <div style={{ background: paidStatus === "paid" ? "rgba(34,197,94,0.2)" : "rgba(245,158,11,0.2)", border: `1px solid ${paidStatus === "paid" ? "#22c55e" : "#f59e0b"}`, color: paidStatus === "paid" ? "#22c55e" : "#f59e0b", padding: "2px 10px", borderRadius: 20, fontSize: 11, fontWeight: 700 }}>
                      {paidStatus === "paid" ? "✅ PAID" : "⏳ PENDING"}
                    </div>
                    {getInvoiceStatus && INVOICE_STATUSES && (
                        (() => {
                            const status = getInvoiceStatus(invoiceNum);
                            const sInfo = INVOICE_STATUSES[paidStatus === "paid" ? "PAID" : status] || INVOICE_STATUSES.DRAFT;
                            return (
                                <span style={{ 
                                    background: `${sInfo.color}15`, 
                                    border: `1px solid ${sInfo.color}40`, 
                                    color: sInfo.color, 
                                    padding: "2px 10px", 
                                    borderRadius: 20, 
                                    fontSize: 11, 
                                    fontWeight: 700
                                }}>
                                    {sInfo.icon} {sInfo.label}
                                </span>
                            );
                        })()
                    )}
                  </div>
                </div>
              </div>
              <div style={{ textAlign: "right" }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "white", marginBottom: 4, textTransform: "uppercase" }}>{seller.name || "Your Business"}</div>
                {seller.gstin && <div style={{ fontSize: 12, color: "#d4af37" }}>GSTIN: {seller.gstin}</div>}
                {seller.address && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{seller.address}</div>}
                {seller.city && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.city}, {seller.state} {seller.pin}</div>}
                {seller.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.email}</div>}
                {seller.phone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.phone}</div>}
              </div>
            </div>

            {/* Meta */}
            <div className="invoice-meta" style={{ background: "#f8f9fa", padding: "12px 48px", display: "flex", justifyContent: "space-between", borderBottom: "2px solid #e9ecef" }}>
              {[["Invoice Date", invoiceDate], ["Due Date", dueDate || "On Receipt"], ["Supply Type", supplyType === "intra" ? "Intra-State" : "Inter-State"]].map(([lbl, val]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 2 }}>{lbl}</div>
                  <div style={{ fontSize: 12, fontWeight: 600, color: "#1a2d45" }}>{val}</div>
                </div>
              ))}
            </div>

            {/* Billed by/to */}
            <div className="invoice-billed-container" style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "16px 48px", gap: 32, borderBottom: "1px solid #e9ecef" }}>
              {[["Billed By", seller], ["Billed To", buyer]].map(([lbl, data]) => (
                <div key={lbl}>
                  <div style={{ fontSize: 9, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 6 }}>{lbl}</div>
                  <div style={{ fontWeight: 700, fontSize: 14, color: "#1a2d45", marginBottom: 2, textTransform: "capitalize" }}>{data.name || "—"}</div>
                  {data.gstin && <div style={{ fontSize: 11, color: "#555" }}>GSTIN: {data.gstin}</div>}
                  <div style={{ fontSize: 11, color: "#555", lineHeight: "1.2", textTransform: "capitalize" }}>
                    {data.address && <span>{data.address}, </span>}
                    {data.city && <span>{data.city}, {data.state} {data.pin}</span>}
                  </div>
                  {data.phone && <div style={{ fontSize: 11, color: "#555" }}>{data.phone}</div>}
                </div>
              ))}
            </div>

            {/* Items */}
            <div style={{ padding: "0 48px 20px" }}>
              <table className="invoice-items-table" style={{ width: "100%", borderCollapse: "collapse", marginTop: 16 }}>
                <thead>
                  <tr style={{ background: "#0f1923" }}>
                    {["#", "Description", "Qty", "Rate", "Disc %", "GST %", ...(supplyType === "intra" ? ["CGST", "SGST"] : ["IGST"]), "Total"].map(h => (
                      <th key={h} style={{ padding: "10px 12px", color: "#d4af37", fontSize: 11, fontWeight: 600, letterSpacing: "0.06em", textAlign: h === "Description" ? "left" : h === "#" ? "center" : "right" }}>{h}</th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {items.map((item, idx) => {
                    const c = calcItem(item);
                    return (
                      <tr key={item.id} style={{ background: idx % 2 === 0 ? "white" : "#f8f9fa" }}>
                        <td data-label="#" style={{ padding: "8px 12px", fontSize: 13, color: "#888", textAlign: "center" }}>{idx + 1}</td>
                        <td data-label="Description" style={{ padding: "8px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 700, textTransform: "capitalize" }}>{item.desc}</td>
                        <td data-label="Qty" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.qty}</td>
                        <td data-label="Rate" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{parseFloat(item.rate || 0).toLocaleString("en-IN")}</td>
                        <td data-label="Disc %" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.discount || 0}%</td>
                        <td data-label="GST %" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.gstRate}%</td>
                        {supplyType === "intra" ? (
                          <>
                            <td data-label="CGST" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                            <td data-label="SGST" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                          </>
                        ) : (
                          <td data-label="IGST" style={{ padding: "8px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{c.gstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        )}
                        <td data-label="Total" style={{ padding: "8px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 700, textAlign: "right" }}>{fmt(c.total)}</td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>

              <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 12 }}>
                <div style={{ width: 240 }}>
                  {[["Taxable Amount", fmt(totals.taxable)], ...(supplyType === "intra" ? [["CGST", fmt(totals.gst / 2)], ["SGST", fmt(totals.gst / 2)]] : [["IGST", fmt(totals.gst)]])].map(([lbl, val]) => (
                    <div key={lbl} style={{ display: "flex", justifyContent: "space-between", padding: "4px 0", borderBottom: "1px solid #e9ecef" }}>
                      <span style={{ color: "#555", fontSize: 12 }}>{lbl}</span>
                      <span style={{ color: "#333", fontSize: 12 }}>{val}</span>
                    </div>
                  ))}
                  <div style={{ display: "flex", justifyContent: "space-between", background: "#0f1923", padding: "10px 14px", marginTop: 6, borderRadius: 4 }}>
                    <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 13 }}>TOTAL DUE</span>
                    <span style={{ color: "#d4af37", fontWeight: 800, fontSize: 16 }}>{fmt(totals.total)}</span>
                  </div>
                </div>
              </div>
            </div>

            {/* Payment & Signatory Section */}
            <div className="invoice-footer-grid" style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", padding: "0 48px 24px", gap: 32, marginTop: 12, breakInside: "avoid" }}>
              <div style={{ background: "#f8f9fa", padding: "16px", borderRadius: 8, border: "1px solid #e9ecef", display: "flex", gap: 16 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 12, fontWeight: 700 }}>Bank & Payment Details</div>
                  <div style={{ display: "grid", gap: 6 }}>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#777" }}>Bank Name:</span>
                      <span style={{ color: "#333", fontWeight: 600, textTransform: "uppercase" }}>{seller.bankName || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#777" }}>Account No:</span>
                      <span style={{ color: "#333", fontWeight: 600 }}>{seller.accountNum || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12 }}>
                      <span style={{ color: "#777" }}>IFSC Code:</span>
                      <span style={{ color: "#333", fontWeight: 600 }}>{seller.ifsc || "—"}</span>
                    </div>
                    <div style={{ display: "flex", justifyContent: "space-between", fontSize: 12, marginTop: 4, paddingTop: 4, borderTop: "1px dashed #ddd" }}>
                      <span style={{ color: "#777" }}>UPI ID:</span>
                      <span style={{ color: "#d4af37", fontWeight: 700 }}>{seller.upi || "—"}</span>
                    </div>
                  </div>
                </div>
                
            {showUpiQr && seller.upi && (
                <div style={{ textAlign: "center", borderLeft: "1px solid #eee", paddingLeft: 16, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
                    <div style={{ fontSize: 8, fontWeight: 800, color: "#1a3a5c", marginBottom: 4, textTransform: "uppercase" }}>Scan to Pay</div>
                    <img 
                        src={`https://api.qrserver.com/v1/create-qr-code/?size=80x80&data=${encodeURIComponent(`upi://pay?pa=${seller.upi}&pn=${encodeURIComponent(seller.name)}&am=${totals.total}&cu=INR`)}`}
                        alt="Payment QR"
                        style={{ width: 80, height: 80, border: "4px solid white", boxShadow: "0 2px 12px rgba(0,0,0,0.15)", borderRadius: 4 }}
                        onError={(e) => { e.target.style.display = 'none'; }}
                    />
                    <div style={{ fontSize: 9, color: "#1a3a5c", marginTop: 4, fontWeight: 700 }}>₹{totals.total.toLocaleString()}</div>
                </div>
            )}
              </div>

              <div className="invoice-sign-area" style={{ textAlign: "right", display: "flex", flexDirection: "column", justifyContent: "space-between" }}>
                <div style={{ fontSize: 12, color: "#1a2d45", fontWeight: 800, textTransform: "uppercase", marginBottom: sellerSignature ? 4 : 45, letterSpacing: "0.03em" }}>
                  For {seller.name || "Your Business"}
                </div>
                {sellerSignature && (
                  <div style={{ height: 50, display: "flex", alignItems: "center", justifyContent: "flex-end" }}>
                    <img src={sellerSignature} alt="Signature" style={{ maxHeight: 50, maxWidth: 150, objectFit: "contain" }} />
                  </div>
                )}
                <div>
                  <div style={{ height: 1, background: "#1a2d45", width: "100%", marginBottom: 8 }}></div>
                  <div style={{ fontSize: 12, fontWeight: 700, color: "#1a2d45" }}>Authorized Signatory</div>
                  <div style={{ fontSize: 10, color: "#888", marginTop: 4 }}>This is a computer generated invoice</div>
                </div>
              </div>
            </div>

            {notes && (
              <div style={{ padding: "10px 48px", background: "#f8f9fa", borderTop: "1px solid #e9ecef" }}>
                <div style={{ fontSize: 10, color: "#888", marginBottom: 2, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</div>
                <div style={{ fontSize: 12, color: "#444", lineHeight: "1.3" }}>{notes}</div>
              </div>
            )}

            <div style={{ background: "rgba(15, 25, 35, 0.03)", padding: "10px 48px", textAlign: "center", fontSize: 9, color: "#8899aa", borderTop: "1px solid #e9ecef", letterSpacing: "0.05em" }}>
              Generated with <span style={{ color: "#d4af37", fontWeight: 700 }}>BillKaro</span> · Secure GST Compliant Digital Invoice
            </div>
          </div>
        )}
      </div>

      {/* E-Way Bill Helper Modal */}
      {showEwayHelper && (
          <div style={{
              position: "fixed",
              top: 0,
              left: 0,
              right: 0,
              bottom: 0,
              background: "rgba(0,0,0,0.85)",
              backdropFilter: "blur(4px)",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              zIndex: 99999,
              padding: 20
          }}>
              <div style={{
                  background: "#1a2d45",
                  borderRadius: 20,
                  padding: "32px 28px",
                  maxWidth: 520,
                  width: "100%",
                  border: "1px solid rgba(212,175,55,0.3)",
                  boxShadow: "0 25px 60px rgba(0,0,0,0.5)",
                  maxHeight: "90vh",
                  overflowY: "auto"
              }}>
                  {/* Header */}
                  <div style={{
                      display: "flex",
                      justifyContent: "space-between",
                      alignItems: "center",
                      marginBottom: 20
                  }}>
                      <h3 style={{
                          color: "#d4af37",
                          fontSize: 20,
                          fontFamily: "'Playfair Display', serif",
                          margin: 0,
                          display: "flex",
                          alignItems: "center",
                          gap: 10
                      }}>
                          🚚 E-Way Bill Generator
                      </h3>
                      <button 
                          onClick={() => setShowEwayHelper(false)}
                          style={{
                              background: "none",
                              border: "none",
                              color: "#8899aa",
                              fontSize: 22,
                              cursor: "pointer",
                              padding: "4px 8px"
                          }}
                      >
                          ✕
                      </button>
                  </div>

                  {/* Info Banner */}
                  <div style={{
                      background: "rgba(245,158,11,0.08)",
                      border: "1px solid rgba(245,158,11,0.2)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 20
                  }}>
                      <p style={{ color: "#f59e0b", fontSize: 14, margin: 0, fontWeight: 600 }}>
                          ⚠️ This invoice requires an E-Way Bill
                      </p>
                      <p style={{ color: "#8899aa", fontSize: 12, margin: "8px 0 0" }}>
                          Goods valued above ₹50,000 must have an E-Way Bill when transported.
                      </p>
                  </div>

                  {/* Invoice Summary */}
                  <div style={{
                      background: "rgba(255,255,255,0.03)",
                      borderRadius: 12,
                      padding: 16,
                      marginBottom: 24
                  }}>
                      <div style={{ color: "#8899aa", fontSize: 10, textTransform: "uppercase", letterSpacing: 1, marginBottom: 12, fontWeight: 700 }}>
                          Invoice Summary
                      </div>
                      <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
                          {[
                              ["📋 Invoice No", `#${invoicePrefix}${invoiceNum}`],
                              ["📅 Date", invoiceDate],
                              ["🏢 Seller GSTIN", seller.gstin || "N/A"],
                              ["👤 Buyer GSTIN", buyer.gstin || "URP (Unregistered)"],
                              ["💰 Invoice Value", fmt(totals.total)],
                              ["📦 Items", `${(items || []).length} item(s)`],
                          ].map(([label, value]) => (
                              <div key={label} style={{ display: "flex", justifyContent: "space-between" }}>
                                  <span style={{ color: "#8899aa" }}>{label}</span>
                                  <span style={{ color: "#e8edf2", fontWeight: 600 }}>{value}</span>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Steps */}
                  <div style={{
                      background: "rgba(52,211,153,0.06)",
                      border: "1px solid rgba(52,211,153,0.15)",
                      borderRadius: 12,
                      padding: 20,
                      marginBottom: 24
                  }}>
                      <div style={{ color: "#34d399", fontSize: 13, fontWeight: 700, marginBottom: 16 }}>
                          ✅ How to Generate (2 Minutes)
                      </div>
                      <div style={{ display: "flex", flexDirection: "column", gap: 14 }}>
                          {[
                              { step: "1", title: "Copy Invoice Details", desc: "Click the button below to copy all details to your clipboard." },
                              { step: "2", title: "Open E-Way Bill Portal", desc: "Login with your GST credentials on the government portal." },
                              { step: "3", title: "Generate E-Way Bill", desc: "Click 'Generate New' and paste the copied details into the form." },
                          ].map(({ step, title, desc }) => (
                              <div key={step} style={{ display: "flex", gap: 12 }}>
                                  <div style={{
                                      background: "rgba(52,211,153,0.15)",
                                      color: "#34d399",
                                      width: 28,
                                      height: 28,
                                      borderRadius: "50%",
                                      display: "flex",
                                      alignItems: "center",
                                      justifyContent: "center",
                                      fontSize: 13,
                                      fontWeight: 800,
                                      flexShrink: 0
                                  }}>
                                      {step}
                                  </div>
                                  <div>
                                      <div style={{ color: "#e8edf2", fontSize: 13, fontWeight: 600 }}>{title}</div>
                                      <div style={{ color: "#8899aa", fontSize: 11, marginTop: 2 }}>{desc}</div>
                                  </div>
                              </div>
                          ))}
                      </div>
                  </div>

                  {/* Action Buttons */}
                  <div style={{ display: "flex", gap: 12 }}>
                      <button 
                          onClick={() => {
                              const ewayData = `Invoice: ${invoicePrefix}${invoiceNum}
Date: ${invoiceDate}
From GSTIN: ${seller.gstin}
To GSTIN: ${buyer.gstin || "URP"}
From: ${seller.name} - ${seller.city}, ${seller.state}
To: ${buyer.name || "Client"} - ${buyer.city || "N/A"}, ${buyer.state || "N/A"}
Value: ₹${totals.total.toLocaleString("en-IN")}
Taxable: ₹${totals.taxable.toLocaleString("en-IN")}
CGST: ₹${Math.round(totals.gst/2).toLocaleString("en-IN")}
SGST: ₹${Math.round(totals.gst/2).toLocaleString("en-IN")}
HSN: ${items[0]?.hsn || "9999"}
Items: ${items.length} | ${items.map(i => i.desc).join(", ")}`;
                              
                              navigator.clipboard.writeText(ewayData);
                              alert("✅ All invoice details copied to clipboard!\n\nPaste them into the E-Way Bill portal.");
                          }}
                          style={{
                              ...S.btnSecondary,
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6
                          }}
                      >
                          📋 Copy All Details
                      </button>
                      <button 
                          onClick={() => window.open("https://ewaybillgst.gov.in", "_blank")}
                          style={{
                              ...S.btnPrimary,
                              flex: 1,
                              display: "flex",
                              alignItems: "center",
                              justifyContent: "center",
                              gap: 6
                          }}
                      >
                          🔗 Open Portal →
                      </button>
                  </div>

                  <button 
                      onClick={() => setShowEwayHelper(false)}
                      style={{
                          ...S.btnSecondary,
                          width: "100%",
                          marginTop: 12,
                          color: "#8899aa",
                          borderColor: "rgba(255,255,255,0.08)"
                      }}
                  >
                      Close
                  </button>

                  <div style={{
                      textAlign: "center",
                      marginTop: 16,
                      color: "#445566",
                      fontSize: 10
                  }}>
                      🔒 This is a secure link to the official Government of India E-Way Bill portal
                  </div>
              </div>
          </div>
      )}
    </div>
  );
};

export default PreviewView;
