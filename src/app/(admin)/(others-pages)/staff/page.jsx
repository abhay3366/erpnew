"use client"
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from "react-icons/io";
import { Dialog, DialogBackdrop, DialogPanel, DialogTitle } from "@headlessui/react";
import { MdClose, MdEdit, MdDelete } from "react-icons/md";
import { useEffect, useState } from "react";
import AddStaff from "../../../../components/staff/AddStaff";
import StaffTable from "../../../../components/staff/StaffTable";
import { FaCloudDownloadAlt } from "react-icons/fa";
import CsvUploader from "../../../../components/staff/CsvUploader";
const StaffPage = () => {
    const [open, setOpen] = useState(false)
    const [staff, setStaff] = useState([]);
    // console.log("🚀 ~ StaffPage ~ staff:", staff)
    const [editStaff, setEditStaff] = useState(false);
    const [query, setQuery] = useState("");
    const [filteredStaff, setFilteredStaff] = useState([]);

    const fetchStaff = async () => {
        try {
            const res = await fetch("http://localhost:5001/staff");
            const data = await res.json();
            setStaff(data);
            setFilteredStaff(data);
        } catch (error) {
            console.error("Error fetching staff:", error);
        }
    };

    useEffect(() => {
        fetchStaff();
    }, []);
    useEffect(() => {

        setFilteredStaff(staff);
    }, [staff]);
    const handleSearch = (item) => {
        if (!item) {

            setFilteredStaff(staff);
            return;
        }
        const results = staff.filter((el) =>
            el.name.toLowerCase().includes(item.toLowerCase())
        );
        setFilteredStaff(results);
    };
    const handleChange = (e) => {
        const value = e.target.value;
        setQuery(value);
        handleSearch(value);
    };
    useEffect(() => {
        if (!open) {
            setEditStaff(null)
        }
    }, [open])
    return (
        <div>
            <PageBreadcrumb className="menu-item-text" pageTitle="Staff Members" />
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
                            <IoMdAdd />Add New Staff Member
                        </button>
                        <button
                            className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4  text-sm font-medium text-white transition"
                        >
                            <CsvUploader
                                onUpload={async (data) => {
                                    try {
                                        const requests = data.map((row) =>
                                            fetch("http://localhost:5001/staff", {
                                                method: "POST",
                                                headers: { "Content-Type": "application/json" },
                                                body: JSON.stringify(row),
                                            })
                                        );
                                        await Promise.all(requests);
                                        alert("Staff members imported successfully!");
                                    } catch (err) {
                                        console.error(err);
                                    }
                                }}
                            />

                        </button>
                    </div>
                </div>
                {/* staff table */}
                <StaffTable setFilteredStaff={setFilteredStaff}
                    filteredStaff={filteredStaff} setStaff={setStaff}
                    open={open} setOpen={setOpen} setEditStaff={setEditStaff} editStaff={editStaff} staff={staff} />
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
                                            <DialogTitle className="text-base font-semibold text-gray-800 flex items-center"><button className="p-2" onClick={() => setOpen(false)}><MdClose size={20} /></button> {editStaff ? "Edit Staff" : ' Add New Staff Member'} </DialogTitle>
                                        </div>
                                        <div className="relative mt-6 flex-1 px-4 sm:px-6">
                                            <AddStaff setOpen={setOpen} setFilteredStaff={setFilteredStaff} setStaff={setStaff} staff={staff} />
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
export default StaffPage