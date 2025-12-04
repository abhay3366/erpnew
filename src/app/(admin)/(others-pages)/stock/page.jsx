"use client";

import { useState, useEffect } from "react";

export default function Stock() {
  const [items, setItems] = useState([]);
 
  const [showModal, setShowModal] = useState(false);
  const [editItem, setEditItem] = useState(null);
  const [formData, setFormData] = useState({ name: "", qty: "" });

  // ---------------- FETCH DATA ----------------
  const fetchData = async () => {
    const res = await fetch("http://localhost:5001/stocks");
    const data = await res.json();
    console.log("🚀 ~ fetchData ~ data:", data)
    setItems(data);
  };

  useEffect(() => {
    fetchData();
  }, []);

  // ---------------- HANDLE DELETE ----------------
  const deleteItem = async (id) => {
    await fetch(`http://localhost:5000/stocks/${id}`, { method: "DELETE" });
    fetchData();
  };

  // ---------------- OPEN EDIT MODAL ----------------
  const openEdit = (item) => {
    setEditItem(item);
    setFormData({ name: item.name, qty: item.qty });
    setShowModal(true);
  };

  // ---------------- UPDATE ITEM ----------------
  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch(`http://localhost:5000/stock/${editItem.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    setShowModal(false);
    setEditItem(null);
    fetchData();
  };
console.log("🚀 ~ Stock ~ items:", items)
  return (
    <div className="p-6">
      <h1 className="text-2xl font-bold mb-4">Stock List</h1>

      <table className="w-full border">
        <thead>
          <tr className="bg-gray-200">
            <th className="p-2 border">ID</th>
            <th className="p-2 border">Name</th>
            <th className="p-2 border">Qty</th>
            <th className="p-2 border">Action</th>
          </tr>
        </thead>
        <tbody>
          {items.map((item) => (
            <tr key={item.id}>
              <td className="border p-2">{item.id}</td>
              <td className="border p-2">{item.name}</td>
              <td className="border p-2">{item.qty}</td>
              <td className="border p-2 flex gap-3">
                <button
                  className="bg-blue-500 text-white px-3 py-1 rounded"
                  onClick={() => openEdit(item)}
                >
                  Edit
                </button>
                <button
                  className="bg-red-500 text-white px-3 py-1 rounded"
                  onClick={() => deleteItem(item.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>

      {/* ---------------- EDIT MODAL ---------------- */}
      {showModal && (
        <div className="fixed inset-0 bg-black bg-opacity-40 flex justify-center items-center">
          <div className="bg-white p-6 rounded w-96">
            <h2 className="text-xl font-bold mb-3">Edit Item</h2>

            <form onSubmit={handleSubmit}>
              <label className="block mb-2">Name</label>
              <input
                type="text"
                className="w-full border p-2 mb-4"
                value={formData.name}
                onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              />

              <label className="block mb-2">Quantity</label>
              <input
                type="number"
                className="w-full border p-2 mb-4"
                value={formData.qty}
                onChange={(e) => setFormData({ ...formData, qty: e.target.value })}
              />

              <div className="flex justify-end gap-3">
                <button
                  type="button"
                  className="bg-gray-400 px-4 py-2 rounded"
                  onClick={() => setShowModal(false)}
                >
                  Cancel
                </button>
                <button className="bg-green-600 text-white px-4 py-2 rounded" type="submit">
                  Update
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
