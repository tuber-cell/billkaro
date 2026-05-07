import React from "react";
import { fmt } from "./common/Constants";

const PremiumTemplate = ({
  docType, invoicePrefix, invoiceNum, invoiceDate, dueDate, supplyType,
  paidStatus, seller, sellerLogo, sellerSignature, buyer, items,
  calcItem, totals, notes, showUpiQr,
  getInvoiceStatus, INVOICE_STATUSES
}) => {
  const currentStatus = getInvoiceStatus ? getInvoiceStatus(invoiceNum) : "DRAFT";
  const sInfo = (INVOICE_STATUSES && INVOICE_STATUSES[currentStatus]) || { label: "Draft", color: "#8899aa", icon: "📝" };

  return (
    <div style={{ 
      background: "#0f172a", 
      borderRadius: 16, 
      boxShadow: "0 25px 80px rgba(0,0,0,0.5)", 
      fontFamily: "'DM Sans', sans-serif", 
      overflow: "hidden", 
      position: "relative",
      color: "#f8fafc",
      border: "1px solid rgba(212,175,55,0.2)"
    }}>
      {/* Premium Hex Pattern Background */}
      <div style={{
        position: "absolute",
        top: 0,
        left: 0,
        right: 0,
        bottom: 0,
        opacity: 0.03,
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cpath d='M30 0l25.98 15v30L30 60 4.02 45V15z' fill-rule='evenodd' fill='%23d4af37'/%3E%3C/svg%3E")`,
        pointerEvents: "none"
      }}></div>

      {/* Header with Gold Accents */}
      <div style={{ 
        background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", 
        padding: "40px 48px", 
        borderBottom: "4px solid #d4af37",
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        position: "relative",
        zIndex: 1
      }}>
        <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
          {sellerLogo && (
            <div style={{ background: "rgba(255,255,255,0.05)", padding: 12, borderRadius: 12, border: "1px solid rgba(212,175,55,0.2)", alignSelf: "flex-start" }}>
              <img src={sellerLogo} alt="Logo" style={{ height: 60, maxWidth: 200, objectFit: "contain" }} />
            </div>
          )}
          <div>
            <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 32, color: "#d4af37", fontWeight: 900, letterSpacing: 1, textTransform: "uppercase" }}>{docType}</div>
            <div style={{ fontSize: 14, color: "#94a3b8", fontWeight: 600, marginTop: 4 }}>
              <span style={{ color: "#d4af37" }}>NO.</span> {invoicePrefix}{invoiceNum}
            </div>
            <div style={{ marginTop: 12, display: "flex", gap: 8 }}>
                <span style={{ 
                    background: paidStatus === "paid" ? "rgba(34,197,94,0.15)" : "rgba(245,158,11,0.15)", 
                    border: `1px solid ${paidStatus === "paid" ? "#22c55e" : "#f59e0b"}`, 
                    color: paidStatus === "paid" ? "#4ade80" : "#fbbf24", 
                    padding: "4px 12px", 
                    borderRadius: 30, 
                    fontSize: 11, 
                    fontWeight: 800,
                    letterSpacing: 0.5
                }}>
                    {paidStatus === "paid" ? "✅ FULLY PAID" : "⏳ PAYMENT PENDING"}
                </span>
            </div>
          </div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 24, color: "#ffffff", fontWeight: 800, marginBottom: 8 }}>{seller.name}</div>
          {seller.gstin && <div style={{ fontSize: 13, color: "#d4af37", fontWeight: 700 }}>GSTIN: {seller.gstin}</div>}
          <div style={{ fontSize: 13, color: "#94a3b8", marginTop: 6, lineHeight: 1.5 }}>
            {seller.address}<br />
            {seller.city}, {seller.state} {seller.pin}<br />
            {seller.email} • {seller.phone}
          </div>
        </div>
      </div>

      {/* Metadata Bar */}
      <div style={{ 
        background: "rgba(255,255,255,0.02)", 
        padding: "16px 48px", 
        display: "flex", 
        justifyContent: "space-between", 
        borderBottom: "1px solid rgba(255,255,255,0.05)" 
      }}>
        {[["Invoice Date", invoiceDate], ["Due Date", dueDate || "On Receipt"], ["Supply Type", supplyType === "intra" ? "Intra-State" : "Inter-State"]].map(([lbl, val]) => (
          <div key={lbl}>
            <div style={{ fontSize: 10, color: "#d4af37", textTransform: "uppercase", fontWeight: 800, letterSpacing: 1, marginBottom: 2 }}>{lbl}</div>
            <div style={{ fontSize: 13, fontWeight: 600, color: "#f8fafc" }}>{val}</div>
          </div>
        ))}
      </div>

      {/* Billed Section */}
      <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "32px 48px", gap: 60 }}>
        <div>
          <div style={{ fontSize: 11, color: "#d4af37", textTransform: "uppercase", fontWeight: 800, letterSpacing: 1.5, marginBottom: 12 }}>Billed To</div>
          <div style={{ fontWeight: 800, fontSize: 18, color: "#ffffff", marginBottom: 6 }}>{buyer.name || "—"}</div>
          <div style={{ fontSize: 13, color: "#94a3b8", lineHeight: 1.6 }}>
            {buyer.gstin && <div style={{ color: "#d4af37", fontWeight: 700, marginBottom: 4 }}>GSTIN: {buyer.gstin}</div>}
            {buyer.address && <div>{buyer.address}</div>}
            {buyer.city && <div>{buyer.city}, {buyer.state} {buyer.pin}</div>}
            {buyer.phone && <div>{buyer.phone}</div>}
          </div>
        </div>
        <div style={{ background: "rgba(212,175,55,0.03)", padding: 24, borderRadius: 16, border: "1px solid rgba(212,175,55,0.1)" }}>
          <div style={{ fontSize: 11, color: "#d4af37", textTransform: "uppercase", fontWeight: 800, letterSpacing: 1.5, marginBottom: 12 }}>Payment Details</div>
          <div style={{ display: "grid", gap: 10, fontSize: 13 }}>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>Bank:</span><span style={{ fontWeight: 700 }}>{seller.bankName || "—"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>A/C No:</span><span style={{ fontWeight: 700, letterSpacing: 1 }}>{seller.accountNum || "—"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between" }}><span style={{ color: "#94a3b8" }}>IFSC:</span><span style={{ fontWeight: 700 }}>{seller.ifsc || "—"}</span></div>
            <div style={{ display: "flex", justifyContent: "space-between", marginTop: 8, paddingTop: 8, borderTop: "1px solid rgba(212,175,55,0.1)" }}>
                <span style={{ color: "#d4af37", fontWeight: 800 }}>UPI ID:</span>
                <span style={{ fontWeight: 800, color: "#ffffff" }}>{seller.upi || "—"}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Items Table */}
      <div style={{ padding: "0 48px 40px" }}>
        <table style={{ width: "100%", borderCollapse: "separate", borderSpacing: "0 8px" }}>
          <thead>
            <tr>
              {["#", "Description", "Qty", "Rate", "Disc", "GST", ...(supplyType === "intra" ? ["CGST", "SGST"] : ["IGST"]), "Total"].map(h => (
                <th key={h} style={{ padding: "12px", color: "#d4af37", fontSize: 11, fontWeight: 800, textTransform: "uppercase", letterSpacing: 1, textAlign: h === "Description" ? "left" : "right" }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {items.map((item, idx) => {
              const c = calcItem(item);
              return (
                <tr key={item.id} style={{ background: "rgba(255,255,255,0.03)" }}>
                  <td style={{ padding: "16px 12px", fontSize: 13, color: "#94a3b8", textAlign: "right", borderRadius: "8px 0 0 8px" }}>{idx + 1}</td>
                  <td style={{ padding: "16px 12px", fontSize: 14, color: "#ffffff", fontWeight: 700 }}>{item.desc}</td>
                  <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>{item.qty}</td>
                  <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>₹{parseFloat(item.rate || 0).toLocaleString()}</td>
                  <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>{item.discount || 0}%</td>
                  <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>{item.gstRate}%</td>
                  {supplyType === "intra" ? (
                    <>
                      <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>₹{(c.gstAmt / 2).toFixed(2)}</td>
                      <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>₹{(c.gstAmt / 2).toFixed(2)}</td>
                    </>
                  ) : (
                    <td style={{ padding: "16px 12px", fontSize: 13, textAlign: "right" }}>₹{c.gstAmt.toFixed(2)}</td>
                  )}
                  <td style={{ padding: "16px 12px", fontSize: 14, color: "#d4af37", fontWeight: 800, textAlign: "right", borderRadius: "0 8px 8px 0" }}>{fmt(c.total)}</td>
                </tr>
              );
            })}
          </tbody>
        </table>

        {/* Totals Section */}
        <div style={{ display: "flex", justifyContent: "space-between", marginTop: 30, alignItems: "flex-start" }}>
          <div style={{ maxWidth: "50%" }}>
            {notes && (
                <div style={{ background: "rgba(255,255,255,0.02)", padding: 20, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
                    <div style={{ fontSize: 10, color: "#d4af37", fontWeight: 800, textTransform: "uppercase", marginBottom: 8, letterSpacing: 1 }}>Notes & Terms</div>
                    <div style={{ fontSize: 12, color: "#94a3b8", lineHeight: 1.5 }}>{notes}</div>
                </div>
            )}
            {showUpiQr && seller.upi && (
                <div style={{ marginTop: 20, display: "flex", alignItems: "center", gap: 16 }}>
                     <img 
                      src={`https://api.qrserver.com/v1/create-qr-code/?size=100x100&data=${encodeURIComponent(`upi://pay?pa=${seller.upi}&pn=${encodeURIComponent(seller.name)}&am=${totals.total}&cu=INR`)}&color=d4af37&bgcolor=0f172a`}
                      alt="QR"
                      style={{ width: 80, height: 80, borderRadius: 8, border: "2px solid #d4af37" }}
                  />
                  <div>
                      <div style={{ fontSize: 11, fontWeight: 800, color: "#d4af37", textTransform: "uppercase" }}>Instant Settlement</div>
                      <div style={{ fontSize: 10, color: "#94a3b8", marginTop: 4 }}>Scan with any UPI app to pay ₹{totals.total.toLocaleString()}</div>
                  </div>
                </div>
            )}
          </div>
          <div style={{ width: 300, background: "linear-gradient(135deg, #1e293b 0%, #0f172a 100%)", padding: 24, borderRadius: 16, border: "2px solid #d4af37", boxShadow: "0 10px 30px rgba(0,0,0,0.3)" }}>
            {[["Taxable Amount", fmt(totals.taxable)], ...(supplyType === "intra" ? [["CGST (9%)", fmt(totals.gst / 2)], ["SGST (9%)", fmt(totals.gst / 2)]] : [["IGST (18%)", fmt(totals.gst)]])].map(([lbl, val]) => (
              <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 12 }}>
                <span style={{ color: "#94a3b8", fontSize: 13, fontWeight: 600 }}>{lbl}</span>
                <span style={{ color: "#f8fafc", fontSize: 13, fontWeight: 700 }}>{val}</span>
              </div>
            ))}
            <div style={{ height: 1, background: "rgba(212,175,55,0.2)", margin: "16px 0" }}></div>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
              <span style={{ color: "#d4af37", fontWeight: 900, fontSize: 14, letterSpacing: 1 }}>GRAND TOTAL</span>
              <span style={{ color: "#ffffff", fontWeight: 900, fontSize: 24 }}>{fmt(totals.total)}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Footer with PRO Badge */}
      <div style={{ 
        background: "#020617", 
        padding: "30px 48px", 
        display: "flex", 
        justifyContent: "space-between", 
        alignItems: "center",
        borderTop: "1px solid rgba(212,175,55,0.1)"
      }}>
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <div style={{ 
                background: "linear-gradient(135deg, #d4af37, #f0d060)", 
                color: "#0f172a", 
                padding: "6px 14px", 
                borderRadius: 6, 
                fontSize: 11, 
                fontWeight: 900,
                display: "flex",
                alignItems: "center",
                gap: 6
            }}>
                <span style={{ fontSize: 14 }}>⬡</span> PRO VERSION
            </div>
            <div style={{ fontSize: 11, color: "#475569", fontWeight: 600 }}>SECURE DIGITAL INVOICE ID: BK-{invoiceNum}-{new Date().getTime().toString().slice(-4)}</div>
        </div>
        <div style={{ textAlign: "right" }}>
            {sellerSignature ? (
                 <div style={{ marginBottom: 8 }}>
                    <img src={sellerSignature} alt="Sign" style={{ maxHeight: 40, opacity: 0.9, filter: "brightness(1.2)" }} />
                 </div>
            ) : (
                <div style={{ height: 40 }}></div>
            )}
            <div style={{ height: 1, background: "rgba(212,175,55,0.3)", width: 200, marginBottom: 8 }}></div>
            <div style={{ fontSize: 11, fontWeight: 800, color: "#d4af37", textTransform: "uppercase", letterSpacing: 1 }}>Authorized Signatory</div>
        </div>
      </div>
    </div>
  );
};

export default PremiumTemplate;
