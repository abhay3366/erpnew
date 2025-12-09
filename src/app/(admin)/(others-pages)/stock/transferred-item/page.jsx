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
  const [stockData, setStockData] = useState([])

  const [productWithSerial, setProductWithSerial] = useState([])
  // console.log("🚀 ~ TransferredItems ~ productWithSerial:", productWithSerial)

  // console.log("🚀 ~ TransferredItems ~ selectedProduct:", selectedProduct)

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

  //fetch stock
  const fetchStock = async () => {
    try {
      const res = await fetch('http://localhost:5001/stocks');
      const data = await res.json();
      setStockData(data);
    } catch (error) {
      console.log(error);
    }
  };




  // if(selectedProduct.isSerial=="1"){


  // }

  // Form submit
  // const onSubmit = async (data) => {
  //   try {
  //     const res = await fetch("http://localhost:5001/transfers", {
  //       method: "POST",
  //       headers: {
  //         "Content-Type": "application/json",
  //       },
  //       body: JSON.stringify(data),
  //     });

  //     const result = await res.json(); // await here
  //     console.log("🚀 ~ onSubmit ~ result:", result)

  //     if (res.ok) {
  //       setModalOpen(false)
  //       toast.success("Transfer Product Successfully");

  //     } else {
  //       toast.error(result.message || "Something went wrong");
  //     }
  //   } catch (error) {
  //     console.log(error);
  //     toast.error("Network error or server error");
  //   }
  // };

  const onSubmit = async (data) => {
  try {
    // Agar product serial-based hai to quantity auto set karo
    if (selectedProduct?.isSerial === "1") {
      data.quantity = data.serialNumber.length;
    }

    // 1️⃣ Transfer ko save karo
    const transferRes = await fetch("http://localhost:5001/transfers", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(data),
    });

    const transferResult = await transferRes.json();

    if (!transferRes.ok) {
      throw new Error(transferResult.message || "Failed to save transfer");
    }

    // 2️⃣ Branch stock update logic
    // Fetch current branch stock
    const branchStockRes = await fetch("http://localhost:5001/branch_stock");
    const branchStock = await branchStockRes.json();

    // Find stock for fromBranch
    const fromStock = branchStock.find(
      s => s.branch_id === data.fromBranch && s.product_id === data.product
    );

    if (!fromStock) throw new Error("No stock available in fromBranch");

    // Check availability
    if (fromStock.isSerial === "1") {
      const missingSerials = data.serialNumber.filter(
        sn => !fromStock.serial_numbers.includes(sn)
      );
      if (missingSerials.length) throw new Error("Some serial numbers not available");
    } else {
      if (fromStock.quantity < data.quantity) throw new Error("Insufficient quantity");
    }

    // Deduct from fromBranch
    if (fromStock.isSerial === "1") {
      fromStock.serial_numbers = fromStock.serial_numbers.filter(
        sn => !data.serialNumber.includes(sn)
      );
      fromStock.quantity = fromStock.serial_numbers.length;
    } else {
      fromStock.quantity -= data.quantity;
    }

    await fetch(`http://localhost:5001/branch_stock/${fromStock.id}`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(fromStock)
    });

    // Add to toBranch
    let toStock = branchStock.find(
      s => s.branch_id === data.toBranch && s.product_id === data.product
    );

    if (toStock) {
      if (toStock.isSerial === "1") {
        toStock.serial_numbers = [...toStock.serial_numbers, ...(data.serialNumber || [])];
        toStock.quantity = toStock.serial_numbers.length;
      } else {
        toStock.quantity += data.quantity;
      }

      await fetch(`http://localhost:5001/branch_stock/${toStock.id}`, {
        method: "PUT",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(toStock)
      });
    } else {
      const newStock = {
        product_id: data.product,
        branch_id: data.toBranch,
        vendor_id: fromStock.vendor_id,
        quantity: data.quantity,
        isSerial: fromStock.isSerial,
        serial_numbers: fromStock.isSerial === "1" ? data.serialNumber : [],
        status: "active"
      };

      await fetch("http://localhost:5001/branch_stock", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStock)
      });
    }

    // Success
    toast.success("Transfer and Branch Stock updated successfully");
    setModalOpen(false);

    // Refresh stock or transfers if needed
    fetchStock();

  } catch (error) {
    console.log(error);
    toast.error(error.message || "Something went wrong");
  }
};




  useEffect(() => {
    fetchProduct();
    fetchBranches();
    fetchStock();
  }, []);

  useEffect(() => {
    checkIsSerialAndFindMacSerial();
  }, [selectedProduct, stockData]);




  const checkIsSerialAndFindMacSerial = () => {
    const filterData = stockData.filter((el) => (el.product.id == selectedProduct?.value || null))
    console.log("🚀 ~ TransferredItems ~ filterData:", filterData)
    if (filterData[0]?.isSerial == "0") {  // is serial no
      const isSerialNoProudct = filterData[0]?.items[0].quantity;
    } else {
      const isSerialYesProduct = filterData[0]?.items  // is serial yes
      setProductWithSerial(isSerialYesProduct);
    }
  }


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
                <div className="grid grid-cols-2 md:grid-cols-1 gap-4 items-end">
                  <div>
                    <label className="font-medium text-sm mb-2 block">Serial Number</label>

                    <Controller
                      name="serialNumber"
                      control={control}
                      rules={{ required: true }}
                      render={({ field }) => (
                        <Select
                          {...field}
                          isMulti
                          options={productWithSerial?.map(b => ({
                            value: b.serialNumber,
                            label: `${b.serialNumber} | MAC: ${b.macAddress} | Warranty: ${b.warranty}`,
                            macAddress: b.macAddress,
                            warranty: b.warranty
                          }))}
                          value={productWithSerial
                            ?.map(b => ({
                              value: b.serialNumber,
                              label: `${b.serialNumber} | MAC: ${b.macAddress} | Warranty: ${b.warranty}`,
                              macAddress: b.macAddress,
                              warranty: b.warranty
                            }))
                            .filter(o => field.value?.includes(o.value))} // ✅ multi-select ke liye
                          onChange={(selectedOptions) => field.onChange(selectedOptions.map(o => o.value))} // ✅ multi-select ke liye
                        />
                      )}
                    />


                    {errors.serialNumber && <p className="text-red-500 text-sm mt-1">Serial Number is required</p>}
                  </div>

                  <div>
                    <label className="font-medium text-sm mb-2 block">Quantity</label>
                    <input
                      disabled
                      type="number"
                      value={1}
                      {...register("quantity", { required: true })}
                      className="border border-gray-300 rounded-xl p-2 w-full"
                    />
                    {errors.quantity && <p className="text-red-500 text-sm mt-1">Quantity is required</p>}
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
