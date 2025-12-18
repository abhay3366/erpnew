"use client"

import { useState, useEffect } from "react"
import { Edit, Trash2, Package, Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { getProducts, getCategories, deleteProduct } from "@/components/lib/storage"

export default function ProductsPage() {
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterUniqueId, setFilterUniqueId] = useState("all")

  // Load data from JSON Server
  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      console.log("📦 Loading data from JSON Server...")
      
      // Load products and categories
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ])
      
      console.log("✅ Data loaded:", {
        productsCount: productsData.length,
        categoriesCount: categoriesData.length,
        products: productsData,
        categories: categoriesData
      })
      
      setProducts(productsData)
      setCategories(categoriesData)
      
    } catch (error) {
      console.error("❌ Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

  // Helper function to flatten categories
  const flattenCategories = (cats, level = 0, result = []) => {
    if (!Array.isArray(cats)) return []
    
    cats.forEach(cat => {
      if (cat) {
        result.push({
          ...cat,
          level: level
        })
        
        if (cat.children && Array.isArray(cat.children)) {
          flattenCategories(cat.children, level + 1, result)
        }
      }
    })
    
    return result
  }

  // Helper function to get category path
  const getCategoryPath = (cats, productGroupId, path = []) => {
    if (!Array.isArray(cats) || !productGroupId) return []
    
    for (const cat of cats) {
      if (cat._id === productGroupId || cat.id === productGroupId) {
        path.push(cat.name || "Unnamed")
        return path
      }
      
      if (cat.children && Array.isArray(cat.children)) {
        const childPath = getCategoryPath(cat.children, productGroupId, [...path, cat.name || "Unnamed"])
        if (childPath.length > 0) {
          return childPath
        }
      }
    }
    
    return []
  }

  // Get unique units from products
  const uniqueUnits = [...new Set(products
    .map((p) => p?.unit)
    .filter(Boolean))]

  // Filter products
  const filteredProducts = products.filter((product) => {
    if (!product) return false
    
    const productName = product.name || product.productName || ""
    
    // Filter by category
    if (filterCategory !== "all" && product.productGroupId !== filterCategory) {
      return false
    }
    
    // Filter by unit
    if (filterUnit !== "all" && product.unit !== filterUnit) {
      return false
    }
    
    // Filter by unique identifier
    if (filterUniqueId === "yes" && !product.hasUniqueIdentifier) {
      return false
    }
    if (filterUniqueId === "no" && product.hasUniqueIdentifier) {
      return false
    }
    
    // Search filter
    if (searchQuery) {
      const query = searchQuery.toLowerCase()
      const categoryPath = getCategoryPath(categories, product.productGroupId).join(" > ").toLowerCase()
      const productSku = product.sku?.toLowerCase() || ""
      const nameMatch = productName.toLowerCase().includes(query)
      const skuMatch = productSku.includes(query)
      const categoryMatch = categoryPath.includes(query)
      
      if (!nameMatch && !skuMatch && !categoryMatch) {
        return false
      }
    }
    
    return true
  })

  // Function to check if category has products
  const doesCategoryHaveProducts = (productGroupId) => {
    return products.some(product => product.productGroupId === productGroupId)
  }

  // Handle delete product
  const handleDelete = async (product) => {
    if (confirm(`Delete product "${product.productName || product.name}"?`)) {
      try {
        await deleteProduct(product.id || product._id)
        // Reload data
        await loadData()
        alert(`✅ Product "${product.productName || product.name}" deleted successfully.`)
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Failed to delete product")
      }
    }
  }

  // Handle edit product
  const handleEdit = (product) => {
    console.log("Edit product:", product)
    // Navigate to edit page or open modal
    // For example: router.push(`/products/edit/${product.id}`)
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFilterCategory("all")
    setFilterUnit("all")
    setFilterUniqueId("all")
  }

  // Add new product button handler
  const handleAddProduct = () => {
    console.log("Add new product")
    // Navigate to add product page
    // router.push('/products/add')
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading products...</p>
          <p className="text-sm text-muted-foreground mt-2">Connecting to JSON Server</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
      {/* Header */}
      <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
        <div>
          <h1 className="text-3xl font-bold tracking-tight">Products</h1>
          <p className="text-muted-foreground">
            Manage your inventory products
          </p>
        </div>
        <Button onClick={handleAddProduct}>
          <Plus className="mr-2 h-4 w-4" />
          Add Product
        </Button>
      </div>

      {/* Filters Section */}
      <div className="bg-muted/30 border rounded-lg p-4 space-y-4 mb-6">
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-2">
            <Filter className="h-4 w-4 text-muted-foreground" />
            <span className="font-medium">Filters</span>
          </div>
          <div className="flex items-center gap-4">
            <Badge variant="outline">
              {products.length} Total Products
            </Badge>
            <Button 
              variant="ghost" 
              size="sm" 
              onClick={loadData}
              className="text-xs"
            >
              Refresh
            </Button>
          </div>
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
              <SelectValue placeholder="All Categories" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Categories</SelectItem>
              {flattenCategories(categories).map((cat) => (
                <SelectItem key={cat._id || cat.id} value={cat._id || cat.id}>
                  {"  ".repeat(cat.level || 0)}
                  {cat.name || "Unnamed"} 
                  {cat.allowItemEntry ? " (Items)" : ""}
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

      {/* Products Table */}
      {filteredProducts.length === 0 ? (
        <div className="text-center py-12 border rounded-lg">
          <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="font-medium mb-2">No products found</h3>
          <p className="text-muted-foreground mb-4">
            {products.length > 0 
              ? "No products match your filters. Try clearing filters." 
              : "No products in database. Add your first product!"}
          </p>
          {products.length > 0 && (
            <Button variant="outline" onClick={clearFilters}>
              Clear Filters
            </Button>
          )}
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
                <TableHead>SKU</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredProducts.map((product, index) => {
                const productName = product.name || product.productName || "Unnamed Product"
                const productImage = product.image || product.imageUrl || ""
                const productUnit = product.unit || "pieces"
                const productSku = product.sku || "N/A"
                const categoryPath = getCategoryPath(categories, product.productGroupId)
                
                return (
                  <TableRow key={product.id || product._id || index}>
                    <TableCell>
                      <div className="flex items-center gap-3">
                        {productImage ? (
                          <img
                            src={productImage}
                            alt={productName}
                            className="h-10 w-10 rounded object-cover bg-muted"
                            onError={(e) => {
                              e.target.style.display = 'none'
                              e.target.nextElementSibling.style.display = 'flex'
                            }}
                          />
                        ) : null}
                        <div 
                          className={`h-10 w-10 rounded bg-muted flex items-center justify-center ${productImage ? 'hidden' : ''}`}
                        >
                          <Package className="h-5 w-5 text-muted-foreground" />
                        </div>
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
                          <div>
                            <span className="text-muted-foreground">Uncategorized</span>
                            {product.productGroupId && (
                              <div className="text-xs text-amber-600 mt-1">
                                Category ID: {product.productGroupId}
                              </div>
                            )}
                          </div>
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
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button 
                          variant="ghost" 
                          size="icon" 
                          onClick={() => handleEdit(product)}
                          title="Edit product"
                        >
                          <Edit className="h-4 w-4" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="icon"
                          className="text-destructive hover:text-destructive hover:bg-destructive/10"
                          onClick={() => handleDelete(product)}
                          title="Delete product"
                        >
                          <Trash2 className="h-4 w-4" />
                        </Button>
                      </div>
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