"use client";

import { useEffect, useState } from "react";
import toast from "react-hot-toast";
import { MdDelete } from "react-icons/md";
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
   toast.success("Delete transfer list successfully")
  };
  var sr=1;
  return (
    <div className="p-4">
     

      <table className="w-full border">
        <thead className="bg-gray-100">
          <tr>
             <th className="border p-2">Sr.No</th>
            <th className="border p-2">Product</th>
            <th className="border p-2">From</th>
            <th className="border p-2">To</th>
            <th className="border p-2">Quantity</th>
            <th className="border p-2">Action</th>
          </tr>
        </thead>

        <tbody>
          {transfers.map((t) => (
            <tr key={t.id}>
              <td className="p-2">{sr++}</td>
              <td className="border p-2">
                {t.productName} ({t.productId})
              </td>

              <td className="border p-2">
                {t.fromBranchName} ({t.fromBranchId})
              </td>

              <td className="border p-2">
                {t.toBranchName} ({t.toBranchId})
              </td>

              <td className="border p-2">
                {t.rows.map((r, i) => (
                  <div key={i}>
                    {r.serial} - {r.quantity}
                  </div>
                ))}
              </td>

              <td className="border p-2 text-center">
                <button
                  onClick={() => handleDelete(t.id)}
                  className=" text-red-600 px-3 py-1"
                >
                  <MdDelete />
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
