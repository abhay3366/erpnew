"use client";

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useState, useEffect } from 'react';
import AddStock from './add-stock/page';

export default function StockItem() {
  const [stockItems, setStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    search: '',
    branch: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });

  const [filteredItems, setFilteredItems] = useState([]);
  const [allBranches, setAllBranches] = useState([]);

  // Pagination
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  // Dialog states
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState(null);

  // Load data
  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      // Load stock items
      const stockResponse = await fetch('http://localhost:5001/stocks');
      if (stockResponse.ok) {
        const stockData = await stockResponse.json();
        const transformedData = transformStockData(stockData);
        setStockItems(transformedData);
        setFilteredItems(transformedData);
      }

      // Load branches
      const branchResponse = await fetch("http://localhost:5001/branches");
      if (branchResponse.ok) {
        const branchData = await branchResponse.json();
        setAllBranches(branchData);
      }
    } catch (error) {
      console.error("Error loading data:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Extract only the group name from full path
  const extractGroupName = (fullPath) => {
    if (!fullPath) return 'General';

    const parts = fullPath.split('>');
    if (parts.length >= 2) {
      // Return the second last part as group name
      return parts[parts.length - 2]?.trim() || parts[0]?.trim() || 'General';
    }

    // If only one part, return it as group name
    return parts[0]?.trim() || 'General';
  };

  // Simple data transformation
  const transformStockData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    let allItems = [];
    apiData.forEach((stockGroup, groupIndex) => {
      if (stockGroup.items && Array.isArray(stockGroup.items)) {
        stockGroup.items.forEach((item, itemIndex) => {
          const quantity = item.quantity || 0;

          // Get product name from category path
          const fullPath = stockGroup.category || '';
          const pathParts = fullPath.split('>');
          const productName = pathParts.length > 0 ?
            pathParts[pathParts.length - 1].trim() :
            fullPath.trim();

          // Get group name (second last part of path)
          const groupName = extractGroupName(fullPath);

          // Generate simple SKU
          const sku = `${productName.substring(0, 3).toUpperCase()}-${groupIndex}-${itemIndex}`;

          allItems.push({
            id: `${stockGroup.id}_${itemIndex}`,
            productName: productName,
            productGroup: groupName,
            quantity: quantity,
            skuCode: sku,
            createdBy: stockGroup.vendor || 'System',
            unit: stockGroup.unit || 'Genral',
            branch: stockGroup.branchId || 'Main Branch',
            addedAt: stockGroup.addedAt || new Date().toISOString(),
            stockGroupId: stockGroup.id,
            stockItemId: item.id || `${stockGroup.id}_${itemIndex}`,
            serialNumber: item.serialNumber || '',
            macAddress: item.macAddress || '',
            warranty: item.warranty || 0,
            imageUrl: '/images/cards/card-01.jpg',
            fullPath: fullPath
          });
        });
      }
    });

    return allItems;
  };

  // Apply filters when filters change
  useEffect(() => {
    let filtered = [...stockItems];

    // Search filter
    if (filters.search.trim()) {
      const searchLower = filters.search.toLowerCase();
      filtered = filtered.filter(item =>
        item.productName.toLowerCase().includes(searchLower) ||
        item.skuCode.toLowerCase().includes(searchLower) ||
        item.productGroup.toLowerCase().includes(searchLower)
      );
    }

    // Branch filter
    if (filters.branch) {
      filtered = filtered.filter(item => item.branch === filters.branch);
    }

    // Status filter
    if (filters.status) {
      const isAvailable = filters.status === 'available';
      filtered = filtered.filter(item =>
        isAvailable ? item.quantity > 0 : item.quantity === 0
      );
    }

    // Date From filter
    if (filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item.addedAt) >= new Date(filters.dateFrom)
      );
    }

    // Date To filter
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item =>
        new Date(item.addedAt) <= to
      );
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [filters, stockItems]);

  // Handle all filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      search: '',
      branch: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Get today's date in YYYY-MM-DD format
  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // Pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page);
    }
  };

  // Handle item actions
  const handleRemoveItem = async (itemId) => {
    if (confirm('Are you sure you want to remove this item?')) {
      try {
        const stockGroupId = itemId.split('_')[0];
        await fetch(`http://localhost:5001/stocks/${stockGroupId}`, {
          method: 'DELETE',
        });
        await loadData();
        alert('Item removed successfully!');
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Error removing item');
      }
    }
  };

  // Handle edit item
  const handleEditItem = async (item) => {
    setSelectedItem(item);
    setIsLoading(true);

    try {
      // Fetch complete stock group data
      const response = await fetch(`http://localhost:5001/stocks/${item.stockGroupId}`);
      if (response.ok) {
        const stockGroup = await response.json();

        // Find the specific item in the stock group
        const stockItem = stockGroup.items?.find(it =>
          it.serialNumber === item.serialNumber ||
          (it.id && it.id === item.stockItemId)
        ) || stockGroup.items?.[0];

        // Prepare edit data
        const editData = {
          stockGroupId: item.stockGroupId,
          itemId: item.id,
          category: stockGroup.category || '',
          vendor: stockGroup.vendor || '',
          branch: stockGroup.branchId || '',
          globalWarranty: stockGroup.globalWarranty || 0,
          serialMode: stockGroup.serialMode || false,
          items: stockItem ? [stockItem] : [],
          product: stockGroup.product || null,
          addedAt: stockGroup.addedAt
        };

        setEditData(editData);
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading edit data:', error);
      alert('Failed to load item for editing');
    } finally {
      setIsLoading(false);
    }
  };

  // Close edit dialog and refresh data
  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditData(null);
    setSelectedItem(null);
    loadData(); // Refresh the list
  };

  // Format date for display
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Quantity badge color
  const getQuantityColor = (quantity) => {
    if (quantity === 0) return 'bg-red-100 text-red-800 border border-red-200';
    if (quantity <= 5) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (quantity <= 10) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  };

  // Check if any date filter is applied
  const isDateFilterApplied = filters.dateFrom || filters.dateTo;

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stocks</h1>
        <button
          onClick={() => setAddDialogOpen(true)}
          className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium"
        >
          + Add Stock
        </button>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Product/SKU</label>
            <input
              type="text"
              name="search"
              value={filters.search}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              placeholder="Product name, SKU or group..."
            />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              name="branch"
              value={filters.branch}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Branches</option>
              {allBranches.map((branch, i) => (
                <option key={i} value={branch.branchName}>{branch.branchName}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select
              name="status"
              value={filters.status}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Status</option>
              <option value="available">Available</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <div className="relative">
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 pr-10"
                max={getTodayDate()}
                onClick={(e) => e.target.showPicker()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
          </div>

          {/* To Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">To Date</label>
            <div className="relative">
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${!filters.dateFrom
                  ? 'border-gray-300 bg-gray-50 cursor-not-allowed'
                  : 'border-gray-300'
                  }`}
                max={getTodayDate()}
                disabled={!filters.dateFrom}
                onClick={(e) => !filters.dateFrom ? null : e.target.showPicker()}
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            {!filters.dateFrom && (
              <p className="text-xs text-gray-500 mt-1">Select From Date first to enable To Date</p>
            )}
          </div>
        </div>

        {/* Active Filters Display */}
        {(filters.search || filters.branch || filters.status || isDateFilterApplied) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {filters.search && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
                    Search: {filters.search}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, search: '' }))}
                      className="ml-1 text-blue-600 hover:text-blue-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.branch && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-green-100 text-green-800">
                    Branch: {filters.branch}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, branch: '' }))}
                      className="ml-1 text-green-600 hover:text-green-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.status && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-purple-100 text-purple-800">
                    Status: {filters.status === 'available' ? 'Available' : 'Out of Stock'}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, status: '' }))}
                      className="ml-1 text-purple-600 hover:text-purple-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.dateFrom && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                    From: {filters.dateFrom}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateFrom: '' }))}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
                {filters.dateTo && (
                  <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-orange-100 text-orange-800">
                    To: {filters.dateTo}
                    <button
                      onClick={() => setFilters(prev => ({ ...prev, dateTo: '' }))}
                      className="ml-1 text-orange-600 hover:text-orange-800"
                    >
                      ×
                    </button>
                  </span>
                )}
              </div>
            </div>
          </div>
        )}

        {/* Filter Buttons */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredItems.length}</span> of{' '}
            <span className="font-medium">{stockItems.length}</span> items
          </div>
          <div className="flex gap-3">
            <button
              onClick={clearFilters}
              className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
            >
              Clear All Filters
            </button>
          </div>
        </div>
      </div>

      {/* Add Stock Dialog */}
      <Dialog open={addDialogOpen} onClose={setAddDialogOpen} className="relative z-9999">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full">
              <DialogPanel transition
                className="pointer-events-auto relative w-6xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <div className="flex h-full flex-col bg-white">
                  <div className="px-4 py-4 border-b flex justify-between items-center">
                    <DialogTitle className="text-lg font-semibold">Add Stock</DialogTitle>
                    <button
                      onClick={() => setAddDialogOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    <AddStock
                      onClose={() => {
                        setAddDialogOpen(false);
                        loadData(); // Refresh data after adding
                      }}
                    />
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Edit Stock Dialog */}
      <Dialog open={editDialogOpen} onClose={setEditDialogOpen} className="relative z-99999">
        <DialogBackdrop transition className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0"  />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="fixed inset-y-0 right-0 flex max-w-full">
              <DialogPanel transition
                className="pointer-events-auto relative w-6xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
              >
                <div className="flex h-full flex-col bg-white">
                  <div className="px-4 py-4 border-b flex justify-between items-center">
                    <DialogTitle className="text-lg font-semibold">
                      Edit Stock - {selectedItem?.productName}
                    </DialogTitle>
                    <button
                      onClick={() => setEditDialogOpen(false)}
                      className="text-gray-500 hover:text-gray-700 text-xl"
                    >
                      ✕
                    </button>
                  </div>
                  <div className="flex-1 overflow-y-auto p-4">
                    {editData ? (
                      <AddStock
                        editData={editData}
                        onClose={handleEditClose}
                        onSuccess={handleEditClose}
                      />
                    ) : (
                      <div className="flex items-center justify-center h-64">
                        <div className="text-center">
                          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                          <p className="mt-2 text-gray-600">Loading item data...</p>
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>

      {/* Stock Items Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        {isLoading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Loading stock items...</p>
          </div>
        ) : currentItems.length === 0 ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-lg font-medium">No stock items found</p>
            <p className="mt-2">
              {stockItems.length === 0
                ? 'Click "Add Stock" to start adding items'
                : 'No items match your filters. Try clearing filters.'}
            </p>
          </div>
        ) : (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                    <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-200">
                  {currentItems.map((item, index) => (
                    <tr key={item.id} className="hover:bg-gray-50">
                      <td className="px-4 py-4">
                        <img
                          src={item.imageUrl}
                          alt={item.productName}
                          className="h-10 w-10 rounded-lg object-cover border border-gray-200"
                        />
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                        {item.serialNumber && (
                          <div className="text-xs text-gray-500 mt-1">SN: {item.serialNumber}</div>
                        )}
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-600">
                          {item.productGroup}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getQuantityColor(item.quantity)}`}>
                          {item.quantity}
                        </span>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 font-mono">{item.skuCode}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900">{item.createdBy}</div>
                        <div className="text-xs text-gray-500">{formatDate(item.addedAt)}</div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="text-sm text-gray-900 bg-gray-100 px-3 py-1 rounded-full inline-block">
                          {item.unit}
                        </div>
                      </td>
                      <td className="px-4 py-4">
                        <div className="flex gap-2">
                          <button
                            onClick={() => handleEditItem(item)}
                            className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium"
                          >
                            Edit
                          </button>
                          <button
                            onClick={() => handleRemoveItem(item.id)}
                            className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-medium"
                          >
                            Remove
                          </button>
                        </div>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="px-4 py-4 border-t border-gray-200">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="text-sm text-gray-700">
                    Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                    <span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> of{' '}
                    <span className="font-medium">{filteredItems.length}</span> results
                  </div>
                  <div className="flex items-center space-x-2">
                    <button
                      onClick={() => goToPage(currentPage - 1)}
                      disabled={currentPage === 1}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === 1
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                      Previous
                    </button>

                    <div className="flex items-center space-x-1">
                      {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                        let pageNumber;
                        if (totalPages <= 5) {
                          pageNumber = i + 1;
                        } else if (currentPage <= 3) {
                          pageNumber = i + 1;
                        } else if (currentPage >= totalPages - 2) {
                          pageNumber = totalPages - 4 + i;
                        } else {
                          pageNumber = currentPage - 2 + i;
                        }

                        return (
                          <button
                            key={pageNumber}
                            onClick={() => goToPage(pageNumber)}
                            className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${currentPage === pageNumber
                              ? 'bg-blue-600 text-white'
                              : 'text-gray-700 hover:bg-gray-100 border border-gray-200'
                              }`}
                          >
                            {pageNumber}
                          </button>
                        );
                      })}

                      {totalPages > 5 && currentPage < totalPages - 2 && (
                        <>
                          <span className="px-1 text-gray-500">...</span>
                          <button
                            onClick={() => goToPage(totalPages)}
                            className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-700 hover:bg-gray-100 border border-gray-200"
                          >
                            {totalPages}
                          </button>
                        </>
                      )}
                    </div>

                    <button
                      onClick={() => goToPage(currentPage + 1)}
                      disabled={currentPage === totalPages}
                      className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === totalPages
                        ? 'text-gray-400 cursor-not-allowed'
                        : 'text-gray-700 hover:bg-gray-50 border border-gray-300'
                        }`}
                    >
                      Next
                    </button>
                  </div>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}