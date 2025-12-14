import React, { useRef } from "react";
import Papa from "papaparse";
import { FaCloudDownloadAlt } from "react-icons/fa";

export default function CsvUploader({ onUpload }) {
  const fileInputRef = useRef();

  const handleFileChange = (e) => {
    const file = e.target.files[0];
    if (!file) return;

    Papa.parse(file, {
      header: true,
      skipEmptyLines: true,
      complete: (results) => {
        console.log("Parsed CSV:", results.data);
        if (onUpload) onUpload(results.data);
      },
      error: (err) => console.error("CSV parse error:", err),
    });
  };

  return (
    <>
      {/* Hidden file input */}
      <input
        type="file"
        accept=".csv"
        ref={fileInputRef}
        style={{ display: "none" }}
        onChange={handleFileChange}
      />

      {/* Custom button */}
      <button
        className="bg-brand-500 shadow-theme-xs hover:bg-brand-600 inline-flex items-center justify-center gap-2 rounded-lg px-4 py-3 text-sm font-medium text-white transition"
        onClick={() => fileInputRef.current.click()} // Trigger file select
      >
        <FaCloudDownloadAlt />
        Import Staff Member
      </button>
    </>
  );
}
