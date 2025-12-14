"use client";

import { useEffect, useRef, useState } from "react";
import { useForm, Controller, useFieldArray } from "react-hook-form";
import Select from "react-select";
import toast from "react-hot-toast";

// ---- mock data (replace with API) ----
const staffOptions = [
    { value: 1, label: "Ashu Sagar" },
    { value: 2, label: "Rahul Verma" },
    { value: 3, label: "Priya Sharma" },
    { value: 4, label: "Amit Kumar" },
    { value: 5, label: "Neha Singh" },
];



const issueForOptions = [
    { value: "Abhay", label: "Abhay" },
   
];

const productOptions = [
    { value: "Binatone Telephone concept 9", label: "Binatone Telephone concept 9" },
    { value: "D-Link Router DIR-615", label: "D-Link Router DIR-615" },
    { value: "TP-Link Archer C6", label: "TP-Link Archer C6" },
    { value: "Netgear Nighthawk R7000", label: "Netgear Nighthawk R7000" },
    { value: "Huawei B315s-22", label: "Huawei B315s-22" },
    { value: "ZTE MF283", label: "ZTE MF283" },
    { value: "Airtel Fiber Modem", label: "Airtel Fiber Modem" },
    { value: "Jio Fiber Router", label: "Jio Fiber Router" },
    { value: "Cisco Switch SG250", label: "Cisco Switch SG250" },
    { value: "Ubiquiti UniFi AP", label: "Ubiquiti UniFi AP" },
];



// ---- styles for react-select ----
const selectStyles = {
    control: (base, state) => ({
        ...base,
        minHeight: 38,
        borderColor: state.isFocused ? "#60a5fa" : "#d1d5db",
        boxShadow: state.isFocused ? "0 0 0 1px #60a5fa" : "none",
        "&:hover": { borderColor: "#60a5fa" },
    }),
};

export default function BroadbandIssue() {
    const [warehouses,setWareHouse]=useState([])
    const [staff,setStaff]=useState([])

    const {
        control,
        handleSubmit,
        reset,
        formState: { errors },
    } = useForm({
        defaultValues: {
            staff: null,
            branch: null,
            issueFor: null,
            items: Array.from({ length: 3 }, () => ({ item: null })),
        },
    });

    const { fields, append, remove } = useFieldArray({ control, name: "items" });


    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await fetch("http://localhost:5001/staff");

                if (!res.ok) {
                    throw new Error("Failed to fetch staff");
                }

                const data = await res.json();
                console.log("Staff Data:", data);

                // setState yahan karo
                setStaff(data);

            } catch (error) {
                console.error(error);
            }
        };

        fetchStaff();
    }, []);


    // branches via API
    useEffect(() => {
        const fetchStaff = async () => {
            try {
                const res = await fetch("http://localhost:5001/warehouses");
                if (!res.ok) {
                    throw new Error("Failed to fetch staff");
                }
                const data = await res.json();
                console.log("Staff Data:", data);
                // setState yahan karo
                setWareHouse(data);

            } catch (error) {
                console.error(error);
            }
        };

        fetchStaff();
    }, []);


    const onSubmit = (data) => {
        if (!data.items?.length) {
            toast.error("Add at least one item");
            return;
        }

        const payload = {
            staff: data.staff?.label,
            branch: data.branch?.label,
            issueFor: data.issueFor?.label,
            items: data.items.map((i) => i.item?.label),
            timestamp: new Date().toISOString(),
        };
        console.log("🚀 ~ onSubmit ~ payload:", payload)

        const submitData=()=>{

        }
        useEffect(()=>{
           submitData() 

        })

        console.log("Broadband Issue Payload", payload);
        toast.success("Broadband issue logged successfully!");
        reset();
    };

    return (
        <div className="min-h-screen bg-gray-50 p-4">
            <div className="max-w-6xl mx-auto">
                <h1 className="text-xl font-bold mb-4">Broadband Issue</h1>

                {/* Top selects */}
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
                    <Controller
                        name="staff"
                        control={control}
                        rules={{ required: "Staff required" }}
                        render={({ field }) => (
                            <div>
                                <label className="text-xs">Select Staff</label>
                                <Select {...field} 
                                options={staff.map((el)=>({value:el.name,label:el.name}))} 
                                styles={selectStyles} placeholder="Select staff" />
                                {errors.staff && <p className="text-xs text-red-500">{errors.staff.message}</p>}
                            </div>
                        )}
                    />

                    <Controller
                        name="fromWarehouse"
                        control={control}
                        rules={{ required: "Branch required" }}
                        render={({ field }) => (
                            <div>
                                <label className="text-xs">Issue From WareHouse</label>
                                <Select {...field} options={warehouses.map((el)=>({value:el.fromWarehouse,label:el.fromWarehouse}))}  styles={selectStyles} placeholder="Select branch" />
                                {errors.branch && <p className="text-xs text-red-500">{errors.branch.message}</p>}
                            </div>
                        )}
                    />

                    <Controller
                        name="issueFor"
                        control={control}
                        rules={{ required: "Issue type required" }}
                        render={({ field }) => (
                            <div>
                                <label className="text-xs">Issue For</label>
                                <Select {...field} options={issueForOptions} styles={selectStyles} placeholder="Select issue" />
                                {errors.issueFor && <p className="text-xs text-red-500">{errors.issueFor.message}</p>}
                            </div>
                        )}
                    />
                </div>

                {/* Items table */}
                <div className="bg-white border rounded mb-6">
                    <div className="flex justify-between p-3 border-b">
                        <h2 className="text-sm font-semibold">Items</h2>
                        <button onClick={() => append({ item: null })} className="text-sm bg-green-600 text-white px-3 py-1 rounded">
                            + Add Row
                        </button>
                    </div>

                    <table className="w-full text-sm">
                        <thead className="bg-gray-100">
                            <tr>
                                <th className="p-2">#</th>
                                <th className="p-2">Item</th>
                                <th className="p-2">Action</th>
                            </tr>
                        </thead>
                        <tbody>
                            {fields.map((field, index) => (
                                <tr key={field.id} className="border-t">
                                    <td className="p-2">{index + 1}</td>
                                    <td className="p-2">
                                        <Controller
                                            name={`items.${index}.item`}
                                            control={control}
                                            rules={{ required: "Item required" }}
                                            render={({ field }) => (
                                                <Select {...field} options={productOptions} styles={selectStyles} placeholder="Select item" />
                                            )}
                                        />
                                        {errors.items?.[index]?.item && (
                                            <p className="text-xs text-red-500">{errors.items[index].item.message}</p>
                                        )}
                                    </td>
                                    <td className="p-2">
                                        {fields.length > 1 && (
                                            <button onClick={() => remove(index)} className="text-xs text-red-600">Remove</button>
                                        )}
                                    </td>
                                </tr>
                            ))}
                        </tbody>
                    </table>
                </div>

                {/* Actions */}
                <div className="flex justify-end gap-3">
                    <button onClick={() => reset()} className="px-4 py-2 border rounded">Reset</button>
                    <button onClick={handleSubmit(onSubmit)} className="px-4 py-2 bg-blue-600 text-white rounded">
                        Submit Issue
                    </button>
                </div>
            </div>
        </div>
    );
}
