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
    const [warehouseMap, setWarehouseMap] = useState({});
    const [filteredData, setFilteredData] = useState([]);
    
    // Filter states
    const [hasSerialFilter, setHasSerialFilter] = useState("all");
    const [vendorFilter, setVendorFilter] = useState("all");
    const [productFilter, setProductFilter] = useState("all");
    const [warehouseFilter, setWarehouseFilter] = useState("all");
    const [vendors, setVendors] = useState([]);
    const [products, setProducts] = useState([]);
    const [warehouses, setWarehouses] = useState([]);
    
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
    }, [hasSerialFilter, vendorFilter, productFilter, warehouseFilter, searchTerm]);

    // Delete a stock (soft delete)
    const handleDelete = async (stock) => {
        // Check if stock has serial items
        const hasSerialItems = stock.items && stock.items.length > 0;
        
        // For serialized products, check if all items are available (not assigned/sold)
        let canDelete = true;
        let errorMessage = "";
        
        if (hasSerialItems) {
            // Check if any serial item is assigned/sold
            // You might need to check from your server if items are assigned
            // For now, we'll show a warning
            if (!confirm("This stock has serialized items. Deleting will also remove these items. Are you sure?")) {
                return;
            }
        } else {
            // For non-serialized products
            if (stock.quantity > 0) {
                alert("Cannot delete stock with quantity greater than 0");
                return;
            }
            
            if (!confirm("Are you sure you want to delete this stock?")) return;
        }
        
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
        
        const product = productMap[selectedStock.productId];
        const hasSerial = product?.hasserialno;
        
        // Validation
        if (hasSerial) {
            if (selectedStock.items && selectedStock.items.length > parseInt(editQuantity)) {
                alert(`Cannot reduce quantity below ${selectedStock.items.length} because you have ${selectedStock.items.length} serialized items. Please remove serial items first.`);
                return;
            }
        }
        
        setIsSubmitting(true);
        try {
            const updatedStock = {
                quantity: parseInt(editQuantity) || 0,
                warranty: editWarranty || null
            };
            
            // If quantity is 0 for non-serial product, ask for confirmation
            if (!hasSerial && parseInt(editQuantity) === 0) {
                if (!confirm("Setting quantity to 0 will make this stock eligible for deletion. Continue?")) {
                    setIsSubmitting(false);
                    return;
                }
            }
            
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

    // Fetch products, vendors and warehouses data
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

                // Fetch all warehouses
                const warehousesRes = await fetch("http://localhost:5001/warehouses");
                if (warehousesRes.ok) {
                    const warehousesData = await warehousesRes.json();
                    setWarehouses(warehousesData);
                    
                    const tempWarehouseMap = {};
                    warehousesData.forEach(warehouse => {
                        tempWarehouseMap[warehouse.id] = warehouse;
                    });
                    setWarehouseMap(tempWarehouseMap);
                }
            } catch (error) {
                console.error("Error fetching data:", error);
            }
        };

        fetchAllData();
    }, []);

    // Function to check if product has serial numbers
    const checkIfHasSerial = (stock) => {
        const product = productMap[stock.productId];
        if (!product) return false;
        
        // First check product property
        if (product.hasserialno !== undefined) {
            return product.hasserialno;
        }
        
        // Fallback: check if stock has items array
        return stock.items && stock.items.length > 0;
    };

    // Function to get actual quantity (handles both serial and non-serial)
    const getActualQuantity = (stock) => {
        const hasSerial = checkIfHasSerial(stock);
        
        if (hasSerial) {
            // For serialized products, quantity should match items length
            return stock.items ? stock.items.length : 0;
        } else {
            // For non-serialized products
            return stock.quantity || 0;
        }
    };

    // Function to perform live search
    const performSearch = (stocks, term) => {
        if (!term.trim()) return stocks;
        
        const lowerTerm = term.toLowerCase();
        
        return stocks.filter(stock => {
            const product = productMap[stock.productId];
            const vendor = vendorMap[stock.vendorId];
            const warehouse = warehouseMap[stock.warehouseId];
            
            // Search in product fields
            const productMatch = product ? (
                (product.productName?.toLowerCase().includes(lowerTerm)) ||
                (product.sku?.toLowerCase().includes(lowerTerm))
            ) : false;
            
            // Search in vendor fields
            const vendorMatch = vendor ? (
                (vendor.name?.toLowerCase().includes(lowerTerm))
            ) : false;
            
            // Search in warehouse fields
            const warehouseMatch = warehouse ? (
                (warehouse.name?.toLowerCase().includes(lowerTerm)) ||
                (stock.fromWarehouse?.toLowerCase().includes(lowerTerm))
            ) : false;
            
            // Search in stock fields
            const stockMatch = (
                (stock.quantity?.toString().includes(lowerTerm)) ||
                (stock.warranty?.toString().includes(lowerTerm)) ||
                (stock.createdAt?.toLowerCase().includes(lowerTerm)) ||
                (stock.id?.toLowerCase().includes(lowerTerm))
            );
            
            // Search in serial items
            let itemsMatch = false;
            if (stock.items) {
                itemsMatch = stock.items.some(item => 
                    item.serialno?.toLowerCase().includes(lowerTerm) ||
                    item.macaddress?.toLowerCase().includes(lowerTerm)
                );
            }
            
            return productMatch || vendorMatch || warehouseMatch || stockMatch || itemsMatch;
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
                const hasSerial = checkIfHasSerial(stock);
                return hasSerialFilter === "yes" ? hasSerial : !hasSerial;
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

        // Apply warehouse filter
        if (warehouseFilter !== "all") {
            result = result.filter(stock => stock.warehouseId === warehouseFilter);
        }

        // Filter out soft deleted items
        result = result.filter(stock => !stock.isDeleted);

        // Apply live search
        result = performSearch(result, searchTerm);

        setFilteredData(result);
    }, [filteredStocks, hasSerialFilter, vendorFilter, productFilter, warehouseFilter, searchTerm, productMap, vendorMap, warehouseMap]);

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

    // Get unique warehouses from filtered stocks for dropdown
    const getAvailableWarehouses = () => {
        if (!filteredStocks?.length) return [];
        
        const warehouseIds = [...new Set(filteredStocks.map(s => s.warehouseId))];
        return warehouses.filter(warehouse => warehouseIds.includes(warehouse.id));
    };

    // Reset all filters and search
    const resetFilters = () => {
        setHasSerialFilter("all");
        setVendorFilter("all");
        setProductFilter("all");
        setWarehouseFilter("all");
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
        setCurrentPage(1);
    };

    // Edit Popup Component
    const EditPopup = () => {
        if (!isEditPopupOpen || !selectedStock) return null;

        const product = productMap[selectedStock.productId];
        const hasSerial = checkIfHasSerial(selectedStock);
        const currentQuantity = getActualQuantity(selectedStock);

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
                                <h4 className="font-medium text-gray-700 mb-2">Stock Information</h4>
                                <div className="space-y-1">
                                    <p className="text-sm">
                                        <span className="font-medium">Stock ID:</span> {selectedStock.id}
                                    </p>
                                    {product && (
                                        <>
                                            <p className="text-sm">
                                                <span className="font-medium">Product:</span> {product.productName}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">SKU:</span> {product.sku}
                                            </p>
                                            <p className="text-sm">
                                                <span className="font-medium">Type:</span> 
                                                <span className={`ml-1 ${hasSerial ? 'text-green-600' : 'text-blue-600'}`}>
                                                    {hasSerial ? 'Serialized' : 'Non-Serialized'}
                                                </span>
                                            </p>
                                        </>
                                    )}
                                    <p className="text-sm">
                                        <span className="font-medium">Current Quantity:</span> {currentQuantity}
                                    </p>
                                    {selectedStock.fromWarehouse && (
                                        <p className="text-sm">
                                            <span className="font-medium">Warehouse:</span> {selectedStock.fromWarehouse}
                                        </p>
                                    )}
                                </div>
                            </div>

                            {/* Quantity Input */}
                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1">
                                    Quantity {hasSerial ? '(Based on Serial Items)' : '*'}
                                </label>
                                <input
                                    type="number"
                                    min={hasSerial ? selectedStock.items?.length || 0 : "0"}
                                    value={editQuantity}
                                    onChange={(e) => setEditQuantity(e.target.value)}
                                    className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                                    required
                                    disabled={hasSerial}
                                    title={hasSerial ? "Quantity is determined by number of serial items" : ""}
                                />
                                {hasSerial && (
                                    <p className="text-xs text-gray-500 mt-1">
                                        For serialized products, quantity is automatically calculated from serial items.
                                    </p>
                                )}
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

                            {/* Show serial items count if has serial */}
                            {hasSerial && selectedStock.items && (
                                <div className="p-3 bg-blue-50 rounded-lg border border-blue-100">
                                    <p className="text-sm text-blue-800">
                                        <span className="font-medium">Serial Items:</span> {selectedStock.items.length} items
                                    </p>
                                    {selectedStock.warranty && (
                                        <p className="text-sm text-blue-800 mt-1">
                                            <span className="font-medium">Current Warranty:</span> {selectedStock.warranty} Years
                                        </p>
                                    )}
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
                            placeholder="Search by product, SKU, vendor, warehouse, serial no, MAC..."
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
                
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Has Serial Number
                        </label>
                        <select
                            value={hasSerialFilter}
                            onChange={(e) => setHasSerialFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Types</option>
                            <option value="yes">Serialized Only</option>
                            <option value="no">Non-Serialized Only</option>
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
                                    {vendor.name || `Vendor ${vendor.id}`}
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

                    <div>
                        <label className="block text-sm font-medium text-gray-700 mb-1">
                            Warehouse
                        </label>
                        <select
                            value={warehouseFilter}
                            onChange={(e) => setWarehouseFilter(e.target.value)}
                            className="w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                        >
                            <option value="all">All Warehouses</option>
                            {getAvailableWarehouses().map(warehouse => (
                                <option key={warehouse.id} value={warehouse.id}>
                                    {warehouse.name || warehouse.id}
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
                            Product Details
                        </th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                            Type
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
                        const hasSerial = checkIfHasSerial(stock);
                        const actualIndex = indexOfFirstItem + index;
                        const quantity = getActualQuantity(stock);

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
                                                SKU: {product.sku} | ID: {stock.id}
                                            </div>
                                            
                                            {/* Show warranty and serial items info */}
                                            <div className="mt-1 space-y-1">
                                                {stock.warranty && (
                                                    <div className="inline-block">
                                                        <span className="text-xs px-2 py-1 bg-green-100 text-green-800 rounded-full">
                                                            Warranty: {stock.warranty} Years
                                                        </span>
                                                    </div>
                                                )}
                                                
                                                {hasSerial && stock.items && (
                                                    <div className="inline-block ml-2">
                                                        <span className="text-xs px-2 py-1 bg-blue-100 text-blue-800 rounded-full">
                                                            {stock.items.length} Serial Items
                                                        </span>
                                                    </div>
                                                )}
                                            </div>
                                        </>
                                    ) : (
                                        <span className="text-gray-400 text-xs">Loading...</span>
                                    )}

                                    {hasSerial && (
                                        <button
                                            onClick={() => showSerials(stock.id)}
                                            className="mt-2 px-3 py-1 text-xs bg-blue-100 text-blue-700 rounded hover:bg-blue-200"
                                        >
                                          For update & View Details
                                        </button>
                                    )}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <span className={`px-2 py-1 text-xs rounded-full ${hasSerial ? 'bg-green-100 text-green-800' : 'bg-gray-100 text-gray-800'}`}>
                                        {hasSerial ? "Serialized" : "Non-Serialized"}
                                    </span>
                                </td>
                                
                                <td className="px-4 py-3 whitespace-nowrap font-medium">
                                    <span className={`${quantity === 0 ? 'text-red-600' : ''}`}>
                                        {quantity}
                                    </span>
                                    {hasSerial && stock.items && (
                                        <div className="text-xs text-gray-500">
                                            ({stock.items.length} serial items)
                                        </div>
                                    )}
                                </td>
                                
                                <td className="px-4 py-3">
                                    {stock.fromWarehouse || "N/A"}
                                </td>
                                  
                                <td className="px-4 py-3">
                                    <DataFetcher type="vendor" id={stock.vendorId} />
                                </td>
                                
                                <td className="px-4 py-3 whitespace-nowrap text-sm">
                                    {stock.createdAt || "NA"}
                                </td>

                                <td className="px-4 py-3 whitespace-nowrap">
                                    <div className="flex space-x-2">
                                        {/* Edit button - shown based on product type */}
                                        {!hasSerial ? (
                                            // Edit for non-serialized products
                                            <button
                                                onClick={() => handleEdit(stock)}
                                                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                                title="Edit stock quantity and warranty"
                                            >
                                                Edit
                                            </button>
                                        ) : (
                                            // For serialized products, edit is limited
                                            <button
                                                onClick={() => handleEdit(stock)}
                                                className="px-3 py-1 text-xs bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200"
                                                title="Edit warranty only (quantity is based on serial items)"
                                            >
                                                Edit Warranty
                                            </button>
                                        )}
                                        
                                        {/* Delete button - different logic for serialized products */}
                                        <button
                                            onClick={() => handleDelete(stock)}
                                            className={`px-3 py-1 text-xs rounded ${
                                                hasSerial 
                                                    ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                    : quantity === 0 
                                                        ? 'bg-red-100 text-red-700 hover:bg-red-200' 
                                                        : 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                            }`}
                                            disabled={!hasSerial && quantity > 0}
                                            title={
                                                hasSerial 
                                                    ? "Delete stock and all serial items" 
                                                    : quantity > 0 
                                                        ? "Cannot delete stock with quantity > 0" 
                                                        : "Delete stock"
                                            }
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
                            <td colSpan="8" className="px-4 py-8 text-center text-gray-500">
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