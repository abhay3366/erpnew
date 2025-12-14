"use client";
import React, { useEffect, useState } from "react";

const DataFetcher = ({ type, id }) => {
  const [item, setItem] = useState(null);
 
 
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState("");

  useEffect(() => {
    if (!type || !id) return;

    const fetchData = async () => {
      setLoading(true);
      setError("");

      let apiUrl;
      console.log("dsf",type)
        if (type === "product") {
          apiUrl = "http://localhost:5001/products";
        } else if (type === "fromWarehouse") {
          apiUrl = "http://localhost:5001/warehouses";
        }else if (type === "toWarehouse") {
          apiUrl = "http://localhost:5001/warehouses";
        } else if (type === "vendor") {
          apiUrl = "http://localhost:5001/vendors";
        } else {
          setError("Invalid type");
          setLoading(false);
          return;
        }


      try {
        const res = await fetch(apiUrl);
        if (!res.ok) throw new Error("Failed to fetch data");
        const data = await res.json();
       

        const foundItem = data.find((i) => i.id === id) || null;
        setItem(foundItem);
      } catch (err) {
        setError(err.message || "Something went wrong");
      } finally {
        setLoading(false);
      }
    };

    fetchData();
  }, [type, id]);

  if (loading) return <div>Loading...</div>;
  if (error) return <div>{error}</div>;
  if (!item) return <div>{type} not found</div>;
 console.log("🚀 ~ DataFetcher ~ item:", item)
  // Show name depending on type
  const name =
  type === "product" ? item.productName :
  type === "vendor" ? item.vendorName :
  type === "toWarehouse" ? item.fromWarehouse :
    type === "fromWarehouse" ? item.fromWarehouse :
  "Name not found";

  return <div>{name}</div>;
};

export default DataFetcher;
