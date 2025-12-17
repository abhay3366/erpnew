"use client"

import { useState } from "react"
import { Edit, Trash2, Package, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getCategoryPath, flattenCategories } from "@/lib/storage"

export function ProductTable({ products, categories, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterUniqueId, setFilterUniqueId] = useState("all")

  const flatCategories = flattenCategories(categories)

  const uniqueUnits = [...new Set(products.map((p) => p.unit).filter(Boolean))]

  const filteredProducts = products.filter((product) => {
    if (filterCategory !== "all" && product.categoryId !== filterCategory) return false
    if (filterUnit !== "all" && product.unit !== filterUnit) return false
    if (filterUniqueId === "yes" && !product.hasUniqueIdentifier) return false
    if (filterUniqueId === "no" && product.hasUniqueIdentifier) return false
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const categoryPath = getCategoryPath(categories, product.categoryId).join(" > ").toLowerCase()
      if (!product.name?.toLowerCase().includes(query) && !categoryPath.includes(query)) {
        return false
      }
    }
    return true
  })

  const clearFilters = () => {
    setSearchQuery("")
    setFilterCategory("all")
    setFilterUnit("all")
    setFilterUniqueId("all")
  }

  if (!products?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Package className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No products yet. Create your first product!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-5 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search products..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterCategory} onValueChange={setFilterCategory}>
            <SelectTrigger>
              <SelectValue placeholder="All Products Gruop" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products Gruop</SelectItem>
              {flatCategories.map((cat) => (
                <SelectItem key={cat._id} value={cat._id}>
                  {"  ".repeat(cat.level)}
                  {cat.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterUnit} onValueChange={setFilterUnit}>
            <SelectTrigger>
              <SelectValue placeholder="All Units" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Units</SelectItem>
              {uniqueUnits.map((unit) => (
                <SelectItem key={unit} value={unit}>
                  {unit}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>

          <Select value={filterUniqueId} onValueChange={setFilterUniqueId}>
            <SelectTrigger>
              <SelectValue placeholder="Unique ID" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Products</SelectItem>
              <SelectItem value="yes">With Unique ID</SelectItem>
              <SelectItem value="no">Without Unique ID</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredProducts.length} of {products.length} products
        </div>
      </div>

      {filteredProducts.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p>No products match your filters.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Product</TableHead>
                <TableHead>Category</TableHead>
                <TableHead>Unit</TableHead>
                <TableHead>Unique ID</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product) => {
                const categoryPath = getCategoryPath(categories, product.categoryId)
                return (
                  <TableRow key={product._id}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl || "/placeholder.svg"}
                            alt={product.name}
                            className="h-10 w-10 rounded object-cover bg-muted"
                          />
                        ) : (
                          <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                            <Package className="h-5 w-5 text-muted-foreground" />
                          </div>
                        )}
                        <span className="font-medium">{product.name}</span>
                      </div>
                    </TableCell>
                    <TableCell>
                      <span className="text-sm text-muted-foreground">
                        {categoryPath.join(" > ") || "Uncategorized"}
                      </span>
                    </TableCell>
                    <TableCell>
                      <Badge variant="secondary">{product.unit}</Badge>
                    </TableCell>
                    <TableCell>
                      {product.hasUniqueIdentifier ? (
                        <div className="flex flex-wrap gap-1">
                          {product.hasSerialNo && <Badge variant="outline">Serial</Badge>}
                          {product.hasMacAddress && <Badge variant="outline">MAC</Badge>}
                          {product.hasWarranty && <Badge variant="outline">Warranty</Badge>}
                        </div>
                      ) : (
                        <span className="text-muted-foreground">-</span>
                      )}
                    </TableCell>
                    <TableCell className="text-right">
                      <Button variant="ghost" size="icon" onClick={() => onEdit(product)}>
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="text-destructive hover:text-destructive"
                        onClick={() => onDelete(product)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </TableCell>
                  </TableRow>
                )
              })}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
