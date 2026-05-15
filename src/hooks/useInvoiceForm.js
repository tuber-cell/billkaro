import { useState, useEffect } from "react";
import { 
  invoiceNo, today, emptyItem, loadJSON, saveJSON 
} from "../components/common/Constants";

export const INVOICE_STATUSES = {
    DRAFT: { label: "Draft", color: "#8899aa", icon: "📝" },
    SENT: { label: "Sent", color: "#60a5fa", icon: "📤" },
    VIEWED: { label: "Viewed", color: "#fbbf24", icon: "👁️" },
    PAID: { label: "Paid", color: "#34d399", icon: "✅" },
    OVERDUE: { label: "Overdue", color: "#ef4444", icon: "🚨" },
};

export const trackInvoiceEvent = (invoiceNum, event) => {
    try {
        const tracking = JSON.parse(localStorage.getItem("bb_invoice_tracking") || "{}");
        if (!tracking[invoiceNum]) {
            tracking[invoiceNum] = { events: [], status: "DRAFT" };
        }
        tracking[invoiceNum].events.push({
            event,
            timestamp: new Date().toISOString()
        });
        tracking[invoiceNum].status = event;
        localStorage.setItem("bb_invoice_tracking", JSON.stringify(tracking));
    } catch (err) {
        console.warn("Failed to track invoice event:", err);
    }
};

export const getInvoiceStatus = (invoiceNum) => {
    const tracking = JSON.parse(localStorage.getItem("bb_invoice_tracking") || "{}");
    return tracking[invoiceNum]?.status || "DRAFT";
};

export function useInvoiceForm() {
  const [invoiceNum, setInvoiceNum] = useState(invoiceNo());
  const [invoiceDate, setInvoiceDate] = useState(today());
  const [dueDate, setDueDate] = useState("");
  const [supplyType, setSupplyType] = useState(() => localStorage.getItem("bb_supply_type") || "intra");
  const [docType, setDocType] = useState(() => localStorage.getItem("bb_doc_type") || "Tax Invoice");
  const [invoicePrefix, setInvoicePrefix] = useState(() => localStorage.getItem("bb_inv_prefix") || "INV-");
  const [watermark, setWatermark] = useState(() => localStorage.getItem("bb_watermark") || "");
  const [notes, setNotes] = useState("Thank you for your business!");
  const [paidStatus, setPaidStatus] = useState("unpaid");
  const [showUpiQr, setShowUpiQr] = useState(() => localStorage.getItem("bb_show_qr") === "true");
  
  const [sellerLogo, setSellerLogo] = useState(() => localStorage.getItem("bb_seller_logo") || "");
  const [sellerSignature, setSellerSignature] = useState(() => localStorage.getItem("bb_seller_sig") || "");
  
  const [savedSeller, setSavedSeller] = useState(() => loadJSON("bb_seller", null));
  const [savedClients, setSavedClients] = useState(() => loadJSON("bb_clients", []));

  const [seller, setSeller] = useState(savedSeller || { 
    name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", 
    email: "", phone: "", bankName: "", accountNum: "", ifsc: "", upi: "" 
  });
  const [buyer, setBuyer] = useState({ 
    name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", 
    email: "", phone: "" 
  });
  const [items, setItems] = useState([emptyItem()]);
  const [errors, setErrors] = useState({});

  useEffect(() => {
    localStorage.setItem("bb_supply_type", supplyType);
    localStorage.setItem("bb_doc_type", docType);
    localStorage.setItem("bb_inv_prefix", invoicePrefix);
    localStorage.setItem("bb_watermark", watermark);
    localStorage.setItem("bb_seller_logo", sellerLogo);
    localStorage.setItem("bb_seller_sig", sellerSignature);
    localStorage.setItem("bb_show_qr", showUpiQr);
  }, [supplyType, docType, invoicePrefix, watermark, sellerLogo, sellerSignature, showUpiQr]);

  // Smart GST Logic
  useEffect(() => {
    const sState = seller.state?.trim().toLowerCase();
    const bState = buyer.state?.trim().toLowerCase();
    if (sState && bState) setSupplyType(sState === bState ? "intra" : "inter");
  }, [seller.state, buyer.state]);

  const calcItem = (item) => {
    const qty = parseFloat(item.qty) || 0;
    const rate = parseFloat(item.rate) || 0;
    const disc = parseFloat(item.discount) || 0;
    const taxable = (qty * rate) * (1 - disc / 100);
    const gstAmt = taxable * (item.gstRate / 100);
    return { taxable, gstAmt, total: taxable + gstAmt };
  };

  const totals = items.reduce((acc, item) => {
    const c = calcItem(item);
    acc.taxable += c.taxable; acc.gst += c.gstAmt; acc.total += c.total;
    return acc;
  }, { taxable: 0, gst: 0, total: 0 });

  const updateItem = (id, field, val) => setItems(items.map(i => i.id === id ? { ...i, [field]: val } : i));
  const addItem = () => setItems([...items, emptyItem()]);
  const removeItem = (id) => items.length > 1 && setItems(items.filter(i => i.id !== id));

  const validate = () => {
    const e = {};
    console.log("Validating form...", { seller: seller.name, buyer: buyer.name, itemsCount: items.length });
    
    if (!seller.name?.trim()) {
      console.log("Validation Failed: Seller Name missing");
      e.sellerName = true;
    }
    if (!buyer.name?.trim()) {
      console.log("Validation Failed: Buyer Name missing");
      e.buyerName = true;
    }
    
    // Only validate items that aren't completely empty
    const activeItems = items.filter(i => i.desc?.trim() || i.rate);
    console.log("Active items:", activeItems.length);
    
    if (activeItems.length === 0) {
      console.log("Validation Failed: No active items");
      e.items = true;
    } else if (activeItems.some(i => !i.desc?.trim() || !i.rate)) {
      console.log("Validation Failed: Some items missing description or rate");
      e.items = true;
    }
    
    setErrors(e);
    const isValid = Object.keys(e).length === 0;
    console.log("Is Form Valid?", isValid);
    return isValid;
  };

  const resetForm = () => {
    setInvoiceNum(invoiceNo()); setInvoiceDate(today()); setDueDate(""); setPaidStatus("unpaid");
    setBuyer({ name: "", gstin: "", address: "", city: "", state: "Maharashtra", pin: "", email: "", phone: "" });
    setItems([emptyItem()]); setErrors({});
  };

  const handleSaveSeller = () => { saveJSON("bb_seller", seller); setSavedSeller(seller); alert("✅ Profile saved!"); };
  const handleSaveClient = () => {
    if (!buyer.name) return alert("Enter client name");
    const updated = [...savedClients.filter(c => c.name !== buyer.name), buyer];
    setSavedClients(updated); saveJSON("bb_clients", updated); alert(`✅ Client saved!`);
  };
  const handleLoadClient = (name) => { const c = savedClients.find(cl => cl.name === name); if (c) setBuyer(c); };
  const handleDeleteClient = (name) => { const updated = savedClients.filter(c => c.name !== name); setSavedClients(updated); saveJSON("bb_clients", updated); };

  return {
    invoiceNum, setInvoiceNum, invoiceDate, setInvoiceDate, dueDate, setDueDate,
    supplyType, setSupplyType, docType, setDocType, invoicePrefix, setInvoicePrefix,
    watermark, setWatermark, notes, setNotes, paidStatus, setPaidStatus,
    sellerLogo, setSellerLogo, sellerSignature, setSellerSignature,
    seller, setSeller, buyer, setBuyer, items, setItems, errors, setErrors,
    savedSeller, setSavedSeller, savedClients, setSavedClients,
    calcItem, totals, updateItem, addItem, removeItem, validate, resetForm,
    handleSaveSeller, handleSaveClient, handleLoadClient, handleDeleteClient,
    showUpiQr, setShowUpiQr,
    trackInvoiceEvent, getInvoiceStatus, INVOICE_STATUSES
  };
}
