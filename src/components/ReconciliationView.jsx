import React from "react";
import { S, fmt } from "./common/Constants";

const ReconciliationView = ({
  reconciling,
  reconciliationResults,
  reconciliationError,
  runReconciliation,
  exportReconciliationReport,
  setStep
}) => {
  return (
    <div style={{ ...S.container, padding: "20px 20px 60px" }}>
      {/* Header */}
      <div style={{ marginBottom: 32 }}>
        <h2 style={{ color: "#e8edf2", fontSize: 28, margin: 0, display: "flex", alignItems: "center", gap: 12 }}>
          🔍 GST Reconciliation
          <span style={{ fontSize: 12, background: "rgba(212,175,55,0.1)", color: "#d4af37", padding: "4px 12px", borderRadius: 20, fontWeight: 600 }}>
            ITC PROTECTION
          </span>
        </h2>
        <p style={{ color: "#8899aa", fontSize: 13, marginTop: 8 }}>
          Match your invoices against GSTR-2B data to protect your Input Tax Credit.
        </p>

        <div style={{ display: "flex", gap: 12, marginTop: 16 }}>
          <button 
              style={{ ...S.btnSecondary, fontSize: 12, padding: "8px 20px" }}
              onClick={() => setStep("dashboard")}
          >
              ← Back to Dashboard
          </button>
        </div>
      </div>

      {/* Run Reconciliation Button */}
      {!reconciliationResults && (
        <div style={{ ...S.card, textAlign: "center", padding: "40px 20px" }}>
          {/* Coming Soon Badge */}
          <div style={{
              background: "rgba(212,175,55,0.08)",
              border: "1px solid rgba(212,175,55,0.2)",
              borderRadius: 12,
              padding: "12px 16px",
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 12,
              textAlign: "left",
              maxWidth: 500,
              margin: "0 auto 32px"
          }}>
              <span style={{ fontSize: 20 }}>🚀</span>
              <div>
                  <div style={{ color: "#d4af37", fontWeight: 700, fontSize: 13 }}>
                      Coming Soon: Automatic GSTR-2B Sync
                  </div>
                  <div style={{ color: "#8899aa", fontSize: 11 }}>
                      Currently in demo mode. Real-time GST data sync will be available in the Pro plan.
                  </div>
              </div>
          </div>

          <button
            onClick={runReconciliation}
            disabled={reconciling}
            style={{
              ...S.btnPrimary,
              padding: "16px 40px",
              fontSize: 16,
              opacity: reconciling ? 0.6 : 1,
            }}
          >
            {reconciling ? "⏳ Reconciling..." : "🔄 Run Reconciliation"}
          </button>
          {reconciliationError && (
            <div style={{ color: "#ef4444", marginTop: 16, fontSize: 13 }}>{reconciliationError}</div>
          )}
          <div style={{ color: "#445566", marginTop: 20, fontSize: 11 }}>
            No live GSTR-2B data? Add mock data in localStorage key "bb_gstr2b_mock" for testing.
          </div>
        </div>
      )}

      {/* Results */}
      {reconciliationResults && (
        <>
          {/* Summary Cards */}
          <div style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(180px, 1fr))", gap: 16, marginBottom: 32 }}>
            {[
              { label: "Total Invoices", value: reconciliationResults.totalInvoices, color: "#a78bfa" },
              { label: "Matched ✅", value: reconciliationResults.matchedCount, color: "#34d399" },
              { label: "Mismatched ❌", value: reconciliationResults.mismatchedCount, color: "#ef4444" },
              { label: "ITC at Risk", value: fmt(reconciliationResults.itcRisk.totalAtRisk), color: "#f59e0b" },
            ].map(({ label, value, color }) => (
              <div key={label} style={{ ...S.card, padding: 20, marginBottom: 0, borderLeft: `4px solid ${color}` }}>
                <div style={{ color: "#8899aa", fontSize: 11, fontWeight: 600, textTransform: "uppercase", marginBottom: 8 }}>
                  {label}
                </div>
                <div style={{ color: "#e8edf2", fontSize: 22, fontWeight: 800 }}>{value}</div>
              </div>
            ))}
          </div>

          {/* ITC Risk Banner */}
          {reconciliationResults.itcRisk.riskLevel !== "LOW" && (
            <div className="bk-flex-column-mobile" style={{
              background: reconciliationResults.itcRisk.riskLevel === "HIGH" ? "rgba(239,68,68,0.1)" : "rgba(245,158,11,0.1)",
              border: `1px solid ${reconciliationResults.itcRisk.riskLevel === "HIGH" ? "rgba(239,68,68,0.3)" : "rgba(245,158,11,0.3)"}`,
              borderRadius: 16,
              padding: 20,
              marginBottom: 32,
              display: "flex",
              alignItems: "center",
              gap: 16,
            }}>
              <span style={{ fontSize: 32 }}>
                {reconciliationResults.itcRisk.riskLevel === "HIGH" ? "🚨" : "⚠️"}
              </span>
              <div>
                <div style={{ color: "#e8edf2", fontWeight: 700, fontSize: 16, marginBottom: 4 }}>
                  {reconciliationResults.itcRisk.riskLevel === "HIGH" ? "HIGH ITC RISK" : "MODERATE ITC RISK"}
                </div>
                <div style={{ color: "#8899aa", fontSize: 13 }}>
                  ₹{reconciliationResults.itcRisk.totalAtRisk.toLocaleString("en-IN")} Input Tax Credit at risk across{" "}
                  {reconciliationResults.itcRisk.count} invoice(s). Reconcile before your next GST filing.
                </div>
              </div>
            </div>
          )}

          {/* Mismatch Table */}
          {reconciliationResults.mismatches.length > 0 && (
            <div style={{ ...S.card, marginBottom: 24 }}>
              <h3 style={{ color: "#ef4444", fontSize: 16, marginBottom: 16 }}>❌ Mismatched Invoices</h3>
              <div className="scroll-container" style={{ overflow: "auto" }}>
                <table className="mobile-table-to-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 12 }}>
                  <thead>
                    <tr style={{ background: "rgba(239,68,68,0.05)" }}>
                      {["Invoice #", "Buyer", "Date", "Billby Total", "GSTR-2B Total", "Difference", "Status"].map((h) => (
                        <th key={h} style={{ padding: "10px 12px", color: "#8899aa", textAlign: "left", fontWeight: 600 }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {reconciliationResults.mismatches.map((inv, idx) => (
                      <tr key={idx} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                        <td data-label="Invoice #" style={{ padding: "10px 12px", color: "#d4af37", fontWeight: 600 }}>{inv.invoiceNum}</td>
                        <td data-label="Buyer" style={{ padding: "10px 12px", color: "#e8edf2" }}>{inv.buyer?.name || "N/A"}</td>
                        <td data-label="Date" style={{ padding: "10px 12px", color: "#8899aa" }}>{inv.invoiceDate}</td>
                        <td data-label="Billby" style={{ padding: "10px 12px", color: "#e8edf2" }}>
                          {inv.billbyTotal ? `₹${inv.billbyTotal.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td data-label="GSTR-2B" style={{ padding: "10px 12px", color: "#e8edf2" }}>
                          {inv.gstr2bTotal ? `₹${inv.gstr2bTotal.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td data-label="Diff" style={{ padding: "10px 12px", color: "#ef4444", fontWeight: 700 }}>
                          {inv.difference ? `₹${inv.difference.toLocaleString("en-IN")}` : "—"}
                        </td>
                        <td data-label="Status" style={{ padding: "10px 12px" }}>
                          <span style={{
                            background: "rgba(239,68,68,0.1)",
                            color: "#ef4444",
                            padding: "3px 8px",
                            borderRadius: 10,
                            fontSize: 10,
                            fontWeight: 700,
                          }}>
                            {inv.status}
                          </span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Recommendations */}
          <div style={{ ...S.card, marginBottom: 24 }}>
            <h3 style={{ color: "#d4af37", fontSize: 16, marginBottom: 16 }}>📋 Recommendations</h3>
            {reconciliationResults.recommendations.map((rec, idx) => (
              <div key={idx} style={{
                background: rec.priority === "HIGH" ? "rgba(239,68,68,0.05)" : rec.priority === "MEDIUM" ? "rgba(245,158,11,0.05)" : "rgba(52,211,153,0.05)",
                border: "1px solid rgba(255,255,255,0.05)",
                borderRadius: 12,
                padding: 16,
                marginBottom: 12,
              }}>
                <div style={{ color: "#e8edf2", fontWeight: 700, fontSize: 14, marginBottom: 4 }}>{rec.action}</div>
                <div style={{ color: "#8899aa", fontSize: 12 }}>{rec.detail}</div>
              </div>
            ))}
          </div>

          {/* Export & Re-run */}
          <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
            <button style={S.btnSecondary} onClick={exportReconciliationReport}>
              📄 Export Report
            </button>
            <button style={S.btnPrimary} onClick={runReconciliation} disabled={reconciling}>
              {reconciling ? "⏳ Reconciling..." : "🔄 Re-run Reconciliation"}
            </button>
          </div>
        </>
      )}
    </div>
  );
};

export default ReconciliationView;
