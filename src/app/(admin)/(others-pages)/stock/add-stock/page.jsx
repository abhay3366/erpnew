"use client";

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function AddStock({ onClose, onSuccess, editData = null }) {
    const isEditMode = editData !== null;

    const [formData, setFormData] = useState({
        categoryItem: '',
        vendor: '',
        warrantyYears: 0,
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [serialMode, setSerialMode] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState('');

    const [stockItems, setStockItems] = useState([
        { id: 1, serialNumber: '', macAddress: '', quantity: 0, warranty: 0 }
    ]);

    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]); // ✅ NEW: Filtered vendors
    const [vendorProducts, setVendorProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [loading, setLoading] = useState({
        vendors: true,
        submitting: false,
        loadingEditData: false
    });

    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);
    const [error, setError] = useState('');

    const categoryDropdownRef = useRef(null);
    const vendorDropdownRef = useRef(null);

    // FETCH All VENDORS FIRST 
    useEffect(() => {
        const fetchVendors = async () => {
            try {
                const response = await fetch('http://localhost:5001/vendors');
                const data = await response.json();
                const activeVendors = data.filter(v => v.status === 'Active' && !v.blacklisted);
                setVendors(activeVendors);
                setFilteredVendors(activeVendors); // ✅ Initially sabhi vendors

                // After vendors are loaded, initialize edit data if needed
                if (isEditMode && editData) {
                    initializeEditData(activeVendors);
                }
            } catch (err) {
                console.error('Error fetching vendors:', err);
                setError('Failed to load vendors');
            } finally {
                setLoading(prev => ({ ...prev, vendors: false }));
            }
        };

        fetchVendors();
    }, []);

    // INITIALIZE EDIT DATA AFTER VENDORS ARE LOADED
    const initializeEditData = (vendorsList) => {
        try {
            setLoading(prev => ({ ...prev, loadingEditData: true }));

            // Set form data from editData
            setFormData({
                categoryItem: editData.category || '',
                vendor: editData.vendor || '',
                warrantyYears: editData.globalWarranty || 0,
            });

            // Set branch from editData
            setSelectedBranch(editData.branch || '');

            // Set serial mode
            setSerialMode(editData.serialMode || false);

            // Set selected product
            if (editData.product) {
                setSelectedProduct({
                    id: editData.product.id,
                    name: editData.product.name,
                    fullPath: editData.product.fullPath,
                    branchId: editData.product.branchId || editData.branch || '',
                    unit: editData.unit || editData.product.unit || ''
                });
            }

            // IMPORTANT: Set stock items - सभी items लोड करें
            if (editData.items && editData.items.length > 0) {
                // सभी items के लिए rows बनाएं
                const itemsWithIds = editData.items.map((item, index) => ({
                    id: index + 1,
                    serialNumber: item.serialNumber || '',
                    macAddress: item.macAddress || '',
                    quantity: item.quantity || 1,
                    warranty: item.warranty || 0,
                }));

                // यदि कोई items नहीं हैं तो default row add करें
                if (itemsWithIds.length === 0) {
                    itemsWithIds.push({
                        id: 1,
                        serialNumber: '',
                        macAddress: '',
                        quantity: 0,
                        warranty: 0,
                    });
                }

                setStockItems(itemsWithIds);

                // Log for debugging
                console.log('Loaded items for editing:', itemsWithIds);
                console.log('Total items loaded:', itemsWithIds.length);
            } else {
                // If no items, set default
                setStockItems([{
                    id: 1,
                    serialNumber: '',
                    macAddress: '',
                    quantity: 0,
                    warranty: 0,
                }]);
            }

            // If vendor exists, load vendor products
            if (editData.vendor && vendorsList) {
                // Find vendor from the loaded list
                const vendor = vendorsList.find(v => v.vendor_name === editData.vendor);
                if (vendor) {
                    // Load vendor products
                    const products = vendor.selected_products || [];

                    // Extract branch ID from products
                    const formattedProducts = products.map(p => {
                        return {
                            id: p.id,
                            name: p.name || p.productName,
                            fullPath: p.fullPath || p.name,
                            branchId: p.branchId || null,
                            branchName: p.branchName || null,
                            unit: p.originalProduct?.unit || '',
                            originalProduct: p.originalProduct || p
                        };
                    });

                    setVendorProducts(formattedProducts);
                    setFilteredProducts(formattedProducts);
                }
            }

        } catch (error) {
            console.error('Error initializing edit data:', error);
            toast.error('Failed to initialize edit data');
        } finally {
            setLoading(prev => ({ ...prev, loadingEditData: false }));
        }
    };

    // GET VENDOR PRODUCTS
    const getVendorProducts = (vendorName) => {
        if (!vendorName) {
            setVendorProducts([]);
            setFilteredProducts([]);
            return [];
        }

        const vendor = vendors.find(v => v.vendor_name === vendorName);
        if (!vendor) {
            setVendorProducts([]);
            setFilteredProducts([]);
            return [];
        }

        const products = vendor.selected_products || [];

        const formattedProducts = products.map(p => {
            return {
                id: p.id,
                name: p.name || p.productName,
                fullPath: p.fullPath || p.name,
                branchId: p.branchId || null,
                branchName: p.branchName || null,
                unit: p.originalProduct?.unit || '',
                originalProduct: p.originalProduct || p
            };
        });

        setVendorProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
        return formattedProducts;
    };

    // HANDLE PRODUCT SELECTION
    const handleProductSelect = (product) => {
        const productData = {
            ...product,
            unit: product.unit || product.originalProduct?.unit || '',
            branchId: product.branchId || ''
        };

        setSelectedProduct(productData);
        setFormData(prev => ({ ...prev, categoryItem: product.fullPath || product.name }));

        // Check if product needs serial numbers
        let needsSerial = false;
        if (product.originalProduct) {
            const op = product.originalProduct;
            needsSerial = op.isSerial === true || op.isSerial === "1" || op.isSerial === "true";
        }

        setSerialMode(needsSerial);

        // IMPORTANT: Set branch from product if available
        if (product.branchId) {
            setSelectedBranch(product.branchId);
        } else {
            // If product doesn't have branchId, reset to empty
            setSelectedBranch('');
        }

        // Reset table
        setStockItems([{
            id: 1,
            serialNumber: '',
            macAddress: '',
            quantity: 0,
            warranty: 0
        }]);

        setShowCategoryDropdown(false);
        setError('');
    };

    // HANDLE VENDOR SELECTION
    const handleVendorSelect = (vendor) => {
        setFormData({
            categoryItem: '',
            vendor: vendor.vendor_name,
            warrantyYears: 0
        });
        setSelectedProduct(null);
        setSerialMode(null);
        setSelectedBranch(''); // Reset branch when vendor changes
        setShowVendorDropdown(false);
        setShowCategoryDropdown(false);
        
        getVendorProducts(vendor.vendor_name);
    };

    // FILTER PRODUCTS
    const filterProducts = (search) => {
        if (!search.trim()) {
            setFilteredProducts(vendorProducts);
        } else {
            const filtered = vendorProducts.filter(p =>
                p.name.toLowerCase().includes(search.toLowerCase()) ||
                p.fullPath.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredProducts(filtered);
        }
        setFormData(prev => ({ ...prev, categoryItem: search }));
    };

    // ✅ FIXED: FILTER VENDORS
    const filterVendors = (search) => {
        setFormData(prev => ({ ...prev, vendor: search, categoryItem: '' }));
        setSelectedProduct(null);
        setSerialMode(null);
        setSelectedBranch('');
        setVendorProducts([]);
        setFilteredProducts([]);
        setShowVendorDropdown(true);
        
        // Filter vendors based on search
        if (!search.trim()) {
            setFilteredVendors(vendors);
        } else {
            const filtered = vendors.filter(vendor =>
                vendor.vendor_name.toLowerCase().includes(search.toLowerCase())
            );
            setFilteredVendors(filtered);
        }
    };

    // ADD/REMOVE ROWS
    const addMultipleRows = (count) => {
        const newItems = [];
        const startId = stockItems.length + 1;

        for (let i = 0; i < count; i++) {
            newItems.push({
                id: startId + i,
                serialNumber: '',
                macAddress: '',
                quantity: 0,
                warranty: 0,
            });
        }
        setStockItems([...stockItems, ...newItems]);
    };

    const addSingleRow = () => {
        const newItem = {
            id: stockItems.length + 1,
            serialNumber: '',
            macAddress: '',
            quantity: 0,
            warranty: 0,
        };
        setStockItems([...stockItems, newItem]);
    };

    const removeRow = (id) => {
        if (stockItems.length > 1) {
            const updated = stockItems.filter(item => item.id !== id);
            const renumbered = updated.map((item, idx) => ({ ...item, id: idx + 1 }));
            setStockItems(renumbered);
        }
    };

    // CHANGE TABLE VALUES
    const changeItemValue = (id, field, value) => {
        const updated = stockItems.map(item => {
            if (item.id === id) {
                if (field === 'warranty') {
                    return { ...item, [field]: parseInt(value) || 0 };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        setStockItems(updated);
    };

    // APPLY WARRANTY TO ALL ROWS
    const applyWarrantyToAll = (years) => {
        setFormData(prev => ({ ...prev, warrantyYears: years }));
        const updated = stockItems.map(item => ({ ...item, warranty: years }));
        setStockItems(updated);
    };

    // VALIDATE FORM function mein change:
    const validateForm = () => {
        if (!formData.categoryItem.trim()) {
            setError('Please select product');
            return false;
        }
        if (!formData.vendor.trim()) {
            setError('Please select vendor');
            return false;
        }

        if (serialMode === true) {
            const hasSerialNumber = stockItems.some(item =>
                item.serialNumber && item.serialNumber.trim() !== ''
            );
            if (!hasSerialNumber) {
                setError('Please enter at least one serial number');
                return false;
            }

            // Serial mode mein quantity automatically 1 hai, validation ki zaroorat nahi
            // Lekin check karenge ki quantity 1 hai ya nahi
            stockItems.forEach(item => {
                if (item.quantity < 1) {
                    changeItemValue(item.id, 'quantity', 1);
                }
            });

        } else if (serialMode === false) {
            // Sirf quantity check karenge
            if (stockItems[0].quantity <= 0) {
                setError('Please enter a valid quantity');
                return false;
            }
        } else {
            setError('Please select a product first');
            return false;
        }
        return true;
    };

    // SUBMIT FORM
    const submitForm = async (e) => {
        e.preventDefault();
        setError('');

        if (!validateForm()) return;

        // Filter out empty rows based on mode
        let itemsToSave = [];

        if (serialMode === true) {
            itemsToSave = stockItems.filter(item =>
                item.serialNumber && item.serialNumber.trim() !== ''
            );

            if (itemsToSave.length === 0) {
                setError('Please enter at least one serial number');
                return;
            }

            itemsToSave = itemsToSave.map(item => ({
                serialNumber: item.serialNumber.trim(),
                macAddress: item.macAddress.trim(),
                quantity: item.quantity,
                warranty: item.warranty
            }));

        } else if (serialMode === false) {
            itemsToSave = stockItems.filter(item => item.quantity > 0);

            if (itemsToSave.length === 0) {
                setError('Please enter a valid quantity');
                return;
            }

            itemsToSave = itemsToSave.map(item => ({
                serialNumber: '',
                macAddress: '',
                quantity: item.quantity,
                warranty: item.warranty
            }));
        } else {
            setError('Please select a product first');
            return;
        }

        const stockData = {
            product: selectedProduct ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                fullPath: selectedProduct.fullPath,
                branchId: selectedProduct.branchId || selectedBranch,
                unit: selectedProduct.unit || ''
            } : null,
            category: formData.categoryItem,
            vendor: formData.vendor,
            branch: selectedBranch,
            globalWarranty: formData.warrantyYears,
            serialMode: serialMode,
            items: itemsToSave,
            totalItems: itemsToSave.reduce((sum, item) => sum + item.quantity, 0),
            unit: selectedProduct?.unit || '',
            addedAt: new Date().toISOString(),
            updatedAt: isEditMode ? new Date().toISOString() : null
        };

        console.log('Submitting stock data:', stockData);

        try {
            setLoading(prev => ({ ...prev, submitting: true }));

            let response;

            if (isEditMode) {
                response = await fetch(`http://localhost:5001/stocks/${editData.stockGroupId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stockData),
                });
            } else {
                response = await fetch('http://localhost:5001/stocks', {
                    method: 'POST',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stockData),
                });
            }

            if (!response.ok) throw new Error('Failed to save');

            // Reset form
            setFormData({ categoryItem: '', vendor: '', warrantyYears: 0 });
            setSelectedBranch('');
            setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 0, warranty: 0 }]);
            setSelectedProduct(null);
            setSerialMode(null);
            setVendorProducts([]);
            setFilteredProducts([]);

            toast.success(isEditMode ?
                `Stock updated successfully! ${itemsToSave.length} item(s) updated.` :
                `Stock added successfully! ${itemsToSave.length} item(s) saved.`
            );

            if (onSuccess) onSuccess();
            if (onClose) onClose();

        } catch (error) {
            console.error('Error saving:', error);
            setError(isEditMode ? 'Failed to update stock' : 'Failed to save stock');
        } finally {
            setLoading(prev => ({ ...prev, submitting: false }));
        }
    };

    // CLOSE DROPDOWNS ON OUTSIDE CLICK
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCategoryDropdown && categoryDropdownRef.current && !categoryDropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }
            if (showVendorDropdown && vendorDropdownRef.current && !vendorDropdownRef.current.contains(event.target)) {
                setShowVendorDropdown(false);
            }
        };
        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showCategoryDropdown, showVendorDropdown]);

    // GET VENDOR PRODUCTS WHEN VENDOR CHANGES
    useEffect(() => {
        if (formData.vendor && vendors.length > 0) {
            getVendorProducts(formData.vendor);
        }
    }, [formData.vendor, vendors]);

    // WARRANTY BADGE COLOR
    const getWarrantyColor = (years) => {
        if (years >= 4) return 'bg-green-100 text-green-800 border-green-200';
        if (years >= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
        if (years >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
        if (years >= 1) return 'bg-gray-100 text-gray-800 border-gray-200';
        return 'bg-red-100 text-red-800 border-red-200';
    };

    // Show loading when loading edit data
    if (loading.loadingEditData) {
        return (
            <div className="p-4 md:p-6">
                <div className="flex items-center justify-center h-64">
                    <div className="text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading stock data...</p>
                    </div>
                </div>
            </div>
        );
    }

    // RENDER
    return (
        <div className=''>
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Stock' : 'Add New Stock'}
                </h2>
                {isEditMode && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                        <span className="text-sm text-blue-700">
                            Editing: {formData.categoryItem || 'Stock Item'}
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={submitForm} className="space-y-6">
                {/* VENDOR & PRODUCT SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Vendor Dropdown - ✅ FIXED */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={(e) => {
                                    filterVendors(e.target.value);
                                    setShowVendorDropdown(true);
                                }}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVendorDropdown(true);
                                    setShowCategoryDropdown(false);
                                }}
                                placeholder="Type to search vendor..."
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={loading.vendors}
                            />
                            {loading.vendors ? (
                                <div className="absolute right-3 top-2.5">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
                                </div>
                            ) : (
                                <div className="absolute right-3 top-2.5">
                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                    </svg>
                                </div>
                            )}
                        </div>

                        {/* ✅ FIXED: Vendor dropdown with filtered results */}
                        {showVendorDropdown && (
                            <div ref={vendorDropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {filteredVendors.length > 0 ? (
                                    filteredVendors.map((vendor) => (
                                        <div
                                            key={vendor.id}
                                            className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                                            onClick={() => handleVendorSelect(vendor)}
                                        >
                                            <div className="font-medium text-gray-800">{vendor.vendor_name}</div>
                                            <div className="text-xs text-gray-500 mt-0.5">
                                                Products: {vendor.selected_products?.length || 0}
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-4 text-center">
                                        <p className="text-gray-500 text-sm">
                                            {formData.vendor 
                                                ? `No vendors found for "${formData.vendor}"`
                                                : 'No vendors available'}
                                        </p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Product Dropdown */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Items *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.categoryItem}
                                onChange={(e) => filterProducts(e.target.value)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (formData.vendor) {
                                        if (vendorProducts.length === 0) {
                                            getVendorProducts(formData.vendor);
                                        }
                                        setShowCategoryDropdown(true);
                                        setShowVendorDropdown(false);
                                    } else {
                                        setError('Please select vendor first');
                                    }
                                }}
                                placeholder={formData.vendor ? "Select product" : "Select vendor first"}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                disabled={!formData.vendor}
                            />
                            <div className="absolute right-3 top-2.5">
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </div>
                        </div>

                        {showCategoryDropdown && formData.vendor && (
                            <div ref={categoryDropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <p className="text-xs font-medium text-gray-700">
                                        Products from: <span className="text-blue-600">{formData.vendor}</span>
                                        <span className="ml-2 text-green-600">({filteredProducts.length} items)</span>
                                    </p>
                                </div>

                                {filteredProducts.length > 0 ? (
                                    filteredProducts.map((product) => (
                                        <div
                                            key={product.id}
                                            className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
                                            onClick={() => handleProductSelect(product)}
                                        >
                                            <div className="font-medium text-gray-800">{product.name}</div>
                                            <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                                                <span className="truncate">{product.fullPath}</span>
                                                <div className="flex gap-2">
                                                    {product.unit && (
                                                        <span className="font-medium text-blue-600">
                                                            Unit: {product.unit}
                                                        </span>
                                                    )}
                                                    {product.branchId && (
                                                        <span className="font-medium text-green-600">
                                                            Branch: {product.branchId}
                                                        </span>
                                                    )}
                                                </div>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="px-3 py-6 text-center">
                                        <p className="text-gray-500 text-sm">No products found</p>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Quick Add Rows (only for serial mode) */}
                    {serialMode === true && (
                        <div className="md:col-span-2">
                            <label className="block text-sm font-medium text-gray-700 mb-2">Quick Add Rows</label>
                            <div className="flex flex-wrap gap-2">
                                {[10, 20, 30, 40].map((count) => (
                                    <button
                                        key={count}
                                        type="button"
                                        onClick={() => addMultipleRows(count)}
                                        className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                                    >
                                        Add {count} Rows
                                    </button>
                                ))}
                            </div>
                        </div>
                    )}

                    {/* Apply Warranty to All (Optional) */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Apply Warranty to All Items (Optional)</label>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4].map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => applyWarrantyToAll(year)}
                                    className={`px-3 py-1.5 rounded-lg border text-sm ${formData.warrantyYears >= year
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {year} Year{year > 1 ? 's' : ''}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => applyWarrantyToAll(0)}
                                className={`px-3 py-1.5 rounded-lg border text-sm ${formData.warrantyYears === 0
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                No Warranty
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Apply same warranty to all items (optional) - Each item can also have individual warranty
                        </p>
                    </div>
                </div>

                {/* STOCK ITEMS TABLE */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-base md:text-lg font-semibold text-gray-800">Stock Details</h2>
                        {serialMode === true && (
                            <button
                                type="button"
                                onClick={addSingleRow}
                                className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm"
                            >
                                + Add Single Row
                            </button>
                        )}
                    </div>

                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                                    {serialMode === true && (
                                        <>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial Number *</th>
                                            <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">MAC Address</th>
                                        </>
                                    )}
                                    {/* Quantity column - sirf serialMode === false par dikhe */}
                                    {serialMode === false && (
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity *</th>
                                    )}
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warranty (Years)</th>
                                    {serialMode === true && stockItems.length > 1 && (
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stockItems.map((item, index) => {
                                    // Serial mode true hai toh quantity automatically 1 set karenge
                                    if (serialMode === true) {
                                        // Agar quantity 0 hai ya undefined hai toh automatically 1 set karenge
                                        if (item.quantity <= 0) {
                                            changeItemValue(item.id, 'quantity', 1);
                                        }
                                    }

                                    return (
                                        <tr key={item.id} className="hover:bg-gray-50">
                                            <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{index + 1}</td>

                                            {serialMode === true && (
                                                <>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.serialNumber}
                                                            onChange={(e) => changeItemValue(item.id, 'serialNumber', e.target.value)}
                                                            placeholder="Enter Serial Number..."
                                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                        />
                                                    </td>
                                                    <td className="px-4 py-3">
                                                        <input
                                                            type="text"
                                                            value={item.macAddress}
                                                            onChange={(e) => changeItemValue(item.id, 'macAddress', e.target.value)}
                                                            placeholder="Enter macAddress..."
                                                            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
                                                        />
                                                    </td>
                                                </>
                                            )}

                                            {/* Quantity field - sirf serialMode === false par dikhe */}
                                            {serialMode === false && (
                                                <td className="px-4 py-3">
                                                    <input
                                                        type="number"
                                                        min="1"
                                                        value={item.quantity}
                                                        onChange={(e) => changeItemValue(item.id, 'quantity', e.target.value)}
                                                        placeholder="Enter quantity"
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    />
                                                </td>
                                            )}

                                            <td className="px-4 py-3">
                                                <div className="flex items-center gap-2">
                                                    <select
                                                        value={item.warranty}
                                                        onChange={(e) => changeItemValue(item.id, 'warranty', e.target.value)}
                                                        className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                                    >
                                                        <option value="0">No Warranty</option>
                                                        <option value="1">1 Year</option>
                                                        <option value="2">2 Years</option>
                                                        <option value="3">3 Years</option>
                                                        <option value="4">4 Years</option>
                                                    </select>
                                                    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getWarrantyColor(item.warranty)}`}>
                                                        {item.warranty > 0 ? `${item.warranty}Y` : 'No'}
                                                    </span>
                                                </div>
                                            </td>
                                            {serialMode === true && stockItems.length > 1 && (
                                                <td className="px-4 py-3 whitespace-nowrap">
                                                    <button
                                                        type="button"
                                                        onClick={() => removeRow(item.id)}
                                                        className="px-2 py-1 text-red-600 hover:text-red-900 text-sm border border-red-200 rounded-lg hover:bg-red-50"
                                                    >
                                                        Remove
                                                    </button>
                                                </td>
                                            )}
                                        </tr>
                                    );
                                })}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SUBMIT BUTTONS */}
                <div className="flex flex-col md:flex-row md:justify-between gap-4 md:items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Mode:</span> {serialMode === true ? 'Serial Numbers' : serialMode === false ? 'Quantity Only' : 'Not Selected'} |
                        <span className="font-medium ml-2">Rows:</span> {stockItems.length}
                        {selectedProduct?.unit && (
                            <span className="font-medium ml-2">| Unit:</span>
                        )}
                        <span className="ml-1">{selectedProduct?.unit || ''}</span>
                        {selectedBranch && (
                            <span className="font-medium ml-2">| Branch:</span>
                        )}
                        <span className="ml-1">{selectedBranch || ''}</span>
                    </div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={onClose}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 font-medium text-sm"
                            disabled={loading.submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
                            disabled={loading.submitting || !formData.vendor || !formData.categoryItem}
                        >
                            {loading.submitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    {isEditMode ? 'Updating...' : 'Adding...'}
                                </span>
                            ) : (
                                isEditMode ? 'Update Stock' : 'Add Stock'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default AddStock;