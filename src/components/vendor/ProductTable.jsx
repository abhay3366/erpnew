"use client"
import React, { useState } from 'react'
import GridView from './GridView'
import Image from "next/image";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";
const ProductTable = ({ filteredProducts, gridView, open, setOpen, setProducts, editProduct, setEditProduct }) => {
    const [previewImage, setPreviewImage] = useState(null);
    // Delete a product
    const handleDelete = async (id) => {
        if (!confirm("Are you sure you want to delete this product?")) return;
        try {
            await fetch(`http://localhost:5001/products/${id}`, { method: "DELETE" });
            setProducts(products.filter((p) => p.id !== id));
        } catch (error) {
            console.error("Error deleting product:", error);
        }
    };
    // Open edit modal
    const handleEdit = (product) => {
        setEditProduct(product);
        setOpen(true);
    };
    return (
        <div>
            {
                gridView ? <GridView /> : (
                    <div>
                        {/* PRODUCT TABLE */}
                        <table className="min-w-full divide-y divide-gray-200 mt-7">
                            <thead className="bg-gray-50">
                                <tr>
                                    <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                                    <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Image</th>
                                    <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Name</th>
                                    <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">IsSerial</th>
                                    <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">SKU</th>
                                    <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                                </tr>
                            </thead>
                            <tbody className="bg-white divide-y divide-gray-200">
                                {filteredProducts.map((product, index) => (
                                    <tr key={product.id}>
                                        <td className="px-2 py-0.5 whitespace-nowrap" >{index + 1}</td>
                                        <td className="px-2 py-0.5 whitespace-nowrap" onClick={() => setPreviewImage(product.image)}>
                                            <div className="h-12 w-12  relative">
                                                <Image
                                                    src={product.image || "https://encrypted-tbn0.gstatic.com/images?q=tbn:ANd9GcS1_iQ30EjjN0vouiSI344Az06ECPqB9fMNJA&s"}
                                                    alt={product.productName}
                                                    fill
                                                    className="rounded w-7 h-2 border-2 cursor-pointer"
                                                />
                                            </div>
                                        </td>
                                        <td className="px-2 py-0.5 whitespace-nowrap" >{product.productName}</td>
                                        <td className="px-2 py-0.5 whitespace-nowrap" >{product.isSerial}</td>
                                        <td className="px-2 py-0.5 whitespace-nowrap" >{product.sku}</td>
                                        <td className="px-2 py-0.5 whitespace-nowrap  flex gap-2  items-center  mt-5" >
                                            <button
                                                onClick={() => handleEdit(product)}
                                                className="text-blue-500 hover:text-blue-700"
                                            >
                                                <MdEdit size={20} />
                                            </button>
                                            <button
                                                onClick={() => handleDelete(product.id)}
                                                className="text-red-500 hover:text-red-700"
                                            >
                                                <MdDelete size={20} />
                                            </button>
                                        </td>
                                    </tr>
                                ))}
                            </tbody>
                        </table>
                    </div>
                )
            }
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
export default ProductTable