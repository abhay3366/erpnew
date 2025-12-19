"use client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { MdClose } from "react-icons/md";
import { useEffect, useState } from "react";
import StockForm from "../../../../components/stock/StockForm";
import StockDetails from "../../../../components/stock/StockDetails";
import StockTable from "../../../../components/stock/StockTable";
const StockPage = () => {
  const [open, setOpen] = useState(false)
  const [stocks, setStocks] = useState([]);
  const [editStock, seteditStock] = useState(false);
  const [detailsPage, setDetailsPage] = useState(false);
  const [currentSerials, setCurrentSerials] = useState([]);
  const [query, setQuery] = useState("");
  const [filteredStocks, setfilteredStocks] = useState(stocks);

  console.log("🚀 ~ StockPage ~ currentSerials:", currentSerials)
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
        {/* stock table and stock details */}


        {
          detailsPage ?
            <StockDetails /> :
            <StockTable
              filteredStocks={filteredStocks}
              setDetailsPage={setDetailsPage}
              setCurrentSerials={setCurrentSerials}
            />
        }
      </div>


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