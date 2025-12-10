"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { useEffect, useState } from "react";
import { Controller, useForm, useWatch } from "react-hook-form";
import toast from "react-hot-toast";
import { IoMdAdd } from "react-icons/io";
import { MdClose } from "react-icons/md";
import Select from "react-select";
import RandomSerialList from "../../../../../components/Transfer/RandomSerialList";
import ManualSerialSelection from "../../../../../components/Transfer/ManualSerialSelection";

const TransferredItems = () => {
  const { register, handleSubmit, watch, control, formState: { errors } } = useForm();
  const [isModalOpen, setModalOpen] = useState(false);
  const [products, setProducts] = useState([]);
  const [warehouses, setWarehouses] = useState([]);
  const [selectedProduct, setSelectedProduct] = useState(null);
  const [stockData, setStockData] = useState([]);
  const [selected, setSelected] = useState("random");
  const [productWithSerial, setProductWithSerial] = useState([]);
  const [randomSerialSelectedProduct, setRandomSerialSelectedProduct] = useState([]);
  const [manualSerialSelectedProduct, setManualSerialSelectedProduct] = useState([]);
  const [chooseProduct,setChooseProduct]=useState(null)

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

  // Fetch warehouses
  const fetchWarehouses = async () => {
    try {
      const res = await fetch('http://localhost:5001/branches'); // assuming API still returns warehouses
      const data = await res.json();
      setWarehouses(data);
    } catch (error) {
      console.log(error);
    }
  };

  // Fetch stock
  const fetchStock = async () => {
    try {
      const res = await fetch('http://localhost:5001/stocks');
      const data = await res.json();
      setStockData(data);
    } catch (error) {
      console.log(error);
    }
  };

  // fetch stock based on id
  //  const id = watch("product");
  //   console.log("🚀 ~ TransferredItems ~ id:", id)
  //   const fetchStockBasedOnId = async () => {
 
  //   console.log("🚀 ~ fetchStockBasedOnId ~ id:", id)
  //   console.log(`http://localhost:5001/stocks/${id}`)
  //   try {
  //     const res = await fetch(`http://localhost:5001/stocks/${id}`);
  //     const data = await res.json();
  //     console.log("🚀 ~ fetchStockBasedOnId ~ data:", data)
  //     setStockData(data);
  //   } catch (error) {
  //     console.log(error);
  //   }
  // };

  // useEffect(()=>{
  //   fetchStockBasedOnId();
  // },[id])


  // Form submit
  const onSubmit = async (data) => {
    try {
      const res = await fetch("http://localhost:5001/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(data),
      });
      const result = await res.json();
      if (res.ok) {
        setModalOpen(false);
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
    fetchWarehouses();
    fetchStock();
   
  }, []);

  useEffect(() => {
    checkIsSerialAndFindMacSerial();
  }, [selectedProduct, stockData]);

  const checkIsSerialAndFindMacSerial = () => {
    const filterData = stockData.filter(el => (el.product.id == selectedProduct?.value || null));
    if (filterData[0]?.isSerial == "0") {
      // Non-serial product
    } else {
      const isSerialYesProduct = filterData[0]?.items;
      setProductWithSerial(isSerialYesProduct);
    }
  };

  // --------------------------watch product---------------------------------
  //---------------------------------------------------------------------------

 


 // ---------watch formhouse and to house ------------------------------------------

  const fromWarehouse = useWatch({ control, name: "fromWarehouse" });
  const toWarehouse = useWatch({ control, name: "toWarehouse" });

  useEffect(() => {
    if (fromWarehouse && toWarehouse && fromWarehouse === toWarehouse) {
      toast.error("From Warehouse must be different from To Warehouse");
      return;
    }
  }, [fromWarehouse, toWarehouse]);


//------------------------------------------------------------------------------
//-------------------------------------------------------------------------------


// ----------watch serialqauantit----------------------------------------------------
//--------------------------------------------------------------------------------
  const qty = watch("serialquantity");
  useEffect(() => {
    if (!qty) return;
    if (qty > productWithSerial.length || null) {
      toast.error("Insufficient balance!");
      return;
    }
    const shuffled = [...productWithSerial].sort(() => 0.5 - Math.random());
    const selectedSerials = shuffled.slice(0, qty).map(s => ({
      serialNumber: s.serialNumber,
      macAddress: s.macAddress,
      warranty: s.warranty
    }));
    setRandomSerialSelectedProduct(selectedSerials);
  }, [qty]);

//---------------------------------------------------------------------------------------
//-------------------------------------------------------------------------------------

// --------watch serial------------------------------------------------------------------
//-----------------------------------------------------------------------------------

  const serialNumbers = watch("serialNumber");
  useEffect(() => {
    const selectedProducts = productWithSerial?.filter(p =>
      serialNumbers?.includes(p.serialNumber)
    );
    setManualSerialSelectedProduct(selectedProducts);
  }, [serialNumbers]);

//-----------------------------------------------------------------------------------------------

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
              <MdClose className="cursor-pointer text-xl" onClick={() => setModalOpen(false)} />
            </div>
            <form className="space-y-6" onSubmit={handleSubmit(onSubmit)}>
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
                          setSelectedProduct(option);
                         
                        }}
                      />
                    )}
                  />
                  {errors.product && <p className="text-red-500 text-sm mt-1">Product is required</p>}
                </div>

                {/* From Warehouse */}
                <div>
                  <label className="font-medium text-sm mb-2 block">From Warehouse</label>
                  <Controller
                    name="fromWarehouse"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={warehouses.map(w => ({ value: w.id, label: w.wareHouse }))}
                        value={warehouses
                          .map(w => ({ value: w.id, label: w.wareHouse }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => field.onChange(option.value)}
                      />
                    )}
                  />
                  {errors.fromWarehouse && <p className="text-red-500 text-sm mt-1">From Warehouse is required</p>}
                </div>

                {/* To Warehouse */}
                <div>
                  <label className="font-medium text-sm mb-2 block">To Warehouse</label>
                  <Controller
                    name="toWarehouse"
                    control={control}
                    rules={{ required: true }}
                    render={({ field }) => (
                      <Select
                        {...field}
                        options={warehouses.map(w => ({ value: w.id, label: w.wareHouse }))}
                        value={warehouses
                          .map(w => ({ value: w.id, label: w.wareHouse }))
                          .find(o => o.value === field.value) || null}
                        onChange={(option) => field.onChange(option.value)}
                      />
                    )}
                  />
                  {errors.toWarehouse && <p className="text-red-500 text-sm mt-1">To Warehouse is required</p>}
                </div>
              </div>

              {/* Serial / Quantity Section */}
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
                <div>
                  <div className="w-full">
                    <div className="flex border-b border-gray-300">
                      {/* Random Tab */}
                      <label className="px-4 py-2 text-sm font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="random"
                          className="hidden"
                          checked={selected === "random"}
                          onChange={() => setSelected("random")}
                        />
                        <span className={`pb-2 inline-block ${selected === "random"
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "text-gray-600 hover:text-blue-600 hover:border-blue-400"
                          }`}>Random</span>
                      </label>

                      {/* Manual Tab */}
                      <label className="px-4 py-2 text-sm font-medium cursor-pointer">
                        <input
                          type="radio"
                          name="mode"
                          value="manual"
                          className="hidden"
                          checked={selected === "manual"}
                          onChange={() => setSelected("manual")}
                        />
                        <span className={`pb-2 inline-block ${selected === "manual"
                          ? "border-b-2 border-blue-600 text-blue-600"
                          : "text-gray-600 hover:text-blue-600 hover:border-blue-400"
                          }`}>Manual</span>
                      </label>
                    </div>

                    {/* Tab Content */}
                    <div className="mt-4">
                      {selected === "random" && (
                        <div>
                          <div>
                            <label className="font-medium text-sm mb-2 block">Quantity</label>
                            <input
                              type="number"
                              {...register("serialquantity", { required: true })}
                              className="border border-gray-300 rounded-xl p-2 w-full"
                            />
                          </div>
                          <div className="p-2 mt-2 bg-amber-100 rounded-lg flex gap-1">
                            <RandomSerialList randomSerialSelectedProduct={randomSerialSelectedProduct} />
                          </div>
                        </div>
                      )}

                      {selected === "manual" && (
                        <div>
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
                                      .filter(o => field.value?.includes(o.value))}
                                    onChange={(selectedOptions) => field.onChange(selectedOptions.map(o => o.value))}
                                  />
                                )}
                              />
                              {errors.serialNumber && <p className="text-red-500 text-sm mt-1">Serial Number is required</p>}
                            </div>
                          </div>
                          <ManualSerialSelection mannualSerialSelectedProduct={manualSerialSelectedProduct} />
                        </div>
                      )}
                    </div>
                  </div>
                </div>
              )}

              {/* Action Buttons */}
              <div className="flex justify-end gap-3 mt-6">
                <button type="button" onClick={() => setModalOpen(false)} className="px-4 py-2 bg-gray-200 rounded-lg">
                  Close
                </button>
                <button type="submit" className="px-4 py-2 bg-brand-500 text-white rounded-lg hover:bg-brand-600">
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
