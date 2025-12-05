"use client";

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';
import { useSearchParams } from 'next/navigation';

function AddStock({ onClose, onSuccess }) {
    const searchParams = useSearchParams();
    
    // Check if we're in edit mode
    const isEditMode = searchParams.get('edit') === 'true';
    const stockGroupId = searchParams.get('stockGroupId');
    
    const [formData, setFormData] = useState({
        categoryItem: '',
        vendor: '',
        warrantyYears: 0,
    });

    const [selectedProduct, setSelectedProduct] = useState(null);
    const [serialMode, setSerialMode] = useState(null);
    const [selectedBranch, setSelectedBranch] = useState(''); // Auto-selected branch

    const [stockItems, setStockItems] = useState([
        { id: 1, serialNumber: '', macAddress: '', quantity: 1, warranty: 0 }
    ]);

    const [categories, setCategories] = useState([]);
    const [vendors, setVendors] = useState([]);
    const [vendorProducts, setVendorProducts] = useState([]);
    const [filteredProducts, setFilteredProducts] = useState([]);

    const [loading, setLoading] = useState({ 
        categories: true, 
        vendors: true, 
        submitting: false,
        loadingEditData: isEditMode 
    });
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false);
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);
    const [error, setError] = useState('');

    const categoryDropdownRef = useRef(null);
    const vendorDropdownRef = useRef(null);

    // LOAD EDIT DATA IF IN EDIT MODE
    useEffect(() => {
        if (isEditMode && stockGroupId) {
            loadEditData();
        }
    }, [isEditMode, stockGroupId]);

    const loadEditData = async () => {
        try {
            setLoading(prev => ({ ...prev, loadingEditData: true }));
            
            // Fetch the stock group data
            const response = await fetch(`http://localhost:5001/stocks/${stockGroupId}`);
            if (!response.ok) throw new Error('Failed to load edit data');
            
            const stockGroup = await response.json();
            
            // Set form data from stock group
            setFormData({
                categoryItem: stockGroup.category || '',
                vendor: stockGroup.vendor || '',
                warrantyYears: stockGroup.globalWarranty || 0,
            });
            
            // Set branch from stock group
            setSelectedBranch(stockGroup.branch || '');
            
            // Set selected product
            if (stockGroup.product) {
                const product = {
                    id: stockGroup.product.id,
                    name: stockGroup.product.name,
                    fullPath: stockGroup.product.fullPath,
                    originalProduct: stockGroup.product
                };
                setSelectedProduct(product);
                
                // Set serial mode
                const needsSerial = stockGroup.serialMode === true;
                setSerialMode(needsSerial);
                
                // Set stock items
                if (stockGroup.items && stockGroup.items.length > 0) {
                    const itemsWithIds = stockGroup.items.map((item, index) => ({
                        id: index + 1,
                        serialNumber: item.serialNumber || '',
                        macAddress: item.macAddress || '',
                        quantity: item.quantity || 1,
                        warranty: item.warranty || 0,
                    }));
                    setStockItems(itemsWithIds);
                }
            }
            
            // Load vendor products if vendor is set
            if (stockGroup.vendor) {
                getVendorProducts(stockGroup.vendor);
            }
            
        } catch (error) {
            console.error('Error loading edit data:', error);
            toast.error('Failed to load data for editing');
        } finally {
            setLoading(prev => ({ ...prev, loadingEditData: false }));
        }
    };

    // 1. FETCH INITIAL DATA
    useEffect(() => {
        // Load categories
        fetch('http://localhost:5001/categories')
            .then(res => res.json())
            .then(data => {
                const list = data.list || [];
                const flatCategories = flattenCategories(list);
                setCategories(flatCategories);
                setLoading(prev => ({ ...prev, categories: false }));
            })
            .catch(err => {
                console.error('Error fetching categories:', err);
                setError('Failed to load categories');
                setLoading(prev => ({ ...prev, categories: false }));
            });

        // Load vendors
        fetch('http://localhost:5001/vendors')
            .then(res => res.json())
            .then(data => {
                const activeVendors = data.filter(v => v.status === 'Active' && !v.blacklisted);
                setVendors(activeVendors);
                setLoading(prev => ({ ...prev, vendors: false }));
            })
            .catch(err => {
                console.error('Error fetching vendors:', err);
                setError('Failed to load vendors');
                setLoading(prev => ({ ...prev, vendors: false }));
            });
    }, []);

    // 2. FLATTEN CATEGORIES
    const flattenCategories = (categories, level = 0, parentPath = '') => {
        let result = [];
        categories.forEach(cat => {
            const path = parentPath ? `${parentPath} > ${cat.name}` : cat.name;
            result.push({
                ...cat,
                fullPath: path,
                displayName: level > 0 ? '  '.repeat(level) + '↳ ' + cat.name : cat.name,
                level: level
            });
            if (cat.children?.length) {
                result = result.concat(flattenCategories(cat.children, level + 1, path));
            }
        });
        return result;
    };

    // 3. GET VENDOR PRODUCTS - Updated to extract branch from product
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
        
        // Extract branch ID from the first product that has it
        let branchFound = null;
        const formattedProducts = products.map(p => {
            // Check if product has branch information
            if (p.branchId && !branchFound) {
                branchFound = p.branchId;
            }
            
            return {
                id: p.id,
                name: p.name || p.productName,
                fullPath: p.fullPath || p.name,
                description: p.description || '',
                categoryIds: p.category || [],
                branchId: p.branchId || null, // Store branch ID from product
                branchName: p.branchName || null,
                originalProduct: p.originalProduct || p
            };
        });

        // If branch found in products, set it
        if (branchFound) {
            // Find branch name from branches API or use ID
            setSelectedBranch(branchFound);
        }

        setVendorProducts(formattedProducts);
        setFilteredProducts(formattedProducts);
        return formattedProducts;
    };

    // 4. HANDLE PRODUCT SELECTION - Auto-set branch from product
    const handleProductSelect = (product) => {
        setSelectedProduct(product);
        setFormData(prev => ({ ...prev, categoryItem: product.fullPath || product.name }));

        // Check if product needs serial numbers
        let needsSerial = false;
        if (product.originalProduct) {
            const op = product.originalProduct;
            needsSerial = op.isSerial === true || op.isSerial === "1" || op.isSerial === "true";
        }

        setSerialMode(needsSerial);

        // Set branch from product if available
        if (product.branchId) {
            setSelectedBranch(product.branchId);
        }

        // Reset table based on mode
        if (needsSerial) {
            setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 1, warranty: 0 }]);
        } else {
            setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 1, warranty: 0 }]);
        }

        setShowCategoryDropdown(false);
        setError('');
    };

    // 5. HANDLE VENDOR SELECTION - Auto-extract branch from vendor's products
    const handleVendorSelect = (vendor) => {
        setFormData({
            categoryItem: '',
            vendor: vendor.vendor_name,
            warrantyYears: 0
        });
        setSelectedProduct(null);
        setSerialMode(null);
        setSelectedBranch(''); // Reset branch

        const products = getVendorProducts(vendor.vendor_name);
        if (products.length === 0) {
            setError('This vendor has no products.');
        }

        setShowVendorDropdown(false);
        setShowCategoryDropdown(false);
    };

    // 6. FILTER FUNCTIONS
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

    const filterVendors = (search) => {
        setFormData(prev => ({ ...prev, vendor: search, categoryItem: '' }));
        setSelectedProduct(null);
        setSerialMode(null);
        setSelectedBranch(''); // Reset branch
        setVendorProducts([]);
        setFilteredProducts([]);
    };

    // 7. ADD/REMOVE ROWS (same as before)
    const addMultipleRows = (count) => {
        const newItems = [];
        const startId = stockItems.length + 1;
        for (let i = 0; i < count; i++) {
            newItems.push({
                id: startId + i,
                serialNumber: '',
                macAddress: '',
                quantity: 1,
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
            quantity: 1,
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

    // 8. CHANGE TABLE VALUES (same as before)
    const changeItemValue = (id, field, value) => {
        const updated = stockItems.map(item => {
            if (item.id === id) {
                if (field === 'quantity') {
                    return { ...item, [field]: parseInt(value) || 0 };
                }
                if (field === 'warranty') {
                    return { ...item, [field]: parseInt(value) || 0 };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        setStockItems(updated);
    };

    // 9. APPLY WARRANTY TO ALL ROWS (same as before)
    const applyWarrantyToAll = (years) => {
        setFormData(prev => ({ ...prev, warrantyYears: years }));
        const updated = stockItems.map(item => ({ ...item, warranty: years }));
        setStockItems(updated);
    };

    // 10. VALIDATE FORM - Updated for auto-branch
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
        } else if (serialMode === false) {
            if (stockItems[0].quantity <= 0) {
                setError('Please enter a valid quantity');
                return false;
            }
        }
        return true;
    };

    // 11. SUBMIT FORM - Include auto-selected branch
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
                quantity: 1,
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
                branchId: selectedProduct.branchId || selectedBranch
            } : null,
            category: formData.categoryItem,
            vendor: formData.vendor,
            branch: selectedBranch, // Auto-selected branch from product
            globalWarranty: formData.warrantyYears,
            serialMode: serialMode,
            items: itemsToSave,
            totalItems: itemsToSave.reduce((sum, item) => sum + item.quantity, 0),
            addedAt: isEditMode ? new Date().toISOString() : new Date().toISOString(),
            updatedAt: isEditMode ? new Date().toISOString() : null
        };

        try {
            setLoading(prev => ({ ...prev, submitting: true }));
            
            let response;
            
            if (isEditMode) {
                // UPDATE existing stock
                response = await fetch(`http://localhost:5001/stocks/${stockGroupId}`, {
                    method: 'PUT',
                    headers: { 'Content-Type': 'application/json' },
                    body: JSON.stringify(stockData),
                });
            } else {
                // CREATE new stock
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
            setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 1, warranty: 0 }]);
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

    // 12. CLOSE DROPDOWNS ON OUTSIDE CLICK
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

    // 13. GET VENDOR PRODUCTS WHEN VENDOR CHANGES
    useEffect(() => {
        if (formData.vendor) {
            getVendorProducts(formData.vendor);
        }
    }, [formData.vendor]);

    // 14. WARRANTY BADGE COLOR
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
        <div className="p-4 md:p-6">
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">
                    {isEditMode ? 'Edit Stock' : 'Add New Stock'}
                </h2>
                <p className="text-gray-600 text-sm mt-1">
                    {isEditMode ? 'Edit existing stock items' : 'Add new stock items to inventory'}
                </p>
                
                {isEditMode && (
                    <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
                        <span className="text-sm text-blue-700">
                            Editing Stock ID: {stockGroupId}
                        </span>
                    </div>
                )}
            </div>

            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            {/* Show auto-selected branch info */}
            {selectedBranch && (
                <div className="mb-4 p-3 bg-green-50 border border-green-200 rounded-lg">
                    <p className="text-green-700 text-sm">
                        <span className="font-medium">Auto-selected Branch:</span> {selectedBranch}
                        {selectedProduct?.branchName && ` (${selectedProduct.branchName})`}
                    </p>
                </div>
            )}

            <form onSubmit={submitForm} className="space-y-6">
                {/* VENDOR & PRODUCT SECTION */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
                    {/* Vendor Dropdown */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">Vendor *</label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={(e) => filterVendors(e.target.value)}
                                onClick={(e) => {
                                    e.stopPropagation();
                                    setShowVendorDropdown(true);
                                    setShowCategoryDropdown(false);
                                }}
                                placeholder="Select vendor"
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

                        {showVendorDropdown && vendors.length > 0 && (
                            <div ref={vendorDropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
                                {vendors.map((vendor) => (
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
                                ))}
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
                                disabled={loading.categories || !formData.vendor}
                            />
                            {loading.categories ? (
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

                        {showCategoryDropdown && formData.vendor && (
                            <div ref={categoryDropdownRef} className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <p className="text-xs font-medium text-gray-700">
                                        Products from: <span className="text-blue-600">{formData.vendor}</span>
                                        <span className="ml-2 text-green-600">({filteredProducts.length} items)</span>
                                        {selectedBranch && (
                                            <span className="ml-2 text-orange-600">
                                                Branch: {selectedBranch}
                                            </span>
                                        )}
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
                                                {product.branchId && (
                                                    <span className="text-blue-600 ml-2">
                                                        Branch: {product.branchId}
                                                    </span>
                                                )}
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

                    {/* Branch Display (Read-only) */}
                    {selectedBranch && (
                        <div className="md:col-span-2">
                            <div className="p-3 bg-gray-50 border border-gray-200 rounded-lg">
                                <p className="text-sm text-gray-700">
                                    <span className="font-medium">Auto-selected Branch:</span> {selectedBranch}
                                    <span className="ml-2 text-xs text-gray-500">
                                        (From selected product)
                                    </span>
                                </p>
                            </div>
                        </div>
                    )}

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

                {/* STOCK ITEMS TABLE (same as before) */}
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
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Quantity {serialMode === false && '*'}</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warranty (Years)</th>
                                    {serialMode === true && stockItems.length > 1 && (
                                        <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                                    )}
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stockItems.map((item, index) => (
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

                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                min="0"
                                                value={item.quantity}
                                                onChange={(e) => changeItemValue(item.id, 'quantity', e.target.value)}
                                                placeholder="Enter quantity"
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
                                            />
                                        </td>
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
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* SUBMIT BUTTONS */}
                <div className="flex flex-col md:flex-row md:justify-between gap-4 md:items-center pt-4 border-t border-gray-200">
                    <div className="text-sm text-gray-600">
                        <span className="font-medium">Mode:</span> {serialMode === true ? 'Serial Numbers' : serialMode === false ? 'Quantity Only' : 'Not Selected'} |
                        <span className="font-medium ml-2">Rows:</span> {stockItems.length} |
                        <span className="font-medium ml-2">Branch:</span> {selectedBranch || 'Will auto-select from product'}
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