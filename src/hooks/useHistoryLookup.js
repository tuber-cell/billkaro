// ── useHistoryLookup.js ───────────────────────────────────────────────────────
// Smart Suggestions Engine for BillKaro
// Analyzes last 5 invoices per buyer and provides intelligent autofill + warnings
// ─────────────────────────────────────────────────────────────────────────────

import { useState, useEffect, useCallback, useRef } from "react";

// ── Constants ─────────────────────────────────────────────────────────────────
const HISTORY_KEY     = "bk_invoice_history"; // localStorage key
const MAX_HISTORY     = 50;                   // max invoices stored total
const LOOKUP_LIMIT    = 5;                    // last N invoices analyzed per buyer
const MATCH_THRESHOLD = 0;                  // Show immediately (0)

// ── Types (JSDoc for IDE support) ─────────────────────────────────────────────
/**
 * @typedef {Object} Suggestion
 * @property {string}   gstin          - Suggested GSTIN
 * @property {string}   state          - Suggested state
 * @property {string}   city           - Suggested city
 * @property {string}   address        - Suggested address
 * @property {string}   paymentTerms   - "immediate" | "net7" | "net15" | "net30"
 * @property {number}   avgInvoiceValue- Average invoice total for this buyer
 * @property {number}   confidence     - 0–1 score
 * @property {string[]} warnings       - Mismatch warnings to show user
 * @property {Object[]} suggestedItems - Most frequently billed items
 */

// ── Helper: load/save history ─────────────────────────────────────────────────
const loadHistory = () => {
  try {
    return JSON.parse(localStorage.getItem(HISTORY_KEY)) || [];
  } catch {
    return [];
  }
};

const saveHistory = (history) => {
  localStorage.setItem(HISTORY_KEY, JSON.stringify(history));
};

// ── Helper: calculate most common value in array ──────────────────────────────
const mostCommon = (arr) => {
  if (!arr.length) return null;
  const freq = arr.reduce((acc, val) => {
    acc[val] = (acc[val] || 0) + 1;
    return acc;
  }, {});
  return Object.entries(freq).sort((a, b) => b[1] - a[1])[0][0];
};

// ── Helper: calculate average days between invoice date and due date ──────────
const avgPaymentTerms = (invoices) => {
  const gaps = invoices
    .filter(inv => inv.dueDate && inv.invoiceDate)
    .map(inv => {
      const diff = new Date(inv.dueDate) - new Date(inv.invoiceDate);
      return Math.round(diff / (1000 * 60 * 60 * 24)); // days
    });

  if (!gaps.length) return "net30";
  const avg = gaps.reduce((a, b) => a + b, 0) / gaps.length;

  if (avg <= 0)  return "immediate";
  if (avg <= 7)  return "net7";
  if (avg <= 15) return "net15";
  return "net30";
};

// ── Helper: extract most frequent items ──────────────────────────────────────
const frequentItems = (invoices) => {
  const itemMap = {};

  invoices.forEach(inv => {
    (inv.items || []).forEach(item => {
      const key = item.desc.toLowerCase().trim();
      if (!itemMap[key]) {
        itemMap[key] = { ...item, count: 0, totalRate: 0 };
      }
      itemMap[key].count++;
      itemMap[key].totalRate += parseFloat(item.rate) || 0;
    });
  });

  return Object.values(itemMap)
    .sort((a, b) => b.count - a.count)
    .slice(0, 5)
    .map(item => ({
      desc:    item.desc,
      qty:     item.qty,
      rate:    parseFloat((item.totalRate / item.count).toFixed(2)), // avg rate
      gstRate: item.gstRate,
    }));
};

// ══════════════════════════════════════════════════════════════════════════════
// MAIN HOOK
// ══════════════════════════════════════════════════════════════════════════════
export function useHistoryLookup({ buyer, seller, items, supplyType }) {
  const [suggestion, setSuggestion]   = useState(null);   // current suggestions
  const [warnings, setWarnings]       = useState([]);      // mismatch warnings
  const [history, setHistory]         = useState(loadHistory);
  const debounceRef                   = useRef(null);

  // ── 1. Analyze history when buyer name changes ────────────────────────────
  useEffect(() => {
    // Debounce — don't analyze on every keystroke
    clearTimeout(debounceRef.current);
    debounceRef.current = setTimeout(() => {
      analyzeBuyer(buyer.name);
    }, 100);

    return () => clearTimeout(debounceRef.current);
  }, [buyer.name, history]);

  // ── 2. Check for mismatches when buyer fields change ─────────────────────
  useEffect(() => {
    if (!suggestion || !buyer.name) return;
    detectMismatches();
  }, [buyer.gstin, buyer.state, buyer.city, items]);

  // ── Core: analyze last 5 invoices for this buyer ──────────────────────────
  const analyzeBuyer = useCallback((buyerName) => {
    if (!buyerName || buyerName.trim().length < 2) {
      setSuggestion(null);
      setWarnings([]);
      return;
    }

    // Find last 5 invoices for this buyer (case-insensitive)
    const buyerHistory = history
      .filter(inv =>
        inv.buyer?.name?.toLowerCase().includes(buyerName.toLowerCase())
      )
      .slice(-LOOKUP_LIMIT);
    
    console.log("🔍 History Engine:", buyerName, "found", buyerHistory.length, "matches");

    if (!buyerHistory.length) {
      setSuggestion(null);
      return;
    }

    // Extract fields for analysis
    const gstins    = buyerHistory.map(i => i.buyer?.gstin).filter(Boolean);
    const states    = buyerHistory.map(i => i.buyer?.state).filter(Boolean);
    const cities    = buyerHistory.map(i => i.buyer?.city).filter(Boolean);
    const addresses = buyerHistory.map(i => i.buyer?.address).filter(Boolean);
    const totals    = buyerHistory.map(i => i.total || 0);

    // Calculate confidence — more history = higher confidence
    const confidence = Math.min(buyerHistory.length / LOOKUP_LIMIT, 1);
    console.log("🔍 History Engine: Confidence", confidence, "Threshold", MATCH_THRESHOLD);

    if (confidence < MATCH_THRESHOLD) return; // not enough data yet

    const newSuggestion = {
      gstin:           mostCommon(gstins),
      state:           mostCommon(states),
      city:            mostCommon(cities),
      address:         mostCommon(addresses),
      paymentTerms:    avgPaymentTerms(buyerHistory),
      avgInvoiceValue: totals.reduce((a, b) => a + b, 0) / totals.length,
      confidence,
      suggestedItems:  frequentItems(buyerHistory),
      invoiceCount:    buyerHistory.length,
      supplyType:      mostCommon(buyerHistory.map(i => i.supplyType).filter(Boolean)),
      phone:           mostCommon(buyerHistory.map(i => i.buyer?.phone).filter(Boolean)),
      email:           mostCommon(buyerHistory.map(i => i.buyer?.email).filter(Boolean)),
      pin:             mostCommon(buyerHistory.map(i => i.buyer?.pin).filter(Boolean)),
    };

    setSuggestion(newSuggestion);
  }, [history]);

  // ── Mismatch detection ────────────────────────────────────────────────────
  const detectMismatches = useCallback(() => {
    if (!suggestion) return;
    const newWarnings = [];

    // GSTIN mismatch
    if (
      buyer.gstin &&
      suggestion.gstin &&
      buyer.gstin !== suggestion.gstin
    ) {
      newWarnings.push({
        field:   "gstin",
        level:   "error",
        message: `⚠️ GSTIN mismatch — you usually bill ${buyer.name} with ${suggestion.gstin}`,
      });
    }

    // State mismatch
    if (
      buyer.state &&
      suggestion.state &&
      buyer.state !== suggestion.state
    ) {
      newWarnings.push({
        field:   "state",
        level:   "warning",
        message: `📍 Different state than usual — ${buyer.name} is usually in ${suggestion.state}`,
      });
    }

    // Supply type mismatch (intra vs inter based on states)
    if (seller.state && buyer.state) {
      const shouldBeInter = seller.state !== buyer.state;
      const isInter       = supplyType === "inter";
      if (shouldBeInter !== isInter) {
        newWarnings.push({
          field:   "supplyType",
          level:   "error",
          message: shouldBeInter
            ? `🚨 Seller (${seller.state}) and Buyer (${buyer.state}) are in different states — should be Inter-State (IGST)`
            : `🚨 Seller and Buyer are in the same state — should be Intra-State (CGST+SGST)`,
        });
      }
    }

    // Invoice value anomaly (>2x average)
    const currentTotal = items.reduce((sum, item) => {
      const taxable = (parseFloat(item.qty) || 0) * (parseFloat(item.rate) || 0);
      return sum + taxable + taxable * ((item.gstRate || 0) / 100);
    }, 0);

    if (
      currentTotal > 0 &&
      suggestion.avgInvoiceValue > 0 &&
      currentTotal > suggestion.avgInvoiceValue * 2
    ) {
      newWarnings.push({
        field:   "amount",
        level:   "info",
        message: `💡 This invoice (₹${currentTotal.toFixed(0)}) is much higher than your usual amount with ${buyer.name} (avg ₹${suggestion.avgInvoiceValue.toFixed(0)})`,
      });
    }

    setWarnings(newWarnings);
  }, [suggestion, buyer, seller, items, supplyType]);

  // ── Save invoice to history after download ────────────────────────────────
  const saveToHistory = useCallback((invoiceData) => {
    const updated = [
      ...history,
      {
        ...invoiceData,
        savedAt: new Date().toISOString(),
      }
    ].slice(-MAX_HISTORY); // keep only last 50

    setHistory(updated);
    saveHistory(updated);
    console.log("💾 History Engine: Saved. Total records:", updated.length);
  }, [history]);

  // ── Apply suggestion to buyer form ────────────────────────────────────────
  const applySuggestion = useCallback((setBuyer, setDueDate, setSupplyType, invoiceDate) => {
    if (!suggestion) return;

    setBuyer(prev => ({
      ...prev,
      gstin:   suggestion.gstin   || prev.gstin,
      state:   suggestion.state   || prev.state,
      city:    suggestion.city    || prev.city,
      address: suggestion.address || prev.address,
      phone:   suggestion.phone   || prev.phone,
      email:   suggestion.email   || prev.email,
      pin:     suggestion.pin     || prev.pin,
    }));

    if (suggestion.supplyType) {
      setSupplyType(suggestion.supplyType);
    }

    // Set due date based on payment terms
    if (invoiceDate) {
      const daysMap = {
        immediate: 0,
        net7:      7,
        net15:     15,
        net30:     30,
      };
      const days     = daysMap[suggestion.paymentTerms] ?? 30;
      const dueDate  = new Date(invoiceDate);
      dueDate.setDate(dueDate.getDate() + days);
      setDueDate(dueDate.toISOString().slice(0, 10));
    }
  }, [suggestion]);

  // ── Clear history for a specific buyer (GDPR-friendly) ───────────────────
  const clearBuyerHistory = useCallback((buyerName) => {
    const updated = history.filter(
      inv => inv.buyer?.name?.toLowerCase() !== buyerName.toLowerCase()
    );
    setHistory(updated);
    saveHistory(updated);
    setSuggestion(null);
    setWarnings([]);
  }, [history]);

  return {
    suggestion,        // autofill data to show
    warnings,          // mismatch alerts
    saveToHistory,     // call this after every successful download
    applySuggestion,   // call this when user clicks "Apply"
    clearBuyerHistory, // call this from settings
    hasHistory:        history.length > 0,
  };
}
