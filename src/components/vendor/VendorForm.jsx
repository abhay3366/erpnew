"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import toast from "react-hot-toast";

const STATUS_OPTIONS = [
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "blacklist", label: "Blacklisted" }
];
const mapStatusToOption = (status) =>
  STATUS_OPTIONS.find(opt => opt.value === status) || STATUS_OPTIONS[0];
const inputClass =
  "w-full border rounded-lg px-3 py-2 text-sm focus:outline-none focus:ring-2 focus:ring-black";

const labelClass = "text-sm font-medium text-gray-700";

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
    status: "active"
  };

  const { register, handleSubmit, control, reset, watch, setValue, formState: { errors } } = useForm({
    defaultValues: defaultFormValues
  });

  const [productGroups, setProductGroups] = useState([]);
  const [products, setProducts] = useState([]);

  const isEdit = !!editVendor;
  const selectedGroups = watch("productGroups") || [];

  /* ---------- FETCH DATA ---------- */
  const extractAllowedCategories = (categories) => {
    let result = [];

    categories.forEach(cat => {
      // agar current category allowed hai
      if (cat.allowItemEntry) {
        result.push({
          value: cat.id,
          label: cat.name
        });
      }

      // agar children hain to unko bhi check karo
      if (cat.children && cat.children.length > 0) {
        result = result.concat(extractAllowedCategories(cat.children));
      }
    });

    return result;
  };
  useEffect(() => {
    fetch("http://localhost:5001/categories")
      .then(res => res.json())
      .then(data => {
        const allowedGroups = extractAllowedCategories(data.list);
        setProductGroups(allowedGroups);
      });

    fetch("http://localhost:5001/products")
      .then(res => res.json())
      .then(setProducts);
  }, []);


  useEffect(() => {
    // agar koi product group select hi nahi hai
    if (!selectedGroups || selectedGroups.length === 0) {
      setValue("products", []);
      return;
    }

    // selected group ids
    const selectedGroupIds = selectedGroups.map(g => String(g.value));

    // valid products jo selected groups se belong karte hain
    const validProducts = products
      .filter(p =>
        selectedGroupIds.includes(String(p.productGroupId))
      )
      .map(p => ({
        value: p.id,
        label: p.productName
      }));

    // jo products already selected hain unme se
    // sirf wahi rakho jo abhi bhi valid hain
    setValue("products", (prevProducts = []) =>
      prevProducts.filter(sel =>
        validProducts.some(v => v.value === sel.value)
      )
    );

  }, [selectedGroups, products, setValue]);


  // useEffect(() => {
  //   fetch("http://localhost:5001/categories")
  //     .then(res => res.json())
  //     .then(data =>
  //       setProductGroups(data.list.map(c => ({ value: c.id, label: c.name })))
  //     );

  //   fetch("http://localhost:5001/products")
  //     .then(res => res.json())
  //     .then(setProducts);
  // }, []);


  /* ---------- RESET FORM ON EDIT OR ADD NEW ---------- */
  useEffect(() => {
    if (!editVendor) {
      reset(defaultFormValues);
      return;
    }

    // products & productGroups load hone ka wait
    if (products.length === 0 || productGroups.length === 0) return;

    // const editStatus=editVendor.status?.map((el)=>({
    //   value:el.name,
    //   label:el.va
    // }))

    const mappedGroups = editVendor.productGroups?.map(pg => ({
      value: pg.id,
      label: pg.name
    })) || [];

    const mappedProducts = editVendor.products
      ?.map(p => {
        const found = products.find(pr => pr.id === p.id);
        return found
          ? { value: found.id, label: found.productName }
          : null;
      })
      .filter(Boolean) || [];

    reset({
      ...editVendor,
      productGroups: mappedGroups,
      products: mappedProducts,
      status: editVendor.status || "active"
    });

  }, [editVendor, products, productGroups, reset]);


  /* ---------- DUPLICATE CHECK ---------- */
  const normalize = (v) => (v || "").toString().trim().toLowerCase();

  const isDuplicate = async (data) => {
    try {
      const res = await fetch("http://localhost:5001/vendors");
      const vendorList = await res.json();

      for (const v of vendorList) {
        if (isEdit && v.id === editVendor.id) continue;
        if (normalize(v.phone) === normalize(data.phone)) return "phone";
        if (normalize(v.email) === normalize(data.email)) return "email";
        if (normalize(v.gstin) === normalize(data.gstin)) return "gstin";
        if (normalize(v.authorizedSignature) === normalize(data.authorizedSignature)) return "authorizedSignature";
        if (normalize(v.accountNumber) === normalize(data.accountNumber)) return "accountNumber";
        if (normalize(v.micr) === normalize(data.micr)) return "micr";
        if (normalize(v.rtgs) === normalize(data.rtgs)) return "rtgs";
        if (normalize(v.neft) === normalize(data.neft)) return "neft";
      }

      return false;
    } catch (err) {
      console.error("Duplicate check error:", err);
      return false;
    }
  };

  /* ---------- SUBMIT ---------- */
  const onSubmit = async (data) => {
    const duplicateField = await isDuplicate(data);
    if (duplicateField) {
      const messages = {
        phone: "Phone number already exists",
        email: "Email already exists",
        gstin: "GSTIN already exists",
        authorizedSignature: "Authorized signature already exists",
        accountNumber: "Account number already exists",
        micr: "MICR code already exists",
        rtgs: "RTGS code already exists",
        neft: "NEFT code already exists",
      };
      alert(messages[duplicateField] || "Duplicate vendor detected");
      return;
    }

    const generateRandomId = () => Math.floor(Math.random() * 1000000);



    const payload = {
      ...data,

      productGroups: Array.isArray(data.productGroups)
        ? data.productGroups.map(group => ({
          id: group.value,
          name: group.label
        }))
        : [],

      products: Array.isArray(data.products)
        ? data.products.map(product => ({
          id: product.value,
          name: product.label
        }))
        : [],

      id: isEdit ? editVendor.id : generateRandomId(),
      status: data.status || "active",
      isDeleted: false,
      created_at: isEdit ? editVendor.created_at : new Date().toISOString(),
      updated_at: new Date().toISOString(),
      created_by: "admin"
    };

    console.log("🚀 ~ onSubmit ~ payload:", payload)



    try {
      const url = isEdit
        ? `http://localhost:5001/vendors/${editVendor.id}`
        : "http://localhost:5001/vendors";
      const method = isEdit ? "PUT" : "POST";

      const res = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload)
      });

      if (!res.ok) throw new Error("Failed to save vendor");

      await res.json();

      toast.success(isEdit ? "Vendor Updated" : "Vendor Created");

      // Reset form to default after submit (both edit & add)
      handleCloseModal()
      reset(defaultFormValues);
      setOpen(false);
      onSuccess?.();
    } catch (err) {
      console.error("Error saving vendor:", err);
      toast.error(err.message || "Something went wrong");
    }
  };

  /* ---------- FILTER PRODUCTS BASED ON SELECTED GROUPS ---------- */
  const selectedGroupIds = selectedGroups.map(g => Number(g.value));
  // console.log("🚀 ~ VendorForm ~ selectedGroupIds:", selectedGroupIds)
  // console.log("🚀 ~ VendorForm ~ products:", products)


  const groupBasedProducts = products.filter(product => {
    // console.log("🚀 ~ VendorForm ~ product:", product)
    // console.log("Sdfs",product.productGroupId)
    return selectedGroupIds.includes(Number(product.productGroupId));
  });

  // console.log("🚀 ~ VendorForm ~ groupBasedProducts:", groupBasedProducts)

  const filteredProducts = groupBasedProducts.map(product => ({
    value: product.id,
    label: product.productName,
  }));
  // console.log("🚀 ~ VendorForm ~ filteredProducts:", filteredProducts)




  // console.log("🚀 ~ VendorForm ~ filteredProducts:", filteredProducts)

  return (
    <form onSubmit={handleSubmit(onSubmit)} className="max-w-5xl mx-auto space-y-8">
      {/* BASIC DETAILS */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">🥇 Vendor Basic Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Vendor Name *</label>
            <input {...register("vendorName", { required: "Vendor Name is required" })} className={inputClass} />
            {errors.vendorName && <p className="text-red-500">{errors.vendorName.message}</p>}
          </div>
          <div>
            <label className={labelClass}>GSTIN Number *</label>
            <input {...register("gstin", { required: "GSTIN is required" })} className={inputClass} />
            {errors.gstin && <p className="text-red-500">{errors.gstin.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Contact Person *</label>
            <input {...register("contactPerson", { required: "Contact Person is required" })} className={inputClass} />
            {errors.contactPerson && <p className="text-red-500">{errors.contactPerson.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Authorized Signature *</label>
            <input {...register("authorizedSignature", { required: "Authorized Signature is required" })} className={inputClass} />
            {errors.authorizedSignature && <p className="text-red-500">{errors.authorizedSignature.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Phone Number *</label>
            <input {...register("phone", { required: "Phone number is required" })} className={inputClass} />
            {errors.phone && <p className="text-red-500">{errors.phone.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Email Address *</label>
            <input {...register("email", { required: "Email is required" })} className={inputClass} />
            {errors.email && <p className="text-red-500">{errors.email.message}</p>}
          </div>
        </div>
        <div className="mt-4">
          <label className={labelClass}>Vendor Address *</label>
          <textarea {...register("address", { required: "Address is required" })} rows="3" className={inputClass} />
          {errors.address && <p className="text-red-500">{errors.address.message}</p>}
        </div>
      </div>

      {/* BANK DETAILS */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">🥈 Bank Details</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
          <div>
            <label className={labelClass}>Bank Name *</label>
            <input {...register("bankName", { required: "Bank Name is required" })} className={inputClass} />
            {errors.bankName && <p className="text-red-500">{errors.bankName.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Account Number *</label>
            <input {...register("accountNumber", { required: "Account Number is required" })} className={inputClass} />
            {errors.accountNumber && <p className="text-red-500">{errors.accountNumber.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Account Type *</label>
            <select {...register("accountType", { required: "Account Type is required" })} className={inputClass}>
              <option value="">Select</option>
              <option value="saving">Saving</option>
              <option value="current">Current</option>
            </select>
            {errors.accountType && <p className="text-red-500">{errors.accountType.message}</p>}
          </div>
          <div>
            <label className={labelClass}>MICR Code *</label>
            <input {...register("micr", { required: "MICR Code is required" })} className={inputClass} />
            {errors.micr && <p className="text-red-500">{errors.micr.message}</p>}
          </div>
          <div>
            <label className={labelClass}>RTGS Code *</label>
            <input {...register("rtgs", { required: "RTGS Code is required" })} className={inputClass} />
            {errors.rtgs && <p className="text-red-500">{errors.rtgs.message}</p>}
          </div>
          <div>
            <label className={labelClass}>NEFT Code *</label>
            <input {...register("neft", { required: "NEFT Code is required" })} className={inputClass} />
            {errors.neft && <p className="text-red-500">{errors.neft.message}</p>}
          </div>
        </div>
      </div>

      {/* PRODUCT GROUP & PRODUCTS */}
      <div className="bg-white rounded-xl shadow p-6">
        <h2 className="text-lg font-semibold mb-4">📦 Product Group & Products</h2>
        <div className="space-y-4">
          <div>
            <label className={labelClass}>Product Group *</label>
            <Controller
              name="productGroups"
              control={control}
              rules={{ required: "Product Group is required" }}
              render={({ field }) => (
                <Select {...field} isMulti options={productGroups} />
              )}
            />
            {errors.productGroups && <p className="text-red-500">{errors.productGroups.message}</p>}
          </div>
          <div>
            <label className={labelClass}>Select Products *</label>
            <Controller
              name="products"
              control={control}
              rules={{ required: "Products are required" }}
              render={({ field }) => (
                <Select {...field} isMulti options={filteredProducts} />
              )}
            />
            {errors.products && <p className="text-red-500">{errors.products.message}</p>}
          </div>
        </div>
      </div>

      {/* STATUS (EDIT ONLY) */}
      {isEdit && (
        <div className="bg-white rounded-xl shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-lg font-semibold">📊 Vendor Status</h2>
            <span className="text-xs bg-gray-100 px-3 py-1 rounded-full">Edit Mode</span>
          </div>

          <div>
            <label className={labelClass}>Current Status *</label>
            <Controller
              name="status"
              control={control}
              rules={{ required: "Status is required" }}
              render={({ field }) => (
                <Select
                  options={STATUS_OPTIONS}
                  value={mapStatusToOption(field.value)}
                  onChange={(option) => field.onChange(option.value)}
                  className="mt-1"
                />
              )}
            />

            {errors.status && <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>}
          </div>

          <div className="text-sm text-gray-600 mt-4 pt-4 border-t border-gray-200">
            <p className="font-medium mb-2">Status Information:</p>
            <div className="space-y-1">
              <p>• <span className="text-green-600 font-medium">Active:</span> Vendor can receive orders and payments</p>
              <p>• <span className="text-yellow-600 font-medium">Inactive:</span> Vendor temporarily paused</p>
              <p>• <span className="text-red-600 font-medium">Blacklisted:</span> Vendor permanently blocked</p>
            </div>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <button type="submit" className="bg-black text-white px-6 py-2 rounded-lg hover:bg-gray-800 transition-colors">
          {isEdit ? "Update Vendor" : "Create Vendor"}
        </button>
      </div>
    </form>
  );
}
