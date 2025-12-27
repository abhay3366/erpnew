"use client"
import React, { useState, useEffect, useRef } from 'react'
import PageBreadcrumb from "@/components/common/PageBreadCrumb"
import { Search, Filter, Eye, MoreVertical, Printer, Download, Calendar, ChevronDown, ChevronUp, FileText, Store, Truck, Package, IndianRupee, ShoppingBag, User, Building, Tag, ExternalLink, Info, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from 'lucide-react'

const StockPurchase = () => {
  const [purchaseOrders, setPurchaseOrders] = useState([])
  const [filteredOrders, setFilteredOrders] = useState([])
  const [searchTerm, setSearchTerm] = useState("")
  const [statusFilter, setStatusFilter] = useState("active")
  const [selectedOrder, setSelectedOrder] = useState(null)
  const [isViewDialogOpen, setIsViewDialogOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(5)
  
  // Expanded rows with smooth animation
  const [expandedRows, setExpandedRows] = useState({})
  const [rowHeights, setRowHeights] = useState({})
  const rowRefs = useRef({})

  // Function to extract dynamic column headers from items
  const getDynamicHeadersFromItems = (items) => {
    if (!items || items.length === 0) return []
    
    const allHeaders = new Set()
    
    items.forEach(item => {
      Object.keys(item).forEach(key => {
        // Exclude id field
        if (key !== 'id') {
          allHeaders.add(key)
        }
      })
    })
    
    return Array.from(allHeaders)
  }

  // Function to get dynamic headers from dynamicValues
  const getDynamicHeadersFromDynamicValues = (dynamicValues) => {
    if (!dynamicValues || Object.keys(dynamicValues).length === 0) return []
    return Object.keys(dynamicValues)
  }

  // Function to format header name (capitalize, remove underscores)
  const formatHeaderName = (header) => {
    return header
      .replace(/_/g, ' ')
      .replace(/([A-Z])/g, ' $1')
      .replace(/^./, str => str.toUpperCase())
      .trim()
  }

  useEffect(() => {
    fetchPurchaseOrders()
  }, [])

  useEffect(() => {
    let filtered = purchaseOrders
    
    if (statusFilter !== "all") {
      filtered = filtered.filter(order => order.status === statusFilter)
    }
    
    if (searchTerm) {
      const term = searchTerm.toLowerCase()
      filtered = filtered.filter(order => 
        order.billNo.toLowerCase().includes(term) ||
        order.vendorName.toLowerCase().includes(term) ||
        order.warehouseName.toLowerCase().includes(term) ||
        order.products?.some(product => 
          product.productName.toLowerCase().includes(term)
        )
      )
    }
    
    setFilteredOrders(filtered)
    setCurrentPage(1) // Reset to first page when filtering
  }, [purchaseOrders, searchTerm, statusFilter])

  // Calculate pagination
  const totalPages = Math.ceil(filteredOrders.length / itemsPerPage)
  const startIndex = (currentPage - 1) * itemsPerPage
  const endIndex = startIndex + itemsPerPage
  const currentOrders = filteredOrders.slice(startIndex, endIndex)

  const fetchPurchaseOrders = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5001/stocks')
      
      if (!response.ok) throw new Error('Network response was not ok')
      
      const data = await response.json()
      setPurchaseOrders(data)
      setFilteredOrders(data)
      setError(null)
    } catch (err) {
      setError('Data fetch nahi ho paya. Please check JSON server.')
      console.error('Error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Smooth expand/collapse function
  const toggleRowExpand = async (orderId) => {
    if (!expandedRows[orderId]) {
      // Expand
      setExpandedRows(prev => ({ ...prev, [orderId]: true }))
    } else {
      // Collapse with delay for animation
      setTimeout(() => {
        setExpandedRows(prev => ({ ...prev, [orderId]: false }))
      }, 50)
    }
  }

  const calculateProductTotal = (product) => {
    const quantity = product.quantity || 0
    const rate = product.rate || 0
    const gstPercent = parseFloat(product.gst) || 0
    const subtotal = quantity * rate
    const gstAmount = (subtotal * gstPercent) / 100
    return {
      subtotal,
      gstAmount,
      total: subtotal + gstAmount
    }
  }

  const calculateOrderTotal = (order) => {
    let total = 0
    let gstTotal = 0
    let subtotal = 0
    
    order.products?.forEach(product => {
      const calc = calculateProductTotal(product)
      subtotal += calc.subtotal
      gstTotal += calc.gstAmount
      total += calc.total
    })
    
    return { subtotal, gstTotal, total }
  }

  const formatDate = (dateString) => {
    if (!dateString) return ''
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    })
  }

  const getStatusBadge = (status) => {
    switch(status) {
      case 'active':
        return <span className="px-2 py-1 text-xs rounded-full bg-green-100 text-green-700 border border-green-200 font-medium">Active</span>
      case 'deleted':
        return <span className="px-2 py-1 text-xs rounded-full bg-red-100 text-red-700 border border-red-200 font-medium">Deleted</span>
      default:
        return <span className="px-2 py-1 text-xs rounded-full bg-gray-100 text-gray-700 border border-gray-200 font-medium">{status}</span>
    }
  }

  const handleViewOrder = (order) => {
    setSelectedOrder(order)
    setIsViewDialogOpen(true)
  }

  // Main table row par click karne par expand kare
  const handleRowClick = (orderId, e) => {
    // Sirf table row par click hone par expand kare, buttons par nahi
    if (e.target.closest('button') || e.target.closest('a')) {
      return
    }
    toggleRowExpand(orderId)
  }

  // Pagination functions
  const goToPage = (page) => {
    if (page >= 1 && page <= totalPages) {
      setCurrentPage(page)
    }
  }

  const renderPaginationButtons = () => {
    const buttons = []
    const maxVisiblePages = 5
    
    let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2))
    let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1)
    
    if (endPage - startPage + 1 < maxVisiblePages) {
      startPage = Math.max(1, endPage - maxVisiblePages + 1)
    }
    
    // First page
    if (startPage > 1) {
      buttons.push(
        <button
          key="first"
          onClick={() => goToPage(1)}
          className="px-2 py-1 text-sm text-gray-700 hover:text-blue-600"
        >
          1
        </button>
      )
      if (startPage > 2) {
        buttons.push(<span key="ellipsis1" className="px-1 text-gray-500">...</span>)
      }
    }
    
    // Page numbers
    for (let i = startPage; i <= endPage; i++) {
      buttons.push(
        <button
          key={i}
          onClick={() => goToPage(i)}
          className={`px-3 py-1 text-sm rounded-lg ${currentPage === i 
            ? 'bg-gradient-to-r from-blue-600 to-purple-600 text-white' 
            : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
        >
          {i}
        </button>
      )
    }
    
    // Last page
    if (endPage < totalPages) {
      if (endPage < totalPages - 1) {
        buttons.push(<span key="ellipsis2" className="px-1 text-gray-500">...</span>)
      }
      buttons.push(
        <button
          key="last"
          onClick={() => goToPage(totalPages)}
          className="px-2 py-1 text-sm text-gray-700 hover:text-blue-600"
        >
          {totalPages}
        </button>
      )
    }
    
    return buttons
  }

  // Render dynamic table headers for items
  const renderDynamicHeadersForItems = (items) => {
    const headers = getDynamicHeadersFromItems(items)
    
    if (headers.length === 0) {
      return (
        <tr>
          <th colSpan={4} className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">
            No additional details available
          </th>
        </tr>
      )
    }
    
    return headers.map((header, index) => (
      <th key={index} className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">
        {formatHeaderName(header)}
      </th>
    ))
  }

  // Render dynamic table cells for items
  const renderDynamicCellsForItems = (item, headers) => {
    return headers.map((header, index) => (
      <td key={index} className="px-3 py-2 text-sm text-gray-900">
        {item[header] || 'N/A'}
      </td>
    ))
  }

  // Render dynamic values section
  const renderDynamicValues = (dynamicValues) => {
    if (!dynamicValues || Object.keys(dynamicValues).length === 0) return null
    
    const headers = getDynamicHeadersFromDynamicValues(dynamicValues)
    
    return (
      <div className="mt-4 pt-4 border-t border-gray-200">
        <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
          <Tag className="w-4 h-4 text-blue-600" /> Additional Details
        </h5>
        <div className="overflow-x-auto rounded-lg border border-gray-200">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gradient-to-r from-blue-50 to-cyan-50">
              <tr>
                {headers.map((header, index) => (
                  <th key={index} className="px-3 py-2 text-left text-xs font-bold text-blue-700 uppercase">
                    {formatHeaderName(header)}
                  </th>
                ))}
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-200 bg-white">
              <tr>
                {headers.map((header, index) => (
                  <td key={index} className="px-3 py-2 text-sm text-gray-900">
                    {dynamicValues[header] || 'N/A'}
                  </td>
                ))}
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    )
  }

  return (
    <div className="p-4">
      {/* <PageBreadcrumb pageTitle="Purchase Order" /> */}
      
      {/* Header with Stats */}
      <div className="mb-4">
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-3 mb-4">
          <div>
            <h1 className="text-xl font-bold text-gray-800 flex items-center gap-2">
              <ShoppingBag className="w-5 h-5 text-blue-600" />
              Purchase Orders
            </h1>
            <p className="text-gray-500 text-xs mt-1">Manage all purchase transactions</p>
          </div>
          
          <div className="flex flex-wrap gap-2">
            <button className="px-3 py-2 bg-green-600 text-white rounded-lg hover:bg-green-700 text-sm font-medium flex items-center gap-1.5">
              <Printer className="w-3.5 h-3.5" />
              Print
            </button>
            <button className="px-3 py-2 bg-purple-600 text-white rounded-lg hover:bg-purple-700 text-sm font-medium flex items-center gap-1.5">
              <Download className="w-3.5 h-3.5" />
              Export
            </button>
          </div>
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-4">
          <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-blue-700 font-medium">Total Orders</p>
                <p className="text-lg font-bold text-blue-900">{purchaseOrders.length}</p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <FileText className="w-4 h-4 text-blue-500" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-green-700 font-medium">Active</p>
                <p className="text-lg font-bold text-green-900">
                  {purchaseOrders.filter(o => o.status === 'active').length}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Package className="w-4 h-4 text-green-500" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-purple-700 font-medium">Vendors</p>
                <p className="text-lg font-bold text-purple-900">
                  {[...new Set(purchaseOrders.map(o => o.vendorName))].length}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Store className="w-4 h-4 text-purple-500" />
              </div>
            </div>
          </div>

          <div className="bg-gradient-to-r from-amber-50 to-amber-100 border border-amber-200 rounded-lg p-3 shadow-sm">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-xs text-amber-700 font-medium">Warehouses</p>
                <p className="text-lg font-bold text-amber-900">
                  {[...new Set(purchaseOrders.map(o => o.warehouseName))].length}
                </p>
              </div>
              <div className="p-2 bg-white rounded-lg shadow-sm">
                <Building className="w-4 h-4 text-amber-500" />
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="bg-gradient-to-r from-gray-50 to-white border border-gray-200 rounded-lg p-3 mb-4 shadow-sm">
        <div className="flex flex-col md:flex-row gap-3">
          <div className="flex-1">
            <div className="relative group">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-500" />
              <input
                type="text"
                placeholder="Search orders..."
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm shadow-sm"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <div className="flex gap-2">
            <div className="relative group">
              <Filter className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 w-3.5 h-3.5 group-focus-within:text-blue-500" />
              <select
                className="pl-10 pr-8 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500 text-sm bg-white shadow-sm"
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="deleted">Deleted</option>
              </select>
            </div>
            
            <button 
              onClick={fetchPurchaseOrders}
              className="px-3 py-2 bg-gradient-to-r from-gray-100 to-white border border-gray-300 rounded-lg hover:border-blue-300 text-sm font-medium shadow-sm"
            >
              Refresh
            </button>
          </div>
        </div>
      </div>

      {/* Loading */}
      {loading && (
        <div className="flex justify-center items-center h-48">
          <div className="relative">
            <div className="w-8 h-8 border-4 border-blue-100 rounded-full"></div>
            <div className="w-8 h-8 border-4 border-blue-500 border-t-transparent rounded-full animate-spin absolute top-0 left-0"></div>
          </div>
        </div>
      )}

      {/* Error */}
      {error && !loading && (
        <div className="bg-gradient-to-r from-red-50 to-pink-50 border border-red-200 rounded-lg p-4 mb-4 shadow-sm">
          <p className="text-red-600 text-sm font-medium">{error}</p>
          <button
            onClick={fetchPurchaseOrders}
            className="mt-2 px-3 py-1.5 bg-gradient-to-r from-red-500 to-pink-500 text-white rounded-lg hover:from-red-600 hover:to-pink-600 text-sm shadow-sm"
          >
            Retry
          </button>
        </div>
      )}

      {/* Table */}
      {!loading && !error && (
        <>
          <div className="bg-white rounded-lg border border-gray-200 overflow-hidden shadow-lg mb-4">
            <div className="overflow-x-auto">
              <table className="min-w-full divide-y divide-gray-200">
                <thead className="bg-gradient-to-r from-gray-50 to-blue-50">
                  <tr>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Calendar className="w-3.5 h-3.5 text-blue-600" /> Date
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <FileText className="w-3.5 h-3.5 text-purple-600" /> Bill No
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <User className="w-3.5 h-3.5 text-green-600" /> Vendor
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <Building className="w-3.5 h-3.5 text-amber-600" /> Warehouse
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <ShoppingBag className="w-3.5 h-3.5 text-blue-600" /> Products
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      <div className="flex items-center gap-1">
                        <IndianRupee className="w-3.5 h-3.5 text-emerald-600" /> Total
                      </div>
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Status
                    </th>
                    <th className="px-4 py-3 text-left text-xs font-bold text-gray-700 uppercase tracking-wider">
                      Actions
                    </th>
                  </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                  {currentOrders.map((order) => {
                    const orderTotal = calculateOrderTotal(order)
                    return (
                      <React.Fragment key={order.id}>
                        {/* Clickable Main Row */}
                        <tr 
                          className={`hover:bg-gradient-to-r hover:from-blue-50 hover:to-blue-100 transition-all duration-200 cursor-pointer ${
                            expandedRows[order.id] ? 'bg-gradient-to-r from-blue-50 to-blue-100' : ''
                          }`}
                          onClick={(e) => handleRowClick(order.id, e)}
                        >
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {formatDate(order.purchaseDate)}
                                </div>
                               
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <span className={`text-sm font-bold ${expandedRows[order.id] ? 'text-purple-700' : 'text-blue-700'} bg-gradient-to-r from-purple-50 to-blue-50 px-3 py-1.5 rounded-lg border ${expandedRows[order.id] ? 'border-purple-200' : 'border-blue-200'}`}>
                                {order.billNo}
                              </span>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-bold text-gray-900">{order.vendorName}</div>
                                <div className="text-xs text-gray-500">ID: {order.vendorId}</div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-gray-900">{order.warehouseName}</div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div>
                                <div className="text-sm font-bold text-gray-900">
                                  {order.totalProducts} items
                                </div>
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-2">
                              <div className="text-sm font-bold text-emerald-700">
                                ₹{orderTotal.total.toFixed(2)}
                              </div>
                            </div>
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            {getStatusBadge(order.status)}
                          </td>
                          <td className="px-4 py-3 whitespace-nowrap">
                            <div className="flex items-center gap-1">
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  handleViewOrder(order)
                                }}
                                className="p-2 hover:bg-gradient-to-r hover:from-blue-100 hover:to-blue-200 rounded-lg text-blue-600 transition-all"
                                title="View Full Details"
                              >
                                <ExternalLink className="w-3.5 h-3.5" />
                              </button>
                              <button
                                onClick={(e) => {
                                  e.stopPropagation()
                                  toggleRowExpand(order.id)
                                }}
                                className={`p-2 rounded-lg transition-all ${
                                  expandedRows[order.id] 
                                    ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white' 
                                    : 'hover:bg-gradient-to-r hover:from-purple-100 hover:to-pink-100 text-purple-600'
                                }`}
                                title={expandedRows[order.id] ? "Collapse" : "Expand"}
                              >
                                {expandedRows[order.id] ? (
                                  <ChevronUp className="w-3.5 h-3.5" />
                                ) : (
                                  <ChevronDown className="w-3.5 h-3.5" />
                                )}
                              </button>
                              <button 
                                onClick={(e) => e.stopPropagation()}
                                className="p-2 hover:bg-gradient-to-r hover:from-gray-100 hover:to-gray-200 rounded-lg text-gray-600 transition-all"
                              >
                                <MoreVertical className="w-3.5 h-3.5" />
                              </button>
                            </div>
                          </td>
                        </tr>
                        
                        {/* Expanded Row - Different Design with Smooth Animation */}
                        {expandedRows[order.id] && (
                          <tr 
                            className={`transition-all duration-300 ease-in-out bg-gradient-to-r from-blue-50/30 to-purple-50/30 overflow-hidden`}
                            style={{
                              opacity: expandedRows[order.id] ? 1 : 0,
                              transform: expandedRows[order.id] ? 'scaleY(1)' : 'scaleY(0)',
                              transformOrigin: 'top'
                            }}
                          >
                            <td colSpan="8" className="px-4 py-0">
                              <div 
                                className={`animate-[slideDown_0.3s_ease-in-out] bg-gradient-to-r from-white to-gray-50 rounded-xl border-2 border-blue-200 shadow-lg p-4 m-2`}
                              >
                                <div className="flex items-center justify-between mb-4">
                                  <div className="flex items-center gap-2">
                                    <div className="p-2 bg-gradient-to-r from-blue-600 to-purple-600 rounded-lg">
                                      <Package className="w-4 h-4 text-white" />
                                    </div>
                                    <h4 className="font-bold text-gray-900 text-sm">
                                      Products Details • Bill No: <span className="text-blue-700">{order.billNo}</span>
                                    </h4>
                                  </div>
                                  <button
                                    onClick={() => toggleRowExpand(order.id)}
                                    className="text-xs text-gray-500 hover:text-gray-700 flex items-center gap-1"
                                  >
                                    <ChevronUp className="w-3 h-3" /> Collapse
                                  </button>
                                </div>
                                
                                {/* Compact Table View for Products */}
                                <div className="overflow-x-auto rounded-lg border border-gray-200 shadow-inner">
                                  <table className="min-w-full divide-y divide-gray-200">
                                    <thead className="bg-gradient-to-r from-gray-50 to-gray-100">
                                      <tr>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Item Name</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Type</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Qty</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Rate</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">GST</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">GST Amt</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">Total</th>
                                        <th className="px-3 py-2 text-left text-xs font-bold text-gray-700 uppercase">
                                          <Info className="w-3 h-3 inline mr-1" /> Info
                                        </th>
                                      </tr>
                                    </thead>
                                    <tbody className="divide-y divide-gray-200 bg-white">
                                      {order.products?.map((product, index) => {
                                        const productTotal = calculateProductTotal(product)
                                        const dynamicHeaders = getDynamicHeadersFromItems(product.items)
                                        const dynamicValueHeaders = getDynamicHeadersFromDynamicValues(product.dynamicValues)
                                        
                                        return (
                                          <tr key={index} className="hover:bg-gradient-to-r hover:from-blue-50 hover:to-purple-50 transition-colors">
                                            <td className="px-3 py-2">
                                              <div className="flex items-center gap-2">
                                                <div className={`p-1.5 rounded ${product.identifierType === 'UNIQUE' ? 'bg-purple-100' : 'bg-blue-100'}`}>
                                                  <ShoppingBag className={`w-3 h-3 ${product.identifierType === 'UNIQUE' ? 'text-purple-600' : 'text-blue-600'}`} />
                                                </div>
                                                <div>
                                                  <div className="text-sm font-medium text-gray-900">{product.productName}</div>
                                                  <div className="text-xs text-gray-500">ID: {product.productId}</div>
                                                </div>
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <span className={`px-2 py-0.5 text-xs rounded-full font-medium ${product.identifierType === 'UNIQUE' 
                                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200' 
                                                : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'}`}>
                                                {product.identifierType}
                                              </span>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-sm font-bold text-blue-700 bg-blue-50 px-2 py-1 rounded-lg">
                                                {product.quantity}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-sm font-medium text-gray-900">₹{product.rate?.toFixed(2)}</div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-sm font-bold text-green-700 bg-green-50 px-2 py-1 rounded-lg">
                                                {product.gst}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-sm font-bold text-amber-700 bg-amber-50 px-2 py-1 rounded-lg">
                                                ₹{productTotal.gstAmount.toFixed(2)}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              <div className="text-sm font-bold text-emerald-700 bg-emerald-50 px-2 py-1 rounded-lg">
                                                ₹{productTotal.total.toFixed(2)}
                                              </div>
                                            </td>
                                            <td className="px-3 py-2">
                                              {(dynamicHeaders.length > 0 || dynamicValueHeaders.length > 0) ? (
                                                <button 
                                                  className="text-xs text-blue-600 hover:text-blue-800 font-medium flex items-center gap-1"
                                                  onClick={(e) => {
                                                    e.stopPropagation()
                                                    setSelectedOrder(order)
                                                    setIsViewDialogOpen(true)
                                                  }}
                                                >
                                                  <Eye className="w-3 h-3" /> View
                                                </button>
                                              ) : (
                                                <span className="text-xs text-gray-500">-</span>
                                              )}
                                            </td>
                                          </tr>
                                        )
                                      })}
                                    </tbody>
                                    <tfoot className="bg-gradient-to-r from-gray-50 to-gray-100">
                                      <tr>
                                        <td colSpan="6" className="px-3 py-2 text-right text-sm font-bold text-gray-900">
                                          Order Total:
                                        </td>
                                        <td colSpan="2" className="px-3 py-2">
                                          <div className="text-sm font-bold text-emerald-700 bg-emerald-100 px-3 py-1.5 rounded-lg border border-emerald-200">
                                            ₹{calculateOrderTotal(order).total.toFixed(2)}
                                          </div>
                                        </td>
                                      </tr>
                                    </tfoot>
                                  </table>
                                </div>
                              </div>
                            </td>
                          </tr>
                        )}
                      </React.Fragment>
                    )
                  })}
                </tbody>
              </table>

              {filteredOrders.length === 0 && !loading && (
                <div className="text-center py-12 bg-gradient-to-r from-gray-50 to-blue-50">
                  <div className="w-16 h-16 bg-gradient-to-r from-gray-200 to-gray-300 rounded-full flex items-center justify-center mx-auto mb-3">
                    <Search className="w-8 h-8 text-gray-400" />
                  </div>
                  <p className="text-gray-600 font-medium">No orders found</p>
                  <p className="text-gray-500 text-sm mt-1">Try changing your search or filter criteria</p>
                </div>
              )}
            </div>
          </div>

          {/* Pagination */}
          {filteredOrders.length > 0 && (
            <div className="flex flex-col md:flex-row items-center justify-between gap-4 bg-white rounded-lg border border-gray-200 p-4 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="flex items-center gap-2">
                  <span className="text-sm text-gray-600">Show</span>
                  <select
                    className="border border-gray-300 rounded-lg px-2 py-1 text-sm"
                    value={itemsPerPage}
                    onChange={(e) => setItemsPerPage(Number(e.target.value))}
                  >
                    <option value={5}>5</option>
                    <option value={10}>10</option>
                    <option value={20}>20</option>
                    <option value={50}>50</option>
                  </select>
                  <span className="text-sm text-gray-600">entries</span>
                </div>
                <div className="text-sm text-gray-600">
                  Showing {startIndex + 1} to {Math.min(endIndex, filteredOrders.length)} of {filteredOrders.length} entries
                </div>
              </div>
              
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                >
                  <ChevronsLeft className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(currentPage - 1)}
                  disabled={currentPage === 1}
                  className={`p-2 rounded-lg ${currentPage === 1 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
                
                <div className="flex items-center gap-1 mx-2">
                  {renderPaginationButtons()}
                </div>
                
                <button
                  onClick={() => goToPage(currentPage + 1)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                >
                  <ChevronRight className="w-4 h-4" />
                </button>
                <button
                  onClick={() => goToPage(totalPages)}
                  disabled={currentPage === totalPages}
                  className={`p-2 rounded-lg ${currentPage === totalPages 
                    ? 'text-gray-400 cursor-not-allowed' 
                    : 'text-gray-700 hover:text-blue-600 hover:bg-gray-100'}`}
                >
                  <ChevronsRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          )}
        </>
      )}

      {/* View Modal */}
      {isViewDialogOpen && selectedOrder && (
        <div className="fixed inset-0 bg-black/50 backdrop-blur-sm flex items-center justify-center p-4 z-50 animate-fadeIn">
          <div className="bg-gradient-to-br from-white to-gray-50 rounded-2xl shadow-2xl w-full max-w-6xl max-h-[90vh] overflow-hidden animate-slideUp border-2 border-blue-200">
            {/* Header */}
            <div className=" p-4">
              <div className="flex justify-between items-center">
                <div className="flex items-center gap-3">
                  <div className="p-2 bg-white/20 rounded-lg">
                    <FileText className="w-5 h-5 " />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold ">Order Details</h2>
                    <div className="flex items-center gap-3 mt-1">
                      <span className="text-sm">Bill No: {selectedOrder.billNo}</span>
                      {getStatusBadge(selectedOrder.status)}
                    </div>
                  </div>
                </div>
                <button
                  onClick={() => setIsViewDialogOpen(false)}
                  className="p-2 hover:bg-white/20 rounded-xl transition-colors"
                >
                  <span className="text-xl  font-bold">×</span>
                </button>
              </div>
            </div>

            {/* Content */}
            <div className="p-4 overflow-y-auto max-h-[70vh]">
              {/* Order Info */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-3 mb-6">
                <div className="bg-gradient-to-r from-blue-50 to-blue-100 border border-blue-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-blue-500 to-blue-600 rounded-lg">
                      <User className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-blue-700 font-medium">Vendor</p>
                      <p className="font-bold text-gray-900 text-sm">{selectedOrder.vendorName}</p>
                      <p className="text-xs text-gray-500">ID: {selectedOrder.vendorId}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-green-50 to-green-100 border border-green-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-green-500 to-green-600 rounded-lg">
                      <Building className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-green-700 font-medium">Warehouse</p>
                      <p className="font-bold text-gray-900 text-sm">{selectedOrder.warehouseName}</p>
                      <p className="text-xs text-gray-500">ID: {selectedOrder.warehouseId}</p>
                    </div>
                  </div>
                </div>

                <div className="bg-gradient-to-r from-purple-50 to-purple-100 border border-purple-200 rounded-xl p-3 shadow-sm">
                  <div className="flex items-center gap-3">
                    <div className="p-2 bg-gradient-to-r from-purple-500 to-purple-600 rounded-lg">
                      <Calendar className="w-4 h-4 text-white" />
                    </div>
                    <div>
                      <p className="text-xs text-purple-700 font-medium">Date</p>
                      <p className="font-bold text-gray-900 text-sm">{formatDate(selectedOrder.purchaseDate)}</p>
                    </div>
                  </div>
                </div>
              </div>

              {/* Products */}
              <div className="space-y-6">
                {selectedOrder.products?.map((product, index) => {
                  const productTotal = calculateProductTotal(product)
                  const dynamicHeaders = getDynamicHeadersFromItems(product.items)
                  const dynamicValueHeaders = getDynamicHeadersFromDynamicValues(product.dynamicValues)
                  
                  return (
                    <div key={index} className="bg-gradient-to-r from-white to-gray-50 border-2 border-gray-200 rounded-xl p-4 hover:border-blue-300 transition-all shadow-sm">
                      <div className="flex justify-between items-start mb-4">
                        <div className="flex items-center gap-3">
                          <div className={`p-3 rounded-lg ${product.identifierType === 'UNIQUE' ? 'bg-gradient-to-r from-purple-100 to-pink-100' : 'bg-gradient-to-r from-blue-100 to-cyan-100'}`}>
                            <ShoppingBag className={`w-5 h-5 ${product.identifierType === 'UNIQUE' ? 'text-purple-600' : 'text-blue-600'}`} />
                          </div>
                          <div>
                            <h4 className="font-bold text-gray-900">{product.productName}</h4>
                            <div className="flex items-center gap-3 mt-1">
                              <span className={`px-3 py-1 text-xs rounded-full font-medium ${product.identifierType === 'UNIQUE' 
                                ? 'bg-gradient-to-r from-purple-100 to-pink-100 text-purple-700 border border-purple-200' 
                                : 'bg-gradient-to-r from-blue-100 to-cyan-100 text-blue-700 border border-blue-200'}`}>
                                {product.identifierType}
                              </span>
                              <span className="text-xs text-gray-500">ID: {product.productId}</span>
                            </div>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-xs text-gray-500">Quantity</p>
                          <p className="text-2xl font-bold text-blue-700">{product.quantity}</p>
                        </div>
                      </div>

                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Rate per unit</p>
                          <p className="text-lg font-bold text-gray-900">₹{product.rate?.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">GST Percentage</p>
                          <p className="text-lg font-bold text-green-700">{product.gst}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">GST Amount</p>
                          <p className="text-lg font-bold text-amber-700">₹{productTotal.gstAmount.toFixed(2)}</p>
                        </div>
                        <div className="bg-white p-3 rounded-lg border border-gray-200 shadow-sm">
                          <p className="text-xs text-gray-500 mb-1">Total</p>
                          <p className="text-lg font-bold text-emerald-700">₹{productTotal.total.toFixed(2)}</p>
                        </div>
                      </div>

                      {/* Dynamic Items Table (for UNIQUE items) */}
                      {product.identifierType === 'UNIQUE' && product.items?.length > 0 && (
                        <div className="mt-4 pt-4 border-t border-gray-200">
                          <h5 className="text-sm font-bold text-gray-900 mb-3 flex items-center gap-2">
                            <Tag className="w-4 h-4 text-purple-600" /> Serial Items ({product.items.length})
                          </h5>
                          <div className="overflow-x-auto rounded-lg border border-gray-200">
                            <table className="min-w-full divide-y divide-gray-200">
                              <thead className="bg-gradient-to-r from-purple-50 to-pink-50">
                                {dynamicHeaders.length > 0 ? (
                                  <tr>
                                    <th className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">S.No</th>
                                    {dynamicHeaders.map((header, idx) => (
                                      <th key={idx} className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">
                                        {formatHeaderName(header)}
                                      </th>
                                    ))}
                                  </tr>
                                ) : (
                                  <tr>
                                    <th colSpan={5} className="px-3 py-2 text-left text-xs font-bold text-purple-700 uppercase">
                                      No serial item details available
                                    </th>
                                  </tr>
                                )}
                              </thead>
                              <tbody className="divide-y divide-gray-200 bg-white">
                                {product.items.map((item, idx) => (
                                  <tr key={idx} className="hover:bg-purple-50/50">
                                    <td className="px-3 py-2 text-sm text-gray-900 text-center">{idx + 1}</td>
                                    {dynamicHeaders.map((header, cellIdx) => (
                                      <td key={cellIdx} className="px-3 py-2 text-sm text-gray-900">
                                        {item[header] || 'N/A'}
                                      </td>
                                    ))}
                                  </tr>
                                ))}
                              </tbody>
                            </table>
                          </div>
                        </div>
                      )}

                      {/* Dynamic Values Table (for NON_UNIQUE items) */}
                      {renderDynamicValues(product.dynamicValues)}
                    </div>
                  )
                })}
              </div>
            </div>

            {/* Footer */}
            <div className="border-t-2 border-gray-200 p-4 bg-gradient-to-r from-gray-50 to-blue-50">
              <div className="flex flex-col md:flex-row justify-between items-center gap-4">
                <div className="text-center md:text-left">
                  <p className="text-xs text-gray-500">Order Summary</p>
                  <div className="flex items-center gap-4 mt-1">
                    <div>
                      <p className="text-sm text-gray-600">Subtotal: <span className="font-bold">₹{calculateOrderTotal(selectedOrder).subtotal.toFixed(2)}</span></p>
                      <p className="text-sm text-gray-600">GST Total: <span className="font-bold">₹{calculateOrderTotal(selectedOrder).gstTotal.toFixed(2)}</span></p>
                    </div>
                  </div>
                </div>
                <div className="text-center md:text-right">
                  <p className="text-xs text-gray-500">Final Amount</p>
                  <p className="text-2xl font-bold text-emerald-700">
                    ₹{calculateOrderTotal(selectedOrder).total.toFixed(2)}
                  </p>
                </div>
                <div className="flex gap-2">
                  <button
                    onClick={() => setIsViewDialogOpen(false)}
                    className="px-4 py-2 bg-gradient-to-r from-gray-100 to-white border-2 border-gray-300 text-gray-700 rounded-xl hover:border-blue-300 font-medium shadow-sm"
                  >
                    Close
                  </button>
                  <button className="px-4 py-2 bg-gradient-to-r from-blue-600 to-purple-600 text-white rounded-xl hover:from-blue-700 hover:to-purple-700 font-medium shadow-md flex items-center gap-2">
                    <Printer className="w-4 h-4" />
                    Print
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeIn {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        @keyframes slideUp {
          from { transform: translateY(20px); opacity: 0; }
          to { transform: translateY(0); opacity: 1; }
        }
        @keyframes slideDown {
          from { 
            transform: translateY(-20px); 
            opacity: 0; 
            max-height: 0;
          }
          to { 
            transform: translateY(0); 
            opacity: 1;
            max-height: 1000px;
          }
        }
        .animate-fadeIn {
          animation: fadeIn 0.2s ease-out;
        }
        .animate-slideUp {
          animation: slideUp 0.3s ease-out;
        }
        .animate-\[slideDown_0\.3s_ease-in-out\] {
          animation: slideDown 0.3s ease-in-out;
        }
      `}</style>
    </div>
  )
}

export default StockPurchase