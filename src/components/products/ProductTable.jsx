// components/products/ProductTable.jsx
"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, Package } from "lucide-react"
import { Badge } from "@/components/ui/badge"
import { useRouter } from "next/navigation"

export function ProductTable({
  products = [],
  categories = [],
  onEdit,
  onDelete,
  showActions = true,
  compact = false,
  onProductClick
}) {
  const router = useRouter()

  // Helper function to get category path
  const getCategoryPath = (productGroupId) => {
    if (!categories?.length || !productGroupId) return []
    
    const findPath = (cats, targetId, path = []) => {
      for (const cat of cats) {
        if (cat._id === targetId || cat.id === targetId) {
          path.push(cat.name || "Unnamed")
          return path
        }
        if (cat.children && Array.isArray(cat.children)) {
          const childPath = findPath(cat.children, targetId, [...path, cat.name || "Unnamed"])
          if (childPath.length > 0) {
            return childPath
          }
        }
      }
      return []
    }
    
    return findPath(categories, productGroupId)
  }

  // Default edit function
  const defaultEdit = (product) => {
    const params = new URLSearchParams()
    params.append('edit', 'true')
    params.append('productId', product.id || product._id)
    params.append('productName', product.productName || product.name || '')
    params.append('productGroupId', product.productGroupId || '')
    params.append('unit', product.unit || 'pieces')
    params.append('imageUrl', product.image || product.imageUrl || '')
    params.append('hasUniqueIdentifier', product.hasUniqueIdentifier ? 'true' : 'false')
    params.append('hasSerialNo', product.hasSerialNo ? 'true' : 'false')
    params.append('hasMacAddress', product.hasMacAddress ? 'true' : 'false')
    params.append('hasWarranty', product.hasWarranty ? 'true' : 'false')
    
    router.push(`/products?${params.toString()}`)
  }

  // Handle product click
  const handleProductClick = (product) => {
    if (onProductClick) {
      onProductClick(product)
    } else if (onEdit) {
      onEdit(product)
    } else {
      defaultEdit(product)
    }
  }

  if (compact) {
    return (
      <div className="space-y-2">
        {products.map((product) => {
          const productName = product.name || product.productName || "Unnamed Product"
          const productImage = product.image || product.imageUrl || ""
          const productUnit = product.unit || "pieces"
          const productSku = product.sku || "N/A"

          return (
            <div 
              key={product.id || product._id} 
              className="p-3 border rounded bg-background hover:bg-muted/30 cursor-pointer flex items-center justify-between"
              onClick={() => handleProductClick(product)}
            >
              <div className="flex items-center gap-3">
                {productImage ? (
                  <img
                    src={productImage}
                    alt={productName}
                    className="h-8 w-8 rounded object-cover bg-muted"
                  />
                ) : (
                  <div className="h-8 w-8 rounded bg-muted flex items-center justify-center">
                    <Package className="h-4 w-4 text-muted-foreground" />
                  </div>
                )}
                <div>
                  <div className="font-medium text-sm">{productName}</div>
                  <div className="text-xs text-muted-foreground">
                    SKU: {productSku} | Unit: {productUnit}
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2">
                {product.hasUniqueIdentifier && (
                  <div className="flex gap-1">
                    {product.hasSerialNo && <Badge variant="outline" className="text-xs">Serial</Badge>}
                    {product.hasMacAddress && <Badge variant="outline" className="text-xs">MAC</Badge>}
                    {product.hasWarranty && <Badge variant="outline" className="text-xs">Warranty</Badge>}
                  </div>
                )}
              </div>
            </div>
          )
        })}
      </div>
    )
  }

  if (products.length === 0) {
    return (
      <div className="text-center py-12 border rounded-lg">
        <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
        <h3 className="font-medium mb-2">No products found</h3>
        <p className="text-muted-foreground">
          No products in this category
        </p>
      </div>
    )
  }

  return (
    <div className="border rounded-lg overflow-hidden">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead>Product</TableHead>
            <TableHead>Category</TableHead>
            <TableHead>Unit</TableHead>
            <TableHead>Unique ID</TableHead>
            <TableHead>SKU</TableHead>
            {showActions && <TableHead className="text-right">Actions</TableHead>}
          </TableRow>
        </TableHeader>
        <TableBody>
          {products.map((product) => {
            const productName = product.name || product.productName || "Unnamed Product"
            const productImage = product.image || product.imageUrl || ""
            const productUnit = product.unit || "pieces"
            const productSku = product.sku || "N/A"
            const categoryPath = getCategoryPath(product.productGroupId)

            return (
              <TableRow key={product.id || product._id} className="hover:bg-muted/30">
                <TableCell>
                  <div 
                    className="flex items-center gap-3 cursor-pointer"
                    onClick={() => handleProductClick(product)}
                  >
                    {productImage ? (
                      <img
                        src={productImage}
                        alt={productName}
                        className="h-10 w-10 rounded object-cover bg-muted"
                      />
                    ) : (
                      <div className="h-10 w-10 rounded bg-muted flex items-center justify-center">
                        <Package className="h-5 w-5 text-muted-foreground" />
                      </div>
                    )}
                    <div>
                      <div className="font-medium">{productName}</div>
                      <div className="text-xs text-muted-foreground">
                        ID: {product.id || product._id}
                      </div>
                    </div>
                  </div>
                </TableCell>
                <TableCell>
                  <div className="text-sm">
                    {categoryPath.length > 0 ? (
                      categoryPath.join(" > ")
                    ) : (
                      <span className="text-muted-foreground">Uncategorized</span>
                    )}
                  </div>
                </TableCell>
                <TableCell>
                  <Badge variant="secondary">{productUnit}</Badge>
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
                <TableCell>
                  <Badge variant="outline">{productSku}</Badge>
                </TableCell>
                {showActions && (
                  <TableCell className="text-right">
                    <div className="flex justify-end gap-2">
                      <Button 
                        variant="ghost" 
                        size="icon" 
                        onClick={() => handleProductClick(product)}
                        title="Edit product"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {onDelete && (
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => onDelete(product)}
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      )}
                    </div>
                  </TableCell>
                )}
              </TableRow>
            )
          })}
        </TableBody>
      </Table>
    </div>
  )
}