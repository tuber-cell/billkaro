// ── Imports ───────────────────────────────────────────────────────────────────
import { useState, useCallback } from "react";
import * as XLSX from "xlsx";

// ── Excel Export Hook ─────────────────────────────────────────────────────────
export function useExcelExport() {
  const [exporting, setExporting] = useState(false);

  const exportToExcel = useCallback((invoiceArray) => {
    if (!invoiceArray || invoiceArray.length === 0) {
      alert("No invoices to export.");
      return;
    }

    setExporting(true);

    try {
      // ── 1. Map invoice fields into flat rows ──────────────────────────────
      const rows = invoiceArray.map((inv) => {
        const taxable = inv.items?.reduce((sum, item) => {
          return sum + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
        }, 0) ?? inv.taxableAmount ?? 0;

        const gstTotal = inv.items?.reduce((sum, item) => {
          const itemTaxable =
            (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
          return (
            sum + itemTaxable * ((parseFloat(item.gstRate) || 0) / 100)
          );
        }, 0) ?? inv.gstAmount ?? 0;

        const isIntra = inv.supplyType === "intra";
        const cgst    = isIntra ? gstTotal / 2 : 0;
        const sgst    = isIntra ? gstTotal / 2 : 0;
        const igst    = !isIntra ? gstTotal : 0;
        const total   = taxable + gstTotal;

        return {
          "Date":          inv.invoiceDate   ?? "",
          "Invoice No":    inv.invoiceNum    ?? "",
          "Buyer Name":    inv.buyer?.name   ?? "",
          "Buyer GSTIN":   inv.buyer?.gstin  ?? "",
          "Seller GSTIN":  inv.seller?.gstin ?? "",
          "Supply Type":   isIntra ? "Intra-State" : "Inter-State",
          "Taxable Value": parseFloat(taxable.toFixed(2)),
          "CGST":          parseFloat(cgst.toFixed(2)),
          "SGST":          parseFloat(sgst.toFixed(2)),
          "IGST":          parseFloat(igst.toFixed(2)),
          "Total (₹)":     parseFloat(total.toFixed(2)),
          "Status":        inv.paidStatus === "paid" ? "Paid" : "Unpaid",
        };
      });

      // ── 2. Create worksheet + workbook ────────────────────────────────────
      const worksheet = XLSX.utils.json_to_sheet(rows);
      const workbook  = XLSX.utils.book_new();

      // ── 3. Column widths for readability ──────────────────────────────────
      worksheet["!cols"] = [
        { wch: 14 }, // Date
        { wch: 16 }, // Invoice No
        { wch: 24 }, // Buyer Name
        { wch: 20 }, // Buyer GSTIN
        { wch: 20 }, // Seller GSTIN
        { wch: 14 }, // Supply Type
        { wch: 16 }, // Taxable Value
        { wch: 10 }, // CGST
        { wch: 10 }, // SGST
        { wch: 10 }, // IGST
        { wch: 14 }, // Total
        { wch: 10 }, // Status
      ];

      // ── 4. Style header row bold ──────────────────────────────────────────
      const headerRange = XLSX.utils.decode_range(worksheet["!ref"]);
      for (let col = headerRange.s.c; col <= headerRange.e.c; col++) {
        const cellAddress = XLSX.utils.encode_cell({ r: 0, c: col });
        if (!worksheet[cellAddress]) continue;
        worksheet[cellAddress].s = {
          font:      { bold: true, color: { rgb: "FFFFFF" } },
          fill:      { fgColor: { rgb: "0F1923" } },
          alignment: { horizontal: "center" },
        };
      }

      XLSX.utils.book_append_sheet(workbook, worksheet, "Invoices");

      // ── 5. Trigger browser download ───────────────────────────────────────
      const fileName = `BillKaro_Invoices_${new Date().toISOString().slice(0, 10)}.xlsx`;
      XLSX.writeFile(workbook, fileName);

    } catch (err) {
      console.error("Export failed:", err);
      alert("Export failed. Please try again.");
    } finally {
      setExporting(false);
    }
  }, []);

  return { exportToExcel, exporting };
}
