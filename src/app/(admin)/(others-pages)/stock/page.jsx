"use client";

import Link from 'next/link';
import { useState, useEffect } from 'react';

export default function StockItem() {
  const [stockItems, setStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);

  // Filter states
  const [filters, setFilters] = useState({
    itemSearch: '',
    branch: '',
    status: '',
    dateFrom: '',
    dateTo: ''
  });
  const [filteredItems, setFilteredItems] = useState([]);
  const [allBranches, setAllBranches] = useState([]);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage] = useState(10);

  // Load stock items from API
  const loadStockItems = async () => {
    try {
      setIsLoading(true);
      const response = await fetch('http://localhost:5001/stocks');
      if (response.ok) {
        const data = await response.json();
        // Transform the data to match our UI structure
        const transformedData = transformStockData(data);
        setStockItems(transformedData);
        setFilteredItems(transformedData);
      } else {
        console.error('Failed to load stock items');
      }
    } catch (error) {
      console.error('Error loading stock items:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const loadBranches = async () => {
    try {
      setIsLoading(true);
      const response = await fetch("http://localhost:5001/branches");
      if (response.ok) {
        const data = await response.json();
        setAllBranches(data)
        console.log(data)
      }
    } catch (error) {
      console.log("error in fetching data" + error)
    } finally {
      setIsLoading(false);
    }
  }

  // Function to extract only item name (remove everything before ">")
  const extractItemName = (fullPath) => {
    if (!fullPath) return 'N/A';
    const parts = fullPath.split('>');
    return parts.length > 0 ? parts[parts.length - 1].trim() : fullPath.trim();
  };

  // Function to get item status based on quantity
  const getItemStatus = (quantity) => {
    const qty = parseInt(quantity) || 0;
    return qty > 0 ? 'Available' : 'Unavailable';
  };

  // Function to get status color
  const getStatusColor = (status) => {
    return status === 'Available'
      ? 'bg-green-100 text-green-800'
      : 'bg-red-100 text-red-800';
  };

  // Transform API data to match UI structure
  const transformStockData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    let allItems = [];
    apiData.forEach(stockGroup => {
      if (stockGroup.items && Array.isArray(stockGroup.items)) {
        stockGroup.items.forEach((item, itemIndex) => {
          const quantity = item.quantity || 0;
          const status = getItemStatus(quantity);

          allItems.push({
            id: `${stockGroup.id}_${itemIndex}`,
            // Extract only the item name (remove everything before ">")
            itemName: extractItemName(stockGroup.category),
            warrantyYears: stockGroup.warrantyYears,
            billNumber: item.billNumber || 'N/A',
            billDate: item.billDate || stockGroup.addedAt,
            branch: item.branch || 'Main Branch',
            quantity: quantity,
            status: status,
            addedAt: stockGroup.addedAt,
            stockGroupId: stockGroup.id
          });
        });
      }
    });
console.log(allItems)
    return allItems;
  };

  useEffect(() => {
    loadStockItems();
    loadBranches()
  }, []);

  // Apply filters
  useEffect(() => {
    let filtered = [...stockItems];

    // Branch Filter
    if (filters.branch) {
      filtered = filtered.filter(item => item.branch === filters.branch);
    }

    // Item search
    if (filters.itemSearch.trim()) {
      filtered = filtered.filter(item =>
        item.itemName.toLowerCase().includes(filters.itemSearch.toLowerCase())
      );
    }

    // Status
    if (filters.status) {
      filtered = filtered.filter(item =>
        item.status.toLowerCase() === filters.status.toLowerCase()
      );
    }

    // Date From
    if (filters.dateFrom) {
      filtered = filtered.filter(item =>
        new Date(item.billDate) >= new Date(filters.dateFrom)
      );
    }

    // Date To
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);

      filtered = filtered.filter(item =>
        new Date(item.billDate) <= to
      );
    }

    setFilteredItems(filtered);

    // Pagination Reset
    setCurrentPage(1);

  }, [filters, stockItems]);


  // Calculate pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // Handle filter changes
  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({
      ...prev,
      [name]: value
    }));
  };

  // Clear all filters
  const clearFilters = () => {
    setFilters({
      itemSearch: '',
      branch: '',
      status: '',
      dateFrom: '',
      dateTo: ''
    });
  };

  // Pagination handlers
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber);
    }
  };

  const goToNextPage = () => {
    if (currentPage < totalPages) {
      setCurrentPage(prev => prev + 1);
    }
  };

  const goToPrevPage = () => {
    if (currentPage > 1) {
      setCurrentPage(prev => prev - 1);
    }
  };

  ;

  // Handle removing item
  const handleRemoveItem = async (itemId) => {
    if (confirm('Are you sure you want to remove this item?')) {
      try {
        const stockGroupId = itemId.split('_')[0];

        const response = await fetch(`http://localhost:5001/stocks/${stockGroupId}`, {
          method: 'DELETE',
        });

        if (response.ok) {
          await loadStockItems(); // Refresh the list
          alert('Stock item removed successfully!');
        } else {
          throw new Error('Failed to delete stock item');
        }
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Error removing item. Please try again.');
      }
    }
  };

  // Get warranty badge color
  const getWarrantyBadgeColor = (years) => {
    if (years >= 4) return 'bg-green-100 text-green-800';
    if (years >= 3) return 'bg-blue-100 text-blue-800';
    if (years >= 2) return 'bg-yellow-100 text-yellow-800';
    if (years >= 1) return 'bg-gray-100 text-gray-800';
    return 'bg-red-100 text-red-800';
  };

  // Handle editing item
  const handleEditItem = (item) => {
    // Redirect to AddStock page with item data as query params
    const params = new URLSearchParams({
      edit: 'true',
      stockGroupId: item.stockGroupId,
      itemId: item.id
    }).toString();

    window.location.href = `/stock/add-stock?${params}`;
  };
  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    const date = new Date(dateString);
    return date.toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  return (
    <div className="p-6 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <div>
          <h1 className="text-2xl font-bold text-gray-800">Stock Preview</h1>
          <p className="text-gray-600 mt-1">View and manage all your stock items</p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-4">
          <Link href="/stock/add-stock">
            <button
              className="px-6 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-green-500 focus:ring-offset-2 transition-colors"
            >
              Add Stock
            </button>
          </Link>
        </div>
      </div>

      {/* FILTER SECTION */}
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        <h2 className="text-lg font-semibold text-gray-800 mb-4">Filter Stock Items</h2>

        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          {/* table header filter section */}
          {/* Item Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search Item</label>
            <div className="relative">
              <input
                type="text"
                name="itemSearch"
                value={filters.itemSearch}
                onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                placeholder="Type to search..."
              />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
              </div>
            </div>
          </div>

          {/* Branch Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select
              name="branch"
              value={filters.branchName}
              onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              <option value="">All Branches</option>
              {allBranches.map((branch, index) => (
                <option key={"branchname" + index} value={branch.branchName}>{branch.branchName}</option>
              ))}
            </select>
          </div>

          {/* Status Filter */}
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
              <option value="unavailable">Unavailable</option>
            </select>
          </div>

          {/* Date Range Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Date Range</label>
            <div className="grid grid-cols-2 gap-2">
              <input
                type="date"
                name="dateFrom"
                value={filters.dateFrom}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
              <input
                type="date"
                name="dateTo"
                value={filters.dateTo}
                onChange={handleFilterChange}
                className="px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm"
              />
            </div>
          </div>
        </div>

        {/* Filter Buttons */}
        <div className="flex justify-end gap-3 mt-4">
          <button
            onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-gray-500 focus:ring-offset-2 transition-colors"
          >
            Clear Filters
          </button>
          <div className="text-sm text-gray-500 flex items-center px-3">
            Showing {filteredItems.length} of {stockItems.length} items
          </div>
        </div>
      </div>

      {/* Stock Items Table */}
      <div className="bg-white rounded-lg shadow-md overflow-hidden">

        {/* loading state show loading data  */}
        {isLoading ? (
          <div className="px-6 py-12 text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Loading stock items...</p>
          </div>
        )
          // show the no data found message
          : currentItems.length === 0 ? (
            <div className="px-6 py-12 text-center text-gray-500">
              <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
              <p className="mt-4 text-lg font-medium">No stock items found</p>
              <p className="mt-2">
                {stockItems.length === 0
                  ? 'Click "Add Stock" to start adding items to your inventory'
                  : 'No items match your filters. Try clearing filters.'}
              </p>
            </div>
          ) : (
            <>
              {/* show data in table */}
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Item Name</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill No</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Bill Date</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Branch</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Warranty</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                      <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-200">
                    {currentItems.map((item, index) => (
                      <tr key={item.id} className={`
                                            hover:bg-gray-50 transition-colors duration-200
                                            ${item.quantity === 0 ? 'bg-red-100 hover:bg-red-200' : ''}
                                        `}>
                        <td className="px-6 py-4 whitespace-nowrap text-sm">
                          <span className={item.quantity === 0 ? 'text-red-700 font-medium' : 'text-gray-800'}>
                            {indexOfFirstItem + index + 1}
                          </span>
                        </td>
                        <td className="px-6 py-4">
                          <div className={`text-sm font-medium ${item.quantity === 0 ? 'text-red-700' : 'text-gray-800'}`}>
                            {item.itemName}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${item.quantity === 0 ? 'text-red-700' : 'text-gray-800'}`}>
                            {item.quantity || 0}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm font-medium ${item.quantity === 0 ? 'text-red-700' : 'text-gray-800'}`}>
                            {item.billNumber}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className={`text-sm ${item.quantity === 0 ? 'text-red-600' : 'text-gray-600'}`}>
                            {formatDate(item.billDate)}
                          </div>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-2 py-1 text-xs font-medium rounded-full ${item.quantity === 0 ? 'bg-red-100 text-red-800' : 'bg-blue-100 text-blue-800'}`}>
                            {item.branch}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${item.quantity === 0 ? 'bg-red-100 text-red-800' : getWarrantyBadgeColor(item.warrantyYears)}`}>
                            {item.warrantyYears > 0 ? `${item.warrantyYears} Year${item.warrantyYears > 1 ? 's' : ''}` : 'No Warranty'}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${getStatusColor(item.status)}`}>
                            {item.status}
                          </span>
                        </td>
                        <td className="px-6 py-4 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEditItem(item)}
                              className={`px-3 py-1 font-medium text-sm border rounded-lg transition-colors ${item.quantity === 0 ? 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-900' : 'text-blue-600 border-blue-200 hover:bg-blue-50 hover:text-blue-900'}`}
                            >
                              Edit
                            </button>
                            <button
                              onClick={() => handleRemoveItem(item.id)}
                              className={`px-3 py-1 font-medium text-sm border rounded-lg transition-colors ${item.quantity === 0 ? 'text-red-700 border-red-300 hover:bg-red-200 hover:text-red-900' : 'text-red-600 border-red-200 hover:bg-red-50 hover:text-red-900'}`}
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
              {filteredItems && (
                <div className="px-6 py-4 border-t border-gray-200">
                  <div className="flex items-center justify-between">
                    <div className="text-sm text-gray-700">
                      Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
                      <span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> of{' '}
                      <span className="font-medium">{filteredItems.length}</span> results
                    </div>
                    <div className="flex items-center space-x-2">
                      <button
                        onClick={goToPrevPage}
                        disabled={currentPage === 1}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === 1
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
                              className={`w-8 h-8 flex items-center justify-center rounded-md text-sm ${currentPage === pageNumber
                                ? 'bg-blue-600 text-white'
                                : 'text-gray-700 hover:bg-gray-100'
                                }`}
                            >
                              {pageNumber}
                            </button>
                          );
                        })}

                        {totalPages > 5 && currentPage < totalPages - 2 && (
                          <>
                            <span className="px-1">...</span>
                            <button
                              onClick={() => goToPage(totalPages)}
                              className="w-8 h-8 flex items-center justify-center rounded-md text-sm text-gray-700 hover:bg-gray-100"
                            >
                              {totalPages}
                            </button>
                          </>
                        )}
                      </div>

                      <button
                        onClick={goToNextPage}
                        disabled={currentPage === totalPages}
                        className={`px-3 py-1 rounded-md text-sm font-medium ${currentPage === totalPages
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