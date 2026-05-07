import React from "react";
import { fmt } from "./common/Constants";

// Common Styles & Components for Templates
const T_S = {
  page: { padding: "40px", minHeight: "29.7cm", width: "21cm", background: "#fff", boxSizing: "border-box", position: "relative", color: "#334155", fontFamily: "'Inter', sans-serif" },
  header: { display: "flex", justifyContent: "space-between", marginBottom: "30px" },
  logoBox: { maxWidth: "180px" },
  logo: { maxWidth: "100%", height: "auto", maxHeight: "60px" },
  title: { fontSize: "28px", fontWeight: 800, textTransform: "uppercase", letterSpacing: "1px" },
  meta: { textAlign: "right", fontSize: "13px" },
  grid: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: "40px", marginBottom: "40px" },
  label: { fontSize: "10px", fontWeight: 700, color: "#64748b", textTransform: "uppercase", marginBottom: "4px", display: "block" },
  address: { fontSize: "13px", lineHeight: "1.5", whiteSpace: "pre-line" },
  table: { width: "100%", borderCollapse: "collapse", marginBottom: "30px" },
  th: { padding: "12px", fontSize: "12px", fontWeight: 700, textAlign: "left", textTransform: "uppercase", borderBottom: "2px solid #e2e8f0" },
  td: { padding: "12px", fontSize: "13px", borderBottom: "1px solid #f1f5f9" },
  summary: { marginLeft: "auto", width: "300px" },
  summaryRow: { display: "flex", justifyContent: "space-between", padding: "8px 0", fontSize: "14px" },
  totalRow: { display: "flex", justifyContent: "space-between", padding: "12px 0", borderTop: "2px solid #334155", marginTop: "8px", fontWeight: 800, fontSize: "18px" },
  footer: { marginTop: "50px", borderTop: "1px solid #e2e8f0", paddingTop: "20px", fontSize: "12px", color: "#94a3b8" }
};

// 1. MODERN CORPORATE (Blue/Sleek)
export const ModernCorporate = ({ data }) => (
  <div style={{ ...T_S.page, borderTop: "8px solid #2563eb" }}>
    <div style={T_S.header}>
      <div style={T_S.logoBox}>
        {data.sellerLogo && <img src={data.sellerLogo} style={T_S.logo} alt="logo" />}
        <h2 style={{ ...T_S.title, color: "#2563eb", marginTop: 10 }}>{data.docType}</h2>
      </div>
      <div style={T_S.meta}>
        <div style={T_S.label}>Invoice #</div>
        <div style={{ fontSize: 18, fontWeight: 700 }}>{data.invoicePrefix}{data.invoiceNum}</div>
        <div style={{ marginTop: 10 }}>
          <span style={T_S.label}>Date:</span> {data.invoiceDate}
          {data.dueDate && <div style={{ marginTop: 4 }}><span style={T_S.label}>Due:</span> {data.dueDate}</div>}
        </div>
      </div>
    </div>

    <div style={T_S.grid}>
      <div>
        <span style={T_S.label}>From:</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{data.seller.name}</div>
        <div style={T_S.address}>{data.seller.address}</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>GSTIN: {data.seller.gstin}</div>
      </div>
      <div>
        <span style={T_S.label}>To:</span>
        <div style={{ fontSize: 16, fontWeight: 700, color: "#1e293b", marginBottom: 4 }}>{data.buyer.name}</div>
        <div style={T_S.address}>{data.buyer.address}</div>
        <div style={{ marginTop: 8, fontSize: 12 }}>GSTIN: {data.buyer.gstin}</div>
      </div>
    </div>

    <table style={T_S.table}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, color: "#2563eb" }}>Description</th>
          <th style={{ ...T_S.th, color: "#2563eb", textAlign: "right" }}>Qty</th>
          <th style={{ ...T_S.th, color: "#2563eb", textAlign: "right" }}>Rate</th>
          <th style={{ ...T_S.th, color: "#2563eb", textAlign: "right" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={T_S.td}>
              <div style={{ fontWeight: 600 }}>{item.desc}</div>
              {item.hsn && <div style={{ fontSize: 10, color: "#94a3b8" }}>HSN: {item.hsn}</div>}
            </td>
            <td style={{ ...T_S.td, textAlign: "right" }}>{item.qty}</td>
            <td style={{ ...T_S.td, textAlign: "right" }}>{fmt(item.rate)}</td>
            <td style={{ ...T_S.td, textAlign: "right", fontWeight: 600 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={T_S.summary}>
      <div style={T_S.summaryRow}><span>Subtotal</span><span>{fmt(data.totals.subtotal)}</span></div>
      <div style={T_S.summaryRow}><span>Tax (GST)</span><span>{fmt(data.totals.tax)}</span></div>
      <div style={{ ...T_S.totalRow, color: "#2563eb", borderTopColor: "#2563eb" }}><span>Total Amount</span><span>{fmt(data.totals.total)}</span></div>
    </div>

    <div style={T_S.footer}>
      <div style={{ fontWeight: 700, color: "#475569", marginBottom: 4 }}>Notes:</div>
      <div>{data.notes || "Thank you for your business!"}</div>
    </div>
  </div>
);

// 2. MINIMALIST (Clean/White)
export const Minimalist = ({ data }) => (
  <div style={{ ...T_S.page, padding: "60px", fontFamily: "'Geist', 'Inter', sans-serif" }}>
    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-start", marginBottom: 80 }}>
      <div>
        <h1 style={{ fontSize: 42, fontWeight: 300, letterSpacing: "-1px", margin: 0 }}>{data.docType}</h1>
        <div style={{ color: "#94a3b8", marginTop: 8 }}>{data.invoicePrefix}{data.invoiceNum} / {data.invoiceDate}</div>
      </div>
      {data.sellerLogo && <img src={data.sellerLogo} style={{ height: 40, filter: "grayscale(1)" }} alt="logo" />}
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1.5fr 1fr", gap: 100, marginBottom: 80 }}>
      <div>
        <div style={{ ...T_S.label, borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 16 }}>Billed To</div>
        <div style={{ fontSize: 18, fontWeight: 600, marginBottom: 8 }}>{data.buyer.name}</div>
        <div style={{ ...T_S.address, color: "#64748b" }}>{data.buyer.address}</div>
      </div>
      <div>
        <div style={{ ...T_S.label, borderBottom: "1px solid #e2e8f0", paddingBottom: 8, marginBottom: 16 }}>From</div>
        <div style={{ fontSize: 14, fontWeight: 600, marginBottom: 4 }}>{data.seller.name}</div>
        <div style={{ ...T_S.address, color: "#64748b", fontSize: 12 }}>{data.seller.address}</div>
      </div>
    </div>

    <table style={T_S.table}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, borderBottomWidth: 1, padding: "16px 0" }}>Item</th>
          <th style={{ ...T_S.th, borderBottomWidth: 1, padding: "16px 0", textAlign: "right" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={{ ...T_S.td, borderBottom: "1px solid #f8fafc", padding: "20px 0" }}>
              <div style={{ fontWeight: 500 }}>{item.desc}</div>
              <div style={{ fontSize: 11, color: "#94a3b8", marginTop: 4 }}>{item.qty} x {fmt(item.rate)}</div>
            </td>
            <td style={{ ...T_S.td, borderBottom: "1px solid #f8fafc", padding: "20px 0", textAlign: "right", fontWeight: 500 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ ...T_S.summary, width: "100%", marginTop: 40 }}>
      <div style={{ ...T_S.summaryRow, color: "#64748b" }}><span>Subtotal</span><span>{fmt(data.totals.subtotal)}</span></div>
      <div style={{ ...T_S.summaryRow, color: "#64748b" }}><span>Total Tax</span><span>{fmt(data.totals.tax)}</span></div>
      <div style={{ ...T_S.totalRow, borderTop: "1px solid #e2e8f0", paddingTop: 20, fontSize: 24 }}><span>Grand Total</span><span>{fmt(data.totals.total)}</span></div>
    </div>
  </div>
);

// 3. MIDNIGHT DARK (Black/Neon)
export const MidnightDark = ({ data }) => (
  <div style={{ ...T_S.page, background: "#0f172a", color: "#f8fafc" }}>
    <div style={{ ...T_S.header, marginBottom: 60 }}>
      <div>
        <div style={{ color: "#38bdf8", fontWeight: 800, fontSize: 12, letterSpacing: 3, marginBottom: 12 }}>OFFICIAL {data.docType.toUpperCase()}</div>
        <div style={{ fontSize: 32, fontWeight: 900 }}>{data.invoicePrefix}{data.invoiceNum}</div>
      </div>
      <div style={{ textAlign: "right" }}>
        {data.sellerLogo ? <img src={data.sellerLogo} style={{ height: 50 }} alt="logo" /> : <div style={{ fontSize: 24, fontWeight: 900, color: "#38bdf8" }}>⬡</div>}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 30, marginBottom: 60, background: "rgba(255,255,255,0.03)", padding: 30, borderRadius: 12, border: "1px solid rgba(255,255,255,0.05)" }}>
      <div>
        <span style={{ ...T_S.label, color: "#38bdf8" }}>Issued By</span>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{data.seller.name}</div>
        <div style={{ ...T_S.address, color: "#94a3b8", marginTop: 4 }}>{data.seller.address}</div>
      </div>
      <div>
        <span style={{ ...T_S.label, color: "#38bdf8" }}>Billed To</span>
        <div style={{ fontSize: 16, fontWeight: 700, marginTop: 8 }}>{data.buyer.name}</div>
        <div style={{ ...T_S.address, color: "#94a3b8", marginTop: 4 }}>{data.buyer.address}</div>
      </div>
    </div>

    <div style={{ background: "rgba(255,255,255,0.02)", borderRadius: 12, overflow: "hidden", border: "1px solid rgba(255,255,255,0.05)" }}>
      <table style={{ ...T_S.table, marginBottom: 0 }}>
        <thead style={{ background: "rgba(255,255,255,0.05)" }}>
          <tr>
            <th style={{ ...T_S.th, borderBottom: "none", color: "#38bdf8" }}>Description</th>
            <th style={{ ...T_S.th, borderBottom: "none", color: "#38bdf8", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...T_S.td, borderBottom: "1px solid rgba(255,255,255,0.05)", padding: 20 }}>
                <div style={{ fontWeight: 600 }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: "#64748b", marginTop: 4 }}>{item.qty} Unit(s) at {fmt(item.rate)}</div>
              </td>
              <td style={{ ...T_S.td, borderBottom: "1px solid rgba(255,255,255,0.05)", textAlign: "right", fontWeight: 700, color: "#38bdf8" }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ ...T_S.summary, marginTop: 40, background: "#38bdf8", color: "#0f172a", padding: 30, borderRadius: 12, width: 350 }}>
      <div style={{ ...T_S.summaryRow, color: "rgba(15,23,42,0.7)" }}><span>Subtotal</span><span style={{ fontWeight: 700 }}>{fmt(data.totals.subtotal)}</span></div>
      <div style={{ ...T_S.summaryRow, color: "rgba(15,23,42,0.7)" }}><span>Taxes</span><span style={{ fontWeight: 700 }}>{fmt(data.totals.tax)}</span></div>
      <div style={{ display: "flex", justifyContent: "space-between", fontSize: 24, fontWeight: 900, marginTop: 15, borderTop: "1px solid rgba(15,23,42,0.1)", paddingTop: 15 }}>
        <span>TOTAL</span><span>{fmt(data.totals.total)}</span>
      </div>
    </div>
  </div>
);

// 4. CLASSIC VINTAGE (Cream/Serif)
export const ClassicVintage = ({ data }) => (
  <div style={{ ...T_S.page, background: "#fdfcf0", color: "#3e2723", border: "20px solid #fdfcf0", outline: "1px solid #d7ccc8", outlineOffset: "-10px", fontFamily: "'Playfair Display', serif" }}>
    <div style={{ textAlign: "center", marginBottom: 50, borderBottom: "double 4px #d7ccc8", paddingBottom: 30 }}>
      <div style={{ fontSize: 12, letterSpacing: 5, color: "#8d6e63", marginBottom: 15 }}>ESTABLISHED INVOICING</div>
      <h1 style={{ fontSize: 48, fontWeight: 400, margin: 0, fontStyle: "italic" }}>{data.docType}</h1>
      <div style={{ marginTop: 10, fontSize: 14 }}>№ {data.invoicePrefix}{data.invoiceNum} — {data.invoiceDate}</div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 60, marginBottom: 50 }}>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...T_S.label, color: "#8d6e63" }}>The Vendor</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{data.seller.name}</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>{data.seller.address}</div>
      </div>
      <div style={{ textAlign: "center" }}>
        <div style={{ ...T_S.label, color: "#8d6e63" }}>The Client</div>
        <div style={{ fontSize: 18, fontWeight: 600 }}>{data.buyer.name}</div>
        <div style={{ fontSize: 13, marginTop: 8 }}>{data.buyer.address}</div>
      </div>
    </div>

    <table style={{ ...T_S.table, borderTop: "1px solid #d7ccc8", borderBottom: "1px solid #d7ccc8" }}>
      <thead>
        <tr>
          <th style={{ ...T_S.th, background: "rgba(215,204,200,0.2)", borderBottom: "1px solid #d7ccc8", fontStyle: "italic" }}>Particulars</th>
          <th style={{ ...T_S.th, background: "rgba(215,204,200,0.2)", borderBottom: "1px solid #d7ccc8", textAlign: "right" }}>Amount</th>
        </tr>
      </thead>
      <tbody>
        {data.items.map((item, i) => (
          <tr key={i}>
            <td style={{ ...T_S.td, borderBottom: "1px dotted #d7ccc8", padding: "15px 12px" }}>
              <span style={{ fontWeight: 600 }}>{item.desc}</span>
              <div style={{ fontSize: 12, color: "#8d6e63" }}>{item.qty} unit(s) @ {fmt(item.rate)}</div>
            </td>
            <td style={{ ...T_S.td, borderBottom: "1px dotted #d7ccc8", textAlign: "right", fontWeight: 600 }}>{fmt(item.qty * item.rate)}</td>
          </tr>
        ))}
      </tbody>
    </table>

    <div style={{ ...T_S.summary, width: "100%", marginTop: 30 }}>
      <div style={{ display: "flex", justifyContent: "flex-end", gap: 40, fontSize: 14 }}>
        <div style={{ textAlign: "right", color: "#8d6e63" }}>
          <div>Sub-Total</div>
          <div>Sales Tax</div>
          <div style={{ fontSize: 24, color: "#3e2723", marginTop: 10, fontWeight: 600 }}>Total Due</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div>{fmt(data.totals.subtotal)}</div>
          <div>{fmt(data.totals.tax)}</div>
          <div style={{ fontSize: 24, marginTop: 10, fontWeight: 600 }}>{fmt(data.totals.total)}</div>
        </div>
      </div>
    </div>
  </div>
);

// 5. CREATIVE VIBRANT (Pink/Purple)
export const CreativeVibrant = ({ data }) => (
  <div style={{ ...T_S.page, overflow: "hidden", borderRadius: 24 }}>
    <div style={{ position: "absolute", top: -100, right: -100, width: 300, height: 300, background: "linear-gradient(135deg, #ec4899, #8b5cf6)", borderRadius: "50%", opacity: 0.1 }}></div>
    <div style={{ position: "absolute", bottom: -50, left: -50, width: 200, height: 200, background: "linear-gradient(135deg, #3b82f6, #2dd4bf)", borderRadius: "50%", opacity: 0.1 }}></div>

    <div style={{ ...T_S.header, alignItems: "center", marginBottom: 60 }}>
      <div style={{ background: "linear-gradient(135deg, #ec4899, #8b5cf6)", padding: "12px 24px", borderRadius: 12, color: "#fff", fontWeight: 900, fontSize: 24 }}>{data.docType.slice(0, 3).toUpperCase()}</div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>#{data.invoicePrefix}{data.invoiceNum}</div>
        <div style={{ fontSize: 14, fontWeight: 700 }}>{data.invoiceDate}</div>
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 40, marginBottom: 50 }}>
      <div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 4, height: 24, background: "#ec4899", borderRadius: 2 }}></div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>From</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{data.seller.name}</div>
        <div style={{ ...T_S.address, color: "#64748b" }}>{data.seller.address}</div>
      </div>
      <div>
        <div style={{ display: "flex", gap: 12, alignItems: "center", marginBottom: 12 }}>
          <div style={{ width: 4, height: 24, background: "#8b5cf6", borderRadius: 2 }}></div>
          <span style={{ fontSize: 14, fontWeight: 800, color: "#1e293b" }}>To</span>
        </div>
        <div style={{ fontSize: 18, fontWeight: 800, marginBottom: 4 }}>{data.buyer.name}</div>
        <div style={{ ...T_S.address, color: "#64748b" }}>{data.buyer.address}</div>
      </div>
    </div>

    <div style={{ background: "#f8fafc", borderRadius: 20, padding: 30 }}>
      <table style={{ ...T_S.table, marginBottom: 0 }}>
        <thead>
          <tr>
            <th style={{ ...T_S.th, borderBottomColor: "#e2e8f0" }}>Service / Product</th>
            <th style={{ ...T_S.th, borderBottomColor: "#e2e8f0", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...T_S.td, borderBottomColor: "#f1f5f9" }}>
                <div style={{ fontWeight: 700 }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: "#94a3b8" }}>{item.qty} × {fmt(item.rate)}</div>
              </td>
              <td style={{ ...T_S.td, borderBottomColor: "#f1f5f9", textAlign: "right", fontWeight: 800 }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ display: "flex", justifyContent: "space-between", alignItems: "flex-end", marginTop: 40 }}>
      <div style={{ background: "#fff", border: "2px dashed #e2e8f0", padding: "15px 25px", borderRadius: 16, fontSize: 12, color: "#64748b", maxWidth: 300 }}>
        {data.notes || "We love working with you! Hope to see you again soon."}
      </div>
      <div style={{ textAlign: "right" }}>
        <div style={{ fontSize: 14, color: "#94a3b8" }}>Total Tax: {fmt(data.totals.tax)}</div>
        <div style={{ fontSize: 36, fontWeight: 900, background: "linear-gradient(135deg, #ec4899, #8b5cf6)", WebkitBackgroundClip: "text", WebkitTextFillColor: "transparent" }}>{fmt(data.totals.total)}</div>
      </div>
    </div>
  </div>
);

// 6. LUXURY GOLD (Deep Navy/Gold)
export const LuxuryGold = ({ data }) => (
  <div style={{ ...T_S.page, background: "#0c121e", color: "#fff", border: "1px solid #d4af37", padding: 0 }}>
    <div style={{ padding: 40, borderBottom: "1px solid #d4af37", background: "linear-gradient(180deg, #162032 0%, #0c121e 100%)" }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <h1 style={{ fontSize: 11, letterSpacing: 6, color: "#d4af37", fontWeight: 400, margin: "0 0 10px 0" }}>OFFICIAL DOCUMENT</h1>
          <div style={{ fontSize: 32, fontWeight: 300, color: "#fff", fontFamily: "'Playfair Display', serif" }}>{data.docType}</div>
        </div>
        {data.sellerLogo && <img src={data.sellerLogo} style={{ height: 60, border: "1px solid #d4af37", padding: 5 }} alt="logo" />}
      </div>
    </div>

    <div style={{ display: "grid", gridTemplateColumns: "1.2fr 1fr", gap: 0 }}>
      <div style={{ padding: 40, borderRight: "1px solid rgba(212,175,55,0.2)" }}>
        <div style={{ ...T_S.label, color: "#d4af37", marginBottom: 20 }}>Prepared For</div>
        <div style={{ fontSize: 24, fontWeight: 400, marginBottom: 10, fontFamily: "'Playfair Display', serif" }}>{data.buyer.name}</div>
        <div style={{ fontSize: 13, color: "rgba(255,255,255,0.6)", lineHeight: 1.6 }}>{data.buyer.address}</div>
        {data.buyer.gstin && <div style={{ fontSize: 11, color: "#d4af37", marginTop: 10 }}>GST: {data.buyer.gstin}</div>}
      </div>
      <div style={{ padding: 40, background: "rgba(255,255,255,0.02)" }}>
        <div style={{ ...T_S.label, color: "#d4af37", marginBottom: 20 }}>Invoice Details</div>
        <div style={{ marginBottom: 15 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>REFERENCE</div>
          <div style={{ fontSize: 14 }}>{data.invoicePrefix}{data.invoiceNum}</div>
        </div>
        <div style={{ marginBottom: 15 }}>
          <div style={{ fontSize: 10, color: "rgba(255,255,255,0.4)" }}>DATE</div>
          <div style={{ fontSize: 14 }}>{data.invoiceDate}</div>
        </div>
      </div>
    </div>

    <div style={{ padding: "0 40px" }}>
      <table style={{ ...T_S.table, marginTop: 40 }}>
        <thead>
          <tr>
            <th style={{ ...T_S.th, color: "#d4af37", borderBottomColor: "rgba(212,175,55,0.3)" }}>Item Description</th>
            <th style={{ ...T_S.th, color: "#d4af37", borderBottomColor: "rgba(212,175,55,0.3)", textAlign: "right" }}>Total</th>
          </tr>
        </thead>
        <tbody>
          {data.items.map((item, i) => (
            <tr key={i}>
              <td style={{ ...T_S.td, borderBottomColor: "rgba(255,255,255,0.05)", padding: "20px 10px" }}>
                <div style={{ fontSize: 16, fontWeight: 300 }}>{item.desc}</div>
                <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)", marginTop: 4 }}>{item.qty} units × {fmt(item.rate)}</div>
              </td>
              <td style={{ ...T_S.td, borderBottomColor: "rgba(255,255,255,0.05)", textAlign: "right", fontSize: 16 }}>{fmt(item.qty * item.rate)}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>

    <div style={{ background: "rgba(212,175,55,0.05)", borderTop: "1px solid #d4af37", marginTop: 40, padding: 40 }}>
      <div style={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
        <div>
          <div style={{ fontSize: 11, color: "#d4af37" }}>FROM</div>
          <div style={{ fontSize: 14, fontWeight: 700 }}>{data.seller.name}</div>
        </div>
        <div style={{ textAlign: "right" }}>
          <div style={{ fontSize: 11, color: "rgba(255,255,255,0.4)" }}>GRAND TOTAL</div>
          <div style={{ fontSize: 32, fontWeight: 300, color: "#d4af37", fontFamily: "'Playfair Display', serif" }}>{fmt(data.totals.total)}</div>
        </div>
      </div>
    </div>
  </div>
);

// Main Component that returns the selected template
const PremiumTemplates = ({ templateId, ...props }) => {
  const templates = {
    modern: ModernCorporate,
    minimal: Minimalist,
    midnight: MidnightDark,
    classic: ClassicVintage,
    creative: CreativeVibrant,
    luxury: LuxuryGold,
  };

  const Selected = templates[templateId] || LuxuryGold;
  return <Selected data={props} />;
};

export default PremiumTemplates;
