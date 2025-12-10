"use client";
import React from "react";

const Modal = ({ isOpen, onClose, children, title }) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-50">
      <div className="bg-white rounded-xl shadow-lg w-full max-w-lg p-6 relative animate-fadeIn">
        {/* Close Button */}
        <button
          className="absolute top-3 right-3 text-gray-500 hover:text-gray-800 font-bold text-xl"
          onClick={onClose}
        >
          &times;
        </button>

        {/* Title */}
        {title && <h2 className="text-xl font-semibold mb-4">{title}</h2>}

        {/* Content */}
        <div>{children}</div>
      </div>
    </div>
    
  );
  
};

export default Modal;


