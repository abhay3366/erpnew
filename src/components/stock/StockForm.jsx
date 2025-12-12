"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

export default function StockForm() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);
  console.log("🚀 ~ StockForm ~ selectedProduct:", selectedProduct)

  const warrantyButtons = ["1 Year", "2 Years", "3 Years", "4 Years", "No Warranty"];

  const [rows, setRows] = useState([{ id: 1, warranty: "No Warranty", serial: "", mac: "" }]);
  const [appliedWarranty, setAppliedWarranty] = useState(null);
  const [quantity, setQuantity] = useState(1);
  const [errors, setErrors] = useState({});

  // Fetch vendors
  useEffect(() => {
    fetch("http://localhost:5001/vendors")
      .then((res) => res.json())
      .then(setVendors);
  }, []);

  // Reset product when vendor changes
  useEffect(() => {
    setSelectedProduct(null);
  }, [selectedVendor]);

  // Apply warranty to all rows
  const applyWarrantyToAll = (w) => {
    setAppliedWarranty(w);
    setRows((prev) => prev.map((r) => ({ ...r, warranty: w })));
  };

  // Add a single row for serial products
  const addRow = () => {
    setRows((prev) => [
      { id: prev.length + 1, warranty: "No Warranty", serial: "", mac: "" },
      ...prev,
    ]);
  };

  // Add multiple rows at once
  const addMultipleRows = (count) => {
    setRows((prev) => {
      const startId = prev.length + 1;
      const newRows = Array.from({ length: count }, (_, i) => ({
        id: startId + i,
        warranty: "No Warranty",
        serial: "",
        mac: "",
      }));
      return [...newRows, ...prev];
    });
  };

  const removeRow = (index) => setRows((prev) => prev.filter((_, i) => i !== index));

  // Validation
  const validate = () => {
    const newErrors = {};
    if (!selectedVendor) newErrors.vendor = "Vendor is required";
    if (!selectedProduct) newErrors.product = "Product is required";

    if (selectedProduct?.isSerial == 1) {
      rows.forEach((r, i) => {
        if (!r.serial.trim()) newErrors[`serial_${i}`] = `Serial number required for row ${i + 1}`;
        if (!r.mac.trim()) newErrors[`mac_${i}`] = `MAC address required for row ${i + 1}`;
      });
    } else {
      if (!quantity || quantity < 1) newErrors.quantity = "Quantity must be at least 1";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    let dataToSave = {};

    if (selectedProduct?.isSerial == 1) {
      dataToSave = {
        productId: selectedProduct.value,
        vendorId: selectedVendor.id,
        items: rows.map((r) => ({ serial: r.serial, mac: r.mac, warranty: r.warranty })),
        quantity: rows.length,
      };
    } else {
      dataToSave = {
        productId: selectedProduct.value,
        vendorId: selectedVendor.id,
        quantity: quantity,
      };
    }

    try {
      const res = await fetch("http://localhost:5001/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });

      if (!res.ok) throw new Error("Failed to save stock");

      alert("Stock saved successfully!");

      // Reset form
      setSelectedVendor(null);
      setSelectedProduct(null);
      setRows([{ id: 1, warranty: "No Warranty", serial: "", mac: "" }]);
      setQuantity(1);
      setAppliedWarranty(null);
      setErrors({});
    } catch (err) {
      console.error(err);
      alert("Error saving stock: " + err.message);
    }
  };

  return (
    <div className="p-8 max-w-6xl mx-auto">
      <div className="bg-white shadow-xl rounded-2xl p-8 border">
        <h2 className="text-2xl font-semibold text-gray-800 mb-6">Add Stock Entry</h2>

        {/* Vendor + Product */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="block mb-1 font-medium text-gray-700">Vendor *</label>
            <Select
              value={selectedVendor}
              onChange={setSelectedVendor}
              options={vendors.map((v) => ({ value: v.id, label: v.vendorName, ...v }))}
              classNamePrefix="react-select"
              placeholder="Select Vendor..."
            />
            {errors.vendor && <p className="text-red-500 text-sm mt-1">{errors.vendor}</p>}
          </div>
          <div>
            <label className="block mb-1 font-medium text-gray-700">Product *</label>
            <Select
              value={selectedProduct}
              onChange={setSelectedProduct}
              isDisabled={!selectedVendor}
              options={selectedVendor?.products?.map((p) => ({
                value: p.id,
                label: p.name,
                isSerial: p.isSerial || 0, // default 0 if not provided
              }))}
              placeholder={selectedVendor ? "Select Product..." : "Select vendor first"}
            />
            {errors.product && <p className="text-red-500 text-sm mt-1">{errors.product}</p>}
          </div>
        </div>

        {/* Stock Section */}
        {selectedProduct && (
          <>
            {selectedProduct.isSerial == 1 ? (
              <>
                {/* Multiple Rows + Table */}
                <div className="mt-8">
                  <p className="mb-2 font-medium text-gray-700">Add Multiple Rows at Once</p>
                  <div className="flex flex-wrap gap-3">
                    {[5, 10, 15, 20].map((n) => (
                      <button
                        key={n}
                        onClick={() => addMultipleRows(n)}
                        className="px-4 py-2 bg-gray-100 hover:bg-gray-200 border rounded-lg text-sm shadow-sm transition"
                      >
                        +{n} Rows
                      </button>
                    ))}
                  </div>
                </div>

                <p className="mt-8 mb-3 font-medium text-gray-700">Apply Warranty (Optional)</p>
                <div className="flex flex-wrap gap-3">
                  {warrantyButtons.map((w) => (
                    <button
                      key={w}
                      onClick={() => applyWarrantyToAll(w)}
                      className={`px-4 py-2 text-sm rounded-lg border transition shadow-sm 
                        ${appliedWarranty === w ? "bg-blue-600 text-white border-blue-600" : "bg-white text-gray-700 hover:bg-gray-100"}`}
                    >
                      {w}
                    </button>
                  ))}
                </div>

                <div className="flex justify-end mt-6">
                  <button
                    onClick={addRow}
                    className="px-5 py-2.5 bg-blue-600 text-white text-sm rounded-lg shadow hover:bg-blue-700 transition"
                  >
                    + Add Row
                  </button>
                </div>

                <div className="mt-6 border rounded-xl overflow-hidden shadow-sm bg-white">
                  <table className="w-full">
                    <thead className="bg-gray-100 text-gray-700 sticky top-0">
                      <tr>
                        <th>S.No</th>
                        <th>Serial Number</th>
                        <th>MAC Address</th>
                        <th>Warranty</th>
                        <th>Action</th>
                      </tr>
                    </thead>
                    <tbody>
                      {rows.map((row, idx) => (
                        <tr key={row.id} className="border-t hover:bg-gray-50 transition">
                          <td className="py-3 px-3 text-sm">{idx + 1}</td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.serial}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, serial: e.target.value } : r))
                                )
                              }
                              className="border p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter Serial Number"
                            />
                            {errors[`serial_${idx}`] && (
                              <p className="text-red-500 text-sm mt-1">{errors[`serial_${idx}`]}</p>
                            )}
                          </td>
                          <td className="px-3 py-2">
                            <input
                              type="text"
                              value={row.mac}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, mac: e.target.value } : r))
                                )
                              }
                              className="border p-2 rounded-lg w-full text-sm focus:ring-2 focus:ring-blue-500"
                              placeholder="Enter MAC Address"
                            />
                            {errors[`mac_${idx}`] && <p className="text-red-500 text-sm mt-1">{errors[`mac_${idx}`]}</p>}
                          </td>
                          <td className="px-3">
                            <select
                              value={row.warranty}
                              onChange={(e) =>
                                setRows((prev) =>
                                  prev.map((r, i) => (i === idx ? { ...r, warranty: e.target.value } : r))
                                )
                              }
                              className="border p-2 rounded-lg text-sm w-full focus:ring-2 focus:ring-blue-500"
                            >
                              {warrantyButtons.map((w) => (
                                <option key={w} value={w}>
                                  {w}
                                </option>
                              ))}
                            </select>
                          </td>
                          <td className="px-3 text-center">
                            <button
                              className="text-red-500 hover:text-red-700 text-lg"
                              onClick={() => removeRow(idx)}
                            >
                              ❌
                            </button>
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
                <p className="text-sm text-gray-500 mt-3">Rows: {rows.length}</p>
              </>
            ) : (
              <div className="mt-6">
                <label className="block mb-2 font-medium text-gray-700">Quantity</label>
                <input
                  type="number"
                  min={1}
                  value={quantity}
                  onChange={(e) => setQuantity(Number(e.target.value))}
                  className="border p-2 rounded-lg w-32 text-sm focus:ring-2 focus:ring-blue-500"
                />
                {errors.quantity && <p className="text-red-500 text-sm mt-1">{errors.quantity}</p>}
              </div>
            )}
          </>
        )}

        <div className="flex justify-end gap-4 mt-8">
          <button className="px-5 py-2.5 rounded-lg border bg-gray-50 hover:bg-gray-100 text-sm shadow transition">
            Cancel
          </button>
          <button
            onClick={handleSubmit}
            className="px-6 py-2.5 rounded-lg bg-green-600 hover:bg-green-700 text-white text-sm shadow transition"
          >
            Add Stock
          </button>
        </div>
      </div>
    </div>
  );
}
