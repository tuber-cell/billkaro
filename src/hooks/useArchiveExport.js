/**
 * useArchiveExport — Master Archive Export Hook
 *
 * Source of truth strategy:
 *  - Logged-in users  → Firestore: users/{uid}/invoices  (full history)
 *  - Guest users      → localStorage: bk_invoice_archive (full history)
 *
 * The hook ALWAYS merges the current live invoice from the form into the
 * archive before exporting, so it works correctly even on the very first use.
 *
 * ALL derived fields (taxable, CGST, SGST, IGST, total) are
 * calculated in the service layer — never trusted from UI state.
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
  const idx = archive.findIndex((i) => i.invoiceNum === invoice.invoiceNum);
  if (idx >= 0) archive[idx] = invoice;
  else archive.unshift(invoice);
  localStorage.setItem(LS_KEY, JSON.stringify(archive));
}

// ── Merge helper: deduplicate by invoiceNum, current invoice wins ─────────────
function mergeInvoices(archive, current) {
  if (!current) return archive;
  const merged = archive.filter((i) => i.invoiceNum !== current.invoiceNum);
  return [current, ...merged]; // current always first
}

// ── Row calculation (single source of truth — service layer) ──────────────────
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
  const cgst  = isIntra ? gstTotal / 2 : 0;
  const sgst  = isIntra ? gstTotal / 2 : 0;
  const igst  = !isIntra ? gstTotal : 0;
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

  /**
   * generateArchive(currentInvoice)
   * @param {object} currentInvoice — the live invoice currently in the form
   *   { invoiceNum, invoiceDate, buyer, seller, supplyType, paidStatus, items }
   *   Pass null to export only the stored archive.
   */
  const generateArchive = useCallback(async (currentInvoice = null) => {
    setExporting(true);
    try {
      let archive = [];
      const user = auth.currentUser;

      if (user) {
        // ── Logged-in: pull full history from Firestore ───────────────────
        try {
          const ref = collection(db, "users", user.uid, "invoices");
          const q   = query(ref, orderBy("createdAt", "desc"));
          const snap = await getDocs(q);
          archive = snap.docs.map((d) => d.data());
        } catch (fsErr) {
          console.warn("Firestore fetch failed, using localStorage:", fsErr);
          archive = getLocalArchive();
        }
      } else {
        // ── Guest: pull from localStorage archive ────────────────────────
        archive = getLocalArchive();
      }

      // ── Merge the current live invoice into archive ───────────────────────
      const allInvoices = mergeInvoices(archive, currentInvoice);

      if (allInvoices.length === 0) {
        alert("No invoices to export. Fill in the form and try again.");
        setExporting(false);
        return;
      }

      // ── Calculate all derived fields in the service layer ─────────────────
      const rows = allInvoices.map(calcRow);

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

      const count    = allInvoices.length;
      const fileName = `BillKaro_Archive_${new Date().toISOString().slice(0, 10)}_${count}inv.xlsx`;
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
