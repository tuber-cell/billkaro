import React from "react";

const BottomNavBar = ({ step, setStep }) => {
  const items = [
    { id: "form", icon: "📝", label: "Create" },
    { id: "expenses", icon: "💸", label: "Expenses" },
    { id: "dashboard", icon: "📊", label: "Insights" },
    { id: "reconcile", icon: "📑", label: "GSTR-1" }
  ];

  return (
    <div className="mobile-bottom-nav">
      {items.map(item => (
        <button 
          key={item.id}
          onClick={() => setStep(item.id)}
          className={`nav-item ${step === item.id ? "active" : ""}`}
        >
          <span className="nav-icon">{item.icon}</span>
          <span className="nav-label">{item.label}</span>
        </button>
      ))}
    </div>
  );
};

export default BottomNavBar;
