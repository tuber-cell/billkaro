import React from "react";
import { S } from "./common/Constants";
import Header from "./common/Header";

const ExpensesView = ({ 
  step, setStep, user, dbPro, plan, handleLogout, setShowLogin,
  expenses, setExpenses, expenseForm, setExpenseForm, today 
}) => {
  const handleAddExpense = (e) => {
    e.preventDefault();
    if (!expenseForm.amount) return alert("Enter amount");
    const newExp = { ...expenseForm, id: Date.now() };
    setExpenses([newExp, ...expenses]);
    setExpenseForm({ category: "Stock Purchase", amount: "", date: today(), notes: "" });
  };

  const removeExpense = (id) => setExpenses(expenses.filter(e => e.id !== id));

  const totalSpend = expenses.reduce((sum, e) => sum + Number(e.amount || 0), 0);

  return (
    <div style={S.page}>
      <Header step={step} setStep={setStep} user={user} dbPro={dbPro} plan={plan} handleLogout={handleLogout} setShowLogin={setShowLogin} />
      <div style={{ maxWidth: 800, margin: "0 auto", padding: "0 20px 60px" }}>
        <div className="bk-flex-column-mobile" style={{ display: "flex", justifyContent: "space-between", alignItems: "center", marginBottom: 32, gap: 16 }}>
          <div>
            <h2 style={{ color: "#e8edf2", fontSize: 28, margin: 0 }}>💸 Expense Tracker</h2>
            <div style={{ color: "#8899aa", fontSize: 13, marginTop: 4 }}>Keep your cashflow healthy</div>
          </div>
          <div style={{ textAlign: "right", background: "rgba(239,68,68,0.1)", border: "1px solid rgba(239,68,68,0.2)", padding: "8px 20px", borderRadius: 12, minWidth: 160 }}>
            <div style={{ fontSize: 10, color: "#ef4444", fontWeight: 800, textTransform: "uppercase" }}>Total Spending</div>
            <div style={{ fontSize: 24, color: "#ef4444", fontWeight: 800 }}>₹{totalSpend.toLocaleString()}</div>
          </div>
        </div>

        <div style={{ ...S.card, background: "rgba(20, 184, 166, 0.05)", border: "1px solid rgba(20, 184, 166, 0.2)" }}>
          <form onSubmit={handleAddExpense} style={{ display: "grid", gridTemplateColumns: "repeat(auto-fit, minmax(140px, 1fr))", gap: 16, alignItems: "flex-end" }}>
            <div>
              <label style={S.label}>Category</label>
              <select style={S.select} value={expenseForm.category} onChange={e => setExpenseForm({...expenseForm, category: e.target.value})}>
                {["Stock Purchase", "Rent", "Salary", "Electricity", "Tea/Lunch", "Travel", "Marketing", "Other"].map(c => <option key={c}>{c}</option>)}
              </select>
            </div>
            <div>
              <label style={S.label}>Amount (₹)</label>
              <input type="number" style={S.input} placeholder="0.00" value={expenseForm.amount} onChange={e => setExpenseForm({...expenseForm, amount: e.target.value})} />
            </div>
            <div>
              <label style={S.label}>Date</label>
              <input type="date" style={S.input} value={expenseForm.date} onChange={e => setExpenseForm({...expenseForm, date: e.target.value})} />
            </div>
            <div>
              <label style={S.label}>Notes</label>
              <input style={S.input} placeholder="e.g. 50kg cotton" value={expenseForm.notes} onChange={e => setExpenseForm({...expenseForm, notes: e.target.value})} />
            </div>
            <button style={{ ...S.btnTeal, height: 44, fontSize: 14, fontWeight: 700 }} type="submit">➕ Add Expense</button>
          </form>
        </div>

        <div style={{ marginTop: 32 }}>
          <h3 style={{ color: "#e8edf2", fontSize: 18, marginBottom: 16 }}>Recent Expenses</h3>
          <div className="scroll-container" style={{ background: "rgba(255,255,255,0.02)", borderRadius: 16, border: "1px solid rgba(255,255,255,0.06)", overflow: "hidden" }}>
            <table className="mobile-table-to-cards" style={{ width: "100%", borderCollapse: "collapse", fontSize: 13 }}>
              <thead>
                <tr style={{ background: "rgba(255,255,255,0.04)", borderBottom: "1px solid rgba(255,255,255,0.06)" }}>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa" }}>DATE</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa" }}>CATEGORY</th>
                  <th style={{ textAlign: "left", padding: "12px 16px", color: "#8899aa" }}>NOTES</th>
                  <th style={{ textAlign: "right", padding: "12px 16px", color: "#8899aa" }}>AMOUNT</th>
                  <th style={{ textAlign: "center", padding: "12px 16px", color: "#8899aa" }}></th>
                </tr>
              </thead>
              <tbody>
                {(expenses || []).map(e => (
                  <tr key={e.id} style={{ borderBottom: "1px solid rgba(255,255,255,0.03)" }}>
                    <td data-label="Date" style={{ padding: "12px 16px", color: "#8899aa" }}>{e.date}</td>
                    <td data-label="Category" style={{ padding: "12px 16px", color: "#e8edf2", fontWeight: 600 }}>{e.category}</td>
                    <td data-label="Notes" style={{ padding: "12px 16px", color: "#8899aa" }}>{e.notes}</td>
                    <td data-label="Amount" style={{ padding: "12px 16px", color: "#ef4444", textAlign: "right", fontWeight: 700 }}>₹{Number(e.amount).toFixed(2)}</td>
                    <td data-label="Action" style={{ padding: "12px 16px", textAlign: "center" }}>
                      <button 
                        style={{ background: "none", border: "none", color: "#ef4444", cursor: "pointer", opacity: 0.5 }} 
                        onClick={() => { if(confirm("Delete this expense?")) removeExpense(e.id); }}
                      >✕</button>
                    </td>
                  </tr>
                ))}
                {(expenses || []).length === 0 && (
                  <tr><td colSpan="5" style={{ padding: 40, textAlign: "center", color: "#445566" }}>No expenses recorded yet.</td></tr>
                )}
              </tbody>
            </table>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ExpensesView;
