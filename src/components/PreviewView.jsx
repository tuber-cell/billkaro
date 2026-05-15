import React, { useState, useEffect } from "react";
import { S, fmt, today } from "./common/Constants";
import Header from "./common/Header";
import PremiumTemplates from "./PremiumTemplates";

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
  const [templateId, setTemplateId] = useState(() => localStorage.getItem("bb_template_id") || "executive");

  const changeTemplate = (id) => {
    setTemplateId(id);
    localStorage.setItem("bb_template_id", id);
  };

  useEffect(() => {
    // Only track viewed if it was draft
    if (getInvoiceStatus(invoiceNum) === "DRAFT") {
      trackInvoiceEvent(invoiceNum, "VIEWED");
    }
  }, [invoiceNum]);

  const currentStatus = getInvoiceStatus(invoiceNum);
  const [scaleFactor, setScaleFactor] = useState(1);

  useEffect(() => {
    const updateScale = () => {
      if (window.innerWidth < 820) {
        // We want 800px width (reference) to fit in window.innerWidth - 32px (padding)
        const targetWidth = window.innerWidth - 32;
        const newScale = targetWidth / 800;
        setScaleFactor(newScale);
      } else {
        setScaleFactor(1);
      }
    };
    updateScale();
    window.addEventListener("resize", updateScale);
    return () => window.removeEventListener("resize", updateScale);
  }, []);

  const sInfo = INVOICE_STATUSES[currentStatus] || INVOICE_STATUSES.DRAFT;
  return (
    <div style={{ background: "#0f1923", minHeight: "100vh" }}>
      <style>{`
        @media screen {
          .print-actions {
            position: fixed; top: 0; left: 0; right: 0; z-index: 1000;
            background: #0f1923;
            border-bottom: 1px solid rgba(212,175,55,0.4);
            padding: 12px 24px; display: flex; align-items: center; gap: 12px;
            flex-wrap: wrap;
            box-shadow: 0 4px 20px rgba(0,0,0,0.4);
          }
          .invoice-wrap { max-width: 860px; margin: 90px auto 100px; padding: 0 16px; overflow-x: auto; }
        }
        @media (max-width: 768px) {
          .print-actions { padding: 10px 12px; gap: 8px; }
          .print-actions > div:first-child { font-size: 16px !important; margin-right: 8px !important; }
          .print-actions button { font-size: 11px !important; padding: 8px 10px !important; }
          .invoice-wrap { margin: 100px 4px 100px !important; padding: 0 4px !important; overflow: visible; }
          
          /* Auto-scale the invoice content to fit screen width */
          .invoice-content-scale {
            transform-origin: top center;
            width: 800px !important; /* Fixed width for scaling reference */
          }
          
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
            transform: none !important;
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
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", fontSize: 18, marginRight: 16 }}>⬡ Billby</div>
        
        <div style={{ display: "flex", background: "rgba(255,255,255,0.04)", borderRadius: 10, padding: 4, marginRight: "auto", overflowX: "auto", maxWidth: "100%", scrollbarWidth: "none" }}>
            <button style={{ background: step === "form" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "form" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => setStep("form")}>📝 Create</button>
            <button style={{ background: step === "expenses" ? "rgba(20,184,166,0.15)" : "transparent", border: "none", color: step === "expenses" ? "#14b8a6" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => setStep("expenses")}>💸 Expenses</button>
            <button style={{ background: step === "dashboard" ? "rgba(212,175,55,0.15)" : "transparent", border: "none", color: step === "dashboard" ? "#d4af37" : "#8899aa", padding: "6px 14px", borderRadius: 8, fontSize: 12, fontWeight: 700, cursor: "pointer", whiteSpace: "nowrap" }} onClick={() => setStep("dashboard")}>📊 Insights</button>
        </div>

        {user ? (
          <div style={{ display: "flex", alignItems: "center", gap: 10, marginRight: 10 }}>
             {!isPro && (
              <button 
                style={{ 
                  background: "linear-gradient(135deg, #b8860b, #d4af37)", 
                  border: "none", 
                  color: "#0f1923", 
                  padding: "6px 12px", 
                  borderRadius: 6, 
                  fontSize: 11, 
                  fontWeight: 900, 
                  cursor: "pointer",
                  boxShadow: "0 4px 12px rgba(212,175,55,0.2)"
                }} 
                onClick={() => setStep("upgrade")}
              >
                🚀 UPGRADE
              </button>
            )}
            <div style={{ textAlign: "right", lineHeight: 1 }} className="desktop-only">
              <div style={{ color: "#e8edf2", fontSize: 11, fontWeight: 600 }}>{user.email || user.phoneNumber}</div>
              <div style={{ color: "#d4af37", fontSize: 9 }}>{dbPro ? (PLANS[plan]?.label || "Pro Account") : "Free Plan"}</div>
            </div>
          </div>
        ) : (
          <button 
            style={{ 
                background: "linear-gradient(135deg, #b8860b, #d4af37)", 
                border: "none", 
                color: "#0f1923", 
                padding: "6px 12px", 
                borderRadius: 6, 
                fontSize: 11, 
                fontWeight: 900, 
                cursor: "pointer",
                marginRight: 10
            }} 
            onClick={() => setStep("upgrade")}
          >
            🚀 GET PRO
          </button>
        )}

        {isPro && (
            <div style={{ display: "flex", gap: 6, marginRight: 10, background: "rgba(255,255,255,0.04)", padding: "4px 8px", borderRadius: 10, overflowX: "auto", maxWidth: "200px", scrollbarWidth: "none" }}>
                {["executive", "minimal", "corporate"].map(id => (
                    <button 
                        key={id} 
                        onClick={() => changeTemplate(id)}
                        style={{ 
                            background: templateId === id ? "rgba(212,175,55,0.2)" : "transparent",
                            border: templateId === id ? "1px solid rgba(212,175,55,0.4)" : "1px solid transparent",
                            color: templateId === id ? "#d4af37" : "#8899aa",
                            padding: "4px 12px",
                            borderRadius: 6,
                            fontSize: 10,
                            fontWeight: 700,
                            cursor: "pointer",
                            textTransform: "capitalize",
                            whiteSpace: "nowrap"
                        }}
                    >
                        {id}
                    </button>
                ))}
            </div>
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
        <div className="desktop-only" style={{ 
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
        style={{ transform: scaleFactor < 1 ? `scale(${scaleFactor})` : "none" }}
      >
        <div className="invoice-content-scale">
          <PremiumTemplates
            templateId={isPro ? templateId : "executive"}
            docType={docType}
            invoicePrefix={invoicePrefix}
            invoiceNum={invoiceNum}
            invoiceDate={invoiceDate}
            dueDate={dueDate}
            supplyType={supplyType}
            paidStatus={paidStatus}
            seller={seller}
            sellerLogo={sellerLogo}
            sellerSignature={sellerSignature}
            buyer={buyer}
            items={items}
            calcItem={calcItem}
            totals={totals}
            notes={notes}
            showUpiQr={showUpiQr}
            getInvoiceStatus={getInvoiceStatus}
            INVOICE_STATUSES={INVOICE_STATUSES}
          />
          <div style={{ background: "rgba(15, 25, 35, 0.03)", padding: "10px 48px", textAlign: "center", fontSize: 9, color: "#8899aa", borderTop: "1px solid #e9ecef", letterSpacing: "0.05em" }}>
            Generated with <span style={{ color: "#d4af37", fontWeight: 700 }}>Billby</span> · Secure GST Compliant Digital Invoice
          </div>
        </div>
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
