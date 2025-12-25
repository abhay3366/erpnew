// app/stock/page.jsx
"use client";
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { MdClose } from "react-icons/md";
import { useEffect, useState } from "react";
import StockForm from "@/components/stock/StockForm";
import StockDetails from "@/components/stock/StockDetails";
import StockTable from "@/components/stock/StockTable";

const StockPage = () => {
  const [open, setOpen] = useState(false)
  const [stocks, setStocks] = useState([]);
  const [detailsPage, setDetailsPage] = useState(false);
  const [currentSerialsIdProduct, setCurrentSerialsIdProudct] = useState([]);
  const [selectedStockId, setselectedStockId] = useState(null)
  const [isLoading, setIsLoading] = useState(true);
  
  // Fetch stocks from backend
  const fetchStocks = async () => {
    try {
      setIsLoading(true);
      const res = await fetch("http://localhost:5001/stocks");
      const data = await res.json();
      setStocks(data);
    } catch (error) {
      console.error("Error fetching stocks:", error);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    fetchStocks();
  }, []);

  const handleFormClose = () => {
    setOpen(false);
    setselectedStockId(null);
  };

  const handleFormSuccess = () => {
    fetchStocks(); // Refresh data after successful save/update
    handleFormClose();
  };

  const handleAddStock = () => {
    setselectedStockId(null); // Clear any existing edit ID
    setOpen(true);
  };

  const handleEditStock = (stockId) => {
    setselectedStockId(stockId);
    setOpen(true);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-blue-200 border-t-blue-600 rounded-full animate-spin mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading stock data...</p>
        </div>
      </div>
    );
  }

  return (
    <div>
      <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">
        {!detailsPage && (
          <div>
            <PageBreadcrumb pageTitle="Stock" />
            <div className="flex justify-end gap-4 mt-4">
              <div className="flex gap-2">
                <button 
                  onClick={handleAddStock}
                  className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
                >
                  <IoMdAdd /> Add Stock
                </button>
              </div>
            </div>
          </div>
        )}
        
        {/* stock table and stock details */}
        {detailsPage ? (
          <StockDetails 
            currentSerialsIdProduct={currentSerialsIdProduct} 
            setDetailsPage={setDetailsPage}
          />
        ) : (
          <StockTable
            filteredStocks={stocks}
            setDetailsPage={setDetailsPage}
            setCurrentSerialsIdProudct={setCurrentSerialsIdProudct}
            onEditStock={handleEditStock}
            fetchStocks={fetchStocks}
            setStocks={setStocks}
          />
        )}
      </div>
      
      {/* Form dialog - SAME FORM FOR CREATE AND EDIT */}
      <div>
        <Dialog open={open} onClose={handleFormClose} className="relative z-[99]">
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
                      <DialogTitle className="text-base font-semibold text-gray-800 flex items-center">
                        <button 
                          className="p-2 hover:bg-gray-100 rounded" 
                          onClick={handleFormClose}
                        >
                          <MdClose size={20} />
                        </button> 
                        <span className="ml-2">
                          {selectedStockId ? "Edit Stock" : 'Add New Stock'}
                        </span>
                      </DialogTitle>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <StockForm 
                        stockId={selectedStockId} // Pass stockId for edit mode
                        open={open}
                        onClose={handleFormClose}
                        onSuccess={handleFormSuccess}
                      />
                    </div>
                  </div>
                </DialogPanel>
              </div>
            </div>
          </div>
        </Dialog>
      </div>
    </div>
  );
};

export default StockPage;