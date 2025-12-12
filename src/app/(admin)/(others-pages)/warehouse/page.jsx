"use client";

import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";
import Swal from "sweetalert2";

const AddWarehouse = () => {
  const [modalOpen, setModalOpen] = useState(false);
  const [formData, setFormData] = useState({ fromWarehouse: "", warehouseLocation: "" });
  const [warehouses, setWarehouses] = useState([]);

  const handleChange = useCallback((e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
      createdAt: new Date().toISOString(),
      status: true,
    }));
  }, []);

  const handleSubmit = useCallback(
    async (e) => {
      e.preventDefault();
      try {
        const response = await fetch("http://localhost:5001/warehouses", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(formData),
        });

        if (!response.ok) throw new Error("Network response was not ok");

        toast.success("Warehouse added successfully!");
        setModalOpen(false);
        setFormData({ fromWarehouse: "", warehouseLocation: "" });
        getWarehouses();
      } catch (err) {
        console.error(err);
        toast.error("Failed to add warehouse");
      }
    },
    [formData]
  );

  const getWarehouses = async () => {
    try {
      const response = await fetch("http://localhost:5001/warehouses");
      if (!response.ok) throw new Error("Network response was not ok");
      const data = await response.json();
      setWarehouses(data);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => {
    getWarehouses();
  }, []);

  const deleteWarehouse = async (id) => {
    try {
      const result = await Swal.fire({
        title: "Are you sure?",
        text: "You won't be able to revert this!",
        icon: "warning",
        showCancelButton: true,
        confirmButtonColor: "#3085d6",
        cancelButtonColor: "#d33",
        confirmButtonText: "Yes, delete it!",
      });

      if (result.isConfirmed) {
        const response = await fetch(`http://localhost:5001/warehouses/${id}`, {
          method: "DELETE",
        });
        if (!response.ok) throw new Error("Network response was not ok");

        getWarehouses();
        Swal.fire("Deleted!", "Warehouse has been deleted.", "success");
      }
    } catch (err) {
      console.error(err);
      toast.error("Failed to delete warehouse");
    }
  };

  return (
    <div className="min-h-screen bg-gray-100 flex justify-center p-6">
      <div className="w-full max-w-6xl bg-white p-8 rounded-2xl shadow-lg space-y-6">
        {/* Header */}
        <div className="flex justify-between items-center">
          <h1 className="text-2xl font-bold text-gray-800">Warehouses</h1>
          <button
            onClick={() => setModalOpen(true)}
            className="px-4 py-2 rounded-lg bg-blue-600 text-white font-medium hover:bg-blue-700 transition"
          >
            Add Warehouse
          </button>
        </div>

        {/* Warehouses Table */}
        <div className="overflow-x-auto">
          <table className="min-w-full bg-white border border-gray-200 rounded-lg overflow-hidden">
            <thead className="bg-gray-50">
              <tr>
                <th className="py-3 px-4 text-left text-gray-700 font-medium uppercase text-sm border-b border-gray-200">
                  Warehouse Name
                </th>
                <th className="py-3 px-4 text-left text-gray-700 font-medium uppercase text-sm border-b border-gray-200">
                  Warehouse Location
                </th>
                <th className="py-3 px-4 text-left text-gray-700 font-medium uppercase text-sm border-b border-gray-200">
                  Action
                </th>
              </tr>
            </thead>
            <tbody>
              {warehouses.map((warehouse, idx) => (
                <tr
                  key={warehouse.id}
                  className={idx % 2 === 0 ? "bg-gray-50 hover:bg-gray-100" : "bg-white hover:bg-gray-100"}
                >
                  <td className="py-2 px-4 border-b border-gray-200">{warehouse.fromWarehouse}</td>
                  <td className="py-2 px-4 border-b border-gray-200">{warehouse.warehouseLocation}</td>
                  <td className="py-2 px-4 border-b border-gray-200">
                    <MdDelete
                      onClick={() => deleteWarehouse(warehouse.id)}
                      className="text-red-500 cursor-pointer hover:text-red-700 transition"
                      size={24}
                    />
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {modalOpen && (
          <Modal
            setModalOpen={setModalOpen}
            formData={formData}
            handleChange={handleChange}
            handleSubmit={handleSubmit}
          />
        )}
      </div>
    </div>
  );
};

const Modal = ({ setModalOpen, formData, handleChange, handleSubmit }) => {
  return (
    <div className="fixed inset-0 flex items-center justify-center bg-black/40 z-50 p-4">
      <div className="bg-white rounded-xl shadow-xl w-full max-w-md p-6 space-y-4 border border-gray-200">
        <h2 className="text-xl font-semibold text-gray-800">Add Warehouse</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Name</label>
            <input
              type="text"
              name="fromWarehouse"
              value={formData.fromWarehouse}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Warehouse Location</label>
            <input
              type="text"
              name="warehouseLocation"
              value={formData.warehouseLocation}
              onChange={handleChange}
              required
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 transition"
            />
          </div>

          <div className="flex gap-4 mt-2">
            <button
              type="button"
              onClick={() => setModalOpen(false)}
              className="flex-1 py-2 bg-red-500 text-white rounded-lg hover:bg-red-600 transition font-medium"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="flex-1 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition font-medium"
            >
              Add Warehouse
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

export default AddWarehouse;
