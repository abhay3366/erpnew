// app/stock/transferred-item/page.js
"use client";

import { useState, useEffect, useMemo } from "react";
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
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { 
  Package, 
  Plus, 
  Search, 
  X, 
  Filter, 
  ChevronLeft, 
  ChevronRight,
  Calendar,
  Download,
  Eye
} from "lucide-react";

export default function StockTransferPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);
  
  // Search & Filter states for products
  const [productSearch, setProductSearch] = useState("");
  const [productFilter, setProductFilter] = useState("all");
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const productsPerPage = 8;
  
  // Search & Filter states for transfers
  const [transferSearch, setTransferSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentTransferPage, setCurrentTransferPage] = useState(1);
  const transfersPerPage = 10;

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

  const { fields, append, remove } = useFieldArray({
    control,
    name: "items",
  });

  // Watch form values
  const sourceWarehouse = watch("sourceWarehouse");
  const destinationWarehouse = watch("destinationWarehouse");
  const watchedItems = watch("items");

  // Fetch data on component mount
  useEffect(() => {
    const fetchData = async () => {
      try {
        const [
          warehousesRes,
          productsRes,
          stocksRes,
          transfersRes,
        ] = await Promise.all([
          fetch("http://localhost:5001/warehouses"),
          fetch("http://localhost:5001/products"),
          fetch("http://localhost:5001/stocks"),
          fetch("http://localhost:5001/transfers"),
        ]);

        setWarehouses(await warehousesRes.json());
        
        // Filter only NON_UNIQUE products
        const productsData = await productsRes.json();
        const nonUniqueProducts = productsData.filter(
          (product) => product.identifierType === "NON_UNIQUE"
        );
        setProducts(nonUniqueProducts);
        
        setStocks(await stocksRes.json());
        setTransfers(await transfersRes.json());
      } catch (error) {
        toast.error("Failed to load data");
        console.error("Error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchData();
  }, []);

  // Get warehouse name
  const getWarehouseName = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.fromWarehouse : "Unknown";
  };

  // Get warehouse location
  const getWarehouseLocation = (warehouseId) => {
    const warehouse = warehouses.find(w => w.id === warehouseId);
    return warehouse ? warehouse.warehouseLocation : "";
  };

  // Fetch available products when source warehouse changes
  useEffect(() => {
    if (!sourceWarehouse) {
      setAvailableProducts([]);
      setSelectedProducts([]);
      return;
    }

    const fetchProductsInWarehouse = () => {
      const warehouseStocks = stocks.filter(
        stock => stock.warehouseId === sourceWarehouse
      );

      const productsMap = new Map();
      
      warehouseStocks.forEach(stock => {
        stock.products.forEach(product => {
          const productInfo = products.find(p => p.id === product.productId);
          if (productInfo) {
            if (productsMap.has(product.productId)) {
              const existing = productsMap.get(product.productId);
              existing.availableQty += product.quantity;
            } else {
              productsMap.set(product.productId, {
                ...productInfo,
                availableQty: product.quantity,
                rate: product.rate || 0
              });
            }
          }
        });
      });

      const availableProds = Array.from(productsMap.values());
      setAvailableProducts(availableProds);
      
      // Filter selected products that are still available
      const filteredSelected = selectedProducts.filter(sp => 
        availableProds.some(ap => ap.id === sp.productId)
      );
      setSelectedProducts(filteredSelected);
      
      // Update form items
      setValue("items", filteredSelected.map(sp => ({
        productId: sp.productId,
        productName: sp.productName || sp.name,
        availableQty: sp.availableQty,
        transferQty: sp.transferQty || 0,
        rate: sp.rate || 0
      })));
    };

    fetchProductsInWarehouse();
  }, [sourceWarehouse, stocks, products, setValue]);

  // Filter products based on search and filter
  const filteredProducts = useMemo(() => {
    return availableProducts.filter(product => {
      // Search filter
      if (productSearch) {
        const searchLower = productSearch.toLowerCase();
        const matchesSearch = 
          (product.productName || product.name || "").toLowerCase().includes(searchLower) ||
          (product.sku || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Type filter
      if (productFilter === "inStock" && product.availableQty <= 0) return false;
      if (productFilter === "outOfStock" && product.availableQty > 0) return false;
      
      return true;
    });
  }, [availableProducts, productSearch, productFilter]);

  // Paginate products
  const paginatedProducts = useMemo(() => {
    const startIndex = (currentProductPage - 1) * productsPerPage;
    return filteredProducts.slice(startIndex, startIndex + productsPerPage);
  }, [filteredProducts, currentProductPage]);

  const totalProductPages = Math.ceil(filteredProducts.length / productsPerPage);

  // Filter transfers based on search and filters
  const filteredTransfers = useMemo(() => {
    return transfers.filter(transfer => {
      // Search filter
      if (transferSearch) {
        const searchLower = transferSearch.toLowerCase();
        const matchesSearch = 
          (transfer.productName || "").toLowerCase().includes(searchLower) ||
          (transfer.productId || "").toLowerCase().includes(searchLower) ||
          (transfer.id || "").toLowerCase().includes(searchLower);
        if (!matchesSearch) return false;
      }
      
      // Status filter
      if (statusFilter !== "all" && transfer.status !== statusFilter) return false;
      
      // Date filter
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

  // Handle product selection from ProductTable
  const handleProductSelect = (product) => {
    // Check if product is already selected
    if (selectedProducts.some(sp => sp.productId === product.id)) {
      toast.warning("Product already added to transfer");
      return;
    }

    // Find product with stock info
    const productWithStock = availableProducts.find(p => p.id === product.id);
    if (!productWithStock) {
      toast.error("Product not available in selected warehouse");
      return;
    }

    const newProduct = {
      productId: product.id,
      productName: product.productName || product.name,
      availableQty: productWithStock.availableQty,
      transferQty: 0,
      rate: productWithStock.rate || 0,
      sku: product.sku || "",
      unit: product.unit || "pieces"
    };

    setSelectedProducts([...selectedProducts, newProduct]);
    append(newProduct);
  };

  // Update transfer quantity
  const handleQuantityChange = (index, value) => {
    const items = [...selectedProducts];
    const newQty = Math.max(0, Math.min(value, items[index].availableQty));
    items[index].transferQty = newQty;
    setSelectedProducts(items);
    
    setValue(`items.${index}.transferQty`, newQty);
  };

  // Update rate
  const handleRateChange = (index, value) => {
    const items = [...selectedProducts];
    items[index].rate = Math.max(0, parseFloat(value) || 0);
    setSelectedProducts(items);
    
    setValue(`items.${index}.rate`, items[index].rate);
  };

  // Remove product from transfer
  const handleRemoveProduct = (index) => {
    const newSelectedProducts = selectedProducts.filter((_, i) => i !== index);
    setSelectedProducts(newSelectedProducts);
    remove(index);
  };

  // Get product name
  const getProductName = (productId) => {
    const product = products.find(p => p.id === productId);
    return product ? product.productName : "";
  };

  // Validate form
  const validateForm = (data) => {
    // Check if warehouses are different
    if (data.sourceWarehouse === data.destinationWarehouse) {
      toast.error("Source and Destination warehouses must be different");
      return false;
    }

    // Validate items
    const transferItems = data.items.filter(item => item.transferQty > 0);
    if (transferItems.length === 0) {
      toast.error("Please add at least one item with transfer quantity");
      return false;
    }

    // Check each item quantity
    for (const item of transferItems) {
      if (item.transferQty > item.availableQty) {
        toast.error(`"${item.productName}" cannot transfer more than available quantity`);
        return false;
      }
    }

    return true;
  };

  // Handle form submission
  const onSubmit = async (data) => {
    if (!validateForm(data)) return;

    setShowConfirmDialog(true);
  };

  // Confirm and process transfer
  const confirmTransfer = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const formData = getValues();
    const transferItems = formData.items.filter(item => item.transferQty > 0);
    
    try {
      // Generate transfer ID
      const transferId = `T${Date.now()}`;

      // Process each item
      for (const [index, item] of transferItems.entries()) {
        const sourceWarehouseName = getWarehouseName(formData.sourceWarehouse);
        const sourceLocation = getWarehouseLocation(formData.sourceWarehouse);
        const destinationWarehouseName = getWarehouseName(formData.destinationWarehouse);
        const destinationLocation = getWarehouseLocation(formData.destinationWarehouse);
        
        // 1. Create transfer record
        const transferData = {
          id: `${transferId}-${index}`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.transferQty,
          sourceWarehouse: {
            id: formData.sourceWarehouse,
            name: sourceWarehouseName,
            location: sourceLocation
          },
          destinationWarehouse: {
            id: formData.destinationWarehouse,
            name: destinationWarehouseName,
            location: destinationLocation
          },
          transferDate: new Date().toISOString(),
          status: "completed",
          type: "OUT",
          remarks: formData.remarks,
          rate: item.rate,
          sku: item.sku,
          unit: item.unit
        };

        // POST to transfers
        await fetch("http://localhost:5001/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transferData),
        });

        // 2. Create stock movements
        // OUT movement
        const outMovement = {
          id: `SM${Date.now()}-OUT-${index}`,
          productId: item.productId,
          productName: item.productName,
          quantity: -item.transferQty, // Negative for OUT
          movementType: "TRANSFER_OUT",
          transferId: transferData.id,
          date: new Date().toISOString(),
          warehouseId: formData.sourceWarehouse,
          warehouseName: sourceWarehouseName,
          rate: item.rate,
          remarks: formData.remarks,
          balance: 0
        };

        // IN movement
        const inMovement = {
          id: `SM${Date.now()}-IN-${index}`,
          productId: item.productId,
          productName: item.productName,
          quantity: item.transferQty, // Positive for IN
          movementType: "TRANSFER_IN",
          transferId: transferData.id,
          date: new Date().toISOString(),
          warehouseId: formData.destinationWarehouse,
          warehouseName: destinationWarehouseName,
          rate: item.rate,
          remarks: formData.remarks,
          balance: 0
        };

        // Post both movements
        await Promise.all([
          fetch("http://localhost:5001/stock-ledger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(outMovement),
          }),
          fetch("http://localhost:5001/stock-ledger", {
            method: "POST",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(inMovement),
          }),
        ]);
      }

      // Success
      toast.success("Stock transfer completed successfully!");
      
      // Refresh transfers list
      const transfersRes = await fetch("http://localhost:5001/transfers");
      setTransfers(await transfersRes.json());
      
      // Reset form and close dialog
      resetForm();
      setShowTransferForm(false);
      
    } catch (error) {
      console.error("Transfer error:", error);
      toast.error("Failed to complete transfer");
    } finally {
      setIsSubmitting(false);
    }
  };

  // Reset form
  const resetForm = () => {
    reset({
      transferDate: new Date().toISOString().split("T")[0],
      sourceWarehouse: "",
      destinationWarehouse: "",
      remarks: "",
      items: [],
    });
    setSelectedProducts([]);
    setAvailableProducts([]);
    setProductSearch("");
    setProductFilter("all");
    setCurrentProductPage(1);
  };

  // Calculate total transfer value
  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      return total + (item.transferQty * (item.rate || 0));
    }, 0).toFixed(2);
  };

  // Format date
  const formatDate = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric'
    });
  };

  // Format date with time
  const formatDateTime = (dateString) => {
    return new Date(dateString).toLocaleDateString('en-IN', {
      day: '2-digit',
      month: 'short',
      year: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  // Handle page change
  const handleProductPageChange = (page) => {
    setCurrentProductPage(page);
  };

  const handleTransferPageChange = (page) => {
    setCurrentTransferPage(page);
  };

  // Reset filters
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
    <div className="container mx-auto p-4 md:p-6">
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-6">
        <div>
          <h1 className="text-2xl md:text-3xl font-bold text-gray-900">Stock Transfer</h1>
          <p className="text-gray-600 text-sm md:text-base">Manage stock transfers between warehouses</p>
        </div>
        
        <Dialog open={showTransferForm} onOpenChange={setShowTransferForm}>
          <DialogTrigger asChild>
            <Button className="gap-2">
              <Plus className="h-4 w-4" />
              Transfer Items
            </Button>
          </DialogTrigger>
          <DialogContent className="max-w-6xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Stock Item Transfer</DialogTitle>
              <DialogDescription>
                Transfer stock items between warehouses
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleSubmit(onSubmit)}>
              <div className="space-y-6 py-4">
                {/* Transfer Details */}
                <Card>
                  <CardHeader className="pb-3">
                    <CardTitle className="text-lg">Transfer Details</CardTitle>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            setSelectedProducts([]);
                          }}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select source warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses.map((warehouse) => (
                              <SelectItem key={warehouse.id} value={warehouse.id}>
                                <div className="flex flex-col">
                                  <span>{warehouse.fromWarehouse}</span>
                                  <span className="text-xs text-gray-500">
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
                          onValueChange={(value) => {
                            setValue("destinationWarehouse", value);
                          }}
                          disabled={!sourceWarehouse}
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select destination warehouse" />
                          </SelectTrigger>
                          <SelectContent>
                            {warehouses
                              .filter(warehouse => warehouse.id !== sourceWarehouse)
                              .map((warehouse) => (
                                <SelectItem key={warehouse.id} value={warehouse.id}>
                                  <div className="flex flex-col">
                                    <span>{warehouse.fromWarehouse}</span>
                                    <span className="text-xs text-gray-500">
                                      {warehouse.warehouseLocation}
                                    </span>
                                  </div>
                                </SelectItem>
                              ))}
                          </SelectContent>
                        </Select>
                      </div>

                      {/* Remarks */}
                      <div className="md:col-span-2 space-y-2">
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

                          {/* Filter Dropdown */}
                          <Select
                            value={productFilter}
                            onValueChange={(value) => {
                              setProductFilter(value);
                              setCurrentProductPage(1);
                            }}
                          >
                            <SelectTrigger className="w-full sm:w-[180px]">
                              <Filter className="h-4 w-4 mr-2" />
                              <SelectValue placeholder="Filter by stock" />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="all">All Products</SelectItem>
                              <SelectItem value="inStock">In Stock Only</SelectItem>
                              <SelectItem value="outOfStock">Out of Stock</SelectItem>
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
                            {productSearch || productFilter !== "all" 
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
                                onClick={() => handleProductPageChange(currentProductPage - 1)}
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
                                      onClick={() => handleProductPageChange(page)}
                                    >
                                      {page}
                                    </Button>
                                  ))}
                              </div>
                              
                              <Button
                                variant="outline"
                                size="sm"
                                onClick={() => handleProductPageChange(currentProductPage + 1)}
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
                            setValue("items", []);
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
                              <TableHead className="text-center">Available</TableHead>
                              <TableHead className="text-center">Transfer Qty</TableHead>
                              <TableHead className="text-center">Rate (₹)</TableHead>
                              <TableHead className="text-center">Value (₹)</TableHead>
                              <TableHead className="text-center">Action</TableHead>
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {selectedProducts.map((item, index) => (
                              <TableRow key={item.productId}>
                                <TableCell>
                                  <div className="flex items-center gap-3">
                                    <div className="h-8 w-8 rounded bg-blue-100 flex items-center justify-center">
                                      <Package className="h-4 w-4 text-blue-600" />
                                    </div>
                                    <div>
                                      <div className="font-medium">{item.productName}</div>
                                      <div className="text-xs text-gray-500">
                                        SKU: {item.sku} • ID: {item.productId}
                                      </div>
                                    </div>
                                  </div>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Badge variant="outline">{item.availableQty}</Badge>
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    min="0"
                                    max={item.availableQty}
                                    value={item.transferQty}
                                    onChange={(e) => handleQuantityChange(index, parseInt(e.target.value) || 0)}
                                    className="w-24 mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center">
                                  <Input
                                    type="number"
                                    step="0.01"
                                    min="0"
                                    value={item.rate}
                                    onChange={(e) => handleRateChange(index, parseFloat(e.target.value) || 0)}
                                    className="w-24 mx-auto"
                                  />
                                </TableCell>
                                <TableCell className="text-center font-medium">
                                  ₹{(item.transferQty * item.rate).toFixed(2)}
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
                      "Submit Transfer"
                    )}
                  </Button>
                </div>
              </div>
            </form>
          </DialogContent>
        </Dialog>
      </div>

      {/* Transfer History with Filters */}
      <Tabs defaultValue="all" className="w-full">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-4">
          <TabsList>
            <TabsTrigger value="all">All Transfers</TabsTrigger>
            <TabsTrigger value="completed">Completed</TabsTrigger>
            <TabsTrigger value="pending">Pending</TabsTrigger>
          </TabsList>
          
          <div className="flex flex-col sm:flex-row gap-3 w-full md:w-auto">
            {/* Search Bar */}
            <div className="relative flex-1 md:flex-initial md:w-64">
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
                <SelectItem value="completed">Completed</SelectItem>
                <SelectItem value="pending">Pending</SelectItem>
                <SelectItem value="cancelled">Cancelled</SelectItem>
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
            {(transferSearch || statusFilter !== "all" || dateFilter) && (
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
        
        <TabsContent value="all" className="space-y-4">
          <Card>
            <CardHeader>
              <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                <CardTitle>Transfer History</CardTitle>
                <div className="flex items-center gap-2 text-sm text-gray-600">
                  <span>
                    Showing {paginatedTransfers.length} of {filteredTransfers.length} transfers
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    className="gap-2"
                    onClick={() => {
                      // Export functionality would go here
                      toast.info("Export functionality coming soon");
                    }}
                  >
                    <Download className="h-4 w-4" />
                    Export
                  </Button>
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
                        <TableCell colSpan={8} className="text-center py-8 text-gray-500">
                          <Package className="h-12 w-12 mx-auto mb-4 text-gray-300" />
                          <p className="mb-2">No transfer records found</p>
                          {transferSearch || statusFilter !== "all" || dateFilter ? (
                            <p className="text-sm">Try changing your filters</p>
                          ) : null}
                        </TableCell>
                      </TableRow>
                    ) : (
                      paginatedTransfers.map((transfer) => (
                        <TableRow key={transfer.id}>
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
                            <Badge variant="outline" className="font-medium">
                              {transfer.quantity} units
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{transfer.sourceWarehouse?.name}</div>
                              <div className="text-xs text-gray-500">
                                {transfer.sourceWarehouse?.location}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">
                              <div className="font-medium">{transfer.destinationWarehouse?.name}</div>
                              <div className="text-xs text-gray-500">
                                {transfer.destinationWarehouse?.location}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="text-sm">
                            {formatDateTime(transfer.transferDate)}
                          </TableCell>
                          <TableCell>
                            <Badge 
                              className={
                                transfer.status === 'completed' 
                                  ? 'bg-green-100 text-green-800 hover:bg-green-100' 
                                  : transfer.status === 'pending'
                                  ? 'bg-yellow-100 text-yellow-800 hover:bg-yellow-100'
                                  : 'bg-red-100 text-red-800 hover:bg-red-100'
                              }
                            >
                              {transfer.status}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <Button
                              variant="ghost"
                              size="sm"
                              className="gap-2"
                              onClick={() => {
                                // View details functionality
                                toast.info(`Viewing transfer ${transfer.id}`);
                              }}
                            >
                              <Eye className="h-4 w-4" />
                              View
                            </Button>
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
                        onClick={() => handleTransferPageChange(currentTransferPage - 1)}
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
                              onClick={() => handleTransferPageChange(page)}
                            >
                              {page}
                            </Button>
                          ))}
                      </div>
                      
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleTransferPageChange(currentTransferPage + 1)}
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
        </TabsContent>
      </Tabs>

      {/* Confirmation Dialog */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Confirm Stock Transfer</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>This will transfer the following items:</p>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {selectedProducts
                    .filter(item => item.transferQty > 0)
                    .map((item, index) => (
                      <div key={item.productId} className="flex justify-between items-center py-2 text-sm border-b last:border-0">
                        <div className="flex-1">
                          <span className="font-medium">{item.productName}</span>
                          <div className="text-xs text-gray-500">
                            SKU: {item.sku} • Available: {item.availableQty}
                          </div>
                        </div>
                        <span className="font-medium ml-4">
                          {item.transferQty} × ₹{item.rate} = ₹{(item.transferQty * item.rate).toFixed(2)}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Quantity:</span>
                    <span>{selectedProducts.reduce((sum, item) => sum + item.transferQty, 0)} units</span>
                  </div>
                  <div className="flex justify-between font-medium">
                    <span>Total Value:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
              </div>
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel disabled={isSubmitting}>Cancel</AlertDialogCancel>
            <AlertDialogAction
              onClick={confirmTransfer}
              disabled={isSubmitting}
              className="bg-blue-600 hover:bg-blue-700"
            >
              {isSubmitting ? "Processing..." : "Confirm Transfer"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}