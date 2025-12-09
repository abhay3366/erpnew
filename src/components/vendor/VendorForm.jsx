'use client';

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { FiSave, FiSearch, FiChevronDown, FiCheck, FiX } from "react-icons/fi";

// ==================== UTILITY FUNCTIONS ====================
const getFullPath = (item, categories) => {
  let path = [item.name];
  let current = item;

  while (current.parentId) {
    const parent = findCategoryById(current.parentId, categories);
    if (parent) {
      path.unshift(parent.name);
      current = parent;
    } else {
      break;
    }
  }

  return path.join(' > ');
};

const findCategoryById = (id, categories) => {
  if (!categories || !Array.isArray(categories)) return null;

  for (let category of categories) {
    if (String(category.id) === String(id)) return category;
    if (category.children) {
      const found = findCategoryById(id, category.children);
      if (found) return found;
    }
  }
  return null;
};

// ==================== SEARCHABLE DROPDOWN COMPONENT ====================
const SearchableDropdown = ({
  label,
  placeholder,
  options,
  selectedIds,
  onSelectionChange,
  isViewMode = false,
  disabled = false,
  type = "category"
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (!event.target.closest('.searchable-dropdown')) {
        setIsOpen(false);
        setSearchTerm("");
      }
    };

    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  // Filter options
  const filteredOptions = useMemo(() => {
    if (!options || !Array.isArray(options)) return [];

    const searchLower = searchTerm.toLowerCase();
    return options.filter(option =>
      option.name.toLowerCase().includes(searchLower) ||
      (option.fullPath && option.fullPath.toLowerCase().includes(searchLower))
    );
  }, [options, searchTerm]);

  const toggleOption = (option) => {
    if (isViewMode || disabled) return;

    const optionId = String(option.id);
    const isSelected = selectedIds.includes(optionId);
    let newSelection;

    if (isSelected) {
      newSelection = selectedIds.filter(id => id !== optionId);
    } else {
      newSelection = [...selectedIds, optionId];
    }

    onSelectionChange(newSelection);
  };

  const getDisplayText = () => {
    if (selectedIds.length === 0) return placeholder;

    const selectedOptions = options.filter(opt => selectedIds.includes(String(opt.id)));
    if (selectedOptions.length === 0) return placeholder;

    if (selectedOptions.length === 1) return selectedOptions[0].name;
    return `${selectedOptions.length} ${type === 'category' ? 'categories' : 'items'} selected`;
  };

  const isSelected = (optionId) => {
    return selectedIds.includes(String(optionId));
  };

  // Get selected options for debugging
  const selectedOptions = useMemo(() => {
    return options.filter(opt => selectedIds.includes(String(opt.id)));
  }, [options, selectedIds]);

  return (
    <div className="relative searchable-dropdown">
      <label className="block text-sm font-medium text-gray-700 mb-2">
        {label} {!isViewMode && <span className="text-red-500">*</span>}
      </label>

      {/* Dropdown Trigger */}
      <button
        type="button"
        onClick={() => {
          if (!isViewMode && !disabled) {
            setIsOpen(!isOpen);
            setSearchTerm("");
          }
        }}
        disabled={isViewMode || disabled}
        className={`w-full flex items-center justify-between p-3 border rounded-lg text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 ${isViewMode || disabled ? 'bg-gray-100 cursor-not-allowed border-gray-300' : 'hover:border-blue-400 border-gray-300'
          }`}
      >
        <span className={`truncate ${selectedIds.length === 0 ? 'text-gray-500' : 'text-gray-800'}`}>
          {getDisplayText()}
        </span>
        <FiChevronDown className={`w-5 h-5 transition-transform ${selectedIds.length === 0 ? 'text-gray-400' : 'text-blue-500'} ${isOpen ? 'rotate-180' : ''}`} />
      </button>

      {/* Debug info */}
      <div className="mt-1 text-xs text-gray-500">
        Selected: {selectedIds.length} | Options: {options.length}
      </div>

      {/* Dropdown Menu */}
      {isOpen && !isViewMode && !disabled && (
        <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
          {/* Search Input */}
          <div className="p-3 border-b border-gray-200 bg-gray-50">
            <div className="relative">
              <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
              <input
                type="text"
                placeholder={`Search ${type === 'category' ? 'categories' : 'items'}...`}
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                autoFocus
              />
            </div>
          </div>

          {/* Options List */}
          <div className="max-h-60 overflow-y-auto">
            {filteredOptions.length === 0 ? (
              <div className="p-4 text-center text-gray-500">
                {searchTerm ? 'No results found' : 'No items available'}
              </div>
            ) : (
              filteredOptions.map((option) => {
                const selected = isSelected(option.id);

                return (
                  <div
                    key={`${type}-${option.id}`}
                    onClick={() => toggleOption(option)}
                    className={`flex items-center p-3 cursor-pointer hover:bg-blue-50 border-b border-gray-100 ${selected ? 'bg-blue-100' : ''
                      }`}
                  >
                    <div className="flex items-center h-5">
                      <input
                        type="checkbox"
                        checked={selected}
                        readOnly
                        className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded mr-3 cursor-pointer"
                      />
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className={`font-medium truncate ${selected ? 'text-blue-700' : 'text-gray-800'}`}>
                        {option.name}
                      </div>
                      {option.fullPath && option.fullPath !== option.name && (
                        <div className="text-xs text-gray-500 truncate mt-1">
                          {option.fullPath}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })
            )}
          </div>

          {/* Close Button */}
          <div className="p-3 border-t border-gray-200 bg-gray-50">
            <button
              type="button"
              onClick={() => {
                setIsOpen(false);
                setSearchTerm("");
              }}
              className="w-full text-center text-sm text-blue-600 hover:text-blue-800"
            >
              Close
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

// ==================== CATEGORY PRODUCT SELECTOR ====================
const CategoryProductSelector = ({
  categories,
  selectedCategoryIds,
  onCategoriesChange,
  selectedProductIds,
  onProductsChange,
  isViewMode = false,
  allProducts = []
}) => {
  console.log('CategoryProductSelector Props:', {
    selectedCategoryIds,
    selectedProductIds,
    categoriesCount: categories?.length,
    productsCount: allProducts?.length
  });

  // Get all categories flat
  const getAllCategories = (cats) => {
    let allCats = [];

    const traverse = (node) => {
      allCats.push(node);
      if (node.children && node.children.length > 0) {
        node.children.forEach(child => traverse(child));
      }
    };

    if (cats && Array.isArray(cats)) {
      cats.forEach(category => traverse(category));
    }
    return allCats;
  };

  // All categories with full path
  const allCategories = useMemo(() => {
    if (!categories || !Array.isArray(categories)) return [];
    return getAllCategories(categories).map(cat => ({
      ...cat,
      fullPath: getFullPath(cat, categories)
    }));
  }, [categories]);

  // Debug all categories
  console.log('All categories:', allCategories.map(c => ({ id: c.id, name: c.name, fullPath: c.fullPath })));

  // Get selected category objects for display - FIXED
  const selectedCategories = useMemo(() => {
    if (!allCategories || !Array.isArray(allCategories)) return [];
    
    const selected = allCategories.filter(cat => 
      selectedCategoryIds.includes(String(cat.id))
    );
    
    console.log('Selected categories found:', selected);
    return selected;
  }, [selectedCategoryIds, allCategories]);

  // Available products based on selected categories
  const availableProducts = useMemo(() => {
    if (selectedCategoryIds.length === 0) return [];

    const products = [];

    if (allProducts && Array.isArray(allProducts)) {
      allProducts.forEach(product => {
        if (!product || !product.id) return;

        const productCategories = product.category || [];
        const productCategoryIds = productCategories.map(id => String(id));
        const selectedCategoryIdsStr = selectedCategoryIds.map(id => String(id));

        // Check if product belongs to any selected category
        const hasMatchingCategory = productCategoryIds.some(catId =>
          selectedCategoryIdsStr.includes(catId)
        );

        if (hasMatchingCategory) {
          // Get full path for the product
          let fullPath = product.productName || product.name || 'Unnamed Product';

          // Try to get category path
          if (productCategories.length > 0) {
            try {
              const primaryCategoryId = productCategories[0];
              const primaryCategory = findCategoryById(primaryCategoryId, categories);
              if (primaryCategory) {
                const categoryPath = getFullPath(primaryCategory, categories);
                fullPath = `${categoryPath} > ${product.productName || product.name}`;
              }
            } catch (err) {
              console.error('Error getting category path:', err);
            }
          }

          const productData = {
            id: String(product.id),
            name: product.productName || product.name || 'Unnamed Product',
            fullPath: fullPath,
            description: product.description || '',
            type: 'product',
            originalProduct: product
          };

          products.push(productData);
        }
      });
    }

    console.log('Available products:', products.length);
    return products;
  }, [selectedCategoryIds, allProducts, categories]);

  // Get selected product objects for display
  const selectedProducts = useMemo(() => {
    const selectedProductIdsStr = selectedProductIds.map(id => String(id));
    return availableProducts.filter(prod => selectedProductIdsStr.includes(String(prod.id)));
  }, [selectedProductIds, availableProducts]);

  // Clear products when categories are cleared
  useEffect(() => {
    if (selectedCategoryIds.length === 0 && selectedProductIds.length > 0) {
      onProductsChange([]);
    }
  }, [selectedCategoryIds.length, selectedProductIds.length, onProductsChange]);

  return (
    <div className="space-y-6">
      <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
        Category & Product Selection
      </h3>

      {/* Categories Selection */}
      <SearchableDropdown
        label="Select Categories"
        placeholder="Click to select categories..."
        options={allCategories}
        selectedIds={selectedCategoryIds}
        onSelectionChange={onCategoriesChange}
        isViewMode={isViewMode}
        type="category"
      />

      {/* Products Selection */}
      <div className={`transition-all duration-300 ${selectedCategoryIds.length > 0 ? 'opacity-100' : 'opacity-50 pointer-events-none'}`}>
        <SearchableDropdown
          label="Select Products"
          placeholder={selectedCategoryIds.length > 0 ? "Click to select products..." : "Please select categories first"}
          options={availableProducts}
          selectedIds={selectedProductIds}
          onSelectionChange={onProductsChange}
          isViewMode={isViewMode}
          disabled={availableProducts.length === 0 || selectedCategoryIds.length === 0}
          type="product"
        />
        {selectedCategoryIds.length > 0 && availableProducts.length === 0 && (
          <p className="text-sm text-gray-500 mt-1">No products available in selected categories</p>
        )}
      </div>

      {/* Selection Summary - ALWAYS SHOW IF THERE ARE SELECTIONS */}
      {(selectedCategoryIds.length > 0 || selectedProductIds.length > 0) && (
        <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg transition-all duration-300">
          <h4 className="text-sm font-medium text-gray-800 mb-3">Selection Summary:</h4>
          <div className="space-y-3">
            {selectedCategoryIds.length > 0 && (
              <div>
                <span className="font-medium text-blue-700">
                  Selected Categories ({selectedCategories.length}):
                </span>
                <div className="mt-2 space-y-1">
                  {selectedCategories.map(cat => (
                    <div key={cat.id} className="text-sm text-gray-700">
                      • {cat.fullPath || cat.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
            {selectedProducts.length > 0 && (
              <div>
                <span className="font-medium text-green-700">
                  Selected Products ({selectedProducts.length}):
                </span>
                <div className="mt-2 space-y-1">
                  {selectedProducts.map(item => (
                    <div key={item.id} className="text-sm text-gray-700">
                      • {item.fullPath || item.name}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
};

// ==================== FORM FIELDS COMPONENT ====================
const FormFields = ({ register, errors, isViewMode = false }) => {
  const inputClasses = `w-full border border-gray-300 rounded-lg px-3 py-2 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;

  return (
    <div className="space-y-6">
      {/* Basic Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          Basic Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vendor Name <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("vendor_name", { required: "Vendor name is required" })}
              className={inputClasses}
              disabled={isViewMode}
            />
            {errors.vendor_name && (
              <p className="text-red-500 text-sm mt-1">{errors.vendor_name.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Vendor Address <span className="text-red-500">*</span>
            </label>
            <textarea
              {...register("vendor_address", { required: "Address is required" })}
              rows={3}
              className={inputClasses}
              disabled={isViewMode}
            />
            {errors.vendor_address && (
              <p className="text-red-500 text-sm mt-1">{errors.vendor_address.message}</p>
            )}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Phone Number <span className="text-red-500">*</span>
              </label>
              <input
                type="text"
                {...register("vendor_phone", {
                  required: "Phone number is required",
                  pattern: {
                    value: /^[0-9]{10}$/,
                    message: "Enter valid 10-digit phone number"
                  }
                })}
                className={inputClasses}
                disabled={isViewMode}
              />
              {errors.vendor_phone && (
                <p className="text-red-500 text-sm mt-1">{errors.vendor_phone.message}</p>
              )}
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Email Address
              </label>
              <input
                type="email"
                {...register("email", {
                  pattern: {
                    value: /.+@.+\..+/,
                    message: "Invalid email address"
                  }
                })}
                className={inputClasses}
                disabled={isViewMode}
              />
              {errors.email && (
                <p className="text-red-500 text-sm mt-1">{errors.email.message}</p>
              )}
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              GSTIN Number
            </label>
            <input
              type="text"
              {...register("gstin_no")}
              className={inputClasses}
              disabled={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Contact Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          Contact Information
        </h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Contact Person <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              {...register("contact_person", { required: "Contact person is required" })}
              className={inputClasses}
              disabled={isViewMode}
            />
            {errors.contact_person && (
              <p className="text-red-500 text-sm mt-1">{errors.contact_person.message}</p>
            )}
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700">
              Authorized Signatory
            </label>
            <input
              type="text"
              {...register("signatory")}
              className={inputClasses}
              disabled={isViewMode}
            />
          </div>
        </div>
      </div>

      {/* Bank Information */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          Bank Information
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Bank Name
            </label>
            <input
              type="text"
              {...register("bank_name")}
              className={inputClasses}
              disabled={isViewMode}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Number
              </label>
              <input
                type="text"
                {...register("account_no")}
                className={inputClasses}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                Account Type
              </label>
              <input
                type="text"
                {...register("account_type")}
                className={inputClasses}
                disabled={isViewMode}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium text-gray-700">
                MICR Code
              </label>
              <input
                type="text"
                {...register("micr_code")}
                className={inputClasses}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                RTGS/IFSC Code
              </label>
              <input
                type="text"
                {...register("rtgs_ifsc_code")}
                className={inputClasses}
                disabled={isViewMode}
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700">
                NEFT/IFSC Code
              </label>
              <input
                type="text"
                {...register("neft_ifsc_code")}
                className={inputClasses}
                disabled={isViewMode}
              />
            </div>
          </div>
        </div>
      </div>

      {/* Status and Blacklisted */}
      <div>
        <h3 className="text-lg font-semibold text-gray-900 border-b pb-2 mb-4">
          Status
        </h3>
        <div className="space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700">
              Status <span className="text-red-500">*</span>
            </label>
            <select
              {...register("status", { required: "Status is required" })}
              className={`w-full border border-gray-300 rounded-lg px-3 py-2 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`}
              disabled={isViewMode}
            >
              <option value="Active">Active</option>
              <option value="Inactive">Inactive</option>
            </select>
            {errors.status && (
              <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
          </div>

          <div className="flex items-center">
            <input
              type="checkbox"
              {...register("blacklisted")}
              id="blacklisted"
              className={`h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded ${isViewMode ? 'cursor-not-allowed' : ''}`}
              disabled={isViewMode}
            />
            <label htmlFor="blacklisted" className="ml-2 block text-sm text-gray-900">
              Mark as Blacklisted
            </label>
          </div>
        </div>
      </div>
    </div>
  );
};

// ==================== VENDOR FORM COMPONENT ====================
const VendorForm = ({ mode = "create", vendor = null, onSuccess }) => {
  console.log('VendorForm loaded with:', { mode, vendor });

  const {
    register,
    handleSubmit,
    formState: { errors },
    setValue,
    reset,
  } = useForm();

  const [loading, setLoading] = useState(false);
  const [selectedCategoryIds, setSelectedCategoryIds] = useState([]);
  const [selectedProductIds, setSelectedProductIds] = useState([]);
  const [categories, setCategories] = useState([]);
  const [products, setProducts] = useState([]);
  const [success, setSuccess] = useState(false);
  const [error, setError] = useState(null);
  const [isDataLoaded, setIsDataLoaded] = useState(false);

  const isViewMode = mode === "view";
  const isCreateMode = mode === "create";
  const isEditMode = mode === "edit";

  // Fetch data
  useEffect(() => {
    fetchData();
  }, []);

  // When categories and products are loaded, prefill form data for edit/view
  useEffect(() => {
    if ((isEditMode || isViewMode) && vendor && categories.length > 0 && products.length > 0) {
      console.log('Prefilling form data...');
      prefillFormData();
    }
  }, [mode, vendor, categories, products]);

  const fetchData = async () => {
    try {
      // Fetch categories
      const categoriesRes = await fetch("http://localhost:5001/categories");
      if (categoriesRes.ok) {
        const categoriesData = await categoriesRes.json();
        setCategories(categoriesData.list || []);
        console.log('Categories loaded:', categoriesData.list?.length || 0);
      }

      // Fetch products
      const productsRes = await fetch("http://localhost:5001/products");
      if (productsRes.ok) {
        const productsData = await productsRes.json();
        setProducts(Array.isArray(productsData) ? productsData : []);
        console.log('Products loaded:', productsData.length || 0);
      }
    } catch (err) {
      console.error("Error fetching data:", err);
      setError("Failed to load data. Please try again.");
    } finally {
      setIsDataLoaded(true);
    }
  };

  // Function to extract IDs from vendor data - COMPLETELY FIXED
  const extractIdsFromVendorData = () => {
    if (!vendor) return;

    console.log('Extracting IDs from vendor:', vendor);

    // Extract category IDs
    let categoryIds = [];
    
    if (vendor.selected_categories && Array.isArray(vendor.selected_categories)) {
      vendor.selected_categories.forEach(cat => {
        console.log('Processing category:', cat);
        
        // Handle different formats
        if (cat && typeof cat === 'object') {
          // Case 1: Object with id property
          if (cat.id !== undefined && cat.id !== null) {
            categoryIds.push(String(cat.id));
            console.log('Added category ID from object:', cat.id);
          }
          // Case 2: Object with _id property (MongoDB style)
          else if (cat._id !== undefined && cat._id !== null) {
            categoryIds.push(String(cat._id));
            console.log('Added category ID from _id:', cat._id);
          }
        } 
        // Case 3: Direct ID (string or number)
        else if (cat !== undefined && cat !== null) {
          categoryIds.push(String(cat));
          console.log('Added category ID directly:', cat);
        }
      });
    }
    
    console.log('Final extracted category IDs:', categoryIds);
    setSelectedCategoryIds(categoryIds);

    // Extract product IDs
    let productIds = [];
    
    if (vendor.selected_products && Array.isArray(vendor.selected_products)) {
      vendor.selected_products.forEach(prod => {
        console.log('Processing product:', prod);
        
        if (prod && typeof prod === 'object') {
          if (prod.id !== undefined && prod.id !== null) {
            productIds.push(String(prod.id));
          } else if (prod._id !== undefined && prod._id !== null) {
            productIds.push(String(prod._id));
          }
        } else if (prod !== undefined && prod !== null) {
          productIds.push(String(prod));
        }
      });
    }
    
    console.log('Final extracted product IDs:', productIds);
    setSelectedProductIds(productIds);
  };

  const prefillFormData = () => {
    if (!vendor) return;

    console.log('Starting to prefill form with vendor data');

    // Reset form first
    reset();

    // Set form values
    const fields = [
      'vendor_name', 'vendor_address', 'vendor_phone', 'gstin_no', 'email',
      'bank_name', 'account_no', 'account_type', 'micr_code', 'rtgs_ifsc_code',
      'neft_ifsc_code', 'signatory', 'contact_person', 'status'
    ];

    fields.forEach(field => {
      if (vendor[field] !== undefined) {
        setValue(field, vendor[field]);
        console.log(`Set ${field}:`, vendor[field]);
      }
    });

    setValue("blacklisted", vendor.blacklisted || false);
    console.log('Set blacklisted:', vendor.blacklisted || false);

    // Extract IDs from vendor data
    extractIdsFromVendorData();
  };

  const onSubmit = async (data) => {
    if (isViewMode) return;

    // Validate categories
    if (selectedCategoryIds.length === 0) {
      setError("Please select at least one category");
      toast.error("Please select at least one category");
      return;
    }

    setLoading(true);
    setError(null);

    try {
      // Prepare vendor data - Ensure all IDs are strings
      const vendorData = {
        ...data,
        // Store only IDs for categories and products as strings
        selected_categories: selectedCategoryIds.map(id => ({ id: String(id) })),
        selected_products: selectedProductIds.map(id => ({ id: String(id) })),
        blacklisted: data.blacklisted || false,
        status: data.status || 'Active'
      };

      console.log('Saving vendor data:', vendorData);

      // Add timestamps for new vendors
      if (isCreateMode) {
        vendorData.id = Date.now().toString();
        vendorData.createdAt = new Date().toISOString();
        vendorData.lastUpdated = new Date().toISOString();
      } else if (isEditMode && vendor) {
        vendorData.id = vendor.id;
        vendorData.createdAt = vendor.createdAt || new Date().toISOString();
        vendorData.lastUpdated = new Date().toISOString();
      }

      // Save to server
      const url = isCreateMode
        ? "http://localhost:5001/vendors"
        : `http://localhost:5001/vendors/${vendor.id}`;

      const method = isCreateMode ? "POST" : "PUT";

      const response = await fetch(url, {
        method,
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(vendorData),
      });

      if (!response.ok) {
        const errorText = await response.text();
        throw new Error(`Failed to save vendor: ${errorText}`);
      }

      // Success
      setSuccess(true);
      toast.success(`${isCreateMode ? "Vendor created successfully!" : "Vendor updated successfully!"}`);
      
      // Call onSuccess callback after a delay
      setTimeout(() => {
        if (onSuccess) onSuccess();
      }, 1500);

    } catch (err) {
      console.error("Error saving vendor:", err);
      setError("Failed to save vendor. Please try again.");
      toast.error("Failed to save vendor. Please try again.");
    } finally {
      setLoading(false);
    }
  };

  // Handle category selection change
  const handleCategoriesChange = (newCategoryIds) => {
    console.log('Categories changed:', newCategoryIds);
    setSelectedCategoryIds(newCategoryIds);
    
    // If categories are cleared, also clear products
    if (newCategoryIds.length === 0 && selectedProductIds.length > 0) {
      setSelectedProductIds([]);
    }
  };

  // Handle product selection change
  const handleProductsChange = (newProductIds) => {
    console.log('Products changed:', newProductIds);
    setSelectedProductIds(newProductIds);
  };

  return (
    <div className="bg-gray-50 min-h-screen p-4">
      <div className="max-w-6xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-900">
            {isCreateMode ? 'Add New Vendor' : isEditMode ? 'Edit Vendor' : 'Vendor Details'}
          </h1>
          {vendor && (
            <p className="text-gray-600 mt-2">
              Vendor ID: {vendor.id} | Mode: {mode}
            </p>
          )}
        </div>

        {/* Success/Error Messages */}
        {success && (
          <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
            <div className="flex items-center text-green-800">
              <FiCheck className="h-5 w-5 mr-2" />
              Vendor {isCreateMode ? 'created' : 'updated'} successfully!
            </div>
          </div>
        )}

        {error && (
          <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
            <div className="flex items-center text-red-800">
              <FiX className="h-5 w-5 mr-2" />
              {error}
            </div>
          </div>
        )}

        {/* Loading State */}
        {!isDataLoaded ? (
          <div className="bg-white shadow rounded-lg p-8 text-center">
            <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
            <p className="mt-4 text-gray-600">Loading vendor data...</p>
          </div>
        ) : (
          <div className="bg-white shadow-lg rounded-2xl p-6">
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
              <div className="flex flex-col lg:flex-row gap-8">
                {/* Left Column - Form Fields */}
                <div className="lg:w-2/3">
                  <FormFields 
                    register={register} 
                    errors={errors} 
                    isViewMode={isViewMode} 
                  />
                </div>

                {/* Right Column - Category & Product Selection */}
                <div className="lg:w-1/3">
                  <CategoryProductSelector
                    categories={categories}
                    selectedCategoryIds={selectedCategoryIds}
                    onCategoriesChange={handleCategoriesChange}
                    selectedProductIds={selectedProductIds}
                    onProductsChange={handleProductsChange}
                    isViewMode={isViewMode}
                    allProducts={products}
                  />
                </div>
              </div>

              {/* Action Buttons */}
              <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                <button
                  type="button"
                  onClick={() => window.history.back()}
                  className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                >
                  {isViewMode ? 'Back' : 'Cancel'}
                </button>

                {!isViewMode && (
                  <button
                    type="submit"
                    disabled={loading || selectedCategoryIds.length === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                  >
                    <FiSave className="w-4 h-4 mr-2" />
                    {loading ? 'Saving...' : isCreateMode ? 'Create Vendor' : 'Update Vendor'}
                  </button>
                )}
              </div>
            </form>
          </div>
        )}
      </div>
    </div>
  );
};

export default VendorForm;