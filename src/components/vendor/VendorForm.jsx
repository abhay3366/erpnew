"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import Select from "react-select";
import toast from "react-hot-toast";

function CategoryTree({ data, expanded, toggleExpand, onSelect, selected, level = 0 }) {
  return (
    <div>
      {data.map((cat) => {
        const hasChildren = cat.children?.length > 0;
        const isOpen = expanded.includes(cat.id);
        const isSelected = selected?.some((c) => c.value === cat.id);

        return (
          <div key={cat.id} style={{ marginLeft: level * 15 }}>
            <div className="flex items-center gap-2 cursor-pointer py-1">
              {hasChildren && (
                <span className="text-sm" onClick={() => toggleExpand(cat.id)}>
                  {isOpen ? "▼" : "▶"}
                </span>
              )}
              <span
                className={`hover:text-blue-600 ${isSelected ? "font-semibold text-blue-600" : ""}`}
                onClick={() => onSelect(cat)}
              >
                {cat.name}
              </span>
            </div>
            {isOpen && hasChildren && (
              <CategoryTree
                data={cat.children}
                expanded={expanded}
                toggleExpand={toggleExpand}
                onSelect={onSelect}
                selected={selected}
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function VendorForm({ fetchVendors, setOpen, editVendor, setEditVendor, setVendors, vendors }) {
  const { register, handleSubmit, control, setValue, getValues, formState: { errors } } = useForm();
  const [categoryTree, setCategoryTree] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  const toggleExpand = (id) => {
    setExpanded(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
  };

  // Fetch categories & products
  useEffect(() => {
    const loadData = async () => {
      const catRes = await fetch("http://localhost:5001/categories");
      const catData = await catRes.json();

      const prodRes = await fetch("http://localhost:5001/products");
      const productData = await prodRes.json();

      setCategoryTree(catData.list);
      setAllProducts(productData);
    };
    loadData();
  }, []);

  // Populate form when editing
  useEffect(() => {
    if (!editVendor) return;

    // Fill basic fields
    Object.keys(editVendor).forEach(key => {
      if (typeof editVendor[key] !== "object") setValue(key, editVendor[key]);
    });

    // Categories
    const catValue = (editVendor.categories || []).map(c => ({ value: c.id, label: c.name }));
    setValue("categories", catValue);

    // Products
    const prodValue = (editVendor.products || []).map(p => ({
      value: p.id,
      label: p.name,
      isSerial: p.isSerial || 0,
      category: p.productGroup || [],
    }));
    setValue("products", prodValue);

    // Filter products based on selected categories
    const filteredProducts = allProducts
      .filter(p => {
        const groups = Array.isArray(p.productGroup) ? p.productGroup : [p.productGroup];
        return groups.some(grpId => catValue.some(c => c.value.toString() === grpId.toString()));
      })
      .map(p => ({
        value: p.id,
        label: p.productName,
        category: p.productGroup,
        isSerial: p.isSerial || 0
      }));
    setProductOptions(filteredProducts);
  }, [editVendor, allProducts, setValue]);

  // Handle category selection
  const handleCategorySelect = (cat) => {
    setValue("categories", (prev = []) => {
      const exists = prev.find(c => c.value === cat.id);
      if (exists) return prev;
      const updated = [...prev, { value: cat.id, label: cat.name }];

      const products = allProducts
        .filter(p => {
          const groups = Array.isArray(p.productGroup) ? p.productGroup : [p.productGroup];
          return groups.some(grpId => updated.some(c => c.value.toString() === grpId.toString()));
        })
        .map(p => ({
          value: p.id,
          label: p.productName,
          category: p.productGroup,
          isSerial: p.isSerial || 0
        }));

      setProductOptions(products);
      setValue("products", []); // reset selected products
      return updated;
    }, { shouldValidate: true });
  };

  // Submit form
  const onSubmit = async (data) => {
    try {
      const productsWithCategory = (data.products || []).map(p => {
        const prod = productOptions.find(po => po.value === p.value);
        return {
          id: p.value,
          name: p.label,
          productGroup: prod?.category || [],
          isSerial: prod?.isSerial || 0
        };
      });

      const payload = { ...data, products: productsWithCategory };
      console.log("🚀 Payload:", payload);

      const url = editVendor ? `http://localhost:5001/vendors/${editVendor.id}` : "http://localhost:5001/vendors";
      const method = editVendor ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        const savedVendor = await response.json();
        if (editVendor) {
          setVendors(prev => prev.map(v => v.id === savedVendor.id ? savedVendor : v));
          toast.success("Vendor updated successfully!");
        } else {
          setVendors(prev => [...prev, savedVendor]);
          toast.success("Vendor added successfully!");
        }
        setOpen(false);
        setEditVendor(null);
      } else {
        toast.error("Failed to save vendor!");
      }
    } catch (err) {
      console.error(err);
    
    }
  };

  const selectedCategories = getValues("categories") || [];

  return (
    <div className="min-h-screen p-6 flex justify-center">
      <div className="w-full">
        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6 p-6 bg-white rounded shadow">

          {/* Vendor Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "vendorName", label: "Vendor Name", required: true },
              { name: "gstinNumber", label: "GSTIN Number", required: true },
              { name: "contactPerson", label: "Contact Person", required: true },
              { name: "authorizedSignature", label: "Authorized Signature", required: false },
              { name: "phone", label: "Phone", required: true, pattern: /^[0-9]{10}$/ },
              { name: "email", label: "Email", required: true, pattern: /^[^\s@]+@[^\s@]+\.[^\s@]+$/ }
            ].map(field => (
              <div key={field.name}>
                <label className="block mb-1 font-medium">{field.label}</label>
                <input
                  {...register(field.name, {
                    required: field.required && `${field.label} is required`,
                    pattern: field.pattern && { value: field.pattern, message: `Invalid ${field.label}` }
                  })}
                  placeholder={field.label}
                  className="w-full p-3 border"
                />
                {errors[field.name] && <p className="text-red-600 text-sm mt-1">{errors[field.name]?.message}</p>}
              </div>
            ))}
            <div className="md:col-span-2">
              <label className="block mb-1 font-medium">Vendor Address</label>
              <textarea
                {...register("vendorAddress", { required: "Vendor Address is required" })}
                placeholder="Vendor Address"
                className="w-full p-3 border"
              />
              {errors.vendorAddress && <p className="text-red-600 text-sm mt-1">{errors.vendorAddress.message}</p>}
            </div>
          </div>

          {/* Bank Info */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {[
              { name: "bankName", label: "Bank Name" },
              { name: "bankAccountNumber", label: "Account Number", pattern: /^[0-9]+$/ },
              { name: "bankAccountType", label: "Account Type" },
              { name: "bankBranchMICR", label: "MICR" },
              { name: "bankBranchRTGS", label: "RTGS" },
              { name: "bankBranchNEFT", label: "NEFT" }
            ].map(field => (
              <div key={field.name}>
                <label className="block mb-1 font-medium">{field.label}</label>
                <input
                  {...register(field.name, {
                    required: `${field.label} is required`,
                    pattern: field.pattern && { value: field.pattern, message: `Invalid ${field.label}` }
                  })}
                  placeholder={field.label}
                  className="w-full p-3 border"
                />
                {errors[field.name] && <p className="text-red-600 text-sm mt-1">{errors[field.name]?.message}</p>}
              </div>
            ))}
          </div>

          {/* Status & Blacklist */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block mb-1 font-medium">Status</label>
              <select {...register("status", { required: "Status is required" })} className="w-full p-3 border">
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
              </select>
              {errors.status && <p className="text-red-600 text-sm mt-1">{errors.status.message}</p>}
            </div>
            <div className="flex items-center mt-6 gap-2">
              <input
                type="checkbox"
                {...register("blacklist")}
                onChange={e => {
                  setValue("blacklist", e.target.checked);
                  if (e.target.checked) setValue("status", "inactive");
                }}
              />
              <label className="font-medium">Blacklist</label>
            </div>
          </div>

          {/* Categories */}
          <div>
            <label className="block mb-1 font-medium">Select Categories</label>
            <Controller
              name="categories"
              control={control}
              rules={{ required: "Select at least one category" }}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  placeholder="Select Categories"
                  value={field.value || []}
                  options={[]}
                  components={{
                    Menu: (props) => (
                      <div {...props.innerProps} className="border bg-white rounded shadow p-2 max-h-64 overflow-auto">
                        <CategoryTree
                          data={categoryTree}
                          expanded={expanded}
                          toggleExpand={toggleExpand}
                          onSelect={handleCategorySelect}
                          selected={field.value || []}
                        />
                      </div>
                    ),
                    IndicatorSeparator: () => null,
                  }}
                />
              )}
            />
            {errors.categories && <p className="text-red-600 text-sm mt-1">{errors.categories.message}</p>}
          </div>

          {/* Products */}
          <div>
            <label className="block mb-1 font-medium">Select Products</label>
            <Controller
              name="products"
              control={control}
              rules={{ required: "Select at least one product" }}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  placeholder="Select Products"
                  options={productOptions}
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
            {errors.products && <p className="text-red-600 text-sm mt-1">{errors.products.message}</p>}
          </div>

          {/* Buttons */}
          <div className="flex justify-end gap-4 mt-4">
            <button type="button" className="px-6 py-2 border rounded hover:bg-gray-100" onClick={() => setOpen(false)}>Cancel</button>
            <button type="submit" className="px-6 py-2 bg-blue-600 text-white rounded hover:bg-blue-700">
              {editVendor ? "Update Vendor" : "Create Vendor"}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
}
