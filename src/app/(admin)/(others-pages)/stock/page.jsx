"use client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";


import { useEffect, useState } from "react";
import StockForm from "../../../../components/stock/StockForm";
import DataFetcher from "../../../../components/DataFetcher";

const StockPage = () => {
  const [open, setOpen] = useState(false)
  const [stocks, setStocks] = useState([]);
  const [editStock, seteditStock] = useState(false);
  const [gridView, setGridView] = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const [query, setQuery] = useState("");
  const [filteredStocks, setfilteredStocks] = useState(stocks);
  const [serialModalOpen, setSerialModalOpen] = useState(false);
  const [currentSerials, setCurrentSerials] = useState([]);


  // Fetch vendor from backend
  const fetchStocks = async () => {
    try {
      const res = await fetch("http://localhost:5001/stocks"); 
      const data = await res.json();
      setStocks(data);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  // Delete a vendor
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await fetch(`http://localhost:5001/stocks/${id}`, { method: "DELETE" });
      setStocks(stocks.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting vendor:", error);
    }
  };

  // Open edit modal
  const handleEdit = (vendor) => {
    seteditStock(vendor);
    setOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    seteditStock(null);
    setOpen(false);
    fetchStocks();
  };

  const showSerials = (serials) => {
    setCurrentSerials(serials);
    setSerialModalOpen(true);
  };
  useEffect(() => {
    // Reset filtered vendor if the original stocks list changes
    setfilteredStocks(stocks);
  }, [stocks]);
  const handleSearch = (item) => {
    if (!item) {
      // If input is empty, show all stocks
      setfilteredStocks(stocks);
      return;
    }

    const results = stocks.filter((el) =>
      el.vendorName.toLowerCase().includes(item.toLowerCase())
    );
    setfilteredStocks(results);
  };

  console.log("filter", filteredStocks)
  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };


  return (
    <div>
      <PageBreadcrumb pageTitle="Stock" />
      <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">

        {/* BUTTONS */}
        <div className="flex justify-between gap-4">
          <div>
            <input type="text" className="inputCss" onChange={handleChange} placeholder="Search..." />
          </div>
          <div className="flex gap-2">
            <button onClick={() => { setOpen(true); }}

              className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
            >
              <IoMdAdd /> Add Stock
            </button>




          </div>
        </div>


        <div>
          {/* vendor TABLE */}
          <table className="min-w-full divide-y divide-gray-200 mt-7">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name </th>
                <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredStocks?.map((stock, index) => {
                // Row ke liye conditional class
                const rowClass =
                  stock.blacklist === true
                    ? "bg-red-100" // blacklist → red
                    : stock.status === "inactive" && stock.blacklist === false
                      ? "bg-yellow-100" // inactive → yellow
                      : ""; // active → default

                return (
                  <tr key={stock.id} className={rowClass}>
                    <td className="px-2 py-0.5 whitespace-nowrap">{index + 1}</td>
                    <td className="px-2 py-0.5 whitespace-nowrap"><DataFetcher type="product" id={stock.productId} />  {stock.items && stock.items.length > 0 && (
                      <button
                        onClick={() => showSerials(stock.items)}
                        className="text-blue-500 px-1 text-xs font-bold rounded hover:bg-blue-100"
                      >
                        🔹
                      </button>
                    )}</td>
                    <td className="px-2 py-0.5 whitespace-nowrap">{stock.quantity}</td>
                    <td className="px-2 py-0.5 whitespace-nowrap"> <DataFetcher type="vendor" id={stock.vendorId} /></td>

                    <td className="px-2 py-0.5 whitespace-nowrap flex gap-2 items-center mt-5">
                      {/* <button
                        onClick={() => handleEdit(stock)}
                        className="text-blue-500 hover:text-blue-700"
                      >
                        <MdEdit size={20} />
                      </button> */}
                      <button
                        onClick={() => handleDelete(stock.id)}
                        className="text-red-500 hover:text-red-700"
                      >
                        <MdDelete size={20} />
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>


          </table>
        </div>



      </div>

      {/* Serial Numbers Modal */}
      {serialModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40">
          <div className="bg-white p-6 rounded-lg max-w-md w-full">
            <h2 className="text-lg font-bold mb-4">Serial Numbers</h2>
            <ul className="max-h-64 overflow-y-auto border p-2 rounded">
              {currentSerials.map((item, i) => (
                <li key={i} className="border-b py-1">
                  {item.serial} - {item.warranty}
                </li>
              ))}
            </ul>
            <button
              onClick={() => setSerialModalOpen(false)}
              className="mt-4 px-4 py-2 bg-blue-600 text-white rounded hover:bg-blue-700"
            >
              Close
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
                      <DialogTitle className="text-base font-semibold text-gray-800 flex items-center"><button className="p-2" onClick={() => setOpen(false)}><MdClose size={20} /></button> {editStock ? "Edit Stock" : ' Add New Stock'} </DialogTitle>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                     
                      <StockForm />
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

export default StockPage