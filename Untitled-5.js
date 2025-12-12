"use client";

import { useForm, Controller } from "react-hook-form";
import { useEffect, useState } from "react";
import Select from "react-select";

// Recursive Category Tree
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

export default function VendorForm({ fetchVendors, setOpen, editVendor, setEditVendor }) {
    const { register, handleSubmit, control, setValue, getValues } = useForm();
    const [categoryTree, setCategoryTree] = useState([]);
    const [expanded, setExpanded] = useState([]);
    const [allProducts, setAllProducts] = useState([]);
    const [productOptions, setProductOptions] = useState([]);

    const toggleExpand = (id) => {
        setExpanded(prev => (prev.includes(id) ? prev.filter(x => x !== id) : [...prev, id]));
    };

    // Load categories & products
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

    // Pre-fill form if editVendor exists
    useEffect(() => {
        if (!editVendor) return;

        // Fill primitive fields dynamically
        for (const key in editVendor) {
            if (editVendor.hasOwnProperty(key)) {
                const value = editVendor[key];
                if (typeof value !== "object") {
                    setValue(key, value);
                }
            }
        }

        // Categories
        const catValue = (editVendor.categories || []).map(c => ({ value: c.id, label: c.name }));
        setValue("categories", catValue);

        // Products
        const prodValue = (editVendor.products || []).map(p => ({
            value: p.id,
            label: p.name,
            category: p.categories,
        }));
        setValue("products", prodValue);

        // Update product options based on categories
        const products = allProducts
            .filter(p => {
                const groups = Array.isArray(p.productGroup) ? p.productGroup : p.productGroup.toString().split(",");
                return groups.some(grpId => catValue.some(c => c.value.toString() === grpId.toString()));
            })
            .map(p => ({ value: p.id, label: p.productName, category: p.productGroup }));
        setProductOptions(products);

    }, [editVendor, allProducts, setValue]);

    const handleCategorySelect = (cat) => {
        setValue("categories", (prev = []) => {
            const exists = prev.find(c => c.value === cat.id);
            if (exists) return prev;
            const updated = [...prev, { value: cat.id, label: cat.name }];

            // Update productOptions based on selected categories
            const products = allProducts
                .filter(p => {
                    const groups = Array.isArray(p.productGroup) ? p.productGroup : p.productGroup.toString().split(",");
                    return groups.some(grpId => updated.some(c => c.value.toString() === grpId.toString()));
                })
                .map(p => ({ value: p.id, label: p.productName, category: p.productGroup }));
            setProductOptions(products);
            setValue("products", []);
            return updated;
        }, { shouldValidate: true });
    };

    const onSubmit = async (data) => {
        try {
            const productsWithCategory = (data.products || []).map(p => {
                const prod = productOptions.find(po => po.value === p.value);
                return { id: p.value, name: p.label, categories: prod?.category || [] };
            });

            const payload = { ...data, products: productsWithCategory };

            const url = editVendor ? `http://localhost:5001/vendors/${editVendor.id}` : "http://localhost:5001/vendors";
            const method = editVendor ? "PUT" : "POST";

            const response = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload),
            });

            if (response.ok) {
                alert(editVendor ? "Vendor updated successfully!" : "Vendor saved successfully!");
                setOpen(false);
                setEditVendor(null);
                fetchVendors();
            } else {
                alert("Failed to save vendor!");
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
                        {["vendorName","gstinNumber","contactPerson","authorizedSignature","phone","email"].map(field => (
                            <div key={field}>
                                <label className="block mb-1 font-medium">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                <input {...register(field)} placeholder={field} className="w-full p-3 border" />
                            </div>
                        ))}
                        <div className="md:col-span-2">
                            <label className="block mb-1 font-medium">Vendor Address</label>
                            <textarea {...register("vendorAddress")} placeholder="Vendor Address" className="w-full p-3 border" />
                        </div>
                    </div>

                    {/* Bank Info */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        {["bankName","bankAccountNumber","bankAccountType","bankBranchMICR","bankBranchRTGS","bankBranchNEFT"].map(field => (
                            <div key={field}>
                                <label className="block mb-1 font-medium">{field.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}</label>
                                <input {...register(field)} placeholder={field} className="w-full p-3 border" />
                            </div>
                        ))}
                    </div>

                    {/* Status & Blacklist */}
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                        <div>
                            <label className="block mb-1 font-medium">Status</label>
                            <select {...register("status")} className="w-full p-3 border">
                                <option>active</option>
                                <option>inactive</option>
                            </select>
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
                    </div>

                    {/* Products */}
                    <div>
                        <label className="block mb-1 font-medium">Select Products</label>
                        <Controller
                            name="products"
                            control={control}
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
