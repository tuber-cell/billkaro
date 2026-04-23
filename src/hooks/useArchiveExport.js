/**
 * useArchiveExport — Master Archive Export Hook
 *
 * Source of truth strategy:
 *  - Logged-in users  → Firestore collection: users/{uid}/invoices
 *  - Guest users      → localStorage key: bk_invoice_archive (array)
 *
 * ALL derived fields (taxable, CGST, SGST, IGST, total) are
 * calculated here in the service layer — never trusted from UI state.
 */
import { useState, useCallback } from "react";
import * as XLSX from "xlsx";
import { db, auth } from "../lib/firebase";
import { collection, getDocs, orderBy, query } from "firebase/firestore";

// ── Local Storage helpers ─────────────────────────────────────────────────────
const LS_KEY = "bk_invoice_archive";

export function getLocalArchive() {
  try {
    return JSON.parse(localStorage.getItem(LS_KEY) || "[]");
  } catch {
    return [];
  }
}

export function saveToLocalArchive(invoice) {
  const archive = getLocalArchive();
  // Deduplicate by invoiceNum — overwrite if same number exists
  const idx = archive.findIndex((i) => i.invoiceNum === invoice.invoiceNum);
  if (idx >= 0) archive[idx] = invoice;
  else archive.unshift(invoice); // newest first
  localStorage.setItem(LS_KEY, JSON.stringify(archive));
}

// ── Row calculation (single source of truth) ──────────────────────────────────
function calcRow(inv) {
  const taxable = (inv.items || []).reduce((sum, item) => {
    return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
  }, 0);

  const gstTotal = (inv.items || []).reduce((sum, item) => {
    const itemTaxable =
      (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    return sum + itemTaxable * ((parseFloat(item.gstRate) || 0) / 100);
  }, 0);

  const isIntra = inv.supplyType === "intra";
  const cgst = isIntra ? gstTotal / 2 : 0;
  const sgst = isIntra ? gstTotal / 2 : 0;
  const igst = !isIntra ? gstTotal : 0;
  const total = taxable + gstTotal;

  return {
    "Date":           inv.invoiceDate   ?? "",
    "Invoice No":     inv.invoiceNum    ?? "",
    "Buyer Name":     inv.buyer?.name   ?? "",
    "Buyer GSTIN":    inv.buyer?.gstin  ?? "",
    "Seller Name":    inv.seller?.name  ?? "",
    "Seller GSTIN":   inv.seller?.gstin ?? "",
    "Supply Type":    isIntra ? "Intra-State" : "Inter-State",
    "Taxable Value":  parseFloat(taxable.toFixed(2)),
    "CGST":           parseFloat(cgst.toFixed(2)),
    "SGST":           parseFloat(sgst.toFixed(2)),
    "IGST":           parseFloat(igst.toFixed(2)),
    "Total (₹)":      parseFloat(total.toFixed(2)),
    "Status":         inv.paidStatus === "paid" ? "Paid" : "Unpaid",
  };
}

// ── Main hook ─────────────────────────────────────────────────────────────────
export function useArchiveExport() {
  const [exporting, setExporting] = useState(false);

  const generateArchive = useCallback(async () => {
    setExporting(true);
    try {
      let invoices = [];

      const user = auth.currentUser;

      if (user) {
        // ── Logged-in: pull full history from Firestore ─────────────────────
        const ref = collection(db, "users", user.uid, "invoices");
        const q = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);

        if (snap.empty) {
          alert("No invoices found in your archive. Generate at least one invoice first.");
          setExporting(false);
          return;
        }
        invoices = snap.docs.map((d) => d.data());
      } else {
        // ── Guest: pull from localStorage archive ───────────────────────────
        invoices = getLocalArchive();
        if (invoices.length === 0) {
          alert("No invoices found. Generate at least one invoice first.");
          setExporting(false);
          return;
        }
      }

      // ── Calculate all derived fields in the service layer ─────────────────
      const rows = invoices.map(calcRow);

      // ── Build worksheet ───────────────────────────────────────────────────
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook  = XLSX.utils.book_new();

      worksheet["!cols"] = [
        { wch: 14 }, // Date
        { wch: 16 }, // Invoice No
        { wch: 24 }, // Buyer Name
        { wch: 20 }, // Buyer GSTIN
        { wch: 20 }, // Seller Name
        { wch: 20 }, // Seller GSTIN
        { wch: 14 }, // Supply Type
        { wch: 16 }, // Taxable Value
        { wch: 10 }, // CGST
        { wch: 10 }, // SGST
        { wch: 10 }, // IGST
        { wch: 14 }, // Total
        { wch: 10 }, // Status
      ];

      // Style header row
      const range = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let col = range.s.c; col <= range.e.c; col++) {
        const addr = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[addr]) continue;
        worksheet[addr].s = {
          font:      { bold: true, color: { rgb: "FFFFFF" } },
          fill:      { fgColor: { rgb: "0F1923" } },
          alignment: { horizontal: "center" },
        };
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Master Archive");

      const fileName = `BillKaro_Archive_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      console.error("Archive export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  return { generateArchive, exporting };
}
