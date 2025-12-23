import React, { useEffect, useState, useRef, useCallback } from "react";
import DataFetcher from "../DataFetcher";

const StockTable = ({
    filteredStocks,
    setDetailsPage,
    setCurrentSerialsIdProudct,
    setOpen,
    seteditStock,
    fetchStocks
}) => {
    const [productMap, setProductMap] = useState({});
    const [vendorMap, setVendorMap] = useState({});
    const [filteredData, setFilteredData] = useState([]);
    
    // Filter states
    const [hasSerialFilter, setHasSerialFilter] = useState("all");
    const [vendorFilter, setVendorFilter] = useState("all");
    const [productFilter, setProductFilter] = useState("all");
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    
    // Search state
    const [searchTerm, setSearchTerm] = useState("");

    // State for edit popup
    const [isEditPopupOpen, setIsEditPopupOpen] = useState(false);
    const [selectedStock, setSelectedStock] = useState(null);
    const [editQuantity, setEditQuantity] = useState("");
    const [editWarranty, setEditWarranty] = useState("");
    const [isSubmitting, setIsSubmitting] = useState(false);

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage, setItemsPerPage] = useState(10);
    const [pageNumbers, setPageNumbers] = useState([]);

    // Calculate pagination
    const indexOfLastItem = currentPage * itemsPerPage;
    const indexOfFirstItem = indexOfLastItem - itemsPerPage;
    const currentItems = filteredData.slice(indexOfFirstItem, indexOfLastItem);
    const totalPages = Math.ceil(filteredData.length / itemsPerPage);

    // Update page numbers when total pages change
    useEffect(() => {
        const numbers = [];
        const maxVisiblePages = 5;
        
        if (totalPages <= maxVisiblePages) {
            // Show all pages if total pages are less than max visible
            for (let i = 1; i <= totalPages; i++) {
                numbers.push(i);
            }
        } else {
            // Logic for showing limited pages with ellipsis
            if (currentPage <= 3) {
                // Near the beginning
                for (let i = 1; i <= 4; i++) {
                    numbers.push(i);
                }
                numbers.push('...');
                numbers.push(totalPages);
            } else if (currentPage >= totalPages - 2) {
                // Near the end
                numbers.push(1);
                numbers.push('...');
                for (let i = totalPages - 3; i <= totalPages; i++) {
                    numbers.push(i);
                }
            } else {
                // In the middle
                numbers.push(1);
                numbers.push('...');
                numbers.push(currentPage - 1);
                numbers.push(currentPage);
                numbers.push(currentPage + 1);
                numbers.push('...');
                numbers.push(totalPages);
            }
        }
        
        setPageNumbers(numbers);
    }, [currentPage, totalPages]);

    // Reset to page 1 when filters or search change
    useEffect(() => {
        setCurrentPage(1);
    }, [hasSerialFilter, vendorFilter, productFilter, searchTerm]);

    // Delete a stock (soft delete)
    const handleDelete = async (stock) => {
        if (stock.quantity > 0) {
            alert("Cannot delete stock with quantity greater than 0");
            return;
        }
        
        if (!confirm("Are you sure you want to delete this stock?")) return;
        try {
            // Soft delete - mark as deleted instead of removing
            const response = await fetch(`http://localhost:5001/stocks/${stock.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify({
                    isDeleted: true,
                    deletedAt: new Date().toISOString()
                })
            });
            
            if (response.ok) {
                alert("Stock deleted successfully");
                if (fetchStocks) fetchStocks();
            }
        } catch (error) {
            console.error("Error deleting stock:", error);
            alert("Failed to delete stock");
        }
    };

    // Open edit modal
    const handleEdit = useCallback((stock) => {
        setSelectedStock(stock);
        setEditQuantity(stock.quantity.toString());
        setEditWarranty(stock.warranty || "");
        setIsEditPopupOpen(true);
    }, []);

    // Close edit popup
    const handleCloseEditPopup = () => {
        setIsEditPopupOpen(false);
        setSelectedStock(null);
        setEditQuantity("");
        setEditWarranty("");
    };

    // Submit edit form
    const handleEditSubmit = async (e) => {
        e.preventDefault();
        
        if (!selectedStock) return;
        
        setIsSubmitting(true);
        try {
            const updatedStock = {
                quantity: parseInt(editQuantity) || 0,
                warranty: editWarranty || null
            };
            
            const response = await fetch(`http://localhost:5001/stocks/${selectedStock.id}`, {
                method: "PATCH",
                headers: {
                    "Content-Type": "application/json",
                },
                body: JSON.stringify(updatedStock)
            });
            
            if (response.ok) {
                alert("Stock updated successfully");
                handleCloseEditPopup();
                if (fetchStocks) fetchStocks();
            } else {
                throw new Error("Failed to update stock");
            }
        } catch (error) {
            console.error("Error updating stock:", error);
            alert("Failed to update stock");
        } finally {
            setIsSubmitting(false);
        }
    };

    const showSerials = async (id) => {
        setCurrentSerialsIdProudct(id);
        setDetailsPage(true);
    };

    // Fetch products and vendors data
    useEffect(() => {
        const fetchAllData = async () => {
            try {
                // Fetch all products
                const productsRes = await fetch("http://localhost:5001/products");
                if (productsRes.ok) {
                    const productsData = await productsRes.json();
                    setProducts(productsData);
                    
                    const tempProductMap = {};
                    productsData.forEach(product => {
                        tempProductMap[product.id] = product;
                    });
                    setProductMap(tempProductMap);
                }

                // Fetch all vendors
                const vendorsRes = await fetch("http://localhost:5001/vendors");
                if (vendorsRes.ok) {
                    const vendorsData = await vendorsRes.json();
                    setVendors(vendorsData);
                    
                    const tempVendorMap = {};
                    vendorsData.forEach(vendor => {
                        tempVendorMap[vendor.id] = vendor;
                    });
                    setVendorMap(tempVendorMap);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchAllData();
    }, []);

    // Function to perform live search
    const performSearch = (stocks, term) => {
        if (!term.trim()) return stocks;
        
        const lowerTerm = term.toLowerCase();
        
        return stocks.filter(stock => {
            const product = productMap[stock.productId];
            const vendor = vendorMap[stock.vendorId];
            
            // Search in product fields
            const productMatch = product ? (
                (product.productName?.toLowerCase().includes(lowerTerm)) ||
                (product.sku?.toLowerCase().includes(lowerTerm))
            ) : false;
            
            // Search in vendor fields
            const vendorMatch = vendor ? (
                (vendor.name?.toLowerCase().includes(lowerTerm))
            ) : false;
            
            // Search in stock fields
            const stockMatch = (
                (stock.quantity?.toString().includes(lowerTerm)) ||
                (stock.warranty?.toString().includes(lowerTerm)) ||
                (stock.createdAt?.toLowerCase().includes(lowerTerm))
            );
            
            return productMatch || vendorMatch || stockMatch;
        });
    };

    // Apply filters and search
    useEffect(() => {
        if (!filteredStocks?.length) {
            setFilteredData([]);
            return;
        }

        let result = [...filteredStocks];

        // Apply hasSerial filter
        if (hasSerialFilter !== "all") {
            result = result.filter(stock => {
                const product = productMap[stock.productId];
                if (!product) return false;
                return hasSerialFilter === "yes" ? product.hasSerialNo : !product.hasSerialNo;
            });
        }

        // Apply vendor filter
        if (vendorFilter !== "all") {
            result = result.filter(stock => stock.vendorId === vendorFilter);
        }

        // Apply product filter
        if (productFilter !== "all") {
            result = result.filter(stock => stock.productId === productFilter);
        }

        // Filter out soft deleted items
        result = result.filter(stock => !stock.isDeleted);

        // Apply live search
        result = performSearch(result, searchTerm);

        setFilteredData(result);
    }, [filteredStocks, hasSerialFilter, vendorFilter, productFilter, searchTerm, productMap, vendorMap]);

    // Get unique vendors from filtered stocks for dropdown
    const getAvailableVendors = () => {
        if (!filteredStocks?.length) return [];
        
        const vendorIds = [...new Set(filteredStocks.map(s => s.vendorId))];
        return vendors.filter(vendor => vendorIds.includes(vendor.id));
    };

    // Get unique products from filtered stocks for dropdown
    const getAvailableProducts = () => {
        if (!filteredStocks?.length) return [];
        
        const productIds = [...new Set(filteredStocks.map(s => s.productId))];
        return products.filter(product => productIds.includes(product.id));
    };

    // Reset all filters and search
    const resetFilters = () => {
        setHasSerialFilter("all");
        setVendorFilter("all");
        setProductFilter("all");
        setSearchTerm("");
        setCurrentPage(1);
    };

    // Clear search only
    const clearSearch = () => {
        setSearchTerm("");
        setCurrentPage(1);
    };

    // Pagination functions
    const goToPage = (pageNumber) => {
        if (pageNumber !== '...' && pageNumber >= 1 && pageNumber <= totalPages) {
            setCurrentPage(pageNumber);
        }
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPreviousPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    const goToFirstPage = () => {
        setCurrentPage(1);
    };

    const goToLastPage = () => {
        setCurrentPage(totalPages);
    };

    // Handle items per page change
    const handleItemsPerPageChange = (e) => {
        const value = parseInt(e.target.value);
        setItemsPerPage(value);
        setCurrentPage(1); // Reset to first page when items per page changes
    };

    // Edit Popup Component
    const EditPopup = () => {
        if (!isEditPopupOpen || !selectedStock) return null;

        const product = productMap[selectedStock.productId];
        const hasSerial = product?.hasSerialNo;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
                    <div className="px-6 py-4 border-b">
                        <h3 className="text-lg font-semibold text-gray-800">
                            Edit Stock
                        </h3>
                    </div>
                    
                    <form onSubmit={handleEditSubmit}>
                        <div className="px-6 py-4 space-y-4">
                            {/* Product Info */}
                            <div className="p-3 bg-gray-50 rounded-lg">
                                <h4 className="font-medium text-gray-700 mb-2">Product Information</h4>
                                {product ? (
                                    <div className="space-y-1">
                                        <p className="text-sm">
                                            <span className="font-medium">Name:</span> {product.productName}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">SKU:</span> {product.sku}
                                        </p>
                                        <p className="text-sm">
                                            <span className="font-medium">Has Serial No:</span> 
                                            <span className={`ml-1 ${hasSerial ? 'text-green-600' : 'text-red-600'}`}>
                                                {hasSerial ? 'Yes' : 'No'}
                                            </span>
                                        </p>
                                    </div>
                                ) : (
                                    <p className="text-sm text-gray-500">Loading product info...</p>
                                )}
                            </div>

                            {/* Quantity Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity *
                                </label>
                                <input
                                    type="number"
                                    min="0"
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                />
                            </div>

                            {/* Warranty Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Warranty Period (Years)
                                </label>
                                <input
                                    type="text"
                                    value={editWarranty}
                                    onChange={(e) => setEditWarranty(e.target.value)}
                                    placeholder="e.g., 1, 2, 0.5"
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                />
                                <p className="text-xs text-gray-500 mt-1">
                                    Enter warranty period in years for this stock batch
                                </p>
                            </div>

                            {/* Show current warranty if product has serial */}
                            {hasSerial && selectedStock.warranty && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-medium">Current Warranty:</span> {selectedStock.warranty} Years
                                    </p>
                                </div>
                            )}
                        </div>
                        
                        <div className="px-6 py-4 border-t flex justify-end space-x-3">
                            <button
                                type="button"
                                onClick={handleCloseEditPopup}
                                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-gray-500"
                                disabled={isSubmitting}
                            >
                                Cancel
                            </button>
                            <button
                                type="submit"
                                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50"
                                disabled={isSubmitting}
                            >
                                {isSubmitting ? 'Updating...' : 'Update Stock'}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        );
    };

    return (
        <div>
            {/* Edit Popup */}
            <EditPopup />

            {/* Filter Section with Search */}
            <div className="mb-6 p-4 bg-gray-50 rounded-lg shadow">
                <div className="flex justify-between items-center mb-4">
                    <h3 className="text-lg font-semibold text-gray-700">Filters & Search</h3>
                    <button
                        onClick={resetFilters}
                        className="px-3 py-1 text-sm bg-gray-200 text-gray-700 rounded hover:bg-gray-300"
                    >
                        Reset All
                    </button>
                </div>
                
                {/* Live Search Input */}
                <div className="mb-4">
                    <div className="relative">
                        <input
                            type="text"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                            placeholder="Search by product name, SKU, vendor, warranty, quantity..."
                            className="w-full px-4 py-2 pl-10 pr-10 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <div className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                            🔍
                        </div>
                        {searchTerm && (
                            <button
                                onClick={clearSearch}
                                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                type="button"
                            >
                                ✕
                            </button>
                        )}
                    </div>
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Has Serial Number
                        </label>
                        <select
                            value={hasSerialFilter}
                            onChange={(e) => setHasSerialFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All</option>
                            <option value="yes">Yes</option>
                            <option value="no">No</option>
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Vendor
                        </label>
                        <select
                            value={vendorFilter}
                            onChange={(e) => setVendorFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Vendors</option>
                            {getAvailableVendors().map(vendor => (
                                <option key={vendor.id} value={vendor.id}>
                                    {/* {vendor.name || `Vendor ${vendor.id}`} */}
                                     <DataFetcher type="vendor" id={vendor.id} />
                                </option>
                            ))}
                        </select>
                    </div>

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Product
                        </label>
                        <select
                            value={productFilter}
                            onChange={(e) => setProductFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Products</option>
                            {getAvailableProducts().map(product => (
                                <option key={product.id} value={product.id}>
                                    {product.productName || `Product ${product.id}`}
                                </option>
                            ))}
                        </select>
                    </div>
                </div>
                
                <div className="mt-4 flex flex-wrap justify-between items-center">
                    <div className="text-sm text-gray-600">
                        Showing {filteredData.length} stocks
                        {searchTerm && (
                            <span className="ml-2 text-blue-600">
                                (Search: "{searchTerm}")
                            </span>
                        )}
                    </div>
                    
                    {/* Items Per Page Selector */}
                    <div className="flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Show:</span>
                        <select
                            value={itemsPerPage}
                            onChange={handleItemsPerPageChange}
                            className="px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="5">5</option>
                            <option value="10">10</option>
                            <option value="20">20</option>
                            <option value="50">50</option>
                            <option value="100">100</option>
                        </select>
                        <span className="text-sm text-gray-600">items per page</span>
                    </div>
                </div>
            </div>

            {/* Stock Table */}
            <table className="min-w-full divide-y divide-gray-200 mt-4">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            S.No
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Product
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Is Serial
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Quantity
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Warehouse
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Vendor
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Created At
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Actions
                        </th>
                    </tr>
                </thead>

                <tbody className="bg-white divide-y divide-gray-200">
                    {currentItems?.map((stock, index) => {
                        const product = productMap[stock.productId];
                        const hasSerial = product?.hasSerialNo;
                        const actualIndex = indexOfFirstItem + index;

                        return (
                            <tr key={stock.id} className="hover:bg-gray-50">
                                <td className="px-4 py-3 whitespace-nowrap">{actualIndex + 1}</td>

                                <td className="px-4 py-3">
                                    {product ? (
                                        <>
                                            <div className="font-medium">
                                                {product.productName}
                                            </div>
                                            <div className="text-xs text-gray-500">
                                                SKU: {product.sku} | Unit: {product.unit}
                                            </div>
                                            
                                            {/* Show warranty below product if has serial and warranty exists */}
                                            {stock.warranty && (
                                                <div className="mt-1">
                                                    <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                        Warranty: {stock.warranty} Years
                                                    </span>
                                                </div>
                                            )}
                                        </>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Loading...</span>
                                    )}

                                    {hasSerial && (
                                        <button
                                            onClick={() => showSerials(stock.id)}
                                            className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                          For update &  View  Details
                                        </button>
                                    )}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${hasSerial ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {hasSerial ? "Yes" : "No"}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-3 whitespace-nowrap font-medium">
                                    <span className={`${stock.quantity === 0 ? 'text-red-600' : ''}`}>
                                        {stock.quantity}
                                    </span>
                                </td>
                                   <td className="px-4 py-3">
                                     {stock.fromWarehouse}
                                </td>
                                  
                                <td className="px-4 py-3">
                                    <DataFetcher type="vendor" id={stock.vendorId} />
                                </td>
                                
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {stock.createdAt || "NA"}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex space-x-2">
                                        {/* Edit button - only shown when hasSerial is false */}
                                        {!hasSerial && (
                                            <button
                                                onClick={() => handleEdit(stock)}
                                                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                            >
                                                Edit
                                            </button>
                                        )}
                                        
                                        {/* Delete button - only enabled when quantity is 0 */}
                                        <button
                                            onClick={() => handleDelete(stock)}
                                            className={`px-3 py-1 text-xs rounded ${stock.quantity === 0 
                                                ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                : 'bg-gray-100 text-gray-400 cursor-not-allowed'}`}
                                            disabled={stock.quantity > 0}
                                            title={stock.quantity > 0 ? "Cannot delete stock with quantity > 0" : "Delete stock"}
                                        >
                                            Delete
                                        </button>
                                    </div>
                                </td>
                            </tr>
                        );
                    })}
                    
                    {(!currentItems || currentItems.length === 0) && (
                        <tr>
                            <td colSpan="7" className="px-4 py-8 text-center text-gray-500">
                                {filteredStocks?.length > 0 
                                    ? searchTerm 
                                        ? `No stocks found for "${searchTerm}"` 
                                        : "No stocks match the current filters"
                                    : "No stocks available"}
                            </td>
                        </tr>
                    )}
                </tbody>
            </table>

            {/* Pagination Controls */}
            {filteredData.length > 0 && (
                <div className="mt-6 flex flex-col sm:flex-row items-center justify-between px-4 py-3 bg-white border-t border-gray-200 sm:px-6">
                    {/* Page Info */}
                    <div className="text-sm text-gray-700 mb-4 sm:mb-0">
                        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{" "}
                        <span className="font-medium">
                            {Math.min(indexOfLastItem, filteredData.length)}
                        </span> of{" "}
                        <span className="font-medium">{filteredData.length}</span> results
                    </div>
                    
                    {/* Pagination Buttons */}
                    <div className="flex items-center space-x-2">
                        {/* First Page Button */}
                        <button
                            onClick={goToFirstPage}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 text-sm rounded-md ${currentPage === 1 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100'}`}
                            title="First Page"
                        >
                            ««
                        </button>

                        {/* Previous Button */}
                        <button
                            onClick={goToPreviousPage}
                            disabled={currentPage === 1}
                            className={`px-3 py-1 text-sm rounded-md ${currentPage === 1 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100'}`}
                            title="Previous Page"
                        >
                            «
                        </button>

                        {/* Page Numbers */}
                        <div className="flex space-x-1">
                            {pageNumbers.map((number, index) => (
                                number === '...' ? (
                                    <span key={`ellipsis-${index}`} className="px-3 py-1 text-gray-500">
                                        ...
                                    </span>
                                ) : (
                                    <button
                                        key={number}
                                        onClick={() => goToPage(number)}
                                        className={`px-3 py-1 text-sm rounded-md ${currentPage === number 
                                            ? 'bg-blue-600 text-white' 
                                            : 'text-gray-700 hover:bg-gray-100'}`}
                                    >
                                        {number}
                                    </button>
                                )
                            ))}
                        </div>

                        {/* Next Button */}
                        <button
                            onClick={goToNextPage}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 text-sm rounded-md ${currentPage === totalPages 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100'}`}
                            title="Next Page"
                        >
                            »
                        </button>

                        {/* Last Page Button */}
                        <button
                            onClick={goToLastPage}
                            disabled={currentPage === totalPages}
                            className={`px-3 py-1 text-sm rounded-md ${currentPage === totalPages 
                                ? 'text-gray-400 cursor-not-allowed' 
                                : 'text-gray-700 hover:bg-gray-100'}`}
                            title="Last Page"
                        >
                            »»
                        </button>
                    </div>
                    
                    {/* Jump to Page */}
                    <div className="mt-4 sm:mt-0 flex items-center space-x-2">
                        <span className="text-sm text-gray-600">Go to page:</span>
                        <input
                            type="number"
                            min="1"
                            max={totalPages}
                            value={currentPage}
                            onChange={(e) => {
                                const page = parseInt(e.target.value);
                                if (page >= 1 && page <= totalPages) {
                                    setCurrentPage(page);
                                }
                            }}
                            className="w-16 px-2 py-1 text-sm border border-gray-300 rounded focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        />
                        <span className="text-sm text-gray-600">of {totalPages}</span>
                    </div>
                </div>
            )}
        </div>
    );
};

export default StockTable;