"use client";

import { useEffect, useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { MdAdd, MdDelete } from "react-icons/md";
import toast from "react-hot-toast";

export default function AddStockPage() {
  const { control, handleSubmit, watch, setValue, reset } = useForm();

  const [vendors, setVendors] = useState([]);
  const [products, setProducts] = useState([]);
  const [vendorProducts, setVendorProducts] = useState([]);
  const [stockExists, setStockExists] = useState(false);

  const [rows, setRows] = useState([]);

  const [existingSerials, setExistingSerials] = useState([]);
  const [existingMacs, setExistingMacs] = useState([]);
  const [errors, setErrors] = useState({});

  const selectedVendor = watch("vendor");
  const selectedProduct = watch("product");

  // Vendor + Product select pe check karo

    useEffect(() => {
  if (!selectedVendor || !selectedProduct) {
    setStockExists(false);
    return;
  }

  const checkStockExists = async () => {
    try {
      const res = await fetch(
        `http://localhost:5001/stocks?vendorId=${selectedVendor.id}&productId=${selectedProduct.id}`
      );
      const data = await res.json();

      setStockExists(data.length > 0); // 👈 main logic
    } catch (err) {
      console.error("Stock check failed", err);
      setStockExists(false);
    }
  };

  checkStockExists();
}, [selectedVendor, selectedProduct]);


  /* ---------- FETCH DATA ---------- */
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [vendorRes, productRes] = await Promise.all([
          fetch("http://localhost:5001/vendors"),
          fetch("http://localhost:5001/products"),
        ]);
        setVendors(await vendorRes.json());
        setProducts(await productRes.json());
      } catch (err) {
        console.error("Failed to fetch vendors/products", err);
      }
    };
    fetchData();
  }, []);

  /* ---------- VENDOR CHANGE ---------- */
  useEffect(() => {
    if (!selectedVendor) return;

    setValue("product", null);
    setRows([]);
    setErrors({});
    setValue("quantity", "");

    const ids = selectedVendor.products?.map(p => p.id) || [];
    setVendorProducts(products.filter(p => ids.includes(p.id)));
  }, [selectedVendor, products, setValue]);

  /* ---------- PRODUCT CHANGE ---------- */
  useEffect(() => {
    if (!selectedProduct) return;

    setRows([]);
    setErrors({});
    setValue("quantity", "");

    if (
      selectedProduct.hasUniqueIdentifier ||
      selectedProduct.hasSerialNo ||
      selectedProduct.hasMacAddress
    ) {
      addRows(1);
    }

    // 🔥 fetch existing serials / macs from DB
    fetch(`http://localhost:5001/stocks/identifiers/${selectedProduct.id}`)
      .then(r => r.json())
      .then(d => {
        setExistingSerials(d.serials || []);
        setExistingMacs(d.macs || []);
      });

  }, [selectedProduct, setValue]);

  /*----------------------SUBMIT DATA--------------------*/




  /* ---------- ROW HELPERS ---------- */
  const createRow = () => ({
    id: Date.now() + Math.random(),
    serialNo: "",
    macAddress: "",
    warranty: "",
  });

  const addRows = (count) => {
    setRows(prev => [
      ...Array.from({ length: count }, () => createRow()),
      ...prev, // top se add
    ]);
  };

  const removeRow = (id) => {
    setRows(prev => prev.filter(r => r.id !== id));
  };

  const isRowDuplicate = (field, value, index) => {
    if (!value) return false;
    return rows.some((r, i) => i !== index && r[field] === value);
  };

  /* ---------- VALIDATION ---------- */
  const validateRows = () => {
    let newErrors = {};

    rows.forEach((row, i) => {

      if (selectedProduct.hasSerialNo) {
        if (!row.serialNo) {
          newErrors[`serial-${i}`] = "Serial number required";
        } else if (isRowDuplicate("serialNo", row.serialNo, i)) {
          newErrors[`serial-${i}`] = "Duplicate serial in rows";
        } else if (existingSerials.includes(row.serialNo)) {
          newErrors[`serial-${i}`] = "Serial already exists";
        }
      }

      if (selectedProduct.hasMacAddress) {
        if (!row.macAddress) {
          newErrors[`mac-${i}`] = "MAC address required";
        } else if (isRowDuplicate("macAddress", row.macAddress, i)) {
          newErrors[`mac-${i}`] = "Duplicate MAC in rows";
        } else if (existingMacs.includes(row.macAddress)) {
          newErrors[`mac-${i}`] = "MAC already exists";
        }
      }
    });

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const isUnique =
    selectedProduct?.hasUniqueIdentifier ||
    selectedProduct?.hasSerialNo ||
    selectedProduct?.hasMacAddress;

  /* ---------- SUBMIT ---------- */
  const onSubmit = async (formData) => {
      if (stockExists) {
    toast.error("This vendor already has stock for the selected product");
    return;
  }
    if (isUnique && !validateRows()) return;

    const payload = {
      vendorId: formData.vendor.id,
      productId: formData.product.id,
      quantity: isUnique ? rows.length : Number(formData.quantity),
      warranty: formData.warranty,
      items: rows,
      createdAt: new Date().toLocaleString("en-IN")
    };

    await fetch("http://localhost:5001/stocks", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(payload),
    });

    alert("Stock saved successfully");
    reset();
    setRows([]);
    setErrors({});
  };

  return (
    <form
      onSubmit={handleSubmit(onSubmit)}
      className="max-w-7xl mx-auto p-8 bg-white rounded-2xl shadow-lg"
    >
      {/* VENDOR + PRODUCT */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Vendor
          </label>
          <Controller
            name="vendor"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={vendors}
                placeholder="Select Vendor"
                getOptionLabel={(v) => v.vendorName}
                getOptionValue={(v) => v.id}
              />
            )}
          />
        </div>

        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-1">
            Product
          </label>
          <Controller
            name="product"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={vendorProducts}
                placeholder="Select Product"
                isDisabled={!selectedVendor}
                getOptionLabel={(p) => p.productName}
                getOptionValue={(p) => p.id}
              />
            )}
          />
          {stockExists && (
            <p className="text-sm text-red-600 mt-2">
              ⚠️ This vendor already has stock for this product.
            </p>
          )}

        </div>
        
      </div>

      {/* QUANTITY */}
      {selectedProduct && !isUnique && (
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-4">
          <div>
            <label className="font-medium mb-1 block">Quantity</label>
            <Controller
              name="quantity"
              control={control}
              rules={{ required: true }}
              render={({ field }) => (
                <input
                  {...field}
                  type="number"
                  className="border w-full p-2 rounded"
                  placeholder="Enter quantity"
                />
              )}
            />
          </div>

          <div>
            <label className="font-medium mb-1 block">Warranty</label>
            <Controller
              name="warranty"
              control={control}
              render={({ field }) => (
                <input
                  {...field}
                  type="text"
                  className="border w-full p-2 rounded"
                  placeholder="e.g. 1 Year"
                />
              )}
            />
          </div>
        </div>
      )}

      {/* ADD BUTTONS */}
      {selectedProduct && isUnique && (
        <div className="flex flex-wrap gap-3 mt-8">
          <button
            type="button"
            onClick={() => addRows(1)}
            className="flex items-center gap-2 bg-indigo-600 hover:bg-indigo-700 text-white px-4 py-2 rounded-lg"
          >
            <MdAdd /> Add 1
          </button>

          <button
            type="button"
            onClick={() => addRows(10)}
            className="bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-lg"
          >
            +10 Rows
          </button>

          <button
            type="button"
            onClick={() => addRows(20)}
            className="bg-blue-800 hover:bg-blue-900 text-white px-4 py-2 rounded-lg"
          >
            +20 Rows
          </button>
        </div>
      )}

      {/* ROWS */}
      {
        selectedProduct?.hasSerialNo == true ? (<div className="mt-8 overflow-x-auto">
          <table className="min-w-full border border-gray-200 rounded-lg">
            <thead className="bg-gray-100">
              <tr>
                <th className="px-4 py-2 border">#</th>
                {selectedProduct?.hasSerialNo && <th className="px-4 py-2 border">Serial Number</th>}
                {selectedProduct?.hasMacAddress && <th className="px-4 py-2 border">MAC Address</th>}
                {selectedProduct?.hasWarranty && <th className="px-4 py-2 border">Warranty</th>}
                <th className="px-4 py-2 border">Action</th>
              </tr>
            </thead>
            <tbody>
              {rows.map((row, i) => (
                <tr key={row.id} className="bg-gray-50">
                  <td className="px-4 py-2 border text-center">{i + 1}</td>

                  {selectedProduct.hasSerialNo && (
                    <td className="px-4 py-2 border">
                      <input
                        className={`border rounded-lg px-2 py-1 w-full ${errors[`serial-${i}`] ? "border-red-500" : ""
                          }`}
                        placeholder="Serial Number"
                        value={row.serialNo}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[i].serialNo = e.target.value;
                          setRows(updated);
                        }}
                      />
                      {errors[`serial-${i}`] && (
                        <p className="text-xs text-red-500 mt-1">{errors[`serial-${i}`]}</p>
                      )}
                    </td>
                  )}

                  {selectedProduct.hasMacAddress && (
                    <td className="px-4 py-2 border">
                      <input
                        className={`border rounded-lg px-2 py-1 w-full ${errors[`mac-${i}`] ? "border-red-500" : ""
                          }`}
                        placeholder="MAC Address"
                        value={row.macAddress}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[i].macAddress = e.target.value;
                          setRows(updated);
                        }}
                      />
                      {errors[`mac-${i}`] && (
                        <p className="text-xs text-red-500 mt-1">{errors[`mac-${i}`]}</p>
                      )}
                    </td>
                  )}

                  {selectedProduct.hasWarranty && (
                    <td className="px-4 py-2 border">
                      <input
                        className="border rounded-lg px-2 py-1 w-full"
                        placeholder="Warranty"
                        value={row.warranty}
                        onChange={(e) => {
                          const updated = [...rows];
                          updated[i].warranty = e.target.value;
                          setRows(updated);
                        }}
                      />
                    </td>
                  )}

                  <td className="px-4 py-2 border text-center">
                    <button
                      type="button"
                      onClick={() => removeRow(row.id)}
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
        ) : ""
      }



      {/* SAVE */}
      {selectedProduct && (
        <div className="mt-10 flex justify-end">
          <button
            type="submit"
            className="bg-green-600 hover:bg-green-700 text-white px-10 py-3 rounded-xl text-lg font-semibold"
          >
            Save Stock
          </button>
        </div>
      )}
    </form>
  );
}