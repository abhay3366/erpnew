// app/stock/transferred-item/page.js
"use client";

import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useForm, useFieldArray } from "react-hook-form";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ProductTable } from "@/components/products/ProductTable";
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table";
import { toast } from "sonner";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from "@/components/ui/alert-dialog";
import { Badge } from "@/components/ui/badge";
import {
  Package,
  Plus,
  Search,
  X,
  Filter,
  ChevronLeft,
  ChevronRight,
  Calendar,
  Eye,
  Hash,
  Shuffle,
  CheckSquare,
  Square,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

// ==================== UTILITY FUNCTIONS ====================
const utils = {
  // Get value from dynamic object structure
  getDynamicValue: (valueObj) => {
    if (!valueObj) return "";
    if (typeof valueObj === 'object' && valueObj.value !== undefined) {
      return valueObj.value;
    }
    return valueObj;
  },

  // Get item value from the new structure
  getItemValue: (item, key) => {
    if (!item || !item[key]) return "";
    if (typeof item[key] === 'object' && item[key].value !== undefined) {
      return item[key].value;
    }
    return item[key];
  },

  // Format date with time
  formatDateTime: (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric',
        hour: '2-digit',
        minute: '2-digit'
      });
    } catch (error) {
      return "Invalid Date";
    }
  },

  // Format date only
  formatDateOnly: (dateString) => {
    try {
      const date = new Date(dateString);
      return date.toLocaleDateString('en-IN', {
        day: '2-digit',
        month: 'short',
        year: 'numeric'
      });
    } catch (error) {
      return "Invalid Date";
    }
  }
};

// ==================== STOCK TRANSFER HOOKS ====================
const useStockTransferData = () => {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [fieldMasters, setFieldMasters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          warehousesRes,
          productsRes,
          stocksRes,
          transfersRes,
          fieldMastersRes,
        ] = await Promise.all([
          fetch("http://localhost:5001/warehouses"),
          fetch("http://localhost:5001/products"),
          fetch("http://localhost:5001/stocks"),
          fetch("http://localhost:5001/transfers"),
          fetch("http://localhost:5001/fieldMasters"),
        ]);

        setWarehouses(await warehousesRes.json());
        setProducts(await productsRes.json());
        setStocks(await stocksRes.json());
        setTransfers(await transfersRes.json());
        setFieldMasters(await fieldMastersRes.json());
      } catch (error) {
        toast.error("Failed to load data");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  return {
    warehouses,
    products,
    stocks,
    transfers,
    fieldMasters,
    isLoading,
    setStocks,
    setTransfers
  };
};

const useWarehouseData = (warehouses) => {
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.fromWarehouse : "Unknown";
  };

  const getWarehouseLocation = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.warehouseLocation : "";
  };

  return { getWarehouseName, getWarehouseLocation };
};

// ==================== PRODUCT SELECTION LOGIC ====================
const useProductSelection = (sourceWarehouse, stocks, products, fieldMasters) => {
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Get dynamic fields for a product
  const getProductDynamicFields = useCallback((productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.selectedFieldIds || !Array.isArray(product.selectedFieldIds)) {
      return [];
    }
    return fieldMasters.filter(field => product.selectedFieldIds.includes(field.id));
  }, [products, fieldMasters]);

  // Fetch available products when source warehouse changes
  useEffect(() => {
    if (!sourceWarehouse) {
      setAvailableProducts([]);
      setSelectedProducts([]);
      return;
    }

    console.log('🔄 Fetching products for warehouse:', sourceWarehouse);
    console.log('Total stocks:', stocks.length);

    const warehouseStocks = stocks.filter(stock => stock.warehouseId === sourceWarehouse);
    console.log('Warehouse stocks found:', warehouseStocks.length);

    const productsMap = new Map();

    // Process each stock in the warehouse
    warehouseStocks.forEach(stock => {
      if (stock.products && Array.isArray(stock.products)) {
        stock.products.forEach(stockProduct => {
          console.log('📦 Processing product:', stockProduct.productName, stockProduct);

          // IMPORTANT: Extract quantity - check different possible locations
          let quantity = 0;

          // Method 1: Check if quantity is directly in stockProduct
          if (stockProduct.quantity !== undefined) {
            quantity = parseInt(stockProduct.quantity) || 0;
            console.log('✓ Quantity from stockProduct.quantity:', quantity);
          }
          // Method 2: Check dynamicValues for quantity
          else if (stockProduct.dynamicValues && stockProduct.dynamicValues.quantity) {
            const qtyValue = utils.getDynamicValue(stockProduct.dynamicValues.quantity);
            quantity = parseInt(qtyValue) || 0;
            console.log('✓ Quantity from dynamicValues.quantity:', quantity);
          }
          // Method 3: For UNIQUE products, count items
          else if (stockProduct.identifierType === "UNIQUE" && stockProduct.items) {
            quantity = stockProduct.items.length;
            console.log('✓ Quantity from items length (UNIQUE):', quantity);
          }
          // Method 4: Default fallback
          else {
            quantity = stockProduct.identifierType === "NON_UNIQUE" ? 1 : 0;
            console.log('⚠ Using default quantity:', quantity);
          }

          const productId = stockProduct.productId;
          const productInfo = products.find(p => p.id === productId);

          if (productsMap.has(productId)) {
            // Update existing product
            const existing = productsMap.get(productId);
            existing.availableQty += quantity;

            // For UNIQUE products, merge items
            if (stockProduct.identifierType === "UNIQUE" && stockProduct.items) {
              const processedItems = stockProduct.items.map(item => {
                const processed = { id: item.id };
                Object.keys(item).forEach(key => {
                  if (key !== 'id') {
                    processed[key] = utils.getItemValue(item, key);
                  }
                });
                return processed;
              });
              existing.items = [...(existing.items || []), ...processedItems];
            }
          } else {
            // Create new product entry
            const dynamicFields = getProductDynamicFields(productId);

            // Extract dynamic values
            const extractedDynamicValues = {};
            if (stockProduct.dynamicValues) {
              Object.keys(stockProduct.dynamicValues).forEach(key => {
                if (key !== 'quantity') { // Exclude quantity from dynamic values
                  extractedDynamicValues[key] = utils.getDynamicValue(stockProduct.dynamicValues[key]);
                }
              });
            }

            // Process items for UNIQUE products
            const items = stockProduct.identifierType === "UNIQUE" && stockProduct.items
              ? stockProduct.items.map(item => {
                const processed = { id: item.id };
                Object.keys(item).forEach(key => {
                  if (key !== 'id') {
                    processed[key] = utils.getItemValue(item, key);
                  }
                });
                return processed;
              })
              : [];

            productsMap.set(productId, {
              // Product info from products collection
              ...(productInfo || {
                id: productId,
                productName: stockProduct.productName || "Unknown Product",
                sku: productId,
                unit: "pieces",
                isActive: true
              }),
              // Stock-specific info
              identifierType: stockProduct.identifierType || "NON_UNIQUE",
              availableQty: quantity,
              rate: stockProduct.rate || 0,
              dynamicFields: dynamicFields,
              dynamicValues: extractedDynamicValues,
              items: items,
              // Flags for UI
              hasSerialNo: items.some(item => item.serial_number),
              hasMacAddress: items.some(item => item.mac_address),
              hasWarranty: items.some(item => item.warranty || extractedDynamicValues.warranty),
              fromStock: !productInfo
            });
          }
        });
      }
    });

    const availableProds = Array.from(productsMap.values());
    console.log('✅ Available products:', availableProds);
    setAvailableProducts(availableProds);

    // Update selected products if they still exist
    const updatedSelected = selectedProducts
      .filter(sp => availableProds.some(ap => ap.id === sp.productId))
      .map(sp => {
        const currentProduct = availableProds.find(ap => ap.id === sp.productId);
        return currentProduct ? {
          ...sp,
          availableQty: currentProduct.availableQty,
          identifierType: currentProduct.identifierType,
          items: currentProduct.items || [],
          dynamicValues: currentProduct.dynamicValues || {},
          dynamicFields: currentProduct.dynamicFields || []
        } : sp;
      });

    if (updatedSelected.length !== selectedProducts.length) {
      setSelectedProducts(updatedSelected);
    }
  }, [sourceWarehouse, stocks, products, fieldMasters, getProductDynamicFields]);

  return {
    availableProducts,
    selectedProducts,
    setSelectedProducts
  };
};
// ==================== ITEM SELECTION LOGIC ====================
const useItemSelection = (selectedProducts, selectedProductIndex) => {
  const [itemSearchTerm, setItemSearchTerm] = useState("");
  const [randomQtyInput, setRandomQtyInput] = useState("");

  // Get dynamic fields from ALL items for the selected product
  const getDynamicFieldsFromItems = () => {
    if (selectedProductIndex === null) return [];
    const product = selectedProducts[selectedProductIndex];
    if (!product || !product.items || product.items.length === 0) return [];

    const fieldMap = new Map();

    product.items.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id' && value && String(value).trim() !== '') {
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              key,
              hasData: true,
              isSerial: key.toLowerCase().includes('serial'),
              isMac: key.toLowerCase().includes('mac'),
              isWarranty: key.toLowerCase().includes('warranty')
            });
          }
        }
      });
    });

    return Array.from(fieldMap.values());
  };

  // Filter items based on search term
  const getFilteredItems = () => {
    if (selectedProductIndex === null) return [];
    const product = selectedProducts[selectedProductIndex];
    if (!product || !product.items) return [];

    if (!itemSearchTerm) return product.items;

    const searchLower = itemSearchTerm.toLowerCase();
    return product.items.filter(item => {
      return Object.entries(item).some(([key, value]) => {
        if (key === 'id') return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  };

  return {
    itemSearchTerm,
    setItemSearchTerm,
    randomQtyInput,
    setRandomQtyInput,
    getDynamicFieldsFromItems,
    getFilteredItems
  };
};

// ==================== TRANSFER PROCESSING ====================
const useTransferProcessing = (stocks, warehouses, setStocks, setTransfers) => {
  const { getWarehouseName, getWarehouseLocation } = useWarehouseData(warehouses);

  // Get original bill number from source stock
  const getOriginalBillNo = (warehouseId, productId) => {
    const sourceStock = stocks.find(stock =>
      stock.warehouseId === warehouseId &&
      stock.products.some(p => p.productId === productId)
    );
    return sourceStock ? sourceStock.billNo : `TR-${Date.now()}`;
  };

  // Get source product details
  const getSourceProductDetails = (warehouseId, productId) => {
    const sourceStock = stocks.find(stock =>
      stock.warehouseId === warehouseId &&
      stock.products.some(p => p.productId === productId)
    );

    if (sourceStock) {
      return sourceStock.products.find(p => p.productId === productId);
    }
    return null;
  };

  // Process dynamic values for storage
  const processDynamicValuesForStorage = (dynamicValues, fieldMasters) => {
    const processed = {};
    Object.keys(dynamicValues || {}).forEach(key => {
      const value = dynamicValues[key];
      const field = fieldMasters.find(f => f.key === key);
      if (field && value) {
        processed[key] = {
          value: value,
          fieldId: field.id
        };
      }
    });
    return processed;
  };

  // Process items for storage (with fieldId)
  const processItemsForStorage = (items = [], fieldMasters) => {
    return items.map(item => {
      const processedItem = { id: item.id || Date.now() };

      Object.keys(item).forEach(key => {
        if (key !== 'id' && item[key]) {
          const field = fieldMasters.find(f => f.key === key);
          if (field) {
            processedItem[key] = {
              value: item[key],
              fieldId: field.id
            };
          } else {
            processedItem[key] = item[key];
          }
        }
      });

      return processedItem;
    });
  };

  // Update source warehouse stock
  // Update source warehouse stock
  const updateSourceWarehouseStock = async (warehouseId, item, fieldMasters) => {
    try {
      console.log('🔄 Updating source warehouse stock:', warehouseId, item);

      // Find ALL stocks in source warehouse that have this product
      const existingStocks = stocks.filter(stock =>
        stock.warehouseId === warehouseId &&
        stock.products?.some(p => p.productId === item.productId)
      );

      console.log('Found source stocks:', existingStocks.length);

      if (existingStocks.length === 0) {
        console.warn('⚠ No source stock found for product:', item.productId);
        return;
      }

      // Update each stock that contains this product
      for (const stock of existingStocks) {
        const productIndex = stock.products.findIndex(p => p.productId === item.productId);

        if (productIndex !== -1) {
          const sourceProduct = stock.products[productIndex];
          console.log('Source product before update:', sourceProduct);

          if (item.identifierType === "NON_UNIQUE") {
            // Reduce quantity for NON_UNIQUE products
            const newQuantity = (sourceProduct.quantity || 0) - item.transferQty;
            stock.products[productIndex].quantity = Math.max(0, newQuantity);

            console.log(`NON_UNIQUE: ${sourceProduct.quantity} - ${item.transferQty} = ${stock.products[productIndex].quantity}`);

            // Remove product if quantity becomes 0 or less
            if (stock.products[productIndex].quantity <= 0) {
              stock.products.splice(productIndex, 1);
              console.log('Removed product from source stock');
            }
          } else if (item.identifierType === "UNIQUE") {
            // Remove selected items for UNIQUE products
            const selectedItemIds = item.selectedItems?.map(si => si.id) || [];
            const originalItems = sourceProduct.items || [];

            // Filter out the transferred items
            stock.products[productIndex].items = originalItems.filter(
              stockItem => !selectedItemIds.includes(stockItem.id)
            );

            // Update quantity based on remaining items
            stock.products[productIndex].quantity = stock.products[productIndex].items.length;

            console.log(`UNIQUE: Removed ${selectedItemIds.length} items, ${stock.products[productIndex].items.length} items remain`);

            // Remove product if no items left
            if (stock.products[productIndex].items.length === 0) {
              stock.products.splice(productIndex, 1);
              console.log('Removed product from source stock (no items left)');
            }
          }

          // Update total products count
          stock.totalProducts = stock.products.length;
          console.log('Updated stock totalProducts:', stock.totalProducts);

          // Send update to server
          const response = await fetch(`http://localhost:5001/stocks/${stock.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(stock),
          });

          if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Failed to update source stock: ${errorText}`);
          }

          console.log('✅ Source stock updated successfully');
          return; // Update first matching stock and exit
        }
      }

      console.warn('⚠ Product not found in any source stock');
    } catch (error) {
      console.error("❌ Error updating source warehouse stock:", error);
      throw error;
    }
  };

  // Update destination warehouse stock
  const updateDestinationWarehouseStock = async (warehouseId, item, sourceWarehouseId, billNo, sourceProductDetails = null, fieldMasters) => {
    try {
      console.log('🔄 Updating destination warehouse stock:', warehouseId, item);

      // Try to find existing stock with same billNo and vendor
      const existingDestinationStocks = stocks.filter(stock =>
        stock.warehouseId === warehouseId
      );

      console.log('Existing destination stocks:', existingDestinationStocks.length);

      let stockToUpdate = null;

      // First, try to find stock with matching billNo (from transfer)
      if (billNo) {
        stockToUpdate = existingDestinationStocks.find(stock =>
          stock.billNo === billNo
        );
        console.log('Found stock with matching billNo:', stockToUpdate?.id);
      }

      // If not found, try to find any stock that already has this product
      if (!stockToUpdate) {
        stockToUpdate = existingDestinationStocks.find(stock => {
          return stock.products?.some(p =>
            p.productId === item.productId &&
            p.identifierType === item.identifierType
          );
        });
        console.log('Found stock with same product:', stockToUpdate?.id);
      }

      // If still not found, create new stock
      if (!stockToUpdate) {
        console.log('Creating new stock for destination');

        // Get source stock info for reference
        const sourceStock = stocks.find(stock =>
          stock.warehouseId === sourceWarehouseId &&
          stock.products?.some(p => p.productId === item.productId)
        );

        const stockId = `S${Date.now()}-${warehouseId}`;
        stockToUpdate = {
          id: stockId,
          vendorId: sourceStock?.vendorId || "",
          vendorName: sourceStock?.vendorName || "Transfer Stock",
          warehouseId: warehouseId,
          warehouseName: getWarehouseName(warehouseId),
          purchaseDate: new Date().toISOString().split('T')[0],
          billNo: billNo || `TR-${Date.now()}`,
          totalProducts: 1,
          products: [],
          createdAt: new Date().toISOString(),
          status: "active"
        };
      }

      // Check if product already exists in this stock
      const productIndex = stockToUpdate.products?.findIndex(p =>
        p.productId === item.productId &&
        p.identifierType === item.identifierType
      ) || -1;

      if (productIndex !== -1) {
        // Update existing product
        console.log('Updating existing product in destination');

        if (item.identifierType === "NON_UNIQUE") {
          stockToUpdate.products[productIndex].quantity += item.transferQty;
          console.log(`Added ${item.transferQty} to existing NON_UNIQUE product`);
        } else if (item.identifierType === "UNIQUE") {
          const existingItems = stockToUpdate.products[productIndex].items || [];
          const newItems = processItemsForStorage(item.selectedItems || [], fieldMasters);
          stockToUpdate.products[productIndex].items = [...existingItems, ...newItems];
          stockToUpdate.products[productIndex].quantity = stockToUpdate.products[productIndex].items.length;
          console.log(`Added ${newItems.length} items to existing UNIQUE product`);
        }
      } else {
        // Add new product to stock
        console.log('Adding new product to destination stock');

        const sourceStock = stocks.find(stock =>
          stock.warehouseId === sourceWarehouseId &&
          stock.products?.some(p => p.productId === item.productId)
        );

        let sourceProduct = null;
        if (sourceStock) {
          sourceProduct = sourceStock.products.find(p => p.productId === item.productId);
        }

        if (!sourceProduct && sourceProductDetails) {
          sourceProduct = sourceProductDetails;
        }

        const newProduct = {
          productId: item.productId,
          productName: item.productName,
          identifierType: item.identifierType,
          rate: item.rate || sourceProduct?.rate || 0,
          gst: sourceProduct?.gst || "0%",
          quantityAlert: sourceProduct?.quantityAlert || 0,
          createdAt: new Date().toISOString(),
          dynamicValues: processDynamicValuesForStorage(item.dynamicValues || sourceProduct?.dynamicValues, fieldMasters)
        };

        if (item.identifierType === "NON_UNIQUE") {
          newProduct.quantity = item.transferQty;
          newProduct.items = [];
        } else if (item.identifierType === "UNIQUE") {
          newProduct.quantity = item.selectedItems?.length || 0;
          newProduct.items = processItemsForStorage(item.selectedItems || [], fieldMasters);
        }

        stockToUpdate.products.push(newProduct);
        console.log('Added new product to stock:', newProduct);
      }

      // Update total products count
      stockToUpdate.totalProducts = stockToUpdate.products.length;
      console.log('Final stock to update:', stockToUpdate);

      // Check if this is an existing stock or new one
      if (stocks.some(s => s.id === stockToUpdate.id)) {
        // Update existing stock
        const response = await fetch(`http://localhost:5001/stocks/${stockToUpdate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockToUpdate),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to update destination stock: ${errorText}`);
        }
      } else {
        // Create new stock
        const response = await fetch("http://localhost:5001/stocks", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(stockToUpdate),
        });

        if (!response.ok) {
          const errorText = await response.text();
          throw new Error(`Failed to create destination stock: ${errorText}`);
        }
      }

      console.log('✅ Destination stock updated successfully');
    } catch (error) {
      console.error("❌ Error updating destination warehouse stock:", error);
      throw error;
    }
  };

  // Refresh all data
  const refreshAllData = async () => {
    try {
      const [stocksRes, transfersRes] = await Promise.all([
        fetch("http://localhost:5001/stocks"),
        fetch("http://localhost:5001/transfers"),
      ]);

      const stocksData = await stocksRes.json();
      const transfersData = await transfersRes.json();

      setStocks(stocksData);
      setTransfers(transfersData);
    } catch (error) {
      console.error("❌ Error refreshing data:", error);
    }
  };

  return {
    getOriginalBillNo,
    getSourceProductDetails,
    updateSourceWarehouseStock,
    updateDestinationWarehouseStock,
    refreshAllData,
    processDynamicValuesForStorage,
    processItemsForStorage
  };
};

// ==================== COMPONENTS ====================
const StatusBadge = ({ status }) => {
  switch (status) {
    case 'pending':
      return <Badge className="bg-yellow-100 text-yellow-800 hover:bg-yellow-100">
        <Clock className="h-3 w-3 mr-1" /> Pending
      </Badge>;
    case 'completed':
      return <Badge className="bg-green-100 text-green-800 hover:bg-green-100">
        <Check className="h-3 w-3 mr-1" /> Completed
      </Badge>;
    case 'rejected':
      return <Badge className="bg-red-100 text-red-800 hover:bg-red-100">
        <XCircle className="h-3 w-3 mr-1" /> Rejected
      </Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};

const TransferForm = ({
  showTransferForm,
  setShowTransferForm,
  warehouses,
  getWarehouseName,
  getWarehouseLocation,
  availableProducts,
  selectedProducts,
  handleProductSelect,
  handleRemoveProduct,
  handleQuantityChange,
  handleRateChange,
  openItemSelection,
  calculateTotal,
  onSubmit,
  isSubmitting,
  register,
  sourceWarehouse,
  destinationWarehouse,
  setValue,
  resetForm,
  productSearch,
  setProductSearch,
  productTypeFilter,
  setProductTypeFilter,
  currentProductPage,
  setCurrentProductPage,
  filteredProducts,
  paginatedProducts,
  totalProductPages
}) => {
  return (
    <Dialog open={showTransferForm} onOpenChange={setShowTransferForm}>
      <DialogTrigger asChild>
        <Button className="gap-2">
          <Plus className="h-4 w-4" />
          Transfer Items
        </Button>
      </DialogTrigger>
      <DialogContent className="min-w-[70%] max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Stock Item Transfer</DialogTitle>
          <DialogDescription>
            Transfer stock items between warehouses
          </DialogDescription>
        </DialogHeader>

        <form onSubmit={onSubmit}>
          <div className="space-y-2 py-2">
            {/* Transfer Details */}
            <Card className="min-w-full">
              <CardHeader className="pb-3">
                <CardTitle className="text-lg">Transfer Details</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                  {/* Transfer Date */}
                  <div className="space-y-2">
                    <Label>Transfer Date *</Label>
                    <Input
                      type="date"
                      {...register("transferDate", {
                        required: "Transfer date is required"
                      })}
                    />
                  </div>

                  {/* Source Warehouse */}
                  <div className="space-y-2">
                    <Label>From Warehouse *</Label>
                    <Select
                      value={sourceWarehouse}
                      onValueChange={(value) => {
                        setValue("sourceWarehouse", value);
                        setValue("destinationWarehouse", "");
                      }}
                    >
                      <SelectTrigger className="min-w-[240px]">
                        <SelectValue placeholder="Select source warehouse">
                          {sourceWarehouse && (
                            <div className="flex flex-col items-start max-w-full overflow-hidden">
                              <span className="font-medium truncate w-full text-left">
                                {getWarehouseName(sourceWarehouse)}
                              </span>
                              <span className="text-xs text-gray-500 truncate w-full text-left">
                                {getWarehouseLocation(sourceWarehouse)}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[400px]">
                        {warehouses.map((warehouse) => (
                          <SelectItem
                            key={warehouse.id}
                            value={warehouse.id}
                            className="data-[state=checked]:bg-accent"
                          >
                            <div className="flex flex-col items-start w-full overflow-hidden">
                              <span className="font-medium truncate w-full text-left">
                                {warehouse.fromWarehouse}
                              </span>
                              <span className="text-xs text-gray-500 truncate w-full text-left">
                                {warehouse.warehouseLocation}
                              </span>
                            </div>
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Destination Warehouse */}
                  <div className="space-y-2">
                    <Label>To Warehouse *</Label>
                    <Select
                      value={destinationWarehouse}
                      onValueChange={(value) => setValue("destinationWarehouse", value)}
                      disabled={!sourceWarehouse}
                    >
                      <SelectTrigger className="min-w-[240px]">
                        <SelectValue placeholder="Select destination warehouse">
                          {destinationWarehouse && (
                            <div className="flex flex-col items-start max-w-full overflow-hidden">
                              <span className="font-medium truncate w-full text-left">
                                {getWarehouseName(destinationWarehouse)}
                              </span>
                              <span className="text-xs text-gray-500 truncate w-full text-left">
                                {getWarehouseLocation(destinationWarehouse)}
                              </span>
                            </div>
                          )}
                        </SelectValue>
                      </SelectTrigger>
                      <SelectContent className="w-[var(--radix-select-trigger-width)] max-w-[400px]">
                        {warehouses
                          .filter(warehouse => warehouse.id !== sourceWarehouse)
                          .map((warehouse) => (
                            <SelectItem
                              key={warehouse.id}
                              value={warehouse.id}
                              className="data-[state=checked]:bg-accent"
                            >
                              <div className="flex flex-col items-start w-full overflow-hidden">
                                <span className="font-medium truncate w-full text-left">
                                  {warehouse.fromWarehouse}
                                </span>
                                <span className="text-xs text-gray-500 truncate w-full text-left">
                                  {warehouse.warehouseLocation}
                                </span>
                              </div>
                            </SelectItem>
                          ))}
                      </SelectContent>
                    </Select>
                  </div>

                  {/* Remarks */}
                  <div className="md:col-span-3 space-y-2">
                    <Label>Remarks</Label>
                    <Textarea
                      placeholder="Enter transfer remarks (optional)"
                      {...register("remarks")}
                      className="min-h-[80px]"
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Products Selection */}
            {sourceWarehouse && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col gap-4">
                    <div>
                      <CardTitle className="text-lg">Available Products</CardTitle>
                      <p className="text-sm text-gray-500">
                        Select products from {getWarehouseName(sourceWarehouse)}
                      </p>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3">
                      {/* Search Bar */}
                      <div className="relative flex-1">
                        <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                        <Input
                          placeholder="Search by product name or SKU..."
                          value={productSearch}
                          onChange={(e) => {
                            setProductSearch(e.target.value);
                            setCurrentProductPage(1);
                          }}
                          className="pl-8"
                        />
                        {productSearch && (
                          <button
                            onClick={() => {
                              setProductSearch("");
                              setCurrentProductPage(1);
                            }}
                            className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                          >
                            <X className="h-4 w-4" />
                          </button>
                        )}
                      </div>

                      {/* Product Type Filter */}
                      <Select
                        value={productTypeFilter}
                        onValueChange={(value) => {
                          setProductTypeFilter(value);
                          setCurrentProductPage(1);
                        }}
                      >
                        <SelectTrigger className="w-full sm:w-[180px]">
                          <Filter className="h-4 w-4 mr-2" />
                          <SelectValue placeholder="Filter by type" />
                        </SelectTrigger>
                        <SelectContent>
                          <SelectItem value="all">All Types</SelectItem>
                          <SelectItem value="UNIQUE">Unique Items</SelectItem>
                          <SelectItem value="NON_UNIQUE">Non-Unique</SelectItem>
                        </SelectContent>
                      </Select>
                    </div>

                    {/* Results Info */}
                    <div className="flex justify-between items-center text-sm text-gray-600">
                      <span>
                        Showing {paginatedProducts.length} of {filteredProducts.length} products
                      </span>
                      <span>
                        Page {currentProductPage} of {totalProductPages}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  {filteredProducts.length === 0 ? (
                    <div className="text-center py-8 border rounded-lg">
                      <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                      <p className="text-gray-500">
                        {productSearch || productTypeFilter !== "all"
                          ? "No products found matching your criteria"
                          : "No products available in this warehouse"
                        }
                      </p>
                    </div>
                  ) : (
                    <>
                      <ProductTable
                        products={paginatedProducts}
                        compact={true}
                        onProductClick={handleProductSelect}
                        showActions={false}
                      />

                      {/* Pagination */}
                      {totalProductPages > 1 && (
                        <div className="flex justify-center items-center gap-2 mt-4">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentProductPage(currentProductPage - 1)}
                            disabled={currentProductPage === 1}
                          >
                            <ChevronLeft className="h-4 w-4" />
                          </Button>

                          <div className="flex gap-1">
                            {Array.from({ length: totalProductPages }, (_, i) => i + 1)
                              .slice(
                                Math.max(0, currentProductPage - 3),
                                Math.min(totalProductPages, currentProductPage + 2)
                              )
                              .map((page) => (
                                <Button
                                  key={page}
                                  variant={currentProductPage === page ? "default" : "outline"}
                                  size="sm"
                                  onClick={() => setCurrentProductPage(page)}
                                >
                                  {page}
                                </Button>
                              ))}
                          </div>

                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setCurrentProductPage(currentProductPage + 1)}
                            disabled={currentProductPage === totalProductPages}
                          >
                            <ChevronRight className="h-4 w-4" />
                          </Button>
                        </div>
                      )}
                    </>
                  )}
                </CardContent>
              </Card>
            )}

            {/* Selected Products Table */}
            {selectedProducts.length > 0 && (
              <Card>
                <CardHeader className="pb-3">
                  <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                    <div>
                      <CardTitle className="text-lg">Selected for Transfer</CardTitle>
                      <p className="text-sm text-gray-500">
                        {selectedProducts.length} product(s) selected • Total Value: ₹{calculateTotal()}
                      </p>
                    </div>
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={() => {
                        setSelectedProducts([]);
                      }}
                      className="text-red-600 hover:text-red-700 hover:bg-red-50"
                    >
                      Clear All
                    </Button>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="border rounded-lg overflow-hidden">
                    <Table>
                      <TableHeader>
                        <TableRow>
                          <TableHead className="w-[250px]">Product</TableHead>
                          <TableHead className="text-center">Type</TableHead>
                          <TableHead className="text-center">Available</TableHead>
                          <TableHead className="text-center">Transfer Qty</TableHead>
                          <TableHead className="text-center">Rate (₹)</TableHead>
                          <TableHead className="text-center">Value (₹)</TableHead>
                          <TableHead className="text-center">Action</TableHead>
                        </TableRow>
                      </TableHeader>
                      <TableBody>
                        {selectedProducts.map((item, index) => (
                          <TableRow key={`${item.productId}-${index}`}>
                            <TableCell>
                              <div className="flex items-center gap-3">
                                <div className={`h-8 w-8 rounded flex items-center justify-center ${item.identifierType === "UNIQUE"
                                  ? "bg-purple-100"
                                  : "bg-blue-100"
                                  }`}>
                                  {item.identifierType === "UNIQUE" ? (
                                    <Hash className="h-4 w-4 text-purple-600" />
                                  ) : (
                                    <Package className="h-4 w-4 text-blue-600" />
                                  )}
                                </div>
                                <div>
                                  <div className="font-medium">{item.productName}</div>
                                  <div className="text-xs text-gray-500">
                                    SKU: {item.sku} • {item.identifierType}
                                  </div>
                                </div>
                              </div>
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge
                                variant={item.identifierType === "UNIQUE" ? "secondary" : "outline"}
                                className={item.identifierType === "UNIQUE" ? "bg-purple-100 text-purple-800" : ""}
                              >
                                {item.identifierType}
                              </Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              <Badge variant="outline">{item.availableQty || 0}</Badge>
                            </TableCell>

                            <TableCell className="text-center">
                              {item.identifierType === "NON_UNIQUE" ? (
                                <Input
                                  type="number"
                                  min="0"
                                  max={item.availableQty || 0}
                                  value={item.transferQty || 0}
                                  onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                  className="w-24 mx-auto"
                                />
                              ) : (
                                <div className="flex flex-col items-center">
                                  <Badge variant="outline" className="mb-1">
                                    {item.selectedItems?.length || 0} selected
                                  </Badge>
                                  <Button
                                    type="button"
                                    variant="outline"
                                    size="sm"
                                    onClick={() => openItemSelection(index)}
                                    className="text-sm"
                                  >
                                    Select Items
                                  </Button>
                                </div>
                              )}
                            </TableCell>

                            <TableCell className="text-center">
                              <Input
                                type="number"
                                step="0.01"
                                min="0"
                                value={item.rate || 0}
                                onChange={(e) => handleRateChange(index, parseFloat(e.target.value) || 0)}
                                className="w-24 mx-auto"
                              />
                            </TableCell>

                            <TableCell className="text-center font-medium">
                              ₹{(
                                (item.identifierType === "UNIQUE"
                                  ? (item.selectedItems?.length || 0)
                                  : (item.transferQty || 0)) * (item.rate || 0)
                              ).toFixed(2)}
                            </TableCell>

                            <TableCell className="text-center">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleRemoveProduct(index)}
                                className="text-red-600 hover:text-red-700 hover:bg-red-50"
                              >
                                Remove
                              </Button>
                            </TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </div>
                </CardContent>
              </Card>
            )}

            {/* Form Actions */}
            <div className="flex justify-end space-x-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={() => {
                  resetForm();
                  setShowTransferForm(false);
                }}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting || selectedProducts.length === 0}
              >
                {isSubmitting ? (
                  <>
                    <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                    Processing...
                  </>
                ) : (
                  "Submit Transfer Request"
                )}
              </Button>
            </div>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  );
};

const ItemSelectionModal = ({
  showItemSelection,
  setShowItemSelection,
  selectedProductIndex,
  selectedProducts,
  itemSearchTerm,
  setItemSearchTerm,
  randomQtyInput,
  setRandomQtyInput,
  getDynamicFieldsFromItems,
  getFilteredItems,
  handleSelectAllFilteredItems,
  handleClearFilteredSelection,
  handleClearSelection,
  handleSelectRandomItems,
  handleSelectUniqueItems,
  closeItemSelection
}) => {
  const dynamicFields = getDynamicFieldsFromItems();
  const filteredItems = getFilteredItems();

  return (
    <Dialog open={showItemSelection} onOpenChange={setShowItemSelection}>
      <DialogContent className="min-w-[70%] min-h-[90vh] overflow-x-scroll">
        <DialogHeader>
          <DialogTitle>Select Items to Transfer</DialogTitle>
        </DialogHeader>

        {selectedProductIndex !== null && (
          <div>
            <div className="mb-2">
              <h3 className="font-semibold text-lg">
                {selectedProducts[selectedProductIndex]?.productName}
              </h3>
              <p className="text-sm text-gray-500 mb-2">
                Available: {selectedProducts[selectedProductIndex]?.availableQty} items •
                Selected: {selectedProducts[selectedProductIndex]?.selectedItems?.length || 0} items
              </p>

              {/* Search Bar for Items */}
              <div className="mb-4">
                <div className="relative">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search items by serial number, MAC address, warranty, etc."
                    value={itemSearchTerm}
                    onChange={(e) => setItemSearchTerm(e.target.value)}
                    className="pl-8"
                  />
                  {itemSearchTerm && (
                    <button
                      onClick={() => setItemSearchTerm("")}
                      className="absolute right-2 top-2.5 text-gray-400 hover:text-gray-600"
                    >
                      <X className="h-4 w-4" />
                    </button>
                  )}
                </div>
                {itemSearchTerm && (
                  <p className="text-xs text-gray-500 mt-1">
                    Searching in all item fields...
                  </p>
                )}
              </div>

              {/* Random Selection Controls */}
              <div className="bg-gray-50 p-4 rounded-lg mb-4">
                <div className="flex flex-col sm:flex-row items-start sm:items-center gap-4">
                  <div className="flex-1">
                    <Label className="text-sm font-medium mb-2 block">Quick Selection Options</Label>
                    <div className="flex flex-wrap gap-3">
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleSelectAllFilteredItems(selectedProductIndex)}
                        className="gap-2"
                      >
                        <CheckSquare className="h-4 w-4" />
                        Select All (Filtered)
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearFilteredSelection(selectedProductIndex)}
                        className="gap-2"
                      >
                        <Square className="h-4 w-4" />
                        Clear Filtered
                      </Button>

                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => handleClearSelection(selectedProductIndex)}
                        className="gap-2 text-red-600"
                      >
                        <Square className="h-4 w-4" />
                        Clear All
                      </Button>
                    </div>
                  </div>

                  <div className="flex flex-col sm:flex-row items-start sm:items-center gap-3">
                    <div>
                      <Label className="text-sm font-medium mb-2 block">Select Random Items {itemSearchTerm && "(Filtered)"}</Label>
                      <div className="flex gap-2">
                        <Input
                          type="number"
                          placeholder="Enter quantity"
                          value={randomQtyInput}
                          onChange={(e) => setRandomQtyInput(e.target.value)}
                          min="1"
                          max={filteredItems.length || 0}
                          className="w-32"
                        />
                        <Button
                          type="button"
                          variant="outline"
                          onClick={() => handleSelectRandomItems(selectedProductIndex)}
                          className="gap-2"
                        >
                          <Shuffle className="h-4 w-4" />
                          Random {itemSearchTerm && "(Filtered)"}
                        </Button>
                      </div>
                    </div>
                  </div>
                </div>
              </div>
            </div>

            {/* Items Info */}
            <div className="mb-4">
              <div className="flex justify-between items-center text-sm">
                <div>
                  <span className="font-medium">Total Items: {selectedProducts[selectedProductIndex]?.items?.length || 0}</span>
                  {itemSearchTerm && (
                    <span className="text-gray-600 ml-2">
                      • Filtered: {filteredItems.length}
                    </span>
                  )}
                </div>
                <div className="text-green-600 font-medium">
                  Selected: {selectedProducts[selectedProductIndex]?.selectedItems?.length || 0}
                </div>
              </div>
            </div>

            <div className="border rounded-lg max-h-66 overflow-y-auto">
              <Table>
                <TableHeader className="sticky top-0 bg-white">
                  <TableRow>
                    <TableHead className="w-12">
                      <input
                        type="checkbox"
                        checked={
                          filteredItems.length > 0 &&
                          filteredItems.every(item =>
                            selectedProducts[selectedProductIndex]?.selectedItems?.some(
                              selected => selected.id === item.id
                            )
                          )
                        }
                        onChange={(e) => {
                          if (filteredItems.length === 0) return;

                          const currentSelected = selectedProducts[selectedProductIndex]?.selectedItems || [];
                          const filteredItemIds = filteredItems.map(item => item.id);

                          if (e.target.checked) {
                            const newSelected = [...currentSelected, ...filteredItems];
                            const uniqueSelected = Array.from(new Set(newSelected.map(item => item.id)))
                              .map(id => newSelected.find(item => item.id === id));

                            handleSelectUniqueItems(
                              selectedProductIndex,
                              uniqueSelected.map(item => item.id)
                            );
                          } else {
                            const newSelected = currentSelected.filter(
                              item => !filteredItemIds.includes(item.id)
                            );

                            handleSelectUniqueItems(
                              selectedProductIndex,
                              newSelected.map(item => item.id)
                            );
                          }
                        }}
                      />
                    </TableHead>
                    <TableHead className="w-20">#</TableHead>
                    {dynamicFields
                      .sort((a, b) => {
                        if (a.isSerial || a.isMac) return -1;
                        if (b.isSerial || b.isMac) return 1;
                        if (a.isWarranty) return -1;
                        if (b.isWarranty) return 1;
                        return a.key.localeCompare(b.key);
                      })
                      .map(field => (
                        <TableHead key={field.key} className="capitalize">
                          {field.key.replace(/_/g, ' ')}
                        </TableHead>
                      ))}
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {filteredItems.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={dynamicFields.length + 3} className="text-center py-8 text-gray-500">
                        <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                        <p className="mb-1">No items found</p>
                        {itemSearchTerm && (
                          <p className="text-xs">Try changing your search criteria</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    filteredItems.map((item, itemIndex) => (
                      <TableRow key={item.id} className="hover:bg-gray-50">
                        <TableCell>
                          <input
                            type="checkbox"
                            checked={selectedProducts[selectedProductIndex]?.selectedItems?.some(
                              selected => selected.id === item.id
                            )}
                            onChange={(e) => {
                              const currentSelected = selectedProducts[selectedProductIndex]?.selectedItems || [];
                              let newSelected;

                              if (e.target.checked) {
                                newSelected = [...currentSelected, item];
                              } else {
                                newSelected = currentSelected.filter(selected => selected.id !== item.id);
                              }

                              handleSelectUniqueItems(
                                selectedProductIndex,
                                newSelected.map(selected => selected.id)
                              );
                            }}
                          />
                        </TableCell>
                        <TableCell className="font-medium text-gray-500">
                          {itemIndex + 1}
                        </TableCell>

                        {dynamicFields.map(field => {
                          const value = item[field.key];

                          if (field.isSerial || field.isMac) {
                            return (
                              <TableCell key={field.key} className="font-mono text-sm">
                                {value || "N/A"}
                              </TableCell>
                            );
                          } else if (field.isWarranty) {
                            return (
                              <TableCell key={field.key}>
                                {value ? (
                                  <Badge variant="outline" className="text-xs">
                                    {value}
                                  </Badge>
                                ) : (
                                  "N/A"
                                )}
                              </TableCell>
                            );
                          } else {
                            return (
                              <TableCell key={field.key} className="text-sm">
                                {value || "N/A"}
                              </TableCell>
                            );
                          }
                        })}
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>
            </div>

            <div className="flex justify-between items-center mt-6 pt-4 border-t">
              <div className="text-sm">
                <span className="font-medium">Selected: {selectedProducts[selectedProductIndex]?.selectedItems?.length || 0}</span>
                <span className="text-gray-500 ml-2">out of {selectedProducts[selectedProductIndex]?.availableQty || 0} items</span>
              </div>
              <div className="flex gap-3">
                <Button variant="outline" onClick={closeItemSelection}>
                  Cancel
                </Button>
                <Button onClick={closeItemSelection}>
                  Done
                </Button>
              </div>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ==================== MAIN COMPONENT ====================
export default function StockTransferPage() {
  // State Management
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [transferToApprove, setTransferToApprove] = useState(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

  // Search & Filter states
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const [transferSearch, setTransferSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentTransferPage, setCurrentTransferPage] = useState(1);

  // Constants
  const productsPerPage = 8;
  const transfersPerPage = 10;

  // Hooks
  const { warehouses, products, stocks, transfers, fieldMasters, isLoading, setStocks, setTransfers } = useStockTransferData();
  const { getWarehouseName, getWarehouseLocation } = useWarehouseData(warehouses);

  // React Hook Form - MUST BE BEFORE useProductSelection
  const {
    register,
    control,
    handleSubmit,
    watch,
    setValue,
    reset,
    getValues,
    formState: { errors },
  } = useForm({
    defaultValues: {
      transferDate: new Date().toISOString().split("T")[0],
      sourceWarehouse: "",
      destinationWarehouse: "",
      remarks: "",
      items: [],
    },
  });

  // Watch form values - MUST BE BEFORE useProductSelection
  const sourceWarehouse = watch("sourceWarehouse");
  const destinationWarehouse = watch("destinationWarehouse");

  // Now call useProductSelection with sourceWarehouse
  const {
    availableProducts,
    selectedProducts,
    setSelectedProducts,
    processStockItems
  } = useProductSelection(
    sourceWarehouse,
    stocks,
    products,
    fieldMasters
  );

  const {
    itemSearchTerm,
    setItemSearchTerm,
    randomQtyInput,
    setRandomQtyInput,
    getDynamicFieldsFromItems,
    getFilteredItems
  } = useItemSelection(selectedProducts, selectedProductIndex);

  const {
    getOriginalBillNo,
    getSourceProductDetails,
    updateSourceWarehouseStock,
    updateDestinationWarehouseStock,
    refreshAllData,
    processDynamicValuesForStorage,
    processItemsForStorage
  } = useTransferProcessing(stocks, warehouses, setStocks, setTransfers);

  const { remove } = useFieldArray({
    control,
    name: "items",
  });

  // Filter products based on search and filter
  const filteredProducts = useMemo(() => {
    return availableProducts.filter(product => {
      if (productSearch) {
        const searchLower = productSearch.toLowerCase();
        const matchesSearch =
          (product.productName || product.name || "").toLowerCase().includes(searchLower) ||
          (product.sku || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (productTypeFilter !== "all" && product.identifierType !== productTypeFilter) return false;

      return true;
    });
  }, [availableProducts, productSearch, productTypeFilter]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentProductPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentProductPage]);

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Filter transfers based on search and filters
  const filteredTransfers = useMemo(() => {
    return transfers.filter(transfer => {
      if (transferSearch) {
        const searchLower = transferSearch.toLowerCase();
        const matchesSearch =
          (transfer.productName || "").toLowerCase().includes(searchLower) ||
          (transfer.productId || "").toLowerCase().includes(searchLower) ||
          (transfer.id || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }

      if (statusFilter !== "all" && transfer.status !== statusFilter) return false;

      if (dateFilter) {
        const transferDate = new Date(transfer.transferDate).toISOString().split('T')[0];
        if (transferDate !== dateFilter) return false;
      }

      return true;
    });
  }, [transfers, transferSearch, statusFilter, dateFilter]);

  // Paginate transfers
  const paginatedTransfers = useMemo(() => {
    const startIndex = (currentTransferPage - 1) * transfersPerPage;
    return filteredTransfers.slice(startIndex, startIndex + transfersPerPage);
  }, [filteredTransfers, currentTransferPage]);

  const totalTransferPages = Math.ceil(filteredTransfers.length / transfersPerPage);

  // Handler Functions
  const handleProductSelect = (product) => {
    if (selectedProducts.some(sp => sp.productId === product.id)) {
      toast.warning("Product already added to transfer");
      return;
    }

    const productWithStock = availableProducts.find(p => p.id === product.id);
    if (!productWithStock) {
      toast.error("Product not available in selected warehouse");
      return;
    }

    const newProduct = {
      productId: product.id,
      productName: product.productName || product.name,
      availableQty: productWithStock.availableQty || 0,
      transferQty: 0,
      rate: productWithStock.rate || 0,
      sku: product.sku || "",
      unit: product.unit || "pieces",
      identifierType: productWithStock.identifierType,
      items: productWithStock.items || [],
      dynamicValues: productWithStock.dynamicValues || {},
      dynamicFields: productWithStock.dynamicFields || []
    };

    setSelectedProducts([...selectedProducts, newProduct]);
  };

  const handleSelectUniqueItems = (productIndex, selectedItemIds) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE") {
      const selectedItems = product.items.filter(item =>
        selectedItemIds.includes(item.id)
      );

      product.selectedItems = selectedItems;
      product.transferQty = selectedItems.length;
      setSelectedProducts(items);
    }
  };

  const handleSelectRandomItems = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (!randomQtyInput || isNaN(randomQtyInput) || randomQtyInput <= 0) {
      toast.error("Please enter a valid quantity");
      return;
    }

    const qty = parseInt(randomQtyInput);
    if (qty > product.availableQty) {
      toast.error(`Cannot select more than ${product.availableQty} items`);
      return;
    }

    if (product.identifierType === "UNIQUE" && product.items.length > 0) {
      const filteredItems = itemSearchTerm
        ? product.items.filter(item => {
          const searchLower = itemSearchTerm.toLowerCase();
          return Object.entries(item).some(([key, value]) => {
            if (key === 'id') return false;
            return String(value).toLowerCase().includes(searchLower);
          });
        })
        : product.items;

      if (filteredItems.length === 0) {
        toast.error("No items match your search criteria");
        return;
      }

      if (qty > filteredItems.length) {
        toast.error(`Cannot select more than ${filteredItems.length} matching items`);
        return;
      }

      const shuffledItems = [...filteredItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, qty);

      const currentSelected = product.selectedItems || [];
      const newSelected = [...currentSelected, ...selectedItems];
      const uniqueSelected = Array.from(new Set(newSelected.map(item => item.id)))
        .map(id => newSelected.find(item => item.id === id));

      product.selectedItems = uniqueSelected;
      product.transferQty = uniqueSelected.length;
      setSelectedProducts(items);

      toast.success(`Randomly selected ${selectedItems.length} items`);
      setRandomQtyInput("");
    }
  };

  const handleSelectAllFilteredItems = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE" && product.items.length > 0) {
      const filteredItems = getFilteredItems();

      if (filteredItems.length === 0) {
        toast.error("No items to select");
        return;
      }

      const currentSelected = product.selectedItems || [];
      const newSelected = [...currentSelected, ...filteredItems];
      const uniqueSelected = Array.from(new Set(newSelected.map(item => item.id)))
        .map(id => newSelected.find(item => item.id === id));

      product.selectedItems = uniqueSelected;
      product.transferQty = uniqueSelected.length;
      setSelectedProducts(items);

      toast.success(`Selected all ${filteredItems.length} matching items`);
    }
  };

  const handleClearSelection = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE") {
      product.selectedItems = [];
      product.transferQty = 0;
      setSelectedProducts(items);
      toast.success("Cleared selection");
    }
  };

  const handleClearFilteredSelection = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE") {
      const filteredItems = getFilteredItems();
      const filteredItemIds = filteredItems.map(item => item.id);

      const currentSelected = product.selectedItems || [];
      const newSelected = currentSelected.filter(item => !filteredItemIds.includes(item.id));

      product.selectedItems = newSelected;
      product.transferQty = newSelected.length;
      setSelectedProducts(items);

      toast.success(`Cleared ${filteredItems.length} matching items from selection`);
    }
  };

  const handleQuantityChange = (index, value) => {
    const items = [...selectedProducts];
    const product = items[index];

    if (product.identifierType === "NON_UNIQUE") {
      const maxQty = product.availableQty || 0;
      const newQty = Math.max(0, Math.min(value, maxQty));
      product.transferQty = newQty;
      setSelectedProducts(items);
    }
  };

  const handleRateChange = (index, value) => {
    const items = [...selectedProducts];
    items[index].rate = Math.max(0, parseFloat(value) || 0);
    setSelectedProducts(items);
  };

  const handleRemoveProduct = (index) => {
    const newSelectedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newSelectedProducts);
  };

  const openItemSelection = (index) => {
    setSelectedProductIndex(index);
    setItemSearchTerm("");
    setRandomQtyInput("");
    setShowItemSelection(true);
  };

  const closeItemSelection = () => {
    setShowItemSelection(false);
    setSelectedProductIndex(null);
    setItemSearchTerm("");
    setRandomQtyInput("");
  };

  const openTransferDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setShowTransferDetails(true);
  };

  const openApproveDialog = (transfer) => {
    setTransferToApprove(transfer);
    setShowApproveDialog(true);
  };

  const handleApproveTransfer = async (transferId) => {
    setIsProcessingApproval(true);

    try {
      const transfer = transfers.find(t => t.id === transferId);
      if (!transfer) {
        toast.error("Transfer not found");
        return;
      }

      console.log('✅ Approving transfer:', transfer);

      // Update source stock (minus)
      await updateSourceWarehouseStock(transfer.sourceWarehouse.id, {
        productId: transfer.productId,
        productName: transfer.productName,
        identifierType: transfer.identifierType,
        transferQty: transfer.quantity,
        selectedItems: transfer.items || [],
        rate: transfer.rate,
        dynamicValues: transfer.dynamicValues || {}
      }, fieldMasters);

      // Update destination stock (plus)
      const itemBillNo = transfer.sourceBillNo || getOriginalBillNo(transfer.sourceWarehouse.id, transfer.productId);
      const sourceProductDetails = getSourceProductDetails(
        transfer.sourceWarehouse.id,
        transfer.productId
      );

      await updateDestinationWarehouseStock(
        transfer.destinationWarehouse.id,
        {
          productId: transfer.productId,
          productName: transfer.productName,
          identifierType: transfer.identifierType,
          transferQty: transfer.quantity,
          selectedItems: transfer.items || [],
          rate: transfer.rate,
          dynamicValues: transfer.dynamicValues || {}
        },
        transfer.sourceWarehouse.id,
        itemBillNo,
        sourceProductDetails,
        fieldMasters
      );

      // Update transfer status
      const response = await fetch(`http://localhost:5001/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          status: "completed",
          approvedAt: new Date().toISOString(),
          approvedBy: "admin"
        }),
      });

      if (!response.ok) throw new Error("Failed to update transfer status");

      // Refresh all data
      await refreshAllData();
      toast.success("Transfer approved successfully!");
      setShowApproveDialog(false);

    } catch (error) {
      console.error("❌ Error approving transfer:", error);
      toast.error("Failed to approve transfer: " + error.message);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const handleRejectTransfer = async (transferId) => {
    setIsProcessingApproval(true);

    try {
      const response = await fetch(`http://localhost:5001/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) throw new Error("Failed to update transfer status");

      await refreshAllData();
      toast.success("Transfer rejected successfully!");
      setShowApproveDialog(false);

    } catch (error) {
      console.error("❌ Error rejecting transfer:", error);
      toast.error("Failed to reject transfer: " + error.message);
    } finally {
      setIsProcessingApproval(false);
    }
  };

  const validateForm = (data) => {
    if (data.sourceWarehouse === data.destinationWarehouse) {
      toast.error("Source and Destination warehouses must be different");
      return false;
    }

    const transferItems = selectedProducts.filter(item => {
      if (item.identifierType === "UNIQUE") {
        return item.selectedItems && item.selectedItems.length > 0;
      } else {
        return item.transferQty > 0;
      }
    });

    if (transferItems.length === 0) {
      toast.error("Please add at least one item with transfer quantity");
      return false;
    }

    for (const item of selectedProducts) {
      if (item.identifierType === "NON_UNIQUE") {
        if (item.transferQty > item.availableQty) {
          toast.error(`"${item.productName}" cannot transfer more than available quantity`);
          return false;
        }
      } else if (item.identifierType === "UNIQUE") {
        if (!item.selectedItems || item.selectedItems.length === 0) {
          toast.error(`"${item.productName}" please select items to transfer`);
          return false;
        }
      }
    }

    return true;
  };

  const onSubmit = async (data) => {
    if (!validateForm(data)) return;
    setShowConfirmDialog(true);
  };

const confirmTransfer = async () => {
  setShowConfirmDialog(false);
  setIsSubmitting(true);

  const formData = getValues();
  const transferItems = selectedProducts.filter(item => {
    if (item.identifierType === "UNIQUE") {
      return item.selectedItems && item.selectedItems.length > 0;
    } else {
      return item.transferQty > 0;
    }
  });

  try {
    const transferId = `T${Date.now()}`;

    for (const [index, item] of transferItems.entries()) {
      const sourceWarehouseName = getWarehouseName(formData.sourceWarehouse);
      const sourceLocation = getWarehouseLocation(formData.sourceWarehouse);
      const destinationWarehouseName = getWarehouseName(formData.destinationWarehouse);
      const destinationLocation = getWarehouseLocation(formData.destinationWarehouse);

      // Get original bill number for tracking
      const originalBillNo = getOriginalBillNo(formData.sourceWarehouse, item.productId);
      
      // Process dynamic values
      const processedDynamicValues = processDynamicValuesForStorage(item.dynamicValues, fieldMasters);
      const processedItems = processItemsForStorage(item.selectedItems || [], fieldMasters);

      // Get source product details for all fields
      const sourceProductDetails = getSourceProductDetails(formData.sourceWarehouse, item.productId);

      const transferData = {
        id: `${transferId}-${index}`,
        productId: item.productId,
        productName: item.productName,
        sku: item.sku || item.productId,
        unit: item.unit || "pieces",
        quantity: item.identifierType === "UNIQUE" ? item.selectedItems?.length || 0 : item.transferQty,
        rate: item.rate || 0,
        totalValue: (item.identifierType === "UNIQUE" ? item.selectedItems?.length || 0 : item.transferQty) * (item.rate || 0),
        
        // Source warehouse details
        sourceWarehouse: {
          id: formData.sourceWarehouse,
          name: sourceWarehouseName,
          location: sourceLocation
        },
        
        // Destination warehouse details
        destinationWarehouse: {
          id: formData.destinationWarehouse,
          name: destinationWarehouseName,
          location: destinationLocation
        },
        
        // Movement tracking
        movements: [
          {
            type: "OUT",
            warehouseId: formData.sourceWarehouse,
            warehouseName: sourceWarehouseName,
            quantity: item.identifierType === "UNIQUE" ? -1 * (item.selectedItems?.length || 0) : -item.transferQty,
            date: new Date().toISOString()
          },
          {
            type: "IN",
            warehouseId: formData.destinationWarehouse,
            warehouseName: destinationWarehouseName,
            quantity: item.identifierType === "UNIQUE" ? item.selectedItems?.length || 0 : item.transferQty,
            date: new Date().toISOString(),
            pendingApproval: true
          }
        ],
        
        // Product details
        identifierType: item.identifierType,
        dynamicValues: processedDynamicValues,
        dynamicFields: item.dynamicFields || [],
        
        // Status and tracking
        status: "pending",
        sourceBillNo: originalBillNo,
        remarks: formData.remarks || "",
        transferDate: new Date().toISOString(),
        createdAt: new Date().toISOString(),
        createdBy: "admin",
        
        // Items for UNIQUE products
        items: processedItems,
        
        // Additional product info from source
        gst: sourceProductDetails?.gst || "0%",
        quantityAlert: sourceProductDetails?.quantityAlert || 0,
        hsnCode: sourceProductDetails?.hsnCode || "",
        category: sourceProductDetails?.category || ""
      };

      console.log('📤 Creating transfer:', transferData);

      const transferResponse = await fetch("http://localhost:5001/transfers", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(transferData),
      });

      if (!transferResponse.ok) {
        const errorText = await transferResponse.text();
        throw new Error(`Failed to create transfer record: ${errorText}`);
      }

      console.log('✅ Transfer created successfully');
    }

    toast.success("Transfer request created! Awaiting approval from destination warehouse.");

    // Refresh data and reset form
    setTimeout(async () => {
      await refreshAllData();
      const sourceName = getWarehouseName(formData.sourceWarehouse);
      const destName = getWarehouseName(formData.destinationWarehouse);
      
      toast.success(`Transfer request sent to ${destName}! Awaiting approval.`, { 
        duration: 5000,
        description: `${transferItems.length} item(s) transferred from ${sourceName}`
      });
      
      resetForm();
      setShowTransferForm(false);
    }, 1000);

  } catch (error) {
    console.error("❌ Transfer error:", error);
    toast.error("Failed to create transfer request: " + error.message);
  } finally {
    setIsSubmitting(false);
  }
};

  const resetForm = () => {
    reset({
      transferDate: new Date().toISOString().split("T")[0],
      sourceWarehouse: "",
      destinationWarehouse: "",
      remarks: "",
      items: [],
    });
    setSelectedProducts([]);
    setProductSearch("");
    setProductTypeFilter("all");
    setCurrentProductPage(1);
  };

  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const quantity = item.identifierType === "UNIQUE"
        ? (item.selectedItems?.length || 0)
        : (item.transferQty || 0);
      return total + (quantity * (item.rate || 0));
    }, 0).toFixed(2);
  };

  const resetTransferFilters = () => {
    setTransferSearch("");
    setStatusFilter("all");
    setDateFilter("");
    setCurrentTransferPage(1);
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center min-h-screen">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="container mx-auto md:p-2">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage stock transfers between warehouses</p>
        </div>

        <TransferForm
          showTransferForm={showTransferForm}
          setShowTransferForm={setShowTransferForm}
          warehouses={warehouses}
          getWarehouseName={getWarehouseName}
          getWarehouseLocation={getWarehouseLocation}
          availableProducts={availableProducts}
          selectedProducts={selectedProducts}
          handleProductSelect={handleProductSelect}
          handleRemoveProduct={handleRemoveProduct}
          handleQuantityChange={handleQuantityChange}
          handleRateChange={handleRateChange}
          openItemSelection={openItemSelection}
          calculateTotal={calculateTotal}
          onSubmit={handleSubmit(onSubmit)}
          isSubmitting={isSubmitting}
          register={register}
          sourceWarehouse={sourceWarehouse}
          destinationWarehouse={destinationWarehouse}
          setValue={setValue}
          resetForm={resetForm}
          productSearch={productSearch}
          setProductSearch={setProductSearch}
          productTypeFilter={productTypeFilter}
          setProductTypeFilter={setProductTypeFilter}
          currentProductPage={currentProductPage}
          setCurrentProductPage={setCurrentProductPage}
          filteredProducts={filteredProducts}
          paginatedProducts={paginatedProducts}
          totalProductPages={totalProductPages}
        />
      </div>

      {/* Transfer History */}
      <div className="space-y-4">
        <Card>
          <CardHeader>
            <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
              <CardTitle>Transfer History</CardTitle>

              <div className="flex flex-col sm:flex-row gap-3 w-full sm:w-auto">
                {/* Search Bar */}
                <div className="relative flex-1 sm:w-64">
                  <Search className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    placeholder="Search transfers..."
                    value={transferSearch}
                    onChange={(e) => {
                      setTransferSearch(e.target.value);
                      setCurrentTransferPage(1);
                    }}
                    className="pl-8"
                  />
                </div>

                {/* Status Filter */}
                <Select
                  value={statusFilter}
                  onValueChange={(value) => {
                    setStatusFilter(value);
                    setCurrentTransferPage(1);
                  }}
                >
                  <SelectTrigger className="w-full sm:w-[180px]">
                    <Filter className="h-4 w-4 mr-2" />
                    <SelectValue placeholder="Filter by status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="pending">Pending</SelectItem>
                    <SelectItem value="completed">Completed</SelectItem>
                    <SelectItem value="rejected">Rejected</SelectItem>
                  </SelectContent>
                </Select>

                {/* Date Filter */}
                <div className="relative w-full sm:w-auto">
                  <Calendar className="absolute left-2 top-2.5 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    placeholder="Filter by date"
                    value={dateFilter}
                    onChange={(e) => {
                      setDateFilter(e.target.value);
                      setCurrentTransferPage(1);
                    }}
                    className="pl-8 w-full"
                  />
                </div>

                {/* Reset Filters */}
                {(transferSearch || dateFilter || statusFilter !== "all") && (
                  <Button
                    variant="outline"
                    onClick={resetTransferFilters}
                    className="gap-2"
                  >
                    <X className="h-4 w-4" />
                    Reset
                  </Button>
                )}
              </div>
            </div>
          </CardHeader>
          <CardContent>
            <div className="rounded-md border">
              <Table>
                <TableHeader>
                  <TableRow>
                    <TableHead>Transfer ID</TableHead>
                    <TableHead>Product</TableHead>
                    <TableHead>Type</TableHead>
                    <TableHead>Qty</TableHead>
                    <TableHead>From</TableHead>
                    <TableHead>To</TableHead>
                    <TableHead>Date & Time</TableHead>
                    <TableHead>Status</TableHead>
                    <TableHead>Actions</TableHead>
                  </TableRow>
                </TableHeader>
                <TableBody>
                  {paginatedTransfers.length === 0 ? (
                    <TableRow>
                      <TableCell colSpan={9} className="text-center py-8 text-gray-500">
                        <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                        <p className="mb-2">No transfer records found</p>
                        {transferSearch || dateFilter || statusFilter !== "all" ? (
                          <p className="text-sm">Try changing your filters</p>
                        ) : (
                          <p className="text-sm">Transfer some items to see history here</p>
                        )}
                      </TableCell>
                    </TableRow>
                  ) : (
                    paginatedTransfers.map((transfer) => (
                      <TableRow key={transfer.id} className="hover:bg-gray-50">
                        <TableCell className="font-medium">
                          <div className="text-sm font-mono">{transfer.id}</div>
                        </TableCell>
                        <TableCell>
                          <div>
                            <div className="font-medium">{transfer.productName}</div>
                            <div className="text-xs text-gray-500">
                              Rate: ₹{transfer.rate || 'N/A'} • SKU: {transfer.sku || 'N/A'}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <Badge
                            variant={transfer.identifierType === "UNIQUE" ? "secondary" : "outline"}
                            className={transfer.identifierType === "UNIQUE" ? "bg-purple-100 text-purple-800" : ""}
                          >
                            {transfer.identifierType || 'NON_UNIQUE'}
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <Badge variant="outline" className="font-medium">
                            {transfer.quantity} units
                          </Badge>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium truncate max-w-[120px]">{transfer.sourceWarehouse?.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">
                              {transfer.sourceWarehouse?.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell>
                          <div className="text-sm">
                            <div className="font-medium truncate max-w-[120px]">{transfer.destinationWarehouse?.name}</div>
                            <div className="text-xs text-gray-500 truncate max-w-[120px]">
                              {transfer.destinationWarehouse?.location}
                            </div>
                          </div>
                        </TableCell>
                        <TableCell className="text-sm">
                          {utils.formatDateTime(transfer.transferDate || transfer.createdAt)}
                        </TableCell>
                        <TableCell>
                          <StatusBadge status={transfer.status} />
                        </TableCell>
                        <TableCell>
                          <div className="flex gap-2">
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={() => openTransferDetails(transfer)}
                              className="gap-2"
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
                            {transfer.status === "pending" && (
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => openApproveDialog(transfer)}
                                className="gap-2 text-green-600 border-green-200 hover:bg-green-50"
                              >
                                <Check className="h-4 w-4" />
                                Approve
                              </Button>
                            )}
                          </div>
                        </TableCell>
                      </TableRow>
                    ))
                  )}
                </TableBody>
              </Table>

              {/* Pagination */}
              {totalTransferPages > 1 && (
                <div className="flex flex-col sm:flex-row justify-between items-center gap-4 p-4 border-t">
                  <div className="text-sm text-gray-600">
                    Page {currentTransferPage} of {totalTransferPages} • {filteredTransfers.length} total transfers
                  </div>
                  <div className="flex items-center gap-2">
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTransferPage(currentTransferPage - 1)}
                      disabled={currentTransferPage === 1}
                    >
                      <ChevronLeft className="h-4 w-4" />
                      Previous
                    </Button>

                    <div className="flex gap-1">
                      {Array.from({ length: totalTransferPages }, (_, i) => i + 1)
                        .slice(
                          Math.max(0, currentTransferPage - 3),
                          Math.min(totalTransferPages, currentTransferPage + 2)
                        )
                        .map((page) => (
                          <Button
                            key={page}
                            variant={currentTransferPage === page ? "default" : "outline"}
                            size="sm"
                            onClick={() => setCurrentTransferPage(page)}
                          >
                            {page}
                          </Button>
                        ))}
                    </div>

                    <Button
                      variant="outline"
                      size="sm"
                      onClick={() => setCurrentTransferPage(currentTransferPage + 1)}
                      disabled={currentTransferPage === totalTransferPages}
                    >
                      Next
                      <ChevronRight className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Item Selection Modal */}
      <ItemSelectionModal
        showItemSelection={showItemSelection}
        setShowItemSelection={setShowItemSelection}
        selectedProductIndex={selectedProductIndex}
        selectedProducts={selectedProducts}
        itemSearchTerm={itemSearchTerm}
        setItemSearchTerm={setItemSearchTerm}
        randomQtyInput={randomQtyInput}
        setRandomQtyInput={setRandomQtyInput}
        getDynamicFieldsFromItems={getDynamicFieldsFromItems}
        getFilteredItems={getFilteredItems}
        handleSelectAllFilteredItems={handleSelectAllFilteredItems}
        handleClearFilteredSelection={handleClearFilteredSelection}
        handleClearSelection={handleClearSelection}
        handleSelectRandomItems={handleSelectRandomItems}
        handleSelectUniqueItems={handleSelectUniqueItems}
        closeItemSelection={closeItemSelection}
      />

      {/* Transfer Details Modal */}
      <Dialog open={showTransferDetails} onOpenChange={setShowTransferDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
          </DialogHeader>
          {selectedTransfer && (
            <div className="space-y-4">
              <Card>
                <CardContent className="space-y-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div>
                      <h3 className="font-semibold mb-2">Transfer Information</h3>
                      <div className="space-y-2">
                        <div className="flex justify-between">
                          <span className="text-gray-600">Transfer ID:</span>
                          <span className="font-medium">{selectedTransfer.id}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Status:</span>
                          <StatusBadge status={selectedTransfer.status} />
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Product:</span>
                          <span className="font-medium">{selectedTransfer.productName}</span>
                        </div>
                        <div className="flex justify-between">
                          <span className="text-gray-600">Quantity:</span>
                          <span className="font-medium">{selectedTransfer.quantity} units</span>
                        </div>
                      </div>
                    </div>
                    <div>
                      <h3 className="font-semibold mb-2">Warehouse Details</h3>
                      <div className="space-y-2">
                        <div className="flex items-center gap-2">
                          <ArrowLeft className="h-4 w-4 text-red-500" />
                          <span className="font-medium">From: {selectedTransfer.sourceWarehouse?.name}</span>
                        </div>
                        <div className="flex items-center gap-2">
                          <ArrowRight className="h-4 w-4 text-green-500" />
                          <span className="font-medium">To: {selectedTransfer.destinationWarehouse?.name}</span>
                        </div>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* Approval Dialog */}
      <AlertDialog open={showApproveDialog} onOpenChange={setShowApproveDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Approve Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>Are you sure you want to approve this transfer?</p>
                {transferToApprove && (
                  <div className="border rounded-lg p-3">
                    <div className="space-y-1">
                      <div className="flex justify-between">
                        <span className="text-gray-600">Product:</span>
                        <span className="font-medium">{transferToApprove.productName}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Quantity:</span>
                        <span className="font-medium">{transferToApprove.quantity} units</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">₹{(transferToApprove.quantity * (transferToApprove.rate || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter className="flex flex-col sm:flex-row gap-2">
            <AlertDialogCancel disabled={isProcessingApproval}>Cancel</AlertDialogCancel>
            <Button
              variant="outline"
              onClick={() => handleRejectTransfer(transferToApprove?.id)}
              disabled={isProcessingApproval}
              className="text-red-600 border-red-200 hover:bg-red-50"
            >
              {isProcessingApproval ? "Processing..." : "Reject"}
            </Button>
            <AlertDialogAction
              onClick={() => handleApproveTransfer(transferToApprove?.id)}
              disabled={isProcessingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingApproval ? "Processing..." : "Approve"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Transfer Request</AlertDialogTitle>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTransfer}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Processing..." : "Create Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}