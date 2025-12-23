"use client";
import { useEffect, useMemo, useState } from "react";
//  fetch proudct based on id
export const useProducts = () => {
  const [product, setProducts] = useState([]);

  useEffect(() => {
    fetch("http://localhost:5001/products")
      .then(res => res.json())
      .then(data => setProducts(data))
      .catch(console.log);
  }, []);

  const productMap = useMemo(() => {
    const map = {};
    product.forEach(p => {
      map[p.productId] = p;
    });
    return map;
  }, [product]);

  return { product, productMap };
};
