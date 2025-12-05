import React from 'react'
import PageBreadcrumb from "@/components/common/PageBreadCrumb";
import { IoMdAdd } from 'react-icons/io';

const TransferredItems = () => {
  return (
    <div>
      <PageBreadcrumb pageTitle="Transferres Item" />
      <div className=" mx-auto p-6 space-y-6 ">

        <div className="bg-white p-3 rounded-xl border border-gray-200 mt-4 overflow-x-auto">

          {/* BUTTONS */}
          <div className="flex justify-end gap-4">

            <div className="flex  bg-amber-300">
              <button

                className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
              >
                <IoMdAdd /> Transfer Item
              </button>

            </div>
          </div>



        </div>
      </div>
    </div>
  )
}

export default TransferredItems