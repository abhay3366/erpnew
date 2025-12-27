"use client";
import React, { useState, useEffect, useMemo } from 'react';

const StockAlert = () => {
  const [stocks, setStocks] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [filter, setFilter] = useState('all'); 
  const [sortBy, setSortBy] = useState('quantity');
  const [sortOrder, setSortOrder] = useState('asc');

  // Fetch data from JSON Server
  useEffect(() => {
    const fetchStocks = async () => {
      try {
        const response = await fetch('http://localhost:5001/stocks');
        if (!response.ok) {
          throw new Error('Failed to fetch data');
        }
        const data = await response.json();
        setStocks(data);
        setLoading(false);
      } catch (err) {
        setError(err.message);
        setLoading(false);
      }
    };

    fetchStocks();
  }, []);

  // Extract quantity from dynamicValues
  const extractQuantity = (product) => {
    if (!product.dynamicValues) return 0;
    
    // Try to get quantity from dynamicValues
    const quantityObj = product.dynamicValues.quantity;
    if (quantityObj && quantityObj.value) {
      const quantity = parseInt(quantityObj.value, 10);
      return isNaN(quantity) ? 0 : quantity;
    }
    
    // If quantity is not found, try to find any field with "quantity" in key
    for (const key in product.dynamicValues) {
      if (key.toLowerCase().includes('quantity') && product.dynamicValues[key].value) {
        const quantity = parseInt(product.dynamicValues[key].value, 10);
        return isNaN(quantity) ? 0 : quantity;
      }
    }
    
    return 0;
  };

  // Calculate total quantity per product across all stocks
  const calculateProductQuantities = useMemo(() => {
    const productMap = new Map(); // Map to store productId -> {totalQuantity, details}
    console.log("🚀 ~ StockAlert ~ productMap:", productMap)
    
    stocks.forEach(stock => {
      if (stock.status === 'active') {
        stock.products.forEach(product => {
          const productId = product.productId;
          const quantity = extractQuantity(product);
          const quantityAlert = product.quantityAlert || 10;
          
          if (productMap.has(productId)) {
            // Update existing product
            const existing = productMap.get(productId);
            existing.totalQuantity += quantity;
            existing.stocks.push({
              quantity,
              warehouseName: stock.warehouseName,
              vendorName: stock.vendorName,
              purchaseDate: stock.purchaseDate,
              billNo: stock.billNo,
              stockId: stock.id
            });
          } else {
            // Add new product
            productMap.set(productId, {
              productId: product.productId,
              productName: product.productName,
              identifierType: product.identifierType,
              rate: product.rate,
              gst: product.gst,
              quantityAlert: quantityAlert,
              totalQuantity: quantity,
              stocks: [{
                quantity,
                warehouseName: stock.warehouseName,
                vendorName: stock.vendorName,
                purchaseDate: stock.purchaseDate,
                billNo: stock.billNo,
                stockId: stock.id
              }]
            });
          }
        });
      }
    });
    
    // Convert map to array
    return Array.from(productMap.values());
  }, [stocks]);

  // Filter products with low stock
  const alertProducts = useMemo(() => {
    return calculateProductQuantities.filter(product => {
      return product.totalQuantity <= product.quantityAlert;
    });
  }, [calculateProductQuantities]);

  // Filter based on selected filter
  const filteredProducts = useMemo(() => {
    if (filter === 'out-of-stock') {
      return alertProducts.filter(product => product.totalQuantity === 0);
    } else if (filter === 'low-stock') {
      return alertProducts.filter(product => 
        product.totalQuantity > 0 && product.totalQuantity <= product.quantityAlert
      );
    }
    return alertProducts;
  }, [alertProducts, filter]);

  // Sort products
  const sortedProducts = useMemo(() => {
    const sorted = [...filteredProducts];
    sorted.sort((a, b) => {
      if (sortBy === 'quantity') {
        return sortOrder === 'asc' ? a.totalQuantity - b.totalQuantity : b.totalQuantity - a.totalQuantity;
      } else if (sortBy === 'productName') {
        return sortOrder === 'asc' 
          ? a.productName.localeCompare(b.productName)
          : b.productName.localeCompare(a.productName);
      }
      return 0;
    });
    return sorted;
  }, [filteredProducts, sortBy, sortOrder]);

  // Toggle sort order
  const toggleSort = (column) => {
    if (sortBy === column) {
      setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc');
    } else {
      setSortBy(column);
      setSortOrder('asc');
    }
  };

  // Get alert level
  const getAlertLevel = (quantity) => {
    if (quantity === 0) return 'critical';
    if (quantity <= 5) return 'high';
    return 'medium';
  };

  // Calculate statistics
  const stats = useMemo(() => {
    const totalAlerts = alertProducts.length;
    const outOfStock = alertProducts.filter(p => p.totalQuantity === 0).length;
    const lowStock = alertProducts.filter(p => p.totalQuantity > 0 && p.totalQuantity <= p.quantityAlert).length;
    
    return { totalAlerts, outOfStock, lowStock };
  }, [alertProducts]);

  // Get warehouses for a product
  const getWarehousesForProduct = (product) => {
    const warehouses = product.stocks.map(stock => stock.warehouseName);
    return [...new Set(warehouses)]; // Remove duplicates
  };

  // Get vendors for a product
  const getVendorsForProduct = (product) => {
    const vendors = product.stocks.map(stock => stock.vendorName);
    return [...new Set(vendors)]; // Remove duplicates
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stock alerts...</p>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50 p-6">
        <div className="bg-red-50 border border-red-200 rounded-lg p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg className="h-5 w-5 text-red-400" viewBox="0 0 20 20" fill="currentColor">
                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
              </svg>
            </div>
            <div className="ml-3">
              <h3 className="text-sm font-medium text-red-800">Error loading data</h3>
              <div className="mt-2 text-sm text-red-700">
                <p>{error}</p>
                <p className="mt-2">Make sure your JSON Server is running on http://localhost:5001</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50 p-4 md:p-6">
      {/* Header */}
      <div className="mb-8">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Stock Alerts</h1>
            <p className="text-gray-600 mt-2">Monitor products with low inventory levels</p>
          </div>
          <div className="mt-4 md:mt-0 flex items-center space-x-4">
            <span className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium bg-red-100 text-red-800">
              <span className="w-2 h-2 bg-red-500 rounded-full mr-2"></span>
              {stats.totalAlerts} Alerts
            </span>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-red-50 rounded-lg">
                <svg className="w-6 h-6 text-red-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.282 16.5c-.77.833.192 2.5 1.732 2.5z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Total Alerts</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.totalAlerts}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-orange-50 rounded-lg">
                <svg className="w-6 h-6 text-orange-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Low Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.lowStock}</p>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-xl shadow-sm p-6 border border-gray-200">
          <div className="flex items-center">
            <div className="flex-shrink-0">
              <div className="p-3 bg-purple-50 rounded-lg">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="ml-5">
              <p className="text-sm font-medium text-gray-600">Out of Stock</p>
              <p className="text-2xl font-semibold text-gray-900">{stats.outOfStock}</p>
            </div>
          </div>
        </div>
      </div>

      {/* Filters and Controls */}
      <div className="bg-white rounded-xl shadow-sm p-4 mb-6 border border-gray-200">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between space-y-4 md:space-y-0">
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Filter by:</label>
              <div className="flex space-x-2">
                <button
                  onClick={() => setFilter('all')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'all' ? 'bg-blue-100 text-blue-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  All Alerts
                </button>
                <button
                  onClick={() => setFilter('low-stock')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'low-stock' ? 'bg-orange-100 text-orange-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Low Stock
                </button>
                <button
                  onClick={() => setFilter('out-of-stock')}
                  className={`px-4 py-2 text-sm font-medium rounded-lg ${filter === 'out-of-stock' ? 'bg-red-100 text-red-700' : 'bg-gray-100 text-gray-700 hover:bg-gray-200'}`}
                >
                  Out of Stock
                </button>
              </div>
            </div>
          </div>
          
          <div className="flex items-center space-x-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">Sort by:</label>
              <select
                value={sortBy}
                onChange={(e) => setSortBy(e.target.value)}
                className="block w-full px-3 py-2 bg-white border border-gray-300 rounded-lg shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
              >
                <option value="quantity">Quantity</option>
                <option value="productName">Product Name</option>
              </select>
            </div>
            <button
              onClick={() => setSortOrder(sortOrder === 'asc' ? 'desc' : 'asc')}
              className="mt-6 px-3 py-2 border border-gray-300 rounded-lg hover:bg-gray-50"
            >
              {sortOrder === 'asc' ? '↑' : '↓'}
            </button>
          </div>
        </div>
      </div>

      {/* Products Table */}
      <div className="bg-white rounded-xl shadow-sm overflow-hidden border border-gray-200">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Product
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Current Stock
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Alert Level
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Warehouses
                </th>
                <th scope="col" className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  Details
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {sortedProducts.length === 0 ? (
                <tr>
                  <td colSpan="5" className="px-6 py-12 text-center">
                    <div className="flex flex-col items-center justify-center">
                      <svg className="w-12 h-12 text-gray-400 mb-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                      </svg>
                      <p className="text-gray-500">No stock alerts found</p>
                      <p className="text-gray-400 text-sm mt-1">All products are sufficiently stocked</p>
                    </div>
                  </td>
                </tr>
              ) : (
                sortedProducts.map((product, index) => (
                  <tr key={`${product.productId}-${index}`} className="hover:bg-gray-50 transition-colors">
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="flex-shrink-0 h-10 w-10 bg-blue-50 rounded-lg flex items-center justify-center">
                          <svg className="h-6 w-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                          </svg>
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                          <div className="text-sm text-gray-500">ID: {product.productId}</div>
                          <div className="text-xs text-gray-400 mt-1">
                            <span className={`px-2 py-1 rounded ${product.identifierType === 'UNIQUE' ? 'bg-purple-100 text-purple-800' : 'bg-green-100 text-green-800'}`}>
                              {product.identifierType}
                            </span>
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div>
                        <div className="text-sm font-medium text-gray-900">
                          {product.totalQuantity} units
                        </div>
                        <div className="text-sm text-gray-500">
                          Alert at: {product.quantityAlert} units
                        </div>
                        <div className="text-xs text-gray-400 mt-1">
                          Distributed across {product.stocks.length} stock entries
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <span className={`inline-flex items-center px-3 py-1 rounded-full text-xs font-medium ${
                        getAlertLevel(product.totalQuantity) === 'critical'
                          ? 'bg-red-100 text-red-800'
                          : getAlertLevel(product.totalQuantity) === 'high'
                          ? 'bg-orange-100 text-orange-800'
                          : 'bg-yellow-100 text-yellow-800'
                      }`}>
                        {getAlertLevel(product.totalQuantity) === 'critical' ? (
                          <>
                            <svg className="mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            Critical
                          </>
                        ) : getAlertLevel(product.totalQuantity) === 'high' ? (
                          <>
                            <svg className="mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                            </svg>
                            High Alert
                          </>
                        ) : (
                          <>
                            <svg className="mr-1 w-4 h-4" fill="currentColor" viewBox="0 0 20 20">
                              <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM7 9a1 1 0 000 2h6a1 1 0 100-2H7z" clipRule="evenodd" />
                            </svg>
                            Medium Alert
                          </>
                        )}
                      </span>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm text-gray-900">
                        {getWarehousesForProduct(product).map((warehouse, idx) => (
                          <span key={idx} className="inline-block bg-gray-100 text-gray-800 px-2 py-1 rounded text-xs mr-1 mb-1">
                            {warehouse}
                          </span>
                        ))}
                      </div>
                    </td>
                    <td className="px-6 py-4">
                      <div className="text-sm">
                        <div className="text-gray-900 mb-1">
                          <span className="font-medium">Vendors: </span>
                          {getVendorsForProduct(product).join(', ')}
                        </div>
                        <div className="text-gray-600">
                          <span className="font-medium">Stock Entries: </span>
                          {product.stocks.length}
                        </div>
                        <button 
                          className="mt-2 text-blue-600 hover:text-blue-800 text-sm flex items-center"
                          onClick={() => {
                            console.log('Product details:', product);
                            alert(`Product: ${product.productName}\nTotal Quantity: ${product.totalQuantity}\nStock Entries: ${product.stocks.length}\nSee console for full details.`);
                          }}
                        >
                          <svg className="w-4 h-4 mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          View Details
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Summary Section */}
      <div className="mt-8 bg-white rounded-xl shadow-sm p-6 border border-gray-200">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Stock Summary</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Product Distribution</h4>
            <div className="space-y-2">
              {calculateProductQuantities.map((product, index) => (
                <div key={index} className="flex justify-between items-center">
                  <span className="text-sm text-gray-600 truncate max-w-[200px]">{product.productName}</span>
                  <span className={`text-sm font-medium ${
                    product.totalQuantity <= product.quantityAlert 
                      ? 'text-red-600' 
                      : 'text-green-600'
                  }`}>
                    {product.totalQuantity} units
                  </span>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="text-sm font-medium text-gray-700 mb-2">Alert Legend</h4>
            <div className="space-y-3">
              <div className="flex items-center">
                <div className="w-3 h-3 bg-red-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Critical: Out of Stock (0 units)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-orange-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">High Alert: Very Low Stock (1-5 units)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-yellow-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Medium Alert: Low Stock (6+ units)</span>
              </div>
              <div className="flex items-center">
                <div className="w-3 h-3 bg-green-500 rounded-full mr-3"></div>
                <span className="text-sm text-gray-700">Safe: Above alert threshold</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default StockAlert;