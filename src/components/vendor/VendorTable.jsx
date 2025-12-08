// app/get-users/page.jsx
'use client';

import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from '@headlessui/react';
import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import VendorForm from './VendorForm';

// SVG Icons
const EyeIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M2.458 12C3.732 7.943 7.523 5 12 5c4.478 0 8.268 2.943 9.542 7-1.274 4.057-5.064 7-9.542 7-4.477 0-8.268-2.943-9.542-7z" />
    </svg>
);

const EditIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
    </svg>
);

const SearchIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const PlusIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
    </svg>
);

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

export default function VendorTable({ onViewDetails }) {
    const [vendors, setVendors] = useState([]);
    const [filteredVendors, setFilteredVendors] = useState([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState(null);
    const [searchQuery, setSearchQuery] = useState('');
    const [statusFilter, setStatusFilter] = useState('all');
    const [sortBy, setSortBy] = useState('newest'); // Date sort filter added

    // Modal states
    const [addModalOpen, setAddModalOpen] = useState(false);
    const [editModalOpen, setEditModalOpen] = useState(false);
    const [viewModalOpen, setViewModalOpen] = useState(false);
    const [selectedVendor, setSelectedVendor] = useState(null);

    const [currentPage, setCurrentPage] = useState(1);
    const [itemsPerPage] = useState(10);

    // Fetch vendors
    const fetchVendors = async () => {
        try {
            setLoading(true);
            setError(null);

            const response = await fetch('http://localhost:5001/vendors');

            if (!response.ok) {
                throw new Error(`HTTP error! status: ${response.status}`);
            }

            const data = await response.json();

            const vendorsData = (Array.isArray(data) ? data : data.vendors || data.data || [])
                .map(vendor => ({
                    ...vendor,
                    vendor_name: vendor.vendor_name || vendor.name || '',
                    vendor_phone: vendor.vendor_phone || vendor.number || '',
                    vendor_address: vendor.vendor_address || vendor.address || '',
                    contact_person: vendor.contact_person || vendor.contactPerson || '',
                    gstin_no: vendor.gstin_no || vendor.gstNo || '',
                    bank_name: vendor.bank_name || vendor.bankName || '',
                    account_no: vendor.account_no || vendor.bankAccountNumber || '',
                    blacklisted: vendor.blacklisted || false,
                    status: vendor.blacklisted ? 'inactive' : (vendor.status || 'active'),
                    createdAt: vendor.createdAt || new Date().toLocaleDateString('en-GB'),
                    lastUpdated: vendor.lastUpdated || vendor.createdAt || new Date().toLocaleDateString('en-GB')
                }));

            setVendors(vendorsData);
            setFilteredVendors(sortVendors(vendorsData, sortBy));

        } catch (error) {
            console.error('Error fetching vendors:', error);
            setError('Failed to load vendors. Please check if the server is running.');
            setVendors([]);
            setFilteredVendors([]);
        } finally {
            setLoading(false);
        }
    };

    // Parse date strings to Date objects
    const parseDate = (dateString) => {
        if (!dateString) return new Date(0);

        // Handle ISO date strings
        if (dateString.includes('T')) {
            return new Date(dateString);
        }

        // Handle DD-MM-YYYY format
        if (dateString.includes('-')) {
            const parts = dateString.split('-');
            if (parts.length === 3) {
                return new Date(parts[2], parts[1] - 1, parts[0]);
            }
        }

        return new Date(dateString) || new Date(0);
    };

    // Sort vendors based on selected sort option
    const sortVendors = (vendorsList, sortType) => {
        const sortedVendors = [...vendorsList];

        switch (sortType) {
            case 'newest':
                return sortedVendors.sort((a, b) => {
                    const dateA = parseDate(a.createdAt || a.lastUpdated);
                    const dateB = parseDate(b.createdAt || b.lastUpdated);
                    return dateB - dateA; // Newest first
                });

            case 'oldest':
                return sortedVendors.sort((a, b) => {
                    const dateA = parseDate(a.createdAt || a.lastUpdated);
                    const dateB = parseDate(b.createdAt || b.lastUpdated);
                    return dateA - dateB; // Oldest first
                });

            case 'recentlyUpdated':
                return sortedVendors.sort((a, b) => {
                    const dateA = parseDate(a.lastUpdated || a.createdAt);
                    const dateB = parseDate(b.lastUpdated || b.createdAt);
                    return dateB - dateA; // Recently updated first
                });

            default:
                return sortedVendors;
        }
    };

    // Initial fetch
    useEffect(() => {
        fetchVendors();
    }, []);

    // Filter and sort vendors
    useEffect(() => {
        let filtered = vendors;

        // Search filter
        if (searchQuery.trim() !== '') {
            filtered = filtered.filter(vendor =>
                vendor.vendor_name?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.email?.toLowerCase().includes(searchQuery.toLowerCase()) ||
                vendor.vendor_phone?.includes(searchQuery) ||
                vendor.gstin_no?.toLowerCase().includes(searchQuery.toLowerCase())
            );
        }

        // Status filter
        if (statusFilter !== 'all') {
            filtered = filtered.filter(vendor => vendor.status?.toLowerCase() === statusFilter.toLowerCase());
        }

        // Apply sorting
        filtered = sortVendors(filtered, sortBy);

        setFilteredVendors(filtered);
        setCurrentPage(1);
    }, [searchQuery, statusFilter, vendors, sortBy]);

    // Clear filters
    const handleClearFilters = () => {
        setSearchQuery('');
        setStatusFilter('all');
        setSortBy('newest');
    };

    // Handle search
    const handleSearchChange = (e) => {
        setSearchQuery(e.target.value);
    };

    // Handle status filter
    const handleStatusFilterChange = (e) => {
        setStatusFilter(e.target.value);
    };

    // Handle sort change
    const handleSortChange = (e) => {
        setSortBy(e.target.value);
    };

    // Handle view
    const handleView = (vendor) => {
        setSelectedVendor(vendor);
        setViewModalOpen(true);
    };

    // Handle edit
    const handleEdit = (vendor) => {
        setSelectedVendor(vendor);
        setEditModalOpen(true);
    };

    // Handle add new vendor
    const handleAddVendor = () => {
        setSelectedVendor(null);
        setAddModalOpen(true);
    };

    // Pagination
    const totalItems = filteredVendors.length;
    const totalPages = Math.ceil(totalItems / itemsPerPage);
    const startIndex = (currentPage - 1) * itemsPerPage;
    const endIndex = startIndex + itemsPerPage;
    const currentVendors = filteredVendors.slice(startIndex, endIndex);

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

    // Get page numbers
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

    // Get status color
    const getStatusColor = (vendor) => {
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

    // Get blacklisted display
    const getBlacklistedDisplay = (blacklisted) => {
        if (blacklisted) {
            return <span className="bg-red-100 text-red-800 border border-red-200 px-2 py-1 rounded text-xs font-medium">Yes</span>;
        } else {
            return <span className="bg-green-100 text-green-800 border border-green-200 px-2 py-1 rounded text-xs font-medium">No</span>;
        }
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
                {/* Header */}
                <div className="mb-8 flex justify-between items-center px-3">
                    <div>
                        <h1 className="text-3xl font-bold text-gray-900">Vendor Management</h1>
                        <p className="mt-2 text-sm text-gray-600">Manage your vendors and their information</p>
                    </div>
                    <button
                        onClick={handleAddVendor}
                        className="bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
                    >
                        <PlusIcon className="w-5 h-5 mr-2" />
                        Add Vendor
                    </button>
                </div>

                {/* Search and Filter Bar */}
                <div className="mb-6 bg-white rounded-lg shadow-md p-4 border border-gray-200">
                    <div className="flex flex-col md:flex-row gap-4">
                        {/* Search Input */}
                        <div className="flex-1 relative">
                            <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
                                <SearchIcon className="h-5 w-5 text-gray-400" />
                            </div>
                            <input
                                type="text"
                                value={searchQuery}
                                onChange={handleSearchChange}
                                placeholder="Search vendors..."
                                className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            />
                        </div>

                        {/* Status Filter */}
                        <div className="relative">
                            <select
                                value={statusFilter}
                                onChange={handleStatusFilterChange}
                                className="pl-4 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="all">All Status</option>
                                <option value="active">Active</option>
                                <option value="inactive">Inactive</option>
                            </select>
                        </div>

                        {/* Sort Filter */}
                        <div className="relative">
                            <select
                                value={sortBy}
                                onChange={handleSortChange}
                                className="pl-4 pr-8 py-2 border border-gray-300 rounded-md leading-5 bg-white focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500"
                            >
                                <option value="newest">Newest First</option>
                                <option value="recentlyUpdated">Recently Updated</option>
                                <option value="oldest">Oldest First</option>
                            </select>
                        </div>

                        {/* Clear Filters Button */}
                        {(searchQuery || statusFilter !== 'all' || sortBy !== 'newest') && (
                            <button
                                onClick={handleClearFilters}
                                className="px-4 py-2 border border-gray-300 text-sm font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50"
                            >
                                Clear All
                            </button>
                        )}
                    </div>
                </div>

                {/* Vendors Table */}
                <div className="bg-white rounded-lg shadow-md overflow-hidden border border-gray-200">
                    <div className="overflow-x-auto">
                        <table className="min-w-full divide-y divide-gray-200">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">S.No</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Vendor Name</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Email</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Phone</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">GSTIN</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Blacklisted</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Status</th>
                                    <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {currentVendors.length === 0 ? (
                                    <tr>
                                        <td colSpan="8" className="px-6 py-8 text-center text-gray-500">
                                            <div className="mx-auto h-12 w-12 text-gray-400 mb-4">
                                                <svg fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                                </svg>
                                            </div>
                                            <p>
                                                {searchQuery || statusFilter !== 'all' || sortBy !== 'newest'
                                                    ? 'No vendors found matching your filters.'
                                                    : 'No vendors found.'
                                                }
                                            </p>
                                        </td>
                                    </tr>
                                ) : (
                                    currentVendors.map((vendor, index) => (
                                        <tr key={vendor.id} className="hover:bg-gray-50">
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium text-gray-900">
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
                                                    <span className="text-gray-500">N/A</span>
                                                )}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {vendor.vendor_phone || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {vendor.gstin_no || 'N/A'}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm">
                                                {getBlacklistedDisplay(vendor.blacklisted)}
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap">
                                                <span className={`inline-flex px-3 py-1 text-xs font-semibold rounded-full ${getStatusColor(vendor)}`}>
                                                    {vendor.status || 'Unknown'}
                                                </span>
                                            </td>
                                            <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                                                <div className="flex space-x-3">
                                                    <button
                                                        onClick={() => handleEdit(vendor)}
                                                        className={`text-blue-600 hover:text-blue-900 ${vendor.blacklisted ? 'opacity-50 cursor-not-allowed' : ''}`}
                                                        title="Edit"
                                                        disabled={vendor.blacklisted}
                                                    >
                                                        <EditIcon className="w-5 h-5" />
                                                    </button>
                                                    <button
                                                        onClick={() => handleView(vendor)}
                                                        className="text-gray-600 hover:text-gray-900"
                                                        title="View Details"
                                                    >
                                                        <EyeIcon className="w-5 h-5" />
                                                    </button>
                                                </div>
                                            </td>
                                        </tr>
                                    ))
                                )}
                            </tbody>
                        </table>
                    </div>

                    {/* Pagination */}
                    {filteredVendors.length > 0 && (
                        <div className="bg-gray-50 px-6 py-4 border-t border-gray-200">
                            <div className="flex items-center justify-between">
                                <div className="text-sm text-gray-700">
                                    Showing <span className="font-medium">{Math.min(endIndex, totalItems)}</span> of{' '}
                                    <span className="font-medium">{totalItems}</span> vendors
                                </div>

                                <div className="flex items-center space-x-2">
                                    {/* Previous Button */}
                                    <button
                                        onClick={goToPrevPage}
                                        disabled={currentPage === 1}
                                        className={`p-2 rounded-md ${currentPage === 1
                                            ? 'text-gray-400 cursor-not-allowed'
                                            : 'text-gray-600 hover:bg-gray-200'
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
                                                : 'text-gray-600 hover:bg-gray-200'
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
                                            : 'text-gray-600 hover:bg-gray-200'
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

            {/* Add Vendor Modal */}
            <Dialog open={addModalOpen} onClose={setAddModalOpen} className="relative z-[99]">
                <DialogBackdrop transition
                    className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <DialogPanel transition
                                className="pointer-events-auto relative w-7xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                <div className="flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                    <div className="px-4 sm:px-6 border-b pb-5">
                                        <div className="flex items-center justify-between">
                                            <DialogTitle className="text-base font-semibold text-gray-800">
                                                Add New Vendor
                                            </DialogTitle>
                                            <button
                                                onClick={() => setAddModalOpen(false)}
                                                className="text-gray-400 hover:text-gray-500 p-2"
                                            >
                                                ✖️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative flex-1 ">
                                        <VendorForm
                                            mode="create"
                                            onSuccess={() => {
                                                setAddModalOpen(false);
                                                fetchVendors();
                                            }}
                                        />
                                    </div>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* Edit Vendor Modal */}
            <Dialog open={editModalOpen} onClose={setEditModalOpen} className="relative z-[99]">
                <DialogBackdrop transition
                    className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <DialogPanel transition
                                className="pointer-events-auto relative w-7xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                <div className="flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                    <div className="px-4 sm:px-6 border-b pb-5">
                                        <div className="flex items-center justify-between">
                                            <DialogTitle className="text-base font-semibold text-gray-800">
                                                Edit Vendor
                                            </DialogTitle>
                                            <button
                                                onClick={() => setEditModalOpen(false)}
                                                className="text-gray-400 hover:text-gray-500 p-2"
                                            >
                                                ✖️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative flex-1">
                                        {selectedVendor && (
                                            <VendorForm
                                                mode="edit"
                                                vendor={selectedVendor}
                                                onSuccess={() => {
                                                    setEditModalOpen(false);
                                                    fetchVendors();
                                                }}
                                            />
                                        )}
                                    </div>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </div>
            </Dialog>

            {/* View Vendor Modal */}
            <Dialog open={viewModalOpen} onClose={setViewModalOpen} className="relative z-[99]">
                <DialogBackdrop transition
                    className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0" />
                <div className="fixed inset-0 overflow-hidden">
                    <div className="absolute inset-0 overflow-hidden">
                        <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
                            <DialogPanel transition
                                className="pointer-events-auto relative w-7xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700">
                                <div className="flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl">
                                    <div className="px-4 sm:px-6 border-b pb-5">
                                        <div className="flex items-center justify-between">
                                            <DialogTitle className="text-base font-semibold text-gray-800">
                                                Vendor Details
                                            </DialogTitle>
                                            <button
                                                onClick={() => setViewModalOpen(false)}
                                                className="text-gray-400 hover:text-gray-500 p-2"
                                            >
                                                ✖️
                                            </button>
                                        </div>
                                    </div>
                                    <div className="relative flex-1">
                                        {selectedVendor && (
                                            <VendorForm
                                                mode="view"
                                                vendor={selectedVendor}
                                            />
                                        )}
                                    </div>
                                </div>
                            </DialogPanel>
                        </div>
                    </div>
                </div>
            </Dialog>
        </div>
    );
}