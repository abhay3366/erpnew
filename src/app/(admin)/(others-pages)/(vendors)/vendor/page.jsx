"use client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import VendorForm from "../../../../../components/vendor/VendorForm";

const VendorPage = () => {
  const [open, setOpen] = useState(false)
  const [vendors, setVendors] = useState([]);
  const [editVendor, setEditVendor] = useState(null);
  const [query, setQuery] = useState("");
  const [filteredVendors, setFilteredVendors] = useState([]);
  const [statusFilter, setStatusFilter] = useState("all");
  const [loading, setLoading] = useState(true);

  // Fetch vendors from JSON Server
  const fetchVendors = async () => {
    try {
      setLoading(true);
      const res = await fetch("http://localhost:5001/vendors");
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }
      const data = await res.json();
      console.log("Vendors data:", data);
      setVendors(data);
      setFilteredVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
      alert(`Error fetching vendors: ${error.message}`);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Delete a vendor from JSON Server
  const handleDelete = async (vendor) => {
    console.log("Deleting vendor:", vendor);
    
    // JSON Server uses 'id' property (not '_id')
    const vendorId = vendor.id;
    
    if (!vendorId) {
      alert("Error: Vendor ID not found");
      return;
    }
    
    if (!confirm(`Are you sure you want to delete vendor "${vendor.vendorName}"?`)) return;
    
    try {
      console.log(`Deleting vendor with ID: ${vendorId}`);
      
      const response = await fetch(`http://localhost:5001/vendors/${vendorId}`, {
        method: "DELETE",
        headers: {
          'Content-Type': 'application/json'
        }
      });
      
      console.log("Delete response status:", response.status);
      
      if (response.ok) {
        // Update local state
        setVendors(prev => prev.filter(v => v.id !== vendorId));
        setFilteredVendors(prev => prev.filter(v => v.id !== vendorId));
        
        // Also update editVendor if it's the same vendor being edited
        if (editVendor && editVendor.id === vendorId) {
          setEditVendor(null);
        }
        
        alert("Vendor deleted successfully!");
      } else {
        const errorText = await response.text();
        console.error("Delete failed:", errorText);
        alert(`Failed to delete vendor. Status: ${response.status}`);
      }
    } catch (error) {
      console.error("Error deleting vendor:", error);
      alert(`Error: ${error.message}`);
    }
  };

  // Open edit modal
  const handleEdit = (vendor) => {
    console.log("Editing vendor:", vendor);
    setEditVendor(vendor);
    setOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    setEditVendor(null);
    setOpen(false);
    // Refresh data
    fetchVendors();
  };

  const handleSearch = (e) => {
    const value = e.target.value;
    setQuery(value);
  };

  const handleStatusFilter = (e) => {
    setStatusFilter(e.target.value);
  };

  // Filter vendors based on search query and status
  useEffect(() => {
    let data = [...vendors];

    if (query) {
      const searchTerm = query.toLowerCase();
      data = data.filter(v =>
        v.vendorName?.toLowerCase().includes(searchTerm) ||
        v.email?.toLowerCase().includes(searchTerm) ||
        v.phone?.includes(query)
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(v => v.status === statusFilter);
    }

    setFilteredVendors(data);
  }, [vendors, query, statusFilter]);

  return (
    <div>
      <PageBreadcrumb pageTitle="Vendor" />
      <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">

        {/* BUTTONS AND FILTERS */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-3">
            <div> 
              <input 
                type="text" 
                className="inputCss" 
                value={query}
                onChange={handleSearch}
                placeholder="Search by name, email, or phone..." 
              />
            </div>
            <div className="flex gap-2 w-[200px]">
              <select
                value={statusFilter}
                onChange={handleStatusFilter}
                className="inputCss"
              >
                <option value="all">All Status</option>
                <option value="active">Active</option>
                <option value="inactive">Inactive</option>
                <option value="blacklist">Blacklisted</option>
              </select>
            </div>
          </div>
          <div className="flex gap-2">
            <button 
              onClick={() => { 
                setEditVendor(null);
                setOpen(true); 
              }}
              className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
            >
              <IoMdAdd /> Add Vendor
            </button>
          </div>
        </div>

        {/* VENDOR TABLE */}
        <div className="mt-7">
          {loading ? (
            <div className="text-center py-8">
              <div className="inline-block animate-spin rounded-full h-8 w-8 border-t-2 border-b-2 border-blue-500"></div>
              <p className="mt-2 text-gray-600">Loading vendors...</p>
            </div>
          ) : (
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor name</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Email</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Status</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blacklist</th>
                  <th className="p-4 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {filteredVendors.length > 0 ? (
                  filteredVendors.map((vendor, index) => {
                    const rowClass =
                      vendor.status === "blacklist"
                        ? "bg-red-50"
                        : vendor.status === "inactive"
                          ? "bg-yellow-50"
                          : "";

                    return (
                      <tr key={vendor.id || index} className={rowClass}>
                        <td className="px-4 py-3 whitespace-nowrap">{index + 1}</td>
                        <td className="px-4 py-3 whitespace-nowrap font-medium">{vendor.vendorName}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{vendor.email}</td>
                        <td className="px-4 py-3 whitespace-nowrap">{vendor.phone}</td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            vendor.status === 'active' ? 'bg-green-100 text-green-800' :
                            vendor.status === 'inactive' ? 'bg-yellow-100 text-yellow-800' :
                            'bg-red-100 text-red-800'
                          }`}>
                            {vendor.status || 'active'}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                            vendor.blacklist ? 'bg-red-100 text-red-800' : 'bg-green-100 text-green-800'
                          }`}>
                            {vendor.blacklist ? "Yes" : "No"}
                          </span>
                        </td>
                        <td className="px-4 py-3 whitespace-nowrap">
                          <div className="flex gap-2">
                            <button
                              onClick={() => handleEdit(vendor)}
                              className="p-2 text-blue-500 hover:text-blue-700 hover:bg-blue-50 rounded-lg transition-colors"
                              title="Edit"
                            >
                              <MdEdit size={18} />
                            </button>
                            <button
                              onClick={() => handleDelete(vendor)}
                              className="p-2 text-red-500 hover:text-red-700 hover:bg-red-50 rounded-lg transition-colors"
                              title="Delete"
                            >
                              <MdDelete size={18} />
                            </button>
                          </div>
                        </td>
                      </tr>
                    );
                  })
                ) : (
                  <tr>
                    <td colSpan="7" className="text-center py-8 text-gray-500">
                      <div className="flex flex-col items-center justify-center">
                        <svg className="w-12 h-12 text-gray-400 mb-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9.172 16.172a4 4 0 015.656 0M9 10h.01M15 10h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                        <p className="text-lg font-medium">No vendors found</p>
                        <p className="text-sm mt-1">Try adjusting your search or add a new vendor</p>
                      </div>
                    </td>
                  </tr>
                )}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* FORM DIALOG */}
      <Dialog open={open} onClose={() => setOpen(false)} className="relative z-50">
        <DialogBackdrop className="fixed inset-0 bg-black/30" />
        <div className="fixed inset-0 overflow-hidden">
          <div className="absolute inset-0 overflow-hidden">
            <div className="pointer-events-none fixed inset-y-0 right-0 flex max-w-full pl-10">
              <DialogPanel className="pointer-events-auto relative w-screen max-w-4xl">
                <div className="flex h-full flex-col bg-white shadow-xl">
                  <div className="px-4 py-6 sm:px-6 border-b">
                    <div className="flex items-start justify-between">
                      <DialogTitle className="text-lg font-semibold text-gray-900">
                        {editVendor ? "Edit Vendor" : "Add New Vendor"}
                      </DialogTitle>
                      <button
                        type="button"
                        className="rounded-md text-gray-400 hover:text-gray-500 focus:outline-none"
                        onClick={handleCloseModal}
                      >
                        <span className="sr-only">Close</span>
                        <MdClose className="h-6 w-6" />
                      </button>
                    </div>
                  </div>
                  <div className="relative flex-1 overflow-y-auto px-4 py-6 sm:px-6">
                    <VendorForm 
                      editVendor={editVendor}
                      setOpen={setOpen}
                      handleCloseModal={handleCloseModal}
                      onSuccess={fetchVendors}
                    />
                  </div>
                </div>
              </DialogPanel>
            </div>
          </div>
        </div>
      </Dialog>
    </div>
  )
}

export default VendorPage