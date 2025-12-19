"use client"

import { useState } from "react"
import { PackagePlus, Calendar, MapPin, Filter, Search } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion"

export function StockEntryList({ entries, vendors, products, warehouses, showFilters = false, limit = null }) {
  const [filterVendor, setFilterVendor] = useState("all")
  const [filterProduct, setFilterProduct] = useState("all")
  const [filterWarehouse, setFilterWarehouse] = useState("all")
  const [searchQuery, setSearchQuery] = useState("")
  const [dateFrom, setDateFrom] = useState("")
  const [dateTo, setDateTo] = useState("")

  const getVendorName = (id) => vendors.find((v) => v._id === id)?.name || "Unknown"
  const getProductName = (id) => products.find((p) => p._id === id)?.name || "Unknown"
  const getProduct = (id) => products.find((p) => p._id === id)
  const getWarehouseName = (id) => warehouses.find((w) => w._id === id)?.name || "Unknown"

let filteredEntries = Array.isArray(entries)
  ? entries.filter((entry) => {
      if (!entry) return false;

      if (filterVendor && filterVendor !== "all" && entry.vendorId !== filterVendor) return false;
      if (filterProduct && filterProduct !== "all" && entry.productId !== filterProduct) return false;
      if (filterWarehouse && filterWarehouse !== "all" && entry.warehouseId !== filterWarehouse) return false;

      const entryDate = new Date(entry.createdAt);
      if (dateFrom && entryDate < new Date(dateFrom)) return false;
      if (dateTo && entryDate > new Date(dateTo)) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        const productName = (getProductName(entry.productId) || "").toLowerCase();
        const vendorName = (getVendorName(entry.vendorId) || "").toLowerCase();
        const warehouseName = (getWarehouseName(entry.warehouseId) || "").toLowerCase();

        if (!productName.includes(query) && !vendorName.includes(query) && !warehouseName.includes(query)) {
          return false;
        }
      }

      return true;
    })
  : [];

if (limit && !showFilters) {
  filteredEntries = filteredEntries.slice(0, limit);
}


  const clearFilters = () => {
    setFilterVendor("all")
    setFilterProduct("all")
    setFilterWarehouse("all")
    setSearchQuery("")
    setDateFrom("")
    setDateTo("")
  }

  if (!entries?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <PackagePlus className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No stock entries yet. Add your first stock entry!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      {showFilters && (
        <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-6 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Search..."
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
                className="pl-9"
              />
            </div>

            <Select value={filterVendor} onValueChange={setFilterVendor}>
              <SelectTrigger>
                <SelectValue placeholder="All Vendors" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Vendors</SelectItem>
                {vendors.map((vendor) => (
                  <SelectItem key={vendor._id} value={vendor._id}>
                    {vendor.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterProduct} onValueChange={setFilterProduct}>
              <SelectTrigger>
                <SelectValue placeholder="All Products" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Products</SelectItem>
                {products.map((product) => (
                  <SelectItem key={product._id} value={product._id}>
                    {product.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Select value={filterWarehouse} onValueChange={setFilterWarehouse}>
              <SelectTrigger>
                <SelectValue placeholder="All Warehouses" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">All Warehouses</SelectItem>
                {warehouses.map((warehouse) => (
                  <SelectItem key={warehouse._id} value={warehouse._id}>
                    {warehouse.name}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Input type="date" value={dateFrom} onChange={(e) => setDateFrom(e.target.value)} placeholder="From Date" />

            <Input type="date" value={dateTo} onChange={(e) => setDateTo(e.target.value)} placeholder="To Date" />
          </div>
          <div className="flex items-center justify-between">
            <Button variant="outline" size="sm" onClick={clearFilters}>
              Clear Filters
            </Button>
            <span className="text-sm text-muted-foreground">
              Showing {filteredEntries.length} of {entries.length} entries
            </span>
          </div>
        </div>
      )}

      {filteredEntries.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground">
          <p>No entries match your filters.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredEntries.map((entry) => {
            const product = getProduct(entry.productId)
            return (
              <div key={entry._id} className="border rounded-lg overflow-hidden bg-card">
                <div className="p-4 flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div>
                      <div className="font-medium">{getProductName(entry.productId)}</div>
                      <div className="text-sm text-muted-foreground">from {getVendorName(entry.vendorId)}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <MapPin className="h-4 w-4" />
                      {getWarehouseName(entry.warehouseId)}
                    </div>
                    <Badge variant="secondary">
                      {entry.quantity} {product?.unit || "items"}
                    </Badge>
                    <div className="flex items-center gap-1 text-sm text-muted-foreground">
                      <Calendar className="h-4 w-4" />
                      {new Date(entry.createdAt).toLocaleDateString()}
                    </div>
                  </div>
                </div>

                {entry.items?.length > 0 && (
                  <Accordion type="single" collapsible>
                    <AccordionItem value="items" className="border-t">
                      <AccordionTrigger className="px-4 py-2 text-sm">View {entry.items.length} items</AccordionTrigger>
                      <AccordionContent>
                        <Table>
                          <TableHeader>
                            <TableRow className="bg-muted/30">
                              <TableHead>#</TableHead>
                              {product?.hasSerialNo && <TableHead>Serial No</TableHead>}
                              {product?.hasMacAddress && <TableHead>MAC Address</TableHead>}
                              {product?.hasWarranty && <TableHead>Warranty</TableHead>}
                            </TableRow>
                          </TableHeader>
                          <TableBody>
                            {entry.items.map((item, index) => (
                              <TableRow key={item._id}>
                                <TableCell>{index + 1}</TableCell>
                                {product?.hasSerialNo && <TableCell>{item.serialNo || "-"}</TableCell>}
                                {product?.hasMacAddress && <TableCell>{item.macAddress || "-"}</TableCell>}
                                {product?.hasWarranty && <TableCell>{item.warranty || "-"}</TableCell>}
                              </TableRow>
                            ))}
                          </TableBody>
                        </Table>
                      </AccordionContent>
                    </AccordionItem>
                  </Accordion>
                )}
              </div>
            )
          })}
        </div>
      )}
    </div>
  )
}
