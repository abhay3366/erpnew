"use client";

import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { useState, useEffect } from "react";
import { useForm } from "react-hook-form";
import TransfersList from "../../../../../components/Transfer/TransfersList";

const TransferredItems = () => {
  const [showModal, setShowModal] = useState(false);

  const [itemOptions, setItemOptions] = useState([]);
  const [branchOptions, setBranchOptions] = useState([]);
  const [serialOptions, setSerialOptions] = useState([]);

  const [rows, setRows] = useState([{ serial: "", quantity: "" }]);
  const [fetchDataBasedOnId, setFetchDataBasedOnId] = useState(null);

  const {
    register,
    handleSubmit,
    formState: { errors },
    watch,
    setValue,
    reset,
  } = useForm();

  const selectedItem = watch("product");

  // Fetch Products
  useEffect(() => {
    fetchItems();
    fetchBranches();
  }, []);

  const fetchItems = async () => {
    const res = await fetch("http://localhost:5001/products");
    const data = await res.json();
    setItemOptions(
      data.map((item) => ({
        id: item.id,
        productName: item.productName,
      }))
    );
  };

  // Fetch Product Data + Serial Numbers
  useEffect(() => {
    if (!selectedItem) return;

    fetchItemById(selectedItem);
    fetchSerials(selectedItem);
  }, [selectedItem]);

  const fetchItemById = async (id) => {
    const res = await fetch(`http://localhost:5001/products?id=${id}`);
    const data = await res.json();
    setFetchDataBasedOnId(data[0]); // assuming one object
  };

  const fetchSerials = async (itemId) => {
    const res = await fetch("http://localhost:5001/saveStocks");
    const data = await res.json();
    const serials = data
      .filter((stock) => stock.id == itemId)
      .map((s) => ({
        value: s.serialNumber,
        label: s.serialNumber,
      }));

    setSerialOptions(serials);
  };

  // Fetch Branches
  const fetchBranches = async () => {
    const res = await fetch("http://localhost:5001/branches");
    const data = await res.json();
    setBranchOptions(
      data.map((branch) => ({
        id: branch.id,
        branchName: branch.branchName,
      }))
    );
  };

  // Dynamic Row Functions
  const addRow = () => {
    setRows([...rows, { serial: "", quantity: "" }]);
  };

  const updateRow = (index, field, value) => {
    const updated = [...rows];
    updated[index][field] = value;
    setRows(updated);
  };

  // Save Form
  const onSubmit = async (data) => {
    const sendData = {
      productId: data.product,
      productName: data.productName,

      fromBranchId: data.fromBranch,
      fromBranchName: data.fromBranchName,

      toBranchId: data.toBranch,
      toBranchName: data.toBranchName,

      rows,
    };

    await fetch("http://localhost:5001/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(sendData),
    });

    alert("Data Saved!");
    reset();
    setRows([{ serial: "", quantity: "" }]);
    setShowModal(false);
  };

  return (
    <div>
      <PageBreadcrumb pageTitle="Transfer Items" />

      <div className="mx-auto p-6 space-y-6">
        <div className="p-3 rounded-xl border border-gray-200 mt-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowModal(true)}
              className="bg-brand-500 hover:bg-brand-600 inline-flex items-center gap-2 px-4 py-3 text-sm font-medium text-white rounded-lg"
            >
              <IoMdAdd /> Transfer Item
            </button>
          </div>
          {/* Transfer list */}
      <TransfersList/>
        </div>
      </div>

      
      {/* Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white max-h-[600px] overflow-y-auto rounded-xl p-6 w-full max-w-4xl shadow-lg">
            <h2 className="text-lg font-semibold mb-6">Transfer Item</h2>

            <form onSubmit={handleSubmit(onSubmit)} className="space-y-6">
              {/* Top 3 Selects */}
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                
                {/* Product */}
                <div>
                  <label className="font-medium text-sm mb-2 block">
                    Select Product
                  </label>

                  <select
                    {...register("product", {
                      required: "Please select product",
                    })}
                    onChange={(e) => {
                      const selected = e.target.selectedOptions[0];
                      setValue(
                        "productName",
                        selected.getAttribute("data-name")
                      );
                    }}
                    className="border p-2 rounded-xl w-full"
                  >
                    <option value="">Select Product</option>
                    {itemOptions.map((item) => (
                      <option
                        key={item.id}
                        value={item.id}
                        data-name={item.productName}
                      >
                        {item.productName}
                      </option>
                    ))}
                  </select>

                  {errors.product && (
                    <p className="text-red-600">{errors.product.message}</p>
                  )}
                </div>

                {/* From Branch */}
                <div>
                  <label className="font-medium text-sm mb-2 block">
                    From Branch
                  </label>

                  <select
                    {...register("fromBranch", {
                      required: "Select From Branch",
                    })}
                    onChange={(e) => {
                      const selected = e.target.selectedOptions[0];
                      setValue(
                        "fromBranchName",
                        selected.getAttribute("data-name")
                      );
                    }}
                    className="border p-2 rounded-xl w-full"
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        data-name={b.branchName}
                      >
                        {b.branchName}
                      </option>
                    ))}
                  </select>

                  {errors.fromBranch && (
                    <p className="text-red-600">{errors.fromBranch.message}</p>
                  )}
                </div>

                {/* To Branch */}
                <div>
                  <label className="font-medium text-sm mb-2 block">
                    To Branch
                  </label>

                  <select
                    {...register("toBranch", {
                      required: "Select To Branch",
                    })}
                    onChange={(e) => {
                      const selected = e.target.selectedOptions[0];
                      setValue(
                        "toBranchName",
                        selected.getAttribute("data-name")
                      );
                    }}
                    className="border p-2 rounded-xl w-full"
                  >
                    <option value="">Select Branch</option>
                    {branchOptions.map((b) => (
                      <option
                        key={b.id}
                        value={b.id}
                        data-name={b.branchName}
                      >
                        {b.branchName}
                      </option>
                    ))}
                  </select>

                  {errors.toBranch && (
                    <p className="text-red-600">{errors.toBranch.message}</p>
                  )}
                </div>
              </div>

              {/* Serial / Quantity Section */}
              {fetchDataBasedOnId && fetchDataBasedOnId.isSerial === "1" ? (
                rows.map((row, index) => (
                  <div
                    key={index}
                    className="grid grid-cols-1 md:grid-cols-4 gap-4 items-end"
                  >
                    <div>
                      <label className="font-medium text-sm mb-2 block">
                        Serial Number
                      </label>

                      <select
                        value={row.serial}
                        onChange={(e) =>
                          updateRow(index, "serial", e.target.value)
                        }
                        className="border p-2 rounded-xl w-full"
                      >
                        <option value="">Select Serial</option>
                        {serialOptions.map((s) => (
                          <option key={s.value} value={s.value}>
                            {s.label}
                          </option>
                        ))}
                      </select>
                    </div>

                    <div>
                      <label className="font-medium text-sm mb-2 block">
                        Quantity
                      </label>

                      <input
                        type="number"
                        value={row.quantity}
                        onChange={(e) =>
                          updateRow(index, "quantity", e.target.value)
                        }
                        className="border p-2 rounded-xl w-full"
                      />
                    </div>

                    {/* Add More */}
                    <div className="flex items-end">
                      {index === rows.length - 1 && (
                        <button
                          type="button"
                          onClick={addRow}
                          className="bg-green-600 text-white px-4 py-2 rounded-lg"
                        >
                          <IoMdAdd /> Add More
                        </button>
                      )}
                    </div>
                  </div>
                ))
              ) : (
                <div>
                  <label className="font-medium text-sm mb-2 block">
                    Quantity
                  </label>
                  <input
                    type="number"
                    onChange={(e) =>
                      updateRow(0, "quantity", e.target.value)
                    }
                    className="border p-2 rounded-xl w-[270px]"
                  />
                </div>
              )}

              {/* Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button
                  type="button"
                  onClick={() => setShowModal(false)}
                  className="px-4 py-2 bg-gray-200 rounded-lg"
                >
                  Close
                </button>

                <button className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
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
