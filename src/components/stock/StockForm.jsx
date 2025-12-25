"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { MdAdd, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";

export default function AddStockPage() {
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      selectedProducts: [],
      purchaseDate: "",
      billNo: "",
      rate: "",
      gst: null,
      warehouse: null
    }
  });

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [fieldMasters, setFieldMasters] = useState([]);

  const [productRows, setProductRows] = useState({});
  const [productDynamicValues, setProductDynamicValues] = useState({});
  const [activeTab, setActiveTab] = useState(0);

  const selectedVendor = watch("vendor");
  const selectedProducts = watch("selectedProducts") || [];
  const watchPurchaseDate = watch("purchaseDate");
  const watchBillNo = watch("billNo");
  const watchRate = watch("rate");
  const watchGst = watch("gst");
  const watchWarehouse = watch("warehouse");

  // ✅ GST options
  const gstOptions = [
    { value: "5%", label: "5%" },
    { value: "15%", label: "15%" },
    { value: "18%", label: "18%" },
    { value: "28%", label: "28%" }
  ];

  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productRes, warehouseRes, fieldMasterRes] = await Promise.all([
          fetch("http://localhost:5001/vendors"),
          fetch("http://localhost:5001/products"),
          fetch("http://localhost:5001/warehouses"),
          fetch("http://localhost:5001/fieldMasters")
        ]);
        setVendors(await vendorRes.json());
        setProducts(await productRes.json());
        setWarehouses(await warehouseRes.json());
        setFieldMasters(await fieldMasterRes.json());
      } catch (err) {
        console.error("Failed to fetch data", err);
      }
    };
    fetchData();
  }, []);

  /* ---------- VENDOR CHANGE ---------- */
  useEffect(() => {
    if (!selectedVendor) {
      setVendorProducts([]);
      return;
    }

    const ids = selectedVendor.products?.map(p => p.id) || [];
    setVendorProducts(products.filter(p => ids.includes(p.id)));

    // Reset products when vendor changes
    setValue("selectedProducts", []);
    setProductRows({});
    setProductDynamicValues({});
    setActiveTab(0);
  }, [selectedVendor, products, setValue]);

  /* ---------- PRODUCTS SELECTION CHANGE ---------- */
  useEffect(() => {
    // Initialize data structures for selected products
    const newProductRows = { ...productRows };
    const newProductDynamicValues = { ...productDynamicValues };

    selectedProducts.forEach(product => {
      if (!newProductRows[product.id]) {
        newProductRows[product.id] = [];
      }
      if (!newProductDynamicValues[product.id]) {
        newProductDynamicValues[product.id] = {};
      }
    });

    // Remove data for deselected products
    Object.keys(newProductRows).forEach(productId => {
      if (!selectedProducts.find(p => p.id === productId)) {
        delete newProductRows[productId];
        delete newProductDynamicValues[productId];
      }
    });

    setProductRows(newProductRows);
    setProductDynamicValues(newProductDynamicValues);

    // Reset to first tab if current tab doesn't exist
    if (activeTab >= selectedProducts.length) {
      setActiveTab(0);
    }
  }, [selectedProducts]);

  /* ---------- GET DYNAMIC FIELDS FOR PRODUCT ---------- */
  const getDynamicFields = (product) => {
    if (!product) return [];

    const isUnique = product.identifierType === "UNIQUE";
    const isNonUnique = product.identifierType === "NON_UNIQUE";

    return fieldMasters.filter(field =>
      field.status &&
      product.selectedFieldIds?.includes(field.id) &&
      (
        (isUnique && field.applicableFor?.includes("UNIQUE")) ||
        (isNonUnique && field.applicableFor?.includes("NON_UNIQUE"))
      )
    );
  };

  /* ---------- ADD ROWS FOR UNIQUE PRODUCT ---------- */
  const addRowsToProduct = (productId, count) => {
    const product = selectedProducts.find(p => p.id === productId);
    if (!product) return;

    const dynamicFields = getDynamicFields(product);

    const newRows = Array.from({ length: count }, () => {
      const row = { id: Date.now() + Math.random() };
      dynamicFields.forEach(field => {
        row[field.key] = field.defaultValue || "";
      });
      return row;
    });

    setProductRows(prev => ({
      ...prev,
      [productId]: [...(prev[productId] || []), ...newRows]
    }));
  };

  /* ---------- REMOVE ROW FROM PRODUCT ---------- */
  const removeRowFromProduct = (productId, rowId) => {
    setProductRows(prev => ({
      ...prev,
      [productId]: (prev[productId] || []).filter(r => r.id !== rowId)
    }));
  };

  /* ---------- UPDATE ROW FIELD ---------- */
  const updateRowField = (productId, rowIndex, fieldKey, value) => {
    setProductRows(prev => {
      const newRows = [...(prev[productId] || [])];
      newRows[rowIndex] = {
        ...newRows[rowIndex],
        [fieldKey]: value
      };
      return {
        ...prev,
        [productId]: newRows
      };
    });
  };

  /* ---------- UPDATE PRODUCT DYNAMIC VALUE ---------- */
  const updateProductDynamicValue = (productId, fieldKey, value) => {
    setProductDynamicValues(prev => ({
      ...prev,
      [productId]: {
        ...prev[productId],
        [fieldKey]: value
      }
    }));
  };

  /* ---------- VALIDATE FORM ---------- */
  const validateForm = () => {
    if (!selectedVendor) {
      toast.error("Please select a vendor");
      return false;
    }

    if (selectedProducts.length === 0) {
      toast.error("Please select at least one product");
      return false;
    }

    if (!watchWarehouse) {
      toast.error("Please select a warehouse");
      return false;
    }

    if (!watchPurchaseDate) {
      toast.error("Purchase Date is required");
      return false;
    }

    if (!watchBillNo) {
      toast.error("Bill No is required");
      return false;
    }

    if (!watchRate || Number(watchRate) <= 0) {
      toast.error("Rate is required and must be greater than 0");
      return false;
    }

    if (!watchGst) {
      toast.error("GST is required");
      return false;
    }

    // Validate each product
    for (const product of selectedProducts) {
      const isUnique = product.identifierType === "UNIQUE";

      if (isUnique) {
        const rows = productRows[product.id] || [];
        if (rows.length === 0) {
          toast.error(`Please add at least one item for ${product.productName}`);
          return false;
        }
      }
    }

    return true;
  };

  /* ---------- SUBMIT FORM ---------- */
  const onSubmit = async (formData) => {
    if (!validateForm()) {
      return;
    }

    const payload = {
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.vendorName,
      warehouseId: formData.warehouse.id,
      warehouseName: formData.warehouse.fromWarehouse,
      purchaseDate: formData.purchaseDate,
      billNo: formData.billNo,
      rate: Number(formData.rate),
      gst: formData.gst.value,
      totalProducts: selectedProducts.length,
      products: selectedProducts.map(product => {
        const isUnique = product.identifierType === "UNIQUE";
        const rows = productRows[product.id] || [];

        return {
          productId: product.id,
          productName: product.productName,
          identifierType: product.identifierType,
          quantity: isUnique ? rows.length : 1,
          rate: Number(formData.rate),
          gst: formData.gst.value,
          items: isUnique ? rows : [],
          dynamicValues: !isUnique ? (productDynamicValues[product.id] || {}) : {},
          productData: {
            rows: rows,
            dynamicValues: productDynamicValues[product.id] || {}
          },
          createdAt: new Date().toISOString()
        };
      }),
      createdAt: new Date().toLocaleString("en-IN"),
      status: "active"
    };

    try {
      console.log("Submitting payload:", payload);

      const response = await fetch("http://localhost:5001/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (response.ok) {
        toast.success("Stock saved successfully!");
        reset();
        setProductRows({});
        setProductDynamicValues({});
        setActiveTab(0);
      } else {
        toast.error("Failed to save stock");
      }

    } catch (error) {
      toast.error("Failed to save stock");
      console.error(error);
    }
  };

  /* ---------- RENDER PRODUCT TAB CONTENT ---------- */
  const renderProductTabContent = () => {
    if (selectedProducts.length === 0) return null;

    const product = selectedProducts[activeTab];
    const isUnique = product.identifierType === "UNIQUE";
    const isNonUnique = product.identifierType === "NON_UNIQUE";
    const dynamicFields = getDynamicFields(product);
    const rows = productRows[product.id] || [];
    const dynamicValues = productDynamicValues[product.id] || {};

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        {/* Product Header */}
        <div className="flex justify-between items-center mb-4">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {product.productName}
            </h3>
            <p className="text-xs text-gray-600">
              Type: <span className="font-medium">{product.identifierType}</span>
            </p>
          </div>
          <div className="text-xs">
            {isUnique ? (
              <span className="bg-blue-100 text-blue-800 px-2 py-1 rounded">
                {rows.length} items
              </span>
            ) : (
              <span className="bg-green-100 text-green-800 px-2 py-1 rounded">
                Non-Unique
              </span>
            )}
          </div>
        </div>

        {/* Dynamic Fields for Non-Unique Products */}
        {isNonUnique && dynamicFields.length > 0 && (
          <div className="mb-6">
            <h4 className="font-medium text-sm text-gray-700 mb-3">Product Details</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {dynamicFields.map((field) => (
                <div key={field.id} className="bg-white p-3 rounded border">
                  <label className="font-medium text-sm mb-1 block">
                    {field.label}
                    {field.isRequired && <span className="text-red-500"> *</span>}
                  </label>
                  {field.type === "select" ? (
                    <select
                      value={dynamicValues[field.key] || ""}
                      onChange={(e) => updateProductDynamicValue(product.id, field.key, e.target.value)}
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                    >
                      <option value="">{field.placeholder}</option>
                      {field.options?.map((option, idx) => (
                        <option key={idx} value={option}>
                          {option}
                        </option>
                      ))}
                    </select>
                  ) : (
                    <input
                      type={field.type}
                      value={dynamicValues[field.key] || ""}
                      onChange={(e) => updateProductDynamicValue(product.id, field.key, e.target.value)}
                      placeholder={field.placeholder}
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                    />
                  )}
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Rows for Unique Products */}
        {isUnique && (
          <>
            {/* Add Rows Buttons */}
            <div className="mb-4">
              <div className="flex justify-between items-center mb-2">
                <h4 className="font-medium text-sm text-gray-700">Add Items</h4>
                <div className="text-xs text-gray-500">
                  {rows.length} items added
                </div>
              </div>
              <div className="flex flex-wrap gap-2">
                <button
                  type="button"
                  onClick={() => addRowsToProduct(product.id, 1)}
                  className="flex items-center gap-1 bg-indigo-600 hover:bg-indigo-700 text-white px-3 py-1.5 rounded text-sm"
                >
                  <MdAdd size={14} /> Add 1
                </button>
                <button
                  type="button"
                  onClick={() => addRowsToProduct(product.id, 10)}
                  className="bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
                >
                  +10
                </button>
                <button
                  type="button"
                  onClick={() => addRowsToProduct(product.id, 20)}
                  className="bg-blue-800 hover:bg-blue-900 text-white px-3 py-1.5 rounded text-sm"
                >
                  +20
                </button>
              </div>
            </div>

            {/* Rows Table */}
            {rows.length > 0 && (
              <div className="overflow-x-auto rounded border">
                <table className="min-w-full divide-y divide-gray-200 text-sm">
                  <thead className="bg-gray-100">
                    <tr>
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">#</th>
                      {dynamicFields.map(field => (
                        <th key={field.id} className="px-3 py-2 text-left text-xs font-medium text-gray-700">
                          {field.label}
                          {field.isRequired && <span className="text-red-500"> *</span>}
                        </th>
                      ))}
                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-700">Action</th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {rows.map((row, i) => (
                      <tr key={row.id} className="hover:bg-gray-50">
                        <td className="px-3 py-2 whitespace-nowrap text-xs font-medium text-gray-900">
                          {i + 1}
                        </td>
                        {dynamicFields.map(field => (
                          <td key={field.id} className="px-3 py-2 whitespace-nowrap">
                            <input
                              type={field.type}
                              value={row[field.key] || ""}
                              onChange={(e) => updateRowField(product.id, i, field.key, e.target.value)}
                              className="border border-gray-300 rounded px-2 py-1 w-full text-sm"
                              placeholder={field.placeholder}
                            />
                          </td>
                        ))}
                        <td className="px-3 py-2 whitespace-nowrap text-center">
                          <button
                            type="button"
                            onClick={() => removeRowFromProduct(product.id, row.id)}
                            className="text-red-600 hover:text-red-900"
                            title="Remove"
                          >
                            <MdDelete size={16} />
                          </button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {rows.length === 0 && (
              <div className="text-center py-6 bg-gray-50 rounded border border-dashed border-gray-300">
                <div className="text-gray-500 text-sm mb-2">No items added</div>
                <button
                  type="button"
                  onClick={() => addRowsToProduct(product.id, 1)}
                  className="inline-flex items-center gap-1 bg-blue-600 hover:bg-blue-700 text-white px-3 py-1.5 rounded text-sm"
                >
                  <MdAdd size={14} /> Add First Item
                </button>
              </div>
            )}
          </>
        )}

        {/* Message if no dynamic fields for non-unique product */}
        {isNonUnique && dynamicFields.length === 0 && (
          <div className="text-center py-4 bg-yellow-50 rounded border border-yellow-200 text-sm">
            <div className="text-yellow-700">No additional details required</div>
          </div>
        )}
      </div>
    );
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-7xl mx-auto p-2 bg-white rounded-lg shadow"
    >
      
      {/* COMPACT FORM LAYOUT */}
      <div>
        

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
          {/* Vendor + Products in same row */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Vendor
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="vendor"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={vendors}
                  placeholder="Select Vendor"
                  getOptionLabel={(v) => v.vendorName}
                  getOptionValue={(v) => v.id}
                  className="text-sm"
                  classNamePrefix="select"
                />
              )}
            />
            {errors.vendor && (
              <p className="text-xs text-red-500 mt-1">Required</p>
            )}
          </div>

          {/* Products select - now next to vendor */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Products
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="selectedProducts"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={vendorProducts}
                  placeholder="Select Products"
                  isMulti
                  isDisabled={!selectedVendor}
                  getOptionLabel={(p) => p.productName}
                  getOptionValue={(p) => p.id}
                  className="text-sm"
                  classNamePrefix="select"
                />
              )}
            />
            {errors.selectedProducts && (
              <p className="text-xs text-red-500 mt-1">Required</p>
            )}
          </div>

          {/* Warehouse */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Warehouse
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="warehouse"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={warehouses.filter(w => w.status === true)}
                  placeholder="Select Warehouse"
                  getOptionLabel={(w) => w.fromWarehouse}
                  getOptionValue={(w) => w.id}
                  className="text-sm"
                  classNamePrefix="select"
                  isClearable
                />
              )}
            />
            {errors.warehouse && (
              <p className="text-xs text-red-500 mt-1">Required</p>
            )}
          </div>

          {/* Purchase Date */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Purchase Date
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="purchaseDate"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <input
                  {...field}
                  type="date"
                  className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                />
              )}
            />
            {errors.purchaseDate && (
              <p className="text-xs text-red-500 mt-1">{errors.purchaseDate?.message}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3">
          {/* Bill No */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Bill No
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="billNo"
              control={control}
              rules={{
                required: "Required",
                minLength: { value: 3, message: "Min 3 chars" }
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  placeholder="Bill Number"
                  className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                />
              )}
            />
            {errors.billNo && (
              <p className="text-xs text-red-500 mt-1">{errors.billNo?.message}</p>
            )}
          </div>

          {/* Rate */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Rate (₹)
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="rate"
              control={control}
              rules={{
                required: "Required",
                min: { value: 0.01, message: "Must be > 0" }
              }}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  step="0.01"
                  placeholder="0.00"
                  min="0.01"
                  className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                />
              )}
            />
            {errors.rate && (
              <p className="text-xs text-red-500 mt-1">{errors.rate?.message}</p>
            )}
          </div>

          {/* GST */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              GST %
              <span className="text-red-500"> *</span>
            </label>
            <Controller
              name="gst"
              control={control}
              rules={{ required: "Required" }}
              render={({ field }) => (
                <Select
                  {...field}
                  options={gstOptions}
                  placeholder="Select GST"
                  className="text-sm"
                  classNamePrefix="select"
                />
              )}
            />
            {errors.gst && (
              <p className="text-xs text-red-500 mt-1">{errors.gst?.message}</p>
            )}
          </div>

          {/* Selected Products Summary */}
          <div className="col-span-1">
            <label className="block text-xs font-semibold text-gray-700 mb-1">
              Selected Products
            </label>
            <div className="border border-gray-300 rounded px-2 py-1.5 bg-gray-50 min-h-[38px]">
              {selectedProducts.length > 0 ? (
                <div className="text-xs">
                  <span className="font-medium">{selectedProducts.length}</span> product(s) selected
                  <div className="flex flex-wrap gap-1 mt-1">
                    {selectedProducts.slice(0, 2).map((product, index) => (
                      <span
                        key={product.id}
                        className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs"
                      >
                        {product.productName}
                      </span>
                    ))}
                    {selectedProducts.length > 2 && (
                      <span className="text-gray-500 text-xs">
                        +{selectedProducts.length - 2} more
                      </span>
                    )}
                  </div>
                </div>
              ) : (
                <span className="text-gray-400 text-xs">No products selected</span>
              )}
            </div>
          </div>
        </div>
      </div>

      {/* PRODUCT TABS SECTION - Only show when products selected */}
      {selectedProducts.length > 0 && (
        <div className="mb-6">
          <div className="flex items-center mb-3">
            <h2 className="text-lg font-semibold text-gray-800">Product Details</h2>
            <div className="ml-auto text-xs text-gray-600">
              Product {activeTab + 1} of {selectedProducts.length}
            </div>
          </div>

          {/* Compact Tab Navigation */}
          <div className="border-b border-gray-200">
            <nav className="flex space-x-0.5 overflow-x-auto" aria-label="Tabs">
              {selectedProducts.map((product, index) => (
                <button
                  key={product.id}
                  type="button"
                  onClick={() => setActiveTab(index)}
                  className={`
                    px-3 py-2 text-xs font-medium rounded-t border-b-2 transition-all whitespace-nowrap
                    ${activeTab === index
                      ? 'bg-white border-blue-500 text-blue-600'
                      : 'border-transparent text-gray-500 hover:text-gray-700 hover:bg-gray-50'
                    }
                  `}
                >
                  <div className="flex items-center">
                    <span className={`w-5 h-5 flex items-center justify-center rounded text-xs mr-1.5 ${activeTab === index ? 'bg-blue-100 text-blue-600' : 'bg-gray-100 text-gray-500'}`}>
                      {index + 1}
                    </span>
                    <span className="truncate max-w-[120px]">{product.productName}</span>
                    <span className="ml-1.5 text-xs px-1 py-0.5 rounded bg-gray-100">
                      {product.identifierType === "UNIQUE" ? "U" : "NU"}
                    </span>
                  </div>
                </button>
              ))}
            </nav>
          </div>

          {/* Tab Content */}
          {renderProductTabContent()}

          {/* Tab Navigation Buttons */}
          {selectedProducts.length > 1 && (
            <div className="flex justify-between mt-4">
              <button
                type="button"
                onClick={() => setActiveTab(prev => Math.max(0, prev - 1))}
                disabled={activeTab === 0}
                className={`px-3 py-1 rounded text-sm ${activeTab === 0 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                ← Previous
              </button>

              <div className="text-xs text-gray-600 flex items-center">
                <span className="font-medium mr-1">{selectedProducts[activeTab]?.productName}</span>
                ({activeTab + 1}/{selectedProducts.length})
              </div>

              <button
                type="button"
                onClick={() => setActiveTab(prev => Math.min(selectedProducts.length - 1, prev + 1))}
                disabled={activeTab === selectedProducts.length - 1}
                className={`px-3 py-1 rounded text-sm ${activeTab === selectedProducts.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
              >
                Next →
              </button>
            </div>
          )}

          {activeTab === selectedProducts.length - 1 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Ready to Save
                  </h3>
                  <p className="text-xs text-gray-600">
                    {selectedProducts.length} product(s) will be saved
                  </p>
                </div>

                <button
                  type="submit"
                  className="bg-green-600 hover:bg-green-700 text-white px-6 py-2 rounded-lg font-medium shadow hover:shadow-md transition-all"
                >
                  Save All Products
                  <span className="ml-2 text-xs bg-green-700 px-2 py-0.5 rounded">
                    {selectedProducts.length}
                  </span>
                </button>
              </div>
            </div>
          )}

          {/* SAVE BUTTON - NOW ONLY APPEARS AFTER TABS (WHEN PRODUCTS SELECTED) */}

        </div>
      )}
    </form>
  );
}