"use client";

import { useState, useEffect } from "react";
import Select from "react-select";

export default function StockForm() {
  const [vendors, setVendors] = useState([]);
  const [selectedVendor, setSelectedVendor] = useState(null);
  const [selectedProduct, setSelectedProduct] = useState(null);

  const warrantyButtons = ["1 Year", "2 Years", "3 Years", "4 Years", "No Warranty"];

  const [rows, setRows] = useState([
    { id: 1, serial: "", mac: "", warranty: "No Warranty" },
  ]);
  const [quantity, setQuantity] = useState(1);
  const [appliedWarranty, setAppliedWarranty] = useState(null);
  const [errors, setErrors] = useState({});

  // ================= FETCH VENDORS =================
  useEffect(() => {
    fetch("http://localhost:5001/vendors")
      .then((res) => res.json())
      .then(setVendors);
  }, []);

  // Reset product when vendor changes
  useEffect(() => {
    setSelectedProduct(null);
  }, [selectedVendor]);

  // ================= HELPERS =================
  const applyWarrantyToAll = (w) => {
    setAppliedWarranty(w);
    setRows((prev) => prev.map((r) => ({ ...r, warranty: w })));
  };

  const addRow = () => {
    setRows((prev) => [
      ...prev,
      { id: Date.now(), serial: "", mac: "", warranty: appliedWarranty || "No Warranty" },
    ]);
  };

  const removeRow = (index) => {
    setRows((prev) => prev.filter((_, i) => i !== index));
  };

  // ================= VALIDATION =================
  const validate = () => {
    let newErrors = {};

    if (!selectedVendor) newErrors.vendor = "Vendor required";
    if (!selectedProduct) newErrors.product = "Product required";

    if (selectedProduct?.isUnique === true) {
      let serialSet = new Set();
      let macSet = new Set();

      rows.forEach((row, idx) => {
        if (!row.serial.trim()) newErrors[`serial_${idx}`] = "Required";
        else if (serialSet.has(row.serial.trim())) newErrors[`serial_${idx}`] = "Duplicate";
        serialSet.add(row.serial.trim());

        if (!row.mac.trim()) newErrors[`mac_${idx}`] = "Required";
        else if (macSet.has(row.mac.trim())) newErrors[`mac_${idx}`] = "Duplicate";
        macSet.add(row.mac.trim());
      });
    }

    if (selectedProduct?.isUnique === false) {
      if (!quantity || quantity <= 0) newErrors.quantity = "Quantity must be > 0";
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // ================= SUBMIT =================
  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;

    if (selectedVendor.status !== "active") {
      alert("Vendor inactive, cannot add stock");
      return;
    }

    let vendorItem = null;
    const res = await fetch(
      `http://localhost:5001/stocks?vendorId=${selectedVendor.id}&productId=${selectedProduct.value}`
    );
    const data = await res.json();
    vendorItem = data[0] || null;

    let dataToSave;

    if (selectedProduct.isUnique === true) {
      const oldItems = vendorItem?.items || [];
      const newItems = rows.map((r) => ({
        serial: r.serial.trim(),
        mac: r.mac.trim(),
        warranty: r.warranty,
      }));

      dataToSave = {
        productId: selectedProduct.value,
        vendorId: selectedVendor.id,
        items: [...oldItems, ...newItems],
        quantity: oldItems.length + newItems.length,
      };
    } else {
      const currentQty = vendorItem?.quantity || 0;
      dataToSave = {
        productId: selectedProduct.value,
        vendorId: selectedVendor.id,
        quantity: currentQty + quantity,
      };
    }

    const url = vendorItem
      ? `http://localhost:5001/stocks/${vendorItem.id}`
      : "http://localhost:5001/stocks";

    await fetch(url, {
      method: vendorItem ? "PUT" : "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(dataToSave),
    });

    alert("Stock saved successfully");

    setSelectedVendor(null);
    setSelectedProduct(null);
    setRows([{ id: 1, serial: "", mac: "", warranty: "No Warranty" }]);
    setQuantity(1);
    setAppliedWarranty(null);
    setErrors({});
  };

  // ================= UI =================
  return (
    <div className="max-w-6xl mx-auto p-6">
      <div className="bg-white rounded-2xl shadow-lg p-8">
        <h2 className="text-2xl font-semibold mb-8">Add Stock</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <label className="text-sm font-medium">Vendor *</label>
            <Select
              value={selectedVendor}
              onChange={setSelectedVendor}
              options={vendors.map((v) => ({ value: v.id, label: v.vendorName, ...v }))}
            />
            {errors.vendor && <p className="text-red-500 text-sm">{errors.vendor}</p>}
          </div>

          <div>
            <label className="text-sm font-medium">Product *</label>
            <Select
              isDisabled={!selectedVendor}
              value={selectedProduct}
              onChange={setSelectedProduct}
              options={selectedVendor?.products?.map((p) => ({
                value: p.id,
                label: p.productName || p.name,
                isUnique: p.isUnique === true,
              }))}
            />
            {errors.product && <p className="text-red-500 text-sm">{errors.product}</p>}
          </div>
        </div>

        {selectedProduct && selectedProduct.isUnique === true && (
          <div className="mt-8">
            <div className="flex items-center justify-between mb-4">
              <h3 className="font-medium">Serial Items</h3>
              <button
                onClick={addRow}
                className="bg-blue-600 text-white px-4 py-2 rounded-lg"
              >
                + Add Row
              </button>
            </div>

            <div className="flex flex-wrap gap-2 mb-4">
              {warrantyButtons.map((w) => (
                <button
                  key={w}
                  onClick={() => applyWarrantyToAll(w)}
                  className={`px-3 py-1 rounded-full border text-sm ${
                    appliedWarranty === w ? "bg-blue-600 text-white" : "bg-gray-50"
                  }`}
                >
                  {w}
                </button>
              ))}
            </div>

            <div className="overflow-x-auto">
              <table className="w-full border rounded-lg">
                <thead className="bg-gray-100 text-sm">
                  <tr>
                    <th className="p-2">#</th>
                    <th>Serial</th>
                    <th>MAC</th>
                    <th>Warranty</th>
                    <th></th>
                  </tr>
                </thead>
                <tbody>
                  {rows.map((row, idx) => (
                    <tr key={row.id} className="border-t">
                      <td className="p-2">{idx + 1}</td>
                      <td>
                        <input
                          className="input"
                          value={row.serial}
                          onChange={(e) =>
                            setRows((p) =>
                              p.map((r, i) => (i === idx ? { ...r, serial: e.target.value } : r))
                            )
                          }
                        />
                        {errors[`serial_${idx}`] && (
                          <p className="text-red-500 text-xs">{errors[`serial_${idx}`]}</p>
                        )}
                      </td>
                      <td>
                        <input
                          className="input"
                          value={row.mac}
                          onChange={(e) =>
                            setRows((p) =>
                              p.map((r, i) => (i === idx ? { ...r, mac: e.target.value } : r))
                            )
                          }
                        />
                        {errors[`mac_${idx}`] && (
                          <p className="text-red-500 text-xs">{errors[`mac_${idx}`]}</p>
                        )}
                      </td>
                      <td>
                        <select
                          className="input"
                          value={row.warranty}
                          onChange={(e) =>
                            setRows((p) =>
                              p.map((r, i) => (i === idx ? { ...r, warranty: e.target.value } : r))
                            )
                          }
                        >
                          {warrantyButtons.map((w) => (
                            <option key={w}>{w}</option>
                          ))}
                        </select>
                      </td>
                      <td className="text-center">
                        <button onClick={() => removeRow(idx)}>❌</button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {selectedProduct && selectedProduct.isUnique === false && (
          <div className="mt-8">
            <label className="font-medium">Quantity</label>
            <input
              type="number"
              min={1}
              className="input mt-2"
              value={quantity}
              onChange={(e) => setQuantity(Number(e.target.value))}
            />
            {errors.quantity && <p className="text-red-500 text-sm">{errors.quantity}</p>}
          </div>
        )}

        <div className="mt-10 text-right">
          <button
            onClick={handleSubmit}
            className="bg-green-600 hover:bg-green-700 text-white px-8 py-3 rounded-xl"
          >
            Save Stock
          </button>
        </div>
      </div>
    </div>
  );
}
