"use client";

import { Controller, useForm } from "react-hook-form";
import Select from 'react-select';

export default function VendorForm() {
  const { register, handleSubmit, control } = useForm({
    defaultValues: {
      vendorName: "",
      gstin: "",
      contactPerson: "",
      authorizedSignature: "",
      phone: "",
      email: "",
      address: "",
      bankName: "",
      accountNumber: "",
    },
  })

  const onSubmit=(data)=>{
    console.log("🚀 ~ onSubmit ~ data:", data)
    
  }

  return (
    <div className="max-w-3xl mx-auto p-4">

    <form onSubmit={handleSubmit(onSubmit)}>
        <div className="grid grid-cols-2 gap-4">

        <div>
          <label className="text-xs">Vendor Name</label>
          <input {...register("vendorName", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">GST Number</label>
          <input {...register("gstin", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Contact Person</label>
          <input {...register("contactPerson", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Authorized Signature</label>
          <input {...register("authorizedSignature", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Phone Number</label>
          <input {...register('phone', { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Email</label>
          <input {...register("email", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div className="col-span-2">
          <label className="text-xs">Vendor Address</label>
          <textarea {...register("address", { required: true })} className="w-full border px-3 py-2 rounded text-sm" rows="2"></textarea>
        </div>

        <div>
          <label className="text-xs">Bank Name</label>
          <input {...register("bankName", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Account Number</label>
          <input {...register("accountNumber", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Account Type</label>
          <Controller
            name="accountType"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                options={[
                  { value: "chocolate", label: "Chocolate" },
                  { value: "strawberry", label: "Strawberry" },
                  { value: "vanilla", label: "Vanilla" },
                ]}
              />
            )}
          />
          {/* <select className="w-full border px-3 py-2 rounded text-sm">
            <option>Saving</option>
            <option>Current</option>
          </select> */}
        </div>

        <div>
          <label className="text-xs">MICR Code</label>
          <input {...register("micr", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">RTGS Code</label>
          <input {...register("rtgs", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">NEFT Code</label>
          <input {...register("neft", { required: true })} className="w-full border px-3 py-2 rounded text-sm" />
        </div>

        <div>
          <label className="text-xs">Product Group</label>
          <Controller

            name="productGroups"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                options={[
                  { value: "chocolate", label: "Chocolate" },
                  { value: "strawberry", label: "Strawberry" },
                  { value: "vanilla", label: "Vanilla" },
                ]}
              />
            )}
          />


        </div>

        <div>
          <label className="text-xs">Products</label>
          <Controller
            isMulti
            name="products"
            control={control}
            render={({ field }) => (
              <Select
                {...field}
                isMulti
                options={[
                  { value: "chocolate", label: "Chocolate" },
                  { value: "strawberry", label: "Strawberry" },
                  { value: "vanilla", label: "Vanilla" },
                ]}
              />
            )}
          />


        </div>


        <div>
          <label className="text-xs">Status</label>
          <select className="w-full border px-3 py-2 rounded text-sm">
            <option>Active</option>
            <option>Inactive</option>
            <option>Blacklisted</option>
          </select>
        </div>

      </div>

      <div className="mt-4 text-right">
        <button className="px-4 py-2 bg-black text-white rounded">
          Save
        </button>
      </div>
    </form>

    </div>
  );
}
