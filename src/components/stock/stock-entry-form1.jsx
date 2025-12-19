"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Plus, Trash2 } from "lucide-react"
import { generateId } from "@/components/lib/storage"

export function StockEntryForm1({ vendors, products, warehouses, onSubmit }) {
  const [vendorId, setVendorId] = useState("")
  const [productId, setProductId] = useState("")
  const [warehouseId, setWarehouseId] = useState("")
  const [quantity, setQuantity] = useState("")
  const [items, setItems] = useState([])

 const selectedVendor = Array.isArray(vendors)
  ? vendors.find((v) => v._id === vendorId) || null
  : null;

 const availableProducts = Array.isArray(products)
  ? products.filter((p) => selectedVendor?.selectedProductIds?.includes(p._id))
  : [];

const selectedProduct = Array.isArray(products)
  ? products.find((p) => p._id === productId) || null
  : null;


  useEffect(() => {
    setProductId("")
    setItems([])
  }, [vendorId])

  useEffect(() => {
    setItems([])
    setQuantity("")
  }, [productId])

  const addRows = (count) => {
    const newItems = Array(count)
      .fill(null)
      .map(() => ({
        _id: generateId(),
        serialNo: "",
        macAddress: "",
        warranty: "",
      }))
    setItems((prev) => [...prev, ...newItems])
  }

  const updateItem = (itemId, field, value) => {
    setItems((prev) => prev.map((item) => (item._id === itemId ? { ...item, [field]: value } : item)))
  }

  const removeItem = (itemId) => {
    setItems((prev) => prev.filter((item) => item._id !== itemId))
  }

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!vendorId || !productId || !warehouseId) return

    const entry = {
      _id: generateId(),
      vendorId,
      productId,
      warehouseId,
      quantity: selectedProduct?.hasUniqueIdentifier ? items.length : Number(quantity),
      items: selectedProduct?.hasUniqueIdentifier ? items : [],
      createdAt: new Date().toISOString(),
    }

    onSubmit(entry)

    // Reset form
    setVendorId("")
    setProductId("")
    setWarehouseId("")
    setQuantity("")
    setItems([])
  }

  const isValid =
    vendorId &&
    productId &&
    warehouseId &&
    (selectedProduct?.hasUniqueIdentifier ? items.length > 0 : Number(quantity) > 0)

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <div className="space-y-2">
          <Label>Vendor *</Label>
          <Select value={vendorId} onValueChange={setVendorId}>
            <SelectTrigger>
              <SelectValue placeholder="Search vendor..." />
            </SelectTrigger>
            <SelectContent>
             {Array.isArray(vendors)
  ? vendors
      .filter((v) => !v.isBlacklisted && v.status === "active")
      .map((vendor) => (
        <SelectItem key={vendor._id} value={vendor._id}>
          {vendor.name}
        </SelectItem>
      ))
  : null}

            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Product *</Label>
          <Select value={productId} onValueChange={setProductId} disabled={!vendorId}>
            <SelectTrigger>
              <SelectValue placeholder="Select product..." />
            </SelectTrigger>
            <SelectContent>
              {availableProducts.map((product) => (
                <SelectItem key={product._id} value={product._id}>
                  {product.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label>Warehouse *</Label>
          <Select value={warehouseId} onValueChange={setWarehouseId}>
            <SelectTrigger>
              <SelectValue placeholder="Select warehouse..." />
            </SelectTrigger>
            <SelectContent>
            {Array.isArray(warehouses)
  ? warehouses.map((warehouse) => (
      <SelectItem key={warehouse._id} value={warehouse._id}>
        {warehouse.name}
      </SelectItem>
    ))
  : null}

            </SelectContent>
          </Select>
        </div>
      </div>

      {selectedProduct && !selectedProduct.hasUniqueIdentifier && (
        <div className="space-y-2 max-w-xs">
          <Label>Quantity ({selectedProduct.unit}) *</Label>
          <Input
            type="number"
            value={quantity}
            onChange={(e) => setQuantity(e.target.value)}
            placeholder={`Enter quantity in ${selectedProduct.unit}`}
            min="1"
          />
        </div>
      )}

      {selectedProduct?.hasUniqueIdentifier && (
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <Label>Item Details ({items.length} items)</Label>
            <div className="flex gap-2">
              <Button type="button" variant="outline" size="sm" onClick={() => addRows(1)}>
                <Plus className="h-4 w-4 mr-1" /> Add 1 Row
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addRows(3)}>
                +3 Rows
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addRows(5)}>
                +5 Rows
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addRows(10)}>
                +10 Rows
              </Button>
              <Button type="button" variant="outline" size="sm" onClick={() => addRows(20)}>
                +20 Rows
              </Button>
            </div>
          </div>

          {items.length > 0 && (
            <div className="border rounded-lg overflow-hidden">
              <div className="max-h-96 overflow-y-auto">
                <table className="w-full">
                  <thead className="bg-muted/50 sticky top-0">
                    <tr>
                      <th className="text-left p-3 text-sm font-medium">#</th>
                      {selectedProduct.hasSerialNo && (
                        <th className="text-left p-3 text-sm font-medium">Serial Number</th>
                      )}
                      {selectedProduct.hasMacAddress && (
                        <th className="text-left p-3 text-sm font-medium">MAC Address</th>
                      )}
                      {selectedProduct.hasWarranty && <th className="text-left p-3 text-sm font-medium">Warranty</th>}
                      <th className="text-right p-3 text-sm font-medium">Action</th>
                    </tr>
                  </thead>
                  <tbody>
                    {items.map((item, index) => (
                      <tr key={item._id} className="border-t">
                        <td className="p-3 text-sm">{index + 1}</td>
                        {selectedProduct.hasSerialNo && (
                          <td className="p-3">
                            <Input
                              value={item.serialNo}
                              onChange={(e) => updateItem(item._id, "serialNo", e.target.value)}
                              placeholder="Serial number"
                              className="h-8"
                            />
                          </td>
                        )}
                        {selectedProduct.hasMacAddress && (
                          <td className="p-3">
                            <Input
                              value={item.macAddress}
                              onChange={(e) => updateItem(item._id, "macAddress", e.target.value)}
                              placeholder="MAC address"
                              className="h-8"
                            />
                          </td>
                        )}
                        {selectedProduct.hasWarranty && (
                          <td className="p-3">
                            <Input
                              value={item.warranty}
                              onChange={(e) => updateItem(item._id, "warranty", e.target.value)}
                              placeholder="Warranty info"
                              className="h-8"
                            />
                          </td>
                        )}
                        <td className="p-3 text-right">
                          <Button
                            type="button"
                            variant="ghost"
                            size="icon"
                            className="h-8 w-8 text-destructive hover:text-destructive"
                            onClick={() => removeItem(item._id)}
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            </div>
          )}
        </div>
      )}

      <Button type="submit" disabled={!isValid} className="w-full md:w-auto">
        Submit Stock Entry
      </Button>
    </form>
  )
}
