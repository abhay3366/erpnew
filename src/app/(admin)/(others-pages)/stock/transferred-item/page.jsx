"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useEffect, useState, useMemo, useCallback } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { IoMdAdd } from "react-icons/io";
import { MdClose } from "react-icons/md";
import Select from "react-select";
import RandomSerialList from "../../../../../components/Transfer/RandomSerialList";
import ManualSerialSelection from "../../../../../components/Transfer/ManualSerialSelection";
import TransfersList from "../../../../../components/Transfer/TransfersList";
import DataFetcher from "../../../../../components/DataFetcher";
import { useProducts } from "../../../../../hooks/useProducts";
import { useStock } from "../../../../../hooks/useStock";

const TransferredItems = () => {
  const { register, handleSubmit, watch, control, formState: { errors }, reset, setValue } = useForm();
  const [isModalOpen, setModalOpen] = useState(false);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedMode, setSelectedMode] = useState("random");
  const [productWithSerial, setProductWithSerial] = useState([]);
  const [randomSerialSelectedProduct, setRandomSerialSelectedProduct] = useState([]);
  const [manualSerialSelectedProduct, setManualSerialSelectedProduct] = useState([]);

  // Get data from custom hooks
  const { productMap } = useProducts();
  const { stock, stockMap, fetchStock } = useStock();

  // Watch form values
  const productId = watch("productId");
  const inputQuantity = watch("quantity");
  const fromWarehouse = watch("fromWarehouse");
  const toWarehouse = watch("toWarehouse");
  const serials = watch("serial");

  // Filter products with stock available
  const availableProducts = useMemo(() => {
    return stock.filter(item => item.productId && item.quantity > 0);
  }, [stock]);

  // Get selected product details
  const selectedProduct = useMemo(() => {
    if (!productId) return null;
    return productMap[productId];
  }, [productId, productMap]);

  // Get stock for selected product
  const selectedProductStock = useMemo(() => {
    if (!productId) return [];
    return stock.filter(item => item.productId === productId);
  }, [productId, stock]);

  // Get available warehouses for selected product
  const productWarehouses = useMemo(() => {
    if (!productId) return [];
    const uniqueWarehouseIds = [...new Set(selectedProductStock.map(item => item.warehouseId))];
    return uniqueWarehouseIds;
  }, [productId, selectedProductStock]);

  // Filter non-serial stock data
  const noSerialStock = useMemo(() => {
    return selectedProductStock.find(item => item.isSerial === "0");
  }, [selectedProductStock]);

  // Fetch warehouses on mount
  useEffect(() => {
    const fetchWarehouses = async () => {
      try {
        const res = await fetch(`http://localhost:5001/warehouses`);
        const data = await res.json();
        setWarehouses(data);
      } catch (error) {
        console.error("Error fetching warehouses:", error);
        toast.error("Failed to load warehouses");
      }
    };
    fetchWarehouses();
  }, []);

  // Check for serial products and prepare serial data
  useEffect(() => {
    if (!selectedProductStock.length || !selectedProduct?.hasSerialNo) {
      setProductWithSerial([]);
      return;
    }

    // Find first stock entry with items (assuming serial items are stored in items array)
    const serialStock = selectedProductStock.find(item => item.items?.length > 0);
    if (serialStock?.items) {
      setProductWithSerial(serialStock.items);
    }
  }, [selectedProductStock, selectedProduct]);

  // Validate warehouse selection
  useEffect(() => {
    if (fromWarehouse && toWarehouse && fromWarehouse === toWarehouse) {
      toast.error("From Warehouse must be different from To Warehouse");
      setValue("toWarehouse", "");
    }
  }, [fromWarehouse, toWarehouse, setValue]);

  // Handle random serial selection when quantity changes
  useEffect(() => {
    if (!inputQuantity || inputQuantity <= 0 || !selectedProduct?.hasSerialNo || selectedMode !== "random") return;

    const totalAvailable = productWithSerial?.length || 0;
    
    if (inputQuantity > totalAvailable) {
      toast.error("Insufficient Stock!");
      setRandomSerialSelectedProduct([]);
      return;
    }

    const shuffled = [...productWithSerial].sort(() => 0.5 - Math.random());
    const selectedItems = shuffled.slice(0, inputQuantity).map(s => ({
      serial: s.serial,
      mac: s.mac,
      warranty: s.warranty,
    }));

    setRandomSerialSelectedProduct(selectedItems);
  }, [inputQuantity, productWithSerial, selectedProduct, selectedMode]);

  // Handle manual serial selection
  useEffect(() => {
    if (!serials?.length || !productWithSerial.length) {
      setManualSerialSelectedProduct([]);
      return;
    }

    const selectedProducts = productWithSerial.filter(p =>
      serials.includes(p.serial)
    );
    setManualSerialSelectedProduct(selectedProducts);
  }, [serials, productWithSerial]);

  // Reset form when modal closes
  const handleCloseModal = () => {
    reset();
    setSelectedMode("random");
    setProductWithSerial([]);
    setRandomSerialSelectedProduct([]);
    setManualSerialSelectedProduct([]);
    setModalOpen(false);
  };

  // Form submission
  const onSubmit = async (data) => {
    try {
      // Validate warehouses
      if (data.fromWarehouse === data.toWarehouse) {
        toast.error("From and To warehouses cannot be the same");
        return;
      }

      // Prepare transfer data
      const transferData = {
        ...data,
        productName: selectedProduct?.name || "",
        date: new Date().toISOString(),
        status: "pending" // or "completed" based on your logic
      };

      // Handle serial vs non-serial products
      if (selectedProduct?.hasSerialNo) {
        if (selectedMode === "manual") {
          transferData.quantity = manualSerialSelectedProduct.length;
          transferData.serial = manualSerialSelectedProduct.map(s => s.serial);
          transferData.serials = manualSerialSelectedProduct;
        } else {
          transferData.quantity = randomSerialSelectedProduct.length;
          transferData.serial = randomSerialSelectedProduct.map(s => s.serial);
          transferData.serials = randomSerialSelectedProduct;
        }
      } else {
        // Non-serial product
        transferData.serial = [];
        transferData.serials = [];
        
        // Validate quantity
        const availableQty = noSerialStock?.quantity || 0;
        if (data.quantity > availableQty) {
          toast.error(`Insufficient stock. Available: ${availableQty}`);
          return;
        }
      }

      // Save transfer
      const res = await fetch("http://localhost:5001/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });

      if (!res.ok) {
        throw new Error("Failed to save transfer");
      }

      // Update stock (if needed - depends on your business logic)
      await updateStockAfterTransfer(data, selectedProductStock, transferData.quantity);

      toast.success("Product transferred successfully!");
      handleCloseModal();
      fetchStock(); // Refresh stock data

    } catch (error) {
      console.error("Transfer error:", error);
      toast.error(error.message || "Failed to transfer product");
    }
  };

  // Update stock after transfer
  const updateStockAfterTransfer = async (data, productStock, quantity) => {
    try {
      // Find source warehouse stock
      const sourceStock = productStock.find(item => 
        item.warehouseId === data.fromWarehouse
      );

      if (sourceStock) {
        const newQuantity = sourceStock.quantity - quantity;
        
        await fetch(`http://localhost:5001/stocks/${sourceStock.id}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ quantity: newQuantity }),
        });
      }

      // You might also want to add stock to destination warehouse
      // This depends on your business logic

    } catch (error) {
      console.error("Stock update error:", error);
      toast.error("Product transferred but stock update failed");
    }
  };

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

      <TransfersList />

      {/* Transfer Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[999]">
          <div className="bg-white max-h-[600px] overflow-y-auto rounded-xl p-6 w-full max-w-4xl shadow-lg">
            <div className="flex justify-between items-center mb-6">
              <h2 className="text-lg font-semibold">Transfer Item</h2>
              <MdClose className="cursor-pointer text-xl" onClick={handleCloseModal} />
            </div>
            
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                {/* Product Selection */}
                <div>
                  <label className="font-medium text-sm mb-2 block">Select Item</label>
                  <Controller
                    name="productId"
                    control={control}
                    rules={{ required: "Product is required" }}
                    render={({ field }) => (
                      <Select
                        options={availableProducts.map(p => ({
                          value: p.productId,
                          label: p.productId, // You might want to show product name instead
                          quantity: p.quantity,
                          warehouseId: p.warehouseId
                        }))}
                        value={availableProducts
                          .map(p => ({ value: p.productId, label: p.productId }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => {
                          field.onChange(option?.value || "");
                          // Reset related fields when product changes
                          setValue("quantity", "");
                          setValue("serial", []);
                        }}
                        formatOptionLabel={(option) => (
                          <DataFetcher type="product" id={option.value} />
                        )}
                        placeholder="Select Product"
                        isClearable
                      />
                    )}
                  />
                  {errors.productId && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.productId.message}
                    </p>
                  )}
                </div>

                {/* From Warehouse */}
                <div>
                  <label className="font-medium text-sm mb-2 block">From Warehouse</label>
                  <Controller
                    name="fromWarehouse"
                    control={control}
                    rules={{ required: "Source warehouse is required" }}
                    render={({ field }) => (
                      <Select
                        options={productWarehouses.map(w => ({
                          value: w,
                          label: w
                        }))}
                        value={productWarehouses
                          .map(w => ({ value: w, label: w }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => field.onChange(option?.value || "")}
                        formatOptionLabel={(option) => (
                          <DataFetcher type="fromWarehouse" id={option.value} />
                        )}
                        placeholder="Select Warehouse"
                        isClearable
                        isDisabled={!productId}
                      />
                    )}
                  />
                  {errors.fromWarehouse && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.fromWarehouse.message}
                    </p>
                  )}
                </div>

                {/* To Warehouse */}
                <div>
                  <label className="font-medium text-sm mb-2 block">To Warehouse</label>
                  <Controller
                    name="toWarehouse"
                    control={control}
                    rules={{ required: "Destination warehouse is required" }}
                    render={({ field }) => (
                      <Select
                        options={warehouses.map(w => ({ 
                          value: w.id, 
                          label: w.name || w.fromWarehouse 
                        }))}
                        value={warehouses
                          .map(w => ({ value: w.id, label: w.name || w.fromWarehouse }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => field.onChange(option?.value || "")}
                        placeholder="Select Warehouse"
                        isClearable
                      />
                    )}
                  />
                  {errors.toWarehouse && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.toWarehouse.message}
                    </p>
                  )}
                </div>
              </div>

              {/* Quantity/Serial Section */}
              {selectedProduct?.hasSerialNo ? (
                <div>
                  <div className="w-full">
                    <div className="flex border-b border-gray-300">
                      <label className="px-4 py-2 text-sm font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="random"
                          className="hidden"
                          checked={selectedMode === "random"}
                          onChange={() => setSelectedMode("random")}
                        />
                        <span className={`pb-2 inline-block ${selectedMode === "random"
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "text-gray-600 hover:text-blue-600 hover:border-blue-400"
                          }`}>
                          Random
                        </span>
                      </label>

                      <label className="px-4 py-2 text-sm font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="manual"
                          className="hidden"
                          checked={selectedMode === "manual"}
                          onChange={() => setSelectedMode("manual")}
                        />
                        <span className={`pb-2 inline-block ${selectedMode === "manual"
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "text-gray-600 hover:text-blue-600 hover:border-blue-400"
                          }`}>
                          Manual
                        </span>
                      </label>
                    </div>

                    <div className="mt-4">
                      {selectedMode === "random" && (
                        <div>
                          <div>
                            <label className="font-medium text-sm mb-2 block">Quantity</label>
                            <input
                              type="number"
                              {...register("quantity", { 
                                required: "Quantity is required",
                                min: { value: 1, message: "Minimum quantity is 1" },
                                max: { 
                                  value: productWithSerial?.length || 0, 
                                  message: `Maximum available: ${productWithSerial?.length || 0}` 
                                }
                              })}
                              className="border border-gray-300 rounded-xl p-2 w-full"
                              disabled={!productId}
                            />
                            {errors.quantity && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.quantity.message}
                              </p>
                            )}
                          </div>
                          {randomSerialSelectedProduct.length > 0 && (
                            <div className="p-2 mt-2 bg-amber-100 rounded-lg">
                              <RandomSerialList randomSerialSelectedProduct={randomSerialSelectedProduct} />
                            </div>
                          )}
                        </div>
                      )}

                      {selectedMode === "manual" && (
                        <div className="space-y-4">
                          <div>
                            <label className="font-medium text-sm mb-2 block">Serial Numbers</label>
                            <Controller
                              name="serial"
                              control={control}
                              rules={{ required: "At least one serial number is required" }}
                              render={({ field }) => (
                                <Select
                                  isMulti
                                  options={productWithSerial?.map(b => ({
                                    value: b.serial,
                                    label: `${b.serial} | MAC: ${b.mac} | Warranty: ${b.warranty}`,
                                    mac: b.mac,
                                    warranty: b.warranty
                                  }))}
                                  value={productWithSerial
                                    ?.map(b => ({
                                      value: b.serial,
                                      label: `${b.serial} | MAC: ${b.mac} | Warranty: ${b.warranty}`,
                                      mac: b.mac,
                                      warranty: b.warranty
                                    }))
                                    .filter(o => field.value?.includes(o.value))}
                                  onChange={(selectedOptions) => 
                                    field.onChange(selectedOptions.map(o => o.value))
                                  }
                                  placeholder="Select serial numbers"
                                  isDisabled={!productId}
                                />
                              )}
                            />
                            {errors.serial && (
                              <p className="text-red-500 text-sm mt-1">
                                {errors.serial.message}
                              </p>
                            )}
                          </div>
                          
                          {manualSerialSelectedProduct.length > 0 && (
                            <ManualSerialSelection 
                              mannualSerialSelectedProduct={manualSerialSelectedProduct} 
                            />
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              ) : (
                // Non-serial product quantity input
                <div>
                  <label className="font-medium text-sm mb-2 block">Quantity</label>
                  <input
                    type="number"
                    {...register("quantity", { 
                      required: "Quantity is required",
                      min: { value: 1, message: "Minimum quantity is 1" },
                      max: { 
                        value: noSerialStock?.quantity || 0, 
                        message: `Maximum available: ${noSerialStock?.quantity || 0}` 
                      }
                    })}
                    className="border border-gray-300 rounded-xl p-2 w-full"
                    disabled={!productId}
                  />
                  {errors.quantity && (
                    <p className="text-red-500 text-sm mt-1">
                      {errors.quantity.message}
                    </p>
                  )}
                  {noSerialStock && (
                    <p className="text-sm text-gray-600 mt-1">
                      Available stock: {noSerialStock.quantity}
                    </p>
                  )}
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button 
                  type="button" 
                  onClick={handleCloseModal} 
                  className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
                >
                  Close
                </button>
                <button 
                  type="submit" 
                  className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600"
                >
                  Transfer
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