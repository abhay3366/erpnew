"use client"
import { useState, useEffect } from "react";

export default function useFilter(initialData = []) {
  const [filteredData, setFilteredData] = useState(initialData);

  const filterData = (criteriaFn) => {
    if (!initialData) return setFilteredData([]);
    const result = initialData.filter(criteriaFn);
    setFilteredData(result);
  };

  const resetFilter = () => setFilteredData(initialData);

  useEffect(() => {
    setFilteredData(initialData); // reset when initialData changes
  }, [initialData]);

  return { filteredData, setFilteredData, filterData, resetFilter };
}
