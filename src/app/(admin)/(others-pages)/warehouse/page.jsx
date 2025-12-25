"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { FaEdit } from "react-icons/fa";

const AddWarehouse = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [isEdit, setEdit] = useState(false);

  const [formData, setFormData] = useState({
    fromWarehouse: "",
    warehouseLocation: "",
    status: true,
  });

  const [warehouses, setWarehouses] = useState([]);

  /* ---------------- CHANGE HANDLER ---------------- */
  const handleChange = useCallback((e) => {
    const { name, value } = e.target;

    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  }, []);

  /* ---------------- EDIT HANDLER ---------------- */
  const handleEdit = (warehouse) => {
    setFormData({
      id: warehouse.id,
      fromWarehouse: warehouse.fromWarehouse,
      warehouseLocation: warehouse.warehouseLocation,
      status: warehouse.status,
    });

    setEdit(true);
    setModalOpen(true);
  };

  /* ---------------- SUBMIT ---------------- */
  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const url = isEdit
        ? `http://localhost:5001/warehouses/${formData.id}`
        : "http://localhost:5001/warehouses";

      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          fromWarehouse: formData.fromWarehouse,
          warehouseLocation: formData.warehouseLocation,
          status: formData.status,
          updated_at: new Date().toISOString(),
        }),
      });

      if (!response.ok) throw new Error("Failed");

      toast.success(isEdit ? "Warehouse updated!" : "Warehouse added!");

      setModalOpen(false);
      setEdit(false);
      setFormData({ fromWarehouse: "", warehouseLocation: "", status: true });

      getWarehouses();
    } catch (err) {
      toast.error("Operation failed");
    }
  };

  /* ---------------- FETCH ---------------- */
  const getWarehouses = async () => {
    const res = await fetch("http://localhost:5001/warehouses");
    const data = await res.json();
    setWarehouses(data);
  };

  useEffect(() => {
    getWarehouses();
  }, []);

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-6xl bg-white p-8 rounded-2xl shadow space-y-6">
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold">Warehouses</h1>
          <button
            onClick={() => {
              setEdit(false);
              setFormData({
                fromWarehouse: "",
                warehouseLocation: "",
                status: true,
              });
              setModalOpen(true);
            }}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg"
          >
            Add Warehouse
          </button>
        </div>

        {/* TABLE */}
        <table className="w-full border">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-3 text-left">Name</th>
              <th className="p-3 text-left">Location</th>
              <th className="p-3 text-left">Status</th>
              <th className="p-3">Action</th>
            </tr>
          </thead>
          <tbody>
            {warehouses.map((w) => (
              <tr key={w.id} className="border-t">
                <td className="p-3">{w.fromWarehouse}</td>
                <td className="p-3">{w.warehouseLocation}</td>
                <td className="p-3">
                  {w.status ? (
                    <span className="text-green-600 font-medium">Active</span>
                  ) : (
                    <span className="text-red-600 font-medium">Inactive</span>
                  )}
                </td>
                <td className="p-3 text-center">
                  <FaEdit
                    onClick={() => handleEdit(w)}
                    className="text-green-700 cursor-pointer"
                    size={20}
                  />
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        {/* MODAL */}
        {modalOpen && (
          <Modal
            formData={formData}
            setFormData={setFormData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
            setModalOpen={setModalOpen}
            isEdit={isEdit}
          />
        )}
      </div>
    </div>
  );
};

/* ================= MODAL ================= */
const Modal = ({
  formData,
  setFormData,
  handleChange,
  handleSubmit,
  setModalOpen,
  isEdit,
}) => {
  return (
    <div className="fixed inset-0 bg-black/40 flex items-center justify-center">
      <div className="bg-white p-6 rounded-xl w-full max-w-md">
        <h2 className="text-xl font-semibold mb-4">
          {isEdit ? "Edit Warehouse" : "Add Warehouse"}
        </h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <input
            name="fromWarehouse"
            value={formData.fromWarehouse}
            onChange={handleChange}
            placeholder="Warehouse Name"
            className="w-full border p-2 rounded"
            required
          />

          <input
            name="warehouseLocation"
            value={formData.warehouseLocation}
            onChange={handleChange}
            placeholder="Warehouse Location"
            className="w-full border p-2 rounded"
            required
          />

          {isEdit && (
            <select
              value={formData.status ? "true" : "false"}
              onChange={(e) =>
                setFormData((prev) => ({
                  ...prev,
                  status: e.target.value === "true",
                }))
              }
              className="w-full border p-2 rounded"
            >
              <option value="true">Active</option>
              <option value="false">Inactive</option>
            </select>
          )}

          <div className="flex gap-3">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 bg-red-500 text-white p-2 rounded"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 bg-blue-600 text-white p-2 rounded"
            >
              {isEdit ? "Update" : "Add"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWarehouse;
