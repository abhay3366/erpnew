// app/get-users/page.jsx
'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

// Eye SVG Icon component
const EyeIcon = ({ className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M15 12a3 3 0 11-6 0 3 3 0 016 0z"
        />
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z"
        />
    </svg>
);

// Edit SVG Icon component
const EditIcon = ({ className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z"
        />
    </svg>
);

// Search Icon component
const SearchIcon = ({ className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z"
        />
    </svg>
);

// Plus Icon for Add Vendor
const PlusIcon = ({ className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M12 4v16m8-8H4"
        />
    </svg>
);

// Chevron Icons for Pagination
const ChevronLeftIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
    </svg>
);

const ChevronRightIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
    </svg>
);

// Filter Icon
const FilterIcon = ({ className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M3 4a1 1 0 011-1h16a1 1 0 011 1v2.586a1 1 0 01-.293.707l-6.414 6.414a1 1 0 00-.293.707V17l-4 4v-6.586a1 1 0 00-.293-.707L3.293 7.207A1 1 0 013 6.5V4z"
        />
    </svg>
);

// Sort Icon
const SortIcon = ({ className = "" }) => (
    <svg
        className={className}
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
        xmlns="http://www.w3.org/2000/svg"
    >
        <path
            strokeLinecap="round"
            strokeLinejoin="round"
            strokeWidth={2}
            d="M7 16V4m0 0L3 8m4-4l4 4m6 0v12m0 0l4-4m-4 4l-4-4"
        />
    </svg>
);

export default function VendorTable({ onCreateVendor, onEditVendor, onViewDetails }) {
    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest');
    const router = useRouter();

    // Pagination state
    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fetch data from your API - UPDATED FOR NEW STRUCTURE
    const fetchVendors = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:5001/vendors');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            // Process vendors with new field structure
            const vendorsData = (Array.isArray(data) ? data : data.vendors || data.data || [])
                .map(vendor => ({
                    ...vendor,
                    // Ensure all required fields are present
                    vendor_name: vendor.vendor_name || vendor.name || '',
                    vendor_phone: vendor.vendor_phone || vendor.number || '',
                    vendor_address: vendor.vendor_address || vendor.address || '',
                    contact_person: vendor.contact_person || vendor.contactPerson || '',
                    gstin_no: vendor.gstin_no || vendor.gstNo || '',
                    bank_name: vendor.bank_name || vendor.bankName || '',
                    account_no: vendor.account_no || vendor.bankAccountNumber || '',
                    blacklisted: vendor.blacklisted || false,
                    // ✅ AUTOMATIC STATUS: If blacklisted, status becomes inactive automatically
                    status: vendor.blacklisted ? 'inactive' : (vendor.status || 'active'),
                    createdAt: vendor.createdAt || new Date().toLocaleDateString('en-GB'),
                    lastUpdated: vendor.lastUpdated || vendor.createdAt || new Date().toLocaleDateString('en-GB')
                }))
                // Sort by newest first by default
                .sort((a, b) => {
                    const dateA = parseDate(a.createdAt);
                    const dateB = parseDate(b.createdAt);
                    return dateB - dateA; // Newest first
                });

            setVendors(vendorsData);
            setFilteredVendors(vendorsData);

        } catch (error) {
            console.error('Error fetching vendors:', error);
            setError('Failed to load vendors. Please check if the server is running.');

            // Fallback to empty array on error
            setVendors([]);
            setFilteredVendors([]);
        } finally {
            setLoading(false);
        }
    };

    // Helper function to parse date strings
    const parseDate = (dateString) => {
        if (!dateString) return new Date(0);

        // Handle DD-MM-YYYY format
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }

        return new Date(dateString) || new Date();
    };

    // Initial data fetch
    useEffect(() => {
        fetchVendors();
    }, []);

    // Sort vendors based on selected sort option
    const sortVendors = (vendorsList) => {
        const sortedVendors = [...vendorsList];

        switch (sortBy) {
            case 'newest':
                return sortedVendors.sort((a, b) => {
                    const dateA = parseDate(a.createdAt || a.lastUpdated);
                    const dateB = parseDate(b.createdAt || b.lastUpdated);
                    return dateB - dateA;
                });

            case 'oldest':
                return sortedVendors.sort((a, b) => {
                    const dateA = parseDate(a.createdAt || a.lastUpdated);
                    const dateB = parseDate(b.createdAt || b.lastUpdated);
                    return dateA - dateB;
                });

            case 'name':
                return sortedVendors.sort((a, b) =>
                    (a.vendor_name || '').localeCompare(b.vendor_name || '')
                );

            case 'recentlyUpdated':
                return sortedVendors.sort((a, b) => {
                    const dateA = parseDate(a.lastUpdated || a.createdAt);
                    const dateB = parseDate(b.lastUpdated || b.createdAt);
                    return dateB - dateA;
                });

            default:
                return sortedVendors;
        }
    };

    // Filter vendors based on search, status and sort - UPDATED FOR NEW FIELDS
    useEffect(() => {
        let filtered = vendors;

        // Apply search filter with new field names
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(vendor =>
                vendor.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.vendor_phone?.includes(searchQuery) ||
                vendor.gstin_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.vendor_address?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.contact_person?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.pan_no?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.bank_name?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Apply status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(vendor => vendor.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        // Apply sorting
        filtered = sortVendors(filtered);

        setFilteredVendors(filtered);
        setCurrentPage(1);
    }, [searchQuery, statusFilter, vendors, sortBy]);

    // Handle search input change
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Handle status filter change
    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    // Handle sort change
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    // Clear all filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setSortBy('newest');
    };

    // Handle Add Vendor - redirect to add vendor page
    const handleAddVendor = () => {
        onCreateVendor();
    };

    // Handle View Vendor with Query Parameters
    const handleView = (vendor) => {
        onViewDetails(vendor);
    };

    // Handle Edit Vendor
    const handleEdit = (vendor) => {
        onEditVendor(vendor);
    };

    // Refresh data when returning from edit/add pages
    useEffect(() => {
        const handleFocus = () => {
            fetchVendors();
        };

        window.addEventListener('focus', handleFocus);
        return () => {
            window.removeEventListener('focus', handleFocus);
        };
    }, []);

    // Calculate pagination values
    const totalItems = filteredVendors.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVendors = filteredVendors.slice(startIndex, endIndex);

    // Pagination handlers
    const goToPage = (page) => {
        setCurrentPage(Math.max(1, Math.min(page, totalPages)));
    };

    const goToNextPage = () => {
        if (currentPage < totalPages) {
            setCurrentPage(currentPage + 1);
        }
    };

    const goToPrevPage = () => {
        if (currentPage > 1) {
            setCurrentPage(currentPage - 1);
        }
    };

    // ✅ Get row background color based on blacklisted status
    const getRowBackgroundColor = (vendor) => {
        if (vendor.blacklisted) {
            return 'bg-red-50 hover:bg-red-100 border-l-4 border-l-red-500';
        }
        return 'hover:bg-gray-50 transition-colors';
    };

    // ✅ Get status color with automatic inactive for blacklisted vendors
    const getStatusColor = (vendor) => {
        // If vendor is blacklisted, always show inactive status
        if (vendor.blacklisted) {
            return 'bg-red-100 text-red-800 border border-red-200';
        }
        
        switch (vendor.status?.toLowerCase()) {
            case 'active':
                return 'bg-green-100 text-green-800 border border-green-200';
            case 'inactive':
                return 'bg-red-100 text-red-800 border border-red-200';
            default:
                return 'bg-gray-100 text-gray-800 border border-gray-200';
        }
    };

    // ✅ Get status text with automatic inactive for blacklisted vendors
    const getStatusText = (vendor) => {
        // If vendor is blacklisted, always show inactive
        if (vendor.blacklisted) {
            return 'Inactive (Blacklisted)';
        }
        return vendor.status || 'Unknown';
    };

    // ✅ Get blacklisted display text with color
    const getBlacklistedDisplay = (blacklisted) => {
        if (blacklisted) {
            return <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded text-xs font-medium">Yes</span>;
        } else {
            return <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded text-xs font-medium">No</span>;
        }
    };

    // Generate page numbers for pagination
    const getPageNumbers = () => {
        const pages = [];
        const maxVisiblePages = 5;

        let startPage = Math.max(1, currentPage - Math.floor(maxVisiblePages / 2));
        let endPage = Math.min(totalPages, startPage + maxVisiblePages - 1);

        if (endPage - startPage + 1 < maxVisiblePages) {
            startPage = Math.max(1, endPage - maxVisiblePages + 1);
        }

        for (let i = startPage; i <= endPage; i++) {
            pages.push(i);
        }

        return pages;
    };

    if (loading) {
        return (
            <div className="min-h-screen bg-gray-50 py-8">
                <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                    <div className="flex justify-center items-center h-64">
                        <div className="text-center">
                            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                            <p className="mt-3 text-gray-600">Loading vendors...</p>
                        </div>
                    </div>
                </div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-3">
                <div className="mb-8 flex justify-between items-center px-3">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
                        <p className="mt-2 text-sm text-gray-600">
                            Manage your vendors and their information
                        </p>
                    </div>
                    <button
                        onClick={handleAddVendor}
                        className="inline-flex cursor-pointer items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Vendor
                    </button>
                </div>

                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    {/* Search, Filter and Sort Bar */}
                    <div className="px-6 py-4 border-b border-gray-200 bg-gray-50">
                        <div className="flex flex-col lg:flex-row gap-4">
                            {/* Search Input */}
                            <div className="flex-1 relative">
                                <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                    <SearchIcon className="h-5 w-5 text-gray-400" />
                                </div>
                                <input
                                    type="text"
                                    value={searchQuery}
                                    onChange={handleSearchChange}
                                    placeholder="Search vendors by name, email, phone, GST number..."
                                    className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                />
                            </div>

                            {/* Filters and Sort */}
                            <div className="flex gap-4">
                                {/* Status Filter */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <FilterIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        value={statusFilter}
                                        onChange={handleStatusFilterChange}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="all">All Status</option>
                                        <option value="active">Active</option>
                                        <option value="inactive">Inactive</option>
                                    </select>
                                </div>

                                {/* Sort Options */}
                                <div className="relative">
                                    <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                        <SortIcon className="h-5 w-5 text-gray-400" />
                                    </div>
                                    <select
                                        value={sortBy}
                                        onChange={handleSortChange}
                                        className="pl-10 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                                    >
                                        <option value="newest">Newest First</option>
                                        <option value="recentlyUpdated">Recently Updated</option>
                                        <option value="oldest">Oldest First</option>
                                        <option value="name">Name A-Z</option>
                                    </select>
                                </div>

                                {/* Clear Filters Button */}
                                {(searchQuery || statusFilter !== 'all' || sortBy !== 'newest') && (
                                    <button
                                        type="button"
                                        onClick={handleClearFilters}
                                        className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
                                    >
                                        Clear All
                                    </button>
                                )}
                            </div>
                        </div>

                        {/* Filter Summary */}
                        {(searchQuery || statusFilter !== 'all' || sortBy !== 'newest') && (
                            <div className="mt-2 text-sm text-blue-600">
                                Found {filteredVendors.length} vendors
                                {searchQuery && ` matching "${searchQuery}"`}
                                {statusFilter !== 'all' && ` with status "${statusFilter}"`}
                                {sortBy !== 'newest' && ` sorted by ${sortBy.replace(/([A-Z])/g, ' $1').toLowerCase()}`}
                            </div>
                        )}
                    </div>

                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        S.No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Vendor Name
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Email
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Phone Number
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        GSTIN No
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Blacklisted
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Status
                                    </th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                                        Action
                                    </th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            <svg className="mx-auto h-12 w-12 text-gray-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                            </svg>
                                            <p className="mt-2">
                                                {searchQuery || statusFilter !== 'all'
                                                    ? 'No vendors found matching your filters.'
                                                    : 'No vendors found.'
                                                }
                                            </p>
                                            {(searchQuery || statusFilter !== 'all') && (
                                                <button
                                                    onClick={handleClearFilters}
                                                    className="mt-2 text-blue-600 hover:text-blue-800"
                                                >
                                                    Clear filters and show all vendors
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ) : (
                                    currentVendors.map((vendor, index) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50 transition-colors">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900 font-medium">
                                                {startIndex + index + 1}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <span className={vendor.blacklisted ? 'text-red-800 font-bold' : 'text-gray-900'}>
                                                    {vendor.vendor_name || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {vendor.email ? (
                                                    <a href={`mailto:${vendor.email}`} className="text-blue-600 hover:text-blue-900 underline">
                                                        {vendor.email}
                                                    </a>
                                                ) : (
                                                    <span className={vendor.blacklisted ? 'text-red-700' : 'text-gray-900'}>
                                                        N/A
                                                    </span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={vendor.blacklisted ? 'text-red-700' : 'text-gray-900'}>
                                                    {vendor.vendor_phone || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                <span className={vendor.blacklisted ? 'text-red-700' : 'text-gray-900'}>
                                                    {vendor.gstin_no || 'N/A'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                {getBlacklistedDisplay(vendor.blacklisted)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor.status)}`}>
                                                    {vendor.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleEdit(vendor)}
                                                        className={`transition-colors transform hover:scale-110 ${
                                                            vendor.blacklisted ? 'text-red-600 hover:text-red-900' : 'text-blue-600 hover:text-blue-900'
                                                        }`}
                                                        title="Edit"
                                                    >
                                                        <EditIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleView(vendor)}
                                                        className={`transition-colors transform hover:scale-110 ${
                                                            vendor.blacklisted ? 'text-red-600 hover:text-red-900' : 'text-gray-600 hover:text-gray-900'
                                                        }`}
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    )
                                ))}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredVendors.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{startIndex + 1}</span> to <span className="font-medium">
                                        {Math.min(endIndex, totalItems)}
                                    </span> of <span className="font-medium">{totalItems}</span> vendors
                                    {(searchQuery || statusFilter !== 'all' || sortBy !== 'newest') && (
                                        <span className="ml-2 text-blue-600">(filtered)</span>
                                    )}
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-md ${currentPage === 1
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                            }`}
                                    >
                                        <ChevronLeftIcon className="w-5 h-5" />
                                    </button>

                                    {/* Page Numbers */}
                                    {getPageNumbers().map((page) => (
                                        <button
                                            key={page}
                                            onClick={() => goToPage(page)}
                                            className={`px-3 py-1 text-sm rounded-md ${currentPage === page
                                                ? 'bg-blue-600 text-white'
                                                : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                                }`}
                                        >
                                            {page}
                                        </button>
                                    ))}

                                    {/* Next Button */}
                                    <button
                                        onClick={goToNextPage}
                                        disabled={currentPage === totalPages}
                                        className={`p-2 rounded-md ${currentPage === totalPages
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-200 hover:text-gray-800'
                                            }`}
                                    >
                                        <ChevronRightIcon className="w-5 h-5" />
                                    </button>
                                </div>
                            </div>
                        </div>
                    )}
                </div>
            </div>
        </div>
    );
}