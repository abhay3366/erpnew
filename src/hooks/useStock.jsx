"use client";
import { useEffect, useMemo, useState } from "react";
//  fetch proudct based on id
export const useStock = () => {
  const [stock, setStocks] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/stocks")
      .then(res => res.json())
      .then(data => setStocks(data))
      .catch(console.log);
  }, []);

  const stockMap = useMemo(() => {
    const map = {};
    stock.forEach(p => {
      map[p.id] = p;
    });
    return map;
  }, [stock]);

  return { stock, stockMap };
};
