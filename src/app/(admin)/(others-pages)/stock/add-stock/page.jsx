"use client";

import { useState, useEffect, useCallback, useRef } from 'react';
import toast from 'react-hot-toast';

// ================================================
// 1. MAIN COMPONENT - AddStockForm
// ================================================
function AddStock({ onClose, onSuccess }) {
    // ALL STATES (Data Storage)

    // Form Data State (Vendor, Category, Warranty)
    const [formData, setFormData] = useState({
        categoryItem: '',      // Selected category (like "Samsung")
        vendor: '',            // Selected vendor (like "John Electronics")
        warrantyYears: 0,      // Warranty in years (0-4)
    });

    // Stock Items State (Table Rows)
    const [stockItems, setStockItems] = useState([
        {
            id: 1,               
            serialNumber: '',  
            macAddress: '', // MAC address (like "AA:BB:CC:DD:EE:FF")
            quantity: 1,        
            warranty: 0,
        }
    ]);

    // API Data States
    const [categories, setCategories] = useState([]);      // All categories from server
    const [vendors, setVendors] = useState([]);           // All vendors from server
    const [vendorProducts, setVendorProducts] = useState([]); // Vendor's products
    const [filteredProducts, setFilteredProducts] = useState([]); // Filtered products for dropdown

    // UI States
    const [isLoading, setIsLoading] = useState({
        categories: true,      // Loading categories?
        vendors: true,         // Loading vendors?
        submitting: false,     // Submitting form?
    });
    const [showCategoryDropdown, setShowCategoryDropdown] = useState(false); // Show category list?
    const [showVendorDropdown, setShowVendorDropdown] = useState(false);    // Show vendor list?
    const [error, setError] = useState('');               // Error messages

    // References (for clicking outside)
    const categoryDropdownRef = useRef(null);
    const vendorDropdownRef = useRef(null);

    // 2. HELPER FUNCTIONS (Small Tasks)

    // Function 1: Get vendor status color (Active=Green, Blacklisted=Red)
    const getVendorStatusColor = (status, blacklisted) => {
        if (blacklisted) return 'bg-red-100 text-red-800';
        if (status === 'Active') return 'bg-green-100 text-green-800';
        return 'bg-gray-100 text-gray-800';
    };

    // Function 2: Get warranty color (4 years=Green, 0=Red)
    const getWarrantyBadgeColor = (years) => {
        if (years >= 4) return 'bg-green-100 text-green-800';
        if (years >= 3) return 'bg-blue-100 text-blue-800';
        if (years >= 2) return 'bg-yellow-100 text-yellow-800';
        if (years >= 1) return 'bg-gray-100 text-gray-800';
        return 'bg-red-100 text-red-800';
    };

    // Function 3: Count vendor's products
    const getVendorProductsCount = (vendor) => {
        if (!vendor || !vendor.selected_products) return 0;
        return vendor.selected_products.length;
    };

    // 3. API FUNCTIONS (Fetch Data from Server)

    // Function 4: Fetch categories from API
    const fetchCategories = useCallback(async () => {
        try {
            setIsLoading(prev => ({ ...prev, categories: true }));
            const response = await fetch('http://localhost:5001/categories');

            if (!response.ok) throw new Error(`Failed to fetch categories`);
            const dataList = await response.json();
            const data = dataList.list || [];

            // Convert nested categories to flat list
            const flattenedCategories = flattenCategories(data);

            setCategories(flattenedCategories);
            setIsLoading(prev => ({ ...prev, categories: false }));

        } catch (error) {
            console.error('Error fetching categories:', error);
            setError('Failed to load categories. Please try again.');
            setIsLoading(prev => ({ ...prev, categories: false }));
        }
    }, []);

    // Function 5: Fetch vendors from API
    const fetchVendors = useCallback(async () => {
        try {
            setIsLoading(prev => ({ ...prev, vendors: true }));
            const response = await fetch('http://localhost:5001/vendors');

            if (!response.ok) throw new Error(`Failed to fetch vendors`);
            const data = await response.json();

            // Show only active, non-blacklisted vendors
            const activeVendors = data.filter(vendor =>
                vendor.status === 'Active' && !vendor.blacklisted
            );

            setVendors(activeVendors);
            setIsLoading(prev => ({ ...prev, vendors: false }));

        } catch (error) {
            console.error('Error fetching vendors:', error);
            setError('Failed to load vendors. Please try again.');
            setIsLoading(prev => ({ ...prev, vendors: false }));
        }
    }, []);

    // Function 6: Convert nested categories to flat list
    const flattenCategories = useCallback((categories, level = 0, parentPath = '') => {
        let result = [];

        categories.forEach(category => {
            const currentPath = parentPath ? `${parentPath} > ${category.name}` : category.name;

            result.push({
                ...category,
                fullPath: currentPath,
                displayName: level > 0 ? '  '.repeat(level) + '↳ ' + category.name : category.name,
                level: level
            });

            // Add children if exists
            if (category.children && category.children.length > 0) {
                const childCategories = flattenCategories(category.children, level + 1, currentPath);
                result = result.concat(childCategories);
            }
        });

        return result;
    }, []);

    // Function 7: Get vendor's products
    const getVendorProducts = useCallback((vendorName) => {
        if (!vendorName) {
            setVendorProducts([]);
            setFilteredProducts([]);
            return [];
        }

        // Find selected vendor
        const selectedVendor = vendors.find(v => v.vendor_name === vendorName);
        if (!selectedVendor) {
            setVendorProducts([]);
            setFilteredProducts([]);
            return [];
        }

        // Get vendor's products
        const products = selectedVendor.selected_products || [];

        // Transform products to display format
        const transformedProducts = products.map(product => ({
            id: product.id,
            name: product.name || product.productName,
            fullPath: product.fullPath || product.name,
            description: product.description || '',
            categoryIds: product.category || []
        }));

        console.log("Vendor products:", transformedProducts);
        setVendorProducts(transformedProducts);
        setFilteredProducts(transformedProducts);
        return transformedProducts;
    }, [vendors]);

    // Function 8: Filter products by search
    const filterProductsBySearch = useCallback((searchTerm) => {
        if (!searchTerm.trim()) {
            setFilteredProducts(vendorProducts);
        } else {
            const filtered = vendorProducts.filter(product =>
                product.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                product.fullPath.toLowerCase().includes(searchTerm.toLowerCase()) ||
                (product.description && product.description.toLowerCase().includes(searchTerm.toLowerCase()))
            );
            setFilteredProducts(filtered);
        }
    }, [vendorProducts]);

    // 4. EVENT HANDLERS (User Actions)

    // Function 9: When user selects a product
    const handleProductSelect = (product) => {
        setFormData(prev => ({
            ...prev,
            categoryItem: product.fullPath || product.name
        }));
        setShowCategoryDropdown(false);
        setError('');
    };

    // Function 10: When user selects a vendor
    const handleVendorSelect = (vendor) => {
        setFormData({
            categoryItem: '',
            vendor: vendor.vendor_name,
            warrantyYears: 0
        });

        // Get vendor's products
        const products = getVendorProducts(vendor.vendor_name);

        if (products.length === 0) {
            setError('This vendor has no products available.');
        } else {
            setError('');
        }

        setShowVendorDropdown(false);
        setShowCategoryDropdown(false);
    };

    // Function 11: Search/filter products
    const filterProducts = (searchTerm) => {
        filterProductsBySearch(searchTerm);
        setFormData(prev => ({ ...prev, categoryItem: searchTerm }));
        setError('');
    };

    // Function 12: Search/filter vendors
    const filterVendors = (searchTerm) => {
        setFormData(prev => ({
            ...prev,
            vendor: searchTerm,
            categoryItem: ''
        }));
        setVendorProducts([]);
        setFilteredProducts([]);
        setError('');
    };

    // Function 13: When user clicks on product input
    const handleProductFocus = (e) => {
        e.stopPropagation();
        if (!formData.vendor) {
            setError('Please select vendor first');
            return;
        }

        // Get vendor's products if not already loaded
        if (vendorProducts.length === 0) {
            getVendorProducts(formData.vendor);
        }

        setShowCategoryDropdown(true);
        if (showVendorDropdown) setShowVendorDropdown(false);
    };


    // Function 15: Select warranty (1,2,3,4 years or 0)
    const handleWarrantyChange = (years) => {
        setFormData(prev => ({ ...prev, warrantyYears: years }));

        // Update all items' warranty
        const updatedItems = stockItems.map(item => ({
            ...item,
            warranty: years
        }));
        setStockItems(updatedItems);
        setError('');
    };

    // Function 16: Add new row to table
    const addStockItemRow = () => {
        const newItem = {
            id: stockItems.length + 1,
            serialNumber: '',
            macAddress: '',
            quantity: 1,
            warranty: formData.warrantyYears,
        };
        setStockItems([...stockItems, newItem]);
        setError('');
    };

    // Function 17: Remove row from table
    const removeStockItemRow = (id) => {
        if (stockItems.length > 1) {
            const updatedItems = stockItems.filter(item => item.id !== id);
            // Re-number IDs (1,2,3...)
            const reindexedItems = updatedItems.map((item, index) => ({
                ...item,
                id: index + 1
            }));
            setStockItems(reindexedItems);
        } else {
            setError('At least one row required');
        }
    };

    // Function 18: Change table cell value
    const handleStockItemChange = (id, field, value) => {
        const updatedItems = stockItems.map(item => {
            if (item.id === id) {
                // Convert quantity to number
                if (field === 'quantity') {
                    const numValue = parseInt(value) || 0;
                    return { ...item, [field]: numValue };
                }
                return { ...item, [field]: value };
            }
            return item;
        });
        setStockItems(updatedItems);
        setError('');
    };

    

    // Function 20: Save data to API
    const saveStockToAPI = async (stockData) => {
        try {
            setIsLoading(prev => ({ ...prev, submitting: true }));
            const response = await fetch('http://localhost:5001/stocks', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stockData),
            });

            if (!response.ok) throw new Error('Failed to save');
            const result = await response.json();
            setIsLoading(prev => ({ ...prev, submitting: false }));
            return { success: true, data: result };
        } catch (error) {
            console.error('Error saving:', error);
            setIsLoading(prev => ({ ...prev, submitting: false }));
            return { success: false, error: error.message };
        }
    };

    // Function 21: Submit form
    const handleSubmit = async (e) => {
        e.preventDefault();
        setError('');

     

        // Find selected product
        const selectedProduct = vendorProducts.find(p =>
            p.fullPath === formData.categoryItem || p.name === formData.categoryItem
        );

        const stockData = {
            product: selectedProduct ? {
                id: selectedProduct.id,
                name: selectedProduct.name,
                fullPath: selectedProduct.fullPath
            } : null,
            category: formData.categoryItem,
            vendor: formData.vendor,
            warrantyYears: formData.warrantyYears,
            items: stockItems.map(item => ({
                serialNumber: item.serialNumber || '',
                macAddress: item.macAddress || '',
                quantity: item.quantity,
                warranty: item.warranty
            })),
            addedAt: new Date().toISOString(),
        };

        const result = await saveStockToAPI(stockData);
        if (result.success) {
            // Reset form
            setFormData({ categoryItem: '', vendor: '', warrantyYears: 0 });
            setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 1, warranty: 0 }]);
            setVendorProducts([]);
            setFilteredProducts([]);
            
            toast.success('Stock added successfully!');
            if (onSuccess) onSuccess();
            if (onClose) onClose();
        } else {
            setError(result.error || 'Failed to save');
        }
    };

    // Function 22: Cancel form
    const handleCancel = () => {
        if (onClose) onClose();
    };

    // 5. USE EFFECTS (Run code on events)

    // Effect 1: Load data when page opens
    useEffect(() => {
        fetchCategories();
        fetchVendors();
    }, [fetchCategories, fetchVendors]);

    // Effect 2: Close dropdown when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (showCategoryDropdown && categoryDropdownRef.current &&
                !categoryDropdownRef.current.contains(event.target)) {
                setShowCategoryDropdown(false);
            }

            if (showVendorDropdown && vendorDropdownRef.current &&
                !vendorDropdownRef.current.contains(event.target)) {
                setShowVendorDropdown(false);
            }
        };

        document.addEventListener('click', handleClickOutside);
        return () => document.removeEventListener('click', handleClickOutside);
    }, [showCategoryDropdown, showVendorDropdown]);

    // Effect 3: When vendor changes, update products
    useEffect(() => {
        if (formData.vendor) {
            getVendorProducts(formData.vendor);
        }
    }, [formData.vendor, getVendorProducts]);

    // --------------------------------------------
    // 6. RENDER COMPONENTS (UI Parts)
    // --------------------------------------------

    return (
        <div className="p-4 md:p-6">
            {/* Header */}
            <div className="mb-6">
                <h2 className="text-xl font-bold text-gray-800">Add New Stock</h2>
                <p className="text-gray-600 text-sm mt-1">Add new stock items to inventory</p>
            </div>

            {/* Error Message */}
            {error && (
                <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
                    <p className="text-red-600 text-sm">{error}</p>
                </div>
            )}

            <form onSubmit={handleSubmit} className="space-y-6">

                {/* SECTION 1: VENDOR & PRODUCT */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">

                    {/* Vendor Dropdown */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.vendor}
                                onChange={(e) => filterVendors(e.target.value)}
                               
                                onClick={(e) => {
                                    e.stopPropagation();
                                    if (!showVendorDropdown) {
                                        setShowVendorDropdown(true);
                                        setShowCategoryDropdown(false);
                                    }
                                }}
                                placeholder="Select or type to search vendor"
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading.vendors}
                            />
                            {isLoading.vendors ? (
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

                        {/* Vendor List */}
                        {showVendorDropdown && vendors.length > 0 && (
                            <div
                                ref={vendorDropdownRef}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                {vendors.map((vendor, index) => (
                                    <div
                                        key={vendor.id || index}
                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                                        onClick={(e) => {
                                            e.stopPropagation();
                                            handleVendorSelect(vendor);
                                        }}
                                    >
                                        <div className="flex justify-between items-start">
                                            <div>
                                                <div className="font-medium text-gray-800">{vendor.vendor_name}</div>
                                                <div className="text-xs text-gray-500 mt-0.5">
                                                    Products: {getVendorProductsCount(vendor)} available
                                                </div>
                                            </div>
                                            <div className="flex flex-col items-end gap-0.5">
                                                <span className={`px-2 py-0.5 rounded-full text-xs font-medium ${getVendorStatusColor(vendor.status, vendor.blacklisted)}`}>
                                                    {vendor.blacklisted ? 'Blacklisted' : vendor.status}
                                                </span>
                                            </div>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        )}
                    </div>

                    {/* Product Dropdown */}
                    <div className="relative">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product *
                        </label>
                        <div className="relative">
                            <input
                                type="text"
                                value={formData.categoryItem}
                                onChange={(e) => filterProducts(e.target.value)}
                                
                                onClick={(e) => {   
                                    e.preventDefault();
                                    
                                        handleProductFocus(e);
                                  
                                }}
                                
                                placeholder={formData.vendor ? "Select or type to search product" : "Select vendor first"}
                                className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                required
                                disabled={isLoading.categories || !formData.vendor}
                            />
                            {isLoading.categories ? (
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

                        {/* Product List */}
                        {showCategoryDropdown && formData.vendor && (
                            <div
                                ref={categoryDropdownRef}
                                className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto"
                                onClick={(e) => e.stopPropagation()}
                            >
                                <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
                                    <p className="text-xs font-medium text-gray-700">
                                        Products from: <span className="text-blue-600">{formData.vendor}</span>
                                        <span className="ml-2 text-green-600">({filteredProducts.length} items)</span>
                                    </p>
                                </div>

                                {filteredProducts.length > 0 ? (
                                    <div>
                                        {filteredProducts.map((product, index) => (
                                            <div
                                                key={`${product.id}-${index}`}
                                                className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100 last:border-b-0 text-sm"
                                                onClick={(e) => {
                                                    e.stopPropagation();
                                                    handleProductSelect(product);
                                                }}
                                            >
                                                <div className="font-medium text-gray-800">
                                                    {product.name}
                                                </div>
                                                {product.fullPath && product.fullPath !== product.name && (
                                                    <div className="text-xs text-gray-500 mt-0.5 truncate">
                                                        {product.fullPath}
                                                    </div>
                                                )}
                                                {product.description && (
                                                    <div className="text-xs text-gray-400 mt-0.5 truncate">
                                                        {product.description}
                                                    </div>
                                                )}
                                            </div>
                                        ))}
                                    </div>
                                ) : (
                                    <div className="px-3 py-6 text-center">
                                        {vendorProducts.length === 0 ? (
                                            <p className="text-gray-500 text-sm">Loading products...</p>
                                        ) : (
                                            <p className="text-gray-500 text-sm">No products found matching your search</p>
                                        )}
                                    </div>
                                )}
                            </div>
                        )}
                    </div>

                    {/* Warranty Selection */}
                    <div className="md:col-span-2">
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Warranty (Years)
                        </label>
                        <div className="flex flex-wrap gap-2">
                            {[1, 2, 3, 4].map((year) => (
                                <button
                                    key={year}
                                    type="button"
                                    onClick={() => handleWarrantyChange(year)}
                                    className={`px-3 py-1.5 rounded-lg border transition-colors text-sm ${formData.warrantyYears >= year
                                        ? 'bg-blue-500 text-white border-blue-500'
                                        : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                        }`}
                                >
                                    {year} Year{year > 1 ? 's' : ''}
                                </button>
                            ))}
                            <button
                                type="button"
                                onClick={() => handleWarrantyChange(0)}
                                className={`px-3 py-1.5 rounded-lg border text-sm ${formData.warrantyYears === 0
                                    ? 'bg-red-500 text-white border-red-500'
                                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                                    }`}
                            >
                                No Warranty
                            </button>
                        </div>
                        <p className="text-xs text-gray-500 mt-1">
                            Selecting 4 years will automatically select 1, 2, and 3 years
                        </p>
                    </div>
                </div>

                {/* SECTION 2: STOCK ITEMS TABLE */}
                <div>
                    <div className="flex justify-between items-center mb-3">
                        <h2 className="text-base md:text-lg font-semibold text-gray-800">Stock Details</h2>
                        <button
                            type="button"
                            onClick={addStockItemRow}
                            className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2 transition-colors text-sm"
                        >
                            + Add Row
                        </button>
                    </div>

                    <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
                        <table className="w-full min-w-[600px]">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Serial Number</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">MAC Address</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty</th>
                                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="divide-y divide-gray-200">
                                {stockItems.map((item, index) => (
                                    <tr key={item.id} className="hover:bg-gray-50">
                                        <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{index + 1}</td>
                                        <td className="px-4 py-3">
                                            <div className="flex items-center gap-2">
                                                <input
                                                    type="text"
                                                    value={item.serialNumber}
                                                    onChange={(e) => handleStockItemChange(item.id, 'serialNumber', e.target.value)}
                                                    placeholder="Enter Serial Number"
                                                    className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="text"
                                                value={item.macAddress}
                                                onChange={(e) => handleStockItemChange(item.id, 'macAddress', e.target.value)}
                                                placeholder="AA:BB:CC:DD:EE:FF"
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 font-mono"
                                            />
                                        </td>
                                        <td className="px-4 py-3">
                                            <input
                                                type="number"
                                                disabled
                                                min="0"
                                                step="1"
                                                value={item.quantity}
                                                onChange={(e) => handleStockItemChange(item.id, 'quantity', e.target.value)}
                                                placeholder="Enter quantity (0 or more)"
                                                className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                            />
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            <span className={`px-2 py-1 rounded-full text-xs font-medium ${getWarrantyBadgeColor(item.warranty)}`}>
                                                {item.warranty > 0 ? `${item.warranty} Year${item.warranty > 1 ? 's' : ''}` : 'No Warranty'}
                                            </span>
                                        </td>
                                        <td className="px-4 py-3 whitespace-nowrap">
                                            {stockItems.length > 1 && (
                                                <button
                                                    type="button"
                                                    onClick={() => removeStockItemRow(item.id)}
                                                    className="px-2 py-1 text-red-600 hover:text-red-900 font-medium text-sm border border-red-200 rounded-lg hover:bg-red-50 transition-colors"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>

                    <p className="text-xs text-gray-500 mt-2">
                        * All fields are optional. You can enter 0 quantity.
                    </p>
                </div>

                {/* SECTION 3: SUBMIT BUTTONS */}
                <div className="flex flex-col md:flex-row md:justify-between gap-4 md:items-center pt-4 border-t border-gray-200">
                    <div></div>
                    <div className="flex gap-3">
                        <button
                            type="button"
                            onClick={handleCancel}
                            className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 font-medium text-sm transition-colors"
                            disabled={isLoading.submitting}
                        >
                            Cancel
                        </button>
                        <button
                            type="submit"
                            className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors text-sm disabled:opacity-50 disabled:cursor-not-allowed"
                            disabled={isLoading.submitting || !formData.vendor || !formData.categoryItem}
                        >
                            {isLoading.submitting ? (
                                <span className="flex items-center gap-2">
                                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                                    Adding...
                                </span>
                            ) : (
                                'Add Stock'
                            )}
                        </button>
                    </div>
                </div>
            </form>
        </div>
    );
}

export default AddStock;