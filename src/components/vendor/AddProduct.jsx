"use client";

import { useEffect, useState, useRef } from "react";
import { useForm } from "react-hook-form";
import { FaPlus } from "react-icons/fa";
import AddModalCat from "./AddModalCat";
import toast from "react-hot-toast";

export default function AddItem({ fetchProducts, setOpen, editProduct, setEditProduct }) {
  const [warehouses, setWarehouses] = useState([]);
  const [categories, setCategories] = useState([]);

  const {
    register,
    handleSubmit,
    setValue,
    watch,
    reset,
    formState: { errors },
  } = useForm({
    defaultValues: {
      warehouseId: "",
      productGroup: [],
      productName: "",
      slug: "",
      unit: "",
      isSerial: "",
      sku: "",
      image: ""
    },
  });

  const formData = watch();
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [categoryDropdownOpen, setCategoryDropdownOpen] = useState(false);
  const categoryRef = useRef(null);
  const [preview, setPreview] = useState("");

  // Convert file to base64
  const fileToBase64 = (file) =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.readAsDataURL(file);
      reader.onload = () => resolve(reader.result);
      reader.onerror = (err) => reject(err);
    });

  // Paste Image
  const pasteHandler = async (e) => {
    const items = e.clipboardData.items;
    for (let item of items) {
      if (item.type.startsWith("image/")) {
        const base64 = await fileToBase64(item.getAsFile());
        setValue("image", base64);
        setPreview(base64);
        break;
      }
    }
  };

  // File Input
  const handleFileChange = async (e) => {
    const img = e.target.files[0];
    if (!img) return;
    const base64 = await fileToBase64(img);
    setValue("image", base64);
    setPreview(base64);
  };

  // URL Input
  const handleUrlChange = (e) => {
    const url = e.target.value;
    setValue("image", url);
    setPreview(url);
  };

  // Toggle category selection
  const toggleCategory = (id) => {
    const current = watch("productGroup");
    const updated = current.includes(id)
      ? current.filter((x) => x !== id)
      : [...current, id];
    setValue("productGroup", updated);
  };

  // Fetch warehouses
  useEffect(() => {
    fetch("http://localhost:5001/warehouses")
      .then((res) => res.json())
      .then((data) => setWarehouses(data || []));
  }, []);

  // Fetch categories
  useEffect(() => {
    fetch("http://localhost:5001/categories")
      .then((res) => res.json())
      .then((data) => setCategories(data.list || data || []));
  }, []);

  // Close category dropdown when clicking outside
  useEffect(() => {
    const outside = (e) => {
      if (categoryRef.current && !categoryRef.current.contains(e.target)) {
        setCategoryDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", outside);
    return () => document.removeEventListener("mousedown", outside);
  }, []);

  // Flatten categories for display
  const flatten = (arr) =>
    arr.flatMap((c) => [c, ...(c.children ? flatten(c.children) : [])]);

  const getCategoryNames = () =>
    flatten(categories)
      .filter((c) => watch("productGroup").includes(c.id))
      .map((c) => c.name)
      .join(", ");

  // Edit product effect
  useEffect(() => {
    if (editProduct) {
      reset({
        warehouseId: editProduct.warehouseId || "",
        productGroup: editProduct.productGroup || [],
        productName: editProduct.productName || "",
        slug: editProduct.slug || "",
        unit: editProduct.unit || "",
        isSerial: editProduct.isSerial || "",
        sku: editProduct.sku || "",
        image: editProduct.image || ""
      });

      if (editProduct.image) {
        setPreview(editProduct.image);
      }
    }
  }, [editProduct, reset]);

  // Submit handler
  const onSubmit = async (data) => {
    try {
      if (editProduct) {
        const res = await fetch(`http://localhost:5001/products/${editProduct.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data)
        });
        if (!res.ok) {
          toast.error("Error updating product");
          return;
        }
        await fetchProducts();
        toast.success("Product updated!");
        reset();
        setEditProduct(null);
        setPreview("");
        setOpen(false);
      } else {
        const res = await fetch("http://localhost:5001/products", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(data),
        });
        if (!res.ok) {
          toast.error("Error saving product");
          return;
        }
        await fetchProducts();
        toast.success("Product saved!");
        reset();
        setPreview("");
        setOpen(false);
      }
    } catch (error) {
      console.log(error);
      toast.error("Something went wrong");
    }
  };

  return (
    <>
      <form className="max-w-6xl mx-auto bg-white p-6" onSubmit={handleSubmit(onSubmit)}>
        {/* Row 1 */}
        <div className="grid grid-cols-3 gap-6">
          <InputSelect
            label="Select Warehouse"
            options={warehouses.map((b) => ({ value: b.id, label: b.fromWarehouse }))}
            {...register("warehouseId", { required: true })}
            error={errors.warehouseId}
          />

          <Input label="Product Name" {...register("productName", { required: true })} error={errors.productName} />

          <Input label="SKU" {...register("sku", { required: true })} error={errors.sku} />
        </div>

        {/* Product Group */}
      {/* Product Group */}
<div className="mt-4" ref={categoryRef}>
  <label className="text-gray-700 text-sm">Product Group</label>
  <div
    className="h-12 mt-2 flex items-center justify-between border border-gray-300 bg-gray-50 rounded-lg px-3 cursor-pointer"
    onClick={() => setCategoryDropdownOpen(!categoryDropdownOpen)}
  >
    <span className="truncate text-sm">
      {watch("productGroup").length ? getCategoryNames() : "Select Product Group"}
    </span>

    <FaPlus
      className="hover:bg-gray-200 p-1 rounded"
      onClick={(e) => {
        e.stopPropagation();
        setShowCategoryModal(true);
      }}
    />
  </div>

  {categoryDropdownOpen && (
    <div className="absolute bg-white border mt-1 rounded-lg w-full shadow z-50 max-h-64 p-2 overflow-auto">
      {categories.map((cat) => (
        <CatItem
          key={cat.id}
          item={cat}
          level={0}
          selected={watch("productGroup")}
          toggle={(id) => {
            const current = watch("productGroup");
            const updated = current.includes(id)
              ? current.filter((x) => x !== id)
              : [...current, id];
            setValue("productGroup", updated);
          }}
        />
      ))}
    </div>
  )}
</div>


        {/* Row 2 */}
        <div className="grid grid-cols-3 gap-6 mt-4">
          <InputSelect
            label="Is Serial"
            options={[
              { value: "1", label: "Yes" },
              { value: "0", label: "No" },
            ]}
            {...register("isSerial", { required: true })}
            error={errors.isSerial}
          />

          <InputSelect
            label="Unit"
            options={[
              { value: "liter", label: "Liter" },
              { value: "meter", label: "Meter" },
              { value: "pc", label: "Piece" },
            ]}
            {...register("unit", { required: true })}
            error={errors.unit}
          />

          <Input label="Slug" {...register("slug", { required: true })} error={errors.slug} />
        </div>

        {/* Image */}
        <div className="p-4 border rounded-lg mt-6 bg-gray-50">
          <label className="font-medium text-gray-700">Product Image</label>
          <div onPaste={pasteHandler} className="w-40 h-40 mt-3 bg-white border rounded-lg flex items-center justify-center cursor-pointer">
            {preview ? (
              <img src={preview} className="w-full h-full object-cover rounded-lg" />
            ) : (
              <span className="text-xs text-gray-400">Paste/Upload/URL</span>
            )}
          </div>

          <input type="file" accept="image/*" onChange={handleFileChange} className="mt-3" />

          <input
            type="text"
            placeholder="Enter Image URL..."
            value={formData.image.startsWith("data:") ? "" : formData.image}
            onChange={handleUrlChange}
            className="h-11 mt-3 border border-gray-300 rounded-lg px-3 bg-white w-full"
          />
        </div>

        {/* Submit */}
        <button type="submit" className="mt-6 bg-indigo-600 text-white h-12 rounded-lg w-full font-medium hover:bg-indigo-700">
          {editProduct ? "Update Product" : "Add Product"}
        </button>
      </form>

      {showCategoryModal && (
        <AddModalCat
          isOpen={showCategoryModal}
          onClose={() => setShowCategoryModal(false)}
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

/* Reusable Components */
const InputSelect = ({ label, options, error, ...rest }) => (
  <div>
    <label className="text-gray-700 text-sm">{label}</label>
    <select className="h-12 mt-2 border border-gray-300 rounded-lg p-2 w-full bg-gray-50" {...rest}>
      <option value="">Select {label}</option>
      {options.map((o) => (
        <option key={o.value} value={o.value}>
          {o.label}
        </option>
      ))}
    </select>
    {error && <p className="text-red-500 text-xs">Required</p>}
  </div>
);

const Input = ({ label, error, ...rest }) => (
  <div>
    <label className="text-gray-700 text-sm">{label}</label>
    <input className="h-12 mt-2 border border-gray-300 rounded-lg p-2 w-full bg-gray-50" {...rest} />
    {error && <p className="text-red-500 text-xs">Required</p>}
  </div>
);

const CatItem = ({ item, level, selected, toggle }) => {
  const [open, setOpen] = useState(true);
  const isChecked = selected.includes(item.id);

  return (
    <div>
      <div
        style={{ paddingLeft: level * 16 }}
        className="cursor-pointer px-3 py-2 flex justify-between items-center hover:bg-gray-100"
        onClick={() => toggle(item.id)}
      >
        <div className="flex gap-2 items-center">
          <input type="checkbox" checked={isChecked} readOnly />
          <span className="text-sm">{item.name}</span>
        </div>
        {item.children?.length > 0 && (
          <span
            onClick={(e) => {
              e.stopPropagation();
              setOpen(!open);
            }}
          >
            {open ? "▾" : "▸"}
          </span>
        )}
      </div>

      {open &&
        item.children?.map((child) => (
          <CatItem key={child.id} item={child} level={level + 1} selected={selected} toggle={toggle} />
        ))}
    </div>
  );
};
