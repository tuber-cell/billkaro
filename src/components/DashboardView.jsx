import React, { useState, useEffect } from "react";
import { doc, setDoc } from "firebase/firestore";
import { db } from "../lib/firebase";
import { getLocalArchive } from "../hooks/useArchiveExport";
import { S, fmt } from "./common/Constants";
import Header from "./common/Header";

const StatCard = ({ title, value, icon, color }) => (
  <div style={{ ...S.card, padding: 20, marginBottom: 0, borderLeft: `4px solid ${color}` }} className="bk-card">
    <div style={{ display: "flex", alignItems: "center", gap: 12, marginBottom: 8 }}>
      <span style={{ fontSize: 20 }}>{icon}</span>
      <span style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, textTransform: "uppercase", letterSpacing: 0.5 }}>{title}</span>
    </div>
    <div style={{ color: "#e8edf2", fontSize: 22, fontWeight: 800 }}>{value}</div>
  </div>
);

const BreakdownBox = ({ label, value }) => (
  <div style={{ background: "rgba(255,255,255,0.03)", padding: 16, borderRadius: 12, border: "1px solid rgba(255,255,255,0.06)" }}>
    <div style={{ color: "#8899aa", fontSize: 10, fontWeight: 700, textTransform: "uppercase", marginBottom: 4 }}>{label}</div>
    <div style={{ color: "#e8edf2", fontSize: 16, fontWeight: 700 }}>{value}</div>
  </div>
);

const DashboardView = ({ 
  step, setStep, user, dbPro, plan, handleLogout, setShowLogin, 
  expenses, generateGSTR1, generateArchive, seller,
  setInvoiceNum, setInvoiceDate, setDueDate, setSupplyType,
  setPaidStatus, setNotes, setSeller, setBuyer, setItems,
  setDocType, setInvoicePrefix, setWatermark, setCameFromDashboard,
  trackInvoiceEvent, getInvoiceStatus, INVOICE_STATUSES
}) => {
  const [loadingStats, setLoadingStats] = useState(true);
  const [stats, setStats] = useState({
    totalRevenue: 0,
    totalExpenses: 0,
    netProfit: 0,
    totalOutstanding: 0,
    count: 0,
    monthName: "",
    totals: { taxable: 0, cgst: 0, sgst: 0, igst: 0, gstTotal: 0 },
    clientBalances: [],
    recentInvoices: [],
    pendingInvoices: []
  });

  useEffect(() => {
    const loadStats = async () => {
      setLoadingStats(true);
      let archive = [];
      if (user) {
        try {
          const { collection, query, orderBy, getDocs } = await import("firebase/firestore");
          const q = query(collection(db, "users", user.uid, "invoices"), orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          archive = snap.docs.map(d => ({ ...d.data(), id: d.id }));
        } catch (e) { archive = getLocalArchive(); }
      } else {
        archive = getLocalArchive();
      }

      const now = new Date();
      const month = now.getMonth();
      const year = now.getFullYear();
      const monthName = now.toLocaleString('default', { month: 'long' });

      const currentMonthInvoices = archive.filter(inv => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d.getMonth() === month && d.getFullYear() === year;
      });

      const totals = currentMonthInvoices.reduce((acc, inv) => {
        const invTaxable = (inv.items || []).reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0), 0);
        const invGst = (inv.items || []).reduce((s, it) => s + (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0) * ((parseFloat(it.gstRate) || 0) / 100), 0);
        
        acc.taxable += invTaxable;
        acc.gstTotal += invGst;
        if (inv.supplyType === "intra") {
          acc.cgst += invGst / 2;
          acc.sgst += invGst / 2;
        } else {
          acc.igst += invGst;
        }
        return acc;
      }, { taxable: 0, cgst: 0, sgst: 0, igst: 0, gstTotal: 0 });

      const totalRevenue = totals.taxable + totals.gstTotal;
      const totalExpenses = (expenses || []).filter(e => {
        const d = new Date(e.date);
        return d.getMonth() === month && d.getFullYear() === year;
      }).reduce((sum, e) => sum + Number(e.amount || 0), 0);

      const clients = {};
      archive.forEach(inv => {
        const name = inv.buyer?.name || "Cash Sale";
        if (!clients[name]) clients[name] = { name, billed: 0, paid: 0, outstanding: 0, invoices: [] };
        const invTotal = (inv.items || []).reduce((s, it) => {
          const t = (parseFloat(it.qty) || 0) * (parseFloat(it.rate) || 0);
          return s + t + (t * (parseFloat(it.gstRate) || 0) / 100);
        }, 0);
        clients[name].billed += invTotal;
        if (inv.paidStatus === "paid") clients[name].paid += invTotal;
        else clients[name].outstanding += invTotal;
        clients[name].invoices.push(inv);
      });

      const pending = archive.filter(i => i.paidStatus !== "paid").slice(0, 5);
      const totalOutstanding = Object.values(clients).reduce((s, c) => s + c.outstanding, 0);

      setStats({
        monthName,
        count: currentMonthInvoices.length,
        totals,
        totalRevenue,
        totalExpenses,
        totalOutstanding,
        netProfit: totalRevenue - totalExpenses,
        clientBalances: Object.values(clients).sort((a, b) => b.outstanding - a.outstanding),
        recentInvoices: archive.slice(0, 5),
        pendingInvoices: pending
      });
      setLoadingStats(false);
    };
    loadStats();
  }, [user, expenses]);

  const handleMarkAsPaid = async (inv) => {
    if (user) {
       try {
         const ref = doc(db, "users", user.uid, "invoices", inv.id || inv.invoiceNum);
         await setDoc(ref, { paidStatus: "paid" }, { merge: true });
         trackInvoiceEvent(inv.invoiceNum, "PAID");
         alert("Status updated in cloud!");
         setStats(prev => ({
           ...prev,
           pendingInvoices: prev.pendingInvoices.filter(i => i.invoiceNum !== inv.invoiceNum)
         }));
       } catch (err) {
         console.error("Update failed:", err);
       }
    } else {
      const archive = getLocalArchive();
      const idx = archive.findIndex(i => i.invoiceNum === inv.invoiceNum);
      if (idx >= 0) {
        archive[idx].paidStatus = "paid";
        localStorage.setItem("bb_invoice_archive", JSON.stringify(archive));
        trackInvoiceEvent(inv.invoiceNum, "PAID");
        alert("Status updated locally!");
        setStats(prev => ({
          ...prev,
          pendingInvoices: prev.pendingInvoices.filter(i => i.invoiceNum !== inv.invoiceNum)
        }));
      }
    }
  };

  const handleViewInvoice = (inv) => {
      setInvoiceNum(inv.invoiceNum);
      setInvoiceDate(inv.invoiceDate || "");
      setDueDate(inv.dueDate || "");
      setSupplyType(inv.supplyType || "intra");
      setPaidStatus(inv.paidStatus || "unpaid");
      setNotes(inv.notes || "");
      setDocType(inv.docType || "Tax Invoice");
      setInvoicePrefix(inv.invoicePrefix || "INV-");
      setWatermark(inv.watermark || "");
      setSeller(inv.seller || {});
      setBuyer(inv.buyer || {});
      setItems(inv.items || []);
      setCameFromDashboard(true);
      setStep("preview");
      window.scrollTo(0, 0);
  };

  if (loadingStats) return (
    <div style={S.page}>
      <Header step={step} setStep={setStep} user={user} dbPro={dbPro} plan={plan} handleLogout={handleLogout} setShowLogin={setShowLogin} />
      <div style={{ padding: "100px 0", textAlign: "center", color: "#8899aa" }}>
        <div className="pulse-match" style={{ fontSize: 32, marginBottom: 16 }}>📊</div>
        <div>Crunching your business data...</div>
      </div>
    </div>
  );

  if (stats.count === 0) return (
    <div style={S.page}>
      <Header step={step} setStep={setStep} user={user} dbPro={dbPro} plan={plan} handleLogout={handleLogout} setShowLogin={setShowLogin} />
      <div style={{ padding: "80px 20px", textAlign: "center" }}>
        <div style={{ fontSize: 48, marginBottom: 20 }}>📈</div>
        <h3 style={{ color: "#e8edf2", marginBottom: 12 }}>No data for {stats.monthName} yet</h3>
        <p style={{ color: "#8899aa", maxWidth: 400, margin: "0 auto 24px" }}>Start creating invoices to see your monthly GST breakdown and sales analytics here.</p>
        <button style={S.btnPrimary} onClick={() => setStep("form")}>Create First Invoice</button>
      </div>
    </div>
  );

  return (
    <div style={S.page}>
      <Header step={step} setStep={setStep} user={user} dbPro={dbPro} plan={plan} handleLogout={handleLogout} setShowLogin={setShowLogin} />
      <div style={{ maxWidth: 1000, margin: "0 auto", padding: "0 20px 60px" }}>
        <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginBottom: 32, borderBottom: "1px solid rgba(255,255,255,0.05)", paddingBottom: 16, flexWrap: "wrap", gap: 16 }}>
          <div>
            <div style={{ color: "#d4af37", fontSize: 12, fontWeight: 700, textTransform: "uppercase", letterSpacing: 1, marginBottom: 4 }}>Business Intelligence</div>
            <h2 style={{ color: "#e8edf2", fontSize: 28, margin: 0 }}>{stats.monthName} Summary</h2>
          </div>
          <div style={{ color: "#8899aa", fontSize: 13 }}>Year: {new Date().getFullYear()}</div>
        </div>
        
        <div className="stats-grid" style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(200px, 1fr))", gap: 20, marginBottom: 32 }}>
          <StatCard title="Total Revenue" value={fmt(stats.totalRevenue)} icon="💰" color="#d4af37" />
          <StatCard title="Total Expenses" value={fmt(stats.totalExpenses)} icon="💸" color="#ef4444" />
          <StatCard title="Net Profit" value={fmt(stats.netProfit)} icon="📈" color="#14b8a6" />
          <StatCard title="Outstanding" value={fmt(stats.totalOutstanding)} icon="⏳" color="#f59e0b" />
          <StatCard title="Invoices" value={stats.count} icon="📝" color="#a78bfa" />
        </div>

        <div style={{ background: "linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.02) 100%)", border: "1px solid rgba(212,175,55,0.2)", borderRadius: 24, padding: 32, position: "relative", overflow: "hidden" }}>
          <div style={{ position: "absolute", top: -20, right: -20, fontSize: 120, opacity: 0.03, pointerEvents: "none" }}>🏛️</div>
          <h3 style={{ color: "#e8edf2", marginBottom: 8, fontSize: 18, display: "flex", alignItems: "center", gap: 10 }}>
             GST Settlement Breakdown
             <span style={{ fontSize: 10, background: "rgba(212,175,55,0.1)", color: "#d4af37", padding: "2px 8px", borderRadius: 10 }}>GSTR-1 READY</span>
          </h3>
          <p style={{ color: "#8899aa", fontSize: 13, marginBottom: 24 }}>Use these values to file your monthly returns on the GST portal.</p>
          
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 20 }}>
            <BreakdownBox label="CGST (Central Tax)" value={`₹${stats.totals.cgst.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
            <BreakdownBox label="SGST (State Tax)" value={`₹${stats.totals.sgst.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
            <BreakdownBox label="IGST (Inter-State)" value={`₹${stats.totals.igst.toLocaleString(undefined, {minimumFractionDigits: 2})}`} />
          </div>

              <div style={{ marginTop: 32, paddingTop: 24, borderTop: "1px solid rgba(255,255,255,0.05)", textAlign: "right", display: "flex", justifyContent: "flex-end", gap: 12 }}>
                 <button 
                    style={{ ...S.btnTeal, fontSize: 12, padding: "8px 20px" }}
                    onClick={() => setStep("reconciliation")}
                 >🔍 GST Reconciliation</button>
                 <button 
                    style={{ ...S.btnSecondary, fontSize: 12, padding: "8px 20px" }}
                    onClick={() => {
                      const text = `GST Summary for ${stats.monthName}:\nTaxable: ₹${stats.totals.taxable.toFixed(2)}\nCGST: ₹${stats.totals.cgst.toFixed(2)}\nSGST: ₹${stats.totals.sgst.toFixed(2)}\nIGST: ₹${stats.totals.igst.toFixed(2)}\nTotal GST: ₹${stats.totals.gstTotal.toFixed(2)}`;
                      navigator.clipboard.writeText(text);
                      alert("Summary copied to clipboard!");
                    }}
                 >📋 Copy Summary for CA</button>
              </div>
        </div>

        <div style={{ marginTop: 40 }}>
          <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
            <h3 style={{ color: "#e8edf2", fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
              👤 Party Outstanding
              <span style={{ fontSize: 11, color: "#8899aa", fontWeight: 400 }}>(Statement of Account)</span>
            </h3>
          </div>
          <div className="scroll-container" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
             <table className="mobile-table-to-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>PARTY NAME</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>TOTAL BILLED</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>PAID</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", color: "#f87171", fontWeight: 600 }}>OUTSTANDING</th>
                    <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {stats.clientBalances.slice(0, 10).map((client, idx) => (
                    <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                      <td data-label="Party" style={{ padding: "12px 16px", color: "#e8edf2", fontWeight: 600 }}>{client.name}</td>
                      <td data-label="Billed" style={{ padding: "12px 16px", color: "#8899aa", textAlign: "right" }}>₹{client.billed.toLocaleString()}</td>
                      <td data-label="Paid" style={{ padding: "12px 16px", color: "#34d399", textAlign: "right" }}>₹{client.paid.toLocaleString()}</td>
                      <td data-label="Due" style={{ padding: "12px 16px", color: "#f87171", textAlign: "right", fontWeight: 700 }}>₹{client.outstanding.toLocaleString()}</td>
                      <td data-label="Action" style={{ padding: "12px 16px", textAlign: "center" }}>
                         <button 
                           style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                           onClick={() => {
                             const ledgerText = `Statement for ${client.name}:\nTotal Billed: ₹${client.billed.toFixed(2)}\nTotal Paid: ₹${client.paid.toFixed(2)}\nOutstanding Balance: ₹${client.outstanding.toFixed(2)}\n\nThank you!\n- ${seller.name}`;
                             const url = `https://wa.me/${client.invoices[0]?.buyer?.phone?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(ledgerText)}`;
                             window.open(url, "_blank");
                           }}
                         >
                           📲 Ledger
                         </button>
                       </td>
                    </tr>
                  ))}
                  {stats.clientBalances.length === 0 && (
                    <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: "#8899aa" }}>No parties found in records.</td></tr>
                  )}
                </tbody>
             </table>
          </div>
        </div>

        {stats.pendingInvoices.length > 0 && (
          <div style={{ marginTop: 40, background: "rgba(248,113,113,0.03)", border: "1px solid rgba(248,113,113,0.15)", borderRadius: 24, padding: 24 }}>
            <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 20 }}>
              <h3 style={{ color: "#f87171", fontSize: 18, margin: 0, display: "flex", alignItems: "center", gap: 10 }}>
                🚨 Pending Payments 
                <span style={{ fontSize: 11, background: "rgba(248,113,113,0.1)", color: "#f87171", padding: "2px 8px", borderRadius: 10 }}>{stats.pendingInvoices.length} ACTION NEEDED</span>
              </h3>
            </div>
            
            <div className="pending-grid" style={{ display: "grid", gap: 12 }}>
              {(stats.pendingInvoices || []).map((inv, idx) => {
                const total = (inv.items || []).reduce((sum, item) => {
                  const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                  return sum + taxable + (taxable * (parseFloat(item.gstRate) / 100));
                }, 0);
                return (
                  <div key={idx} className="pending-card" style={{ background: "rgba(255,255,255,0.03)", border: "1px solid rgba(255,255,255,0.06)", borderRadius: 16, padding: "16px 20px", display: "flex", alignItems: "center", justifyContent: "space-between", gap: 20 }}>
                    <div style={{ flex: 1 }}>
                       <div style={{ color: "#e8edf2", fontWeight: 700, fontSize: 14 }}>{inv.buyer?.name || "Cash Sale"}</div>
                       <div style={{ color: "#8899aa", fontSize: 12 }}>#{inv.invoiceNum} · {inv.invoiceDate}</div>
                    </div>
                    <div className="pending-amount" style={{ textAlign: "right" }}>
                       <div style={{ color: "#f87171", fontWeight: 700, fontSize: 15 }}>₹{total.toLocaleString()}</div>
                       <div style={{ color: "#8899aa", fontSize: 10 }}>DUE NOW</div>
                    </div>
                    <div className="pending-actions" style={{ display: "flex", gap: 8 }}>
                       <button 
                         style={{ background: "rgba(255,255,255,0.05)", border: "none", color: "#8899aa", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                         onClick={() => handleMarkAsPaid(inv)}
                       >✅ Done</button>
                       <button 
                         style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", padding: "8px 12px", borderRadius: 8, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                         onClick={() => handleViewInvoice(inv)}
                       >👁️ View</button>
                       <button 
                         style={{ background: "#25D366", border: "none", color: "#fff", padding: "8px 16px", borderRadius: 8, fontSize: 11, fontWeight: 700, cursor: "pointer", display: "flex", alignItems: "center", gap: 6 }}
                         onClick={() => {
                           const msg = `Hi ${inv.buyer?.name},\n\nThis is a friendly reminder for Invoice #${inv.invoiceNum} of ₹${total.toFixed(2)} which is currently pending. \n\nPlease let us know when we can expect the payment.\n\nThank you!\n- ${inv.seller?.name || "Billby User"}`;
                           const url = `https://wa.me/${inv.buyer?.phone?.replace(/\D/g, "") || ""}?text=${encodeURIComponent(msg)}`;
                           window.open(url, "_blank");
                         }}
                       >💬 Remind</button>
                    </div>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        <div style={{ marginTop: 40 }}>
          <h3 style={{ color: "#e8edf2", fontSize: 18, marginBottom: 20, display: "flex", alignItems: "center", gap: 10 }}>
            Recent Activity 
            <span style={{ fontSize: 11, color: "#8899aa", fontWeight: 400 }}>(Showing last 5)</span>
          </h3>
          <div className="scroll-container" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
             <table className="mobile-table-to-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
                <thead>
                  <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                    <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>INV #</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>CLIENT</th>
                    <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>DATE</th>
                    <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>AMOUNT</th>
                    <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>STATUS</th>
                    <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa", fontWeight: 500 }}>ACTION</th>
                  </tr>
                </thead>
                <tbody>
                  {(stats.recentInvoices || []).map((inv, idx) => {
                    const total = (inv.items || []).reduce((sum, item) => {
                      const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
                      return sum + taxable + (taxable * (parseFloat(item.gstRate) / 100));
                    }, 0);
                    return (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)", transition: "background 0.2s" }} className="dashboard-row">
                        <td data-label="Invoice #" style={{ padding: "12px 16px", color: "#d4af37", fontWeight: 600 }}>{inv.invoiceNum}</td>
                        <td data-label="Client" style={{ padding: "12px 16px", color: "#e8edf2" }}>{inv.buyer?.name || "Cash Sale"}</td>
                        <td data-label="Date" style={{ padding: "12px 16px", color: "#8899aa" }}>{inv.invoiceDate}</td>
                        <td data-label="Amount" style={{ padding: "12px 16px", color: "#e8edf2", textAlign: "right", fontWeight: 600 }}>
                          ₹{total.toLocaleString(undefined, {minimumFractionDigits: 2})}
                        </td>
                        <td data-label="Status" style={{ padding: "12px 16px", textAlign: "center" }}>
                          {(() => {
                            const status = getInvoiceStatus(inv.invoiceNum);
                            const sInfo = INVOICE_STATUSES[inv.paidStatus === "paid" ? "PAID" : status] || INVOICE_STATUSES.DRAFT;
                            return (
                              <div style={{ 
                                display: "inline-flex", 
                                alignItems: "center", 
                                gap: 4, 
                                background: `${sInfo.color}15`, 
                                padding: "4px 10px", 
                                borderRadius: 20, 
                                border: `1px solid ${sInfo.color}30` 
                              }}>
                                <span style={{ fontSize: 10 }}>{sInfo.icon}</span>
                                <span style={{ color: sInfo.color, fontSize: 9, fontWeight: 700, textTransform: "uppercase" }}>{sInfo.label}</span>
                              </div>
                            );
                          })()}
                        </td>
                        <td data-label="Action" style={{ padding: "12px 16px", textAlign: "center" }}>
                            <button 
                              style={{ background: "rgba(212,175,55,0.1)", border: "1px solid rgba(212,175,55,0.2)", color: "#d4af37", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer" }}
                              onClick={() => handleViewInvoice(inv)}
                            >
                              👁️ View/Print
                            </button>
                            <button 
                              style={{ background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", color: "#ef4444", padding: "4px 10px", borderRadius: 6, fontSize: 11, fontWeight: 600, cursor: "pointer", marginLeft: 8 }}
                              onClick={() => {
                                if (confirm("Delete invoice #" + inv.invoiceNum + "?")) {
                                  // Remove from localStorage
                                  const archive = getLocalArchive();
                                  const updated = archive.filter(i => i.invoiceNum !== inv.invoiceNum);
                                  localStorage.setItem("bb_invoice_archive", JSON.stringify(updated));
                                  // Remove from tracking
                                  const tracking = JSON.parse(localStorage.getItem("bb_invoice_tracking") || "{}");
                                  delete tracking[inv.invoiceNum];
                                  localStorage.setItem("bb_invoice_tracking", JSON.stringify(tracking));
                                  alert("Invoice deleted!");
                                  window.location.reload();
                                }
                              }}
                            >
                              🗑️ Delete
                            </button>
                          </td>
                      </tr>
                    );
                  })}
                </tbody>
             </table>
          </div>
        </div>

        <div style={{ marginTop: 40, background: "rgba(20,184,166,0.05)", borderRadius: 16, padding: 20, border: "1px dashed rgba(20,184,166,0.3)", display: "flex", alignItems: "center", gap: 16 }}>
           <div style={{ fontSize: 24 }}>💡</div>
           <div style={{ flex: 1 }}>
             <div style={{ color: "#e8edf2", fontSize: 14, fontWeight: 600, marginBottom: 4 }}>Pro Tip: Tax Season?</div>
             <div style={{ color: "#8899aa", fontSize: 12 }}>You've saved {stats.totals.igst > 0 ? "IGST" : "local"} sales this month. Download the GSTR-1 JSON for your CA.</div>
           </div>
           <div style={{ display: "flex", gap: 10 }}>
              <button style={{ ...S.btnSecondary, padding: "8px 16px", fontSize: 12 }} onClick={() => generateGSTR1(seller)}>📂 GSTR-1 JSON</button>
              <button style={{ ...S.btnTeal, padding: "8px 16px", fontSize: 12 }} onClick={() => generateArchive()}>Export XLSX</button>
           </div>
        </div>
      </div>
    </div>
  );
};

export default DashboardView;
