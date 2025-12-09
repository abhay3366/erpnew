"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useEffect, useState } from "react";
import { Controller, useForm } from "react-hook-form";
import toast from "react-hot-toast";
import { IoMdAdd } from "react-icons/io";
import { MdClose } from "react-icons/md";
import Select from "react-select";


const TransferredItems = () => {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm();
  const [isModalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [branches, setBranches] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);

  // Fetch products
  const fetchProduct = async () => {
    try {
      const res = await fetch('http://localhost:5001/products');
      const data = await res.json();
      setProducts(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch branches
  const fetchBranches = async () => {
    try {
      const res = await fetch('http://localhost:5001/branches');
      const data = await res.json();
      setBranches(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Form submit
 const onSubmit = async (data) => {
  try {
    const res = await fetch("http://localhost:5001/transfers", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(data),
    });

    const result = await res.json(); // await here

    if (res.ok) {
      setModalOpen(false)
      toast.success("Transfer Product Successfully");

    } else {
      toast.error(result.message || "Something went wrong");
    }
  } catch (error) {
    console.log(error);
    toast.error("Network error or server error");
  }
};

  useEffect(() => {
    fetchProduct();
    fetchBranches();
  }, []);

  // Watch selected product to show quantity / serial row
  const watchProduct = watch("product");

  return (
    <div>
      <PageBreadcrumb pageTitle="Transfer Items" />

      <div className="mx-auto p-6 space-y-6">
        <div className="p-3 rounded-xl border border-gray-200 mt-4">
          <div className="flex justify-end">
            <button
              onClick={() => setModalOpen(true)}
              className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white rounded-lg"
            >
              <IoMdAdd /> Transfer Item
            </button>
          </div>
        </div>
      </div>

      {/* Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white max-h-[600px] overflow-y-auto rounded-xl p-6 w-full max-w-4xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Transfer Item</h2>
              <MdClose
                className="cursor-pointer text-xl"
                onClick={() => setModalOpen(false)}
              />
            </div>

            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              {/* Top Fields */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product */}
                <div>
                  <label className="font-medium text-sm mb-2 block">Select Item</label>
                  <Controller
                    name="product"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={products.map(p => ({
                          value: p.id,
                          label: p.productName,
                          isSerial: p.isSerial
                        }))}
                        value={products
                          .map(p => ({ value: p.id, label: p.productName }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => {
                          field.onChange(option.value);
                          setSelectedProduct(option); // for conditional rendering
                        }}
                      />
                    )}
                  />
                  {errors.product && <p className="text-red-500 text-sm mt-1">Product is required</p>}
                </div>

                {/* From Branch */}
                <div>
                  <label className="font-medium text-sm mb-2 block">From Branch</label>
                  <Controller
                    name="fromBranch"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={branches.map(b => ({ value: b.id, label: b.branchName }))}
                        value={branches
                          .map(b => ({ value: b.id, label: b.branchName }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => field.onChange(option.value)}
                      />
                    )}
                  />
                  {errors.fromBranch && <p className="text-red-500 text-sm mt-1">From Branch is required</p>}
                </div>

                {/* To Branch */}
                <div>
                  <label className="font-medium text-sm mb-2 block">To Branch</label>
                  <Controller
                    name="toBranch"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={branches.map(b => ({ value: b.id, label: b.branchName }))}
                        value={branches
                          .map(b => ({ value: b.id, label: b.branchName }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => field.onChange(option.value)}
                      />
                    )}
                  />
                  {errors.toBranch && <p className="text-red-500 text-sm mt-1">To Branch is required</p>}
                </div>
              </div>

              {/* Rows */}
              {selectedProduct?.isSerial === "0" ? (
                <div>
                  <label className="font-medium text-sm mb-2 block">Quantity</label>
                  <input
                    type="number"
                    {...register("quantity", { required: true })}
                    className="border border-gray-300 rounded-xl p-2 w-full"
                  />
                  {errors.quantity && <p className="text-red-500 text-sm mt-1">Quantity is required</p>}
                </div>
              ) : (
                <div className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end">
                  <div>
                    <label className="font-medium text-sm mb-2 block">Serial Number</label>
                    <select
                      {...register("serialNumber", { required: true })}
                      className="border border-gray-300 rounded-xl p-2 w-full"
                    >
                      <option value="">Select Serial</option>
                      {/* Map serial options here if available */}
                    </select>
                    {errors.serialNumber && <p className="text-red-500 text-sm mt-1">Serial Number is required</p>}
                  </div>

                  <div>
                    <label className="font-medium text-sm mb-2 block">Quantity</label>
                    <input
                      type="number"
                      {...register("quantity", { required: true })}
                      className="border border-gray-300 rounded-xl p-2 w-full"
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">Quantity is required</p>}
                  </div>

                  <div className="flex items-end">
                    <button
                      type="button"
                      className="bg-green-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 hover:bg-green-800"
                    >
                      <IoMdAdd /> Add More
                    </button>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setModalOpen(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Close
                </button>
                <button
                  type="submit"
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
};

export default TransferredItems;
