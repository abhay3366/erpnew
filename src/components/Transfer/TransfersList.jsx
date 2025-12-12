"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";
import DataFetcher from "../DataFetcher";

export default function TransfersList() {
  const [transfers, setTransfers] = useState([]);

  const fetchTransfers = () => {
    fetch("http://localhost:5001/transfers")
      .then((res) => res.json())
      .then(setTransfers);
  };

  useEffect(() => {
    fetchTransfers();
  }, []);

  const handleDelete = async (id) => {
    await fetch(`http://localhost:5001/transfers/${id}`, {
      method: "DELETE",
    });

    fetchTransfers();
    toast.success("Deleted transfer successfully");
  };

  let sr = 1;

  return (
    <div className="p-4">
      

      <div className="overflow-x-auto">
        <table className="min-w-full border border-gray-200 rounded-lg overflow-hidden">
          <thead className="bg-gray-100">
            <tr>
              <th className="border-b p-3 text-left text-sm font-medium text-gray-700">Sr. No</th>
              <th className="border-b p-3 text-left text-sm font-medium text-gray-700">Product</th>
              <th className="border-b p-3 text-left text-sm font-medium text-gray-700">From</th>
              <th className="border-b p-3 text-left text-sm font-medium text-gray-700">To</th>
              <th className="border-b p-3 text-left text-sm font-medium text-gray-700">Quantity</th>
              <th className="border-b p-3 text-center text-sm font-medium text-gray-700">Action</th>
            </tr>
          </thead>

          <tbody className="bg-white divide-y divide-gray-200">
            {transfers.map((t) => (
              <tr key={t.id} className="hover:bg-gray-50 transition-colors">
                <td className="p-3 text-sm text-gray-600">{sr++}</td>
                <td className="p-3 text-sm text-gray-600">
                  <DataFetcher type="product" id={t.productId} />
                </td>
                <td className="p-3 text-sm text-gray-600">
                  <DataFetcher type="fromWarehouse" id={t.fromWarehouse} />
                </td>
                <td className="p-3 text-sm text-gray-600">
                  <DataFetcher type="toWarehouse" id={t.toWarehouse} />
                </td>
                <td className="p-3 text-sm text-gray-600">{t.quantity}</td>
                <td className="p-3 text-center">
                  <button
                    onClick={() => handleDelete(t.id)}
                    className="inline-flex items-center px-3 py-1 bg-red-100 text-red-600 rounded-md hover:bg-red-200 transition"
                  >
                    <MdDelete className="w-5 h-5" />
                  </button>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  );
}
