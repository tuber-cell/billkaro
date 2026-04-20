import { useState, useRef } from "react";

const font = document.createElement("link");
font.rel = "stylesheet";
font.href = "https://fonts.googleapis.com/css2?family=Playfair+Display:wght@400;600;700&family=DM+Sans:wght@300;400;500;600&display=swap";
document.head.appendChild(font);

const GST_RATES = [0, 5, 12, 18, 28];

const STATES = [
  "Andhra Pradesh","Arunachal Pradesh","Assam","Bihar","Chhattisgarh",
  "Goa","Gujarat","Haryana","Himachal Pradesh","Jharkhand","Karnataka",
  "Kerala","Madhya Pradesh","Maharashtra","Manipur","Meghalaya","Mizoram",
  "Nagaland","Odisha","Punjab","Rajasthan","Sikkim","Tamil Nadu","Telangana",
  "Tripura","Uttar Pradesh","Uttarakhand","West Bengal","Delhi","Jammu & Kashmir"
];

const fmt = (n) => "₹" + Number(n).toLocaleString("en-IN", { minimumFractionDigits: 2, maximumFractionDigits: 2 });
const today = () => new Date().toISOString().slice(0, 10);
const invoiceNo = () => "INV-" + Date.now().toString().slice(-6);

const emptyItem = () => ({ id: Date.now(), desc: "", qty: 1, rate: "", gstRate: 18 });

export default function App() {
  const [step, setStep] = useState("form"); // form | preview
  const [invoiceNum] = useState(invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState("");

  const [seller, setSeller] = useState({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });
  const [buyer, setBuyer] = useState({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });
  const [items, setItems] = useState([emptyItem()]);
  const [notes, setNotes] = useState("Thank you for your business!");
  const [supplyType, setSupplyType] = useState("intra"); // intra | inter
  const [errors, setErrors] = useState({});
  const previewRef = useRef();

  // ── Calculations ────────────────────────────────────────────────────────────
  const calcItem = (item) => {
    const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
    const gstAmt = taxable * (item.gstRate / 100);
    return { taxable, gstAmt, total: taxable + gstAmt };
  };

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    acc.taxable += c.taxable;
    acc.gst += c.gstAmt;
    acc.total += c.total;
    return acc;
  }, { taxable: 0, gst: 0, total: 0 });

  // ── Item helpers ─────────────────────────────────────────────────────────────
  const updateItem = (id, field, val) =>
    setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  // ── Validation ───────────────────────────────────────────────────────────────
  const validate = () => {
    const e = {};
    if (!seller.name) e.sellerName = true;
    if (!seller.gstin || !/^[0-9]{2}[A-Z]{5}[0-9]{4}[A-Z]{1}[1-9A-Z]{1}Z[0-9A-Z]{1}$/.test(seller.gstin)) e.sellerGstin = true;
    if (!buyer.name) e.buyerName = true;
    if (items.some(i => !i.desc || !i.rate)) e.items = true;
    setErrors(e);
    return Object.keys(e).length === 0;
  };

  const handlePreview = () => { if (validate()) setStep("preview"); };

  // ── Print ────────────────────────────────────────────────────────────────────
  const handlePrint = () => window.print();

  // ── Styles ───────────────────────────────────────────────────────────────────
  const S = {
    page: {
      minHeight: "100vh",
      background: "linear-gradient(135deg, #0f1923 0%, #162032 50%, #0f1923 100%)",
      fontFamily: "'DM Sans', sans-serif",
      padding: "0 0 60px",
    },
    header: {
      background: "linear-gradient(90deg, #0f1923, #1a2d45, #0f1923)",
      borderBottom: "1px solid rgba(212,175,55,0.3)",
      padding: "20px 40px",
      display: "flex",
      alignItems: "center",
      justifyContent: "space-between",
    },
    logo: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 22,
      color: "#d4af37",
      letterSpacing: "0.05em",
    },
    badge: {
      background: "rgba(212,175,55,0.1)",
      border: "1px solid rgba(212,175,55,0.3)",
      color: "#d4af37",
      padding: "4px 12px",
      borderRadius: 20,
      fontSize: 11,
      letterSpacing: "0.1em",
    },
    container: { maxWidth: 900, margin: "0 auto", padding: "40px 20px" },
    card: {
      background: "rgba(255,255,255,0.04)",
      border: "1px solid rgba(255,255,255,0.08)",
      borderRadius: 12,
      padding: "28px 32px",
      marginBottom: 20,
    },
    sectionTitle: {
      fontFamily: "'Playfair Display', serif",
      fontSize: 16,
      color: "#d4af37",
      marginBottom: 20,
      paddingBottom: 10,
      borderBottom: "1px solid rgba(212,175,55,0.2)",
    },
    grid2: { display: "grid", gridTemplateColumns: "1fr 1fr", gap: 16 },
    grid3: { display: "grid", gridTemplateColumns: "1fr 1fr 1fr", gap: 16 },
    label: { display: "block", fontSize: 11, color: "#8899aa", marginBottom: 6, letterSpacing: "0.08em", textTransform: "uppercase" },
    input: {
      width: "100%", background: "rgba(255,255,255,0.06)",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "10px 14px",
      color: "#e8edf2", fontSize: 14, outline: "none",
      fontFamily: "'DM Sans', sans-serif",
      transition: "border 0.2s",
      boxSizing: "border-box",
    },
    inputErr: { borderColor: "#ef4444" },
    select: {
      width: "100%", background: "#1a2d45",
      border: "1px solid rgba(255,255,255,0.1)",
      borderRadius: 8, padding: "10px 14px",
      color: "#e8edf2", fontSize: 14, outline: "none",
      fontFamily: "'DM Sans', sans-serif",
      boxSizing: "border-box",
    },
    btnPrimary: {
      background: "linear-gradient(135deg, #d4af37, #f0d060)",
      color: "#0f1923", border: "none",
      padding: "14px 36px", borderRadius: 8,
      fontSize: 15, fontWeight: 700,
      cursor: "pointer", letterSpacing: "0.05em",
      fontFamily: "'DM Sans', sans-serif",
      transition: "opacity 0.2s",
    },
    btnSecondary: {
      background: "transparent",
      color: "#d4af37",
      border: "1px solid rgba(212,175,55,0.4)",
      padding: "10px 24px", borderRadius: 8,
      fontSize: 14, fontWeight: 500,
      cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
    btnDanger: {
      background: "rgba(239,68,68,0.1)",
      color: "#ef4444", border: "1px solid rgba(239,68,68,0.2)",
      padding: "6px 12px", borderRadius: 6,
      fontSize: 12, cursor: "pointer",
      fontFamily: "'DM Sans', sans-serif",
    },
    btnAdd: {
      background: "rgba(212,175,55,0.08)",
      color: "#d4af37", border: "1px dashed rgba(212,175,55,0.3)",
      padding: "10px 20px", borderRadius: 8,
      fontSize: 13, cursor: "pointer", width: "100%",
      fontFamily: "'DM Sans', sans-serif",
      marginTop: 12,
    },
    errText: { color: "#ef4444", fontSize: 11, marginTop: 4 },
  };

  // ── FORM ─────────────────────────────────────────────────────────────────────
  if (step === "form") return (
    <div style={S.page}>
      <style>{`
        @media print { body { display: none; } }
        input:focus, select:focus { border-color: rgba(212,175,55,0.6) !important; }
        input::placeholder { color: #445566; }
        * { box-sizing: border-box; }
        ::-webkit-scrollbar { width: 4px; }
        ::-webkit-scrollbar-track { background: #0f1923; }
        ::-webkit-scrollbar-thumb { background: #2a3f55; border-radius: 2px; }
      `}</style>

      <div style={S.header}>
        <div style={S.logo}>⬡ BillKaro</div>
        <div style={S.badge}>GST INVOICE GENERATOR</div>
        <div style={{ color: "#445566", fontSize: 12 }}>Invoice #{invoiceNum}</div>
      </div>

      <div style={S.container}>

        {/* Supply Type */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Invoice Details</div>
          <div style={S.grid3}>
            <div>
              <label style={S.label}>Invoice Number</label>
              <input style={{ ...S.input, color: "#d4af37" }} value={invoiceNum} readOnly />
            </div>
            <div>
              <label style={S.label}>Invoice Date</label>
              <input type="date" style={S.input} value={invoiceDate} onChange={e => setInvoiceDate(e.target.value)} />
            </div>
            <div>
              <label style={S.label}>Due Date (Optional)</label>
              <input type="date" style={S.input} value={dueDate} onChange={e => setDueDate(e.target.value)} />
            </div>
          </div>
          <div style={{ marginTop: 16 }}>
            <label style={S.label}>Supply Type</label>
            <div style={{ display: "flex", gap: 12, marginTop: 4 }}>
              {[["intra", "Intra-State (CGST + SGST)"], ["inter", "Inter-State (IGST)"]].map(([val, label]) => (
                <label key={val} style={{
                  display: "flex", alignItems: "center", gap: 8,
                  cursor: "pointer", color: supplyType === val ? "#d4af37" : "#8899aa",
                  fontSize: 13, padding: "8px 16px",
                  background: supplyType === val ? "rgba(212,175,55,0.1)" : "transparent",
                  border: `1px solid ${supplyType === val ? "rgba(212,175,55,0.4)" : "rgba(255,255,255,0.08)"}`,
                  borderRadius: 8, transition: "all 0.2s",
                }}>
                  <input type="radio" value={val} checked={supplyType === val}
                    onChange={() => setSupplyType(val)} style={{ accentColor: "#d4af37" }} />
                  {label}
                </label>
              ))}
            </div>
          </div>
        </div>

        {/* Seller & Buyer */}
        <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", gap: 20, marginBottom: 20 }}>
          {[["Seller Details (Your Business)", seller, setSeller, true],
            ["Buyer Details (Client)", buyer, setBuyer, false]].map(([title, data, setData, isSeller]) => (
            <div key={title} style={S.card}>
              <div style={S.sectionTitle}>{title}</div>
              {[
                ["Business Name *", "name", "text", isSeller ? errors.sellerName : errors.buyerName],
                ["GSTIN *", "gstin", "text", isSeller ? errors.sellerGstin : false],
                ["Address", "address", "text", false],
                ["City", "city", "text", false],
                ["PIN Code", "pin", "text", false],
                ["Email", "email", "email", false],
                ["Phone", "phone", "tel", false],
              ].map(([label, field, type, hasErr]) => (
                <div key={field} style={{ marginBottom: 14 }}>
                  <label style={S.label}>{label}</label>
                  {field === "state" ? (
                    <select style={S.select} value={data.state} onChange={e => setData({ ...data, state: e.target.value })}>
                      {STATES.map(s => <option key={s}>{s}</option>)}
                    </select>
                  ) : (
                    <input type={type} style={{ ...S.input, ...(hasErr ? S.inputErr : {}) }}
                      placeholder={field === "gstin" ? "22AAAAA0000A1Z5" : ""}
                      value={data[field]} onChange={e => setData({ ...data, [field]: e.target.value })} />
                  )}
                  {hasErr && <div style={S.errText}>
                    {field === "gstin" ? "Enter valid 15-digit GSTIN" : "Required"}
                  </div>}
                </div>
              ))}
              <div style={{ marginBottom: 14 }}>
                <label style={S.label}>State</label>
                <select style={S.select} value={data.state} onChange={e => setData({ ...data, state: e.target.value })}>
                  {STATES.map(s => <option key={s}>{s}</option>)}
                </select>
              </div>
            </div>
          ))}
        </div>

        {/* Items */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Items / Services</div>
          {errors.items && <div style={{ ...S.errText, marginBottom: 12 }}>Please fill all item descriptions and rates</div>}

          {/* Header */}
          <div style={{
            display: "grid", gridTemplateColumns: "3fr 80px 120px 100px 110px 40px",
            gap: 10, marginBottom: 8,
          }}>
            {["Description", "Qty", "Rate (₹)", "GST %", "Amount", ""].map(h => (
              <div key={h} style={{ ...S.label, marginBottom: 0 }}>{h}</div>
            ))}
          </div>

          {items.map((item, idx) => {
            const c = calcItem(item);
            return (
              <div key={item.id} style={{
                display: "grid", gridTemplateColumns: "3fr 80px 120px 100px 110px 40px",
                gap: 10, marginBottom: 10, alignItems: "center",
              }}>
                <input style={S.input} placeholder={`Item ${idx + 1}`}
                  value={item.desc} onChange={e => updateItem(item.id, "desc", e.target.value)} />
                <input type="number" style={S.input} min="1" value={item.qty}
                  onChange={e => updateItem(item.id, "qty", e.target.value)} />
                <input type="number" style={S.input} placeholder="0.00"
                  value={item.rate} onChange={e => updateItem(item.id, "rate", e.target.value)} />
                <select style={S.select} value={item.gstRate}
                  onChange={e => updateItem(item.id, "gstRate", Number(e.target.value))}>
                  {GST_RATES.map(r => <option key={r} value={r}>{r}%</option>)}
                </select>
                <div style={{ color: "#d4af37", fontSize: 14, fontWeight: 600, textAlign: "right" }}>
                  {fmt(c.total)}
                </div>
                <button style={S.btnDanger} onClick={() => removeItem(item.id)}>✕</button>
              </div>
            );
          })}

          <button style={S.btnAdd} onClick={addItem}>+ Add Item</button>

          {/* Totals */}
          <div style={{
            marginTop: 24, borderTop: "1px solid rgba(255,255,255,0.08)",
            paddingTop: 20, display: "flex", justifyContent: "flex-end",
          }}>
            <div style={{ width: 280 }}>
              {[
                ["Taxable Amount", fmt(totals.taxable)],
                ...(supplyType === "intra" ? [
                  ["CGST", fmt(totals.gst / 2)],
                  ["SGST", fmt(totals.gst / 2)],
                ] : [["IGST", fmt(totals.gst)]]),
              ].map(([label, val]) => (
                <div key={label} style={{ display: "flex", justifyContent: "space-between", marginBottom: 8 }}>
                  <span style={{ color: "#8899aa", fontSize: 13 }}>{label}</span>
                  <span style={{ color: "#e8edf2", fontSize: 13 }}>{val}</span>
                </div>
              ))}
              <div style={{
                display: "flex", justifyContent: "space-between",
                borderTop: "1px solid rgba(212,175,55,0.3)",
                paddingTop: 12, marginTop: 8,
              }}>
                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 16 }}>Total</span>
                <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 20 }}>{fmt(totals.total)}</span>
              </div>
            </div>
          </div>
        </div>

        {/* Notes */}
        <div style={S.card}>
          <div style={S.sectionTitle}>Notes</div>
          <textarea style={{ ...S.input, minHeight: 80, resize: "vertical" }}
            value={notes} onChange={e => setNotes(e.target.value)} />
        </div>

        {/* Actions */}
        <div style={{ display: "flex", gap: 12, justifyContent: "flex-end" }}>
          <button style={S.btnPrimary} onClick={handlePreview}>
            Preview & Download →
          </button>
        </div>
      </div>
    </div>
  );

  // ── PREVIEW / PRINT ──────────────────────────────────────────────────────────
  return (
    <div>
      <style>{`
        @media screen {
          .print-actions {
            position: fixed; top: 0; left: 0; right: 0; z-index: 100;
            background: #0f1923; border-bottom: 1px solid rgba(212,175,55,0.3);
            padding: 12px 40px; display: flex; gap: 12; align-items: center;
          }
          .invoice-wrap {
            max-width: 860px; margin: 70px auto 60px; padding: 0 20px;
          }
        }
        @media print {
          .print-actions { display: none !important; }
          .invoice-wrap { margin: 0; padding: 0; }
          body { background: white !important; }
        }
        * { box-sizing: border-box; }
      `}</style>

      {/* Toolbar */}
      <div className="print-actions" style={{ display: "flex", alignItems: "center", gap: 12 }}>
        <div style={{ fontFamily: "'Playfair Display', serif", color: "#d4af37", fontSize: 18, marginRight: "auto" }}>
          ⬡ BillKaro
        </div>
        <button style={{
          ...S.btnSecondary, fontSize: 13, padding: "8px 20px"
        }} onClick={() => setStep("form")}>← Edit</button>
        <button style={{ ...S.btnPrimary, padding: "10px 28px", fontSize: 14 }} onClick={handlePrint}>
          ⬇ Download PDF
        </button>
      </div>

      {/* Invoice */}
      <div className="invoice-wrap" ref={previewRef}>
        <div style={{
          background: "white", borderRadius: 4,
          boxShadow: "0 20px 80px rgba(0,0,0,0.4)",
          fontFamily: "'DM Sans', sans-serif", overflow: "hidden",
        }}>
          {/* Invoice Header */}
          <div style={{
            background: "linear-gradient(135deg, #0f1923 0%, #1a3a5c 100%)",
            padding: "40px 48px", color: "white",
            display: "flex", justifyContent: "space-between", alignItems: "flex-start",
          }}>
            <div>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 28, color: "#d4af37", marginBottom: 4 }}>
                TAX INVOICE
              </div>
              <div style={{ fontSize: 13, color: "rgba(255,255,255,0.5)" }}>#{invoiceNum}</div>
            </div>
            <div style={{ textAlign: "right" }}>
              <div style={{ fontFamily: "'Playfair Display', serif", fontSize: 22, color: "white", marginBottom: 4 }}>
                {seller.name || "Your Business"}
              </div>
              {seller.gstin && <div style={{ fontSize: 12, color: "#d4af37" }}>GSTIN: {seller.gstin}</div>}
              {seller.address && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)", marginTop: 4 }}>{seller.address}</div>}
              {seller.city && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.city}, {seller.state} {seller.pin}</div>}
              {seller.email && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.email}</div>}
              {seller.phone && <div style={{ fontSize: 12, color: "rgba(255,255,255,0.6)" }}>{seller.phone}</div>}
            </div>
          </div>

          {/* Meta row */}
          <div style={{
            background: "#f8f9fa", padding: "16px 48px",
            display: "flex", justifyContent: "space-between",
            borderBottom: "2px solid #e9ecef",
          }}>
            {[
              ["Invoice Date", invoiceDate],
              ["Due Date", dueDate || "On Receipt"],
              ["Supply Type", supplyType === "intra" ? "Intra-State" : "Inter-State"],
            ].map(([label, val]) => (
              <div key={label}>
                <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.08em", marginBottom: 4 }}>{label}</div>
                <div style={{ fontSize: 14, fontWeight: 600, color: "#1a2d45" }}>{val}</div>
              </div>
            ))}
          </div>

          {/* Seller / Buyer */}
          <div style={{ display: "grid", gridTemplateColumns: "1fr 1fr", padding: "28px 48px", gap: 32, borderBottom: "1px solid #e9ecef" }}>
            <div>
              <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Billed By</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2d45", marginBottom: 4 }}>{seller.name}</div>
              {seller.gstin && <div style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>GSTIN: {seller.gstin}</div>}
              {seller.address && <div style={{ fontSize: 12, color: "#555" }}>{seller.address}</div>}
              {seller.city && <div style={{ fontSize: 12, color: "#555" }}>{seller.city}, {seller.state} - {seller.pin}</div>}
            </div>
            <div>
              <div style={{ fontSize: 10, color: "#888", textTransform: "uppercase", letterSpacing: "0.1em", marginBottom: 10 }}>Billed To</div>
              <div style={{ fontWeight: 700, fontSize: 16, color: "#1a2d45", marginBottom: 4 }}>{buyer.name || "—"}</div>
              {buyer.gstin && <div style={{ fontSize: 12, color: "#555", marginBottom: 2 }}>GSTIN: {buyer.gstin}</div>}
              {buyer.address && <div style={{ fontSize: 12, color: "#555" }}>{buyer.address}</div>}
              {buyer.city && <div style={{ fontSize: 12, color: "#555" }}>{buyer.city}, {buyer.state} - {buyer.pin}</div>}
            </div>
          </div>

          {/* Items table */}
          <div style={{ padding: "0 48px 28px" }}>
            <table style={{ width: "100%", borderCollapse: "collapse", marginTop: 24 }}>
              <thead>
                <tr style={{ background: "#0f1923" }}>
                  {["#", "Description", "Qty", "Rate", "GST %",
                    ...(supplyType === "intra" ? ["CGST", "SGST"] : ["IGST"]),
                    "Total"].map(h => (
                    <th key={h} style={{
                      padding: "10px 12px", color: "#d4af37",
                      fontSize: 11, textAlign: h === "#" || h === "Qty" ? "center" : "right",
                      fontWeight: 600, letterSpacing: "0.06em",
                      textAlign: h === "Description" ? "left" : h === "#" ? "center" : "right",
                    }}>{h}</th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {items.map((item, idx) => {
                  const c = calcItem(item);
                  return (
                    <tr key={item.id} style={{ background: idx % 2 === 0 ? "white" : "#f8f9fa" }}>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#888", textAlign: "center" }}>{idx + 1}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 500 }}>{item.desc}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.qty}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{parseFloat(item.rate || 0).toLocaleString("en-IN")}</td>
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>{item.gstRate}%</td>
                      {supplyType === "intra" ? <>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                        <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{(c.gstAmt / 2).toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>
                      </> : <td style={{ padding: "10px 12px", fontSize: 13, color: "#333", textAlign: "right" }}>₹{c.gstAmt.toLocaleString("en-IN", { minimumFractionDigits: 2 })}</td>}
                      <td style={{ padding: "10px 12px", fontSize: 13, color: "#1a2d45", fontWeight: 700, textAlign: "right" }}>{fmt(c.total)}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>

            {/* Totals */}
            <div style={{ display: "flex", justifyContent: "flex-end", marginTop: 20 }}>
              <div style={{ width: 280 }}>
                {[
                  ["Taxable Amount", fmt(totals.taxable)],
                  ...(supplyType === "intra" ? [
                    ["CGST", fmt(totals.gst / 2)],
                    ["SGST", fmt(totals.gst / 2)],
                  ] : [["IGST", fmt(totals.gst)]]),
                ].map(([label, val]) => (
                  <div key={label} style={{ display: "flex", justifyContent: "space-between", padding: "6px 0", borderBottom: "1px solid #e9ecef" }}>
                    <span style={{ color: "#555", fontSize: 13 }}>{label}</span>
                    <span style={{ color: "#333", fontSize: 13 }}>{val}</span>
                  </div>
                ))}
                <div style={{
                  display: "flex", justifyContent: "space-between",
                  background: "#0f1923", padding: "12px 16px",
                  marginTop: 8, borderRadius: 4,
                }}>
                  <span style={{ color: "#d4af37", fontWeight: 700, fontSize: 15 }}>TOTAL DUE</span>
                  <span style={{ color: "#d4af37", fontWeight: 800, fontSize: 20 }}>{fmt(totals.total)}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Notes + Footer */}
          {notes && (
            <div style={{ padding: "16px 48px", background: "#f8f9fa", borderTop: "1px solid #e9ecef" }}>
              <div style={{ fontSize: 11, color: "#888", marginBottom: 4, textTransform: "uppercase", letterSpacing: "0.08em" }}>Notes</div>
              <div style={{ fontSize: 13, color: "#444" }}>{notes}</div>
            </div>
          )}
          <div style={{
            background: "linear-gradient(90deg, #0f1923, #1a3a5c)",
            padding: "12px 48px", textAlign: "center",
            fontSize: 11, color: "rgba(255,255,255,0.4)",
          }}>
            Generated with BillKaro · GST Compliant Invoice
          </div>
        </div>
      </div>
    </div>
  );
}
