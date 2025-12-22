"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import { DevTool } from "@hookform/devtools";
import Select from "react-select";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklist", label: "Blacklisted" }
];

const mapStatusToOption = (status) =>
  STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];

const inputClass = "w-full border rounded-lg px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500";
const labelClass = "block text-sm font-medium text-gray-700 mb-1";

export default function VendorForm({ editVendor, onSuccess, setOpen, handleCloseModal }) {
  const defaultFormValues = {
    vendorName: "",
    gstin: "",
    contactPerson: "",
    authorizedSignature: "",
    phone: "",
    email: "",
    address: "",
    bankName: "",
    accountNumber: "",
    accountType: "",
    micr: "",
    rtgs: "",
    neft: "",
    productGroups: [],
    products: [],
    status: "active",
    blacklist: false
  };

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors, isSubmitting } } = useForm({
    defaultValues: defaultFormValues
  });

  const [productGroups, setProductGroups] = useState([]);
  const [products, setProducts] = useState([]);
  const [loading, setLoading] = useState(false);

  const isEdit = !!editVendor;
  const selectedGroups = watch("productGroups") || [];

  // Fetch product groups and products
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);
        
        // Fetch categories
        const categoriesRes = await fetch("http://localhost:5001/categories");
        const categoriesData = await categoriesRes.json();
        
        // Extract allowed categories
        const extractAllowedCategories = (categories) => {
          let result = [];
          categories.forEach(cat => {
            if (cat.allowItemEntry) {
              result.push({
                value: cat.id.toString(),
                label: cat.name
              });
            }
            if (cat.children && cat.children.length > 0) {
              result = result.concat(extractAllowedCategories(cat.children));
            }
          });
          return result;
        };
        
        const allowedGroups = extractAllowedCategories(categoriesData.list || []);
        setProductGroups(allowedGroups);
        
        // Fetch products
        const productsRes = await fetch("http://localhost:5001/products");
        const productsData = await productsRes.json();
        setProducts(productsData || []);
        
      } catch (error) {
        console.error("Error fetching data:", error);
        toast.error("Failed to load product data");
      } finally {
        setLoading(false);
      }
    };
    
    fetchData();
  }, []);

  // Reset form when editVendor changes
  useEffect(() => {
    if (!editVendor) {
      reset(defaultFormValues);
      return;
    }

    // Wait for data to load
    if (loading || products.length === 0 || productGroups.length === 0) return;

    // Map product groups
    const mappedGroups = (editVendor.productGroups || []).map(pg => {
      const foundGroup = productGroups.find(g => g.value === pg.id?.toString());
      return foundGroup || { value: pg.id?.toString(), label: pg.name || pg.label };
    });

    // Map products
    const mappedProducts = (editVendor.products || []).map(p => {
      const foundProduct = products.find(pr => pr.id === p.id);
      return foundProduct
        ? { value: foundProduct.id.toString(), label: foundProduct.productName || p.name }
        : { value: p.id?.toString(), label: p.name || p.label };
    });

    reset({
      ...editVendor,
      productGroups: mappedGroups,
      products: mappedProducts,
      status: editVendor.status || "active",
      blacklist: editVendor.blacklist || false
    });
    
  }, [editVendor, products, productGroups, loading, reset]);

  // Filter products based on selected groups
  const selectedGroupIds = selectedGroups.map(g => g.value);
  const filteredProducts = products
    .filter(product => selectedGroupIds.includes(product.productGroupId?.toString()))
    .map(product => ({
      value: product.id.toString(),
      label: product.productName
    }));

  // Duplicate check
  const isDuplicate = async (data) => {
    try {
      const res = await fetch("http://localhost:5001/vendors");
      const vendorList = await res.json();
      
      const normalize = (v) => (v || "").toString().trim().toLowerCase();
      
      for (const v of vendorList) {
        // Skip the current vendor in edit mode
        if (isEdit && v.id === editVendor.id) continue;
        
        if (normalize(v.phone) === normalize(data.phone)) return "phone";
        if (normalize(v.email) === normalize(data.email)) return "email";
        if (normalize(v.gstin) === normalize(data.gstin)) return "gstin";
        if (normalize(v.authorizedSignature) === normalize(data.authorizedSignature)) return "authorizedSignature";
      }
      
      return false;
    } catch (err) {
      console.error("Duplicate check error:", err);
      return false;
    }
  };

  // Submit handler
  const onSubmit = async (data) => {
    try {
      // Check for duplicates
      const duplicateField = await isDuplicate(data);
      if (duplicateField) {
        const messages = {
          phone: "Phone number already exists",
          email: "Email already exists",
          gstin: "GSTIN already exists",
          authorizedSignature: "Authorized signature already exists",
        };
        toast.error(messages[duplicateField] || "Duplicate vendor detected");
        return;
      }

      // Prepare payload for JSON Server
      const payload = {
        ...data,
        productGroups: data.productGroups.map(group => ({
          id: group.value,
          name: group.label
        })),
        products: data.products.map(product => ({
          id: product.value,
          name: product.label
        })),
        status: data.status,
        blacklist: data.status === "blacklist",
        updated_at: new Date().toISOString()
      };

      // Add creation date for new vendors
      if (!isEdit) {
        payload.created_at = new Date().toISOString();
        payload.created_by = "admin";
      }

      console.log("Submitting payload:", payload);

      // Send to JSON Server
      const url = isEdit 
        ? `http://localhost:5001/vendors/${editVendor.id}`
        : "http://localhost:5001/vendors";
      
      const method = isEdit ? "PUT" : "POST";

      const response = await fetch(url, {
        method,
        headers: {
          "Content-Type": "application/json"
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Server error: ${response.status} - ${errorText}`);
      }

      const result = await response.json();
      console.log("Success:", result);

      // Show success message
      toast.success(isEdit ? "Vendor updated successfully!" : "Vendor created successfully!");

      // Close modal and refresh data
      if (onSuccess) onSuccess();
      handleCloseModal();
      
    } catch (error) {
      console.error("Error saving vendor:", error);
      toast.error(error.message || "Failed to save vendor");
    }
  };

  return (
    <>
    <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
      {/* BASIC DETAILS */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">🥇 Vendor Basic Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "vendorName", label: "Vendor Name *", type: "text" },
            { name: "gstin", label: "GSTIN Number *", type: "text" },
            { name: "contactPerson", label: "Contact Person *", type: "text" },
            { name: "authorizedSignature", label: "Authorized Signature *", type: "text" },
            { name: "phone", label: "Phone Number *", type: "tel" },
            { name: "email", label: "Email Address *", type: "email" }
          ].map((field) => (
            <div key={field.name}>
              <label className={labelClass}>{field.label}</label>
              <input
                type={field.type}
                {...register(field.name, { required: `${field.label.replace(' *', '')} is required` })}
                className={inputClass}
                disabled={isSubmitting}
              />
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[field.name].message}</p>
              )}
            </div>
          ))}
        </div>
        <div className="mt-4">
          <label className={labelClass}>Vendor Address *</label>
          <textarea
            {...register("address", { required: "Address is required" })}
            rows="3"
            className={inputClass}
            disabled={isSubmitting}
          />
          {errors.address && <p className="mt-1 text-sm text-red-600">{errors.address.message}</p>}
        </div>
      </div>

      {/* BANK DETAILS */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">🥈 Bank Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          {[
            { name: "bankName", label: "Bank Name *", type: "text" },
            { name: "accountNumber", label: "Account Number *", type: "text" },
            { name: "micr", label: "MICR Code *", type: "text" },
            { name: "rtgs", label: "RTGS Code *", type: "text" },
            { name: "neft", label: "NEFT Code *", type: "text" }
          ].map((field) => (
            <div key={field.name}>
              <label className={labelClass}>{field.label}</label>
              <input
                type={field.type}
                {...register(field.name, { required: `${field.label.replace(' *', '')} is required` })}
                className={inputClass}
                disabled={isSubmitting}
              />
              {errors[field.name] && (
                <p className="mt-1 text-sm text-red-600">{errors[field.name].message}</p>
              )}
            </div>
          ))}
          <div>
            <label className={labelClass}>Account Type *</label>
            <select
              {...register("accountType", { required: "Account Type is required" })}
              className={inputClass}
              disabled={isSubmitting}
            >
              <option value="">Select Account Type</option>
              <option value="saving">Saving</option>
              <option value="current">Current</option>
            </select>
            {errors.accountType && <p className="mt-1 text-sm text-red-600">{errors.accountType.message}</p>}
          </div>
        </div>
      </div>

      {/* PRODUCTS */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">📦 Product Group & Products</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Product Group *</label>
            <Controller
              name="productGroups"
              control={control}
              rules={{ required: "Product Group is required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  options={productGroups}
                  isLoading={loading}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isDisabled={isSubmitting}
                />
              )}
            />
            {errors.productGroups && <p className="mt-1 text-sm text-red-600">{errors.productGroups.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Select Products *</label>
            <Controller
              name="products"
              control={control}
              rules={{ required: "Products are required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  isMulti
                  options={filteredProducts}
                  isLoading={loading}
                  className="react-select-container"
                  classNamePrefix="react-select"
                  isDisabled={isSubmitting || selectedGroups.length === 0}
                  placeholder={selectedGroups.length === 0 ? "Select product groups first" : "Select products"}
                />
              )}
            />
            {errors.products && <p className="mt-1 text-sm text-red-600">{errors.products.message}</p>}
          </div>
        </div>
      </div>

      {/* STATUS */}
      <div className="bg-white rounded-xl border p-6">
        <h2 className="text-lg font-semibold mb-4 text-gray-800">📊 Vendor Status</h2>
        <div>
          <label className={labelClass}>Status *</label>
          <Controller
            name="status"
            control={control}
            rules={{ required: "Status is required" }}
            render={({ field }) => (
              <Select
                options={STATUS_OPTIONS}
                value={mapStatusToOption(field.value)}
                onChange={(option) => field.onChange(option.value)}
                className="react-select-container"
                classNamePrefix="react-select"
                isDisabled={isSubmitting}
              />
            )}
          />
          {errors.status && <p className="mt-1 text-sm text-red-600">{errors.status.message}</p>}
        </div>
      </div>

      {/* SUBMIT BUTTON */}
      <div className="flex justify-end gap-3 pt-4 border-t">
        <button
          type="button"
          onClick={handleCloseModal}
          className="px-6 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
          disabled={isSubmitting}
        >
          Cancel
        </button>
        <button
          type="submit"
          disabled={isSubmitting}
          className="px-6 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed"
        >
          {isSubmitting ? (
            <span className="flex items-center">
              <svg className="animate-spin -ml-1 mr-2 h-4 w-4 text-white" fill="none" viewBox="0 0 24 24">
                <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4" />
                <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z" />
              </svg>
              {isEdit ? "Updating..." : "Creating..."}
            </span>
          ) : (
            isEdit ? "Update Vendor" : "Create Vendor"
          )}
        </button>
      </div>
    </form>
    <DevTool control={control} />
    </>
  );
}