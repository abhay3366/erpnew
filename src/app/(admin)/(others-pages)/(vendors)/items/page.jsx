"use client";

import Image from "next/image";
import { useEffect, useState, useMemo } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import Select from "react-select";

import * as XLSX from "xlsx";
import { saveAs } from "file-saver";

export default function ItemsPage() {
  const [showModal, setShowModal] = useState(false);
  const [editingItem, setEditingItem] = useState(null);
  const [items, setItems] = useState([]);
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);

  // --- Filters and Search ---
  const [searchText, setSearchText] = useState("");
  const [filterBranch, setFilterBranch] = useState("");
  const [filterCategory, setFilterCategory] = useState("");
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // ---------------- FETCH DATA ----------------
  const fetchItems = async () => {
    try {
      const res = await fetch("http://localhost:5001/products");
      if (!res.ok) throw new Error("Network error");
      const data = await res.json();
      setItems(data);
    } catch (err) {
      console.log("❌ Error fetching items:", err);
    }
  };

  const fetchBranches = async () => {
    try {
      const res = await fetch("http://localhost:5001/branches");
      const data = await res.json();
      setBranches(data);
    } catch {}
  };

  const fetchCategories = async () => {
    try {
      const res = await fetch("http://localhost:5001/categories");
      const data = await res.json();
      setCategories(data.list || []);
    } catch {}
  };

  useEffect(() => {
    fetchItems();
    fetchBranches();
    fetchCategories();
  }, []);

  // ---------------- DELETE ITEM ----------------
  const deleteItem = async (id) => {
    if (!confirm("Are you sure you want to delete this item?")) return;
    try {
      const res = await fetch(`http://localhost:5001/products/${id}`, { method: "DELETE" });
      if (res.ok) {
        toast.success("Item deleted!");
        fetchItems();
      }
    } catch {
      toast.error("Failed to delete item.");
    }
  };

  // ---------------- FILTERED & PAGINATED ITEMS ----------------
  const filteredItems = useMemo(() => {
    return items
      .filter((item) =>
        item.productName.toLowerCase().includes(searchText.toLowerCase())
      )
      .filter((item) => (filterBranch ? item.store === filterBranch : true))
      .filter((item) =>
        filterCategory ? item.category?.includes(filterCategory) : true
      );
  }, [items, searchText, filterBranch, filterCategory]);

  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);
  const paginatedItems = filteredItems.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage
  );

  // ---------------- EXPORT TO EXCEL ----------------
 const exportToExcel = () => {
    // Nested arrays को string में convert करें
    const formattedData = paginatedItems.map(p => ({
      store: p.store,
      productName: p.productName,
      isSerial: p.isSerial,
      brand: p.brand,
      unit: p.unit,
      description: p.description,
      category: p.category.join(", "), // Array को comma-separated string में
      images: p.images.join(", "),     // Array को comma-separated string में
      createdAt: p.createdAt,
      id: p.id
    }));

    const ws = XLSX.utils.json_to_sheet(formattedData);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, "Products");

    const excelBuffer = XLSX.write(wb, { bookType: "xlsx", type: "array" });
    const blob = new Blob([excelBuffer], { type: "application/octet-stream" });
    saveAs(blob, "ProductsData.xlsx");
  };


  return (
    <div className="p-6">
      {/* ---------------- HEADER ---------------- */}
      <div className="flex flex-col md:flex-row justify-between items-center mb-4 gap-3">
        <h1 className="text-2xl font-semibold">Items List</h1>
        <button
          onClick={() => {
            setEditingItem(null);
            setShowModal(true);
          }}
          className="bg-blue-600 text-white px-4 py-2 rounded-lg"
        >
          + Add Item
        </button>
        <button
        onClick={exportToExcel}
        className="px-4 py-2 bg-blue-500 text-white rounded"
      >
        Export to Excel
      </button>
      </div>

      {/* ---------------- SEARCH & FILTERS ---------------- */}
      <div className="flex flex-col md:flex-row gap-3 mb-4">
        <input
          type="text"
          placeholder="Search by name..."
          value={searchText}
          onChange={(e) => {
            setSearchText(e.target.value);
            setCurrentPage(1); // reset page
          }}
          className="inputCss "
        />

        <select
          value={filterBranch}
          onChange={(e) => {
            setFilterBranch(e.target.value);
            setCurrentPage(1);
          }}
          className="inputCss"
        >
          <option value="">All Branches</option>
          {branches.map((b) => (
            <option key={b.id} value={b.id}>
              {b.branchName}
            </option>
          ))}
        </select>

        <select
          value={filterCategory}
          onChange={(e) => {
            setFilterCategory(e.target.value);
            setCurrentPage(1);
          }}
          className="inputCss"
        >
          <option value="">All Categories</option>
          {categories.map((c) => (
            <option key={c.id} value={c.name}>
              {c.name}
            </option>
          ))}
        </select>
      </div>

      {/* ------------------- ITEMS TABLE ------------------- */}
      <div className="bg-white rounded-lg shadow-md p-4 border border-gray-200 overflow-x-auto">
        <table className="w-full text-sm">
          <thead>
            <tr className="border-b bg-gray-100 text-gray-700">
              <th className="p-2 text-left">Image</th>
              <th className="p-2 text-left">Item Name</th>
              <th className="p-2 text-left">Brand</th>
              <th className="p-2 text-left">Unit</th>
              <th className="p-2 text-left">Created By</th>
              <th className="p-2 text-left">Created On</th>
              <th className="p-2 text-left">Actions</th>
            </tr>
          </thead>
          <tbody>
            {paginatedItems.length === 0 ? (
              <tr>
                <td colSpan="7" className="text-center text-gray-500 p-4">
                  No items found
                </td>
              </tr>
            ) : (
              paginatedItems.map((item) => (
                <tr key={item.id} className="border-b hover:bg-gray-50">
                  <td className="p-2">
                    {item.images?.[0] ? (
                      <Image
                        src={item.images[0]}
                        width={50}
                        height={40}
                        className="rounded-md border"
                        alt=""
                      />
                    ) : (
                      <span className="text-gray-400">No Image</span>
                    )}
                  </td>
                  <td className="p-2">{item.productName}</td>
                  <td className="p-2">{item.brand}</td>
                  <td className="p-2">{item.unit}</td>
                  <td className="p-2 text-gray-500">{item.createdBy || "N/A"}</td>
                  <td className="p-2 text-gray-500">{item.createdAt?.slice(0, 10)}</td>
                  <td className="p-2 flex gap-2">
                    <button
                      className="text-blue-600 hover:underline"
                      onClick={() => {
                        setEditingItem(item);
                        setShowModal(true);
                      }}
                    >
                      Edit
                    </button>
                    <button
                      className="text-red-600 hover:underline"
                      onClick={() => deleteItem(item.id)}
                    >
                      Delete
                    </button>
                  </td>
                </tr>
              ))
            )}
          </tbody>
        </table>
      </div>

      {/* ------------------- PAGINATION ------------------- */}
      {totalPages > 1 && (
        <div className="flex justify-center mt-4 gap-2">
          <button
            disabled={currentPage === 1}
            onClick={() => setCurrentPage((p) => p - 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Prev
          </button>

          {Array.from({ length: totalPages }, (_, i) => (
            <button
              key={i}
              onClick={() => setCurrentPage(i + 1)}
              className={`px-3 py-1 border rounded ${currentPage === i + 1 ? "bg-blue-500 text-white" : ""}`}
            >
              {i + 1}
            </button>
          ))}

          <button
            disabled={currentPage === totalPages}
            onClick={() => setCurrentPage((p) => p + 1)}
            className="px-3 py-1 border rounded disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}

      {/* ------------------- MODAL ------------------- */}
      {showModal && (
        <ItemModal
          closeModal={() => setShowModal(false)}
          refreshItems={fetchItems}
          editingItem={editingItem}
        />
      )}
    </div>
  );
}

// ------------------- MODAL COMPONENT -------------------
function ItemModal({ closeModal, refreshItems, editingItem }) {
  const {
    register,
    control,
    handleSubmit,
    formState: { errors },
    reset,
    setValue,
  } = useForm();

  const [categories, setCategories] = useState([]);
  const [branches, setBranches] = useState([]);
  const [previews, setPreviews] = useState([]);

  const handleImageSelect = (e) => {
    const files = Array.from(e.target.files);
    const imgUrls = files.map((file) => ({ file, url: URL.createObjectURL(file) }));
    setPreviews((prev) => [...prev, ...imgUrls]);
  };

  useEffect(() => {
    return () => previews.forEach((p) => URL.revokeObjectURL(p.url));
  }, [previews]);

  useEffect(() => {
    fetch("http://localhost:5001/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data))
      .catch(() => {});
  }, []);

  useEffect(() => {
    fetch("http://localhost:5001/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.list || []))
      .catch(() => {});
  }, []);

  const buildOptions = (list, level = 0) =>
    list.flatMap((item) => [
      { value: item.id, label: `${"— ".repeat(level)}${item.name}` },
      ...buildOptions(item.children || [], level + 1),
    ]);

  const allOptions = buildOptions(categories);

  // SET EDIT DATA
  useEffect(() => {
    if (editingItem) {
      setValue("store", editingItem.store || "");
      setValue("productName", editingItem.productName || "");
      setValue("isSerial", editingItem.isSerial?.toString() || "");
      setValue(
        "category",
        editingItem.category?.map((c) => ({ value: c, label: c })) || []
      );
      setValue("brand", editingItem.brand || "");
      setValue("unit", editingItem.unit || "");
      setValue("description", editingItem.description || "");
      setValue("createdBy", editingItem.createdBy || "");
      setPreviews((editingItem.images || []).map((url) => ({ file: null, url })));
    } else {
      reset();
      setPreviews([]);
    }
  }, [editingItem, setValue, reset]);

  const onSubmit = async (data) => {
    const convertToBase64 = (file) =>
      new Promise((resolve) => {
        const reader = new FileReader();
        reader.readAsDataURL(file);
        reader.onload = () => resolve(reader.result);
      });

    const imagesBase64 = await Promise.all(
      previews.map((p) => (p.file ? convertToBase64(p.file) : p.url))
    );

    const finalProduct = {
      ...data,
      category: data.category?.map((c) => c.value) || [],
      images: imagesBase64,
      createdAt: editingItem ? editingItem.createdAt : new Date().toISOString(),
      createdBy: data.createdBy || "Admin", // Default if not provided
    };

    try {
      const url = editingItem
        ? `http://localhost:5001/products/${editingItem.id}`
        : "http://localhost:5001/products";

      const method = editingItem ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(finalProduct),
      });

      if (res.ok) {
        toast.success(editingItem ? "Item Updated!" : "Item Added!");
        reset();
        setPreviews([]);
        closeModal();
        refreshItems();
      }
    } catch {
      toast.error("Failed to save item.");
    }
  };

  return (
    <div className="fixed inset-0 bg-black/40 flex justify-center items-center z-[9999] backdrop-blur-sm">
      <div className="bg-white w-full max-w-4xl rounded-xl p-6 relative max-h-[90vh] overflow-y-auto">

        <button
          onClick={closeModal}
          className="absolute top-3 right-3 text-gray-600 text-2xl"
        >
          ✕
        </button>

        <h2 className="text-2xl font-semibold mb-4">
          {editingItem ? "Edit Item" : "Add Item"}
        </h2>

        <form className="space-y-8" onSubmit={handleSubmit(onSubmit)}>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label>Branch *</label>
              <select {...register("store", { required: true })} className="inputCss">
                <option value="">Select Branch</option>
                {branches.map((b) => (
                  <option key={b.id} value={b.id}>
                    {b.branchName}
                  </option>
                ))}
              </select>
            </div>

            <div>
              <label>Product Name *</label>
              <input {...register("productName", { required: true })} className="inputCss" />
            </div>

            <div>
              <label>Is Serial *</label>
              <select {...register("isSerial", { required: true })} className="inputCss">
                <option value="">Select</option>
                <option value="1">Yes</option>
                <option value="0">No</option>
              </select>
            </div>

            <div>
              <label>Category *</label>
              <Controller
                control={control}
                name="category"
                rules={{ required: true }}
                render={({ field }) => (
                  <Select {...field} isMulti options={allOptions} classNamePrefix="react-select" />
                )}
              />
            </div>

            <div>
              <label>Brand *</label>
              <input {...register("brand", { required: true })} className="inputCss" />
            </div>

            <div>
              <label>Unit *</label>
              <select {...register("unit", { required: true })} className="inputCss">
                <option value="">Select Unit</option>
                <option value="num">Number</option>
                <option value="mtr">Meter</option>
                <option value="lit">Litre</option>
              </select>
            </div>

            <div>
              <label>Created By</label>
              <input {...register("createdBy")} className="inputCss" placeholder="Admin" />
            </div>
          </div>

          <div>
            <label>Description</label>
            <textarea {...register("description")} className="textareaCss" />
          </div>

          <div>
            <label className="border border-dashed h-32 flex justify-center items-center cursor-pointer bg-gray-50">
              + Add Images
              <input type="file" multiple className="hidden" onChange={handleImageSelect} />
            </label>

            {previews.length > 0 && (
              <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mt-3">
                {previews.map((img, index) => (
                  <div key={index} className="relative group">
                    <Image src={img.url} width={300} height={200} className="rounded-lg border" alt="" />
                    <button
                      type="button"
                      onClick={() => setPreviews((prev) => prev.filter((_, i) => i !== index))}
                      className="absolute top-1 right-1 bg-black/60 text-white px-2 rounded text-xs opacity-0 group-hover:opacity-100"
                    >
                      ✕
                    </button>
                  </div>
                ))}
              </div>
            )}
          </div>

          <div className="flex justify-end">
            <button className="bg-green-700 text-white px-6 py-2 rounded-lg">
              {editingItem ? "Update Product" : "Add Product"}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
