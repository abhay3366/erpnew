// app/products/page.jsx
"use client"

import { useState, useEffect } from "react"
import { Package, Search, Filter, Plus } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { ProductTable } from "@/components/products/ProductTable"
import { getProducts, getCategories, deleteProduct } from "@/components/lib/storage"
import { useRouter } from "next/navigation"

export default function ProductTableHomePage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterUniqueId, setFilterUniqueId] = useState("all")

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsData, categoriesData] = await Promise.all([
        getProducts(),
        getCategories()
      ])
      
      setProducts(productsData)
      setCategories(categoriesData)
    } catch (error) {
      console.error("Error loading data:", error)
    } finally {
      setLoading(false)
    }
  }

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
      const productSku = product.sku?.toLowerCase() || ""
      const nameMatch = productName.toLowerCase().includes(query)
      const skuMatch = productSku.includes(query)
      
      if (!nameMatch && !skuMatch) {
        return false
      }
    }
    
    return true
  })

  const handleDelete = async (product) => {
    if (confirm(`Delete product "${product.productName || product.name}"?`)) {
      try {
        await deleteProduct(product.id || product._id)
        await loadData()
        alert(`✅ Product "${product.productName || product.name}" deleted successfully.`)
      } catch (error) {
        console.error("Error deleting product:", error)
        alert("Failed to delete product")
      }
    }
  }

  const clearFilters = () => {
    setSearchQuery("")
    setFilterCategory("all")
    setFilterUnit("all")
    setFilterUniqueId("all")
  }

  const handleAddProduct = () => {
    router.push('/products')
  }

  // Get unique units
  const uniqueUnits = [...new Set(products
    .map((p) => p?.unit)
    .filter(Boolean))]

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading products...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="container mx-auto py-6">
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
              <SelectValue placeholder="All Product Group" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Product Group</SelectItem>
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

      {/* Use ProductTable Component */}
      <ProductTable
        products={filteredProducts}
        categories={categories}
        onDelete={handleDelete}
        showActions={true}
      />
    </div>
  )
}