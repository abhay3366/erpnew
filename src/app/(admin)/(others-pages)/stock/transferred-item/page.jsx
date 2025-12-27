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
  FileText,
  ArrowRight,
  ArrowLeft,
  Info,
  Check,
  Clock,
  XCircle,
  AlertCircle
} from "lucide-react";

export default function StockTransferPage() {
  const [warehouses, setWarehouses] = useState([]);
  const [products, setProducts] = useState([]);
  const [stocks, setStocks] = useState([]);
  const [transfers, setTransfers] = useState([]);
  const [fieldMasters, setFieldMasters] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [showConfirmDialog, setShowConfirmDialog] = useState(false);
  const [showTransferForm, setShowTransferForm] = useState(false);
  const [availableProducts, setAvailableProducts] = useState([]);
  const [selectedProducts, setSelectedProducts] = useState([]);

  // Search & Filter states for products
  const [productSearch, setProductSearch] = useState("");
  const [productTypeFilter, setProductTypeFilter] = useState("all");
  const [currentProductPage, setCurrentProductPage] = useState(1);
  const productsPerPage = 8;

  // Search & Filter states for transfers
  const [transferSearch, setTransferSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [dateFilter, setDateFilter] = useState("");
  const [currentTransferPage, setCurrentTransferPage] = useState(1);
  const transfersPerPage = 10;

  // Item selection modal states
  const [showItemSelection, setShowItemSelection] = useState(false);
  const [selectedProductIndex, setSelectedProductIndex] = useState(null);
  const [randomQtyInput, setRandomQtyInput] = useState("");
  const [itemSearchTerm, setItemSearchTerm] = useState("");

  // Transfer Details Modal state
  const [showTransferDetails, setShowTransferDetails] = useState(false);
  const [selectedTransfer, setSelectedTransfer] = useState(null);

  // NEW: Approval Dialog state
  const [showApproveDialog, setShowApproveDialog] = useState(false);
  const [transferToApprove, setTransferToApprove] = useState(null);
  const [isProcessingApproval, setIsProcessingApproval] = useState(false);

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

  // Get dynamic fields for a product
  const getProductDynamicFields = (productId) => {
    const product = products.find(p => p.id === productId);
    if (!product || !product.selectedFieldIds || !Array.isArray(product.selectedFieldIds)) {
      return [];
    }

    return fieldMasters.filter(field =>
      product.selectedFieldIds.includes(field.id)
    );
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
        if (stock.products && Array.isArray(stock.products)) {
          stock.products.forEach(stockProduct => {
            const productInfo = products.find(p => p.id === stockProduct.productId);

            // If product not found in products API, create from stock
            const productData = productInfo || {
              id: stockProduct.productId,
              productName: stockProduct.productName || "Unknown Product",
              identifierType: stockProduct.identifierType,
              unit: "pieces",
              sku: stockProduct.productId,
              isActive: true
            };

            // Get dynamic field values from stock
            const dynamicValues = stockProduct.dynamicValues || {};

            // For UNIQUE products, get items details
            const items = stockProduct.items || [];

            if (productsMap.has(stockProduct.productId)) {
              const existing = productsMap.get(stockProduct.productId);
              existing.availableQty += stockProduct.quantity || 0;

              // Merge items for UNIQUE products
              if (stockProduct.identifierType === "UNIQUE") {
                existing.items = [...(existing.items || []), ...items];
              }

              // Merge dynamic values
              existing.dynamicValues = { ...existing.dynamicValues, ...dynamicValues };
            } else {
              const dynamicFields = getProductDynamicFields(stockProduct.productId);

              productsMap.set(stockProduct.productId, {
                ...productData,
                identifierType: stockProduct.identifierType || productData.identifierType,
                availableQty: stockProduct.quantity || 0,
                rate: stockProduct.rate || 0,
                unit: productData.unit || "pieces",
                sku: productData.sku || stockProduct.productId,
                dynamicFields: dynamicFields,
                dynamicValues: dynamicValues,
                items: stockProduct.identifierType === "UNIQUE" ? items : [],
                hasSerialNo: items.some(item => item.serialno),
                hasMacAddress: items.some(item => item.macaddress),
                hasWarranty: items.some(item => item.warrenty || dynamicValues.warranty),
                fromStock: !productInfo
              });
            }
          });
        }
      });

      const availableProds = Array.from(productsMap.values());
      setAvailableProducts(availableProds);

      // Filter selected products that are still available
      const filteredSelected = selectedProducts.filter(sp =>
        availableProds.some(ap => ap.id === sp.productId)
      );

      // Update selected products with current data
      const updatedSelected = filteredSelected.map(sp => {
        const currentProduct = availableProds.find(ap => ap.id === sp.productId);
        if (currentProduct) {
          return {
            ...sp,
            availableQty: currentProduct.availableQty,
            identifierType: currentProduct.identifierType,
            items: currentProduct.items || [],
            dynamicValues: currentProduct.dynamicValues || {},
            dynamicFields: currentProduct.dynamicFields || []
          };
        }
        return sp;
      });

      setSelectedProducts(updatedSelected);

      // Update form items
      setValue("items", updatedSelected.map(sp => ({
        productId: sp.productId,
        productName: sp.productName || sp.name,
        availableQty: sp.availableQty,
        transferQty: sp.transferQty || 0,
        rate: sp.rate || 0,
        sku: sp.sku || "",
        unit: sp.unit || "pieces",
        identifierType: sp.identifierType,
        items: sp.items || [],
        dynamicValues: sp.dynamicValues || {}
      })));
    };

    fetchProductsInWarehouse();
  }, [sourceWarehouse, stocks, products, fieldMasters, setValue]);

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

      // Product type filter
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

  // NEW: Get unique dynamic fields from ALL items for the selected product
  const getDynamicFieldsFromItems = (productIndex) => {
    if (selectedProductIndex === null) return [];
    const product = selectedProducts[selectedProductIndex];
    if (!product || !product.items || product.items.length === 0) return [];
    
    // Get all fields that have at least one non-empty value
    const fieldMap = new Map();
    
    product.items.forEach(item => {
      Object.entries(item).forEach(([key, value]) => {
        if (key !== 'id' && value && String(value).trim() !== '') {
          if (!fieldMap.has(key)) {
            fieldMap.set(key, {
              key,
              hasData: true,
              // Check field type for formatting
              isSerial: key.toLowerCase().includes('serial'),
              isMac: key.toLowerCase().includes('mac'),
              isWarranty: key.toLowerCase().includes('warranty') || key.toLowerCase().includes('warrenty')
            });
          }
        }
      });
    });
    
    return Array.from(fieldMap.values());
  };

  // NEW: Filter items based on search term
  const getFilteredItems = () => {
    if (selectedProductIndex === null) return [];
    const product = selectedProducts[selectedProductIndex];
    if (!product || !product.items) return [];
    
    if (!itemSearchTerm) return product.items;
    
    const searchLower = itemSearchTerm.toLowerCase();
    return product.items.filter(item => {
      // Search in all item properties
      return Object.entries(item).some(([key, value]) => {
        if (key === 'id') return false;
        return String(value).toLowerCase().includes(searchLower);
      });
    });
  };

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
    append(newProduct);
  };

  // For UNIQUE products: Select specific items to transfer
  const handleSelectUniqueItems = (productIndex, selectedItemIds) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE") {
      // Update selected items
      const selectedItems = product.items.filter(item =>
        selectedItemIds.includes(item.id)
      );

      product.selectedItems = selectedItems;
      product.transferQty = selectedItems.length;

      setSelectedProducts(items);

      // Update form
      setValue(`items.${productIndex}.selectedItems`, selectedItems);
      setValue(`items.${productIndex}.transferQty`, selectedItems.length);
    }
  };

  // Select random items based on quantity
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
      // Filter items based on search if any
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

      // Shuffle filtered items and select random ones
      const shuffledItems = [...filteredItems].sort(() => 0.5 - Math.random());
      const selectedItems = shuffledItems.slice(0, qty);

      // Get all currently selected items (including those not in filtered list)
      const currentSelected = product.selectedItems || [];
      const newSelected = [...currentSelected, ...selectedItems];
      
      // Remove duplicates
      const uniqueSelected = Array.from(new Set(newSelected.map(item => item.id)))
        .map(id => newSelected.find(item => item.id === id));

      product.selectedItems = uniqueSelected;
      product.transferQty = uniqueSelected.length;

      setSelectedProducts(items);

      // Update form
      setValue(`items.${productIndex}.selectedItems`, uniqueSelected);
      setValue(`items.${productIndex}.transferQty`, uniqueSelected.length);

      toast.success(`Randomly selected ${selectedItems.length} items`);
      setRandomQtyInput("");
    }
  };

  // Select all filtered items
  const handleSelectAllFilteredItems = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE" && product.items.length > 0) {
      const filteredItems = getFilteredItems();
      
      if (filteredItems.length === 0) {
        toast.error("No items to select");
        return;
      }

      // Get current selected items
      const currentSelected = product.selectedItems || [];
      const newSelected = [...currentSelected, ...filteredItems];
      
      // Remove duplicates
      const uniqueSelected = Array.from(new Set(newSelected.map(item => item.id)))
        .map(id => newSelected.find(item => item.id === id));

      product.selectedItems = uniqueSelected;
      product.transferQty = uniqueSelected.length;

      setSelectedProducts(items);

      // Update form
      setValue(`items.${productIndex}.selectedItems`, uniqueSelected);
      setValue(`items.${productIndex}.transferQty`, uniqueSelected.length);

      toast.success(`Selected all ${filteredItems.length} matching items`);
    }
  };

  // Clear all selected items
  const handleClearSelection = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE") {
      product.selectedItems = [];
      product.transferQty = 0;

      setSelectedProducts(items);

      // Update form
      setValue(`items.${productIndex}.selectedItems`, []);
      setValue(`items.${productIndex}.transferQty`, 0);

      toast.success("Cleared selection");
    }
  };

  // Clear filtered selection only
  const handleClearFilteredSelection = (productIndex) => {
    const items = [...selectedProducts];
    const product = items[productIndex];

    if (product.identifierType === "UNIQUE") {
      const filteredItems = getFilteredItems();
      const filteredItemIds = filteredItems.map(item => item.id);
      
      // Remove only filtered items from selection
      const currentSelected = product.selectedItems || [];
      const newSelected = currentSelected.filter(item => !filteredItemIds.includes(item.id));

      product.selectedItems = newSelected;
      product.transferQty = newSelected.length;

      setSelectedProducts(items);

      // Update form
      setValue(`items.${productIndex}.selectedItems`, newSelected);
      setValue(`items.${productIndex}.transferQty`, newSelected.length);

      toast.success(`Cleared ${filteredItems.length} matching items from selection`);
    }
  };

  // Update transfer quantity for NON_UNIQUE products
  const handleQuantityChange = (index, value) => {
    const items = [...selectedProducts];
    const product = items[index];

    if (product.identifierType === "NON_UNIQUE") {
      const maxQty = product.availableQty || 0;
      const newQty = Math.max(0, Math.min(value, maxQty));
      product.transferQty = newQty;
      setSelectedProducts(items);

      setValue(`items.${index}.transferQty`, newQty);
    }
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

  // NEW: Open transfer details modal
  const openTransferDetails = (transfer) => {
    setSelectedTransfer(transfer);
    setShowTransferDetails(true);
  };

  // NEW: Open approve dialog
  const openApproveDialog = (transfer) => {
    setTransferToApprove(transfer);
    setShowApproveDialog(true);
  };

  // NEW: Handle transfer approval
  const handleApproveTransfer = async (transferId) => {
    setIsProcessingApproval(true);
    
    try {
      // Find the transfer
      const transfer = transfers.find(t => t.id === transferId);
      if (!transfer) {
        toast.error("Transfer not found");
        return;
      }

      console.log("✅ Approving transfer:", transferId);

      // 1. UPDATE SOURCE WAREHOUSE STOCK (Subtract) - Only when approved
      console.log("📉 Updating source warehouse stock...");
      await updateSourceWarehouseStock(transfer.sourceWarehouse.id, {
        productId: transfer.productId,
        identifierType: transfer.identifierType,
        transferQty: transfer.quantity,
        selectedItems: transfer.items || []
      });

      // 2. UPDATE/CREATE DESTINATION WAREHOUSE STOCK - Only when approved
      console.log("📈 Updating destination warehouse stock...");
      
      // Get original bill number
      const itemBillNo = getOriginalBillNo(transfer.sourceWarehouse.id, transfer.productId);
      
      // Get source product details
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
          rate: transfer.rate,
          selectedItems: transfer.items || [],
          dynamicValues: transfer.dynamicValues || {}
        },
        transfer.sourceWarehouse.id,
        itemBillNo,
        sourceProductDetails
      );

      // 3. Update transfer status to "completed"
      console.log("🔄 Updating transfer status to 'completed'...");
      const response = await fetch(`http://localhost:5001/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "completed" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transfer status");
      }

      // Refresh data
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

  // NEW: Handle transfer rejection
  const handleRejectTransfer = async (transferId) => {
    setIsProcessingApproval(true);
    
    try {
      console.log("❌ Rejecting transfer:", transferId);

      // Update transfer status to "rejected"
      const response = await fetch(`http://localhost:5001/transfers/${transferId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ status: "rejected" }),
      });

      if (!response.ok) {
        throw new Error("Failed to update transfer status");
      }

      // Refresh data
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

  // Validate form
  const validateForm = (data) => {
    // Check if warehouses are different
    if (data.sourceWarehouse === data.destinationWarehouse) {
      toast.error("Source and Destination warehouses must be different");
      return false;
    }

    // Validate items
    const transferItems = data.items.filter(item => {
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

    // Check each item quantity
    for (const item of data.items) {
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

  // Handle form submission
  const onSubmit = async (data) => {
    if (!validateForm(data)) return;

    setShowConfirmDialog(true);
  };

  // Get original bill number from source stock
  const getOriginalBillNo = (warehouseId, productId) => {
    const sourceStock = stocks.find(stock =>
      stock.warehouseId === warehouseId &&
      stock.products.some(p => p.productId === productId)
    );

    return sourceStock ? sourceStock.billNo : `TR-${Date.now()}`;
  };

  // Get ALL product details from source stock
  const getSourceProductDetails = (warehouseId, productId) => {
    const sourceStock = stocks.find(stock =>
      stock.warehouseId === warehouseId &&
      stock.products.some(p => p.productId === productId)
    );

    if (sourceStock) {
      const sourceProduct = sourceStock.products.find(p => p.productId === productId);
      return sourceProduct;
    }

    return null;
  };

  // Confirm and process transfer - NOW CREATES PENDING TRANSFER
  const confirmTransfer = async () => {
    setShowConfirmDialog(false);
    setIsSubmitting(true);

    const formData = getValues();
    const transferItems = formData.items.filter(item => {
      if (item.identifierType === "UNIQUE") {
        return item.selectedItems && item.selectedItems.length > 0;
      } else {
        return item.transferQty > 0;
      }
    });

    console.log("🎯 Creating transfer request...");
    console.log("Form Data:", formData);
    console.log("Transfer Items:", transferItems);

    try {
      // Generate transfer ID
      const transferId = `T${Date.now()}`;
      console.log("Generated Transfer ID:", transferId);

      // Process each item
      for (const [index, item] of transferItems.entries()) {
        console.log(`\n🔸 Creating transfer request for item ${index + 1}/${transferItems.length}: ${item.productName}`);

        const sourceWarehouseName = getWarehouseName(formData.sourceWarehouse);
        const sourceLocation = getWarehouseLocation(formData.sourceWarehouse);
        const destinationWarehouseName = getWarehouseName(formData.destinationWarehouse);
        const destinationLocation = getWarehouseLocation(formData.destinationWarehouse);

        console.log("Source Warehouse:", sourceWarehouseName);
        console.log("Destination Warehouse:", destinationWarehouseName);

        // Get source product details
        const sourceProductDetails = getSourceProductDetails(formData.sourceWarehouse, item.productId);
        console.log("Source Product Details:", sourceProductDetails);

        // Create transfer data with PENDING status
        const transferData = {
          id: `${transferId}-${index}`,
          productId: item.productId,
          productName: item.productName,
          sku: item.sku,
          unit: item.unit,
          quantity: item.identifierType === "UNIQUE" ? item.selectedItems?.length || 0 : item.transferQty,
          rate: item.rate,

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

          movements: [
            {
              type: "OUT",
              warehouseId: formData.sourceWarehouse,
              warehouseName: sourceWarehouseName,
              quantity: item.identifierType === "UNIQUE" ? -1 * (item.selectedItems?.length || 0) : -item.transferQty
            },
            {
              type: "IN",
              warehouseId: formData.destinationWarehouse,
              warehouseName: destinationWarehouseName,
              quantity: item.identifierType === "UNIQUE" ? item.selectedItems?.length || 0 : item.transferQty
            }
          ],

          identifierType: item.identifierType,
          dynamicValues: item.dynamicValues || {},
          status: "pending", // CHANGED: Now pending instead of completed
          remarks: formData.remarks,
          transferDate: new Date().toISOString(),
          createdAt: new Date().toISOString(),
          createdBy: "admin",
          // NEW: Add items array for UNIQUE products
          items: item.identifierType === "UNIQUE" ? item.selectedItems || [] : []
        };

        // Add items array for UNIQUE products
        if (item.identifierType === "UNIQUE") {
          transferData.items = item.selectedItems || [];
        }

        console.log("📝 Creating pending transfer record...");
        // POST to transfers
        const transferResponse = await fetch("http://localhost:5001/transfers", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(transferData),
        });

        if (!transferResponse.ok) {
          const errorText = await transferResponse.text();
          console.error("❌ Failed to create transfer:", errorText);
          throw new Error("Failed to create transfer record");
        }

        const createdTransfer = await transferResponse.json();
        console.log("✅ Transfer request created (pending):", createdTransfer);

        console.log(`✅ Item ${index + 1} transfer request created successfully`);
      }

      // Success - Transfer request created (not executed yet)
      console.log("🎉 All transfer requests created successfully!");
      toast.success("Transfer request created! Awaiting approval from destination warehouse.");

      // Wait a bit for data to sync
      setTimeout(async () => {
        // Refresh all data
        await refreshAllData();

        // Show success message with warehouse details
        const sourceName = getWarehouseName(formData.sourceWarehouse);
        const destName = getWarehouseName(formData.destinationWarehouse);

        toast.success(`Transfer request sent to ${destName}! Awaiting approval.`, {
          duration: 5000,
        });

        // Reset form and close dialog
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

  // Update source warehouse stock (Subtract) - Only when approved
  const updateSourceWarehouseStock = async (warehouseId, item) => {
    try {
      // Find existing stock in source warehouse
      const existingStocks = stocks.filter(stock =>
        stock.warehouseId === warehouseId &&
        stock.products.some(p => p.productId === item.productId)
      );

      if (existingStocks.length > 0) {
        // Update existing stock
        for (const stock of existingStocks) {
          const productIndex = stock.products.findIndex(p => p.productId === item.productId);

          if (productIndex !== -1) {
            if (item.identifierType === "NON_UNIQUE") {
              // Reduce quantity for NON_UNIQUE
              stock.products[productIndex].quantity -= item.transferQty;

              // If quantity becomes 0 or negative, remove product from stock
              if (stock.products[productIndex].quantity <= 0) {
                stock.products.splice(productIndex, 1);
              }
            } else if (item.identifierType === "UNIQUE") {
              // Remove selected items for UNIQUE
              const selectedItemIds = item.selectedItems?.map(si => si.id) || [];

              stock.products[productIndex].items = stock.products[productIndex].items.filter(
                stockItem => !selectedItemIds.includes(stockItem.id)
              );

              // Update quantity based on remaining items
              stock.products[productIndex].quantity = stock.products[productIndex].items.length;

              // If no items left, remove product from stock
              if (stock.products[productIndex].items.length === 0) {
                stock.products.splice(productIndex, 1);
              }
            }

            // Update total products count
            stock.totalProducts = stock.products.length;

            // Update stock in database
            const response = await fetch(`http://localhost:5001/stocks/${stock.id}`, {
              method: "PUT",
              headers: { "Content-Type": "application/json" },
              body: JSON.stringify(stock),
            });

            if (!response.ok) {
              throw new Error("Failed to update source stock");
            }
          }
        }
      }
    } catch (error) {
      console.error("Error updating source warehouse stock:", error);
      throw error;
    }
  };

  // Update destination warehouse stock - Only when approved
  const updateDestinationWarehouseStock = async (warehouseId, item, sourceWarehouseId, billNo, sourceProductDetails = null) => {
    try {
      console.log("🚀 Starting destination stock update...");
      console.log("Destination Warehouse ID:", warehouseId);
      console.log("Item:", item);
      console.log("Item Identifier Type:", item.identifierType);
      console.log("Source Warehouse ID:", sourceWarehouseId);
      console.log("Bill No:", billNo);

      // First, check ALL existing stocks in destination warehouse
      const existingDestinationStocks = stocks.filter(stock =>
        stock.warehouseId === warehouseId
      );

      console.log("Total stocks in destination:", existingDestinationStocks.length);

      // Check if there's already a stock with same product ID AND same identifierType
      const matchingStock = existingDestinationStocks.find(stock => {
        const productMatch = stock.products?.some(p =>
          p.productId === item.productId && p.identifierType === item.identifierType
        );
        return productMatch;
      });

      console.log("Found matching stock (same product + same identifierType):", matchingStock);

      if (matchingStock) {
        console.log("📦 Updating existing stock with same identifier type...");
        const productIndex = matchingStock.products.findIndex(p =>
          p.productId === item.productId && p.identifierType === item.identifierType
        );

        if (productIndex !== -1) {
          // Update existing product with same identifierType
          if (item.identifierType === "NON_UNIQUE") {
            matchingStock.products[productIndex].quantity += item.transferQty;
            console.log(`➕ Added ${item.transferQty} NON_UNIQUE quantity. New total: ${matchingStock.products[productIndex].quantity}`);
          } else if (item.identifierType === "UNIQUE") {
            const existingItems = matchingStock.products[productIndex].items || [];
            const newItems = item.selectedItems || [];
            matchingStock.products[productIndex].items = [...existingItems, ...newItems];
            matchingStock.products[productIndex].quantity = matchingStock.products[productIndex].items.length;
            console.log(`➕ Added ${newItems.length} UNIQUE items. New total: ${matchingStock.products[productIndex].quantity}`);
          }

          // Update the stock in database
          const response = await fetch(`http://localhost:5001/stocks/${matchingStock.id}`, {
            method: "PUT",
            headers: { "Content-Type": "application/json" },
            body: JSON.stringify(matchingStock),
          });

          if (!response.ok) {
            const errorText = await response.text();
            console.error("❌ Failed to update destination stock:", errorText);
            throw new Error(`Failed to update destination stock: ${response.statusText}`);
          }

          console.log("✅ Destination stock updated successfully");
          return;
        }
      }

      // If no matching stock with same identifierType found, create NEW stock
      console.log("🆕 No existing stock with same identifier type found. Creating new stock...");

      // Get source stock to copy details
      const sourceStock = stocks.find(stock =>
        stock.warehouseId === sourceWarehouseId &&
        stock.products?.some(p => p.productId === item.productId)
      );

      console.log("Source stock found:", sourceStock);

      let sourceProduct = null;
      if (sourceStock) {
        sourceProduct = sourceStock.products.find(p => p.productId === item.productId);
        console.log("Source product details:", sourceProduct);
      }

      // Use sourceProductDetails if provided
      if (!sourceProduct && sourceProductDetails) {
        sourceProduct = sourceProductDetails;
        console.log("Using provided source product details");
      }

      // Check if there's an existing stock entry we can add to (same vendor, same bill)
      const existingStockToUpdate = existingDestinationStocks.find(stock =>
        stock.vendorId === (sourceStock?.vendorId || "") &&
        stock.billNo === billNo
      );

      if (existingStockToUpdate) {
        console.log("📦 Found existing stock entry with same vendor/bill. Adding product...");
        
        // Add the product to existing stock
        if (item.identifierType === "NON_UNIQUE") {
          existingStockToUpdate.products.push({
            productId: item.productId,
            productName: item.productName,
            identifierType: item.identifierType,
            quantity: item.transferQty,
            rate: item.rate || sourceProduct?.rate || 0,
            gst: sourceProduct?.gst || "0%",
            quantityAlert: sourceProduct?.quantityAlert || 0,
            items: [],
            dynamicValues: item.dynamicValues || sourceProduct?.dynamicValues || {},
            createdAt: new Date().toISOString()
          });
          existingStockToUpdate.totalProducts = existingStockToUpdate.products.length;
          console.log(`📊 Added NON_UNIQUE product to existing stock: ${item.productName}, Qty: ${item.transferQty}`);
        } else if (item.identifierType === "UNIQUE") {
          existingStockToUpdate.products.push({
            productId: item.productId,
            productName: item.productName,
            identifierType: item.identifierType,
            quantity: item.selectedItems?.length || 0,
            rate: item.rate || sourceProduct?.rate || 0,
            gst: sourceProduct?.gst || "0%",
            items: item.selectedItems || [],
            dynamicValues: item.dynamicValues || sourceProduct?.dynamicValues || {},
            createdAt: new Date().toISOString()
          });
          existingStockToUpdate.totalProducts = existingStockToUpdate.products.length;
          console.log(`📊 Added UNIQUE product to existing stock: ${item.productName}, Items: ${item.selectedItems?.length || 0}`);
        }

        // Update the existing stock
        const response = await fetch(`http://localhost:5001/stocks/${existingStockToUpdate.id}`, {
          method: "PUT",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify(existingStockToUpdate),
        });

        if (!response.ok) {
          throw new Error(`Failed to update existing stock: ${response.statusText}`);
        }

        console.log("✅ Product added to existing stock successfully");
        return;
      }

      // If no suitable existing stock found, create brand new stock
      console.log("🆕 Creating brand new stock entry...");
      
      const stockId = `S${Date.now()}-${warehouseId}`;
      const newStock = {
        id: stockId,
        vendorId: sourceStock?.vendorId || "",
        vendorName: sourceStock?.vendorName || "Transfer Stock",
        warehouseId: warehouseId,
        warehouseName: getWarehouseName(warehouseId),
        purchaseDate: new Date().toISOString().split('T')[0],
        billNo: billNo,
        totalProducts: 1,
        products: [],
        createdAt: new Date().toISOString(),
        status: "active"
      };

      console.log("New stock object created:", newStock);

      // Add product based on identifier type
      if (item.identifierType === "NON_UNIQUE") {
        newStock.products.push({
          productId: item.productId,
          productName: item.productName,
          identifierType: item.identifierType,
          quantity: item.transferQty,
          rate: item.rate || sourceProduct?.rate || 0,
          gst: sourceProduct?.gst || "0%",
          quantityAlert: sourceProduct?.quantityAlert || 0,
          items: [],
          dynamicValues: item.dynamicValues || sourceProduct?.dynamicValues || {},
          createdAt: new Date().toISOString()
        });
        console.log(`📊 Added NON_UNIQUE product to new stock: ${item.productName}, Qty: ${item.transferQty}`);
      } else if (item.identifierType === "UNIQUE") {
        newStock.products.push({
          productId: item.productId,
          productName: item.productName,
          identifierType: item.identifierType,
          quantity: item.selectedItems?.length || 0,
          rate: item.rate || sourceProduct?.rate || 0,
          gst: sourceProduct?.gst || "0%",
          items: item.selectedItems || [],
          dynamicValues: item.dynamicValues || sourceProduct?.dynamicValues || {},
          createdAt: new Date().toISOString()
        });
        console.log(`📊 Added UNIQUE product to new stock: ${item.productName}, Items: ${item.selectedItems?.length || 0}`);
      }

      // Create new stock in database
      console.log("📤 Sending POST request to create new stock...");
      const response = await fetch("http://localhost:5001/stocks", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newStock),
      });

      if (!response.ok) {
        const errorText = await response.text();
        console.error("❌ Failed to create new stock:", errorText);
        throw new Error(`Failed to create new stock: ${response.statusText}`);
      }

      const createdStock = await response.json();
      console.log("✅ New stock created successfully:", createdStock);

      // Refresh stocks data
      await refreshAllData();

    } catch (error) {
      console.error("❌ Error updating destination warehouse stock:", error);
      throw error;
    }
  };

  // Refresh all data after transfer
  const refreshAllData = async () => {
    try {
      console.log("🔄 Refreshing all data...");

      const [stocksRes, transfersRes] = await Promise.all([
        fetch("http://localhost:5001/stocks"),
        fetch("http://localhost:5001/transfers"),
      ]);

      const stocksData = await stocksRes.json();
      const transfersData = await transfersRes.json();

      setStocks(stocksData);
      setTransfers(transfersData);

      console.log("✅ Data refreshed successfully");
      console.log("Total stocks:", stocksData.length);
      console.log("Total transfers:", transfersData.length);

    } catch (error) {
      console.error("❌ Error refreshing data:", error);
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
    setProductTypeFilter("all");
    setCurrentProductPage(1);
    setRandomQtyInput("");
    setItemSearchTerm("");
  };

  // Calculate total transfer value
  const calculateTotal = () => {
    return selectedProducts.reduce((total, item) => {
      const quantity = item.identifierType === "UNIQUE"
        ? (item.selectedItems?.length || 0)
        : (item.transferQty || 0);
      return total + (quantity * (item.rate || 0));
    }, 0).toFixed(2);
  };

  // Format date with time
  const formatDateTime = (dateString) => {
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
  };

  // Format date only
  const formatDateOnly = (dateString) => {
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

  // Open item selection
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

  // Reset item search
  const resetItemSearch = () => {
    setItemSearchTerm("");
  };

  // NEW: Get status badge color
  const getStatusBadge = (status) => {
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

            <form onSubmit={handleSubmit(onSubmit)}>
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
                            setSelectedProducts([]);
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
                          onValueChange={(value) => {
                            setValue("destinationWarehouse", value);
                          }}
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
                                      {/* Show dynamic fields */}
                                      {item.dynamicFields && item.dynamicFields.length > 0 && (
                                        <div className="flex flex-wrap gap-1 mt-1">
                                          {item.dynamicFields.map(field => (
                                            <Badge key={field.id} variant="outline" className="text-xs">
                                              {field.label}
                                            </Badge>
                                          ))}
                                        </div>
                                      )}
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
      </div>

      {/* Transfer History with Item Preview */}
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
                          {formatDateTime(transfer.transferDate || transfer.createdAt)}
                        </TableCell>
                        <TableCell>
                          {getStatusBadge(transfer.status)}
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
      </div>

      {/* Item Selection Modal for UNIQUE Products */}
      <Dialog open={showItemSelection} onOpenChange={setShowItemSelection}>
        <DialogContent className="min-w-[70%] min-h-[90vh] overflow-x-scroll">
          <DialogHeader>
            <DialogTitle>Select Items to Transfer</DialogTitle>
            <DialogDescription className="hidden">
            </DialogDescription>
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
                        onClick={resetItemSearch}
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
                            max={getFilteredItems().length || 0}
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
                        • Filtered: {getFilteredItems().length}
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
                            getFilteredItems().length > 0 &&
                            getFilteredItems().every(item =>
                              selectedProducts[selectedProductIndex]?.selectedItems?.some(
                                selected => selected.id === item.id
                              )
                            )
                          }
                          onChange={(e) => {
                            const filteredItems = getFilteredItems();
                            if (filteredItems.length === 0) return;
                            
                            const currentSelected = selectedProducts[selectedProductIndex]?.selectedItems || [];
                            const filteredItemIds = filteredItems.map(item => item.id);
                            
                            if (e.target.checked) {
                              // Select all filtered items
                              const newSelected = [...currentSelected, ...filteredItems];
                              // Remove duplicates
                              const uniqueSelected = Array.from(new Set(newSelected.map(item => item.id)))
                                .map(id => newSelected.find(item => item.id === id));
                              
                              handleSelectUniqueItems(
                                selectedProductIndex,
                                uniqueSelected.map(item => item.id)
                              );
                            } else {
                              // Deselect all filtered items
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
                      {/* Dynamic Table Headers based on ACTUAL data in items */}
                      {(() => {
                        const dynamicFields = getDynamicFieldsFromItems(selectedProductIndex);
                        
                        // Sort fields: serialno/macaddress first, then warranty, then others
                        return dynamicFields
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
                          ));
                      })()}
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {getFilteredItems().length === 0 ? (
                      <TableRow>
                        <TableCell colSpan={10} className="text-center py-8 text-gray-500">
                          <Package className="h-8 w-8 mx-auto mb-2 text-gray-300" />
                          <p className="mb-1">No items found</p>
                          {itemSearchTerm && (
                            <p className="text-xs">Try changing your search criteria</p>
                          )}
                        </TableCell>
                      </TableRow>
                    ) : (
                      getFilteredItems().map((item, itemIndex) => {
                        const dynamicFields = getDynamicFieldsFromItems(selectedProductIndex);
                        
                        return (
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
                            
                            {/* Dynamic Table Cells based on ACTUAL fields that have data */}
                            {dynamicFields.map(field => {
                              const value = item[field.key];
                              
                              // Special formatting based on field type
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
                        );
                      })
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

      {/* Transfer Details Modal with Item Preview */}
      <Dialog open={showTransferDetails} onOpenChange={setShowTransferDetails}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Transfer Details</DialogTitle>
            <DialogDescription>
              Complete details of the stock transfer
            </DialogDescription>
          </DialogHeader>

          {selectedTransfer && (
            <div className="space-y-6">
              {/* Transfer Summary */}
              <Card>
                <CardHeader>
                  <CardTitle className="text-lg">Transfer Summary</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-500 mb-2">Transfer Information</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Transfer ID:</span>
                            <span className="font-medium">{selectedTransfer.id}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Date & Time:</span>
                            <span className="font-medium">{formatDateTime(selectedTransfer.transferDate || selectedTransfer.createdAt)}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Status:</span>
                            {getStatusBadge(selectedTransfer.status)}
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product Type:</span>
                            <Badge variant={selectedTransfer.identifierType === "UNIQUE" ? "secondary" : "outline"}>
                              {selectedTransfer.identifierType}
                            </Badge>
                          </div>
                        </div>
                      </div>

                      <div>
                        <h3 className="font-semibold text-sm text-gray-500 mb-2">Product Details</h3>
                        <div className="space-y-2">
                          <div className="flex justify-between">
                            <span className="text-gray-600">Product Name:</span>
                            <span className="font-medium">{selectedTransfer.productName}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">SKU:</span>
                            <span className="font-medium">{selectedTransfer.sku || 'N/A'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Quantity:</span>
                            <span className="font-medium">{selectedTransfer.quantity} {selectedTransfer.unit || 'units'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Rate:</span>
                            <span className="font-medium">₹{selectedTransfer.rate || '0'}</span>
                          </div>
                          <div className="flex justify-between">
                            <span className="text-gray-600">Total Value:</span>
                            <span className="font-medium">₹{(selectedTransfer.quantity * (selectedTransfer.rate || 0)).toFixed(2)}</span>
                          </div>
                        </div>
                      </div>
                    </div>

                    <div className="space-y-4">
                      <div>
                        <h3 className="font-semibold text-sm text-gray-500 mb-2">Warehouse Details</h3>
                        <div className="space-y-4">
                          {/* Source Warehouse */}
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowLeft className="h-4 w-4 text-red-500" />
                              <span className="font-medium">From Warehouse</span>
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium">{selectedTransfer.sourceWarehouse?.name}</div>
                              <div className="text-sm text-gray-500">{selectedTransfer.sourceWarehouse?.location}</div>
                            </div>
                          </div>

                          {/* Destination Warehouse */}
                          <div className="p-3 border rounded-lg">
                            <div className="flex items-center gap-2 mb-2">
                              <ArrowRight className="h-4 w-4 text-green-500" />
                              <span className="font-medium">To Warehouse</span>
                            </div>
                            <div className="space-y-1">
                              <div className="font-medium">{selectedTransfer.destinationWarehouse?.name}</div>
                              <div className="text-sm text-gray-500">{selectedTransfer.destinationWarehouse?.location}</div>
                            </div>
                          </div>
                        </div>
                      </div>

                      {selectedTransfer.remarks && (
                        <div>
                          <h3 className="font-semibold text-sm text-gray-500 mb-2">Remarks</h3>
                          <div className="p-3 bg-gray-50 rounded-lg">
                            <p className="text-sm">{selectedTransfer.remarks}</p>
                          </div>
                        </div>
                      )}
                    </div>
                  </div>
                </CardContent>
              </Card>

              {/* Item Details (for UNIQUE products) */}
              {selectedTransfer.identifierType === "UNIQUE" && selectedTransfer.items && selectedTransfer.items.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transferred Items ({selectedTransfer.items.length})</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="border rounded-lg overflow-hidden">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead className="w-20">#</TableHead>
                            {/* Dynamic headers based on actual data in items */}
                            {(() => {
                              if (selectedTransfer.items.length === 0) return null;
                              
                              // Get all fields that have at least one non-empty value
                              const fieldMap = new Map();
                              
                              selectedTransfer.items.forEach(item => {
                                Object.entries(item).forEach(([key, value]) => {
                                  if (key !== 'id' && value && String(value).trim() !== '') {
                                    if (!fieldMap.has(key)) {
                                      fieldMap.set(key, {
                                        key,
                                        isSerial: key.toLowerCase().includes('serial'),
                                        isMac: key.toLowerCase().includes('mac'),
                                        isWarranty: key.toLowerCase().includes('warranty') || key.toLowerCase().includes('warrenty')
                                      });
                                    }
                                  }
                                });
                              });
                              
                              const fields = Array.from(fieldMap.values());
                              
                              // Sort fields
                              const sortedFields = fields.sort((a, b) => {
                                if (a.isSerial || a.isMac) return -1;
                                if (b.isSerial || b.isMac) return 1;
                                if (a.isWarranty) return -1;
                                if (b.isWarranty) return 1;
                                return a.key.localeCompare(b.key);
                              });
                              
                              return sortedFields.map(field => (
                                <TableHead key={field.key} className="capitalize">
                                  {field.key.replace(/_/g, ' ')}
                                </TableHead>
                              ));
                            })()}
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {selectedTransfer.items.map((item, index) => {
                            // Get fields from the actual item data
                            const itemFields = Object.keys(item).filter(key => key !== 'id' && item[key]);
                            
                            return (
                              <TableRow key={item.id || index} className="hover:bg-gray-50">
                                <TableCell className="font-medium text-gray-500">
                                  {index + 1}
                                </TableCell>
                                
                                {itemFields.map(key => {
                                  const value = item[key];
                                  const isSerial = key.toLowerCase().includes('serial');
                                  const isMac = key.toLowerCase().includes('mac');
                                  const isWarranty = key.toLowerCase().includes('warranty') || key.toLowerCase().includes('warrenty');
                                  
                                  if (isSerial || isMac) {
                                    return (
                                      <TableCell key={key} className="font-mono text-sm">
                                        {value || "N/A"}
                                      </TableCell>
                                    );
                                  } else if (isWarranty) {
                                    return (
                                      <TableCell key={key}>
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
                                      <TableCell key={key} className="text-sm">
                                        {value || "N/A"}
                                      </TableCell>
                                    );
                                  }
                                })}
                              </TableRow>
                            );
                          })}
                        </TableBody>
                      </Table>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* For NON_UNIQUE products */}
              {selectedTransfer.identifierType === "NON_UNIQUE" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Quantity Details</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-blue-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Info className="h-5 w-5 text-blue-600" />
                        <div>
                          <p className="font-medium text-blue-800">Non-Unique Product Transfer</p>
                          <p className="text-sm text-blue-600">
                            {selectedTransfer.quantity} units transferred as bulk quantity. No individual item tracking available for non-unique products.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Stock Movements - Only show if completed */}
              {selectedTransfer.status === "completed" && selectedTransfer.movements && selectedTransfer.movements.length > 0 && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Stock Movements</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="space-y-4">
                      {selectedTransfer.movements.map((movement, index) => (
                        <div key={index} className={`p-4 rounded-lg border ${movement.type === 'OUT' ? 'bg-red-50 border-red-100' : 'bg-green-50 border-green-100'}`}>
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-3">
                              {movement.type === 'OUT' ? (
                                <ArrowLeft className="h-5 w-5 text-red-600" />
                              ) : (
                                <ArrowRight className="h-5 w-5 text-green-600" />
                              )}
                              <div>
                                <div className="font-medium">
                                  {movement.type === 'OUT' ? 'Stock Out' : 'Stock In'}
                                </div>
                                <div className="text-sm text-gray-600">
                                  {movement.warehouseName} • {getWarehouseLocation(movement.warehouseId)}
                                </div>
                              </div>
                            </div>
                            <div className={`text-lg font-bold ${movement.type === 'OUT' ? 'text-red-600' : 'text-green-600'}`}>
                              {movement.type === 'OUT' ? '-' : '+'}{Math.abs(movement.quantity)} units
                            </div>
                          </div>
                        </div>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show message for pending transfers */}
              {selectedTransfer.status === "pending" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transfer Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-yellow-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Clock className="h-5 w-5 text-yellow-600" />
                        <div>
                          <p className="font-medium text-yellow-800">Awaiting Approval</p>
                          <p className="text-sm text-yellow-600">
                            This transfer is pending approval from the destination warehouse. 
                            Stock will only be moved after approval.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}

              {/* Show message for rejected transfers */}
              {selectedTransfer.status === "rejected" && (
                <Card>
                  <CardHeader>
                    <CardTitle className="text-lg">Transfer Status</CardTitle>
                  </CardHeader>
                  <CardContent>
                    <div className="p-4 bg-red-50 rounded-lg">
                      <div className="flex items-center gap-3">
                        <XCircle className="h-5 w-5 text-red-600" />
                        <div>
                          <p className="font-medium text-red-800">Transfer Rejected</p>
                          <p className="text-sm text-red-600">
                            This transfer was rejected by the destination warehouse. 
                            No stock was moved.
                          </p>
                        </div>
                      </div>
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          )}
        </DialogContent>
      </Dialog>

      {/* NEW: Approval Dialog */}
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
                        <span className="text-gray-600">From:</span>
                        <span className="font-medium">{transferToApprove.sourceWarehouse?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">To:</span>
                        <span className="font-medium">{transferToApprove.destinationWarehouse?.name}</span>
                      </div>
                      <div className="flex justify-between">
                        <span className="text-gray-600">Value:</span>
                        <span className="font-medium">₹{(transferToApprove.quantity * (transferToApprove.rate || 0)).toFixed(2)}</span>
                      </div>
                    </div>
                  </div>
                )}
                <div className="pt-2">
                  <p className="text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Once approved, stock will be deducted from source warehouse and added to this warehouse.
                  </p>
                </div>
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
              {isProcessingApproval ? "Processing..." : "Reject Transfer"}
            </Button>
            <AlertDialogAction
              onClick={() => handleApproveTransfer(transferToApprove?.id)}
              disabled={isProcessingApproval}
              className="bg-green-600 hover:bg-green-700"
            >
              {isProcessingApproval ? (
                <>
                  <div className="animate-spin rounded-full h-4 w-4 border-b-2 border-white mr-2"></div>
                  Processing...
                </>
              ) : (
                "Approve Transfer"
              )}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>

      {/* Confirmation Dialog for Transfer Request */}
      <AlertDialog open={showConfirmDialog} onOpenChange={setShowConfirmDialog}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>Create Transfer Request</AlertDialogTitle>
            <AlertDialogDescription>
              <div className="space-y-2 mt-2">
                <p>This will create a transfer request for the following items:</p>
                <div className="border rounded-lg p-3 max-h-40 overflow-y-auto">
                  {selectedProducts
                    .filter(item => {
                      if (item.identifierType === "UNIQUE") {
                        return item.selectedItems && item.selectedItems.length > 0;
                      } else {
                        return item.transferQty > 0;
                      }
                    })
                    .map((item, index) => (
                      <div key={item.productId} className="flex justify-between items-center py-2 text-sm border-b last:border-0">
                        <div className="flex-1">
                          <span className="font-medium">{item.productName}</span>
                          <div className="text-xs text-gray-500">
                            Type: {item.identifierType} •
                            {item.identifierType === "UNIQUE"
                              ? ` Items: ${item.selectedItems?.length || 0}`
                              : ` Qty: ${item.transferQty}`}
                          </div>
                        </div>
                        <span className="font-medium ml-4">
                          {item.identifierType === "UNIQUE"
                            ? `${item.selectedItems?.length || 0} × ₹${item.rate} = ₹${((item.selectedItems?.length || 0) * item.rate).toFixed(2)}`
                            : `${item.transferQty} × ₹${item.rate} = ₹${(item.transferQty * item.rate).toFixed(2)}`}
                        </span>
                      </div>
                    ))}
                </div>
                <div className="pt-2 border-t">
                  <div className="flex justify-between font-medium">
                    <span>Total Value:</span>
                    <span>₹{calculateTotal()}</span>
                  </div>
                </div>
                <div className="pt-2">
                  <p className="text-sm text-amber-600">
                    <AlertCircle className="h-4 w-4 inline mr-1" />
                    Note: This will create a pending transfer request. Stock will only move after approval from destination warehouse.
                  </p>
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
              {isSubmitting ? "Processing..." : "Create Request"}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  );
}