"use client";
import { useState } from "react";
import Modal from "../Modal";

const ManualSerialSelection = ({ mannualSerialSelectedProduct = [] }) => {
  const [isModalOpen, setIsModalOpen] = useState(false);

  // Show first 2 items only
  const visibleItems = mannualSerialSelectedProduct.slice(0, 2);

  return (
    <div>
      {/* Small Preview */}
      <div className="p-2 mt-2 bg-amber-100 rounded-lg flex flex-wrap gap-2">
        {visibleItems.map((item, index) => (
          <div
            key={index}
            className="p-2 border border-gray-300 rounded-md text-xs flex flex-col"
          >
            <span><strong>S No:</strong> {item.serial}</span>
            <span><strong>MAC:</strong> {item.mac}</span>
            <span><strong>Warranty:</strong> {item.warranty}</span>
          </div>
        ))}

        {/* More Button */}
        {mannualSerialSelectedProduct.length > 1 && (
          <button
            type="button"
            className="text-blue-600 underline font-medium text-sm"
            onClick={() => setIsModalOpen(true)}
          >
            More...
          </button>
        )}
      </div>

      {/* Full Modal List */}
      <Modal
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        title="All Serial Data"
      >
        <div className="flex flex-col gap-2">
          {mannualSerialSelectedProduct.map((item, index) => (
            <div
              key={index}
              className="p-2 border border-gray-300 rounded-md text-sm"
            >
              <p><strong>S No:</strong> {item.serial}</p>
              <p><strong>MAC:</strong> {item.mac}</p>
              <p><strong>Warranty:</strong> {item.warranty}</p>
            </div>
          ))}
        </div>

        {/* Close Modal Button */}
        <div className="flex justify-end mt-4">
          <button
            type="button"
            onClick={() => setIsModalOpen(false)}
            className="px-4 py-2 bg-gray-200 rounded-lg hover:bg-gray-300"
          >
            Close
          </button>
        </div>
      </Modal>
    </div>
  );
};

export default ManualSerialSelection;
