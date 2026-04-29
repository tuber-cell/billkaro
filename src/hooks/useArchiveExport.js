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
import { collection, getDocs, orderBy, query, where } from "firebase/firestore";

// ── State Codes for GSTR-1 ──────────────────────────────────────────────────
const STATE_CODES = {
  "Jammu & Kashmir": "01", "Himachal Pradesh": "02", "Punjab": "03", "Chandigarh": "04", "Uttarakhand": "05",
  "Haryana": "06", "Delhi": "07", "Rajasthan": "08", "Uttar Pradesh": "09", "Bihar": "10", "Sikkim": "11",
  "Arunachal Pradesh": "12", "Nagaland": "13", "Manipur": "14", "Mizoram": "15", "Tripura": "16",
  "Meghalaya": "17", "Assam": "18", "West Bengal": "19", "Jharkhand": "20", "Odisha": "21",
  "Chhattisgarh": "22", "Madhya Pradesh": "23", "Gujarat": "24", "Maharashtra": "27",
  "Andhra Pradesh": "28", "Karnataka": "29", "Goa": "30", "Kerala": "32", "Tamil Nadu": "33",
  "Telangana": "36"
};

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
    "HSN/SAC":        inv.items?.map(i => i.hsn).filter(Boolean).join(", ") || "",
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
      const merged = mergeInvoices(archive, currentInvoice);

      // ── Filter out any corrupted or empty invoices ────────────────────────
      const validInvoices = merged.filter(inv => {
        const hasItems = inv.items && inv.items.length > 0;
        const hasTotal = hasItems && inv.items.some(i => (parseFloat(i.rate) || 0) > 0);
        const hasDescription = hasItems && inv.items.some(i => i.desc?.trim());
        
        // Accept if it has a number AND (a buyer name OR a total > 0 OR a description)
        return inv.invoiceNum && (inv.buyer?.name?.trim() || hasTotal || hasDescription);
      });

      if (validInvoices.length === 0) {
        console.warn("Archive export blocked: No valid data found.", { merged });
        alert("No completed invoices found in your archive to export. Please 'Save & Next' or fill in the current form first.");
        setExporting(false);
        return;
      }

      // ── Calculate all derived fields in the service layer ─────────────────
      const rows = validInvoices.map(calcRow);

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
        { wch: 16 }, // HSN/SAC
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
      
      const fileName = `BillKaro_Archive_${new Date().toISOString().slice(0, 10)}_${validInvoices.length}inv.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      console.error("Archive export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  /**
   * generateGSTR1(seller)
   * @param {object} seller - The seller profile containing name, gstin, etc.
   */
  const generateGSTR1 = useCallback(async (seller) => {
    setExporting(true);
    try {
      let archive = [];
      const user = auth.currentUser;

      if (user) {
        const ref = collection(db, "users", user.uid, "invoices");
        const q = query(ref, orderBy("createdAt", "desc"));
        const snap = await getDocs(q);
        archive = snap.docs.map((d) => d.data());
      } else {
        archive = getLocalArchive();
      }

      // Filter current month
      const now = new Date();
      const curM = now.getMonth();
      const curY = now.getFullYear();
      const monthlyData = archive.filter(inv => {
        const d = new Date(inv.invoiceDate || inv.createdAt);
        return d.getMonth() === curM && d.getFullYear() === curY;
      });

      if (monthlyData.length === 0) {
        alert("No invoices found for the current month to export.");
        return;
      }

      // ── B2B Section ────────────────────────────────────────────────────────
      const b2bMap = {};
      monthlyData.filter(inv => inv.buyer?.gstin?.length > 5).forEach(inv => {
        const ctin = inv.buyer.gstin.toUpperCase();
        if (!b2bMap[ctin]) b2bMap[ctin] = { ctin, inv: [] };
        
        const taxableVal = (inv.items || []).reduce((s, it) => s + (parseFloat(it.qty) * parseFloat(it.rate)), 0);
        const gstVal = (inv.items || []).reduce((s, it) => s + (parseFloat(it.qty) * parseFloat(it.rate) * (parseFloat(it.gstRate) / 100)), 0);
        
        b2bMap[ctin].inv.push({
          inum: inv.invoiceNum,
          idt: inv.invoiceDate.split('-').reverse().join('-'), // DD-MM-YYYY
          val: Number((taxableVal + gstVal).toFixed(2)),
          pos: STATE_CODES[inv.buyer.state] || "27",
          rchrg: "N",
          inv_typ: "R",
          itms: (inv.items || []).map((it, idx) => ({
            num: idx + 1,
            itm_det: {
              rt: parseFloat(it.gstRate),
              txval: Number((parseFloat(it.qty) * parseFloat(it.rate)).toFixed(2)),
              iamt: inv.supplyType !== 'intra' ? Number((parseFloat(it.qty) * parseFloat(it.rate) * (parseFloat(it.gstRate) / 100)).toFixed(2)) : 0,
              camt: inv.supplyType === 'intra' ? Number((parseFloat(it.qty) * parseFloat(it.rate) * (parseFloat(it.gstRate) / 200)).toFixed(2)) : 0,
              samt: inv.supplyType === 'intra' ? Number((parseFloat(it.qty) * parseFloat(it.rate) * (parseFloat(it.gstRate) / 200)).toFixed(2)) : 0
            }
          }))
        });
      });

      // ── B2CS Section (B2C Small) ───────────────────────────────────────────
      const b2csMap = {};
      monthlyData.filter(inv => !inv.buyer?.gstin || inv.buyer.gstin.length < 5).forEach(inv => {
        const pos = STATE_CODES[inv.buyer.state] || "27";
        (inv.items || []).forEach(it => {
          const rt = parseFloat(it.gstRate);
          const key = `${pos}_${rt}`;
          if (!b2csMap[key]) {
            b2csMap[key] = {
              sply_ty: inv.supplyType === "intra" ? "INTRA" : "INTER",
              rt: rt,
              typ: "OE",
              pos: pos,
              txval: 0,
              iamt: 0
            };
          }
          const txval = parseFloat(it.qty) * parseFloat(it.rate);
          b2csMap[key].txval += txval;
          if (inv.supplyType !== "intra") {
            b2csMap[key].iamt += txval * (rt / 100);
          }
        });
      });
      // Round B2CS values
      Object.values(b2csMap).forEach(v => {
        v.txval = Number(v.txval.toFixed(2));
        v.iamt = Number(v.iamt.toFixed(2));
      });

      // ── HSN Summary ────────────────────────────────────────────────────────
      const hsnMap = {};
      monthlyData.forEach(inv => {
        (inv.items || []).forEach(it => {
          const hsn = it.hsn || "99"; // default to service if empty
          const rt = parseFloat(it.gstRate);
          const key = `${hsn}_${rt}`;
          if (!hsnMap[key]) {
            hsnMap[key] = {
              hsn_sc: hsn,
              desc: it.desc?.slice(0, 30) || "Goods",
              uqc: "OTH",
              qty: 0,
              val: 0,
              txval: 0,
              iamt: 0, camt: 0, samt: 0, csamt: 0
            };
          }
          const txval = parseFloat(it.qty) * parseFloat(it.rate);
          const iamt = inv.supplyType !== 'intra' ? txval * (rt / 100) : 0;
          const camt = inv.supplyType === 'intra' ? txval * (rt / 200) : 0;
          const samt = inv.supplyType === 'intra' ? txval * (rt / 200) : 0;
          
          hsnMap[key].qty += parseFloat(it.qty) || 0;
          hsnMap[key].txval += txval;
          hsnMap[key].iamt += iamt;
          hsnMap[key].camt += camt;
          hsnMap[key].samt += samt;
          hsnMap[key].val += txval + iamt + camt + samt;
        });
      });
      const hsnData = Object.values(hsnMap).map((v, idx) => ({
        num: idx + 1,
        ...v,
        qty: Number(v.qty.toFixed(2)),
        val: Number(v.val.toFixed(2)),
        txval: Number(v.txval.toFixed(2)),
        iamt: Number(v.iamt.toFixed(2)),
        camt: Number(v.camt.toFixed(2)),
        samt: Number(v.samt.toFixed(2))
      }));

      // ── Doc Issue Summary ──────────────────────────────────────────────────
      const sortedInvoices = monthlyData.map(i => i.invoiceNum).sort();
      const docIssue = {
        doc_det: [{
          doc_num: 1,
          docs: [{
            from: sortedInvoices[0],
            to: sortedInvoices[sortedInvoices.length - 1],
            totcnt: monthlyData.length,
            cancel: 0,
            net_issue: monthlyData.length
          }]
        }]
      };

      const gstr1 = {
        gstin: seller.gstin || "YOUR_GSTIN",
        fp: `${(now.getMonth() + 1).toString().padStart(2, '0')}${now.getFullYear()}`,
        gt: 0,
        cur_gt: 0,
        b2b: Object.values(b2bMap),
        b2cs: Object.values(b2csMap),
        hsn: { data: hsnData },
        doc_issue: docIssue
      };

      const blob = new Blob([JSON.stringify(gstr1, null, 2)], { type: "application/json" });
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = `BillKaro_GSTR1_${now.toLocaleString('default', { month: 'short' })}_${now.getFullYear()}.json`;
      a.click();

    } catch (err) {
      console.error("GSTR-1 export failed:", err);
      alert("GSTR-1 export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  return { generateArchive, generateGSTR1, exporting };
}
