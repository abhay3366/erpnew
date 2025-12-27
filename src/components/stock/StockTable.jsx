// components/stock/StockTable.jsx
"use client";

import { useState, useEffect } from 'react';
import { MdDelete, MdEdit, MdVisibility, MdRestore } from "react-icons/md";
import { useRouter } from 'next/navigation';

export default function StockTable({ 
  filteredStocks = [], 
  setDetailsPage, 
  setCurrentSerialsIdProudct,
  onEditStock,
  fetchStocks,
  setStocks 
}) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterStatus, setFilterStatus] = useState('active');
  const [filterType, setFilterType] = useState('all');
  
  // Modal states
  const [isDeleteConfirmOpen, setIsDeleteConfirmOpen] = useState(false);
  const [isViewModalOpen, setIsViewModalOpen] = useState(false);
  const [selectedStock, setSelectedStock] = useState(null);
  const [stockToDelete, setStockToDelete] = useState(null);

  // Pagination states
  const [currentPage, setCurrentPage] = useState(1);
  const [itemsPerPage, setItemsPerPage] = useState(10);

  const router = useRouter();

  // Extract quantity from dynamic values - Dynamic approach
  const getProductQuantity = (product) => {
    // UNIQUE products के लिए items की length quantity है
    if (product.identifierType === 'UNIQUE') {
      return product.items?.length || 0;
    }
    
    // NON_UNIQUE products के लिए dynamicValues से quantity निकालें
    if (product.identifierType === 'NON_UNIQUE' && product.dynamicValues) {
      // Dynamic तरीके से quantity फील्ड ढूंढें
      const quantityEntries = Object.entries(product.dynamicValues);
      
      // पहले quantity नाम वाला फील्ड ढूंढें
      const quantityField = quantityEntries.find(([key, value]) => 
        key.toLowerCase().includes('quantity') || 
        key.toLowerCase().includes('qty') ||
        (typeof value === 'string' && value.fieldType === 'quantity')
      );
      
      if (quantityField) {
        // value object या string हो सकता है
        const quantityValue = typeof quantityField[1] === 'object' 
          ? quantityField[1].value 
          : quantityField[1];
        
        const parsedQuantity = parseInt(quantityValue || 0);
        return isNaN(parsedQuantity) ? 0 : parsedQuantity;
      }
      
      // अगर quantity नाम का फील्ड नहीं मिला, तो पहले numeric value वाला फील्ड चेक करें
      for (const [key, value] of quantityEntries) {
        const val = typeof value === 'object' ? value.value : value;
        const num = parseInt(val);
        if (!isNaN(num)) {
          return num;
        }
      }
    }
    
    return 0;
  };

  // Check if stock can be deleted (all quantities must be 0)
  const canDeleteStock = (stock) => {
    if (!stock.products || stock.products.length === 0) return true;
    
    return stock.products.every(product => 
      getProductQuantity(product) === 0
    );
  };

  // Soft delete stock
  const handleSoftDelete = async (stockId) => {
    try {
      const stock = filteredStocks.find(s => s.id === stockId);
      if (!stock) return;

      if (!canDeleteStock(stock)) {
        alert('Cannot delete stock. All product quantities must be 0 before deletion.');
        return;
      }

      const updatedStock = {
        ...stock,
        isDeleted: true,
        deletedAt: new Date().toISOString(),
        status: 'deleted'
      };

      const response = await fetch(`http://localhost:5001/stocks/${stockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStock)
      });

      if (response.ok) {
        if (setStocks) {
          setStocks(prev => prev.map(stock => 
            stock.id === stockId ? updatedStock : stock
          ));
        }
        
        setIsDeleteConfirmOpen(false);
        setStockToDelete(null);
        alert('Stock marked as deleted successfully!');
        if (fetchStocks) fetchStocks();
      } else {
        throw new Error('Failed to delete stock');
      }
    } catch (error) {
      console.error('Delete error:', error);
      alert('Failed to delete stock');
    }
  };

  // Restore deleted stock
  const handleRestoreStock = async (stockId) => {
    try {
      const stock = filteredStocks.find(s => s.id === stockId);
      if (!stock) return;

      const restoredStock = {
        ...stock,
        isDeleted: false,
        deletedAt: null,
        status: 'active'
      };

      const response = await fetch(`http://localhost:5001/stocks/${stockId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(restoredStock)
      });

      if (response.ok) {
        if (setStocks) {
          setStocks(prev => prev.map(stock => 
            stock.id === stockId ? restoredStock : stock
          ));
        }
        alert('Stock restored successfully!');
        if (fetchStocks) fetchStocks();
      }
    } catch (error) {
      console.error('Restore error:', error);
      alert('Failed to restore stock');
    }
  };

  // Filter stocks
  const filteredStocksDisplay = filteredStocks.filter(stock => {
    // Search filter
    const matchesSearch = 
      searchTerm === '' ||
      stock.vendorName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.warehouseName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.billNo?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      stock.products?.some(p => 
        p.productName?.toLowerCase().includes(searchTerm.toLowerCase())
      );

    // Status filter
    const matchesStatus = 
      filterStatus === 'all' ||
      (filterStatus === 'active' && stock.status === 'active' && !stock.isDeleted) ||
      (filterStatus === 'inactive' && stock.status === 'inactive' && !stock.isDeleted) ||
      (filterStatus === 'deleted' && stock.isDeleted);

    // Type filter
    const matchesType = 
      filterType === 'all' ||
      (filterType === 'unique' && stock.products?.some(p => p.identifierType === 'UNIQUE')) ||
      (filterType === 'non-unique' && stock.products?.some(p => p.identifierType === 'NON_UNIQUE'));

    return matchesSearch && matchesStatus && matchesType;
  });

  // Calculate total quantity for a stock
  const calculateTotalQuantity = (stock) => {
    if (!stock.products || stock.products.length === 0) return 0;
    
    return stock.products.reduce((total, product) => {
      return total + getProductQuantity(product);
    }, 0);
  };

  // Format dynamic values for display
  const formatDynamicValues = (dynamicValues) => {
    if (!dynamicValues) return [];
    
    return Object.entries(dynamicValues).map(([key, value]) => {
      // value object हो सकता है {value: "...", fieldId: "..."}
      // या direct string भी हो सकता है
      const displayValue = typeof value === 'object' ? value.value : value;
      return { key, value: displayValue };
    });
  };

  // Pagination calculations
  const totalItems = filteredStocksDisplay.length;
  const totalPages = Math.ceil(totalItems / itemsPerPage);
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentStocks = filteredStocksDisplay.slice(indexOfFirstItem, indexOfLastItem);
  
  // Reset to first page when filters change
  useEffect(() => {
    setCurrentPage(1);
  }, [searchTerm, filterStatus, filterType]);

  // Format date
  const formatDate = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleDateString('en-IN');
  };

  // Format datetime
  const formatDateTime = (dateString) => {
    if (!dateString) return 'N/A';
    return new Date(dateString).toLocaleString('en-IN');
  };

  // Handle view details in popup
  const handleViewDetails = (stock) => {
    setSelectedStock(stock);
    setIsViewModalOpen(true);
  };

  // Open delete confirmation
  const openDeleteConfirm = (stock) => {
    setStockToDelete(stock);
    setIsDeleteConfirmOpen(true);
  };

  // Pagination controls
  const handlePageChange = (pageNumber) => {
    if (pageNumber < 1 || pageNumber > totalPages) return;
    setCurrentPage(pageNumber);
  };

  // Generate page numbers
  const getPageNumbers = () => {
    const pageNumbers = [];
    const maxVisiblePages = 5;
    
    if (totalPages <= maxVisiblePages) {
      for (let i = 1; i <= totalPages; i++) {
        pageNumbers.push(i);
      }
    } else {
      const halfVisible = Math.floor(maxVisiblePages / 2);
      
      if (currentPage <= halfVisible + 1) {
        for (let i = 1; i <= maxVisiblePages - 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      } else if (currentPage >= totalPages - halfVisible) {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = totalPages - (maxVisiblePages - 2); i <= totalPages; i++) {
          pageNumbers.push(i);
        }
      } else {
        pageNumbers.push(1);
        pageNumbers.push('...');
        for (let i = currentPage - 1; i <= currentPage + 1; i++) {
          pageNumbers.push(i);
        }
        pageNumbers.push('...');
        pageNumbers.push(totalPages);
      }
    }
    
    return pageNumbers;
  };

  let sr = (currentPage - 1) * itemsPerPage + 1;

  return (
    <div className="mt-6">
      {/* Filters Section */}
      <div className="bg-white rounded-lg p-4 mb-2 border border-gray-200 shadow-sm">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          {/* Search */}
          <div className="md:col-span-2">
            <input
              type="text"
              placeholder="Search by vendor, warehouse, bill no, or product..."
              value={searchTerm}
              onChange={(e) => setSearchTerm(e.target.value)}
              className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            />
          </div>

          {/* Status Filter */}
          <div>
            <select
              value={filterStatus}
              onChange={(e) => setFilterStatus(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Status</option>
              <option value="active">Active</option>
              <option value="deleted">Deleted</option>
            </select>
          </div>

          {/* Type Filter */}
          <div>
            <select
              value={filterType}
              onChange={(e) => setFilterType(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
            >
              <option value="all">All Types</option>
              <option value="unique">Unique Products</option>
              <option value="non-unique">Non-Unique Products</option>
            </select>
          </div>
        </div>

        {/* Filter Info */}
        <div className="flex justify-between items-center mt-4">
          <div className="text-gray-600 text-sm">
            Showing {currentStocks.length} of {filteredStocksDisplay.length} stocks (Page {currentPage} of {totalPages})
            {searchTerm && ` for "${searchTerm}"`}
          </div>
          <div className="flex gap-2">
            <button
              onClick={() => router.push('/stock/stock-alert')}
              className="px-3 py-1.5 bg-yellow-100 text-yellow-700 rounded hover:bg-yellow-200 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="currentColor" viewBox="0 0 20 20">
                <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
              </svg>
              Stock Alert
            </button>
            <button
              onClick={() => {
                setSearchTerm('');
                setFilterStatus('all');
                setFilterType('all');
              }}
              className="px-3 py-1.5 bg-gray-100 text-gray-700 rounded hover:bg-gray-200 text-sm flex items-center"
            >
              Clear Filters
            </button>
            <button
              onClick={fetchStocks}
              className="px-3 py-1.5 bg-blue-100 text-blue-700 rounded hover:bg-blue-200 text-sm flex items-center"
            >
              <svg className="w-4 h-4 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" />
              </svg>
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Stock Table */}
      <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-sm">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Sr no
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Bill No
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Purchase Date
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Vendor
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Warehouse
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Products
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Quantity Summary
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Status
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          
          <tbody className="bg-white divide-y divide-gray-200">
            {currentStocks.length === 0 ? (
              <tr>
                <td colSpan="9" className="px-6 py-12 text-center text-gray-500">
                  <div className="flex flex-col items-center">
                    <svg className="w-12 h-12 text-gray-300 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                    </svg>
                    <p className="text-lg font-medium text-gray-600">No stock records found</p>
                    <p className="text-sm text-gray-500 mt-1">
                      {searchTerm ? 'Try changing your search criteria' : 'Start by adding a new stock'}
                    </p>
                  </div>
                </td>
              </tr>
            ) : (
              currentStocks.map((stock) => {
                const isDeleteDisabled = !canDeleteStock(stock);
                const totalQuantity = calculateTotalQuantity(stock);
                
                return (
                  <tr key={stock.id} className={`hover:bg-gray-50 ${stock.isDeleted ? 'bg-red-50' : ''}`}>
                    <td className="px-6">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">#{sr++}</div>
                      </div>
                    </td>
                    <td className="px-6">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">{stock.billNo || 'N/A'}</div>
                      </div>
                    </td>
                    <td className="px-6">
                      <div className="flex flex-col">
                        <div><span className="font-medium">{formatDate(stock.purchaseDate)}</span></div>
                      </div>
                    </td>
                   
                    <td className="px-6">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">{stock.vendorName || 'N/A'}</div>
                      </div>
                    </td>

                    <td className="px-6">
                      <div className="flex flex-col">
                        <div className="font-medium text-gray-900">{stock.warehouseName || 'N/A'}</div>
                      </div>
                    </td>

                    <td className="px-6">
                      <div className="space-y-1">
                        <div className="space-y-1 max-h-20 overflow-y-auto">
                          {stock.products?.slice(0, 3).map((product, idx) => {
                            const productQuantity = getProductQuantity(product);
                            
                            return (
                              <div key={idx} className="flex items-center text-xs">
                                <span className={`w-2 h-2 rounded-full mr-2 ${product.identifierType === 'UNIQUE' ? 'bg-blue-500' : 'bg-green-500'}`}></span>
                                <div className="truncate">
                                  <div className="font-medium truncate">{product.productName}</div>
                                  <div className="text-gray-500">
                                    Type: <span className="font-medium">{product.identifierType}</span>
                                    <span className="mx-1">•</span>
                                    Qty: <span className="font-medium">{productQuantity}</span>
                                  </div>
                                </div>
                              </div>
                            );
                          })}
                          {stock.products?.length > 3 && (
                            <div className="text-xs text-gray-500">
                              +{stock.products.length - 3} more products
                            </div>
                          )}
                        </div>
                      </div>
                    </td>

                    <td className="px-6">
                      <div className="flex flex-col space-y-2">
                        <div className="text-center">
                          <div className=" font-bold  text-blue-600">
                            {totalQuantity}
                          </div>
                        </div>
                      </div>
                    </td>

                    <td className="px-6">
                      <div className="flex flex-col gap-1">
                        <span className={`px-2 py-1 text-xs rounded-full text-center ${
                          stock.isDeleted 
                            ? 'bg-red-100 text-red-800'
                            : stock.status === 'active'
                            ? 'bg-green-100 text-green-800'
                            : stock.status === 'inactive'
                            ? 'bg-yellow-100 text-yellow-800'
                            : 'bg-gray-100 text-gray-800'
                        }`}>
                          {stock.isDeleted ? 'DELETED' : (stock.status?.toUpperCase() || 'ACTIVE')}
                        </span>
                        {stock.deletedAt && (
                          <div className="text-xs text-red-600">
                            Deleted: {formatDate(stock.deletedAt)}
                          </div>
                        )}
                      </div>
                    </td>

                    <td className="px-1 py-4">
                      <div className="flex  gap-2">
                        <button
                          onClick={() => handleViewDetails(stock)}
                          className="px-3 py-1.5 bg-blue-50 text-blue-700 rounded hover:bg-blue-100 text-sm flex items-center justify-center transition-colors"
                          title="View Details"
                        >
                          <MdVisibility className="mr-1" size={14} />
                        </button>

                        {!stock.isDeleted && onEditStock && (
                          <button
                            onClick={() => onEditStock(stock.id)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm flex items-center justify-center transition-colors"
                            title="Edit Stock"
                          >
                            <MdEdit className="mr-1" size={14} />
                          </button>
                        )}

                        {!stock.isDeleted ? (
                          <button
                            onClick={() => openDeleteConfirm(stock)}
                            disabled={isDeleteDisabled}
                            className={`px-3 py-1.5 rounded text-sm flex items-center justify-center transition-colors ${
                              isDeleteDisabled
                                ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                                : 'bg-red-50 text-red-700 hover:bg-red-100'
                            }`}
                            title={isDeleteDisabled ? "Cannot delete. All product quantities must be 0." : "Delete stock"}
                          >
                            <MdDelete className="mr-1" size={14} />
                          </button>
                        ) : (
                          <button
                            onClick={() => handleRestoreStock(stock.id)}
                            className="px-3 py-1.5 bg-green-50 text-green-700 rounded hover:bg-green-100 text-sm flex items-center justify-center transition-colors"
                            title="Restore Stock"
                          >
                            <MdRestore className="mr-1" size={14} />
                            Restore
                          </button>
                        )}
                      </div>
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>

      {/* Pagination Controls - Same as before */}
      {totalPages > 1 && (
        <div className="flex flex-col sm:flex-row justify-between items-center mt-6 gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Items per page:</span>
            <select
              value={itemsPerPage}
              onChange={(e) => {
                setItemsPerPage(Number(e.target.value));
                setCurrentPage(1);
              }}
              className="px-3 py-1 border border-gray-300 rounded-md text-sm focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              <option value="5">5</option>
              <option value="10">10</option>
              <option value="25">25</option>
              <option value="50">50</option>
              <option value="100">100</option>
            </select>
            <span className="text-sm text-gray-600">
              Showing {indexOfFirstItem + 1}-{Math.min(indexOfLastItem, totalItems)} of {totalItems} items
            </span>
          </div>

          {/* Page navigation */}
          <div className="flex items-center gap-2">
            <button
              onClick={() => handlePageChange(currentPage - 1)}
              disabled={currentPage === 1}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                currentPage === 1
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7" />
              </svg>
              Previous
            </button>

            <div className="flex gap-1">
              {getPageNumbers().map((pageNum, index) => (
                pageNum === '...' ? (
                  <span key={`ellipsis-${index}`} className="px-3 py-1.5 text-gray-500">
                    ...
                  </span>
                ) : (
                  <button
                    key={pageNum}
                    onClick={() => handlePageChange(pageNum)}
                    className={`px-3 py-1.5 min-w-[2.5rem] rounded-md text-sm ${
                      currentPage === pageNum
                        ? 'bg-blue-600 text-white'
                        : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
                    }`}
                  >
                    {pageNum}
                  </button>
                )
              ))}
            </div>

            <button
              onClick={() => handlePageChange(currentPage + 1)}
              disabled={currentPage === totalPages}
              className={`px-3 py-1.5 rounded-md text-sm flex items-center ${
                currentPage === totalPages
                  ? 'bg-gray-100 text-gray-400 cursor-not-allowed'
                  : 'bg-white border border-gray-300 text-gray-700 hover:bg-gray-50'
              }`}
            >
              Next
              <svg className="w-4 h-4 ml-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 5l7 7-7 7" />
              </svg>
            </button>
          </div>

          <div className="flex items-center gap-2">
            <span className="text-sm text-gray-600">Go to page:</span>
            <input
              type="number"
              min="1"
              max={totalPages}
              value={currentPage}
              onChange={(e) => {
                const page = Math.min(Math.max(1, Number(e.target.value)), totalPages);
                handlePageChange(page);
              }}
              className="w-16 px-2 py-1 border border-gray-300 rounded-md text-sm text-center focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
            <span className="text-sm text-gray-600">of {totalPages}</span>
          </div>
        </div>
      )}

      {/* Stats Summary - Same as before */}
      <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-blue-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-blue-600">{filteredStocks.length}</div>
              <div className="text-sm text-gray-600">Total Stocks</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-green-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-green-600">
                {filteredStocks.filter(s => !s.isDeleted && s.status === 'active').length}
              </div>
              <div className="text-sm text-gray-600">Active Stocks</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-red-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-red-600">
                {filteredStocks.filter(s => s.isDeleted).length}
              </div>
              <div className="text-sm text-gray-600">Deleted Stocks</div>
            </div>
          </div>
        </div>
        
        <div className="bg-white rounded-lg shadow p-4 border border-gray-200">
          <div className="flex items-center">
            <div className="w-10 h-10 bg-purple-100 rounded-lg flex items-center justify-center mr-3">
              <svg className="w-5 h-5 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
              </svg>
            </div>
            <div>
              <div className="text-2xl font-bold text-purple-600">{filteredStocksDisplay.length}</div>
              <div className="text-sm text-gray-600">Filtered Stocks</div>
            </div>
          </div>
        </div>
      </div>

      {/* View Details Modal - Updated for dynamic values */}
      {isViewModalOpen && selectedStock && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-xl shadow-xl w-full max-w-6xl max-h-[90vh] overflow-hidden">
            {/* Modal Header */}
            <div className="px-6 py-4 border-b bg-blue-50">
              <div className="flex justify-between items-center">
                <div>
                  <h2 className="text-xl font-bold text-gray-800">Stock Details</h2>
                </div>
                <button
                  onClick={() => {
                    setIsViewModalOpen(false);
                    setSelectedStock(null);
                  }}
                  className="text-gray-500 hover:text-gray-700 text-2xl"
                >
                  ✕
                </button>
              </div>
            </div>

            {/* Modal Content */}
            <div className="overflow-y-auto max-h-[70vh] p-3">
              {/* Stock Basic Info */}
              <div className="mb-2">
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">Basic Information</h3>
                <div className="grid grid-cols-1 md:grid-cols-3 gap-2">
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Vendor</label>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-800">{selectedStock.vendorName || 'N/A'}</div>
                      <span className="text-xs text-gray-500">(ID: {selectedStock.vendorId})</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Bill Number</label>
                    <p className="text-gray-800 font-medium">{selectedStock.billNo || 'N/A'}</p>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Purchase Date</label>
                    <p className="text-gray-800 font-medium">
                      {formatDate(selectedStock.purchaseDate)}
                    </p>
                  </div>
                 
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Warehouse</label>
                    <div className="flex items-center gap-2">
                      <div className="font-medium text-gray-800">{selectedStock.warehouseName || 'N/A'}</div>
                      <span className="text-xs text-gray-500">(ID: {selectedStock.warehouseId})</span>
                    </div>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Status</label>
                    <span className={`inline-flex items-center px-3 py-1 rounded-full text-sm font-medium ${
                      selectedStock.isDeleted 
                        ? 'bg-red-100 text-red-800'
                        : selectedStock.status === 'active'
                        ? 'bg-green-100 text-green-800'
                        : selectedStock.status === 'inactive'
                        ? 'bg-yellow-100 text-yellow-800'
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {selectedStock.isDeleted ? 'DELETED' : selectedStock.status?.toUpperCase()}
                    </span>
                  </div>
                  <div>
                    <label className="block text-sm font-medium text-gray-500 mb-1">Created At</label>
                    <p className="text-gray-800 font-medium">
                      {formatDateTime(selectedStock.createdAt)}
                    </p>
                  </div>
                </div>
              </div>

              {/* Products Section */}
              <div>
                <h3 className="text-lg font-semibold text-gray-800 mb-4 pb-2 border-b">
                  Products ({selectedStock.products?.length || 0})
                </h3>
                
                {selectedStock.products?.length === 0 ? (
                  <div className="text-center py-8 text-gray-500">
                    No products in this stock
                  </div>
                ) : (
                  <div className="space-y-4">
                    {selectedStock.products?.map((product, productIndex) => {
                      const productQuantity = getProductQuantity(product);
                      const formattedDynamicValues = formatDynamicValues(product.dynamicValues);
                      
                      return (
                        <div key={productIndex} className="border border-gray-200 rounded-lg p-4">
                          <div className="flex justify-between items-start mb-4">
                            <div>
                              <h4 className="font-bold text-gray-800 text-lg">{product.productName}</h4>
                              <div className="flex items-center gap-2 mt-1">
                                <span className={`px-2 py-1 text-xs rounded-full ${
                                  product.identifierType === 'UNIQUE' 
                                    ? 'bg-blue-100 text-blue-800' 
                                    : 'bg-green-100 text-green-800'
                                }`}>
                                  {product.identifierType}
                                </span>
                                <span className="text-sm text-gray-600">Product #{productIndex + 1}</span>
                              </div>
                            </div>
                            <div className="text-right">
                              <p className="text-sm text-gray-600">Quantity</p>
                              <p className="text-2xl font-bold text-blue-600">{productQuantity}</p>
                            </div>
                          </div>

                          {/* Basic Product Details */}
                          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Rate</label>
                              <p className="text-sm font-medium text-gray-800">₹{product.rate || '0'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">GST</label>
                              <p className="text-sm font-medium text-gray-800">{product.gst || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Quantity Alert</label>
                              <p className="text-sm font-medium text-gray-800">{product.quantityAlert || 'N/A'}</p>
                            </div>
                            <div>
                              <label className="block text-xs font-medium text-gray-500 mb-1">Product ID</label>
                              <p className="text-sm font-medium text-gray-800 truncate">{product.productId}</p>
                            </div>
                          </div>

                          {/* For UNIQUE products - Show Serial Items */}
                          {product.identifierType === 'UNIQUE' && product.items && product.items.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="font-medium text-gray-700 mb-3">Serial Items ({product.items.length})</h5>
                              <div className="overflow-x-auto">
                                <table className="min-w-full divide-y divide-gray-200 text-sm">
                                  <thead className="bg-gray-50">
                                    <tr>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Serial No</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">MAC Address</th>
                                      <th className="px-3 py-2 text-left text-xs font-medium text-gray-500 uppercase">Warranty</th>
                                    </tr>
                                  </thead>
                                  <tbody className="bg-white divide-y divide-gray-200">
                                    {product.items.map((item, itemIndex) => (
                                      <tr key={itemIndex}>
                                        <td className="px-3 py-2 text-sm">{itemIndex + 1}</td>
                                        <td className="px-3 py-2 text-sm">{item.serialno || 'N/A'}</td>
                                        <td className="px-3 py-2 text-sm">{item.macaddress || 'N/A'}</td>
                                        <td className="px-3 py-2 text-sm">{item.warrenty || 'N/A'}</td>
                                      </tr>
                                    ))}
                                  </tbody>
                                </table>
                              </div>
                            </div>
                          )}

                          {/* For NON_UNIQUE products - Show Dynamic Values */}
                          {product.identifierType === 'NON_UNIQUE' && formattedDynamicValues.length > 0 && (
                            <div className="mt-4 pt-4 border-t">
                              <h5 className="font-medium text-gray-700 mb-3">Additional Details</h5>
                              <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                                {formattedDynamicValues.map(({ key, value }, index) => (
                                  <div key={index} className="flex">
                                    <div className="w-1/3 font-medium text-gray-700 capitalize">
                                      {key.replace(/([A-Z])/g, ' $1').trim()}:
                                    </div>
                                    <div className="w-2/3 text-gray-600">{value}</div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            </div>

            {/* Modal Footer */}
            <div className="px-6 py-4 border-t bg-gray-50 flex justify-end">
              <button
                onClick={() => {
                  setIsViewModalOpen(false);
                  setSelectedStock(null);
                }}
                className="px-6 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Delete Confirmation Modal */}
      {isDeleteConfirmOpen && stockToDelete && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-xl w-full max-w-md">
            <div className="p-6">
              <div className="flex items-center mb-4">
                <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mr-4">
                  <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.732-.833-2.464 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                  </svg>
                </div>
                <div>
                  <h3 className="text-lg font-semibold text-gray-800">Confirm Delete</h3>
                  <p className="text-sm text-gray-600">This action cannot be undone</p>
                </div>
              </div>

              <div className="bg-gray-50 p-4 rounded-lg mb-6">
                <p className="text-gray-700">
                  Are you sure you want to mark this stock as deleted?
                </p>
                <div className="mt-2 text-sm text-gray-600">
                  <div className="flex justify-between py-1">
                    <span>Stock ID:</span>
                    <span className="font-medium">#{stockToDelete.id}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Vendor:</span>
                    <span className="font-medium">{stockToDelete.vendorName}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Bill No:</span>
                    <span className="font-medium">{stockToDelete.billNo}</span>
                  </div>
                  <div className="flex justify-between py-1">
                    <span>Total Quantity:</span>
                    <span className="font-medium">{calculateTotalQuantity(stockToDelete)}</span>
                  </div>
                </div>
                
                {!canDeleteStock(stockToDelete) ? (
                  <div className="mt-3 p-3 bg-red-50 border border-red-200 rounded">
                    <p className="text-sm text-red-800 font-medium">Cannot Delete!</p>
                    <p className="text-xs text-red-700 mt-1">
                      This stock cannot be deleted because it contains products with quantity greater than 0.
                      Please ensure all product quantities are 0 before deleting.
                    </p>
                  </div>
                ) : (
                  <div className="mt-3 p-3 bg-yellow-50 border border-yellow-200 rounded">
                    <p className="text-sm text-yellow-800">
                      <span className="font-medium">Note:</span> This is a soft delete. 
                      The stock will be marked as deleted but can be restored later.
                    </p>
                  </div>
                )}
              </div>

              <div className="flex justify-end space-x-3">
                <button
                  onClick={() => {
                    setIsDeleteConfirmOpen(false);
                    setStockToDelete(null);
                  }}
                  className="px-4 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 transition-colors"
                >
                  Cancel
                </button>
                <button
                  onClick={() => handleSoftDelete(stockToDelete.id)}
                  disabled={!canDeleteStock(stockToDelete)}
                  className={`px-4 py-2 text-white rounded-lg flex items-center transition-colors ${
                    canDeleteStock(stockToDelete)
                      ? 'bg-red-600 hover:bg-red-700'
                      : 'bg-red-300 cursor-not-allowed'
                  }`}
                >
                  <MdDelete className="mr-2" size={16} />
                  Confirm Delete
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}