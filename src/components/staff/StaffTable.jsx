import React, { useState } from 'react'
import { MdEdit, MdDelete } from "react-icons/md";
import Image from "next/image";
const StaffTable = ({ filteredStaff, setFilteredStaff, setEditStaff, setOpen, setStaff, staff }) => {
    // console.log("🚀 ~ StaffTable ~ filteredStaff:", filteredStaff)

    const [previewImage, setPreviewImage] = useState(null);

    // Delete a product
    const handleDelete = async (id) => {
        if (!confirm("Are you sure?")) return;

        try {
            await fetch(`http://localhost:5001/staff/${id}`, {
                method: "DELETE",
            });

            const updated = staff.filter((p) => p.id !== id);
            setStaff(updated);
            setFilteredStaff(updated);
        } catch (error) {
            console.error(error);
        }
    };

    // Open edit modal
    const handleEdit = (product) => {
        setEditStaff(product);
        setOpen(true);
    };
    return (
        <div>
            {/* PRODUCT TABLE */}
            <table className="min-w-full divide-y divide-gray-200 mt-7">
                <thead className="bg-gray-50">
                    <tr>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Email</th>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Address</th>
                        <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                    </tr>
                </thead>
                <tbody className="bg-white divide-y divide-gray-200">
                    {Array.isArray(filteredStaff) && filteredStaff?.map((staff, index) => (
                        <tr key={staff.id}>
                            <td className="px-2 py-0.5 whitespace-nowrap" >{index + 1}</td>
                            <td className="px-2 py-0.5 whitespace-nowrap" onClick={() => setPreviewImage(staff.image)}>
                                <div className="h-12 w-12  relative">
                                    <Image
                                        src={staff.image || "/no-image.png"}
                                        alt={staff.name}
                                        fill
                                        className="rounded w-7 h-2 border-2 cursor-pointer"
                                    />
                                </div>
                            </td>
                            <td className="px-2 py-0.5 whitespace-nowrap" >{staff.name}</td>
                            <td className="px-2 py-0.5 whitespace-nowrap" >{staff.email}</td>
                            <td className="px-2 py-0.5 whitespace-nowrap" >{staff.phone}</td>
                            <td className="px-2 py-0.5 whitespace-nowrap" >{staff.address}</td>
                            <td className="px-2 py-0.5 whitespace-nowrap  flex gap-2  items-center  mt-5" >
                                <button
                                    onClick={() => handleEdit(staff)}
                                    className="text-blue-500 hover:text-blue-700"
                                >
                                    <MdEdit size={20} />
                                </button>
                                <button
                                    onClick={() => handleDelete(staff.id)}
                                    className="text-red-500 hover:text-red-700"
                                >
                                    <MdDelete size={20} />
                                </button>
                            </td>
                        </tr>
                    ))}
                </tbody>
            </table>

            {/* preview image */}
            {previewImage && (
                <div
                    className="fixed inset-0 bg-black bg-opacity-70 flex items-center justify-center z-50"
                    onClick={() => setPreviewImage(null)}
                >
                    <div className="relative p-2 bg-white rounded shadow-lg">
                        <img
                            src={previewImage}
                            alt="Preview"
                            className="max-w-[90vw] max-h-[90vh] rounded"
                        />
                        <button
                            className="absolute top-2 right-2 text-black bg-white px-2 py-0.5 rounded"
                            onClick={() => setPreviewImage(null)}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}
        </div>
    )
}

export default StaffTable