"use client";

import { useState, useEffect } from "react";
import { QRCodeCanvas } from "qrcode.react";
import JsBarcode from "jsbarcode";

export default function BarcodeQRPage() {
  const [barcodeValue, setBarcodeValue] = useState("123456789012");
  const [qrValue, setQrValue] = useState("https://example.com");

  // Render barcode on load
  useEffect(() => {
    JsBarcode("#barcode", barcodeValue, {
      format: "CODE128",
      width: 2,
      height: 80,
      displayValue: true,
    });
  }, [barcodeValue]);

  // RANDOM BARCODE
  const generateRandomBarcode = () => {
    const random = Math.floor(100000000000 + Math.random() * 900000000000).toString();
    setBarcodeValue(random);
  };

  // RANDOM QR CODE
  const generateRandomQR = () => {
    const random = "QR-" + Math.floor(Math.random() * 99999999);
    setQrValue(random);
  };

  return (
    <div className="min-h-screen p-10 bg-gray-100">
      <div className="max-w-4xl mx-auto bg-white shadow-lg rounded-xl p-6">

        <h1 className="text-2xl font-bold mb-6">Barcode + QR Code Generator</h1>

        {/* Barcode Section */}
        <div className="border p-5 rounded-lg mb-10">
          <h2 className="text-xl font-semibold mb-4">Barcode</h2>

          <svg id="barcode"></svg>

          <button
            onClick={generateRandomBarcode}
            className="mt-4 bg-blue-600 text-white px-4 py-2 rounded-lg"
          >
            Generate Random Barcode
          </button>
        </div>

        {/* QR Code Section */}
        <div className="border p-5 rounded-lg">
          <h2 className="text-xl font-semibold mb-4">QR Code</h2>

          <QRCodeCanvas value={qrValue} size={200} />

          <button
            onClick={generateRandomQR}
            className="mt-4 bg-green-600 text-white px-4 py-2 rounded-lg"
          >
            Generate Random QR Code
          </button>
        </div>

      </div>
    </div>
  );
}
