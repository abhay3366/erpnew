// components/stock/StockForm.jsx
"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { MdAdd, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";

export default function StockForm({ 
  open,
  onClose,
  stockId = null, // Pass stockId for edit mode
  onSuccess 
}) {
  const { control, handleSubmit, watch, setValue, reset, formState: { errors } } = useForm({
    defaultValues: {
      selectedProducts: [],
      purchaseDate: "",
      billNo: "",
      warehouse: null,
      vendor: null
    }
  });

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [fieldMasters, setFieldMasters] = useState([]);
  const [existingStock, setExistingStock] = useState(null);

  const [productRows, setProductRows] = useState({});
  const [productDynamicValues, setProductDynamicValues] = useState({});
  const [productRates, setProductRates] = useState({});
  const [productGSTs, setProductGSTs] = useState({});
  const [productStockAlerts, setProductStockAlerts] = useState({}); // नया state
  const [activeTab, setActiveTab] = useState(0);

  const [rowError, setRowError] = useState();
  const [isLoading, setIsLoading] = useState(false);
  const [isInitialized, setIsInitialized] = useState(false);

  const selectedVendor = watch("vendor");
  const selectedProductsForm = watch("selectedProducts") || [];
  const watchPurchaseDate = watch("purchaseDate");
  const watchBillNo = watch("billNo");
  const watchWarehouse = watch("warehouse");

  const isEditMode = !!stockId;

  // ✅ GST options
  const gstOptions = [
    { value: "5%", label: "5%" },
    { value: "12%", label: "12%" },
    { value: "18%", label: "18%" },
    { value: "28%", label: "28%" }
  ];

  const isDuplicateValue = (rows, rowIndex, key, value) => {
    return rows.some(
      (r, index) => index !== rowIndex && r[key] === value
    );
  };

  /* ---------- CHECK BILL NUMBER UNIQUENESS ---------- */
  const checkBillNumberUnique = async (billNo) => {
    if (!billNo || billNo.trim() === "") return true;
    
    try {
      const response = await fetch("http://localhost:5001/stocks");
      const allStocks = await response.json();
      
      // If editing, exclude the current stock from the check
      const stocksToCheck = isEditMode && existingStock
        ? allStocks.filter(stock => stock.id !== existingStock.id)
        : allStocks;
      
      const isDuplicate = stocksToCheck.some(stock => 
        stock.billNo && stock.billNo.trim().toLowerCase() === billNo.trim().toLowerCase()
      );
      
      return !isDuplicate;
    } catch (error) {
      console.error("Error checking bill number:", error);
      return true; // If error occurs, allow submission
    }
  };

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

  /* ---------- LOAD EXISTING STOCK DATA FOR EDIT ---------- */
  useEffect(() => {
    const loadStockData = async () => {
      if (!isEditMode || !stockId || vendors.length === 0 || products.length === 0) return;
      
      try {
        setIsLoading(true);
        const response = await fetch(`http://localhost:5001/stocks/${stockId}`);
        if (!response.ok) throw new Error("Failed to fetch stock data");
        
        const stockData = await response.json();
        setExistingStock(stockData);
        
        // Set vendor
        const vendor = vendors.find(v => v.id === stockData.vendorId);
        if (vendor) {
          setValue("vendor", vendor);
        }
        
        // Set warehouse
        const warehouse = warehouses.find(w => w.id === stockData.warehouseId);
        if (warehouse) {
          setValue("warehouse", warehouse);
        }
        
        // Set basic fields
        setValue("purchaseDate", stockData.purchaseDate ? stockData.purchaseDate.split('T')[0] : "");
        setValue("billNo", stockData.billNo || "");
        
        // Initialize product data structures
        const stockProducts = stockData.products || [];
        const newProductRows = {};
        const newProductDynamicValues = {};
        const newProductRates = {};
        const newProductGSTs = {};
        const newProductStockAlerts = {}; // नया initialize
        
        stockProducts.forEach(product => {
          const productId = product.productId || product.id;
          
          // For UNIQUE products, load items
          if (product.identifierType === "UNIQUE") {
            newProductRows[productId] = product.items || [];
          }
          
          // For NON_UNIQUE products, load dynamicValues
          if (product.identifierType === "NON_UNIQUE") {
            newProductDynamicValues[productId] = product.dynamicValues || {};
          }
          
          newProductRates[productId] = product.rate || 0;
          newProductGSTs[productId] = gstOptions.find(g => g.value === product.gst) || null;
          newProductStockAlerts[productId] = product.quantityAlert || 10; // Default 10
        });
        
        setProductRows(newProductRows);
        setProductDynamicValues(newProductDynamicValues);
        setProductRates(newProductRates);
        setProductGSTs(newProductGSTs);
        setProductStockAlerts(newProductStockAlerts); // सेट करें
        
        // Set selected products
        const mappedProducts = stockProducts.map(product => {
          const fullProduct = products.find(p => p.id === (product.productId || product.id));
          return {
            ...fullProduct,
            ...product,
            id: product.productId || product.id,
            productId: product.productId || product.id
          };
        }).filter(p => p !== undefined);
        
        setValue("selectedProducts", mappedProducts);
        setIsInitialized(true);
        
      } catch (error) {
        console.error("Error loading stock data:", error);
        toast.error("Failed to load stock data for editing");
      } finally {
        setIsLoading(false);
      }
    };
    
    loadStockData();
  }, [isEditMode, stockId, vendors, products, warehouses, setValue]);

  /* ---------- RESET FORM WHEN MODAL CLOSES ---------- */
  useEffect(() => {
    if (!open) {
      // Reset form when modal closes
      reset();
      setExistingStock(null);
      setProductRows({});
      setProductDynamicValues({});
      setProductRates({});
      setProductGSTs({});
      setProductStockAlerts({}); // रीसेट करें
      setActiveTab(0);
      setIsInitialized(false);
    }
  }, [open, reset]);

  /* ---------- VENDOR CHANGE ---------- */
  useEffect(() => {
    if (!selectedVendor) {
      setVendorProducts([]);
      return;
    }

    const ids = selectedVendor.products?.map(p => p.id) || [];
    setVendorProducts(products.filter(p => ids.includes(p.id)));

    // Reset products when vendor changes (only in create mode)
    if (!isEditMode) {
      setValue("selectedProducts", []);
      setProductRows({});
      setProductDynamicValues({});
      setProductRates({});
      setProductGSTs({});
      setProductStockAlerts({}); // रीसेट करें
      setActiveTab(0);
    }
  }, [selectedVendor, products, setValue, isEditMode]);

  /* ---------- PRODUCTS SELECTION CHANGE ---------- */
  useEffect(() => {
    // Initialize data structures for selected products
    const newProductRows = { ...productRows };
    const newProductDynamicValues = { ...productDynamicValues };
    const newProductRates = { ...productRates };
    const newProductGSTs = { ...productGSTs };
    const newProductStockAlerts = { ...productStockAlerts }; // नया

    selectedProductsForm.forEach(product => {
      const productId = product.id;
      
      if (!newProductRows[productId]) {
        newProductRows[productId] = [];
      }
      if (!newProductDynamicValues[productId]) {
        newProductDynamicValues[productId] = {};
      }
      if (!newProductRates[productId]) {
        newProductRates[productId] = product.rate || "";
      }
      if (!newProductGSTs[productId]) {
        newProductGSTs[productId] = product.gst || null;
      }
      if (!newProductStockAlerts[productId]) {
        newProductStockAlerts[productId] = product.quantityAlert || 10; // Default 10
      }
    });

    // Remove data for deselected products
    Object.keys(newProductRows).forEach(productId => {
      if (!selectedProductsForm.find(p => p.id === productId)) {
        delete newProductRows[productId];
        delete newProductDynamicValues[productId];
        delete newProductRates[productId];
        delete newProductGSTs[productId];
        delete newProductStockAlerts[productId]; 
      }
    });

    setProductRows(newProductRows);
    setProductDynamicValues(newProductDynamicValues);
    setProductRates(newProductRates);
    setProductGSTs(newProductGSTs);
    setProductStockAlerts(newProductStockAlerts); 

    // Reset to first tab if current tab doesn't exist
    if (activeTab >= selectedProductsForm.length) {
      setActiveTab(0);
    }
  }, [selectedProductsForm]);

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
  const product = selectedProductsForm.find(p => p.id === productId);
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
    [productId]: [...newRows, ...(prev[productId] || [])]
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

  /* ---------- UPDATE PRODUCT RATE ---------- */
  const updateProductRate = (productId, value) => {
    setProductRates(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  /* ---------- UPDATE PRODUCT GST ---------- */
  const updateProductGST = (productId, value) => {
    setProductGSTs(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  /* ---------- UPDATE PRODUCT STOCK ALERT ---------- */
  const updateProductStockAlert = (productId, value) => {
    setProductStockAlerts(prev => ({
      ...prev,
      [productId]: value
    }));
  };

  /* ---------- VALIDATE FORM ---------- */
  const validateForm = async () => {
    if (!selectedVendor) {
      toast.error("Please select a vendor");
      return false;
    }

    if (selectedProductsForm.length === 0) {
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

    if (!watchBillNo || watchBillNo.trim() === "") {
      toast.error("Bill No is required");
      return false;
    }

    // Check if bill number is unique
    const isUnique = await checkBillNumberUnique(watchBillNo);
    if (!isUnique) {
      toast.error("This Bill Number already exists. Please use a different bill number.");
      return false;
    }

    // Validate each product's rate and GST
    for (const product of selectedProductsForm) {
      const productRate = productRates[product.id];
      const productGST = productGSTs[product.id];
      const productStockAlert = productStockAlerts[product.id];

      if (!productRate || Number(productRate) <= 0) {
        toast.error(`Rate is required for ${product.productName} and must be greater than 0`);
        return false;
      }

      if (!productGST) {
        toast.error(`GST is required for ${product.productName}`);
        return false;
      }

      if (!productStockAlert || Number(productStockAlert) < 0) {
        toast.error(`Stock Alert is required for ${product.productName} and must be non-negative`);
        return false;
      }

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
  const onSubmitForm = async (formData) => {
    // Validate form including bill number uniqueness
    if (!await validateForm()) {
      return;
    }

    const payload = {
      vendorId: selectedVendor.id,
      vendorName: selectedVendor.vendorName,
      warehouseId: formData.warehouse.id,
      warehouseName: formData.warehouse.fromWarehouse,
      purchaseDate: formData.purchaseDate,
      billNo: formData.billNo.trim(), // Trim bill number
      totalProducts: selectedProductsForm.length,
      products: selectedProductsForm.map(product => {
        const isUnique = product.identifierType === "UNIQUE";
        const rows = productRows[product.id] || [];
        const productRate = productRates[product.id];
        const productGST = productGSTs[product.id];
        const productStockAlert = productStockAlerts[product.id]; 
        const dyn = productDynamicValues[product.id] || {};
        const dynQty = dyn.quantity;

        return {
          productId: product.id,
          productName: product.productName,
          identifierType: product.identifierType,

          // 🔑 quantity logic (FINAL)
          ...(isUnique
            ? { quantity: rows.length }
            : dynQty
              ? { quantity: Number(dynQty) }
              : { quantity: product.quantity || 0 }),

          rate: Number(productRate),
          gst: productGST.value,
          quantityAlert: Number(productStockAlert), 
          items: isUnique ? rows : [],
          dynamicValues: !isUnique ? dyn : {},
        };
      }),
      status: "active"
    };

    try {
      let response;
      
      if (isEditMode && stockId) {
        // UPDATE existing stock
        payload.id = stockId;
        if (existingStock?.createdAt) {
          payload.createdAt = existingStock.createdAt;
        }
        payload.updatedAt = new Date().toISOString();
        
        response = await fetch(`http://localhost:5001/stocks/${stockId}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      } else {
        // CREATE new stock
        payload.createdAt = new Date().toISOString();
        
        response = await fetch("http://localhost:5001/stocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(payload),
        });
      }

      if (response.ok) {
        const savedData = await response.json();
        toast.success(isEditMode ? "Stock updated successfully!" : "Stock saved successfully!");
        
        // Reset form
        reset();
        setProductRows({});
        setProductDynamicValues({});
        setProductRates({});
        setProductGSTs({});
        setProductStockAlerts({}); 
        setActiveTab(0);
        
        // Close modal and notify parent
        if (onClose) onClose();
        if (onSuccess) onSuccess(savedData);
        
      } else {
        toast.error(isEditMode ? "Failed to update stock" : "Failed to save stock");
      }

    } catch (error) {
      toast.error(isEditMode ? "Failed to update stock" : "Failed to save stock");
      console.error(error);
    }
  };

  /* ---------- RENDER PRODUCT TAB CONTENT ---------- */
  const renderProductTabContent = () => {
    if (selectedProductsForm.length === 0) return null;

    const product = selectedProductsForm[activeTab];
    const isUnique = product.identifierType === "UNIQUE";
    const isNonUnique = product.identifierType === "NON_UNIQUE";
    const dynamicFields = getDynamicFields(product);
    const rows = productRows[product.id] || [];
    const dynamicValues = productDynamicValues[product.id] || {};
    const productRate = productRates[product.id] || "";
    const productGST = productGSTs[product.id] || null;
    const productStockAlert = productStockAlerts[product.id] || 10; // Default value

    return (
      <div className="mt-4 p-4 bg-gray-50 rounded-lg border">
        {/* Product Header with Rate and GST */}
        <div className="flex flex-wrap justify-between items-start mb-4 gap-3">
          <div>
            <h3 className="text-lg font-semibold text-gray-800">
              {product.productName}
            </h3>
            <p className="text-xs text-gray-600">
              Type: <span className="font-medium">{product.identifierType}</span>
            </p>
          </div>

          {/* Stock Alert, Rate and GST per product */}
          <div className="flex flex-col md:flex-row gap-3">
          
            <div className="min-w-[120px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Stock Alert
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                min="0"
                step="1"
                value={productStockAlert}
                onChange={(e) => updateProductStockAlert(product.id, e.target.value)}
                placeholder="10"
                className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
              />
              {(!productStockAlert || Number(productStockAlert) < 0) && (
                <p className="text-xs text-red-500 mt-1">Required & must be ≥ 0</p>
              )}
            </div>

            {/* Rate Input */}
            <div className="min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                Rate (₹) for this product
                <span className="text-red-500"> *</span>
              </label>
              <input
                type="number"
                step="0.01"
                min="0.01"
                value={productRate}
                onChange={(e) => updateProductRate(product.id, e.target.value)}
                placeholder="0.00"
                className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
              />
              {(!productRate || Number(productRate) <= 0) && (
                <p className="text-xs text-red-500 mt-1">Required & must be &gt; 0</p>
              )}
            </div>

            {/* GST Select */}
            <div className="min-w-[150px]">
              <label className="block text-xs font-semibold text-gray-700 mb-1">
                GST % for this product
                <span className="text-red-500"> *</span>
              </label>
              <Select
                options={gstOptions}
                value={productGST}
                onChange={(value) => updateProductGST(product.id, value)}
                placeholder="Select GST"
                className="text-sm"
                classNamePrefix="select"
              />
              {!productGST && (
                <p className="text-xs text-red-500 mt-1">Required</p>
              )}
            </div>

            {/* Item Count Badge */}
            <div className="min-w-[100px]">
              <div className="text-xs text-gray-600 mb-1">Item Count</div>
              {isUnique ? (
                <div className="bg-blue-100 text-blue-800 px-3 py-1.5 rounded text-center">
                  <span className="font-medium text-sm">{rows.length}</span>
                  <span className="text-xs ml-1">items</span>
                </div>
              ) : (
                <div className="bg-green-100 text-green-800 px-3 py-1.5 rounded text-center">
                  <span className="font-medium text-sm">1</span>
                  <span className="text-xs ml-1">batch</span>
                </div>
              )}
            </div>
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
                              onChange={(e) => {
                                const val = e.target.value;
                                if (isDuplicateValue(rows, i, field.key, val)) {
                                  setRowError(`${field.label || field.key} must be unique`)
                                  alert(`${field.label || field.key} must be unique`);
                                  return;
                                }
                                updateRowField(product.id, i, field.key, val);
                              }}
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
      onSubmit={handleSubmit(onSubmitForm)}
      className="max-w-7xl mx-auto p-4 bg-white"
    >
      {/* Loading State */}
      {isLoading && isEditMode && (
        <div className="text-center py-8">
          <div className="w-8 h-8 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock data...</p>
        </div>
      )}

      {(!isLoading || !isEditMode) && (
        <>
          {/* Header for Edit Mode */}
          {isEditMode && (
            <div className="mb-4 p-3 bg-blue-50 rounded-lg border border-blue-200">
              <div className="flex items-center">
                <svg className="w-5 h-5 text-blue-600 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                </svg>
                <span className="text-sm font-medium text-blue-800">Edit Mode - Stock ID: #{stockId}</span>
                <span className="ml-auto text-xs text-gray-600">
                  {existingStock?.createdAt ? `Created: ${new Date(existingStock.createdAt).toLocaleDateString('en-IN')}` : ''}
                </span>
              </div>
            </div>
          )}

          {/* COMPACT FORM LAYOUT */}
          <div>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 mb-4">
              {/* Vendor */}
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
                      isDisabled={isEditMode} // Disable vendor change in edit mode
                    />
                  )}
                />
                {errors.vendor && (
                  <p className="text-xs text-red-500 mt-1">Required</p>
                )}
              </div>

              {/* Products select */}
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
                      onClick={(e) => e.target.showPicker()}
                      className="border border-gray-300 rounded px-2 py-1.5 w-full text-sm"
                    />
                  )}
                />
                {errors.purchaseDate && (
                  <p className="text-xs text-red-500 mt-1">{errors.purchaseDate?.message}</p>
                )}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-3">
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

              {/* Selected Products Summary */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Selected Products
                </label>
                <div className="border border-gray-300 rounded px-2 py-1.5 bg-gray-50 min-h-[38px]">
                  {selectedProductsForm.length > 0 ? (
                    <div className="text-xs">
                      <span className="font-medium">{selectedProductsForm.length}</span> product(s) selected
                      <div className="flex flex-wrap gap-1 mt-1">
                        {selectedProductsForm.slice(0, 2).map((product, index) => (
                          <span
                            key={product.id}
                            className="bg-blue-100 text-blue-800 px-1.5 py-0.5 rounded text-xs"
                          >
                            {product.productName}
                          </span>
                        ))}
                        {selectedProductsForm.length > 2 && (
                          <span className="text-gray-500 text-xs">
                            +{selectedProductsForm.length - 2} more
                          </span>
                        )}
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">No products selected</span>
                  )}
                </div>
              </div>

              {/* Total Summary */}
              <div className="col-span-1">
                <label className="block text-xs font-semibold text-gray-700 mb-1">
                  Rate & GST Summary
                </label>
                <div className="border border-gray-300 rounded px-2 py-1.5 bg-gray-50 min-h-[38px]">
                  {selectedProductsForm.length > 0 ? (
                    <div className="text-xs">
                      <div className="flex justify-between">
                        <span>Products:</span>
                        <span className="font-medium">{selectedProductsForm.length}</span>
                      </div>
                      <div className="flex justify-between">
                        <span>Rate per product:</span>
                        <span className="font-medium">Individual</span>
                      </div>
                      <div className="flex justify-between">
                        <span>GST per product:</span>
                        <span className="font-medium">Individual</span>
                      </div>
                    </div>
                  ) : (
                    <span className="text-gray-400 text-xs">Select products to see rates</span>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* PRODUCT TABS SECTION - Only show when products selected */}
          {selectedProductsForm.length > 0 && (
            <div className="mb-6">
              <div className="flex items-center mb-3">
                <h2 className="text-lg font-semibold text-gray-800">Product Details</h2>
                <div className="ml-auto text-xs text-gray-600">
                  Product {activeTab + 1} of {selectedProductsForm.length}
                </div>
              </div>

              {/* Compact Tab Navigation */}
              <div className="border-b border-gray-200">
                <nav className="flex space-x-0.5 overflow-x-auto" aria-label="Tabs">
                  {selectedProductsForm.map((product, index) => (
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
              {selectedProductsForm.length > 1 && (
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
                    <span className="font-medium mr-1">{selectedProductsForm[activeTab]?.productName}</span>
                    ({activeTab + 1}/{selectedProductsForm.length})
                  </div>

                  <button
                    type="button"
                    onClick={() => setActiveTab(prev => Math.min(selectedProductsForm.length - 1, prev + 1))}
                    disabled={activeTab === selectedProductsForm.length - 1}
                    className={`px-3 py-1 rounded text-sm ${activeTab === selectedProductsForm.length - 1 ? 'bg-gray-100 text-gray-400 cursor-not-allowed' : 'bg-gray-200 text-gray-700 hover:bg-gray-300'}`}
                  >
                    Next →
                  </button>
                </div>
              )}

              {activeTab === selectedProductsForm.length - 1 && (
                <div className="mt-6 pt-4 border-t border-gray-200">
                  <div className="flex justify-between items-center">
                    <div>
                      <h3 className="text-sm font-semibold text-gray-800">
                        Ready to {isEditMode ? 'Update' : 'Save'}
                      </h3>
                      <p className="text-xs text-gray-600">
                        {selectedProductsForm.length} product(s) will be {isEditMode ? 'updated' : 'saved'}
                      </p>
                    </div>

                    <div className="flex gap-3">
                      <button
                        type="button"
                        onClick={onClose}
                        className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                      >
                        Cancel
                      </button>
                      
                      <button
                        type="submit"
                        className={`px-6 py-2 rounded-lg font-medium shadow hover:shadow-md transition-all flex items-center ${
                          isEditMode 
                            ? 'bg-blue-600 hover:bg-blue-700 text-white' 
                            : 'bg-green-600 hover:bg-green-700 text-white'
                        }`}
                      >
                        {isEditMode ? 'Update Stock' : 'Save Stock'}
                        <span className="ml-2 text-xs bg-white bg-opacity-30 px-2 py-0.5 rounded">
                          {selectedProductsForm.length}
                        </span>
                      </button>
                    </div>
                  </div>
                </div>
              )}
            </div>
          )}
          
          {/* Show Save button if no products selected */}
          {selectedProductsForm.length === 0 && (
            <div className="mt-6 pt-4 border-t border-gray-200">
              <div className="flex justify-between items-center">
                <div>
                  <h3 className="text-sm font-semibold text-gray-800">
                    Ready to {isEditMode ? 'Update' : 'Save'}
                  </h3>
                  <p className="text-xs text-gray-600">
                    Please select at least one product
                  </p>
                </div>
                
                <div className="flex gap-3">
                  <button
                    type="button"
                    onClick={onClose}
                    className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors font-medium"
                  >
                    Cancel
                  </button>
                  
                  <button
                    type="submit"
                    className="px-6 py-2 bg-gray-400 text-white rounded-lg font-medium cursor-not-allowed"
                    disabled={true}
                  >
                    {isEditMode ? 'Update' : 'Save'}
                  </button>
                </div>
              </div>
            </div>
          )}
        </>
      )}
    </form>
  );
}