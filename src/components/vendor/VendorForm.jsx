'use client';

import { useEffect, useState, useCallback, useMemo } from "react";
import { useForm } from "react-hook-form";

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

const CheckIcon = ({ className = "" }) => (
    <svg className={className} fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const ErrorIcon = ({ className = "" }) => (
    <svg className={className} viewBox="0 0 20 20" fill="currentColor">
        <path fillRule="evenodd" d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z" clipRule="evenodd" />
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

// ==================== UTILITY FUNCTIONS ====================

// Get full path for an item
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

// Find category by ID
const findCategoryById = (id, categories) => {
    if (!categories || !Array.isArray(categories)) return null;

    for (let category of categories) {
        // Compare as string to handle both string and number IDs
        if (String(category.id) === String(id)) return category;
        if (category.children) {
            const found = findCategoryById(id, category.children);
            if (found) return found;
        }
    }
    return null;
};

// Find all child category IDs recursively
const getAllChildCategoryIds = (category) => {
    let ids = [String(category.id)];

    const traverse = (node) => {
        ids.push(String(node.id));
        if (node.children && node.children.length > 0) {
            node.children.forEach(child => traverse(child));
        }
    };

    if (category.children && category.children.length > 0) {
        category.children.forEach(child => traverse(child));
    }

    return ids;
};

// Generate unique key for options - FIXED TO HANDLE DUPLICATES
const generateUniqueKey = (option, type, index = 0) => {
    return `${type}-${option.id}-${option.name}-${index}`;
};

// ==================== COMPONENT FUNCTIONS ====================

// Form Header Component
const FormHeader = ({ mode, vendor, onBack }) => {
    const getTitle = () => {
        switch (mode) {
            case "create": return "Add New Vendor";
            case "edit": return "Edit Vendor";
            case "view": return "Vendor Details";
            default: return "Vendor";
        }
    };

    const getSubtitle = () => {
        switch (mode) {
            case "create": return "Create a new vendor account with complete information";
            case "edit": return `Update vendor information for ${vendor?.vendor_name || ''}`;
            case "view": return `Complete details about ${vendor?.vendor_name || 'the vendor'}`;
            default: return "";
        }
    };

    return (
        <div className="mb-8">
            <button
                onClick={onBack}
                className="inline-flex items-center text-sm font-medium text-blue-600 hover:text-blue-500 mb-4"
            >
                <ArrowLeftIcon className="w-4 h-4 mr-2" />
                Back to Vendors List
            </button>
            <div>
                <h1 className="text-3xl font-bold text-gray-900">{getTitle()}</h1>
                <p className="mt-2 text-sm text-gray-600">{getSubtitle()}</p>
                {(mode === "edit" || mode === "view") && vendor && (
                    <p className="mt-1 text-sm text-gray-500">
                        Vendor ID: {vendor.id} | Created: {new Date(vendor.createdAt).toLocaleDateString()}
                    </p>
                )}
            </div>
        </div>
    );
};

// Success/Error Messages Component
const FormMessages = ({ success, error, mode }) => {
    if (!success && !error) return null;

    return (
        <>
            {success && (
                <div className="mb-6 bg-green-50 border border-green-200 rounded-lg p-4">
                    <div className="flex">
                        <SaveIcon className="h-5 w-5 text-green-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-green-800">Success</h3>
                            <p className="text-sm text-green-700 mt-1">
                                Vendor {mode === 'create' ? 'created' : 'updated'} successfully!
                            </p>
                        </div>
                    </div>
                </div>
            )}

            {error && (
                <div className="mb-6 bg-red-50 border border-red-200 rounded-lg p-4">
                    <div className="flex">
                        <ErrorIcon className="h-5 w-5 text-red-400 mr-3" />
                        <div>
                            <h3 className="text-sm font-medium text-red-800">Error</h3>
                            <p className="text-sm text-red-700 mt-1">{error}</p>
                        </div>
                    </div>
                </div>
            )}
        </>
    );
};

// Searchable Dropdown Component - FIXED WITH UNIQUE KEYS
const SearchableDropdown = ({
    label,
    placeholder,
    options,
    selectedOptions,
    onSelectionChange,
    isViewMode = false,
    disabled = false,
    type = "category",
    hasNoData = false
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

    // Improved search filter with useMemo - REMOVE DUPLICATES
    const filteredOptions = useMemo(() => {
        if (!options || !Array.isArray(options)) return [];

        const searchLower = searchTerm.toLowerCase();

        // First filter by search term
        let filtered = options.filter(option => {
            return (
                option.name.toLowerCase().includes(searchLower) ||
                (option.fullPath && option.fullPath.toLowerCase().includes(searchLower)) ||
                (option.description && option.description.toLowerCase().includes(searchLower)) ||
                (option.parentId && option.parentId.toString().includes(searchTerm))
            );
        });

        // Remove duplicates based on id
        const uniqueOptions = [];
        const seenIds = new Set();

        for (const option of filtered) {
            if (!seenIds.has(option.id)) {
                seenIds.add(option.id);
                uniqueOptions.push(option);
            }
        }

        return uniqueOptions;
    }, [options, searchTerm]);

    const toggleOption = useCallback((option) => {
        if (isViewMode || disabled) return;

        const isSelected = selectedOptions.some(selected => selected.id === option.id);
        let newSelection;

        if (isSelected) {
            newSelection = selectedOptions.filter(selected => selected.id !== option.id);
        } else {
            newSelection = [...selectedOptions, option];
        }

        onSelectionChange(newSelection);
    }, [selectedOptions, onSelectionChange, isViewMode, disabled]);

    const getDisplayText = useCallback(() => {
        if (selectedOptions.length === 0) return placeholder;
        if (selectedOptions.length === 1) return selectedOptions[0].name;
        return `${selectedOptions.length} ${type === 'category' ? 'categories' : 'items'} selected`;
    }, [selectedOptions, placeholder, type]);

    const clearSearch = useCallback(() => {
        setSearchTerm("");
    }, []);

    // Remove duplicates from selected options for display
    const uniqueSelectedOptions = useMemo(() => {
        const seenIds = new Set();
        return selectedOptions.filter(option => {
            if (seenIds.has(option.id)) {
                return false;
            }
            seenIds.add(option.id);
            return true;
        });
    }, [selectedOptions]);

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
                className={`w-full flex items-center justify-between p-3 border border-gray-300 rounded-lg text-left bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-blue-500 ${isViewMode || disabled ? 'bg-gray-100 cursor-not-allowed text-gray-500' : 'hover:border-gray-400 text-gray-900'
                    }`}
            >
                <span className="truncate">
                    {getDisplayText()}
                </span>
                <ChevronDownIcon className={`w-5 h-5 text-gray-400 transition-transform ${isOpen ? 'rotate-180' : ''}`} />
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
                                className="w-full pl-10 pr-10 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500 bg-white"
                                autoFocus
                            />
                            {searchTerm && (
                                <button
                                    type="button"
                                    onClick={clearSearch}
                                    className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-gray-600"
                                >
                                    ×
                                </button>
                            )}
                        </div>
                    </div>

                    {/* Options List */}
                    <div className="max-h-60 overflow-y-auto">
                        {hasNoData && options.length === 0 ? (
                            <div className="p-6 text-center">
                                <div className="text-gray-400 mb-2">
                                    <svg className="w-12 h-12 mx-auto" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1} d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                                    </svg>
                                </div>
                                <div className="text-gray-500 text-sm">
                                    No Item available for selected categories
                                </div>
                            </div>
                        ) : filteredOptions.length === 0 ? (
                            <div className="p-4 text-center text-gray-500">
                                {searchTerm ? 'No results found' : `No ${type === 'category' ? 'categories' : 'items'} available`}
                            </div>
                        ) : (
                            filteredOptions.map((option, index) => {
                                const isSelected = selectedOptions.some(selected => selected.id === option.id);
                                const isProduct = option.isProduct || option.type === 'product';

                                return (
                                    <div
                                        key={generateUniqueKey(option, type, index)}
                                        onClick={() => toggleOption(option)}
                                        className={`flex items-center p-3 cursor-pointer hover:bg-gray-50 border-b border-gray-100 last:border-b-0 transition-colors ${isSelected ? (isProduct ? 'bg-green-50 border-green-200' : 'bg-blue-50 border-blue-200') : ''
                                            }`}
                                    >
                                        <input
                                            type="checkbox"
                                            checked={isSelected}
                                            readOnly
                                            className={`h-4 w-4 focus:ring-blue-500 border-gray-300 rounded mr-3 cursor-pointer ${isProduct ? 'text-green-600' : 'text-blue-600'}`}
                                        />
                                        <div className="flex-1 min-w-0">
                                            <div className={`font-medium truncate ${isSelected ? (isProduct ? 'text-green-800' : 'text-blue-800') : 'text-gray-800'}`}>
                                                {option.name}
                                            </div>
                                            {option.fullPath && option.fullPath !== option.name && (
                                                <div className="text-xs text-gray-500 truncate mt-1">
                                                    {option.fullPath}
                                                </div>
                                            )}
                                            {option.description && (
                                                <div className="text-xs text-gray-400 truncate mt-1">
                                                    {option.description}
                                                </div>
                                            )}
                                            {/* {isProduct && (
                                                <div className="text-xs text-green-600 mt-1">
                                                    Product
                                                </div>
                                            )} */}
                                        </div>
                                    </div>
                                );
                            })
                        )}
                    </div>

                    {/* Footer with selection info */}
                    <div className="p-2 border-t border-gray-200 bg-gray-50">
                        <div className="text-xs text-gray-500 text-center">
                            {hasNoData && options.length === 0 ? 'No Item found' : `${filteredOptions.length} ${type === 'category' ? 'categories' : 'items'} found`}
                            {uniqueSelectedOptions.length > 0 && ` • ${uniqueSelectedOptions.length} selected`}
                        </div>
                    </div>
                </div>
            )}
        </div>
    );
};

// Category and Product Selector Component - UPDATED
const CategoryProductSelector = ({
    categories,
    selectedCategories,
    onCategoriesChange,
    selectedProducts,
    onProductsChange,
    isViewMode = false,
    vendor,
    allProducts = []
}) => {
    // Memoize getAllCategories function
    const getAllCategories = useCallback((cats) => {
        let allCats = [];

        const traverse = (node) => {
            allCats.push(node);
            if (node.children && node.children.length > 0) {
                node.children.forEach(child => traverse(child));
            }
        };

        cats.forEach(category => traverse(category));
        return allCats;
    }, []);

    // Memoize all categories - REMOVE DUPLICATES
    const allCategories = useMemo(() => {
        if (!categories || !Array.isArray(categories)) return [];

        const categoriesList = getAllCategories(categories);
        const uniqueCategories = [];
        const seenIds = new Set();

        for (const category of categoriesList) {
            if (!seenIds.has(category.id)) {
                seenIds.add(category.id);
                // Add full path for better display
                uniqueCategories.push({
                    ...category,
                    fullPath: getFullPath(category, categories)
                });
            }
        }

        return uniqueCategories;
    }, [categories, getAllCategories]);

    // Get all category IDs from selected categories (including children)
    const getAllSelectedCategoryIds = useMemo(() => {
        const categoryIds = new Set();

        selectedCategories.forEach(cat => {
            const category = findCategoryById(cat.id, categories);
            if (category) {
                // Add the category itself
                categoryIds.add(String(category.id));

                // Add all children recursively
                const childIds = getAllChildCategoryIds(category);
                childIds.forEach(id => categoryIds.add(id));
            } else {
                // If category not found in tree, just add the ID
                categoryIds.add(String(cat.id));
            }
        });

        return Array.from(categoryIds);
    }, [selectedCategories, categories]);

    // Memoize available items (products only) - UPDATED
    const availableItems = useMemo(() => {
        const items = [];
        const seenIds = new Set();

        if (selectedCategories.length === 0) return items;

        // Get all selected category IDs
        const selectedCategoryIds = getAllSelectedCategoryIds;

        // Filter products that belong to selected categories
        allProducts.forEach(product => {
            // Check if product has categories array
            if (product.category && Array.isArray(product.category)) {
                const productCategories = product.category.map(id => String(id));

                // Check if ANY of the product's categories match selected categories
                const hasMatchingCategory = productCategories.some(catId =>
                    selectedCategoryIds.includes(catId)
                );

                if (hasMatchingCategory && !seenIds.has(product.id)) {
                    seenIds.add(product.id);

                    // Get product's primary category for full path
                    let fullPath = product.productName || product.name;
                    if (product.category[0]) {
                        const primaryCategory = findCategoryById(product.category[0], categories);
                        if (primaryCategory) {
                            const categoryPath = getFullPath(primaryCategory, categories);
                            fullPath = `${categoryPath} > ${product.productName || product.name}`;
                        }
                    }

                    items.push({
                        id: product.id,
                        name: product.productName || product.name,
                        fullPath: fullPath,
                        description: product.description || '',
                        type: 'product',
                        isProduct: true,
                        originalProduct: product // Store original product data
                    });
                }
            }
        });

        return items;
    }, [selectedCategories, categories, allProducts, getAllSelectedCategoryIds]);

    // Check if selected categories have any products
    const hasProductsForSelectedCategories = useMemo(() => {
        if (selectedCategories.length === 0) return true; // Don't show "no data" when no categories selected

        const selectedCategoryIds = getAllSelectedCategoryIds;

        // Check if any product exists for these categories
        return allProducts.some(product => {
            if (product.category && Array.isArray(product.category)) {
                const productCategories = product.category.map(id => String(id));
                return productCategories.some(catId =>
                    selectedCategoryIds.includes(catId)
                );
            }
            return false;
        });
    }, [selectedCategories, allProducts, getAllSelectedCategoryIds]);

    // Remove duplicate items from selected items
    const uniqueSelectedItems = useMemo(() => {
        const seenIds = new Set();
        return selectedProducts.filter(item => {
            if (seenIds.has(item.id)) {
                return false;
            }
            seenIds.add(item.id);
            return true;
        });
    }, [selectedProducts]);

    // Separate useEffect for cleaning up invalid items
    useEffect(() => {
        if (selectedProducts.length === 0) return;

        // Filter out items that are no longer available
        const validItems = selectedProducts.filter(item =>
            availableItems.some(avail => avail.id === item.id)
        );

        // Remove duplicates from valid items
        const seenIds = new Set();
        const uniqueValidItems = validItems.filter(item => {
            if (seenIds.has(item.id)) {
                return false;
            }
            seenIds.add(item.id);
            return true;
        });

        // Only update if there are changes
        if (uniqueValidItems.length !== selectedProducts.length) {
            onProductsChange(uniqueValidItems);
        }
    }, [availableItems, selectedProducts, onProductsChange]);

    // Clear items when categories are cleared
    useEffect(() => {
        if (selectedCategories.length === 0 && selectedProducts.length > 0) {
            onProductsChange([]);
        }
    }, [selectedCategories.length, selectedProducts.length, onProductsChange]);

    return (
        <div className="md:col-span-2 space-y-6">
            <h3 className="text-lg font-semibold text-gray-900 border-b pb-2">
                Category & Item Selection
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

            {/* Products Selection - Only show actual products from JSON */}
            {selectedCategories.length > 0 && (
                <SearchableDropdown
                    label="Select Items"
                    placeholder={
                        hasProductsForSelectedCategories
                            ? "Search and select Items..."
                            : "No  Item available for selected categories"
                    }
                    options={availableItems}
                    selectedOptions={selectedProducts}
                    onSelectionChange={onProductsChange}
                    isViewMode={isViewMode}
                    disabled={!hasProductsForSelectedCategories}
                    type="product"
                    hasNoData={!hasProductsForSelectedCategories && selectedCategories.length > 0}
                />
            )}

            {/* Show Selection Summary */}
            {(selectedCategories.length > 0 || uniqueSelectedItems.length > 0) && (
                <div className="p-4 bg-gray-50 border border-gray-200 rounded-lg">
                    <h4 className="text-sm font-medium text-gray-800 mb-3">Selection Summary:</h4>
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm">
                        <div>
                            <span className="font-medium text-blue-700">Selected Categories ({selectedCategories.length}):</span>
                            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                {selectedCategories.map((cat, index) => {
                                    // Check if this category has products
                                    const categoryHasProducts = allProducts.some(product => {
                                        if (product.category && Array.isArray(product.category)) {
                                            return product.category.some(catId =>
                                                String(catId) === String(cat.id)
                                            );
                                        }
                                        return false;
                                    });

                                    return (
                                        <div key={generateUniqueKey(cat, 'summary-cat', index)} className="flex items-center text-gray-700">
                                            <span className={`w-2 h-2 rounded-full mr-2 flex-shrink-0 ${categoryHasProducts ? 'bg-green-500' : 'bg-yellow-500'}`}></span>
                                            <div className="flex-1 min-w-0">
                                                <span className="truncate">{cat.fullPath || cat.name}</span>
                                                {!categoryHasProducts && (
                                                    <span className="ml-2 text-xs text-yellow-600">(No products)</span>
                                                )}
                                            </div>
                                        </div>
                                    );
                                })}
                            </div>
                        </div>
                        <div>
                            <span className="font-medium text-green-700">Selected Products ({uniqueSelectedItems.length}):</span>
                            <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
                                {uniqueSelectedItems.length > 0 ? (
                                    uniqueSelectedItems.map((item, index) => (
                                        <div key={generateUniqueKey(item, 'summary-item', index)} className="flex items-center text-gray-700">
                                            <span className="w-2 h-2 bg-green-500 rounded-full mr-2 flex-shrink-0"></span>
                                            <div className="flex-1 min-w-0">
                                                <span className="truncate">{item.fullPath || item.name}</span>
                                                <span className="ml-2 text-xs text-green-600">(Product)</span>
                                            </div>
                                        </div>
                                    ))
                                ) : (
                                    <div className="text-gray-500 italic">
                                        No products selected
                                    </div>
                                )}
                            </div>
                        </div>
                    </div>

                    {/* Information about product availability */}
                    {selectedCategories.length > 0 && !hasProductsForSelectedCategories && (
                        <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                            <div className="flex items-center">
                                <svg className="w-5 h-5 text-yellow-500 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.998-.833-2.732 0L4.732 16.5c-.77.833.192 2.5 1.732 2.5z" />
                                </svg>
                                <span className="text-sm text-yellow-700">
                                    No products found for the selected categories. Products will appear here when they are added to the selected categories.
                                </span>
                            </div>
                        </div>
                    )}
                </div>
            )}
        </div>
    );
};

{/* // Form Fields Component */}
const FormFields = ({ register, errors, isViewMode = false, mode = "create" }) => {
    const inputClasses = `w-full border border-gray-300 rounded-lg px-3 py-2 ${isViewMode ? 'bg-gray-100 cursor-not-allowed' : 'bg-white'}`;
    const selectClasses = `${inputClasses} ${isViewMode ? 'cursor-not-allowed' : 'cursor-pointer'}`;

    const renderFormField = (label, name, type = "text", required = true, validation = {}, placeholder = "") => (
        <div>
            <label className="block text-[0.8em] font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <input
                type={type}
                {...register(name, { required: required ? `${label} is required` : false, ...validation })}
                className={inputClasses}
                placeholder={placeholder}
                disabled={isViewMode}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );

    const renderTextArea = (label, name, required = true, placeholder = "", rows = 3) => (
        <div className="md:col-span-2">
            <label className="block text-sm font-medium text-gray-700">
                {label} {required && <span className="text-red-500">*</span>}
            </label>
            <textarea
                {...register(name, { required: required ? `${label} is required` : false })}
                rows={rows}
                className={inputClasses}
                placeholder={placeholder}
                disabled={isViewMode}
            />
            {errors[name] && (
                <p className="text-red-500 text-sm mt-1">{errors[name].message}</p>
            )}
        </div>
    );

    const renderStatusField = () => (
        <div>
            <label className="block text-sm font-medium text-gray-700">
                Status <span className="text-red-500">*</span>
            </label>
            <select
                {...register("status", { required: "Status is required" })}
                className={selectClasses}
                disabled={isViewMode}
            >
                <option value="">Select Status</option>
                <option value="Active">Active</option>
                <option value="Inactive">Inactive</option>
            </select>
            {errors.status && (
                <p className="text-red-500 text-sm mt-1">{errors.status.message}</p>
            )}
        </div>
    );

    const renderBlacklistedCheckbox = () => (
        <div className="md:col-span-2">
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
            <p className="mt-1 text-sm text-gray-500">
                Blacklisted vendors will be restricted from certain operations.
            </p>
        </div>
    );

    return (
        <div className="space-y-6">
            {renderFormField("Vendor Name", "vendor_name", "text", true, {}, "Enter vendor name")}
            {renderTextArea("Vendor Address", "vendor_address", true, "Enter complete address")}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField(
                    "Phone Number",
                    "vendor_phone",
                    "text",
                    true,
                    { pattern: { value: /^[0-9]{10}$/, message: "Enter valid 10-digit phone number" } },
                    "Enter 10-digit phone number"
                )}

                {renderFormField(
                    "Email Address",
                    "email",
                    "email",
                    true,
                    { pattern: { value: /.+@.+\..+/, message: "Invalid email address" } },
                    "Enter email address"
                )}
            </div>

       
                {renderFormField("GSTIN Number", "gstin_no", "text", true, {}, "Enter GSTIN number")}
   

            {renderStatusField()}

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField("Contact Person", "contact_person", "text", true, {}, "Enter contact person name")}
                {renderFormField("Authorized Signatory", "signatory", "text", true, {}, "Enter authorized signatory name")}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                {renderFormField("Bank Name", "bank_name", "text", true, {}, "Enter bank name")}

                {renderFormField(
                    "Account Number",
                    "account_no",
                    "text",
                    true,
                    { pattern: { value: /^[0-9]{8,18}$/, message: "Invalid account number" } },
                    "Enter account number"
                )}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {renderFormField("Account Type", "account_type", "text", true, {}, "e.g., Savings, Current")}
                {renderFormField("MICR Code", "micr_code", "text", false, {}, "Enter MICR code")}
                {renderFormField("RTGS/IFSC Code", "rtgs_ifsc_code", "text", true, {}, "Enter RTGS/IFSC code")}
            </div>

            {renderFormField("NEFT/IFSC Code", "neft_ifsc_code", "text", true, {}, "Enter NEFT/IFSC code")}

            {renderBlacklistedCheckbox()}
        </div>
    );
};

{/* // Action Buttons Component */}
const ActionButtons = ({ mode, loading, selectedCategoriesCount, onBack }) => {
    const isViewMode = mode === "view";
    const isCreateMode = mode === "create";

    const getButtonText = () => {
        return loading
            ? `${isCreateMode ? 'Creating' : 'Updating'} Vendor...`
            : `${isCreateMode ? 'Create' : 'Update'} Vendor`;
    };

    return (
        <div className="flex justify-end space-x-4 pt-6 border-t border-gray-200">
            <button
                type="button"
                onClick={() => onBack()}
                className="px-6 py-3 border border-gray-300 text-sm font-medium rounded-lg text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 transition-colors"
            >
                {isViewMode ? 'Back' : 'Cancel'}
            </button>

            {!isViewMode && (
                <button
                    type="submit"
                    disabled={loading || selectedCategoriesCount === 0}
                    className="inline-flex items-center px-6 py-3 border border-transparent text-sm font-medium rounded-lg text-white bg-blue-600 hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
                >
                    <SaveIcon className="w-4 h-4 mr-2" />
                    {getButtonText()}
                </button>
            )}
        </div>
    );
};

{/* // ==================== MAIN VENDOR FORM COMPONENT ==================== */}
export default function VendorForm({ mode = "create", vendor = null, onBack, onSuccess }) {
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
    const [products, setProducts] = useState([]); // New state for products
    const [success, setSuccess] = useState(false);
    const [error, setError] = useState(null);
    const [hasFetchedData, setHasFetchedData] = useState(false);

    // Constants for mode checking
    const isViewMode = mode === "view";
    const isCreateMode = mode === "create";
    const isEditMode = mode === "edit";

    // ==================== EFFECTS ====================

    // Fetch all data (categories + products)
    useEffect(() => {
        if (!hasFetchedData) {
            fetchAllData();
        }
    }, [hasFetchedData]);

    // Prefill form data
    useEffect(() => {
        if ((isEditMode || isViewMode) && vendor) {
            prefillFormData();
        }
    }, [mode, vendor, setValue]);

    // ==================== DATA FETCHING FUNCTIONS ====================

    const fetchAllData = async () => {
        try {
            setLoading(true);

            // Fetch categories and products in parallel
            const [categoriesRes, productsRes] = await Promise.all([
                fetch("http://localhost:5001/categories"),
                fetch("http://localhost:5001/products")
            ]);

            if (!categoriesRes.ok) {
                throw new Error("Failed to fetch categories");
            }

            const categoriesData = await categoriesRes.json();

            // Extract categories list
            const categoriesList = categoriesData.list || [];
            setCategories(categoriesList);

            // Fetch products (handle gracefully if endpoint doesn't exist)
            let productList = [];
            if (productsRes.ok) {
                const productsData = await productsRes.json();
                productList = Array.isArray(productsData) ? productsData : [];
            } else {
                console.warn("Products endpoint not available, using empty list");
            }

            setProducts(productList);
            setHasFetchedData(true);
        } catch (err) {
            console.error("Error fetching data:", err);
            setError("Failed to load data. Please try again.");
        } finally {
            setLoading(false);
        }
    };

    const saveToServer = async (vendorData, method, url) => {
        const response = await fetch(url, {
            method: method,
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(vendorData),
        });

        if (!response.ok) throw new Error("Failed to save data to JSON Server");
        return await response.json();
    };

    // ==================== FORM FUNCTIONS ====================

    const prefillFormData = () => {
        if (!vendor) return;

        setValue("vendor_name", vendor.vendor_name || "");
        setValue("vendor_address", vendor.vendor_address || "");
        setValue("vendor_phone", vendor.vendor_phone || "");
        setValue("gstin_no", vendor.gstin_no || "");
        setValue("email", vendor.email || "");
        setValue("bank_name", vendor.bank_name || "");
        setValue("account_no", vendor.account_no || "");
        setValue("account_type", vendor.account_type || "");
        setValue("micr_code", vendor.micr_code || "");
        setValue("rtgs_ifsc_code", vendor.rtgs_ifsc_code || "");
        setValue("neft_ifsc_code", vendor.neft_ifsc_code || "");
        setValue("signatory", vendor.signatory || "");
        setValue("contact_person", vendor.contact_person || "");
        setValue("blacklisted", vendor.blacklisted || false);
        setValue("status", vendor.status || "Active");

        // Set selected categories and products from vendor data
        if (vendor.selected_categories && Array.isArray(vendor.selected_categories)) {
            setSelectedCategories(vendor.selected_categories);
        }
        if (vendor.selected_products && Array.isArray(vendor.selected_products)) {
            setSelectedProducts(vendor.selected_products);
        }
    };

    const prepareVendorData = (data) => {
        // Remove duplicate categories
        const uniqueCategories = [];
        const seenCategoryIds = new Set();
        for (const cat of selectedCategories) {
            if (!seenCategoryIds.has(cat.id)) {
                seenCategoryIds.add(cat.id);
                uniqueCategories.push(cat);
            }
        }

        // Remove duplicate products
        const uniqueItems = [];
        const seenItemIds = new Set();
        for (const item of selectedProducts) {
            if (!seenItemIds.has(item.id)) {
                seenItemIds.add(item.id);
                uniqueItems.push(item);
            }
        }

        const vendorData = {
            ...data,
            vendor_name: data.vendor_name,
            vendor_address: data.vendor_address,
            vendor_phone: data.vendor_phone,
            gstin_no: data.gstin_no,
            email: data.email,
            bank_name: data.bank_name,
            account_no: data.account_no,
            account_type: data.account_type,
            micr_code: data.micr_code,
            rtgs_ifsc_code: data.rtgs_ifsc_code,
            neft_ifsc_code: data.neft_ifsc_code,
            signatory: data.signatory,
            contact_person: data.contact_person,
            blacklisted: data.blacklisted || false,
            status: data.status || 'Active',
            // Multi-select categories and items (unique)
            selected_categories: uniqueCategories,
            selected_products: uniqueItems,
            selected_items_display: [
                ...uniqueCategories.map(cat => `Category: ${cat.fullPath || cat.name}`),
                ...uniqueItems.map(item => `Product: ${item.fullPath || item.name}`)
            ].join(', ')
        };

        if (isCreateMode) {
            vendorData.id = Date.now().toString();
            vendorData.createdAt = new Date().toISOString();
            vendorData.lastUpdated = new Date().toISOString();
        } else if (isEditMode && vendor) {
            vendorData.id = vendor.id;
            vendorData.createdAt = vendor.createdAt;
            vendorData.status = data.status || vendor.status || 'Active';
            vendorData.blacklisted = data.blacklisted || false;
            vendorData.lastUpdated = new Date().toISOString();
        }

        return vendorData;
    };

    const onSubmit = async (data) => {
        if (isViewMode) return;

        // Validate at least one category is selected
        if (selectedCategories.length === 0) {
            setError("Please select at least one category");
            return;
        }

        setLoading(true);
        setError(null);

        try {
            const vendorData = prepareVendorData(data);
            console.log(`${isCreateMode ? 'Creating' : 'Updating'} vendor:`, vendorData);

            let success = false;

            if (isCreateMode) {
                const result = await saveToServer(vendorData, "POST", "http://localhost:5001/vendors");
                console.log("Vendor created successfully:", result);
                success = true;
                if (success) {
                    reset();
                    setSelectedCategories([]);
                    setSelectedProducts([]);
                }
            } else if (isEditMode && vendor) {
                const result = await saveToServer(vendorData, "PUT", `http://localhost:5001/vendors/${vendor.id}`);
                console.log("Vendor updated successfully:", result);
                success = true;
            }

            if (success) {
                setSuccess(true);
                setTimeout(() => {
                    if (onSuccess) onSuccess();
                }, 1500);
            }

        } catch (err) {
            console.error(`Error ${isCreateMode ? 'creating' : 'updating'} vendor:`, err);
            setError(`Error ${isCreateMode ? 'creating' : 'updating'} vendor data. Please try again.`);
        } finally {
            setLoading(false);
        }
    };

    // ==================== MAIN RENDER ====================

    return (
        <div className="min-h-screen bg-gray-50 py-8">
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
                <FormHeader mode={mode} vendor={vendor} onBack={onBack} />

                <FormMessages success={success} error={error} mode={mode} />

                {loading && !hasFetchedData ? (
                    <div className="bg-white shadow-lg rounded-2xl p-8 text-center">
                        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-500 mx-auto"></div>
                        <p className="mt-4 text-gray-600">Loading data...</p>
                    </div>
                ) : (
                    <div className="bg-white shadow-lg rounded-2xl p-8">
                        <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
                            <div className="flex gap-4 lg:gap-8 flex-col lg:flex-row">
                                <div className="lg:col-span-2 w-[80%]">
                                    <CategoryProductSelector
                                        categories={categories}
                                        selectedCategories={selectedCategories}
                                        onCategoriesChange={setSelectedCategories}
                                        selectedProducts={selectedProducts}
                                        onProductsChange={setSelectedProducts}
                                        isViewMode={isViewMode}
                                        vendor={vendor}
                                        allProducts={products} // Pass products to selector
                                    />
                                </div>

                                <div className="lg:col-span-1 w-[100%]">
                                    <FormFields
                                        register={register}
                                        errors={errors}
                                        isViewMode={isViewMode}
                                        mode={mode}
                                    />
                                </div>
                            </div>

                            <ActionButtons
                                mode={mode}
                                loading={loading}
                                selectedCategoriesCount={selectedCategories.length}
                                onBack={onBack}
                            />
                        </form>
                    </div>
                )}
            </div>
        </div>
    );
}