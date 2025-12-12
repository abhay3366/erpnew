"use client";

import { useForm, Controller, useWatch, getValues } from "react-hook-form";
import { useEffect, useState } from "react";
import Select from "react-select";

// ⭐ RECURSIVE TREE COMPONENT
function CategoryTree({ data, expanded, toggleExpand, onSelect, level = 0 }) {
  return (
    <div>
      {data.map((cat) => {
        const hasChildren = cat.children?.length > 0;
        const isOpen = expanded.includes(cat.id);

        return (
          <div key={cat.id} style={{ marginLeft: level * 15 }}>
            <div className="flex items-center gap-2 cursor-pointer py-1">
              {hasChildren && (
                <span
                  className="text-sm"
                  onClick={() => toggleExpand(cat.id)}
                >
                  {isOpen ? "▼" : "▶"}
                </span>
              )}

              <span
                className="hover:text-blue-600"
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
                level={level + 1}
              />
            )}
          </div>
        );
      })}
    </div>
  );
}

export default function AddVendor() {
  const { register, handleSubmit, control, setValue, getValues } = useForm();

  const [categoryTree, setCategoryTree] = useState([]);
  const [expanded, setExpanded] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [productOptions, setProductOptions] = useState([]);

  // ⭐ EXPAND/COLLAPSE HANDLER
  const toggleExpand = (id) => {
    setExpanded((prev) =>
      prev.includes(id) ? prev.filter((x) => x !== id) : [...prev, id]
    );
  };

  // ⭐ LOAD CATEGORY TREE + PRODUCTS
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

  // ⭐ CATEGORY SELECTED
const handleCategorySelect = (cat) => {
  setValue(
    "categories",
    (prev = []) => {
      // Avoid duplicates
      const exists = prev.find((c) => c.value === cat.id);
      if (exists) return prev;

      const updated = [...prev, { value: cat.id, label: cat.name }];

      // Filter products based on updated categories
      const products = allProducts
        .filter((p) => {
          const groups = Array.isArray(p.productGroup)
            ? p.productGroup
            : p.productGroup.toString().split(",");

          return groups.some((grpId) =>
            updated.some((c) => c.value.toString() === grpId.toString())
          );
        })
        .map((p) => ({ value: p.id, label: p.productName }));

      setProductOptions(products);
      // Reset product selection
      setValue("products", []);

      return updated;
    },
    { shouldValidate: true }
  );
};

  const onSubmit = (data) => {
    console.log("SUBMITTED:", data);
  };

  return (
    <div className="w-full p-6 bg-gray-50 min-h-screen">
      <h2 className="text-2xl font-semibold mb-4">Add New Vendor</h2>

      <form onSubmit={handleSubmit(onSubmit)} className="grid grid-cols-2 gap-6">

        {/* LEFT SIDE */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Basic Information</h3>

          <div>
            <label>Vendor Name *</label>
            <input {...register("vendorName")} className="w-full border p-2 rounded" />
          </div>

          <div>
            <label>Vendor Address *</label>
            <textarea {...register("vendorAddress")} className="w-full border p-2 rounded" />
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div>
              <label>Phone *</label>
              <input {...register("phone")} className="w-full border p-2 rounded" />
            </div>
            <div>
              <label>Email</label>
              <input {...register("email")} className="w-full border p-2 rounded" />
            </div>
          </div>

          <h3 className="font-semibold text-lg">Status</h3>
          <div className="grid grid-cols-2 gap-4">
            <select {...register("status")} className="border p-2 rounded">
              <option>active</option>
              <option>inactive</option>
            </select>

            <label className="flex items-center gap-2 mt-2">
              <input type="checkbox" {...register("blacklist")} /> Blacklist
            </label>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-4">
          <h3 className="font-semibold text-lg">Category & Product Selection</h3>

          {/* CATEGORY SELECT */}
          <div>
            <label>Select Categories *</label>

            <Controller
              name="categories"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  placeholder="Select Categories"
                  menuPlacement="auto"
                  isMulti
                  value={field.value || []}
                  options={[]} // options empty because we use custom menu
                  components={{
                    Menu: (props) => (
                      <div
                        {...props.innerProps}
                        className="border bg-white rounded shadow p-2 max-h-64 overflow-auto"
                      >
                        <CategoryTree
                          data={categoryTree}
                          expanded={expanded}
                          toggleExpand={toggleExpand}
                          onSelect={handleCategorySelect}
                        />
                      </div>
                    ),
                    IndicatorSeparator: () => null,
                  }}
                />
              )}
            />
          </div>

          {/* PRODUCT SELECT */}
          <div>
            <label>Select Products *</label>

            <Controller
              name="products"
              control={control}
              render={({ field }) => (
                <Select
                  {...field}
                  options={productOptions}
                  isMulti
                  placeholder="Select products..."
                  onChange={(val) => field.onChange(val)}
                />
              )}
            />
          </div>
        </div>

        {/* BUTTONS */}
        <div className="col-span-2 flex justify-end gap-4 mt-4">
          <button className="px-6 py-2 border rounded" type="button">Cancel</button>
          <button className="px-6 py-2 bg-blue-600 text-white rounded" type="submit">
            Create Vendor
          </button>
        </div>

      </form>
    </div>
  );
}
