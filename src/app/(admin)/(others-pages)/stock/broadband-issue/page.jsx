"use client";

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

function BroadbandIssue() {
    // All dropdown states
    const [selectedStaff, setSelectedStaff] = useState('Select Staff');
    const [selectedBranch, setSelectedBranch] = useState('Select Branch');
    const [selectedIssueFor, setSelectedIssueFor] = useState('Select Issue For');
    
    // Dropdown visibility
    const [showStaffDropdown, setShowStaffDropdown] = useState(false);
    const [showBranchDropdown, setShowBranchDropdown] = useState(false);
    const [showIssueForDropdown, setShowIssueForDropdown] = useState(false);
    
    // Search terms
    const [staffSearch, setStaffSearch] = useState('');
    const [branchSearch, setBranchSearch] = useState('');
    const [issueForSearch, setIssueForSearch] = useState('');
    
    // Items table
    const [items, setItems] = useState(() => {
        return Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            selectedItem: i === 0 ? "Binatone Telephone concept 9" : 'Select Item',
            value: i === 0 ? "Binatone Telephone concept 9" : 'Please Select Item!',
            showItemDropdown: false,
            itemSearch: ''
        }));
    });
    
    // API data states
    const [staffMembers, setStaffMembers] = useState([]);
    const [branches, setBranches] = useState([]);
    const [allProducts, setAllProducts] = useState([
        { id: 1, name: "Binatone Telephone concept 9", category: 'Telephone' },
        { id: 2, name: 'D-Link Router DIR-615', category: 'Router' },
        { id: 3, name: 'TP-Link Archer C6', category: 'Router' },
        { id: 4, name: 'Netgear Nighthawk R7000', category: 'Router' },
        { id: 5, name: 'Huawei B315s-22', category: '4G Router' },
        { id: 6, name: 'ZTE MF283', category: '4G Router' },
        { id: 7, name: 'Airtel Fiber Modem', category: 'Fiber Modem' },
        { id: 8, name: 'Jio Fiber Router', category: 'Fiber Router' },
        { id: 9, name: 'Cisco Switch SG250', category: 'Switch' },
        { id: 10, name: 'Ubiquiti UniFi AP', category: 'Access Point' },
    ]);
    
    // Loading states
    const [loading, setLoading] = useState({
        staff: true,
        branches: true
    });
    
    // Refs for dropdowns
    const staffDropdownRef = useRef(null);
    const branchDropdownRef = useRef(null);
    const issueForDropdownRef = useRef(null);
    const itemDropdownRefs = useRef([]);

    // Fetch data from APIs
    useEffect(() => {
        fetchData();
    }, []);

    const fetchData = async () => {
        try {
            // Fetch branches from API
            const branchesResponse = await fetch('http://localhost:5001/branches');
            if (!branchesResponse.ok) {
                throw new Error('Failed to fetch branches');
            }
            const branchesData = await branchesResponse.json();
            
            // Log the response to debug
            console.log('Branches API Response:', branchesData);
            
            // Check if branchesData is an array
            if (Array.isArray(branchesData)) {
                // Map branches to have proper structure
                const formattedBranches = branchesData.map(branch => ({
                    id: branch.id || branch.branchId || '',
                    name: branch.branchName || branch.name || 'Unnamed Branch',
                    address: branch.branchAddress || branch.address || '',
                    status: branch.status || true
                }));
                
                setBranches(formattedBranches);
                console.log('Formatted branches:', formattedBranches);
            } else {
                console.error('Branches data is not an array:', branchesData);
                setBranches([]);
            }
            
            setLoading(prev => ({ ...prev, branches: false }));
            
            // Fetch staff (you can add your staff API here)
            // For now, using sample data
            setStaffMembers([
                { id: 1, name: 'Ashu Sagar' },
                { id: 2, name: 'Rahul Verma' },
                { id: 3, name: 'Priya Sharma' },
                { id: 4, name: 'Amit Kumar' },
                { id: 5, name: 'Neha Singh' },
            ]);
            setLoading(prev => ({ ...prev, staff: false }));
            
        } catch (error) {
            console.error('Error fetching data:', error);
            toast.error('Failed to load branches data');
            setLoading(prev => ({ ...prev, staff: false, branches: false }));
        }
    };

    // Filter data based on search
    const filteredStaff = staffMembers.filter(staff =>
        staff.name.toLowerCase().includes(staffSearch.toLowerCase())
    );

    const filteredBranches = branches.filter(branch => {
        if (!branch.name) return false;
        return branch.name.toLowerCase().includes(branchSearch.toLowerCase()) ||
               branch.address?.toLowerCase().includes(branchSearch.toLowerCase());
    });

    const issueForOptions = [
        { id: 1, name: 'Repair' },
        { id: 2, name: 'Replacement' },
        { id: 3, name: 'New Installation' },
        { id: 4, name: 'Upgrade' },
        { id: 5, name: 'Maintenance' },
        { id: 6, name: 'Troubleshooting' },
    ];

    const filteredIssueFor = issueForOptions.filter(option =>
        option.name.toLowerCase().includes(issueForSearch.toLowerCase())
    );

    // Close dropdowns when clicking outside
    useEffect(() => {
        const handleClickOutside = (event) => {
            if (staffDropdownRef.current && !staffDropdownRef.current.contains(event.target)) {
                setShowStaffDropdown(false);
            }
            
            if (branchDropdownRef.current && !branchDropdownRef.current.contains(event.target)) {
                setShowBranchDropdown(false);
            }
            
            if (issueForDropdownRef.current && !issueForDropdownRef.current.contains(event.target)) {
                setShowIssueForDropdown(false);
            }
            
            itemDropdownRefs.current.forEach((ref, index) => {
                if (ref && !ref.contains(event.target)) {
                    const updatedItems = [...items];
                    if (updatedItems[index]?.showItemDropdown) {
                        updatedItems[index].showItemDropdown = false;
                        updatedItems[index].itemSearch = '';
                        setItems(updatedItems);
                    }
                }
            });
        };

        document.addEventListener('mousedown', handleClickOutside);
        return () => {
            document.removeEventListener('mousedown', handleClickOutside);
        };
    }, [items]);

    // Selection handlers
    const handleStaffSelect = (staff) => {
        setSelectedStaff(staff.name);
        setShowStaffDropdown(false);
        setStaffSearch('');
    };

    const handleBranchSelect = (branch) => {
        setSelectedBranch(branch.name);
        setShowBranchDropdown(false);
        setBranchSearch('');
    };

    const handleIssueForSelect = (option) => {
        setSelectedIssueFor(option.name);
        setShowIssueForDropdown(false);
        setIssueForSearch('');
    };

    const handleItemSelect = (rowId, product) => {
        const updatedItems = items.map(item => {
            if (item.id === rowId) {
                return {
                    ...item,
                    selectedItem: product.name,
                    value: product.name,
                    showItemDropdown: false,
                    itemSearch: ''
                };
            }
            return item;
        });
        
        setItems(updatedItems);
    };

    const openItemDropdown = (rowId) => {
        const updatedItems = items.map(item => {
            if (item.id === rowId) {
                return { ...item, showItemDropdown: true };
            }
            return { ...item, showItemDropdown: false };
        });
        setItems(updatedItems);
    };

    const updateItemSearch = (rowId, search) => {
        const updatedItems = items.map(item => {
            if (item.id === rowId) {
                return { ...item, itemSearch: search };
            }
            return item;
        });
        setItems(updatedItems);
    };

    const getFilteredProducts = (rowId) => {
        const item = items.find(i => i.id === rowId);
        if (!item) return allProducts;
        
        if (item.itemSearch.trim() === '') {
            return allProducts;
        }
        
        return allProducts.filter(product =>
            product.name.toLowerCase().includes(item.itemSearch.toLowerCase()) ||
            product.category.toLowerCase().includes(item.itemSearch.toLowerCase())
        );
    };

    const addNewRow = () => {
        const newId = items.length + 1;
        setItems([
            ...items,
            {
                id: newId,
                selectedItem: 'Select Item',
                value: 'Please Select Item!',
                showItemDropdown: false,
                itemSearch: ''
            }
        ]);
    };

    const removeRow = (id) => {
        if (items.length > 1) {
            const updatedItems = items.filter(item => item.id !== id);
            setItems(updatedItems);
            toast.success('Row removed');
        } else {
            toast.error('At least one row must remain');
        }
    };

    const handleSubmit = () => {
        // Validations
        if (selectedStaff === 'Select Staff') {
            toast.error('Please select staff');
            return;
        }
        
        if (selectedBranch === 'Select Branch') {
            toast.error('Please select a branch');
            return;
        }
        
        if (selectedIssueFor === 'Select Issue For') {
            toast.error('Please select issue type');
            return;
        }
        
        const incompleteItems = items.filter(item => item.value === 'Please Select Item!');
        if (incompleteItems.length > 0) {
            toast.error(`Please select items for ${incompleteItems.length} row(s)`);
            return;
        }

        const issueData = {
            staff: selectedStaff,
            branch: selectedBranch,
            issueFor: selectedIssueFor,
            items: items.map(item => ({
                item: item.selectedItem,
                value: item.value
            })),
            timestamp: new Date().toISOString()
        };

        console.log('Broadband Issue Data:', issueData);
        toast.success('Broadband issue logged successfully!');
        
        // Reset form
        setItems(Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            selectedItem: i === 0 ? "Binatone Telephone concept 9" : 'Select Item',
            value: i === 0 ? "Binatone Telephone concept 9" : 'Please Select Item!',
            showItemDropdown: false,
            itemSearch: ''
        })));
        setSelectedIssueFor('Select Issue For');
    };

    const resetForm = () => {
        setItems(Array.from({ length: 10 }, (_, i) => ({
            id: i + 1,
            selectedItem: i === 0 ? "Binatone Telephone concept 9" : 'Select Item',
            value: i === 0 ? "Binatone Telephone concept 9" : 'Please Select Item!',
            showItemDropdown: false,
            itemSearch: ''
        })));
        setSelectedIssueFor('Select Issue For');
        toast.success('Form reset');
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-7xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-xl font-bold text-gray-800">Broadband Issue</h1>
                    <p className="text-gray-600 text-sm mt-1">Log broadband equipment issues</p>
                </div>

                {/* Three Dropdowns in Row */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    {/* Staff Dropdown */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Select Staff</label>
                        <div className="relative" ref={staffDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowStaffDropdown(true);
                                    setShowBranchDropdown(false);
                                    setShowIssueForDropdown(false);
                                    setStaffSearch('');
                                }}
                                className={`w-full px-3 py-2 text-sm border rounded flex justify-between items-center ${
                                    selectedStaff === 'Select Staff' 
                                        ? 'border-gray-300 bg-white text-gray-500' 
                                        : 'border-blue-300 bg-blue-50 text-gray-800'
                                }`}
                            >
                                <span className="truncate">{selectedStaff}</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showStaffDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-hidden">
                                    <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            value={staffSearch}
                                            onChange={(e) => setStaffSearch(e.target.value)}
                                            placeholder="Search staff..."
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {loading.staff ? (
                                            <div className="px-3 py-4 text-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                                                <p className="text-xs text-gray-500 mt-2">Loading...</p>
                                            </div>
                                        ) : filteredStaff.length > 0 ? (
                                            filteredStaff.map(staff => (
                                                <div
                                                    key={staff.id}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-sm"
                                                    onClick={() => handleStaffSelect(staff)}
                                                >
                                                    {staff.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center">
                                                <p className="text-xs text-gray-500">No staff found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Branch Dropdown */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Issue From Branch</label>
                        <div className="relative" ref={branchDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowBranchDropdown(true);
                                    setShowStaffDropdown(false);
                                    setShowIssueForDropdown(false);
                                    setBranchSearch('');
                                }}
                                className={`w-full px-3 py-2 text-sm border rounded flex justify-between items-center ${
                                    selectedBranch === 'Select Branch' 
                                        ? 'border-gray-300 bg-white text-gray-500' 
                                        : 'border-blue-300 bg-blue-50 text-gray-800'
                                }`}
                            >
                                <span className="truncate">{selectedBranch}</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showBranchDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-hidden">
                                    <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            value={branchSearch}
                                            onChange={(e) => setBranchSearch(e.target.value)}
                                            placeholder="Search branch..."
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {loading.branches ? (
                                            <div className="px-3 py-4 text-center">
                                                <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500 mx-auto"></div>
                                                <p className="text-xs text-gray-500 mt-2">Loading branches...</p>
                                            </div>
                                        ) : filteredBranches.length > 0 ? (
                                            filteredBranches.map(branch => (
                                                <div
                                                    key={branch.id}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-sm"
                                                    onClick={() => handleBranchSelect(branch)}
                                                >
                                                    <div className="font-medium">{branch.name}</div>
                                                    {branch.address && (
                                                        <div className="text-xs text-gray-500 truncate">{branch.address}</div>
                                                    )}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center">
                                                <p className="text-xs text-gray-500">No branches found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>

                    {/* Issue For Dropdown */}
                    <div>
                        <label className="block text-xs font-medium text-gray-700 mb-1">Issue For</label>
                        <div className="relative" ref={issueForDropdownRef}>
                            <button
                                type="button"
                                onClick={() => {
                                    setShowIssueForDropdown(true);
                                    setShowStaffDropdown(false);
                                    setShowBranchDropdown(false);
                                    setIssueForSearch('');
                                }}
                                className={`w-full px-3 py-2 text-sm border rounded flex justify-between items-center ${
                                    selectedIssueFor === 'Select Issue For' 
                                        ? 'border-gray-300 bg-white text-gray-500' 
                                        : 'border-blue-300 bg-blue-50 text-gray-800'
                                }`}
                            >
                                <span className="truncate">{selectedIssueFor}</span>
                                <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                </svg>
                            </button>

                            {showIssueForDropdown && (
                                <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-64 overflow-hidden">
                                    <div className="p-2 border-b">
                                        <input
                                            type="text"
                                            value={issueForSearch}
                                            onChange={(e) => setIssueForSearch(e.target.value)}
                                            placeholder="Search issue type..."
                                            className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                            autoFocus
                                        />
                                    </div>
                                    <div className="max-h-48 overflow-y-auto">
                                        {filteredIssueFor.length > 0 ? (
                                            filteredIssueFor.map(option => (
                                                <div
                                                    key={option.id}
                                                    className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-sm"
                                                    onClick={() => handleIssueForSelect(option)}
                                                >
                                                    {option.name}
                                                </div>
                                            ))
                                        ) : (
                                            <div className="px-3 py-4 text-center">
                                                <p className="text-xs text-gray-500">No options found</p>
                                            </div>
                                        )}
                                    </div>
                                </div>
                            )}
                        </div>
                    </div>
                </div>
                {/* Table Section */}
                <div className="bg-white rounded-lg border border-gray-200 overflow-hidden mb-6">
                    <div className="px-4 py-3 bg-gray-50 border-b border-gray-200">
                        <div className="flex justify-between items-center">
                            <h2 className="text-sm font-semibold text-gray-700">Items List</h2>
                            <button
                                onClick={addNewRow}
                                className="px-3 py-1 text-sm bg-green-600 text-white rounded hover:bg-green-700"
                            >
                                + Add Row
                            </button>
                        </div>
                    </div>

                    <div className="overflow-x-auto">
                        <table className="w-full text-sm">
                            <thead className="bg-gray-100">
                                <tr>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700 border-r border-gray-200">Sr.</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700 border-r border-gray-200">Items</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700 border-r border-gray-200">Value</th>
                                    <th className="px-4 py-2 text-left font-medium text-gray-700">Actions</th>
                                </tr>
                            </thead>
                            <tbody>
                                {items.map((item, index) => (
                                    <tr key={item.id} className="border-b border-gray-200 hover:bg-gray-50">
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <span className="font-medium">{index + 1}</span>
                                        </td>
                                        
                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className="relative" ref={el => itemDropdownRefs.current[index] = el}>
                                                <button
                                                    type="button"
                                                    onClick={() => openItemDropdown(item.id)}
                                                    className={`w-full px-3 py-2 text-left border rounded flex justify-between items-center text-sm ${
                                                        item.selectedItem === 'Select Item' 
                                                            ? 'border-red-200 bg-red-50 text-red-700' 
                                                            : 'border-gray-300 bg-white text-gray-800'
                                                    }`}
                                                >
                                                    <span className="truncate">{item.selectedItem}</span>
                                                    <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
                                                    </svg>
                                                </button>

                                                {item.showItemDropdown && (
                                                    <div className="absolute z-10 w-full mt-1 bg-white border border-gray-300 rounded shadow-lg max-h-60 overflow-hidden">
                                                        <div className="p-2 border-b">
                                                            <input
                                                                type="text"
                                                                value={item.itemSearch}
                                                                onChange={(e) => updateItemSearch(item.id, e.target.value)}
                                                                placeholder="Search product..."
                                                                className="w-full px-2 py-1 text-sm border border-gray-300 rounded focus:ring-1 focus:ring-blue-500"
                                                                autoFocus
                                                            />
                                                        </div>
                                                        <div className="max-h-44 overflow-y-auto">
                                                            {getFilteredProducts(item.id).length > 0 ? (
                                                                getFilteredProducts(item.id).map(product => (
                                                                    <div
                                                                        key={product.id}
                                                                        className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100 text-sm"
                                                                        onClick={() => handleItemSelect(item.id, product)}
                                                                    >
                                                                        <div>{product.name}</div>
                                                                        <div className="text-xs text-gray-500">{product.category}</div>
                                                                    </div>
                                                                ))
                                                            ) : (
                                                                <div className="px-3 py-4 text-center">
                                                                    <p className="text-xs text-gray-500">No products found</p>
                                                                </div>
                                                            )}
                                                        </div>
                                                    </div>
                                                )}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3 border-r border-gray-200">
                                            <div className={`px-3 py-2 rounded border text-sm ${
                                                item.value === 'Please Select Item!' 
                                                    ? 'border-red-200 bg-red-50 text-red-600' 
                                                    : 'border-green-200 bg-green-50 text-green-700'
                                            }`}>
                                                {item.value}
                                            </div>
                                        </td>

                                        <td className="px-4 py-3">
                                            {items.length > 1 && (
                                                <button
                                                    onClick={() => removeRow(item.id)}
                                                    className="px-2 py-1 text-xs text-red-600 hover:text-red-800 hover:bg-red-50 border border-red-200 rounded"
                                                >
                                                    Remove
                                                </button>
                                            )}
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                </div>

                {/* Summary Cards */}
                <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-6">
                    <div className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-gray-600 mb-1">Staff</div>
                        <div className="font-medium text-sm truncate">{selectedStaff}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-gray-600 mb-1">Branch</div>
                        <div className="font-medium text-sm truncate">{selectedBranch}</div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-gray-600 mb-1">Selected Items</div>
                        <div className="font-bold text-green-600 text-sm">
                            {items.filter(item => item.value !== 'Please Select Item!').length} / {items.length}
                        </div>
                    </div>
                    <div className="bg-white border border-gray-200 rounded p-3">
                        <div className="text-xs text-gray-600 mb-1">Issue Type</div>
                        <div className="font-medium text-sm truncate">{selectedIssueFor}</div>
                    </div>
                </div>

                {/* Action Buttons */}
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 bg-white border border-gray-200 rounded-lg">
                    <div className="text-xs text-gray-600">
                        Date: {new Date().toLocaleDateString('en-IN')} | 
                        Total Rows: <span className="font-medium">{items.length}</span>
                    </div>
                    
                    <div className="flex gap-3">
                        <button
                            onClick={resetForm}
                            className="px-4 py-2 text-sm border border-gray-300 text-gray-700 rounded hover:bg-gray-50"
                        >
                            Reset
                        </button>
                        <button
                            onClick={handleSubmit}
                            className="px-4 py-2 text-sm bg-blue-600 text-white rounded hover:bg-blue-700 font-medium"
                        >
                            Submit Issue
                        </button>
                    </div>
                </div>
            </div>
        </div>
    );
}

export default BroadbandIssue;