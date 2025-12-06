"use client";

import { useEffect, useState, useRef } from "react";
import { FaPlus } from "react-icons/fa";
import Add from "./AddModalCat";
import AddModalCat from "./AddModalCat";

export default function AddItem() {
  const [branches, setBranches] = useState([]);
  const [categories, setCategories] = useState([]);
  const [formData, setFormData] = useState({
    store: "",
    category: [],
    productName: "",
    slug: "",
    unit: "",
    isSerial: "",
    sku: "",
    image: "", // base64 stored here
  });

  const [showCategoryModal, setshowCategoryModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryRef = useRef(null);

  const [preview, setPreview] = useState(""); // For live preview

  // Convert file to base64
  const fileToBase64 = (file) => {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (error) => reject(error);
    });
  };

  // Paste image support
  const pasteHandler = async (e) => {
    const items = e.clipboardData.items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.startsWith("image/")) {
        const blob = items[i].getAsFile();
        const base64 = await fileToBase64(blob);
        setFormData({ ...formData, image: base64 });
        setPreview(base64);
        break;
      }
    }
  };

  // File select
  const handleFileChange = async (e) => {
    const img = e.target.files[0];
    if (img) {
      const base64 = await fileToBase64(img);
      setFormData({ ...formData, image: base64 });
      setPreview(base64);
    }
  };

  // URL input
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setFormData({ ...formData, image: url });
    setPreview(url);
  };

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const toggleCategory = (id) => {
    setFormData((prev) => ({
      ...prev,
      category: prev.category.includes(id)
        ? prev.category.filter((cid) => cid !== id)
        : [...prev.category, id],
    }));
  };

  useEffect(() => {
    fetch("http://localhost:5001/branches")
      .then((res) => res.json())
      .then((data) => setBranches(data || []));
  }, []);

  useEffect(() => {
    fetch("http://localhost:5001/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.list || data || []));
  }, []);

  useEffect(() => {
    const handleClickOutside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const CategoryItem = ({ item, level }) => {
    const [expanded, setExpanded] = useState(true);
    const isSelected = formData.category.includes(item.id);

    return (
      <div>
        <div
          style={{ paddingLeft: `${level * 16}px` }}
          className="cursor-pointer px-3 py-2 flex justify-between items-center hover:bg-gray-100"
          onClick={() => toggleCategory(item.id)}
        >
          <div className="flex gap-2 items-center">
            <input type="checkbox" checked={isSelected} readOnly />
            <span className="text-sm">{item.name}</span>
          </div>
          {item.children?.length > 0 && (
            <span
              onClick={(e) => {
                e.stopPropagation();
                setExpanded(!expanded);
              }}
            >
              {expanded ? "▾" : "▸"}
            </span>
          )}
        </div>
        {expanded &&
          item.children?.map((child) => (
            <CategoryItem key={child.id} item={child} level={level + 1} />
          ))}
      </div>
    );
  };

  const getSelectedCategoryNames = () => {
    const flatten = (arr) =>
      arr.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);
    return flatten(categories)
      .filter((c) => formData.category.includes(c.id))
      .map((c) => c.name)
      .join(", ");
  };

  // Submit JSON
  const handleSubmit = async (e) => {
    e.preventDefault();

    await fetch("http://localhost:5001/products", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(formData),
    });

    alert("Product saved successfully! 🎯");

    // Reset form
    setFormData({
      store: "",
      category: [],
      productName: "",
      
      slug: "",
      unit: "",
      isSerial: "",
      sku: "",
      image: "",
    });
    setPreview("");
  };

  return (
    <>
      <form
        className="max-w-6xl mx-auto bg-white "
        onSubmit={handleSubmit}
      >
        

        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          <InputSelect
            label="Warehouse"
            name="store"
            value={formData.store}
            onChange={handleChange}
            options={branches.map((b) => ({ value: b.id, label: b.branchName }))}
          />
          <Input
            label="Product Name"
            name="productName"
            value={formData.productName}
            onChange={handleChange}
          />
         
          <Input label="SKU" name="sku" value={formData.sku} onChange={handleChange} />
        </div>

        {/* Category */}
        <div className="mt-4" ref={categoryRef}>
          <label className="text-gray-700 text-sm">Product Group</label>
          <div
            className="h-12 mt-2 flex items-center justify-between border border-gray-300 bg-gray-50 rounded-lg px-3 cursor-pointer"
            onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
          >
            <span className="truncate text-sm">
              {formData.category.length
                ? getSelectedCategoryNames()
                : "Select Product Group"}
            </span>
            <FaPlus
              className="hover:bg-gray-200 p-1 rounded"
              onClick={(e) => {
                e.stopPropagation();
                setshowCategoryModal(true);
              }}
            />
          </div>

          {categoryDropdownOpen && (
            <div className="absolute w-full bg-white border mt-1 rounded-lg shadow z-50 max-h-64 overflow-auto">
              {categories.map((cat) => (
                <CategoryItem key={cat.id} item={cat} level={0} />
              ))}
            </div>
          )}
        </div>

        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-6 mt-4">
          <InputSelect
            label="Is Serial"
            name="isSerial"
            value={formData.isSerial}
            onChange={handleChange}
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
          />
          <InputSelect
            label="Unit"
            name="unit"
            value={formData.unit}
            onChange={handleChange}
            options={[
              { value: "liter", label: "Liter" },
              { value: "meter", label: "Meter" },
              { value: "pc", label: "Piece" },
            ]}
          />
          <Input
            label="Slug"
            name="slug"
            value={formData.slug}
            onChange={handleChange}
          />
        </div>

      

        {/* Image */}
        <div className="p-4 border rounded-lg mt-6 bg-gray-50">
          <label className="font-medium text-gray-700">Product Image</label>
          <div
            onPaste={pasteHandler}
            className="w-40 h-40 mt-3 bg-white border rounded-lg flex items-center justify-center cursor-pointer"
          >
            {preview ? (
              <img src={preview} className="w-full h-full object-cover rounded-lg" alt="Preview" />
            ) : (
              <span className="text-xs text-gray-400 text-center px-2">
                Paste, Upload or Enter URL
              </span>
            )}
          </div>

          <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3" />
          <input
            type="text"
            placeholder="Enter Image URL..."
            value={formData.image.startsWith("data:") ? "" : formData.image}
            onChange={(e) => handleUrlChange(e)}
            className="h-11 mt-3 border border-gray-300 rounded-lg px-3 bg-white w-full"
          />
        </div>

        {/* Submit */}
        <button
          type="submit"
          className="mt-6 bg-indigo-600 text-white h-12 rounded-lg w-full font-medium hover:bg-indigo-700"
        >
          Submit Product
        </button>
      </form>

      {showCategoryModal && (
        <AddModalCat
          isOpen={showCategoryModal}
          onClose={() => setshowCategoryModal(false)}
          onCategoryAdded={async () => {
            const res = await fetch("http://localhost:5001/categories");
            const data = await res.json();
            setCategories(data.list || []);
          }}
        />
      )}
    </>
  );
}

/* Input Components */
const InputSelect = ({ label, name, value, onChange, options }) => (
  <div>
    <label className="text-gray-700 text-sm">{label}</label>
    <select
      name={name}
      value={value}
      onChange={onChange}
      className="h-12 mt-2 border border-gray-300 rounded-lg p-2 w-full bg-gray-50"
    >
      <option value="">Select {label}</option>
      {options.map((opt) => (
        <option key={opt.value} value={opt.value}>
          {opt.label}
        </option>
      ))}
    </select>
  </div>
);

const Input = ({ label, name, value, onChange, type = "text" }) => (
  <div>
    <label className="text-gray-700 text-sm">{label}</label>
    <input
      type={type}
      name={name}
      value={value}
      onChange={onChange}
      className="h-12 mt-2 border border-gray-300 rounded-lg p-2 w-full bg-gray-50"
    />
  </div>
);
