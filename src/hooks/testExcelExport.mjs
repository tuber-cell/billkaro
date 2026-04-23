/**
 * Edge-case tests for useExcelExport logic
 * Run with: node src/hooks/testExcelExport.mjs
 */

// ── Minimal polyfill so XLSX + Node work without a browser ──────────────────
import * as XLSX from "xlsx";

function runExportLogic(invoiceArray) {
  if (!invoiceArray || invoiceArray.length === 0) {
    return { error: "No invoices to export." };
  }
  const rows = invoiceArray.map((inv) => {
    const taxable = inv.items?.reduce((sum, item) =>
      sum + (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0), 0) ?? 0;
    const gstTotal = inv.items?.reduce((sum, item) => {
      const it = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + it * ((parseFloat(item.gstRate) || 0) / 100);
    }, 0) ?? 0;
    const isIntra = inv.supplyType === "intra";
    const cgst = isIntra ? gstTotal / 2 : 0;
    const sgst = isIntra ? gstTotal / 2 : 0;
    const igst = !isIntra ? gstTotal : 0;
    const total = taxable + gstTotal;
    return {
      "Date": inv.invoiceDate ?? "",
      "Invoice No": inv.invoiceNum ?? "",
      "Buyer Name": inv.buyer?.name ?? "",
      "Taxable Value": parseFloat(taxable.toFixed(2)),
      "CGST": parseFloat(cgst.toFixed(2)),
      "SGST": parseFloat(sgst.toFixed(2)),
      "IGST": parseFloat(igst.toFixed(2)),
      "Total (₹)": parseFloat(total.toFixed(2)),
      "Status": inv.paidStatus === "paid" ? "Paid" : "Unpaid",
    };
  });
  return { rows };
}

let passed = 0;
let failed = 0;

function assert(label, condition, detail = "") {
  if (condition) {
    console.log(`  ✅ PASS — ${label}`);
    passed++;
  } else {
    console.error(`  ❌ FAIL — ${label}${detail ? " | " + detail : ""}`);
    failed++;
  }
}

// ── TEST 1: No Invoices ──────────────────────────────────────────────────────
console.log("\n📋 TEST 1: No Invoices");
{
  const result = runExportLogic([]);
  assert("returns error message", result.error === "No invoices to export.");
  assert("does not return rows", !result.rows);
}

// ── TEST 2: Zero Items (invoice with empty items array) ─────────────────────
console.log("\n📋 TEST 2: Zero Items");
{
  const invoice = {
    invoiceDate: "2026-04-22", invoiceNum: "INV-001",
    buyer: { name: "Test Buyer", gstin: "27AABCU9603R1ZX" },
    seller: { gstin: "29AABCU9603R1ZY" },
    supplyType: "intra", paidStatus: "unpaid",
    items: [],
  };
  const result = runExportLogic([invoice]);
  assert("generates 1 row", result.rows?.length === 1);
  assert("Taxable Value is 0", result.rows?.[0]["Taxable Value"] === 0);
  assert("CGST is 0",         result.rows?.[0]["CGST"] === 0);
  assert("SGST is 0",         result.rows?.[0]["SGST"] === 0);
  assert("IGST is 0",         result.rows?.[0]["IGST"] === 0);
  assert("Total is 0",        result.rows?.[0]["Total (₹)"] === 0);
  assert("Status is Unpaid",  result.rows?.[0]["Status"] === "Unpaid");
}

// ── TEST 3: Mixed Tax Types (intra + inter in same export) ──────────────────
console.log("\n📋 TEST 3: Mixed Tax Types (Intra-State + Inter-State)");
{
  const intraInv = {
    invoiceDate: "2026-04-22", invoiceNum: "INV-002",
    buyer: { name: "Buyer A" }, seller: { gstin: "27X" },
    supplyType: "intra", paidStatus: "paid",
    items: [{ qty: "10", rate: "1000", gstRate: "18" }],
    // 10*1000=10000 taxable, 18% GST=1800 → CGST=900, SGST=900, IGST=0, Total=11800
  };
  const interInv = {
    invoiceDate: "2026-04-22", invoiceNum: "INV-003",
    buyer: { name: "Buyer B" }, seller: { gstin: "29Y" },
    supplyType: "inter", paidStatus: "unpaid",
    items: [{ qty: "5", rate: "2000", gstRate: "12" }],
    // 5*2000=10000 taxable, 12% GST=1200 → CGST=0, SGST=0, IGST=1200, Total=11200
  };
  const result = runExportLogic([intraInv, interInv]);
  assert("generates 2 rows", result.rows?.length === 2);

  const r0 = result.rows[0]; // intra
  assert("Intra: CGST = 900",  r0["CGST"] === 900);
  assert("Intra: SGST = 900",  r0["SGST"] === 900);
  assert("Intra: IGST = 0",    r0["IGST"] === 0);
  assert("Intra: Total = 11800", r0["Total (₹)"] === 11800);
  assert("Intra: Status = Paid", r0["Status"] === "Paid");

  const r1 = result.rows[1]; // inter
  assert("Inter: CGST = 0",    r1["CGST"] === 0);
  assert("Inter: SGST = 0",    r1["SGST"] === 0);
  assert("Inter: IGST = 1200", r1["IGST"] === 1200);
  assert("Inter: Total = 11200", r1["Total (₹)"] === 11200);
  assert("Inter: Status = Unpaid", r1["Status"] === "Unpaid");
}

// ── Summary ──────────────────────────────────────────────────────────────────
console.log(`\n${"─".repeat(50)}`);
console.log(`Results: ${passed} passed, ${failed} failed`);
if (failed === 0) console.log("🎉 All edge cases passed!\n");
else { console.error("⚠️  Some tests failed.\n"); process.exit(1); }
