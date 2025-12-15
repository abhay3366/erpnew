"use client";

import { useEffect, useState } from "react";
import { MdDelete, MdExpandMore, MdExpandLess } from "react-icons/md";
import { FaEdit } from "react-icons/fa";
import { IoMdAdd } from "react-icons/io";
import { FiSearch, FiChevronRight, FiChevronDown } from "react-icons/fi";
import Swal from "sweetalert2";
import toast from "react-hot-toast";
import Select from "react-select";
import FormHeader from "../common/FormHeader";

// ---------------- TREE FUNCTIONS ----------------
function removeNode(list, id) {
    return list
        .map((item) => {
            if (item.children?.length) {
                item.children = removeNode(item.children, id);
            }
            return item;
        })
        .filter((item) => item.id !== id);
}

function insertNode(list, parentId, newNode) {
    if (!parentId) {
        list.push(newNode);
        return true;
    }
    for (let item of list) {
        if (item.id === parentId) {
            item.children.push(newNode);
            return true;
        }
        if (item.children?.length) {
            const ok = insertNode(item.children, parentId, newNode);
            if (ok) return true;
        }
    }
    return false;
}

// Check for duplicate name ANYWHERE in the tree (absolute duplicate prevention)
function checkDuplicateNameAnywhere(tree, name, excludeId = null) {
    let foundDuplicate = false;
    
    function checkInList(list) {
        for (let item of list) {
            // Skip the item we're editing
            if (excludeId && item.id === excludeId) continue;
            
            // Check if same name (case-insensitive)
            if (item.name.toLowerCase() === name.toLowerCase()) {
                foundDuplicate = true;
                return true;
            }
            
            // Check children
            if (item.children?.length) {
                if (checkInList(item.children)) {
                    return true;
                }
            }
        }
        return false;
    }
    
    checkInList(tree);
    return foundDuplicate;
}

// Get existing names for suggestions
function getAllExistingNames(tree, excludeId = null) {
    let names = new Set();
    
    function traverse(items) {
        items.forEach(item => {
            if (!excludeId || item.id !== excludeId) {
                names.add(item.name.toLowerCase());
            }
            if (item.children?.length) {
                traverse(item.children);
            }
        });
    }
    
    traverse(tree);
    return Array.from(names);
}

// Flatten for select options
function flattenOptions(list, depth = 0) {
    let out = [];
    list.forEach((item) => {
        out.push({ 
            id: item.id, 
            name: item.name,
            label: `${"└─ ".repeat(depth)}${item.name}`,
        });
        if (item.children?.length) {
            out = out.concat(flattenOptions(item.children, depth + 1));
        }
    });
    return out;
}

// Generate slug function
function generateSlug(text) {
    if (!text) return "";
    return text
        .toString()
        .toLowerCase()
        .trim()
        .replace(/\s+/g, '-')           // Replace spaces with -
        .replace(/[^\w\-]+/g, '')       // Remove all non-word chars
        .replace(/\-\-+/g, '-')         // Replace multiple - with single -
        .replace(/^-+/, '')             // Trim - from start of text
        .replace(/-+$/, '');            // Trim - from end of text
}

// Count all categories
function countAllCategories(tree) {
    let count = 0;
    function traverse(items) {
        items.forEach(item => {
            count++;
            if (item.children?.length) {
                traverse(item.children);
            }
        });
    }
    traverse(tree);
    return count;
}

// Find category by ID
function findCategoryById(tree, id) {
    let result = null;
    
    function search(items) {
        for (let item of items) {
            if (item.id === id) {
                result = item;
                return true;
            }
            if (item.children?.length && search(item.children)) {
                return true;
            }
        }
        return false;
    }
    
    search(tree);
    return result;
}

// ---------------- COMPONENT ----------------
export default function ProductsGroup() {
    const [tree, setTree] = useState([]);
    const [name, setName] = useState("");
    const [slug, setSlug] = useState("");
    const [parentId, setParentId] = useState("");
    const [status, setStatus] = useState(true);
    const [editId, setEditId] = useState(null);
    const [showModal, setShowModal] = useState(false);
    const [searchTerm, setSearchTerm] = useState("");
    const [validationError, setValidationError] = useState("");
    const [expandedItems, setExpandedItems] = useState(new Set());
    const [loading, setLoading] = useState(true);
    const [existingNames, setExistingNames] = useState([]);

    // Load data
    const load = async () => {
        try {
            setLoading(true);
            const res = await fetch("http://localhost:5001/categories");
            const data = await res.json();
            const categories = data.list || [];
            
            // Ensure all items have required fields
            const validatedCategories = categories.map(item => ({
                ...item,
                slug: item.slug || generateSlug(item.name),
                children: item.children || []
            }));
            
            setTree(validatedCategories);
            setExistingNames(getAllExistingNames(validatedCategories));
            
            // Auto-expand root categories
            const rootIds = new Set(validatedCategories.map(cat => cat.id));
            setExpandedItems(rootIds);
        } catch (error) {
            console.error("Failed to load categories:", error);
            toast.error("Failed to load categories");
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        load();
    }, []);

    const save = async (finalTree) => {
        try {
            const response = await fetch("http://localhost:5001/categories", {
                method: "PUT",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({ list: finalTree }),
            });
            
            if (!response.ok) {
                throw new Error("Failed to save");
            }
            
            return true;
        } catch (error) {
            console.error("Failed to save categories:", error);
            throw error;
        }
    };

    const onEdit = (item) => {
        setEditId(item.id);
        setName(item.name);
        setSlug(item.slug || generateSlug(item.name));
        setParentId(item.parentId || "");
        setStatus(item.status);
        setValidationError("");
        setExistingNames(getAllExistingNames(tree, item.id)); // Exclude current item when editing
        setShowModal(true);
    };

    const deleteCategory = async (id, name, childrenCount) => {
        Swal.fire({
            title: childrenCount > 0 ? 
                `Delete "${name}" and its ${childrenCount} sub-product?` : 
                `Delete "${name}"?`,
            text: childrenCount > 0 ? 
                "This will also delete all sub-product. This action cannot be undone!" :
                "This action cannot be undone!",
            icon: "warning",
            showCancelButton: true,
            confirmButtonColor: "#d33",
            cancelButtonColor: "#3085d6",
            confirmButtonText: "Delete",
            cancelButtonText: "Cancel",
            showLoaderOnConfirm: true,
            preConfirm: async () => {
                try {
                    let newTree = removeNode(tree, id);
                    await save(newTree);
                    return newTree;
                } catch (error) {
                    Swal.showValidationMessage("Failed to delete Product Group");
                    return false;
                }
            }
        }).then((result) => {
            if (result.isConfirmed) {
                const newTree = result.value;
                setTree(newTree);
                setExistingNames(getAllExistingNames(newTree));
                
                // Remove from expanded items
                const newExpanded = new Set(expandedItems);
                newExpanded.delete(id);
                setExpandedItems(newExpanded);
                
                Swal.fire({
                    title: "Deleted!",
                    text: "Product Group has been deleted.",
                    icon: "success",
                    timer: 1500,
                    showConfirmButton: false
                });
                toast.success("Product Group deleted successfully");
            }
        });
    };

    // Toggle expand/collapse
    const toggleExpand = (id) => {
        const newExpanded = new Set(expandedItems);
        if (newExpanded.has(id)) {
            newExpanded.delete(id);
        } else {
            newExpanded.add(id);
        }
        setExpandedItems(newExpanded);
    };

    // Expand all
    const expandAll = () => {
        const allIds = new Set();
        const collectIds = (items) => {
            items.forEach(item => {
                allIds.add(item.id);
                if (item.children?.length) {
                    collectIds(item.children);
                }
            });
        };
        collectIds(tree);
        setExpandedItems(allIds);
    };

    // Collapse all
    const collapseAll = () => {
        // Keep only root categories expanded
        const rootIds = new Set(tree.map(cat => cat.id));
        setExpandedItems(rootIds);
    };

    const validateForm = () => {
        if (!name.trim()) {
            setValidationError("Product Group name is required");
            return false;
        }

        // STRICT DUPLICATE CHECK: No same name anywhere in the tree
        if (checkDuplicateNameAnywhere(tree, name, editId)) {
            setValidationError(`"${name}" already exists in your product. Product names must be unique.`);
            return false;
        }

        setValidationError("");
        return true;
    };

    const submit = async (e) => {
        e.preventDefault();

        if (!validateForm()) {
            return;
        }

        try {
            const generatedSlug = slug.trim() || generateSlug(name);
            
            // Create category object
            const categoryData = {
                id: editId || Date.now(),
                name: name.trim(),
                slug: generatedSlug,
                parentId: parentId ? Number(parentId) : null,
                status: status,
                children: editId ? findCategoryById(tree, editId)?.children || [] : []
            };

            let newTree = structuredClone(tree);
            
            // Remove old entry if editing
            if (editId) {
                newTree = removeNode(newTree, editId);
            }
            
            // Insert new/updated category
            const inserted = insertNode(newTree, categoryData.parentId, categoryData);
            
            if (!inserted) {
                toast.error("Failed to add Product. Parent not found.");
                return;
            }

            await save(newTree);
            setTree(newTree);
            setExistingNames(getAllExistingNames(newTree));

            // If adding new category, expand its parent
            if (!editId && parentId) {
                const newExpanded = new Set(expandedItems);
                newExpanded.add(parentId);
                setExpandedItems(newExpanded);
            }

            // Reset form
            setName("");
            setSlug("");
            setParentId("");
            setStatus(true);
            setEditId(null);
            setShowModal(false);
            setValidationError("");

            toast.success(
                editId ? "Product Group updated successfully!" : "Product Group created successfully!"
            );
        } catch (error) {
            console.error("Failed to save Product:", error);
            toast.error("Failed to save Product");
        }
    };

    // Handle name change
    const handleNameChange = (value) => {
        setName(value);
        
        // Check if name already exists
        const nameExists = existingNames.includes(value.toLowerCase().trim());
        
        // Auto-generate slug only for new categories
        if (!editId && (!slug || slug === generateSlug(name))) {
            setSlug(generateSlug(value));
        }
        
        // Show warning if name exists
        if (nameExists && value.trim() !== "") {
            setValidationError(`"${value}" already exists. Choose a different name.`);
        } else if (validationError && !nameExists) {
            setValidationError("");
        }
    };

    // Handle slug input
    const handleSlugChange = (value) => {
        const slugValue = value
            .toLowerCase()
            .replace(/[^a-z0-9-]/g, '-')
            .replace(/-+/g, '-')
            .replace(/^-|-$/g, '');
        setSlug(slugValue);
    };

    // Filter categories based on search
    const filteredTree = searchTerm ? 
        filterTreeBySearch(tree, searchTerm.toLowerCase()) : 
        tree;

    // Render nested categories
    const renderNestedCategories = (items, level = 0) => {
        return items.map((item) => {
            const hasChildren = item.children && item.children.length > 0;
            const isExpanded = expandedItems.has(item.id);
            const indent = level * 24;
            
            return (
                <div key={item.id}>
                    {/* Main Category Row */}
                    <div 
                        className={`flex items-center border-b border-gray-200 hover:bg-gray-50 transition-colors duration-150 ${
                            !item.status ? "opacity-70" : ""
                        }`}
                        style={{ paddingLeft: `${indent + 16}px` }}
                    >
                        {/* Expand/Collapse Button */}
                        <div className="w-10 py-4 flex items-center justify-center">
                            {hasChildren ? (
                                <button
                                    onClick={() => toggleExpand(item.id)}
                                    className="text-gray-600 hover:text-gray-900 transition p-1 rounded hover:bg-gray-200"
                                    title={isExpanded ? "Collapse" : "Expand"}
                                >
                                    {isExpanded ? 
                                        <FiChevronDown className="text-md" /> : 
                                        <FiChevronRight className="text-md" />
                                    }
                                </button>
                            ) : (
                                <div className="w-6"></div>
                            )}
                        </div>

                        {/* Category Name */}
                        <div className="flex-1 py-4 min-w-0">
                            <div className="flex items-center gap-2">
                                <div className="font-medium text-gray-800 truncate" title={item.name}>
                                    {item.name}
                                </div>
                                {hasChildren && (
                                    <span className="px-2 py-0.5 text-xs bg-gray-100 text-gray-600 rounded-full">
                                        {item.children.length}
                                    </span>
                                )}
                            </div>
                            <div className="mt-1">
                                <span className="text-xs text-gray-500">
                                    Slug: <code className="ml-1 px-1.5 py-0.5 bg-gray-100 rounded">{item.slug || "-"}</code>
                                </span>
                            </div>
                        </div>

                        {/* Status Badge */}
                        <div className="w-20 py-4 px-2">
                            <span className={`inline-block px-2 py-1 rounded text-xs font-medium ${
                                item.status ? 
                                    "bg-green-50 text-green-700 border border-green-200" : 
                                    "bg-gray-50 text-gray-600 border border-gray-200"
                            }`}>
                                {item.status ? "Active" : "Inactive"}
                            </span>
                        </div>

                        {/* Actions */}
                        <div className="w-28 py-4 px-2">
                            <div className="flex items-center gap-1">
                                <button
                                    onClick={() => onEdit(item)}
                                    className="p-1.5 text-blue-600 hover:text-blue-800 hover:bg-blue-50 rounded transition"
                                    title="Edit"
                                >
                                    <FaEdit size={14} />
                                </button>
                                <button
                                    onClick={() => deleteCategory(item.id, item.name, item.children?.length || 0)}
                                    className="p-1.5 text-red-600 hover:text-red-800 hover:bg-red-50 rounded transition"
                                    title="Delete"
                                >
                                    <MdDelete size={16} />
                                </button>
                                <button
                                    onClick={() => {
                                        setParentId(item.id);
                                        setName("");
                                        setSlug("");
                                        setEditId(null);
                                        setValidationError("");
                                        setExistingNames(getAllExistingNames(tree));
                                        setShowModal(true);
                                    }}
                                    className="p-1.5 text-green-600 hover:text-green-800 hover:bg-green-50 rounded transition"
                                    title="Add Sub-Product"
                                >
                                    <IoMdAdd size={16} />
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Child Categories (if expanded) */}
                    {hasChildren && isExpanded && (
                        <div>
                            {renderNestedCategories(item.children, level + 1)}
                        </div>
                    )}
                </div>
            );
        });
    };

    if (loading) {
        return (
            <div className="mx-auto p-6">
                <FormHeader 
                    title="Product Group" 
                    message="Loading..." 
                    onback={"Back to Dashboard"} 
                />
                <div className="bg-white rounded-xl p-12 text-center">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
                    <p className="mt-4 text-gray-600">Loading Products...</p>
                </div>
            </div>
        );
    }

    return (
        <div className="mx-auto space-y-6">
            <FormHeader 
                title="Product Group" 
                message="Manage product groups with unique names" 
                onback={"Back to Dashboard"} 
            />
            
            {/* Main Card */}
            <div className="bg-white rounded-lg border border-gray-200 overflow-hidden">
                {/* Header with Actions */}
                <div className="p-4 border-b border-gray-200 bg-gray-50">
                    <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-3">
                        <div>
                            <h2 className="text-lg font-semibold text-gray-800">Product Groups</h2>
                            <p className="text-sm text-gray-600 mt-1">
                                {tree.length} root • {countAllCategories(tree)} total 
                            </p>
                        </div>
                        
                        <div className="flex flex-col sm:flex-row gap-2 w-full md:w-auto">
                            {/* Search */}
                            <div className="relative">
                                <FiSearch className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400" />
                                <input
                                    type="text"
                                    placeholder="Search Product..."
                                    value={searchTerm}
                                    onChange={(e) => setSearchTerm(e.target.value)}
                                    className="pl-9 pr-3 py-2 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 w-full text-sm"
                                />
                            </div>
                            
                            {/* Expand/Collapse All */}
                            <div className="flex gap-1">
                                <button
                                    onClick={expandAll}
                                    className="px-3 py-2 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 text-sm border border-gray-300 rounded"
                                >
                                    <MdExpandMore /> All
                                </button>
                                <button
                                    onClick={collapseAll}
                                    className="px-3 py-2 text-gray-700 hover:bg-gray-200 transition flex items-center gap-1 text-sm border border-gray-300 rounded"
                                >
                                    <MdExpandLess /> All
                                </button>
                            </div>
                            
                            {/* Add Root Category */}
                            <button
                                onClick={() => {
                                    setName("");
                                    setSlug("");
                                    setParentId("");
                                    setStatus(true);
                                    setEditId(null);
                                    setValidationError("");
                                    setExistingNames(getAllExistingNames(tree));
                                    setShowModal(true);
                                }}
                                className="bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition whitespace-nowrap"
                            >
                                <IoMdAdd />Prodcut Group
                            </button>
                        </div>
                    </div>
                </div>

                {/* Warning */}
                <div className="px-4 py-2 bg-red-50 border-b border-red-100">
                    <div className="flex items-start text-red-800 text-xs">
                        <svg className="w-4 h-4 mr-1.5 mt-0.5 flex-shrink-0" fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M8.257 3.099c.765-1.36 2.722-1.36 3.486 0l5.58 9.92c.75 1.334-.213 2.98-1.742 2.98H4.42c-1.53 0-2.493-1.646-1.743-2.98l5.58-9.92zM11 13a1 1 0 11-2 0 1 1 0 012 0zm-1-8a1 1 0 00-1 1v3a1 1 0 002 0V6a1 1 0 00-1-1z" clipRule="evenodd" />
                        </svg>
                        <span>
                            <strong>Important:</strong> Deleting a parent will delete all sub-Product.
                        </span>
                    </div>
                </div>

                {/* Categories List */}
                <div className="min-h-[300px] max-h-[600px] overflow-y-auto">
                    {filteredTree.length > 0 ? (
                        renderNestedCategories(filteredTree)
                    ) : (
                        <div className="p-8 text-center">
                            <div className="mx-auto w-12 h-12 rounded-full bg-gray-100 flex items-center justify-center mb-3">
                                <svg className="w-6 h-6 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 7v10a2 2 0 002 2h14a2 2 0 002-2V9a2 2 0 00-2-2h-6l-2-2H5a2 2 0 00-2 2z" />
                                </svg>
                            </div>
                            <h3 className="text-base font-medium text-gray-900 mb-1">
                                {searchTerm ? "No matching Product" : "No Product yet"}
                            </h3>
                            <p className="text-gray-500 text-sm mb-4">
                                {searchTerm ? "Try a different search" : "Create your first product group"}
                            </p>
                            {!searchTerm && (
                                <button
                                    onClick={() => {
                                        setName("");
                                        setSlug("");
                                        setParentId("");
                                        setStatus(true);
                                        setEditId(null);
                                        setValidationError("");
                                        setExistingNames(getAllExistingNames(tree));
                                        setShowModal(true);
                                    }}
                                    className="bg-blue-600 hover:bg-blue-700 inline-flex items-center justify-center gap-2 rounded px-4 py-2 text-sm font-medium text-white transition"
                                >
                                    <IoMdAdd /> Create First
                                </button>
                            )}
                        </div>
                    )}
                </div>

                {/* Footer Stats */}
                {filteredTree.length > 0 && (
                    <div className="px-4 py-3 border-t border-gray-200 bg-gray-50 text-xs text-gray-600">
                        <div className="flex items-center justify-between">
                            <div>
                                <span className="font-medium">{expandedItems.size}</span> expanded • 
                                <span className="font-medium ml-1">{countAllCategories(filteredTree)}</span> shown • 
                                <span className="ml-2 text-green-600 font-medium">All names are unique</span>
                            </div>
                            <div>
                                Click <span className="font-medium text-blue-600">+</span> to add sub-Product
                            </div>
                        </div>
                    </div>
                )}
            </div>

            {/* Modal */}
            {showModal && (
                <div className="fixed inset-0 bg-black/50 flex justify-center items-center z-50 p-4">
                    <div className="bg-white rounded-lg shadow-lg w-full max-w-md max-h-[90vh]">
                        {/* Modal Header */}
                        <div className="p-4 border-b">
                            <div className="flex justify-between items-center">
                                <div>
                                    <h2 className="text-lg font-semibold text-gray-800">
                                        {editId ? "Edit Product Group" : "Add Product Group"}
                                    </h2>
                                    <p className="text-sm text-gray-500 mt-0.5">
                                        {parentId ? 
                                            `Under: ${flattenOptions(tree).find(o => o.id === parentId)?.name || "Parent"}` : 
                                            "Root Product Group"}
                                    </p>
                                </div>
                                <button
                                    onClick={() => {
                                        setShowModal(false);
                                        setValidationError("");
                                    }}
                                    className="text-gray-500 hover:text-gray-700 text-lg p-1"
                                >
                                    ✕
                                </button>
                            </div>
                        </div>

                        {/* Modal Body */}
                        <form onSubmit={submit} className="p-4 space-y-4 h-120">
                            {validationError && (
                                <div className="p-3 bg-red-50 border border-red-200 rounded">
                                    <p className="text-sm text-red-700">{validationError}</p>
                                </div>
                            )}


                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Product Name *
                                </label>
                                <input
                                    type="text"
                                    className={`w-full px-3 py-2.5 border rounded focus:outline-none focus:ring-1 ${
                                        existingNames.includes(name.toLowerCase().trim()) && name.trim() !== "" 
                                            ? "border-red-300 focus:ring-red-500 focus:border-red-500" 
                                            : "border-gray-300 focus:ring-blue-500 focus:border-blue-500"
                                    }`}
                                    placeholder="Enter unique Product name"
                                    value={name}
                                    onChange={(e) => handleNameChange(e.target.value)}
                                    required
                                    autoFocus
                                />
                                {!existingNames.includes(name.toLowerCase().trim()) && name.trim() !== "" && (
                                    <p className="mt-1 text-xs text-green-600">
                                        ✓ This name is available
                                    </p>
                                )}
                            </div>

                            <div className="hidden">
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    URL Slug
                                </label>
                                <input
                                    type="text"
                                    className="w-full px-3 py-2.5 border border-gray-300 rounded focus:outline-none focus:ring-1 focus:ring-blue-500 focus:border-blue-500 font-mono text-sm"
                                    placeholder="Auto-generated"
                                    value={slug}
                                    onChange={(e) => handleSlugChange(e.target.value)}
                                />
                                {slug && (
                                    <p className="mt-1 text-xs text-blue-600">
                                        URL: <code className="bg-blue-50 px-1.5 py-0.5 rounded">/{slug}</code>
                                    </p>
                                )}
                            </div>

                            <div>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Parent Group
                                </label>
                                <Select
                                    className="w-full text-sm"
                                    classNamePrefix="react-select"
                                    options={[
                                        { value: "", label: "Root Level (No Parent)" },
                                        ...flattenOptions(tree).map((o) => ({
                                            value: o.id,
                                            label: o.label,
                                        })),
                                    ]}
                                    value={
                                        parentId === ""
                                            ? { value: "", label: "Root Level (No Parent)" }
                                            : flattenOptions(tree).find((o) => o.id === parentId)
                                    }
                                    onChange={(e) => setParentId(e?.value ?? "")}
                                    isSearchable
                                    placeholder="Select parent..."
                                />
                            </div>

                            <div className={`${editId ? "block" :"hidden"}`}>
                                <label className="block text-sm font-medium text-gray-700 mb-1.5">
                                    Status
                                </label>
                                <div className="flex gap-4">
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={status}
                                            onChange={() => setStatus(true)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-gray-700">Active</span>
                                    </label>
                                    <label className="flex items-center">
                                        <input
                                            type="radio"
                                            name="status"
                                            checked={!status}
                                            onChange={() => setStatus(false)}
                                            className="h-4 w-4 text-blue-600"
                                        />
                                        <span className="ml-2 text-gray-700">Inactive</span>
                                    </label>
                                </div>
                            </div>

                            <div className="flex gap-3 pt-4">
                                <button
                                    type="button"
                                    onClick={() => {
                                        setShowModal(false);
                                        setValidationError("");
                                    }}
                                    className="flex-1 px-4 py-2.5 border border-gray-300 text-gray-700 rounded hover:bg-gray-50 transition font-medium text-sm"
                                >
                                    Cancel
                                </button>
                                <button
                                    type="submit"
                                    disabled={existingNames.includes(name.toLowerCase().trim()) && name.trim() !== ""}
                                    className={`flex-1 px-4 py-2.5 rounded transition font-medium text-sm flex items-center justify-center gap-2 ${
                                        existingNames.includes(name.toLowerCase().trim()) && name.trim() !== ""
                                            ? "bg-gray-300 text-gray-500 cursor-not-allowed"
                                            : "bg-blue-600 hover:bg-blue-700 text-white"
                                    }`}
                                >
                                    {editId ? (
                                        <>
                                            <FaEdit size={14} /> Update
                                        </>
                                    ) : (
                                        <>
                                            <IoMdAdd size={16} /> Create
                                        </>
                                    )}
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}
        </div>
    );
}

// Filter tree by search term
function filterTreeBySearch(tree, searchTerm) {
    return tree
        .map(item => ({ ...item }))
        .filter(item => {
            const matches = item.name.toLowerCase().includes(searchTerm);
            if (matches) return true;
            
            if (item.children?.length) {
                const filteredChildren = filterTreeBySearch(item.children, searchTerm);
                if (filteredChildren.length > 0) {
                    item.children = filteredChildren;
                    return true;
                }
            }
            
            return false;
        });
}