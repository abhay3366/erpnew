'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useState, useEffect } from 'react';
import AddStock from './add-stock/page';

// ==================== STOCK LIST MAIN COMPONENT ====================
export default function StockItem() {
  // ========== STATE VARIABLES ==========
  const [stockItems, setStockItems] = useState([]);
  const [isLoading, setIsLoading] = useState(false);
  const [filters, setFilters] = useState({
    search: '', branch: '', status: '', dateFrom: '', dateTo: ''
  });
  const [filteredItems, setFilteredItems] = useState([]);
  const [allBranches, setAllBranches] = useState([]);
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;
  const [addDialogOpen, setAddDialogOpen] = useState(false);
  const [editDialogOpen, setEditDialogOpen] = useState(false);
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [selectedItem, setSelectedItem] = useState(null);
  const [editData, setEditData] = useState(null);
  const [selectedSerials, setSelectedSerials] = useState([]);

  // ========== DATA LOADING ==========
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

  // ========== HELPER FUNCTIONS ==========
  const extractGroupName = (fullPath) => {
    if (!fullPath) return 'General';
    const parts = fullPath.split('>');
    if (parts.length >= 2) return parts[parts.length - 2]?.trim() || 'General';
    return parts[0]?.trim() || 'General';
  };

  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  const getQuantityColor = (quantity) => {
    if (quantity === 0) return 'bg-red-100 text-red-800 border border-red-200';
    if (quantity <= 5) return 'bg-orange-100 text-orange-800 border border-orange-200';
    if (quantity <= 10) return 'bg-yellow-100 text-yellow-800 border border-yellow-200';
    return 'bg-green-100 text-green-800 border border-green-200';
  };

  const getTodayDate = () => {
    const today = new Date();
    const year = today.getFullYear();
    const month = String(today.getMonth() + 1).padStart(2, '0');
    const day = String(today.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
  };

  // ========== DATA TRANSFORMATION ==========
  const transformStockData = (apiData) => {
    if (!apiData || !Array.isArray(apiData)) return [];

    let allItems = [];

    apiData.forEach((stockGroup) => {
      if (!stockGroup.items || !Array.isArray(stockGroup.items)) return;

      // Check if serial mode
      const isSerialMode = stockGroup.isSerial === "1" ||
        stockGroup.isSerial === "true" ||
        stockGroup.product?.isSerial === "1";

      // Get product name
      const fullPath = stockGroup.category || '';
      const pathParts = fullPath.split('>');
      const productName = pathParts.length > 0
        ? pathParts[pathParts.length - 1].trim()
        : fullPath.trim();

      const groupName = extractGroupName(fullPath);

      if (isSerialMode) {
        // SERIAL MODE: All items in one entry
        const serialNumbers = stockGroup.items.map(item => item.serialNumber || '');
        const macAddresses = stockGroup.items.map(item => item.macAddress || '');

        allItems.push({
          id: stockGroup.id,
          productName: productName,
          productGroup: groupName,
          quantity: stockGroup.totalItems || stockGroup.items.length,
          skuCode: `${productName.substring(0, 3).toUpperCase()}-${stockGroup.id}`,
          createdBy: stockGroup.vendor || 'System',
          unit: stockGroup.unit || 'General',
          branch: stockGroup.branch || 'Main Branch',
          addedAt: stockGroup.addedAt || new Date().toISOString(),
          stockGroupId: stockGroup.id,
          serialNumbers: serialNumbers,
          macAddresses: macAddresses,
          warranty: stockGroup.globalWarranty || stockGroup.items[0]?.warranty || 0,
          imageUrl: '/images/cards/card-01.jpg',
          serialMode: true,
          totalItems: stockGroup.totalItems || stockGroup.items.length
        });

      } else {
        // NON-SERIAL MODE: Each item separately
        stockGroup.items.forEach((item, itemIndex) => {
          allItems.push({
            id: `${stockGroup.id}_${itemIndex}`,
            productName: productName,
            productGroup: groupName,
            quantity: item.quantity || 0,
            skuCode: `${productName.substring(0, 3).toUpperCase()}-${stockGroup.id}-${itemIndex}`,
            createdBy: stockGroup.vendor || 'System',
            unit: stockGroup.unit || 'General',
            branch: stockGroup.branch || 'Main Branch',
            addedAt: stockGroup.addedAt || new Date().toISOString(),
            stockGroupId: stockGroup.id,
            serialNumber: item.serialNumber || '',
            macAddress: item.macAddress || '',
            warranty: item.warranty || 0,
            imageUrl: '/images/cards/card-01.jpg',
            serialMode: false
          });
        });
      }
    });

    return allItems;
  };

  // ========== FILTER FUNCTIONS ==========
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

    // Date filters
    if (filters.dateFrom) {
      filtered = filtered.filter(item => new Date(item.addedAt) >= new Date(filters.dateFrom));
    }
    if (filters.dateTo) {
      const to = new Date(filters.dateTo);
      to.setHours(23, 59, 59, 999);
      filtered = filtered.filter(item => new Date(item.addedAt) <= to);
    }

    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [filters, stockItems]);

  const handleFilterChange = (e) => {
    const { name, value } = e.target;
    setFilters(prev => ({ ...prev, [name]: value }));
  };

  const clearFilters = () => {
    setFilters({ search: '', branch: '', status: '', dateFrom: '', dateTo: '' });
  };

  // ========== PAGINATION ==========
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) setCurrentPage(page);
  };

  // ========== ITEM ACTIONS ==========
  const showSerialNumbers = (item) => {
    if (item.serialMode && item.serialNumbers?.length > 0) {
      const detailedSerials = item.serialNumbers.map((serial, index) => ({
        serialNumber: serial,
        macAddress: item.macAddresses?.[index] || '',
        index: index + 1,
        total: item.serialNumbers.length
      }));
      setSelectedSerials(detailedSerials);
    } else {
      const singleSerial = item.serialNumber ? [{
        serialNumber: item.serialNumber,
        macAddress: item.macAddress || '',
        index: 1,
        total: 1
      }] : [];
      setSelectedSerials(singleSerial);
    }
    setSerialModalOpen(true);
  };

  const handleRemoveItem = async (itemId) => {
    if (confirm('Are you sure you want to remove this item?')) {
      try {
        const stockGroupId = itemId.split('_')[0];
        await fetch(`http://localhost:5001/stocks/${stockGroupId}`, { method: 'DELETE' });
        await loadData();
        alert('Item removed successfully!');
      } catch (error) {
        console.error('Error removing item:', error);
        alert('Error removing item');
      }
    }
  };

  const handleEditItem = async (item) => {
    setSelectedItem(item);
    setIsLoading(true);

    try {
      const response = await fetch(`http://localhost:5001/stocks/${item.stockGroupId}`);
      if (response.ok) {
        const stockGroup = await response.json();
        setEditData({
          id: stockGroup.id,
          category: stockGroup.category || '',
          vendor: stockGroup.vendor || '',
          branch: stockGroup.branch || '',
          globalWarranty: stockGroup.globalWarranty || 0,
          isSerial: stockGroup.isSerial || "0",
          items: stockGroup.items || [],
          product: stockGroup.product || null,
          unit: stockGroup.unit || '',
          addedAt: stockGroup.addedAt
        });
        setEditDialogOpen(true);
      }
    } catch (error) {
      console.error('Error loading edit data:', error);
      alert('Failed to load item for editing');
    } finally {
      setIsLoading(false);
    }
  };

  const handleEditClose = () => {
    setEditDialogOpen(false);
    setEditData(null);
    setSelectedItem(null);
    loadData();
  };

  // ========== RENDER FUNCTIONS ==========

  // 1. Filters Section
  const renderFilters = () => {
    const isDateFilterApplied = filters.dateFrom || filters.dateTo;

    return (
      <div className="bg-white rounded-lg shadow-md p-6 mb-6">
        {/* Filter Inputs */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
          {/* Search */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Search</label>
            <input type="text" name="search" value={filters.search} onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
              placeholder="Product, SKU or group..." />
          </div>

          {/* Branch */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Branch</label>
            <select name="branch" value={filters.branch} onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">All Branches</option>
              {allBranches.map((branch, i) => (
                <option key={i} value={branch.branchName}>{branch.branchName}</option>
              ))}
            </select>
          </div>

          {/* Status */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">Status</label>
            <select name="status" value={filters.status} onChange={handleFilterChange}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500">
              <option value="">All</option>
              <option value="available">Available</option>
              <option value="out">Out of Stock</option>
            </select>
          </div>

          {/* From Date */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">From Date</label>
            <div className="relative">
              <input type="date" name="dateFrom" value={filters.dateFrom} onChange={handleFilterChange}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 pr-10"
                max={getTodayDate()} onClick={(e) => e.target.showPicker()} />
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
              <input type="date" name="dateTo" value={filters.dateTo} onChange={handleFilterChange}
                className={`w-full px-3 py-2 border rounded-lg focus:ring-2 focus:ring-blue-500 pr-10 ${!filters.dateFrom ? 'border-gray-300 bg-gray-50 cursor-not-allowed' : 'border-gray-300'}`}
                max={getTodayDate()} disabled={!filters.dateFrom} onClick={(e) => !filters.dateFrom ? null : e.target.showPicker()} />
              <div className="absolute inset-y-0 right-0 flex items-center pr-3 pointer-events-none">
                <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            </div>
            {!filters.dateFrom && <p className="text-xs text-gray-500 mt-1">Select From Date first</p>}
          </div>
        </div>

        {/* Active Filters */}
        {(filters.search || filters.branch || filters.status || isDateFilterApplied) && (
          <div className="mt-4 p-3 bg-gray-50 rounded-lg border border-gray-200">
            <div className="text-sm text-gray-700">
              <span className="font-medium">Active Filters:</span>
              <div className="flex flex-wrap gap-2 mt-1">
                {filters.search && <FilterBadge name="Search" value={filters.search} field="search" />}
                {filters.branch && <FilterBadge name="Branch" value={filters.branch} field="branch" />}
                {filters.status && <FilterBadge name="Status" value={filters.status === 'available' ? 'Available' : 'Out of Stock'} field="status" />}
                {filters.dateFrom && <FilterBadge name="From" value={filters.dateFrom} field="dateFrom" />}
                {filters.dateTo && <FilterBadge name="To" value={filters.dateTo} field="dateTo" />}
              </div>
            </div>
          </div>
        )}

        {/* Filter Summary */}
        <div className="flex justify-between items-center mt-6">
          <div className="text-sm text-gray-600">
            Showing <span className="font-medium">{filteredItems.length}</span> of{' '}
            <span className="font-medium">{stockItems.length}</span> items
          </div>
          <button onClick={clearFilters}
            className="px-4 py-2 border border-gray-300 text-gray-700 font-medium rounded-lg hover:bg-gray-50">
            Clear All Filters
          </button>
        </div>
      </div>
    );
  };

  // 2. Filter Badge Component
  const FilterBadge = ({ name, value, field }) => (
    <span className="inline-flex items-center px-2 py-1 rounded text-xs bg-blue-100 text-blue-800">
      {name}: {value}
      <button onClick={() => handleFilterChange({ target: { name: field, value: '' } })}
        className="ml-1 text-blue-600 hover:text-blue-800">×</button>
    </span>
  );

  // 3. Table Section
  const renderTable = () => {
    if (isLoading) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-gray-500">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4">Loading stock items...</p>
          </div>
        </div>
      );
    }

    if (currentItems.length === 0) {
      return (
        <div className="bg-white rounded-lg shadow-md p-6">
          <div className="text-center text-gray-500">
            <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
            </svg>
            <p className="mt-4 text-lg font-medium">No stock items found</p>
            <p className="mt-2">{stockItems.length === 0 ? 'Click "Add Stock" to start' : 'Try clearing filters'}</p>
          </div>
        </div>
      );
    }

    return (
      <div className="bg-white rounded-lg shadow-md overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Image</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Group</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Stock</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">SKU</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Created</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Unit</th>
                <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200">
              {currentItems.map((item) => (
                <tr key={item.id} className="hover:bg-gray-50">
                  <td className="px-4 py-4"><img src={item.imageUrl} alt={item.productName} className="h-10 w-10 rounded-lg border border-gray-200" /></td>
                  <td className="px-4 py-4">
                    <div className="text-sm font-medium text-gray-900">{item.productName}</div>
                    {item.serialMode && item.serialNumbers?.length > 0 && (
                      <div className="text-xs text-gray-500 mt-1">
                        Serial Numbers: {item.serialNumbers.length} items
                        <button onClick={() => showSerialNumbers(item)} className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline">View All</button>
                      </div>
                    )}
                    {!item.serialMode && item.serialNumber && (
                      <div className="text-xs text-gray-500 mt-1">
                        SN: {item.serialNumber}
                        <button onClick={() => showSerialNumbers(item)} className="ml-2 text-blue-600 hover:text-blue-800 text-xs underline">View</button>
                      </div>
                    )}
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-600">{item.productGroup}
                      {item.serialMode && <div className="text-xs text-blue-600 mt-1">(Serialized)</div>}
                    </div>
                  </td>
                  <td className="px-4 py-4">
                    <span className={`px-3 py-1 rounded-full text-xs font-medium border ${getQuantityColor(item.quantity)}`}>
                      {item.quantity}
                    </span>
                  </td>
                  <td className="px-4 py-4"><div className="text-sm text-gray-900 font-mono">{item.skuCode}</div></td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900">{item.createdBy}</div>
                    <div className="text-xs text-gray-500">{formatDate(item.addedAt)}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="text-sm text-gray-900 bg-gray-100 px-3 py-1 rounded-full inline-block">{item.unit}</div>
                  </td>
                  <td className="px-4 py-4">
                    <div className="flex gap-2">
                      <button onClick={() => handleEditItem(item)} className="px-3 py-1.5 text-blue-600 hover:bg-blue-50 border border-blue-200 rounded-lg text-sm font-medium">Edit</button>
                      <button onClick={() => handleRemoveItem(item.id)} className="px-3 py-1.5 text-red-600 hover:bg-red-50 border border-red-200 rounded-lg text-sm font-medium">Remove</button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {/* Pagination */}
        {totalPages > 1 && renderPagination()}
      </div>
    );
  };

  // 4. Pagination Component
  const renderPagination = () => {
    return (
      <div className="px-4 py-4 border-t border-gray-200">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div className="text-sm text-gray-700">
            Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
            <span className="font-medium">{Math.min(indexOfLastItem, filteredItems.length)}</span> of{' '}
            <span className="font-medium">{filteredItems.length}</span> results
          </div>
          <div className="flex items-center space-x-2">
            <button onClick={() => goToPage(currentPage - 1)} disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === 1 ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 border border-gray-300'}`}>
              Previous
            </button>

            <div className="flex items-center space-x-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber;
                if (totalPages <= 5) pageNumber = i + 1;
                else if (currentPage <= 3) pageNumber = i + 1;
                else if (currentPage >= totalPages - 2) pageNumber = totalPages - 4 + i;
                else pageNumber = currentPage - 2 + i;

                return (
                  <button key={pageNumber} onClick={() => goToPage(pageNumber)}
                    className={`w-8 h-8 flex items-center justify-center rounded-lg text-sm ${currentPage === pageNumber ? 'bg-blue-600 text-white' : 'text-gray-700 hover:bg-gray-100 border border-gray-200'}`}>
                    {pageNumber}
                  </button>
                );
              })}

              {totalPages > 5 && currentPage < totalPages - 2 && (
                <>
                  <span className="px-1 text-gray-500">...</span>
                  <button onClick={() => goToPage(totalPages)} className="w-8 h-8 flex items-center justify-center rounded-lg text-sm text-gray-700 hover:bg-gray-100 border border-gray-200">
                    {totalPages}
                  </button>
                </>
              )}
            </div>

            <button onClick={() => goToPage(currentPage + 1)} disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-lg text-sm font-medium ${currentPage === totalPages ? 'text-gray-400 cursor-not-allowed' : 'text-gray-700 hover:bg-gray-50 border border-gray-300'}`}>
              Next
            </button>
          </div>
        </div>
      </div>
    );
  };

  // 5. Dialog Component
  const StockDialog = ({ isOpen, onClose, title, children }) => (
    <Dialog open={isOpen} onClose={onClose} className="relative z-9999">
      <DialogBackdrop transition className="fixed inset-0 bg-gray-900/50 transition-opacity duration-2000 ease-in-out data-closed:opacity-0" />
      <div className="fixed inset-0 overflow-hidden">
        <div className="absolute inset-0 overflow-hidden">
          <div className="fixed inset-y-0 right-0 flex max-w-full">
            <DialogPanel transition
                  className="pointer-events-auto relative w-6xl transform transition duration-2000 ease-in-out data-closed:translate-x-full sm:duration-1000">
              <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-white/10">
                <div className="px-4 py-4 border-b flex justify-between items-center">
                  <DialogTitle className="text-lg font-semibold">{title}</DialogTitle>
                  <button onClick={onClose} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
                </div>
                <div className="flex-1 overflow-y-auto p-4">{children}</div>
              </div>
            </DialogPanel>
          </div>
        </div>
      </div>
    </Dialog>
  );

  // 6. Serial Modal Component
  const SerialModal = () => (
    <Dialog open={serialModalOpen} onClose={() => setSerialModalOpen(false)} className="relative z-50">
      <DialogBackdrop   transition
            className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0"/>
      <div className="fixed inset-0 flex items-center justify-center p-4">
        <DialogPanel  transition
                  className="bg-white pointer-events-auto relative w-6xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
          <div className="px-6 py-4 border-b flex justify-between items-center">
            <div>
              <DialogTitle className="text-lg font-semibold">Serial Numbers Details</DialogTitle>
              <p className="text-sm text-gray-600 mt-1">Total Items: {selectedSerials.length}</p>
            </div>
            <button onClick={() => setSerialModalOpen(false)} className="text-gray-500 hover:text-gray-700 text-xl">✕</button>
          </div>
          <div className="p-6 overflow-y-auto max-h-[60vh]">
            {selectedSerials.length > 0 ? (
              <div className="overflow-x-auto">
                <table className="w-full border-collapse">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">S.No</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">Serial Number</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">MAC Address</th>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase border border-gray-200">Status</th>
                    </tr>
                  </thead>
                  <tbody>
                    {selectedSerials.map((serial, index) => (
                      <tr key={index} className="hover:bg-gray-50">
                        <td className="px-4 py-3 text-sm text-gray-900 border border-gray-200">{index + 1}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 border border-gray-200">{serial.serialNumber || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm font-mono text-gray-900 border border-gray-200">{serial.macAddress || 'N/A'}</td>
                        <td className="px-4 py-3 text-sm border border-gray-200">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-green-100 text-green-800">In Stock</span>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : (
              <div className="text-center py-8">
                <svg className="w-16 h-16 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
                <p className="mt-4 text-gray-500">No serial numbers found</p>
              </div>
            )}
          </div>
          <div className="px-6 py-4 border-t bg-gray-50">
            <div className="flex justify-between items-center">
              <div className="text-sm text-gray-600">Showing <span className="font-medium">{selectedSerials.length}</span> serial numbers</div>
              <button onClick={() => setSerialModalOpen(false)} className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-medium">Close</button>
            </div>
          </div>
        </DialogPanel>
      </div>
    </Dialog>
  );

  // ========== MAIN RENDER ==========
  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      {/* Header */}
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold text-gray-800">Stocks</h1>
        <button onClick={() => setAddDialogOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-3 rounded-lg text-sm font-medium">
          + Add Stock
        </button>
      </div>

      {/* Filters */}
      {renderFilters()}

      {/* Dialogs */}
      <StockDialog isOpen={addDialogOpen} onClose={() => {
        setAddDialogOpen(false);
        loadData();
      }} title="Add Stock">
        <AddStock onClose={() => {
          setAddDialogOpen(false);
          loadData();
        }} />
      </StockDialog>

      <StockDialog isOpen={editDialogOpen} onClose={() => setEditDialogOpen(false)} title={`Edit Stock - ${selectedItem?.productName}`}>
        {editData ? (
          <AddStock editData={editData} onClose={handleEditClose} onSuccess={handleEditClose} />
        ) : (
          <div className="flex items-center justify-center h-64">
            <div className="text-center">
              <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
              <p className="mt-2 text-gray-600">Loading item data...</p>
            </div>
          </div>
        )}
      </StockDialog>

      {/* Serial Modal */}
      <SerialModal />

      {/* Table */}
      {renderTable()}
    </div>
  );
}