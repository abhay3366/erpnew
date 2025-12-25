"use client";

import { useState } from "react";
import toast from "react-hot-toast";

export default function BroadbandIssue() {
    // Staff data
    const staffList = [
        { id: 1, name: "Ashu Sagar" },
        { id: 2, name: "Rahul Verma" },
        { id: 3, name: "Priya Sharma" },
        { id: 4, name: "Amit Kumar" },
        { id: 5, name: "Neha Singh" }
    ];

    // Warehouse data
    const warehouseList = [
        { id: 1, name: "Main Warehouse" },
        { id: 2, name: "North Zone" },
        { id: 3, name: "South Zone" },
        { id: 4, name: "East Zone" },
        { id: 5, name: "West Zone" }
    ];

    // Issue type
    const issueTypes = [
        { id: 1, name: "Customer Issue" },
        { id: 2, name: "Internal Use" },
        { id: 3, name: "Demo Unit" },
        { id: 4, name: "Replacement" },
        { id: 5, name: "Testing" }
    ];

    // Product list
    const productList = [
        { id: 1, name: "D-Link Router DIR-615" },
        { id: 2, name: "TP-Link Archer C6" },
        { id: 3, name: "Netgear Nighthawk R7000" },
        { id: 4, name: "Huawei B315s-22" },
        { id: 5, name: "ZTE MF283" },
        { id: 6, name: "Airtel Fiber Modem" },
        { id: 7, name: "Jio Fiber Router" },
        { id: 8, name: "Cisco Switch SG250" },
        { id: 9, name: "Ubiquiti UniFi AP" },
        { id: 10, name: "Binatone Telephone" }
    ];

    // Form state
    const [formData, setFormData] = useState({
        staffId: "",
        warehouseId: "",
        issueTypeId: "",
        items: [{ productId: "", quantity: '' }]
    });

    const [loading, setLoading] = useState(false);

    // Handle input changes
    const handleInputChange = (field, value) => {
        setFormData(prev => ({
            ...prev,
            [field]: value
        }));
    };

    // Handle item changes
    const handleItemChange = (index, field, value) => {
        const newItems = [...formData.items];
        newItems[index] = {
            ...newItems[index],
            [field]: field === "quantity" ? parseInt(value) || 1 : value
        };
        setFormData(prev => ({
            ...prev,
            items: newItems
        }));
    };

    // Add new item row
    const addItemRow = () => {
        setFormData(prev => ({
            ...prev,
            items: [...prev.items, { productId: "", quantity: 1 }]
        }));
    };

    // Remove item row
    const removeItemRow = (index) => {
        if (formData.items.length > 1) {
            const newItems = [...formData.items];
            newItems.splice(index, 1);
            setFormData(prev => ({
                ...prev,
                items: newItems
            }));
        }
    };

    // Form validation
    const validateForm = () => {
        if (!formData.staffId) {
            toast.error("Please select staff member");
            return false;
        }
        if (!formData.warehouseId) {
            toast.error("Please select warehouse");
            return false;
        }
        if (!formData.issueTypeId) {
            toast.error("Please select issue type");
            return false;
        }
        
        // Check if all items have product selected
        for (let i = 0; i < formData.items.length; i++) {
            if (!formData.items[i].productId) {
                toast.error(`Please select product for item ${i + 1}`);
                return false;
            }
        }
        
        return true;
    };

    // Get selected values for display
    const getSelectedStaff = () => {
        return staffList.find(staff => staff.id === parseInt(formData.staffId))?.name || "";
    };

    const getSelectedWarehouse = () => {
        return warehouseList.find(wh => wh.id === parseInt(formData.warehouseId))?.name || "";
    };

    const getSelectedIssueType = () => {
        return issueTypes.find(issue => issue.id === parseInt(formData.issueTypeId))?.name || "";
    };

    // Handle form submission
    const handleSubmit = async (e) => {
        e.preventDefault();
        
        if (!validateForm()) {
            return;
        }

        setLoading(true);
        
        try {
            // Prepare payload
            const payload = {
                staff: getSelectedStaff(),
                staffId: formData.staffId,
                warehouse: getSelectedWarehouse(),
                warehouseId: formData.warehouseId,
                issueType: getSelectedIssueType(),
                issueTypeId: formData.issueTypeId,
                items: formData.items.map(item => ({
                    product: productList.find(p => p.id === parseInt(item.productId))?.name || "",
                    productId: item.productId,
                    quantity: item.quantity || 1
                })),
                date: new Date().toISOString(),
                status: "pending",
                issueId: `ISS-${Date.now()}`
            };

            console.log("Form Data:", payload);

            // Here you would make API call
            // Example:
            // const response = await fetch('your-api-endpoint', {
            //     method: 'POST',
            //     headers: {
            //         'Content-Type': 'application/json',
            //     },
            //     body: JSON.stringify(payload)
            // });

            toast.success("Issue logged successfully!");

            // Reset form
            setFormData({
                staffId: "",
                warehouseId: "",
                issueTypeId: "",
                items: [{ productId: "", quantity: 1 }]
            });

        } catch (error) {
            console.error("Error submitting form:", error);
            toast.error("Failed to submit issue");
        } finally {
            setLoading(false);
        }
    };

    // Reset form
    const resetForm = () => {
        setFormData({
            staffId: "",
            warehouseId: "",
            issueTypeId: "",
            items: [{ productId: "", quantity: 1 }]
        });
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="">
                {/* Header */}
                <div className="mb-6">
                    <h1 className="text-2xl font-bold text-gray-800">Broadband Issue</h1>
                </div>

                {/* Form Card */}
                <div className="bg-white rounded-lg shadow border p-4 md:p-6">
                    <form onSubmit={handleSubmit}>
                        {/* Basic Information */}
                        <div className="mb-6">
                            <h2 className="text-lg font-semibold text-gray-800 mb-4">Basic Information</h2>
                            
                            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                                {/* Staff Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Staff Member *
                                    </label>
                                    <select
                                        value={formData.staffId}
                                        onChange={(e) => handleInputChange("staffId", e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Staff</option>
                                        {staffList.map(staff => (
                                            <option key={staff.id} value={staff.id}>
                                                {staff.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Warehouse Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Warehouse *
                                    </label>
                                    <select
                                        value={formData.warehouseId}
                                        onChange={(e) => handleInputChange("warehouseId", e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Warehouse</option>
                                        {warehouseList.map(warehouse => (
                                            <option key={warehouse.id} value={warehouse.id}>
                                                {warehouse.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>

                                {/* Issue Type Select */}
                                <div>
                                    <label className="block text-sm font-medium text-gray-700 mb-2">
                                        Issue Type *
                                    </label>
                                    <select
                                        value={formData.issueTypeId}
                                        onChange={(e) => handleInputChange("issueTypeId", e.target.value)}
                                        className="w-full p-2 border border-gray-300 rounded focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                                        required
                                    >
                                        <option value="">Select Issue Type</option>
                                        {issueTypes.map(issue => (
                                            <option key={issue.id} value={issue.id}>
                                                {issue.name}
                                            </option>
                                        ))}
                                    </select>
                                </div>
                            </div>
                        </div>

                        {/* Items Section */}
                        <div className="mb-6">
                            <div className="flex justify-between items-center mb-4">
                                <h2 className="text-lg font-semibold text-gray-800">Items</h2>
                                <button
                                    type="button"
                                    onClick={addItemRow}
                                    className="px-3 py-1 bg-green-600 text-white rounded text-sm hover:bg-green-700"
                                >
                                    + Add Item
                                </button>
                            </div>

                            {/* Items Table */}
                            <div className="overflow-x-auto">
                                <table className="min-w-full border">
                                    <thead>
                                        <tr className="bg-gray-100">
                                            <th className="p-2 border text-left">#</th>
                                            <th className="p-2 border text-left">Product *</th>
                                            <th className="p-2 border text-left">Quantity</th>
                                            <th className="p-2 border text-left">Action</th>
                                        </tr>
                                    </thead>
                                    <tbody>
                                        {formData.items.map((item, index) => (
                                            <tr key={index} className="hover:bg-gray-50">
                                                <td className="p-2 border">{index + 1}</td>
                                                <td className="p-2 border">
                                                    <select
                                                        value={item.productId}
                                                        onChange={(e) => handleItemChange(index, "productId", e.target.value)}
                                                        className="w-full p-1 border border-gray-300 rounded"
                                                        required
                                                    >
                                                        <option value="">Select Product</option>
                                                        {productList.map(product => (
                                                            <option key={product.id} value={product.id}>
                                                                {product.name}
                                                            </option>
                                                        ))}
                                                    </select>
                                                </td>
                                                <td className="p-2 border">
                                                    <input
                                                        type="number"
                                                        value={item.quantity}
                                                        onChange={(e) => handleItemChange(index, "quantity", e.target.value)}
                                                        className="w-full p-1 border border-gray-300 rounded"
                                                    />
                                                </td>
                                                <td className="p-2 border">
                                                    {formData.items.length > 1 && (
                                                        <button
                                                            type="button"
                                                            onClick={() => removeItemRow(index)}
                                                            className="px-2 py-1 text-red-600 hover:text-red-800"
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

                            {formData.items.length === 0 && (
                                <div className="text-center py-4 text-gray-500">
                                    No items added. Click "Add Item" to add products.
                                </div>
                            )}
                        </div>

                        {/* Summary */}
                        <div className="mb-6 p-4 bg-blue-50 rounded border border-blue-200">
                            <h3 className="font-medium text-blue-800 mb-2">Summary</h3>
                            <div className="text-sm text-blue-700">
                                <p><span className="font-medium">Staff:</span> {getSelectedStaff() || "Not selected"}</p>
                                <p><span className="font-medium">Warehouse:</span> {getSelectedWarehouse() || "Not selected"}</p>
                                <p><span className="font-medium">Issue Type:</span> {getSelectedIssueType() || "Not selected"}</p>
                                <p><span className="font-medium">Total Items:</span> {formData.items.length}</p>
                            </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex justify-end gap-3 pt-4 border-t">
                            <button
                                type="button"
                                onClick={resetForm}
                                className="px-4 py-2 border border-gray-300 rounded hover:bg-gray-50"
                            >
                                Clear
                            </button>
                            <button
                                type="submit"
                                disabled={loading}
                                className="px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700 disabled:opacity-50"
                            >
                                {loading ? "Submitting..." : "Submit Issue"}
                            </button>
                        </div>
                    </form>
                </div>
            </div>
        </div>
    );
}