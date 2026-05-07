/**
 * GST Reconciliation Engine for BillKaro
 * Matches saved invoices against GSTR-2B data to protect ITC
 */

import { useState, useCallback } from "react";
import { getLocalArchive } from "./useArchiveExport";
import { auth, db } from "../lib/firebase";
import { collection, getDocs, query, orderBy } from "firebase/firestore";

// ── GSTR-2B Simulator (Production: use actual GSP API) ──────────────────────
const fetchGSTR2B = async (userGSTIN) => {
  // In production, call actual GST portal API via GSP partner
  // For now, use localStorage "mock" GSTR-2B data
  const mockData = JSON.parse(localStorage.getItem("bk_gstr2b_mock") || "[]");
  return mockData;
};

// ── Matching Engine ─────────────────────────────────────────────────────────
const matchInvoices = (billkaroInvoices, gstr2bData) => {
  const matches = [];
  const mismatches = [];
  const unmatched = []; // In GSTR-2B but not in BillKaro

  for (const inv of billkaroInvoices) {
    const match = gstr2bData.find(
      (g) => g.invoiceNum === inv.invoiceNum || g.invoiceNum === `${inv.invoicePrefix || "INV-"}${inv.invoiceNum}`
    );

    if (match) {
      const invTotal = (inv.items || []).reduce((sum, item) => {
        const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
        const gst = taxable * ((parseFloat(item.gstRate) || 0) / 100);
        return sum + taxable + gst;
      }, 0);

      const tolerance = Math.abs(invTotal - (match.totalValue || 0));

      if (tolerance < 10) {
        matches.push({ ...inv, gstr2bMatch: match, status: "MATCHED" });
      } else {
        mismatches.push({
          ...inv,
          gstr2bMatch: match,
          status: "MISMATCH",
          difference: tolerance,
          billkaroTotal: invTotal,
          gstr2bTotal: match.totalValue,
        });
      }
    } else {
      mismatches.push({ ...inv, status: "NOT_IN_GSTR2B" });
    }
  }

  // Find GSTR-2B entries not in BillKaro
  for (const g of gstr2bData) {
    const found = billkaroInvoices.find(
      (inv) => inv.invoiceNum === g.invoiceNum || `${inv.invoicePrefix || "INV-"}${inv.invoiceNum}` === g.invoiceNum
    );
    if (!found) unmatched.push(g);
  }

  return { matches, mismatches, unmatched };
};

// ── ITC Risk Calculator ─────────────────────────────────────────────────────
const calculateITCRisk = (mismatches) => {
  const totalAtRisk = mismatches.reduce((sum, inv) => {
    const gstTotal = (inv.items || []).reduce((s, item) => {
      const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return s + taxable * ((parseFloat(item.gstRate) || 0) / 100);
    }, 0);
    return sum + gstTotal;
  }, 0);

  const totalInvoiceValue = mismatches.reduce((sum, inv) => {
    return sum + (inv.items || []).reduce((s, item) => {
      const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      const gst = taxable * ((parseFloat(item.gstRate) || 0) / 100);
      return s + taxable + gst;
    }, 0);
  }, 0);

  return {
    totalAtRisk,
    totalInvoiceValue,
    count: mismatches.length,
    riskLevel: totalAtRisk > 100000 ? "HIGH" : totalAtRisk > 25000 ? "MEDIUM" : "LOW",
  };
};

// ── Main Hook ───────────────────────────────────────────────────────────────
export function useGSTReconciliation() {
  const [reconciling, setReconciling] = useState(false);
  const [reconciliationResults, setReconciliationResults] = useState(null);
  const [reconciliationError, setReconciliationError] = useState("");

  const runReconciliation = useCallback(async () => {
    setReconciling(true);
    setReconciliationError("");

    try {
      // Step 1: Get all BillKaro invoices
      let billkaroInvoices = [];
      const user = auth.currentUser;

      if (user) {
        try {
          const ref = collection(db, "users", user.uid, "invoices");
          const q = query(ref, orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          billkaroInvoices = snap.docs.map((d) => d.data());
        } catch {
          billkaroInvoices = getLocalArchive();
        }
      } else {
        billkaroInvoices = getLocalArchive();
      }

      if (billkaroInvoices.length === 0) {
        setReconciliationError("No invoices found. Create invoices first.");
        setReconciling(false);
        return;
      }

      // Step 2: Fetch GSTR-2B data (simulated)
      const sellerGSTIN = billkaroInvoices[0]?.seller?.gstin || "YOUR_GSTIN";
      const gstr2bData = await fetchGSTR2B(sellerGSTIN);

      if (gstr2bData.length === 0) {
        setReconciliationError(
          "No GSTR-2B data found. Add mock data for testing, or connect a GSP API for live data."
        );
        setReconciling(false);
        return;
      }

      // Step 3: Match invoices
      const { matches, mismatches, unmatched } = matchInvoices(billkaroInvoices, gstr2bData);

      // Step 4: Calculate ITC risk
      const itcRisk = calculateITCRisk(mismatches);

      // Step 5: Generate recommendations
      const recommendations = [];
      if (mismatches.length > 0) {
        recommendations.push({
          priority: "HIGH",
          action: "Reconcile Mismatches",
          detail: `${mismatches.length} invoice(s) don't match GSTR-2B. ITC of ₹${itcRisk.totalAtRisk.toLocaleString("en-IN")} at risk.`,
        });
      }
      if (unmatched.length > 0) {
        recommendations.push({
          priority: "MEDIUM",
          action: "Review Missing Invoices",
          detail: `${unmatched.length} invoice(s) in GSTR-2B but not in BillKaro. Could indicate supplier fraud.`,
        });
      }
      if (matches.length === billkaroInvoices.length && unmatched.length === 0) {
        recommendations.push({
          priority: "LOW",
          action: "All Clear",
          detail: "All invoices matched. No ITC risk detected. ✅",
        });
      }

      setReconciliationResults({
        timestamp: new Date().toISOString(),
        totalInvoices: billkaroInvoices.length,
        matchedCount: matches.length,
        mismatchedCount: mismatches.length,
        unmatchedCount: unmatched.length,
        matches,
        mismatches,
        unmatched,
        itcRisk,
        recommendations,
      });
    } catch (err) {
      console.error("Reconciliation failed:", err);
      setReconciliationError("Reconciliation failed. Check your connection and try again.");
    } finally {
      setReconciling(false);
    }
  }, []);

  // ── Export reconciliation report ──────────────────────────────────────────
  const exportReconciliationReport = useCallback(() => {
    if (!reconciliationResults) return;

    const report = {
      title: "BillKaro GST Reconciliation Report",
      generatedAt: reconciliationResults.timestamp,
      summary: {
        totalInvoices: reconciliationResults.totalInvoices,
        matched: reconciliationResults.matchedCount,
        mismatched: reconciliationResults.mismatchedCount,
        unmatchedInGSTR2B: reconciliationResults.unmatchedCount,
        itcAtRisk: reconciliationResults.itcRisk.totalAtRisk,
        riskLevel: reconciliationResults.itcRisk.riskLevel,
      },
      mismatches: reconciliationResults.mismatches.map((inv) => ({
        invoiceNum: inv.invoiceNum,
        billkaroTotal: inv.billkaroTotal,
        gstr2bTotal: inv.gstr2bTotal,
        difference: inv.difference,
        buyer: inv.buyer?.name,
        date: inv.invoiceDate,
      })),
      recommendations: reconciliationResults.recommendations,
    };

    const blob = new Blob([JSON.stringify(report, null, 2)], { type: "application/json" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `GST_Reconciliation_${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
  }, [reconciliationResults]);

  return {
    reconciling,
    reconciliationResults,
    reconciliationError,
    runReconciliation,
    exportReconciliationReport,
  };
}
