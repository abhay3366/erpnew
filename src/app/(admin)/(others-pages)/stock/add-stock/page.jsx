'use client';

import { useState, useEffect, useRef } from 'react';
import toast from 'react-hot-toast';

// ==================== PRODUCT DROPDOWN COMPONENT ====================
const ProductDropdown = ({
  value,
  onChange,
  onSelect,
  vendorProducts,
  disabled,
  placeholder,
  error
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [search, setSearch] = useState('');
  const dropdownRef = useRef(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter products based on search
  const filteredProducts = vendorProducts.filter(product => {
    if (!search.trim()) return true;
    
    const searchLower = search.toLowerCase();
    return (
      product.productName?.toLowerCase().includes(searchLower) ||
      product.fullPath?.toLowerCase().includes(searchLower) ||
      product.brand?.toLowerCase().includes(searchLower)
    );
  });

  const handleProductSelect = (product) => {
    onSelect(product);
    setIsOpen(false);
    setSearch('');
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={search || value}
        onChange={(e) => {
          setSearch(e.target.value);
          onChange(e.target.value);
        }}
        onFocus={() => setIsOpen(true)}
        onClick={() => setIsOpen(true)}
        placeholder={placeholder}
        className={`w-full px-3 py-2 text-sm border ${error ? 'border-red-300' : 'border-gray-300'} rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500`}
        disabled={disabled}
        readOnly={disabled}
      />
      
      <div className="absolute right-3 top-2.5">
        <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
        </svg>
      </div>

      {/* Dropdown Menu */}
      {isOpen && !disabled && filteredProducts.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-64 overflow-y-auto">
          <div className="px-3 py-2 bg-gray-50 border-b border-gray-200">
            <p className="text-xs font-medium text-gray-700">
              Available Products: <span className="text-green-600">{filteredProducts.length}</span>
            </p>
          </div>
          
          {filteredProducts.map((product) => (
            <div
              key={product.id}
              className="px-3 py-3 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
              onClick={() => handleProductSelect(product)}
            >
              <div className="font-medium text-gray-800">{product.productName}</div>
              <div className="flex justify-between text-xs text-gray-500 mt-0.5">
                <span className="truncate">
                  Brand: {product.brand || 'N/A'} | Unit: {product.unit || 'N/A'}
                </span>
                {product.warehouse && (
                  <span className="font-medium text-green-600 ml-2">
                    Warehouse ID: {product.warehouse}
                  </span>
                )}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && !disabled && filteredProducts.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-3 py-6 text-center">
            <p className="text-gray-500 text-sm">
              {search ? `No products found for "${search}"` : 'No products available'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== VENDOR DROPDOWN COMPONENT ====================
const VendorDropdown = ({
  value,
  onChange,
  onSelect,
  vendors,
  disabled,
  loading
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const dropdownRef = useRef(null);

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const filteredVendors = vendors.filter(vendor => 
    vendor.vendor_name.toLowerCase().includes(value.toLowerCase())
  );

  const handleVendorSelect = (vendor) => {
    onSelect(vendor);
    setIsOpen(false);
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <input
        type="text"
        value={value}
        onChange={(e) => {
          onChange(e.target.value);
          setIsOpen(true);
        }}
        onClick={() => setIsOpen(true)}
        placeholder="Select vendor..."
        className="w-full px-3 py-2 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
        disabled={disabled}
      />
      
      {loading ? (
        <div className="absolute right-3 top-2.5">
          <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-blue-500"></div>
        </div>
      ) : (
        <div className="absolute right-3 top-2.5">
          <svg className="w-4 h-4 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 9l-7 7-7-7" />
          </svg>
        </div>
      )}

      {/* Dropdown Menu */}
      {isOpen && filteredVendors.length > 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-48 overflow-y-auto">
          {filteredVendors.map((vendor) => (
            <div
              key={vendor.id}
              className="px-3 py-2 hover:bg-blue-50 cursor-pointer border-b border-gray-100"
              onClick={() => handleVendorSelect(vendor)}
            >
              <div className="font-medium text-gray-800">{vendor.vendor_name}</div>
              <div className="text-xs text-gray-500 mt-0.5">
                Products: {vendor.selected_products?.length || 0} | GSTIN: {vendor.gstin_no || 'N/A'}
              </div>
            </div>
          ))}
        </div>
      )}

      {isOpen && filteredVendors.length === 0 && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg">
          <div className="px-3 py-4 text-center">
            <p className="text-gray-500 text-sm">
              {value ? `No vendors found for "${value}"` : 'No vendors available'}
            </p>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== WARRANTY BADGE COMPONENT ====================
const WarrantyBadge = ({ years }) => {
  const getWarrantyColor = () => {
    if (years >= 4) return 'bg-green-100 text-green-800 border-green-200';
    if (years >= 3) return 'bg-blue-100 text-blue-800 border-blue-200';
    if (years >= 2) return 'bg-yellow-100 text-yellow-800 border-yellow-200';
    if (years >= 1) return 'bg-gray-100 text-gray-800 border-gray-200';
    return 'bg-red-100 text-red-800 border-red-200';
  };

  return (
    <span className={`px-2 py-1 rounded-full text-xs font-medium border ${getWarrantyColor()}`}>
      {years > 0 ? `${years}Y` : 'No'}
    </span>
  );
};

// ==================== STOCK ITEM ROW COMPONENT ====================
const StockItemRow = ({
  item,
  index,
  isSerial,
  onChange,
  onRemove,
  canRemove
}) => {
  return (
    <tr className="hover:bg-gray-50">
      <td className="px-4 py-3 whitespace-nowrap text-sm text-gray-800">{index + 1}</td>

      {isSerial === true && (
        <>
          <td className="px-4 py-3">
            <input
              type="text"
              value={item.serialNumber || ''}
              onChange={(e) => onChange(item.id, 'serialNumber', e.target.value)}
              placeholder="Enter Serial Number..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
            />
          </td>
          <td className="px-4 py-3">
            <input
              type="text"
              value={item.macAddress || ''}
              onChange={(e) => onChange(item.id, 'macAddress', e.target.value)}
              placeholder="Enter MAC Address..."
              className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 font-mono"
            />
          </td>
        </>
      )}

      {isSerial === false && (
        <td className="px-4 py-3">
          <input
            type="number"
            min="1"
            value={item.quantity || 0}
            onChange={(e) => onChange(item.id, 'quantity', parseInt(e.target.value) || 1)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          />
        </td>
      )}

      <td className="px-4 py-3">
        <div className="flex items-center gap-2">
          <select
            value={item.warranty || 0}
            onChange={(e) => onChange(item.id, 'warranty', parseInt(e.target.value) || 0)}
            className="w-full px-3 py-1.5 text-sm border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500"
          >
            <option value="0">No Warranty</option>
            <option value="1">1 Year</option>
            <option value="2">2 Years</option>
            <option value="3">3 Years</option>
            <option value="4">4 Years</option>
          </select>
          <WarrantyBadge years={item.warranty || 0} />
        </div>
      </td>

      {isSerial === true && canRemove && (
        <td className="px-4 py-3 whitespace-nowrap">
          <button
            type="button"
            onClick={() => onRemove(item.id)}
            className="px-2 py-1 text-red-600 hover:text-red-900 text-sm border border-red-200 rounded-lg hover:bg-red-50"
          >
            Remove
          </button>
        </td>
      )}
    </tr>
  );
};

// ==================== MAIN ADD STOCK COMPONENT ====================
function AddStock({ onClose, onSuccess, editData = null }) {
  // Check if we're in edit mode
  const isEditMode = editData !== null;

  // Main form state
  const [formData, setFormData] = useState({
    categoryItem: '',
    vendor: '', // vendor name (UI में दिखेगा)
    warrantyYears: 0,
  });

  // Store vendor ID separately (UI में नहीं दिखेगा)
  const [selectedVendorId, setSelectedVendorId] = useState('');

  // Product and selection state
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [isSerial, setIsSerial] = useState(null);

  // Stock items table
  const [stockItems, setStockItems] = useState([{
    id: 1,
    serialNumber: '',
    macAddress: '',
    quantity: 0,
    warranty: 0
  }]);

  // Data from API
  const [vendors, setVendors] = useState([]);
  const [allProducts, setAllProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);

  // Loading states
  const [loading, setLoading] = useState({
    vendors: false,
    products: false,
    submitting: false,
    loadingEditData: false
  });

  // Error handling
  const [error, setError] = useState('');

  // Refs for dropdowns
  const productInputRef = useRef(null);

  // ==================== INITIAL DATA FETCHING ====================
  useEffect(() => {
    const fetchInitialData = async () => {
      try {
        setLoading(prev => ({ ...prev, vendors: true, products: true }));
        
        // Fetch vendors
        const vendorsResponse = await fetch('http://localhost:5001/vendors');
        if (!vendorsResponse.ok) throw new Error('Failed to fetch vendors');
        const vendorsData = await vendorsResponse.json();
        const activeVendors = vendorsData.filter(v => v.status === 'Active' && !v.blacklisted);
        setVendors(activeVendors);
        
        // Fetch all products
        const productsResponse = await fetch('http://localhost:5001/products');
        if (!productsResponse.ok) throw new Error('Failed to fetch products');
        const productsData = await productsResponse.json();
        setAllProducts(productsData);
        
        console.log('Loaded vendors:', activeVendors.length);
        console.log('Loaded products:', productsData.length);
        
      } catch (err) {
        console.error('Error fetching initial data:', err);
        setError('Failed to load data. Please try again.');
        toast.error('Failed to load data');
      } finally {
        setLoading(prev => ({ ...prev, vendors: false, products: false }));
      }
    };

    fetchInitialData();
  }, []);

  // ==================== INITIALIZE EDIT DATA ====================
  useEffect(() => {
    if (isEditMode && editData && vendors.length > 0 && allProducts.length > 0) {
      initializeEditData();
    }
  }, [vendors, allProducts, isEditMode]);

  const initializeEditData = () => {
    try {
      setLoading(prev => ({ ...prev, loadingEditData: true }));
      console.log('Initializing edit data:', editData);

      // Set basic form data
      setFormData({
        categoryItem: editData.category || '',
        vendor: editData.vendor || '',
        warrantyYears: editData.globalWarranty || 0,
      });

      // Set vendor ID from edit data if available
      if (editData.vendorId) {
        setSelectedVendorId(editData.vendorId);
      } else {
        // Find vendor ID from vendors array
        const vendor = vendors.find(v => v.vendor_name === editData.vendor);
        if (vendor) {
          setSelectedVendorId(vendor.id);
        }
      }

      // Set serial mode
      const serialValue = editData.product?.isSerial || editData.isSerial;
      console.log('Original isSerial value:', serialValue, 'Type:', typeof serialValue);
      
      let serialMode = false;
      if (serialValue === "1" || serialValue === 1 || serialValue === true || serialValue === "true") {
        serialMode = true;
      }
      
      console.log('Setting serial mode to:', serialMode);
      setIsSerial(serialMode);

      // Set stock items
      if (editData.items && editData.items.length > 0) {
        console.log('Loading edit items:', editData.items);
        const itemsWithIds = editData.items.map((item, index) => ({
          id: index + 1,
          serialNumber: item.serialNumber || '',
          macAddress: item.macAddress || '',
          quantity: item.quantity || (serialMode ? 1 : 0),
          warranty: item.warranty || 0,
        }));
        console.log('Setting stock items:', itemsWithIds);
        setStockItems(itemsWithIds);
      } else {
        console.log('No items found in edit data');
        setStockItems([{
          id: 1,
          serialNumber: '',
          macAddress: '',
          quantity: serialMode ? 1 : 0,
          warranty: 0,
        }]);
      }

      // Set selected product
      if (editData.product) {
        console.log('Setting selected product directly from editData:', editData.product);
        
        const productFromEdit = {
          id: editData.product.id,
          productName: editData.product.name || editData.product.productName || '',
          brand: editData.product.brand || 'N/A',
          unit: editData.product.unit || 'N/A',
          isSerial: editData.product.isSerial || "0",
          warehouse: editData.product.warehouse || editData.warehouse || '',
          fullPath: editData.product.name || ''
        };
        
        setSelectedProduct(productFromEdit);
        setVendorProducts([productFromEdit]);
      }

      // Load vendor products for dropdown
      if (editData.vendor) {
        loadVendorProductsForDropdown(editData.vendor);
      }

    } catch (error) {
      console.error('Error initializing edit data:', error);
      toast.error('Failed to load edit data');
    } finally {
      setLoading(prev => ({ ...prev, loadingEditData: false }));
    }
  };

  // ==================== LOAD VENDOR PRODUCTS FOR DROPDOWN ====================
  const loadVendorProductsForDropdown = (vendorName) => {
    console.log('Loading vendor products for dropdown:', vendorName);
    
    const vendor = vendors.find(v => v.vendor_name === vendorName);
    if (!vendor) {
      console.log('Vendor not found:', vendorName);
      setVendorProducts([]);
      return;
    }

    const vendorProductIds = (vendor.selected_products || [])
      .map(item => {
        if (typeof item === 'object' && item.id) {
          return item.id;
        }
        return String(item);
      })
      .filter(id => id);

    const matchedProducts = allProducts.filter(product => 
      vendorProductIds.includes(product.id)
    );

    const formattedProducts = matchedProducts.map(product => ({
      id: product.id,
      productName: product.productName || 'Unnamed Product',
      brand: product.brand || 'N/A',
      unit: product.unit || 'N/A',
      isSerial: product.isSerial || "0",
      warehouse: product.warehouse || '',
      description: product.description || '',
      category: product.category || [],
      fullPath: product.productName
    }));

    console.log('Formatted vendor products for dropdown:', formattedProducts);
    setVendorProducts(formattedProducts);
  };

  // ==================== EVENT HANDLERS ====================
  const handleVendorSelect = (vendor) => {
    console.log('Vendor selected:', vendor);
    
    // Store vendor name for display
    setFormData({
      categoryItem: '',
      vendor: vendor.vendor_name,
      warrantyYears: 0
    });
    
    // Store vendor ID for database (UI में नहीं दिखेगा)
    setSelectedVendorId(vendor.id);
    
    setSelectedProduct(null);
    setIsSerial(null);
    setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 0, warranty: 0 }]);
    
    loadVendorProductsForDropdown(vendor.vendor_name);
    
    setTimeout(() => {
      if (productInputRef.current) {
        productInputRef.current.focus();
      }
    }, 100);
  };

  const handleProductSelect = (product) => {
    console.log('Product selected:', product);
    
    setSelectedProduct({
      id: product.id,
      productName: product.productName,
      brand: product.brand,
      unit: product.unit,
      isSerial: product.isSerial,
      warehouse: product.warehouse,
      fullPath: product.productName
    });

    setFormData(prev => ({ 
      ...prev, 
      categoryItem: product.productName 
    }));

    const needsSerial = product.isSerial === "1" || product.isSerial === "true" || product.isSerial === true;
    console.log('Setting isSerial to:', needsSerial);
    setIsSerial(needsSerial);

    if (needsSerial) {
      setStockItems([{
        id: 1,
        serialNumber: '',
        macAddress: '',
        quantity: 1,
        warranty: 0
      }]);
    } else {
      setStockItems([{
        id: 1,
        serialNumber: '',
        macAddress: '',
        quantity: 0,
        warranty: 0
      }]);
    }

    setError('');
  };

  // ==================== TABLE FUNCTIONS ====================
  const addMultipleRows = (count) => {
    const newItems = [];
    const startId = stockItems.length + 1;

    for (let i = 0; i < count; i++) {
      newItems.push({
        id: startId + i,
        serialNumber: '',
        macAddress: '',
        quantity: isSerial === true ? 1 : 0,
        warranty: 0,
      });
    }
    setStockItems([...stockItems, ...newItems]);
  };

  const addSingleRow = () => {
    const newItem = {
      id: stockItems.length + 1,
      serialNumber: '',
      macAddress: '',
      quantity: isSerial === true ? 1 : 0,
      warranty: 0,
    };
    setStockItems([...stockItems, newItem]);
  };

  const removeRow = (id) => {
    if (stockItems.length > 1) {
      const updated = stockItems.filter(item => item.id !== id);
      const renumbered = updated.map((item, idx) => ({ ...item, id: idx + 1 }));
      setStockItems(renumbered);
    }
  };

  const changeItemValue = (id, field, value) => {
    const updated = stockItems.map(item => {
      if (item.id === id) {
        if (field === 'quantity' || field === 'warranty') {
          return { ...item, [field]: parseInt(value) || 0 };
        }
        return { ...item, [field]: value };
      }
      return item;
    });
    setStockItems(updated);
  };

  const applyWarrantyToAll = (years) => {
    setFormData(prev => ({ ...prev, warrantyYears: years }));
    const updated = stockItems.map(item => ({ ...item, warranty: years }));
    setStockItems(updated);
  };

  // ==================== FORM VALIDATION ====================
  const validateForm = () => {
    if (!formData.vendor.trim()) {
      setError('Please select a vendor');
      return false;
    }

    if (!selectedVendorId) {
      setError('Vendor ID not found. Please select vendor again.');
      return false;
    }

    if (!formData.categoryItem.trim() || !selectedProduct) {
      setError('Please select a product');
      return false;
    }

    if (isSerial === null) {
      setError('Please select a product first');
      return false;
    }

    if (isSerial === true) {
      const hasValidSerial = stockItems.some(item => 
        item.serialNumber && item.serialNumber.trim() !== ''
      );
      
      if (!hasValidSerial) {
        setError('Please enter at least one serial number');
        return false;
      }

      stockItems.forEach(item => {
        if (item.quantity < 1) {
          changeItemValue(item.id, 'quantity', 1);
        }
      });
    }
    
    else if (isSerial === false) {
      if (stockItems[0].quantity <= 0) {
        setError('Please enter a valid quantity');
        return false;
      }
    }

    return true;
  };

  // ==================== FORM SUBMISSION ====================
  const submitForm = async (e) => {
    e.preventDefault();
    setError('');

    if (!validateForm()) {
      return;
    }

    // Prepare items for saving
    let itemsToSave = [];

    if (isSerial === true) {
      itemsToSave = stockItems
        .filter(item => item.serialNumber && item.serialNumber.trim() !== '')
        .map(item => ({
          serialNumber: item.serialNumber.trim(),
          macAddress: item.macAddress.trim(),
          quantity: item.quantity,
          warranty: item.warranty
        }));

      if (itemsToSave.length === 0) {
        setError('Please enter at least one serial number');
        return;
      }
    } else {
      itemsToSave = stockItems
        .filter(item => item.quantity > 0)
        .map(item => ({
          serialNumber: '',
          macAddress: '',
          quantity: item.quantity,
          warranty: item.warranty
        }));

      if (itemsToSave.length === 0) {
        setError('Please enter a valid quantity');
        return;
      }
    }

    // Prepare stock data with VENDOR ID
    const stockData = {
      product: {
        id: selectedProduct.id,
        name: selectedProduct.productName,
        brand: selectedProduct.brand,
        unit: selectedProduct.unit,
        isSerial: selectedProduct.isSerial,
        warehouse: selectedProduct.warehouse
      },
      category: formData.categoryItem,
      vendor: formData.vendor, // Vendor name (for display)
      vendorId: selectedVendorId, // Vendor ID (for database reference)
      warehouse: selectedProduct.warehouse || '',
      globalWarranty: formData.warrantyYears,
      isSerial: isSerial ? "1" : "0",
      items: itemsToSave,
      totalItems: itemsToSave.reduce((sum, item) => sum + item.quantity, 0),
      unit: selectedProduct.unit || '',
      addedAt: isEditMode ? editData.addedAt : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    };

    console.log('Submitting stock data:', stockData);
    console.log('Vendor ID:', selectedVendorId);

    try {
      setLoading(prev => ({ ...prev, submitting: true }));

      const url = isEditMode 
        ? `http://localhost:5001/stocks/${editData.id}`
        : 'http://localhost:5001/stocks';

      const method = isEditMode ? 'PUT' : 'POST';

      const response = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(stockData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error('Server error response:', errorText);
        throw new Error(`Failed to save: ${errorText}`);
      }

      const responseData = await response.json();
      console.log('Server response:', responseData);

      // Reset form on success
      resetForm();
      
      toast.success(
        isEditMode 
          ? `Stock updated successfully! ${itemsToSave.length} item(s) updated.`
          : `Stock added successfully! ${itemsToSave.length} item(s) saved.`
      );

      if (onSuccess) onSuccess();
      if (onClose) onClose();

    } catch (error) {
      console.error('Error saving stock:', error);
      setError(isEditMode ? 'Failed to update stock' : 'Failed to save stock');
      toast.error(error.message || 'Failed to save stock. Please try again.');
    } finally {
      setLoading(prev => ({ ...prev, submitting: false }));
    }
  };

  const resetForm = () => {
    setFormData({ categoryItem: '', vendor: '', warrantyYears: 0 });
    setSelectedVendorId('');
    setStockItems([{ id: 1, serialNumber: '', macAddress: '', quantity: 0, warranty: 0 }]);
    setSelectedProduct(null);
    setIsSerial(null);
    setVendorProducts([]);
    setError('');
  };

  // ==================== RENDER ====================
  if (loading.loadingEditData) {
    return (
      <div className="p-4 md:p-6">
        <div className="flex items-center justify-center h-64">
          <div className="text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading stock data...</p>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="">
      {/* Header */}
      <div className="mb-6">
        <h2 className="text-xl font-bold text-gray-800">
          {isEditMode ? 'Edit Stock' : 'Add New Stock'}
        </h2>
        {isEditMode && (
          <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-lg inline-block">
            <span className="text-sm text-blue-700">
              Editing: {formData.categoryItem || 'Stock Item'}
            </span>
          </div>
        )}
      </div>

      {/* Error Message */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg">
          <p className="text-red-600 text-sm">{error}</p>
        </div>
      )}

      {/* Main Form */}
      <form onSubmit={submitForm} className="space-y-6">
        {/* Vendor & Product Selection */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 md:gap-6">
          {/* Vendor Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Vendor *
            </label>
            <VendorDropdown
              value={formData.vendor}
              onChange={(value) => {
                setFormData(prev => ({ 
                  ...prev, 
                  vendor: value,
                  categoryItem: '' 
                }));
                // Clear vendor ID when user types manually
                setSelectedVendorId('');
              }}
              onSelect={handleVendorSelect}
              vendors={vendors}
              disabled={loading.vendors}
              loading={loading.vendors}
            />
            {formData.vendor && (
              <p className="mt-1 text-xs text-gray-500">
                Selected: {formData.vendor}
                {selectedVendorId && (
                  <span className="ml-2 text-green-600">
                    ✓ (ID: {selectedVendorId.substring(0, 8)}...)
                  </span>
                )}
              </p>
            )}
          </div>

          {/* Product Selection */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Product *
            </label>
            <div ref={productInputRef}>
              <ProductDropdown
                value={formData.categoryItem}
                onChange={(value) => setFormData(prev => ({ ...prev, categoryItem: value }))}
                onSelect={handleProductSelect}
                vendorProducts={vendorProducts}
                disabled={!formData.vendor || vendorProducts.length === 0}
                placeholder={
                  !formData.vendor 
                    ? "Select vendor first" 
                    : vendorProducts.length === 0 
                    ? "No products available for this vendor" 
                    : "Select product"
                }
                error={error && !formData.categoryItem}
              />
            </div>
            {selectedProduct && (
              <div className="mt-2 p-2 bg-green-50 border border-green-200 rounded">
                <div className="text-sm text-gray-700">
                  <span className="font-medium">Selected:</span> {selectedProduct.productName}
                </div>
              </div>
            )}
          </div>

          {/* Quick Add Rows (for serial mode) */}
          {isSerial === true && (
            <div className="md:col-span-2">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Quick Add Rows
              </label>
              <div className="flex flex-wrap gap-2">
                {[10, 20, 30, 40].map((count) => (
                  <button
                    key={count}
                    type="button"
                    onClick={() => addMultipleRows(count)}
                    className="px-3 py-1.5 bg-gray-100 text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-200 transition-colors text-sm"
                  >
                    Add {count} Rows
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* Warranty Options */}
          <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Apply Warranty to All Items (Optional)
            </label>
            <div className="flex flex-wrap gap-2">
              {[1, 2, 3, 4].map((year) => (
                <button
                  key={year}
                  type="button"
                  onClick={() => applyWarrantyToAll(year)}
                  className={`px-3 py-1.5 rounded-lg border text-sm ${
                    formData.warrantyYears >= year
                      ? 'bg-blue-500 text-white border-blue-500'
                      : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                  }`}
                >
                  {year} Year{year > 1 ? 's' : ''}
                </button>
              ))}
              <button
                type="button"
                onClick={() => applyWarrantyToAll(0)}
                className={`px-3 py-1.5 rounded-lg border text-sm ${
                  formData.warrantyYears === 0
                    ? 'bg-red-500 text-white border-red-500'
                    : 'bg-gray-100 text-gray-700 border-gray-300 hover:bg-gray-200'
                }`}
              >
                No Warranty
              </button>
            </div>
          </div>
        </div>

        {/* Stock Items Table */}
        <div>
          <div className="flex justify-end items-center mb-3">
            {isSerial === true && (
              <button
                type="button"
                onClick={addSingleRow}
                className="px-3 py-1.5 bg-blue-600 text-white font-medium rounded-lg hover:bg-blue-700 text-sm"
              >
                + Add Single Row
              </button>
            )}
          </div>

          <div className="overflow-x-auto bg-white rounded-lg border border-gray-200">
            <table className="w-full min-w-[600px]">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    S.No
                  </th>
                  {isSerial === true && (
                    <>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        Serial Number *
                      </th>
                      <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                        MAC Address
                      </th>
                    </>
                  )}
                  {isSerial === false && (
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Quantity *
                    </th>
                  )}
                  <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                    Warranty (Years)
                  </th>
                  {isSerial === true && stockItems.length > 1 && (
                    <th className="px-4 py-2 text-left text-xs font-medium text-gray-500 uppercase">
                      Actions
                    </th>
                  )}
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-200">
                {stockItems.map((item, index) => (
                  <StockItemRow
                    key={item.id}
                    item={item}
                    index={index}
                    isSerial={isSerial}
                    onChange={changeItemValue}
                    onRemove={removeRow}
                    canRemove={stockItems.length > 1}
                  />
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* Footer Actions */}
        <div className="flex flex-col md:flex-row md:justify-between gap-4 md:items-center pt-4 border-t border-gray-200">
          <div className="text-sm text-gray-600">
            <span className="font-medium">Mode:</span>{' '}
            {isSerial === true ? 'Serial Numbers (1)' : isSerial === false ? 'Quantity Only (0)' : 'Not Selected'} |
            <span className="font-medium ml-2">Rows:</span> {stockItems.length}
            {selectedProduct?.unit && (
              <>
                <span className="font-medium ml-2">| Unit:</span>
                <span className="ml-1">{selectedProduct.unit}</span>
              </>
            )}
            {selectedProduct?.warehouse && (
              <>
                <span className="font-medium ml-2">| Warehouse ID:</span>
                <span className="ml-1">{selectedProduct.warehouse}</span>
              </>
            )}
          </div>

          <div className="flex gap-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 border border-gray-300 font-medium text-sm"
              disabled={loading.submitting}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-green-600 text-white font-medium rounded-lg hover:bg-green-700 text-sm disabled:opacity-50"
              disabled={loading.submitting || !formData.vendor || !formData.categoryItem}
            >
              {loading.submitting ? (
                <span className="flex items-center gap-2">
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white"></div>
                  {isEditMode ? 'Updating...' : 'Adding...'}
                </span>
              ) : (
                isEditMode ? 'Update Stock' : 'Add Stock'
              )}
            </button>
          </div>
        </div>
      </form>
    </div>
  );
}

export default AddStock;