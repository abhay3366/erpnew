"use client";

import { useState } from "react";
import { useForm, Controller } from "react-hook-form";
import Select from "react-select";
import { FiUpload, FiEyeOff } from "react-icons/fi";
import { IoMdEye } from "react-icons/io";
import toast from "react-hot-toast";

export default function AddStaff({ setOpen, setFilteredStaff, setStaff, staff }) {
  const [showPass, setShowPass] = useState(false);
  const [previewImg, setPreviewImg] = useState(null);

  const { register, handleSubmit, control, reset } = useForm();

  // ⭐ SUBMIT DATA TO JSON SERVER
  const onSubmit = async (data) => {
    // console.log("🚀 ~ onSubmit ~ data:", data)
    const payload={...data,role: data.role.value, status: data.status.value}
    // console.log("🚀 ~ onSubmit ~ payload:", payload)
    try {

      const res = await fetch("http://localhost:5001/staff", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });

      if (res.ok) {
        const savedStaff = await res.json();

        setStaff([...staff, savedStaff]);   // 🔥 UI update instantly
        toast.success("Staff Added Successfully!");
        reset();
        setPreviewImg(null);
        setOpen(false);
      }
      else {
        alert("Failed to Add Staff");
      }
    } catch (error) {
      console.error("Error:", error);
      alert("Server Error");
    }
  };

  // ⭐ HANDLE IMAGE UPLOAD
  const handleImage = (e) => {
    const file = e.target.files[0];
    if (!file) return;
    const url = URL.createObjectURL(file);
    setPreviewImg(url);
  };

  return (
    <form onSubmit={handleSubmit(onSubmit)}>
      <div className="w-full p-8 bg-white rounded-2xl shadow-md">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          {/* Upload */}
          <div className="flex flex-col items-center border rounded-xl py-10">
            <label className="border rounded-xl p-6 flex flex-col items-center cursor-pointer hover:bg-gray-50">
              {previewImg ? (
                <img
                  src={previewImg}
                  alt="Preview"
                  className="w-24 h-24 rounded-full object-cover"
                />
              ) : (
                <>
                  <FiUpload className="w-10 h-10 text-gray-500" />
                  <span className="mt-3 text-gray-600">Upload</span>
                </>
              )}

              <input
                type="file"
                accept="image/*"
                className="hidden"
                onChange={handleImage}
              />
            </label>
          </div>

          {/* Form Fields */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Role */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Role *</label>
              <Controller
                name="role"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: "Admin", label: "Admin" },
                      { value: "Manager", label: "Manager" },
                      { value: "User", label: "User" },
                    ]}
                  />
                )}
              />
            </div>

            {/* phone */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Phone Number *</label>
              <input
                {...register("phone", { required: true })}
                type="text"
                placeholder="Please Enter Phone Number"
                className="border rounded-lg p-2 focus:ring"
              />
            </div>

            {/* name */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Name *</label>
              <input
                {...register("name", { required: true })}
                type="text"
                placeholder="Enter Name"
                className="border rounded-lg p-2 focus:ring"
              />
            </div>

            {/* status */}
            <div className="flex flex-col">
              <label className="font-medium mb-1">Status *</label>
              <Controller
                name="status"
                control={control}
                defaultValue=""
                render={({ field }) => (
                  <Select
                    {...field}
                    options={[
                      { value: "Enabled", label: "Enabled" },
                      { value: "Disabled", label: "Disabled" },
                    ]}
                  />
                )}
              />
            </div>

            {/* email */}
            <div className="flex flex-col md:col-span-2">
              <label className="font-medium mb-1">Email *</label>
              <input
                {...register("email", { required: true })}
                type="email"
                placeholder="Enter Email"
                className="border rounded-lg p-2 focus:ring"
              />
            </div>

            {/* password */}
            <div className="flex flex-col md:col-span-2 relative">
              <label className="font-medium mb-1">Password *</label>
              <input
                {...register("password", { required: true })}
                type={showPass ? "text" : "password"}
                placeholder="Please Enter Password"
                className="border rounded-lg p-2 pr-10 focus:ring w-full"
              />
              <button
                type="button"
                className="absolute right-3 top-10 text-gray-500"
                onClick={() => setShowPass(!showPass)}
              >
                {showPass ? <FiEyeOff /> : <IoMdEye />}
              </button>
            </div>
          </div>
        </div>

        {/* Address */}
        <div className="mt-6">
          <label className="font-medium mb-1">Address</label>
          <textarea
            {...register("address")}
            placeholder="Please Enter Address"
            className="border rounded-lg p-3 w-full h-24 focus:ring"
          />
        </div>

        {/* Button */}
        <div className="mt-6 flex justify-end">
          <button className="bg-blue-600 text-white px-6 py-2 rounded-xl hover:bg-blue-700">
            Submit
          </button>
        </div>
      </div>
    </form>
  );
}
