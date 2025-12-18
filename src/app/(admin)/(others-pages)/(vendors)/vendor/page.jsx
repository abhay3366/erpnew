"use client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle, Transition, TransitionChild } from "@headlessui/react";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";


import { useEffect, useState } from "react";

import VendorForm from "../../../../../components/vendor/VendorForm";
const VendorPage = () => {
  const [open, setOpen] = useState(false)
  const [vendors, setVendors] = useState([]);
  const [editVendor, seteditVendor] = useState(false);
  const [gridView, setGridView] = useState(false)
  const [previewImage, setPreviewImage] = useState(null);
  const [query, setQuery] = useState("");
  const [filteredVendors, setfilteredVendors] = useState(vendors);
  const [statusFilter, setStatusFilter] = useState("all");


  const handleStatusFilter = (status) => {
    setStatusFilter(status);

    if (status === "all") {
      setfilteredVendors(vendors);
      return;
    }

    const results = vendors.filter(v => v.status === status);
    setfilteredVendors(results);
  };

  useEffect(() => {
    let data = vendors;

    if (query) {
      data = data.filter(v =>
        v.vendorName.toLowerCase().includes(query.toLowerCase())
      );
    }

    if (statusFilter !== "all") {
      data = data.filter(v => v.status === statusFilter);
    }

    setfilteredVendors(data);
  }, [vendors, query, statusFilter]);



  // Fetch vendor from backend
  const fetchVendors = async () => {
    try {
      const res = await fetch("http://localhost:5001/vendors"); // replace with your API
      const data = await res.json();
      setVendors(data);
    } catch (error) {
      console.error("Error fetching vendors:", error);
    }
  };

  useEffect(() => {
    fetchVendors();
  }, []);

  // Delete a vendor
  const handleDelete = async (id) => {
    if (!confirm("Are you sure you want to delete this vendor?")) return;
    try {
      await fetch(`http://localhost:5001/vendors/${id}`, { method: "DELETE" });
      setVendors(vendors.filter((p) => p.id !== id));
    } catch (error) {
      console.error("Error deleting vendor:", error);
    }
  };

  // Open edit modal
  const handleEdit = (vendor) => {
    seteditVendor(vendor);
    setOpen(true);
  };

  // Close modal
  const handleCloseModal = () => {
    seteditVendor(null);
    setOpen(false);
    fetchVendors();
  };
  useEffect(() => {
    // Reset filtered vendor if the original vendors list changes
    setfilteredVendors(vendors);
  }, [vendors]);
  const handleSearch = (item) => {
    if (!item) {
      // If input is empty, show all vendors
      setfilteredVendors(vendors);
      return;
    }

    const results = vendors.filter((el) =>
      el.vendorName.toLowerCase().includes(item.toLowerCase())
    );
    setfilteredVendors(results);
  };

  const handleChange = (e) => {
    const value = e.target.value;
    setQuery(value);
    handleSearch(value);
  };


  return (
    <div>
      <PageBreadcrumb pageTitle="Vendor" />
      <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">

        {/* BUTTONS */}
        <div className="flex justify-between gap-4">
          <div className="flex gap-3">
            <div> <input type="text" className="inputCss" onChange={handleChange} placeholder="Search..." /></div>
            <div className="flex gap-2 w-[200px]">
              <select
                value={statusFilter}
                onChange={(e) => handleStatusFilter(e.target.value)}
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
            <button onClick={() => { setOpen(true); }}

              className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
            >
              <IoMdAdd /> Add Vendor
            </button>




          </div>
        </div>


        <div>
          {/* vendor TABLE */}
          <table className="min-w-full divide-y divide-gray-200 mt-7">
            <thead className="bg-gray-50">
              <tr>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor name</th>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Email</th>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Phone </th>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Stauts</th>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Blacklist</th>
                <th className="p-4  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {filteredVendors && filteredVendors.length > 0 ? (
                filteredVendors.map((vendor, index) => {
                  const rowClass =
                    vendor.status === "blacklist"
                      ? "bg-red-200"
                      : vendor.status === "inactive"
                        ? "bg-yellow-100"
                        : "";

                  return (
                    <tr key={vendor.id || `vendor-${index}`} className={rowClass}>
                      <td className="px-2 py-0.5 whitespace-nowrap">{index + 1}</td>
                      <td className="px-2 py-0.5 whitespace-nowrap">{vendor.vendorName}</td>
                      <td className="px-2 py-0.5 whitespace-nowrap">{vendor.email}</td>
                      <td className="px-2 py-0.5 whitespace-nowrap">{vendor.phone}</td>
                      <td className="px-2 py-0.5 whitespace-nowrap">{vendor.status}</td>
                      <td className="px-2 py-0.5 whitespace-nowrap">
                        {vendor.blacklist === true ? "Yes" : "No"}
                      </td>
                      <td className="px-2 p-3 whitespace-nowrap flex gap-2 items-center">
                        <button
                          onClick={() => handleEdit(vendor)}
                          className="text-blue-500 hover:text-blue-700"
                        >
                          <MdEdit size={20} />
                        </button>
                        <button
                          onClick={() => handleDelete(vendor.id)}
                          className="text-red-500 hover:text-red-700"
                        >
                          <MdDelete size={20} />
                        </button>
                      </td>
                    </tr>
                  );
                })
              ) : (
                <tr>
                  <td
                    colSpan="7"
                    className="text-center py-6 text-gray-500 font-medium"
                  >
                    No data found
                  </td>
                </tr>
              )}
            </tbody>



          </table>
        </div>



      </div>


      {/* form dialoge */}
      <div>

        <Dialog open={open} onClose={setOpen} className="relative z-[99]">
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
                      <DialogTitle className="text-base font-semibold text-gray-800 flex items-center"><button className="p-2" onClick={() => handleCloseModal()}><MdClose size={20} /></button> {editVendor ? "Edit Vendor" : ' Add New Vendor'} </DialogTitle>
                    </div>
                    <div className="relative mt-6 flex-1 px-4 sm:px-6">
                      <VendorForm fetchVendors={fetchVendors} setOpen={setOpen} seteditVendor={seteditVendor} editVendor={editVendor} setfilteredVendors={setfilteredVendors} setVendors={setVendors} vendors={vendors} handleCloseModal={handleCloseModal} />
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

export default VendorPage