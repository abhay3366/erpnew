"use client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";


import { useEffect, useState } from "react";
import AddProduct from "../../../../../components/vendor/AddProduct";
import Image from "next/image";
import GridView from "../../../../../components/vendor/GridView";
const ItemPage = () => {
  const [open, setOpen] = useState(false)
  const [products, setProducts] = useState([]);
  const [editProduct, setEditProduct] = useState(false);
  const [gridView, setGridView] = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const [query, setQuery] = useState("");
  const [filteredProducts, setFilteredProducts] = useState(products);


  // Fetch products from backend
  const fetchProducts = async () => {
    try {
      const res = await fetch("http://localhost:5001/products"); // replace with your API
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.error("Error fetching products:", error);
    }
  };

  useEffect(() => {
    fetchProducts();
  }, []);

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

  // Close modal
  const handleCloseModal = () => {
    setEditProduct(null);
    setOpen(false);
    fetchProducts(); 
  };
useEffect(() => {
    // Reset filtered products if the original products list changes
    setFilteredProducts(products);
  }, [products]);
  const handleSearch = (item) => {
    if (!item) {
      // If input is empty, show all products
      setFilteredProducts(products);
      return;
    }

    const results = products.filter((el) =>
      el.productName.toLowerCase().includes(item.toLowerCase())
    );
    setFilteredProducts(results);
  };


  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };


  return (
    <div>
      <PageBreadcrumb pageTitle="Product" />
      <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">

        {/* BUTTONS */}
        <div className="flex justify-between gap-4">
          <div>
          <input type="text" className="inputCss" onChange={handleChange} placeholder="Search..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => {setOpen(true);}}

              className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
            >
              <IoMdAdd /> Add New Product
            </button>
            {/* <button onClick={gridFun} className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border border-gray-400 rounded shadow">Grid View</button> */}


            <button
              onClick={() => setGridView(!gridView)}
              className="bg-white hover:bg-gray-100 text-gray-800 font-semibold py-2 px-4 border
          border-gray-400 rounded shadow"
            >
              {gridView ? "Switch List View" : "Switch Grid View"}
            </button>

          </div>
        </div>

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
                            src={product.image || "/no-image.png"}
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


      </div>

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

      {/* form dialoge */}
      <div>

        <Dialog open={open} onClose={setOpen} className="relative z-[99999]">
          <DialogBackdrop
            transition
            className="fixed inset-0 bg-gray-900/50 transition-opacity duration-500 ease-in-out data-closed:opacity-0"
          />

          <div className="fixed inset-0 overflow-hidden">
            <div className="absolute inset-0 overflow-hidden">
              <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10 sm:pl-16">
                <DialogPanel
                  transition
                  className="pointer-events-auto relative w-6xl transform transition duration-500 ease-in-out data-closed:translate-x-full sm:duration-700"
                >

                  <div className="relative flex h-full flex-col overflow-y-auto bg-white py-6 shadow-xl after:absolute after:inset-y-0 after:left-0 after:w-px after:bg-white/10">
                    <div className="px-4 sm:px-6 border-b pb-5">
                      <DialogTitle className="text-base font-semibold text-gray-800 flex items-center"><button className="p-2" onClick={() => setOpen(false)}><MdClose size={20} /></button> {editProduct ? "Edit Product" :' Add New Product'} </DialogTitle>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <AddProduct fetchProducts={fetchProducts} setOpen={setOpen} setEditProduct={setEditProduct} editProduct={editProduct} />
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </div>
        </Dialog>
      </div>

    </div>
  )
}

export default ItemPage