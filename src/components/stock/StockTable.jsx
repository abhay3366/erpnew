import React, { useState } from 'react'
import DataFetcher from '../DataFetcher';
import { MdDelete, MdEdit } from 'react-icons/md';
const StockTable = ({ filteredStocks,setDetailsPage,setCurrentSerials,detailsPage,currentSerials }) => {

    const showSerials = (serials) => {
        setCurrentSerials(serials);
        setDetailsPage(true);
    };
    return (
        <div>
            <div>
                {/* stock TABLE */}
                <table className="min-w-full divide-y divide-gray-200 mt-7">
                    <thead className="bg-gray-50">
                        <tr>
                            <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">S.No</th>
                            <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Product Name</th>
                            <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Quantity</th>
                            <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Vendor Name </th>
                            <th className="px-2  text-left text-xs font-medium text-gray-500 uppercase tracking-wider">Actions</th>
                        </tr>
                    </thead>
                    <tbody className="bg-white divide-y divide-gray-200">
                        {filteredStocks?.map((stock, index) => {
                            // Row ke liye conditional class
                            const rowClass =
                                stock.blacklist === true
                                    ? "bg-red-100" // blacklist → red
                                    : stock.status === "inactive" && stock.blacklist === false
                                        ? "bg-yellow-100" // inactive → yellow
                                        : ""; // active → default
                            return (
                                <tr key={stock.id} className={rowClass}>
                                    <td className="px-2 py-0.5 whitespace-nowrap">{index + 1}</td>
                                    <td className="px-2 py-0.5 whitespace-nowrap"><DataFetcher type="product" id={stock.productId} />  {stock.items && stock.items.length > 0 && (
                                        <button
                                            onClick={() => showSerials(stock.items)}
                                            className="text-blue-500 px-1 text-xs font-bold rounded hover:bg-blue-100"
                                        >
                                            view details
                                        </button>
                                    )}</td>
                                    <td className="px-2 py-0.5 whitespace-nowrap">{stock.quantity}</td>
                                    <td className="px-2 py-0.5 whitespace-nowrap"> <DataFetcher type="vendor" id={stock.vendorId} /></td>
                                    <td className="px-2 py-0.5 whitespace-nowrap flex gap-2 items-center mt-5">
                                        <button
                                            onClick={() => handleEdit(stock)}
                                            className="text-blue-500 hover:text-blue-700"
                                        >
                                            <MdEdit size={20} />
                                        </button>
                                        <button
                                            onClick={() => handleDelete(stock.id)}
                                            className="text-red-500 hover:text-red-700"
                                        >
                                            <MdDelete size={20} />
                                        </button>
                                    </td>
                                </tr>
                            );
                        })}
                    </tbody>
                </table>
            </div>
        </div>
    )
}
export default StockTable