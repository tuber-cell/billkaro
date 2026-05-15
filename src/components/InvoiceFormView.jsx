import React, { Suspense } from "react";
import { S, fmt, STATES, GST_RATES, PLANS } from "./common/Constants";
import Header from "./common/Header";

const AuthModal = React.lazy(() => import("./AuthModal"));

const InvoiceFormView = ({ 
  step, setStep, isPro, plan, dailyLeft, user, invoiceNum, invoiceDate, setInvoiceDate, 
  dueDate, setDueDate, supplyType, setSupplyType, paidStatus, setPaidStatus, 
  docType, setDocType, invoicePrefix, setInvoicePrefix, watermark, setWatermark, 
  showUpiQr, setShowUpiQr, seller, setSeller, sellerLogo, setSellerLogo, 
  sellerSignature, setSellerSignature, handleLogoUpload, handleSignatureUpload, 
  handleSaveSeller, savedSeller, buyer, setBuyer, errors, suggestion, applySuggestion, 
  warnings, hasHistory, savedClients, handleLoadClient, handleDeleteClient, clearBuyerHistory, 
  handleSaveClient, items, updateItem, removeItem, addItem, calcItem, totals, 
  archiveCount, handleSaveAndNext, handlePreview, generateArchive, exporting, 
  saveToast, handleLogout, setShowLogin, showLogin, targetPlan, setTargetPlan, setPlan, syncProStatus, openRazorpay, setUser, dbPro, notes, setNotes,
  triggerGoogleLogin 
}) => {
  return (
    <div style={S.page}>
      {showLogin && (
        <Suspense fallback={null}>
          <AuthModal 
            setShowLogin={setShowLogin} 
            setUser={setUser} 
            targetPlan={targetPlan} 
            setTargetPlan={setTargetPlan} 
            setPlan={setPlan} 
            syncProStatus={syncProStatus} 
            openRazorpay={openRazorpay} 
            triggerGoogleLogin={triggerGoogleLogin} 
            user={user} 
          />
        </Suspense>
      )}
      <style>{`
        @media print { body { display: none; } }
        input:focus, select:focus { border-color: rgba(212,175,55,1) !important; background: rgba(255,255,255,0.08) !important; box-shadow: 0 0 15px rgba(212,175,55,0.2); }
        input::placeholder { color: #445566; }
        textarea::placeholder { color: #445566; }
        .custom-date::-webkit-calendar-picker-indicator { filter: invert(0.8) sepia(1) saturate(5) hue-rotate(5deg); cursor: pointer; }
        @keyframes pulse-gold {
          0% { opacity: 0.6; transform: scale(1); }
          50% { opacity: 1; transform: scale(1.05); }
          100% { opacity: 0.6; transform: scale(1); }
        }
        .pulse-match { animation: pulse-gold 2s infinite ease-in-out; }
      `}</style>

      <Header 
        step={step} 
        setStep={setStep} 
        user={user} 
        dbPro={dbPro} 
        plan={plan} 
        handleLogout={handleLogout} 
        setShowLogin={setShowLogin}
      >
        {/* All header info grouped together */}
        <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
          <div style={{ ...S.badge, borderColor: (PLANS[plan]?.color || "#8899aa") + "88", color: PLANS[plan]?.color || "#8899aa" }}>
            {(PLANS[plan]?.label || "Free").toUpperCase()} PLAN
          </div>
          {!isPro && <div style={{ color: "#8899aa", fontSize: 12 }}>{dailyLeft} daily invoice{dailyLeft !== 1 ? "s" : ""} left</div>}
        </div>

        {/* New Quick Stats next to badge */}
        <div style={{ display: "flex", gap: 12, marginLeft: 8 }}>
          <div style={{ background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.2)", borderRadius: 8, padding: "4px 12px", display: "flex", alignItems: "center", gap: 6 }}>
            <span style={{ color: "#34d399", fontSize: 11, fontWeight: 700 }}>📂 {archiveCount} Saved</span>
          </div>
        </div>
      </Header>

      <div style={S.container} className="bk-container bk-form-bottom-pad">

        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>📋</span> Invoice Details</div>
          <div className="grid-responsive-3" style={{ gap: 20 }}>
            <div>
              <label style={S.label}>Invoice Number</label>
              <input style={{ ...S.input, color: "#d4af37", fontWeight: 700 }} value={invoiceNum} readOnly />
            </div>
            <div>
              <label style={S.label}>Invoice Date</label>
              <input type="date" style={S.input} className="custom-date" value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Due Date (Optional)</label>
              <input type="date" style={S.input} className="custom-date" value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>

          <div className="grid-responsive-2" style={{ gap: 20, marginTop: 24 }}>
            <div>
              <label style={S.label}>Supply Type</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {[["intra", "Intra-State (CGST+SGST)"], ["inter", "Inter-State (IGST)"]].map(([val, lbl]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: supplyType === val ? "#d4af37" : "#8899aa", fontSize: 12, padding: "8px 14px", background: supplyType === val ? "rgba(212,175,55,0.1)" : "transparent", border: `1px solid ${supplyType === val ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`, borderRadius: 8 }}>
                    <input type="radio" value={val} checked={supplyType === val} onChange={() => setSupplyType(val)} style={{ accentColor: "#d4af37" }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>

            <div>
              <label style={S.label}>Payment Status</label>
              <div style={{ display: "flex", gap: 10, marginTop: 4 }}>
                {[["unpaid", "⏳ Unpaid", "#f59e0b"], ["paid", "✅ Paid", "#22c55e"]].map(([val, lbl, col]) => (
                  <label key={val} style={{ display: "flex", alignItems: "center", gap: 8, cursor: "pointer", color: paidStatus === val ? col : "#8899aa", fontSize: 12, padding: "8px 14px", background: paidStatus === val ? col + "18" : "transparent", border: `1px solid ${paidStatus === val ? col + "88" : "rgba(255,255,255,0.08)"}`, borderRadius: 8 }}>
                    <input type="radio" value={val} checked={paidStatus === val} onChange={() => setPaidStatus(val)} style={{ accentColor: col }} />
                    {lbl}
                  </label>
                ))}
              </div>
            </div>
          </div>
        </div>

        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>⚙️</span> Document Settings</div>
          <div className="grid-responsive-3" style={{ gap: 20 }}>
            <div>
              <label style={S.label}>Document Type</label>
              <select style={S.select} value={docType} onChange={e => setDocType(e.target.value)}>
                <option value="Tax Invoice">Tax Invoice</option>
                <option value="Quotation">Quotation</option>
                <option value="Proforma Invoice">Proforma Invoice</option>
                <option value="Delivery Challan">Delivery Challan</option>
              </select>
            </div>
            <div>
              <label style={S.label}>Invoice Prefix</label>
              <input style={S.input} placeholder="e.g. BK/24/" value={invoicePrefix} onChange={e => setInvoicePrefix(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Watermark</label>
              <select style={S.select} value={watermark} onChange={e => setWatermark(e.target.value)}>
                <option value="">None</option>
                <option value="PAID">PAID</option>
                <option value="DRAFT">DRAFT</option>
                <option value="CANCELLED">CANCELLED</option>
                <option value="DUPLICATE">DUPLICATE</option>
              </select>
            </div>
          </div>
          <div style={{ marginTop: 20 }}>
            <label style={{ display: "flex", alignItems: "center", gap: 10, cursor: "pointer", color: showUpiQr ? "#d4af37" : "#8899aa", fontSize: 13, fontWeight: 600 }}>
              <input type="checkbox" checked={showUpiQr} onChange={e => setShowUpiQr(e.target.checked)} style={{ accentColor: "#d4af37", width: 18, height: 18 }} />
              Show UPI QR Code on PDF (Instant Payment)
            </label>
          </div>
        </div>

        <div className="grid-responsive-2" style={{ marginBottom: 24 }}>

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#d4af37" }}>Seller Details</div>
              <div style={{ display: "flex", gap: 8 }}>
                <label style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  🖼️ {sellerLogo ? "Update Logo" : "Logo"}
                  <input type="file" accept="image/*" onChange={handleLogoUpload} style={{ display: "none" }} />
                </label>
                <label style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}>
                  🖋️ {sellerSignature ? "Update Sign" : "Sign"}
                  <input type="file" accept="image/*" onChange={handleSignatureUpload} style={{ display: "none" }} />
                </label>
                <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11 }} onClick={handleSaveSeller}>
                  💾 Save Profile
                </button>
              </div>
            </div>

            {sellerLogo && (
              <div style={{ marginBottom: 12, display: "flex", alignItems: "center", gap: 12, padding: 10, background: "rgba(212,175,55,0.05)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.2)" }}>
                <img src={sellerLogo} alt="Logo" style={{ height: 40, borderRadius: 4 }} />
                <div style={{ flex: 1, fontSize: 11, color: "#8899aa" }}>Logo will appear on the top-left of the invoice.</div>
                <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }} onClick={() => setSellerLogo("")}>Remove</button>
              </div>
            )}
            {sellerSignature && (
              <div style={{ marginBottom: 20, display: "flex", alignItems: "center", gap: 12, padding: 10, background: "rgba(212,175,55,0.05)", borderRadius: 8, border: "1px solid rgba(212,175,55,0.2)" }}>
                <img src={sellerSignature} alt="Signature" style={{ height: 40, background: "white", borderRadius: 4, padding: 4 }} />
                <div style={{ flex: 1, fontSize: 11, color: "#8899aa" }}>Digital signature uploaded. It will appear above the signatory line.</div>
                <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11 }} onClick={() => setSellerSignature("")}>Remove</button>
              </div>
            )}
            {savedSeller && (
              <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 8, padding: "8px 12px", marginBottom: 14, fontSize: 12, color: "#d4af37", display: "flex", justifyContent: "space-between", alignItems: "center" }}>
                <span>✓ Saved: {savedSeller.name}</span>
                <button style={{ background: "none", border: "none", color: "#d4af37", cursor: "pointer", fontSize: 11 }} onClick={() => setSeller(savedSeller)}>Load →</button>
              </div>
            )}
            {[["Business Name *", "name", "text", errors.sellerName], ["GSTIN *", "gstin", "text", errors.sellerGstin], ["Address", "address", "text", false], ["City", "city", "text", false], ["PIN Code", "pin", "text", false], ["Email", "email", "email", false], ["Phone", "phone", "tel", errors.sellerPhone]].map(([lbl, field, type, hasErr]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={S.label}>{lbl}</label>
                <input type={type} style={{ ...S.input, ...(hasErr ? { borderColor: "#ef4444" } : {}) }}
                  placeholder={field === "gstin" ? "27AAPFU0939F1ZV" : field === "phone" ? "10 digit number" : ""}
                  value={seller[field]} onChange={e => setSeller({ ...seller, [field]: e.target.value })} />
                {hasErr && <div style={S.errText}>{field === "gstin" ? "Enter valid GSTIN" : field === "phone" ? "Enter valid 10-digit phone" : "Required"}</div>}
              </div>
            ))}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>State</label>
              <select style={S.select} value={seller.state} onChange={e => setSeller({ ...seller, state: e.target.value })}>
                {(STATES || []).map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </div>

            <div style={{ marginTop: 20, padding: "16px", background: "rgba(212,175,55,0.05)", borderRadius: 12, border: "1px solid rgba(212,175,55,0.1)" }}>
              <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 700, marginBottom: 12, display: "flex", alignItems: "center", gap: 8 }}>
                🏦 Bank / UPI Details (Optional)
              </div>
              <div className="grid-responsive-bank" style={{ display: "grid", gap: 12 }}>
                <div>
                  <label style={S.label}>Bank Name</label>
                  <input style={S.input} placeholder="e.g. HDFC Bank" value={seller.bankName} onChange={e => setSeller({ ...seller, bankName: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>Account No</label>
                  <input style={S.input} placeholder="Account No" value={seller.accountNum} onChange={e => setSeller({ ...seller, accountNum: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>IFSC Code</label>
                  <input style={S.input} placeholder="IFSC Code" value={seller.ifsc} onChange={e => setSeller({ ...seller, ifsc: e.target.value })} />
                </div>
                <div>
                  <label style={S.label}>UPI ID</label>
                  <input style={S.input} placeholder="name@upi" value={seller.upi} onChange={e => setSeller({ ...seller, upi: e.target.value })} />
                </div>
              </div>
            </div>
          </div>

          <div style={S.card}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20, paddingBottom: 10, borderBottom: "1px solid rgba(212,175,55,0.2)" }}>
              <div style={{ display: "flex", alignItems: "baseline", gap: 12 }}>
                <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 16, color: "#d4af37" }}>Buyer Details</div>
                <div 
                  className={suggestion ? "pulse-match" : ""}
                  style={{ fontSize: 9, color: hasHistory ? (suggestion ? "#fbbf24" : "#d4af37") : "rgba(255,255,255,0.2)", textTransform: "uppercase", letterSpacing: "0.1em", fontWeight: 800 }}
                >
                  {hasHistory ? (suggestion ? "✨ MATCH FOUND" : "🟢 ENGINE READY") : "⚪ NO DATA YET"}
                </div>
              </div>
              <div style={{ display: "flex", gap: 8 }}>
                <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11, color: "#8899aa", borderColor: "rgba(255,255,255,0.1)" }} onClick={() => { if(confirm("Clear all smart history? This won't delete saved clients.")) clearBuyerHistory(); }}>
                  🧹 Clear History
                </button>
                <button style={{ ...S.btnSecondary, padding: "5px 12px", fontSize: 11 }} onClick={handleSaveClient}>
                  💾 Save Client
                </button>
              </div>
            </div>

            {(savedClients || []).length > 0 && (
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>Load Saved Client</label>
                <div style={{ display: "flex", gap: 8 }}>
                  <select style={{ ...S.select, flex: 1 }} onChange={e => handleLoadClient(e.target.value)} defaultValue="">
                    <option value="" disabled>Select client…</option>
                    {(savedClients || []).map(c => <option key={c.name} value={c.name}>{c.name}</option>)}
                  </select>
                </div>
                <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginTop: 8 }}>
                  {(savedClients || []).map(c => (
                    <div key={c.name} style={{ display: "flex", alignItems: "center", gap: 4, background: "rgba(255,255,255,0.04)", border: "1px solid rgba(255,255,255,0.08)", borderRadius: 6, padding: "3px 8px" }}>
                      <span style={{ fontSize: 11, color: "#8899aa" }}>{c.name}</span>
                      <button style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", fontSize: 11, padding: 0 }} onClick={() => handleDeleteClient(c.name)}>✕</button>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {[["Business Name *", "name", "text", errors.buyerName], ["GSTIN", "gstin", "text", false], ["Address", "address", "text", false], ["City", "city", "text", false], ["PIN Code", "pin", "text", false], ["Email", "email", "email", false], ["Phone", "phone", "tel", errors.buyerPhone]].map(([lbl, field, type, hasErr]) => (
              <div key={field} style={{ marginBottom: 12 }}>
                <label style={S.label}>{lbl}</label>
                <input type={type} style={{ ...S.input, ...(hasErr ? { borderColor: "#ef4444" } : {}) }}
                  placeholder={field === "phone" ? "10 digit number" : ""}
                  value={buyer[field]} onChange={e => setBuyer({ ...buyer, [field]: e.target.value })} />
                {hasErr && <div style={S.errText}>{field === "phone" ? "Enter valid 10-digit phone" : "Required"}</div>}
                
                {field === "name" && suggestion && (
                  <div style={{ background: "rgba(212,175,55,0.08)", border: "1px solid rgba(212,175,55,0.25)", borderRadius: 8, padding: "10px 14px", marginTop: 8 }}>
                    <div style={{ fontSize: 11, color: "#d4af37", marginBottom: 6 }}>✨ Smart Suggestion — based on {suggestion.invoiceCount} past invoice{suggestion.invoiceCount > 1 ? "s" : ""}</div>
                    <div style={{ fontSize: 12, color: "#8899aa", marginBottom: 8 }}>GSTIN: {suggestion.gstin} · {suggestion.state} · Avg: {fmt(suggestion.avgInvoiceValue)}</div>
                    <button style={{ fontSize: 11, color: "#0f1923", background: "#d4af37", border: "none", borderRadius: 6, padding: "5px 14px", cursor: "pointer", fontWeight: 700 }} onClick={() => applySuggestion(setBuyer, setDueDate, setSupplyType, invoiceDate)}>⚡ Apply All</button>
                  </div>
                )}
              </div>
            ))}

            {(warnings || []).length > 0 && (
              <div style={{ marginTop: 16 }}>
                {(warnings || []).map((w, i) => (
                  <div key={i} style={{
                    background: w.level === "error" ? "rgba(239,68,68,0.08)" : w.level === "warning" ? "rgba(245,158,11,0.08)" : "rgba(59,130,246,0.08)",
                    border: `1px solid ${w.level === "error" ? "rgba(239,68,68,0.3)" : w.level === "warning" ? "rgba(245,158,11,0.3)" : "rgba(59,130,246,0.3)"}`,
                    borderRadius: 8, padding: "8px 14px", fontSize: 12, color: w.level === "error" ? "#ef4444" : w.level === "warning" ? "#f59e0b" : "#60a5fa", marginTop: 8
                  }}>
                    {w.message}
                  </div>
                ))}
              </div>
            )}
            <div style={{ marginBottom: 12 }}>
              <label style={S.label}>State</label>
              <select style={S.select} value={buyer.state} onChange={e => setBuyer({ ...buyer, state: e.target.value })}>
                {(STATES || []).map(s => <option key={s}>{s}</option>)}
              </select>
            </div>
          </div>
        </div>

        <div style={S.card} className="hover-card">
          <div style={S.secTitle}><span>📦</span> Items / Services</div>
          {errors.items && <div style={{ ...S.errText, marginBottom: 16, background: "rgba(239,68,68,0.1)", padding: "8px 12px", borderRadius: 8 }}>⚠️ Fill all item descriptions and rates</div>}
          <div className="scroll-container">
            <div className="items-grid-header" style={{ display: "grid", gridTemplateColumns: "minmax(180px, 3fr) 90px 70px 100px 70px 80px 100px 40px", gap: 12, marginBottom: 12, minWidth: 750 }}>
            {["Description", "HSN/SAC", "Qty", "Rate (₹)", "Disc %", "GST %", "Amount", ""].map(h => (
              <div key={h} style={{ ...S.label, marginBottom: 0, paddingBottom: 8, borderBottom: "1px solid rgba(255,255,255,0.05)" }}>{h}</div>
            ))}
          </div>
          {(items || []).map((item, idx) => {
            const c = calcItem(item);
            return (
              <div key={item.id} className="item-row" style={{ display: "grid", gridTemplateColumns: "minmax(180px, 3fr) 90px 70px 100px 70px 80px 100px 40px", gap: 12, marginBottom: 12, alignItems: "center", minWidth: 750 }}>
                <input style={S.input} placeholder={`Item ${idx + 1}`} value={item.desc} onChange={e => updateItem(item.id, "desc", e.target.value)} />
                <div className="item-field-group" data-label="HSN/SAC">
                  <input style={S.input} placeholder="HSN" value={item.hsn} onChange={e => updateItem(item.id, "hsn", e.target.value)} />
                </div>
                <div className="item-field-group" data-label="Qty">
                  <input type="number" style={S.input} min="1" value={item.qty} onChange={e => updateItem(item.id, "qty", e.target.value)} />
                </div>
                <div className="item-field-group" data-label="Rate (₹)">
                  <input type="number" style={S.input} placeholder="0.00" value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
                </div>
                <div className="item-field-group" data-label="Disc %">
                  <input type="number" style={S.input} placeholder="0" value={item.discount} onChange={e => updateItem(item.id, "discount", e.target.value)} />
                </div>
                <div className="item-field-group" data-label="GST %">
                  <select style={S.select} value={item.gstRate} onChange={e => updateItem(item.id, "gstRate", Number(e.target.value))}>
                    {(GST_RATES || []).map(r => <option key={r} value={r}>{r}%</option>)}
                  </select>
                </div>
                <div className="item-total-col" style={{ color: "#d4af37", fontSize: 13, fontWeight: 700, textAlign: "right", letterSpacing: "0.05em" }}>{fmt(c.total)}</div>
                <button className="item-remove-btn" style={{ ...S.btnDanger, height: 40, width: 40, padding: 0, display: "flex", alignItems: "center", justifyContent: "center", borderRadius: "10px" }} onClick={() => removeItem(item.id)}>✕</button>
              </div>
            );
          })}
          </div>
          <button style={S.btnAdd} onClick={addItem}>+ Add Item</button>

          <div style={{ marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)", paddingTop: 20, display: "flex", justifyContent: "flex-end" }}>
            <div style={{ width: 280 }}>
              {[["Taxable Amount", fmt(totals.taxable)], ...(supplyType === "intra" ? [["CGST", fmt(totals.gst / 2)], ["SGST", fmt(totals.gst / 2)]] : [["IGST", fmt(totals.gst)]])].map(([lbl, val]) => (
                <div key={lbl} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#8899aa", fontSize: 13 }}>{lbl}</span>
                  <span style={{ color: "#e8edf2", fontSize: 13 }}>{val}</span>
                </div>
              ))}
              <div style={{ display: "flex", justifyContent: "space-between", borderTop: "1px solid rgba(212,175,55,0.3)", paddingTop: 12, marginTop: 8 }}>
                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 20 }}>{fmt(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        <div style={S.card} className="hover-card bk-card">
          <div style={S.secTitle}><span>📝</span> Notes</div>
          <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }} value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end", flexWrap: "wrap", alignItems: "center" }} className="no-print">
          {archiveCount > 0 && (
            <span style={{ color: "#34d399", fontSize: 12, fontWeight: 600, background: "rgba(52,211,153,0.1)", border: "1px solid rgba(52,211,153,0.3)", borderRadius: 20, padding: "4px 12px" }}>
              📂 {archiveCount} saved
            </span>
          )}
          <button
            style={{ ...S.btnSecondary, background: "rgba(52,211,153,0.12)", color: "#34d399", borderColor: "rgba(52,211,153,0.4)", fontWeight: 700 }}
            onClick={() => { console.log("Desktop Save & Next Clicked"); handleSaveAndNext(); }}
          >
            💾 Save &amp; Next Invoice
          </button>
          <button
            style={{
              ...S.btnSecondary,
              background: exporting ? "#334155" : "rgba(212,175,55,0.12)",
              color: exporting ? "#8899aa" : "#d4af37",
              cursor: exporting ? "not-allowed" : "pointer",
            }}
            onClick={() => {
              const isDirty = buyer.name || items.some(i => i.desc || i.rate);
              generateArchive(isDirty ? {
                invoiceNum, invoiceDate, dueDate, supplyType, paidStatus,
                buyer: { ...buyer }, seller: { ...seller },
                items: items.map(i => ({ ...i })),
                createdAt: new Date().toISOString(),
              } : null);
            }}
            disabled={exporting}
          >
            {exporting ? "⏳ Building…" : "📦 Export All to Excel"}
          </button>
          <button style={S.btnPrimary} onClick={() => { console.log("Desktop Preview Clicked"); handlePreview(); }}>Preview &amp; Download →</button>
        </div>
      </div>

      {saveToast && (
        <div style={{ position: "fixed", bottom: 90, left: "50%", transform: "translateX(-50%)", background: "rgba(52,211,153,0.95)", color: "#0f1923", padding: "12px 28px", borderRadius: 30, fontWeight: 700, fontSize: 14, zIndex: 9999, boxShadow: "0 8px 24px rgba(0,0,0,0.3)", whiteSpace: "nowrap" }}>
          ✅ Invoice saved! Form ready for next invoice.
        </div>
      )}

      <div className="mobile-action-bar">
        {archiveCount > 0 && (
          <button 
            style={{ ...S.btnSecondary, flex: "0 0 auto", padding: "0 12px", background: "rgba(212,175,55,0.12)", color: "#d4af37" }} 
            onClick={() => {
              const isDirty = buyer.name || items.some(i => i.desc || i.rate);
              generateArchive(isDirty ? {
                invoiceNum, invoiceDate, dueDate, supplyType, paidStatus,
                buyer: { ...buyer }, seller: { ...seller },
                items: items.map(i => ({ ...i })),
                createdAt: new Date().toISOString(),
              } : null);
            }}
          >
            📦
          </button>
        )}
        <button style={{ ...S.btnSecondary, flex: 1, fontSize: 11 }} onClick={() => { console.log("Mobile Save & Next Clicked"); handleSaveAndNext(); }}>💾 Save &amp; Next</button>
        <button style={{ ...S.btnPrimary, flex: 1.5 }} onClick={() => { console.log("Mobile Preview Clicked"); handlePreview(); }}>Preview →</button>
      </div>
    </div>
  );
};

export default InvoiceFormView;
