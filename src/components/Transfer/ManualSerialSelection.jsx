
"use client"
import { useState } from "react";
import Modal from "../Modal";


const ManualSerialSelection = ({ mannualSerialSelectedProduct }) => {
  console.log("🚀 ~ ManualSerialSelection ~ mannualSerialSelectedProduct:", mannualSerialSelectedProduct)
  const [isModalOpen, setIsModalOpen] = useState(false);

  const visibleItems = mannualSerialSelectedProduct?.slice(0, 2);
    console.log("🚀 ~ RandomSerialList ~ mannualSerialSelectedProduct:", mannualSerialSelectedProduct)
    
  return (
    <div>
      <div className="p-1 mt-2 bg-amber-100 rounded-lg flex gap-1">
        {visibleItems?.map((el) => (
          <div key={el.serialNumber} className="mb-2 p-0.5 border border-gray-300 rounded-md flex gap-2">
            <span className="text-xs"><strong>S No:</strong> {el.serialNumber}</span>
            <span className="text-xs"><strong>MAC Add:</strong> {el.macAddress}</span>
          </div>
        ))}

        {mannualSerialSelectedProduct?.length > 1 && (
          <button
            className="ml-2 text-blue-600 font-medium underline"
            onClick={() => setIsModalOpen(true)}
          >
            More...
          </button>
        )}
      </div>

      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="All Serial Data"
      >
        <div className="flex flex-col gap-2">
          {mannualSerialSelectedProduct?.map((el) => (
            <div
              key={el.serialNumber}
              className="p-2 border border-gray-300 rounded-md flex gap-2"
            >
              <span><strong>S No:</strong> {el.serialNumber}</span>
              <span><strong>MAC Add:</strong> {el.macAddress}</span>
              <span><strong>Warranty:</strong> {el.warranty}</span>
            </div>
          ))}
        </div>
      </Modal>
    </div>
  );
};

export default ManualSerialSelection;
