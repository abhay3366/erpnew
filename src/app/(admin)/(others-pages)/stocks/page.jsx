"use client";

import { useState } from "react";

import IssueLease from "./component/IssueLease";
import StockAdd from "./component/StockAdd";

export default function StockPage() {
    const stockCategories = [
  { name: "Stock Add", component: StockAdd },
 
  { name: "Issue Lease", component: IssueLease },

];
  const [activeCategory, setActiveCategory] = useState(stockCategories[0].name);

  const ActiveComponent = stockCategories.find(c => c.name === activeCategory)?.component;
 
  return (
    <div className="flex min-h-screen">
      {/* ---------------- Sidebar ---------------- */}
      <div className="w-56 bg-gray-100 border-r p-4 flex flex-col gap-2">
        <h2 className="font-bold text-lg mb-4">Stock Categories</h2>
        {stockCategories.map((c) => (
          <button
            key={c.name}
            onClick={() => setActiveCategory(c.name)}
            className={`text-left px-4 py-2 rounded hover:bg-blue-500 hover:text-white ${
              activeCategory === c.name ? "bg-blue-500 text-white" : "text-gray-700"
            }`}
          >
            {c.name}
          </button>
        ))}
      </div>

      {/* ---------------- Content ---------------- */}
      <div className="flex-1 p-6">
        {ActiveComponent ? <ActiveComponent /> : <p>Select a category</p>}
      </div>
    </div>
  );
}
