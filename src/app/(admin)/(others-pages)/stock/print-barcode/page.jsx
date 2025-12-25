"use client";

import { useState, useEffect, useRef } from "react";
import JsBarcode from "jsbarcode";

export default function PrintBarcodePage() {
  // State variables
  const [products, setProducts] = useState([]);
  const [filteredProducts, setFilteredProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  const [searchTerm, setSearchTerm] = useState("");
  const [paperSize, setPaperSize] = useState("a4-40");
  const [isLoading, setIsLoading] = useState(false);
  const [printMode, setPrintMode] = useState(false);
  
  // Fetch products on component mount
  useEffect(() => {
    fetchProducts();
  }, []);

  // Filter products when search term changes
  useEffect(() => {
    if (!searchTerm.trim()) {
      setFilteredProducts(products);
    } else {
      const filtered = products.filter(product =>
        product.name?.toLowerCase().includes(searchTerm.toLowerCase())
      );
      setFilteredProducts(filtered);
    }
  }, [searchTerm, products]);

  // Fetch products from API
  const fetchProducts = async () => {
    setIsLoading(true);
    try {
      // Fetch from multiple endpoints
      const [stockResponse, productsResponse] = await Promise.all([
        fetch('http://localhost:5001/stocks'),
        fetch('http://localhost:5001/products')
      ]);

      if (stockResponse.ok && productsResponse.ok) {
        const stocksData = await stockResponse.json();
        const productsData = await productsResponse.json();
        
        // Combine and transform data
        const combinedProducts = combineProductsData(stocksData, productsData);
        setProducts(combinedProducts);
        setFilteredProducts(combinedProducts);
      }
    } catch (error) {
      console.error("Error fetching products:", error);
    } finally {
      setIsLoading(false);
    }
  };

  // Combine stock and product data
  const combineProductsData = (stocks, products) => {
    const productMap = {};
    
    // First, create a map of products
    products.forEach(product => {
      // Generate fixed barcode format: 6981167467
      const fixedBarcode = "6981167467";
      
      productMap[product.id] = {
        id: product.id,
        name: product.name || product.productName,
        sku: product.sku || `PROD-${product.id}`,
        barcode: fixedBarcode, // हमेशा यही barcode
        purchase_price: product.purchasePrice || 0,
        selling_price: product.sellingPrice || 0,
        mrp: product.mrp || 0,
        unit: product.unit || "Piece",
        quantity: 0
      };
    });

    // Update quantities from stocks
    stocks.forEach(stock => {
      if (stock.product && productMap[stock.product.id]) {
        const totalQuantity = stock.items?.reduce((sum, item) => sum + (item.quantity || 0), 0) || 0;
        productMap[stock.product.id].quantity += totalQuantity;
      }
    });

    // Convert map to array
    return Object.values(productMap);
  };

  // Add product to selected list
  const addToSelected = (product) => {
    if (!selectedProducts.some(p => p.id === product.id)) {
      setSelectedProducts([...selectedProducts, { 
        ...product, 
        printQuantity: 1
      }]);
    }
  };

  // Remove product from selected list
  const removeFromSelected = (productId) => {
    setSelectedProducts(selectedProducts.filter(p => p.id !== productId));
  };

  // Update print quantity
  const updatePrintQuantity = (productId, quantity) => {
    setSelectedProducts(selectedProducts.map(p => 
      p.id === productId ? { ...p, printQuantity: Math.max(1, quantity) } : p
    ));
  };

  // Paper size configurations
  const paperSizes = [
    { value: 'a4-40', label: '40 per sheet (A4) (1.799" × 1.003")', cols: 5, rows: 8 },
  ];

  // Print function - Barcode Only with Number Below
  const handlePrint = () => {
    setPrintMode(true);
    
    setTimeout(() => {
      const printContent = document.getElementById('print-content');
      const originalContent = document.body.innerHTML;
      
      document.body.innerHTML = printContent.innerHTML;
      
      // Generate barcodes after DOM is loaded
      setTimeout(() => {
        // Generate all barcodes
        document.querySelectorAll('.barcode-svg').forEach((svg, index) => {
          const barcodeValue = "6981167467"; // Fixed barcode
          JsBarcode(svg, barcodeValue, {
            format: "CODE128",
            width: 1.5,
            height: 30,
            displayValue: false, // We'll add number manually
            margin: 5
          });
        });
        
        setTimeout(() => {
          window.print();
          document.body.innerHTML = originalContent;
          setPrintMode(false);
        }, 500);
      }, 100);
    }, 500);
  };

  // Reset selections
  const handleReset = () => {
    setSelectedProducts([]);
    setSearchTerm("");
    setPaperSize("a4-40");
  };

  return (
    <div className="min-h-screen bg-gray-50 p-4">
      <div className="max-w-7xl mx-auto">
        {/* Header */}
        <div className="mb-6">
          <h1 className="text-2xl font-bold text-gray-800">Print Barcode</h1>
          <p className="text-gray-600">Search products and generate barcodes with fixed code: <span className="font-mono font-bold">6981167467</span></p>
          <p className="text-sm text-gray-500 mt-1">Format: Barcode + Number only (no logo/SKU/price)</p>
        </div>

        {/* Main Content - Two Column Layout */}
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          {/* Left Column - Search and Selection */}
          <div className="lg:col-span-2 space-y-6">
            {/* Search Bar */}
            <div className="bg-white rounded-lg shadow p-4">
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Search Product Name
              </label>
              <div className="relative">
                <input
                  type="text"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                  placeholder="Type to search products..."
                  className="w-full px-4 py-3 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                />
                <div className="absolute right-3 top-3">
                  <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                  </svg>
                </div>
              </div>
            </div>

            {/* Products Table - SIMPLIFIED */}
            <div className="bg-white rounded-lg shadow overflow-hidden">
              <div className="px-4 py-3 bg-gray-50 border-b">
                <h2 className="font-semibold text-gray-700">Available Products</h2>
              </div>
              
              {isLoading ? (
                <div className="p-8 text-center">
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-500 mx-auto"></div>
                  <p className="mt-2 text-gray-600">Loading products...</p>
                </div>
              ) : (
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-100">
                      <tr>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">#</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Product Name</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Barcode</th>
                        <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase">Action</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-200">
                      {filteredProducts.length > 0 ? (
                        filteredProducts.map((product, index) => (
                          <tr key={product.id} className="hover:bg-gray-50">
                            <td className="px-4 py-3 text-sm text-gray-900">{index + 1}</td>
                            <td className="px-4 py-3">
                              <div className="text-sm font-medium text-gray-900">{product.name}</div>
                            </td>
                            <td className="px-4 py-3">
                              <div className="font-mono text-sm font-bold text-blue-600">
                                6981167467
                              </div>
                            </td>
                            <td className="px-4 py-3">
                              <button
                                onClick={() => addToSelected(product)}
                                disabled={selectedProducts.some(p => p.id === product.id)}
                                className={`px-4 py-2 text-sm rounded-lg ${
                                  selectedProducts.some(p => p.id === product.id)
                                    ? 'bg-gray-100 text-gray-500 cursor-not-allowed'
                                    : 'bg-blue-600 text-white hover:bg-blue-700'
                                }`}
                              >
                                {selectedProducts.some(p => p.id === product.id) ? 'Selected ✓' : 'Select'}
                              </button>
                            </td>
                          </tr>
                        ))
                      ) : (
                        <tr>
                          <td colSpan="4" className="px-4 py-8 text-center text-gray-500">
                            No products found. Try a different search.
                          </td>
                        </tr>
                      )}
                    </tbody>
                  </table>
                </div>
              )}
            </div>
          </div>

          {/* Right Column - Selected Products & Settings */}
          <div className="space-y-6">
            {/* Selected Products */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-4">Selected Products ({selectedProducts.length})</h2>
              
              {selectedProducts.length > 0 ? (
                <div className="space-y-3 max-h-96 overflow-y-auto pr-2">
                  {selectedProducts.map(product => (
                    <div key={product.id} className="border rounded-lg p-3 bg-gray-50">
                      <div className="flex justify-between items-start mb-2">
                        <div className="flex-1">
                          <div className="font-medium text-sm">{product.name}</div>
                          <div className="text-xs text-gray-500 mt-1">Barcode: <span className="font-mono font-bold">6981167467</span></div>
                        </div>
                        <button
                          onClick={() => removeFromSelected(product.id)}
                          className="text-red-500 hover:text-red-700 ml-2"
                        >
                          ✕
                        </button>
                      </div>
                      
                      <div className="flex items-center justify-between">
                        <div className="text-sm text-gray-600">Print Quantity:</div>
                        <input
                          type="number"
                          min="1"
                          max="100"
                          value={product.printQuantity}
                          onChange={(e) => updatePrintQuantity(product.id, parseInt(e.target.value) || 1)}
                          className="w-20 px-2 py-1 border border-gray-300 rounded text-sm text-center"
                        />
                      </div>
                    </div>
                  ))}
                </div>
              ) : (
                <div className="text-center py-6 text-gray-500">
                  <svg className="w-12 h-12 mx-auto text-gray-300" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="1.5" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  <p className="mt-2">No products selected</p>
                </div>
              )}
              
              {selectedProducts.length > 0 && (
                <div className="mt-4 pt-4 border-t">
                  <div className="flex justify-between items-center">
                    <span className="text-sm text-gray-600">Total Labels to Print:</span>
                    <span className="font-bold text-blue-600 text-lg">
                      {selectedProducts.reduce((sum, p) => sum + p.printQuantity, 0)}
                    </span>
                  </div>
                </div>
              )}
            </div>

            {/* Print Settings - SIMPLIFIED */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-4">Print Settings</h2>
              
              <div className="space-y-4">
                {/* Paper Size - Only A4-40 */}
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Paper Size & Layout
                  </label>
                  <select
                    value={paperSize}
                    onChange={(e) => setPaperSize(e.target.value)}
                    className="w-full px-3 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                  >
                    <option value="a4-40">40 per sheet (A4) (1.799" × 1.003")</option>
                  </select>
                </div>

                {/* Fixed Barcode Display */}
                <div className="p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <div className="text-center">
                    <div className="text-sm text-blue-700 mb-1">Fixed Barcode Number:</div>
                    <div className="font-mono text-2xl font-bold text-blue-800 tracking-wider">
                      6981167467
                    </div>
                    <div className="text-xs text-blue-600 mt-2">
                      All labels will print with this barcode
                    </div>
                  </div>
                </div>

                {/* Action Buttons */}
                <div className="flex gap-3 pt-4">
                  <button
                    onClick={handleReset}
                    className="flex-1 px-4 py-3 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 font-medium"
                  >
                    Reset All
                  </button>
                  <button
                    onClick={handlePrint}
                    disabled={selectedProducts.length === 0}
                    className={`flex-1 px-4 py-3 rounded-lg font-medium ${
                      selectedProducts.length === 0
                        ? 'bg-gray-300 text-gray-500 cursor-not-allowed'
                        : 'bg-green-600 text-white hover:bg-green-700'
                    }`}
                  >
                    🖨️ Print Labels
                  </button>
                </div>
              </div>
            </div>

            {/* Quick Stats */}
            <div className="bg-white rounded-lg shadow p-4">
              <h2 className="font-semibold text-gray-700 mb-3">Summary</h2>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Total Products:</span>
                  <span className="font-medium">{products.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Selected Products:</span>
                  <span className="font-medium text-blue-600">{selectedProducts.length}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Labels to Print:</span>
                  <span className="font-bold text-green-600">
                    {selectedProducts.reduce((sum, p) => sum + p.printQuantity, 0)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm text-gray-600">Paper Size:</span>
                  <span className="font-medium">A4 (40 per sheet)</span>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Hidden Print Content - BARCODE + NUMBER ONLY */}
        <div id="print-content" className="hidden">
          <style>
            {`
              @page {
                margin: 0.3cm;
                size: A4;
              }
              body {
                margin: 0;
                padding: 0;
                font-family: Arial, sans-serif;
                background: white;
              }
              .print-container {
                display: grid;
                grid-template-columns: repeat(5, 1fr);
                gap: 0.1cm;
                width: 100%;
                height: 100%;
              }
              .barcode-label {
                padding: 0.2cm;
                text-align: center;
                display: flex;
                flex-direction: column;
                justify-content: center;
                align-items: center;
                height: 4.5cm;
                width: 3.5cm;
                box-sizing: border-box;
                break-inside: avoid;
                page-break-inside: avoid;
              }
              .barcode-container {
                width: 100%;
                display: flex;
                justify-content: center;
                margin-bottom: 0.1cm;
              }
              .barcode-svg {
                width: 100%;
                height: 1.8cm;
              }
              .barcode-number {
                font-size: 12px;
                font-family: 'Courier New', monospace;
                font-weight: bold;
                color: #000;
                letter-spacing: 1.5px;
                margin-top: 0.1cm;
                text-align: center;
                width: 100%;
              }
            `}
          </style>
          
          <div className="print-container">
            {selectedProducts.flatMap(product => 
              Array.from({ length: product.printQuantity }).map((_, index) => (
                <div key={`${product.id}-${index}`} className="barcode-label">
                  <div className="barcode-container">
                    <svg 
                      className="barcode-svg"
                      data-barcode="6981167467"
                    ></svg>
                  </div>
                  <div className="barcode-number">6981167467</div>
                </div>
              ))
            )}
          </div>
          
          <script src="https://cdn.jsdelivr.net/npm/jsbarcode@3.11.5/dist/JsBarcode.all.min.js"></script>
          <script>
            {`
              // Generate barcodes when print page loads
              document.addEventListener('DOMContentLoaded', function() {
                const svgs = document.querySelectorAll('.barcode-svg');
                svgs.forEach(svg => {
                  JsBarcode(svg, '6981167467', {
                    format: 'CODE128',
                    width: 1.2,
                    height: 40,
                    displayValue: false,
                    margin: 0
                  });
                });
              });
            `}
          </script>
        </div>
      </div>
    </div>
  );
}