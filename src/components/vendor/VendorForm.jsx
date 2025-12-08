'use client';

import { useEffect, useState, useMemo } from "react";
import { useForm } from "react-hook-form";
import toast from "react-hot-toast";

// SVG Icons
const ArrowLeftIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
);

const SaveIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const SearchIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
    </svg>
);

const ChevronDownIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
    </svg>
);

// Utility Functions
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

// Searchable Dropdown Component
const SearchableDropdown = ({
    label,
    placeholder,
    options,
    selectedOptions,
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

        const isSelected = selectedOptions.some(selected => selected.id === option.id);
        let newSelection;

        if (isSelected) {
            newSelection = selectedOptions.filter(selected => selected.id !== option.id);
        } else {
            newSelection = [...selectedOptions, option];
        }

        onSelectionChange(newSelection);
    };

    const getDisplayText = () => {
        if (selectedOptions.length === 0) return placeholder;
        if (selectedOptions.length === 1) return selectedOptions[0].name;
        return `${selectedOptions.length} ${type === 'category' ? 'categories' : 'items'} selected`;
    };

    return (
        <div className="relative searchable-dropdown">
            <label className="block text-sm font-medium text-gray-700 mb-2">
                {label} {!isViewMode && <span className="text-red-500">*</span>}
            </label>

            {/* Dropdown Trigger */}
            <button
                type="button"
                onClick={() => !isViewMode && !disabled && setIsOpen(!isOpen)}
                disabled={isViewMode || disabled}
                className={`w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isViewMode || disabled ? 'bg-gray-100 cursor-not-allowed' : 'hover:border-gray-400'
                    }`}
            >
                <span className="truncate">{getDisplayText()}</span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 ${isOpen ? 'rotate-180' : ''}`} />
            </button>

            {/* Dropdown Menu */}
            {isOpen && !isViewMode && !disabled && (
                <div className="absolute z-50 w-full mt-1 bg-white border border-gray-300 rounded-lg shadow-lg max-h-80 overflow-hidden">
                    {/* Search Input */}
                    <div className="p-3 border-b border-gray-200 bg-gray-50">
                        <div className="relative">
                            <SearchIcon className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
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
                                const isSelected = selectedOptions.some(selected => selected.id === option.id);

                                return (
                                    <div
                                        key={`${type}-${option.id}`}
                                        onClick={() => toggleOption(option)}
                                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 ${isSelected ? 'bg-blue-50' : ''
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className="h-4 w-4 focus:ring-blue-500 border-gray-300 rounded mr-3 cursor-pointer"
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className="font-medium truncate">
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
                </div>
            )}
        </div>
    );
};

// Category Product Selector Component
const CategoryProductSelector = ({
    categories,
    selectedCategories,
    onCategoriesChange,
    selectedProducts,
    onProductsChange,
    isViewMode = false,
    allProducts = []
}) => {
    // Get all categories flat
    const getAllCategories = (cats) => {
        let allCats = [];

        const traverse = (node) => {
            allCats.push(node);
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => traverse(child));
            }
        };

        cats.forEach(category => traverse(category));
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

    // Available products based on selected categories
    const availableProducts = useMemo(() => {
        if (selectedCategories.length === 0) return [];

        const selectedCategoryIds = selectedCategories.map(cat => String(cat.id));
        const products = [];

        allProducts.forEach(product => {
            if (product.category && Array.isArray(product.category)) {
                const productCategories = product.category.map(id => String(id));

                // Check if product belongs to any selected category
                const hasMatchingCategory = productCategories.some(catId =>
                    selectedCategoryIds.includes(catId)
                );

                if (hasMatchingCategory) {
                    // Get full path for the product
                    let fullPath = product.productName || product.name;
                    if (product.category[0]) {
                        const primaryCategory = findCategoryById(product.category[0], categories);
                        if (primaryCategory) {
                            const categoryPath = getFullPath(primaryCategory, categories);
                            fullPath = `${categoryPath} > ${product.productName || product.name}`;
                        }
                    }

                    products.push({
                        id: product.id,
                        name: product.productName || product.name,
                        fullPath: fullPath,
                        description: product.description || '',
                        type: 'product',
                        originalProduct: product
                    });
                }
            }
        });

        return products;
    }, [selectedCategories, allProducts, categories]);

    // Clear products when categories are cleared
    useEffect(() => {
        if (selectedCategories.length === 0 && selectedProducts.length > 0) {
            onProductsChange([]);
        }
    }, [selectedCategories.length, selectedProducts.length, onProductsChange]);

    return (
        <div className="space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Category & Product Selection
            </h3>

            {/* Categories Selection */}
            <SearchableDropdown
                label="Select Categories"
                placeholder="Search and select categories..."
                options={allCategories}
                selectedOptions={selectedCategories}
                onSelectionChange={onCategoriesChange}
                isViewMode={isViewMode}
                type="category"
            />

            {/* Products Selection */}
            {selectedCategories.length > 0 && (
                <SearchableDropdown
                    label="Select Products"
                    placeholder="Search and select products..."
                    options={availableProducts}
                    selectedOptions={selectedProducts}
                    onSelectionChange={onProductsChange}
                    isViewMode={isViewMode}
                    disabled={availableProducts.length === 0}
                    type="product"
                />
            )}

            {/* Selection Summary */}
            {(selectedCategories.length > 0 || selectedProducts.length > 0) && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Selection Summary:</h4>
                    <div className="space-y-3">
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

// Main Vendor Form Component
export default function VendorForm({ mode = "create", vendor = null,  onSuccess }) {
    const {
        register,
        handleSubmit,
        formState: { errors },
        reset,
        setValue,
    } = useForm();

    const [loading, setLoading] = useState(false);
    const [selectedCategories, setSelectedCategories] = useState([]);
    const [selectedProducts, setSelectedProducts] = useState([]);
    const [categories, setCategories] = useState([]);
    const [products, setProducts] = useState([]);
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);

    const isViewMode = mode === "view";
    const isCreateMode = mode === "create";
    const isEditMode = mode === "edit";

    // Fetch data
    useEffect(() => {
        fetchData();
    }, []);

    // Prefill form data for edit/view
    useEffect(() => {
        if ((isEditMode || isViewMode) && vendor) {
            prefillFormData();
        }
    }, [mode, vendor]);

    const fetchData = async () => {
        try {
            // Fetch categories
            const categoriesRes = await fetch("http://localhost:5001/categories");
            if (categoriesRes.ok) {
                const categoriesData = await categoriesRes.json();
                setCategories(categoriesData.list || []);
            }

            // Fetch products
            const productsRes = await fetch("http://localhost:5001/products");
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                setProducts(Array.isArray(productsData) ? productsData : []);
            }
        } catch (err) {
            console.error("Error fetching data:", err);
        }
    };

    const prefillFormData = () => {
        if (!vendor) return;

        // Set form values
        const fields = [
            'vendor_name', 'vendor_address', 'vendor_phone', 'gstin_no', 'email',
            'bank_name', 'account_no', 'account_type', 'micr_code', 'rtgs_ifsc_code',
            'neft_ifsc_code', 'signatory', 'contact_person', 'status'
        ];

        fields.forEach(field => {
            if (vendor[field] !== undefined) {
                setValue(field, vendor[field]);
            }
        });

        setValue("blacklisted", vendor.blacklisted || false);

        // Set categories and products
        if (vendor.selected_categories) {
            setSelectedCategories(vendor.selected_categories);
        }
        if (vendor.selected_products) {
            setSelectedProducts(vendor.selected_products);
        }
    };

    const onSubmit = async (data) => {
        if (isViewMode) return;

        // Validate categories
        if (selectedCategories.length === 0) {
            setError("Please select at least one category");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            // Prepare vendor data
            const vendorData = {
                ...data,
                selected_categories: selectedCategories,
                selected_products: selectedProducts,
                blacklisted: data.blacklisted || false,
                status: data.status || 'Active'
            };

            // Add timestamps for new vendors
            if (isCreateMode) {
                vendorData.id = Date.now().toString();
                vendorData.createdAt = new Date().toISOString();
                vendorData.lastUpdated = new Date().toISOString();
            } else if (isEditMode && vendor) {
                vendorData.id = vendor.id;
                vendorData.createdAt = vendor.createdAt;
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

            if (!response.ok) throw new Error("Failed to save vendor");

            // Success
            setSuccess(true);
            setTimeout(() => {
                if (onSuccess) onSuccess();
            }, 1000);
            toast.success(`${isCreateMode ? "Vendor created SuccessFully" : "Vendor Edit SuccessFully"}`)

        } catch (err) {
            console.error("Error saving vendor:", err);
            setError("Failed to save vendor. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    // Form fields component
    const FormFields = () => {
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

    return (
        <div className="bg-gray-50 min-h-screen p-4">
            <div className="max-w-6xl mx-auto">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-900">
                        {isCreateMode ? 'Add New Vendor' : isEditMode ? 'Edit Vendor' : 'Vendor Details'}
                    </h1>
                </div>

                {/* Success/Error Messages */}
                {success && (
                    <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                        <div className="flex items-center text-green-800">
                            <SaveIcon className="h-5 w-5 mr-2" />
                            Vendor {isCreateMode ? 'created' : 'updated'} successfully!
                        </div>
                    </div>
                )}

                {error && (
                    <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                        <div className="flex items-center text-red-800">
                            <svg className="h-5 w-5 mr-2" viewBox="0 0 20 20" fill="currentColor">
                                <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
                            </svg>
                            {error}
                        </div>
                    </div>
                )}

                {/* Loading State */}
                {loading && !categories.length && !isEditMode && !isViewMode ? (
                    <div className="bg-white shadow rounded-lg p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading data...</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-lg rounded-2xl p-6">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-8">
                            <div className="flex flex-col lg:flex-row gap-8">
                                {/* Left Column - Form Fields */}
                                <div className="lg:w-2/3">
                                    <FormFields />
                                </div>

                                {/* Right Column - Category & Product Selection */}
                                <div className="lg:w-1/3">
                                    <CategoryProductSelector
                                        categories={categories}
                                        selectedCategories={selectedCategories}
                                        onCategoriesChange={setSelectedCategories}
                                        selectedProducts={selectedProducts}
                                        onProductsChange={setSelectedProducts}
                                        isViewMode={isViewMode}
                                        allProducts={products}
                                    />
                                </div>
                            </div>

                            {/* Action Buttons */}
                            <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
                                <button
                                    type="button"
                                    className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50"
                                >
                                    {isViewMode ? 'Back' : 'Cancel'}
                                </button>

                                {!isViewMode && (
                                    <button
                                        type="submit"
                                        disabled={loading || selectedCategories.length === 0}
                                        className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
                                    >
                                        <SaveIcon className="w-4 h-4 mr-2" />
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
}