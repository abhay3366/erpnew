"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { useState, useEffect } from "react";

const TransferredItems = () => {
  const [showModal, setShowModal] = useState(false);

  const [selectedItem, setSelectedItem] = useState("");
  const [fromBranch, setFromBranch] = useState("");
  const [toBranch, setToBranch] = useState("");

  const [rows, setRows] = useState([{ serial: "", quantity: "" }]);

  const [itemOptions, setItemOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [serialOptions, setSerialOptions] = useState([]);

  const [fetchDataBasedOnId, setFetchDataBasedOnId] = useState(null);

  useEffect(() => {
    fetchItems();
    fetchBranches();
  }, []);

  // ------------------------------ Fetch all items ------------------------------
  const fetchItems = async () => {
    const res = await fetch("http://localhost:5001/products");
    const data = await res.json();
    const items = data.map((item) => ({
      id: item.id,
      productName: item.productName,
    }));
    setItemOptions(items);
  };

  // ------------------------------ Fetch item based on selected ID ------------------------------
  useEffect(() => {
    if (!selectedItem) return;
    fetchItemById(selectedItem);
    fetchSerials(selectedItem);
  }, [selectedItem]);

  const fetchItemById = async (id) => {
    const res = await fetch(`http://localhost:5001/products?id=${id}`);
    const data = await res.json();
    setFetchDataBasedOnId(data[0]); // assuming single object
  };

  // ------------------------------ Fetch branches ------------------------------
  const fetchBranches = async () => {
    const res = await fetch("http://localhost:5001/branches");
    const data = await res.json();
    const branches = data.map((branch) => ({
      id: branch.id,
      branchName: branch.branchName,
    }));
    setBranchOptions(branches);
  };

  // ------------------------------ Fetch serials based on selected item ------------------------------
  const fetchSerials = async (itemId) => {
    const res = await fetch("http://localhost:5001/saveStocks");
    const data = await res.json();
    const filtered = data.filter((stock) => stock.id == itemId);
    const serialList = filtered.map((stock) => ({
      value: stock.serialNumber,
      label: stock.serialNumber,
    }));
    setSerialOptions(serialList);
  };

  // ------------------------------ Row operations ------------------------------
  const addRow = () => setRows([...rows, { serial: "", quantity: "" }]);
  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // ------------------------------ Submit ------------------------------
  const handleSubmit = async (e) => {
    e.preventDefault();
    const sendData = {
      selectedItem,
      fromBranch,
      toBranch,
      rows,
    };
    await fetch("http://localhost:5001/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendData),
    });
    alert("Data Saved!");
    setShowModal(false);
  };
console.log("sdf",fetchDataBasedOnId)
  return (
    <div>
      <PageBreadcrumb pageTitle="Transfer Items" />

      <div className="mx-auto p-6 space-y-6">
        <div className="p-3 rounded-xl border border-gray-200 mt-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white rounded-lg"
            >
              <IoMdAdd /> Transfer Item
            </button>
          </div>
        </div>
      </div>

      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white max-h-[600px] overflow-y-auto rounded-xl p-6 w-full max-w-4xl shadow-lg">
            <h2 className="text-lg font-semibold mb-6">Transfer Item</h2>

            <form onSubmit={handleSubmit} className="space-y-6">
              {/* Top fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Item */}
                <div>
                  <label className="font-medium text-sm mb-2 block">Select Item</label>
                  <select
                    value={selectedItem}
                    onChange={(e) => setSelectedItem(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 w-full"
                  >
                    <option value="">Select Item</option>
                    {itemOptions.map((item) => (
                      <option key={item.id} value={item.id}>
                        {item.productName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* From Branch */}
                <div>
                  <label className="font-medium text-sm mb-2 block">From Branch</label>
                  <select
                    value={fromBranch}
                    onChange={(e) => setFromBranch(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 w-full"
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                </div>

                {/* To Branch */}
                <div>
                  <label className="font-medium text-sm mb-2 block">To Branch</label>
                  <select
                    value={toBranch}
                    onChange={(e) => setToBranch(e.target.value)}
                    className="border border-gray-300 rounded-xl p-2 w-full"
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map((b) => (
                      <option key={b.id} value={b.id}>
                        {b.branchName}
                      </option>
                    ))}
                  </select>
                </div>
              </div>
                  
              {/* Rows */}
              {/* Rows */}
{fetchDataBasedOnId && fetchDataBasedOnId.isSerial ? (
  rows.map((row, index) => (
    <div key={index} className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
      <div>
        <label className="font-medium text-sm mb-2 block">Serial Number</label>
        <select
          value={row.serial}
          onChange={(e) => updateRow(index, "serial", e.target.value)}
          className="border border-gray-300 rounded-xl p-2 w-full"
        >
          <option value="">Select Serial</option>
          {serialOptions.map((s) => (
            <option key={s.value} value={s.value}>
              {s.label}
            </option>
          ))}
        </select>
      </div>

      <div>
        <label className="font-medium text-sm mb-2 block">Quantity</label>
        <input
          type="number"
          value={row.quantity}
          onChange={(e) => updateRow(index, "quantity", e.target.value)}
          className="border border-gray-300 rounded-xl p-2 w-full"
        />
      </div>

      <div className="flex items-end">
        {index === rows.length - 1 && (
          <button
            type="button"
            onClick={addRow}
            className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-800"
          >
            <IoMdAdd /> Add More
          </button>
        )}
      </div>
    </div>
  ))
) : (
  <p className="text-gray-500">No serials available for this item.</p>
)}


              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Close
                </button>
                <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferredItems;
