// app/products/page.jsx
"use client"

import { useState, useEffect } from "react"
import { Package, Search, Filter, Plus, Eye, Edit, Trash2, FileText, Hash, Calendar, Type, CheckCircle, XCircle, MoreHorizontal, ChevronDown, ChevronLeft, ChevronRight, ChevronsLeft, ChevronsRight } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { useRouter } from "next/navigation"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export default function ProductTableHomePage() {
  const router = useRouter()
  const [products, setProducts] = useState([])
  const [categories, setCategories] = useState([])
  const [fieldMastersData, setFieldMastersData] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchQuery, setSearchQuery] = useState("")
  const [filterCategory, setFilterCategory] = useState("all")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterUniqueId, setFilterUniqueId] = useState("all")
  
  // Pagination state
  const [currentPage, setCurrentPage] = useState(1)
  const [itemsPerPage, setItemsPerPage] = useState(10)

  useEffect(() => {
    loadData()
  }, [])

  const loadData = async () => {
    try {
      const [productsResponse, categoriesResponse, fieldMastersResponse] = await Promise.all([
        fetch('http://localhost:5001/products'),
        fetch('http://localhost:5001/categories'),
        fetch('http://localhost:5001/fieldMasters')
      ])

      const productsData = await productsResponse.json()
      const categoriesData = await categoriesResponse.json()
      const fieldMastersData = await fieldMastersResponse.json()

      setProducts(productsData || [])
      
      // Handle different response formats for categories
      let categoriesList = []
      if (categoriesData && categoriesData.list) {
        categoriesList = categoriesData.list
      } else if (Array.isArray(categoriesData)) {
        categoriesList = categoriesData
      }
      setCategories(categoriesList || [])
      
      setFieldMastersData(fieldMastersData || [])
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

  // Function to get field configurations for a product
  const getFieldConfigurations = (product) => {
    // If product has fieldConfigurations array, use it
    if (product.fieldConfigurations && product.fieldConfigurations.length > 0) {
      return product.fieldConfigurations
    }
    
    // If product has selectedFieldIds, create fieldConfigurations from fieldMasters
    if (product.selectedFieldIds && product.selectedFieldIds.length > 0 && fieldMastersData.length > 0) {
      return product.selectedFieldIds.map(fieldId => {
        const fieldMaster = fieldMastersData.find(fm => fm.id === fieldId)
        return fieldMaster ? {
          fieldId: fieldMaster.id,
          key: fieldMaster.key,
          label: fieldMaster.label,
          type: fieldMaster.type,
          isRequired: fieldMaster.isRequired || false,
          applicableFor: fieldMaster.applicableFor || []
        } : null
      }).filter(field => field !== null)
    }
    
    return []
  }

  // Function to get field icon based on type
  const getFieldIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'text': return <FileText className="h-3 w-3" />
      case 'number': return <Hash className="h-3 w-3" />
      case 'date': return <Calendar className="h-3 w-3" />
      default: return <Type className="h-3 w-3" />
    }
  }

  // Function to render selected fields for a product with popup for more fields
  const renderSelectedFields = (product) => {
    const fieldConfigs = getFieldConfigurations(product)
    
    return (
      <div className="space-y-2">
        
        {/* Selected Fields List - Show first 2 fields, rest in popup */}
        {fieldConfigs.length > 0 ? (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {fieldConfigs.slice(0, 2).map((field) => (
                <div 
                  key={field.fieldId} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs"
                  title={`${field.label} (${field.type})`}
                >
                  {getFieldIcon(field.type)}
                  <span className="truncate max-w-[70px]">{field.label}</span>
                  {field.isRequired && (
                    <span className="text-red-500 font-bold" title="Required">*</span>
                  )}
                </div>
              ))}
              
              {/* More Fields Popup */}
              {fieldConfigs.length > 2 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-3 w-3 mr-1" />
                      +{fieldConfigs.length - 2} more
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">All Selected Fields</div>
                      <Separator />
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fieldConfigs.map((field, index) => (
                          <div 
                            key={field.fieldId} 
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {getFieldIcon(field.type)}
                              <div>
                                <div className="text-sm font-medium">{field.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {field.type} • {field.isRequired ? "Required" : "Optional"}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {index < 2 ? "Shown" : "Hidden"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {fieldConfigs.length} fields selected for {product.identifierType === "UNIQUE" ? "Serial Product" : "Non-Serial Product"}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>

          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">
            No fields selected
          </div>
        )}
      </div>
    )
  }

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const findCategory = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === id) return cat.name
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, id)
          if (found) return found
        }
      }
      return "Unknown Category"
    }
    
    return findCategory(categories, categoryId)
  }

  // Get category path
  const getCategoryPath = (categoryId) => {
    const findPath = (cats, id, path = []) => {
      for (const cat of cats) {
        if (cat.id === id) {
          return [...path, cat.name]
        }
        if (cat.children && cat.children.length > 0) {
          const result = findPath(cat.children, id, [...path, cat.name])
          if (result) return result
        }
      }
      return null
    }
    
    const path = findPath(categories, categoryId)
    return path ? path.join(" > ") : "Unknown Path"
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
    if (filterUniqueId === "yes" && product.identifierType !== "UNIQUE") {
      return false
    }
    if (filterUniqueId === "no" && product.identifierType === "UNIQUE") {
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

  // Pagination calculations
  const totalPages = Math.ceil(filteredProducts.length / itemsPerPage)
  const indexOfLastItem = currentPage * itemsPerPage
  const indexOfFirstItem = indexOfLastItem - itemsPerPage
  const currentProducts = filteredProducts.slice(indexOfFirstItem, indexOfLastItem)
  
  // Pagination handlers
  const goToPage = (pageNumber) => {
    if (pageNumber >= 1 && pageNumber <= totalPages) {
      setCurrentPage(pageNumber)
    }
  }
  
  const goToFirstPage = () => goToPage(1)
  const goToLastPage = () => goToPage(totalPages)
  const goToPreviousPage = () => goToPage(currentPage - 1)
  const goToNextPage = () => goToPage(currentPage + 1)

  const handleDelete = async (product) => {
    if (confirm(`Delete product "${product.productName || product.name}"?`)) {
      try {
        const response = await fetch(`http://localhost:5001/products/${product.id}`, {
          method: 'DELETE',
        })
        if (response.ok) {
          await loadData()
          alert(`✅ Product "${product.productName || product.name}" deleted successfully.`)
        } else {
          alert("Failed to delete product")
        }
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
    setCurrentPage(1) // Reset to first page when clearing filters
  }

  const handleAddProduct = () => {
    router.push('/products')
  }

  const handleEditProduct = (product) => {
    router.push(`/products?edit=${product.id}`)
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
          <h1 className="text-3xl font-bold tracking-tight">All Products</h1>
          <p className="text-muted-foreground">
            Manage all products across all categories
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
              {filteredProducts.length} of {products.length} Products
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
                <SelectItem key={cat.id} value={cat.id}>
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
              <SelectItem value="yes">Serial Products</SelectItem>
              <SelectItem value="no">Non-Serial Products</SelectItem>
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
      <div className="rounded-md border mb-4">
        <Table>
          <TableHeader>
            <TableRow>
              <TableHead className="w-[200px]">Product</TableHead>
              <TableHead className="w-[150px]">Category</TableHead>
              <TableHead className="w-[100px]">Unit</TableHead>
              <TableHead className="w-[250px]">Field Configuration</TableHead>
              <TableHead className="w-[150px]">SKU</TableHead>
              <TableHead className="text-right w-[100px]">Actions</TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {filteredProducts.length === 0 ? (
              <TableRow>
                <TableCell colSpan={6} className="text-center py-8 text-muted-foreground">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {searchQuery || filterCategory !== "all" || filterUnit !== "all" || filterUniqueId !== "all"
                      ? "No products match your filters. Try clearing filters."
                      : "No products found. Add your first product!"}
                  </p>
                  {(searchQuery || filterCategory !== "all" || filterUnit !== "all" || filterUniqueId !== "all") && (
                    <Button
                      variant="outline"
                      onClick={clearFilters}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </TableCell>
              </TableRow>
            ) : (
              currentProducts.map((product) => (
                <TableRow key={product.id}>
                  <TableCell>
                    <div className="font-medium">{product.productName}</div>
                  </TableCell>
                  <TableCell>
                    <div className="text-sm">{getCategoryName(product.productGroupId)}</div>
                    <div className="text-xs text-muted-foreground">
                      {getCategoryPath(product.productGroupId)}
                    </div>
                  </TableCell>
                  <TableCell>
                    <Badge variant="outline">{product.unit}</Badge>
                  </TableCell>
                  <TableCell>
                    {renderSelectedFields(product)}
                  </TableCell>
                  <TableCell>
                    <code className="text-sm">{product.sku}</code>
                  </TableCell>
                  <TableCell className="text-right">
                    <div className="flex items-center justify-end gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8"
                        onClick={() => handleEditProduct(product)}
                        title="Edit"
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                        onClick={() => handleDelete(product)}
                        title="Delete"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>
                  </TableCell>
                </TableRow>
              ))
            )}
          </TableBody>
        </Table>
      </div>

      {/* Pagination Controls */}
      {filteredProducts.length > 0 && (
        <div className="flex flex-col md:flex-row items-center justify-between gap-4">
          {/* Items per page selector */}
          <div className="flex items-center gap-2">
            <span className="text-sm text-muted-foreground">Items per page:</span>
            <Select 
              value={itemsPerPage.toString()} 
              onValueChange={(value) => {
                setItemsPerPage(parseInt(value))
                setCurrentPage(1) // Reset to first page when changing items per page
              }}
            >
              <SelectTrigger className="w-[80px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="5">5</SelectItem>
                <SelectItem value="10">10</SelectItem>
                <SelectItem value="20">20</SelectItem>
                <SelectItem value="50">50</SelectItem>
              </SelectContent>
            </Select>
          </div>

          {/* Page info */}
          <div className="text-sm text-muted-foreground">
            Showing {indexOfFirstItem + 1} to {Math.min(indexOfLastItem, filteredProducts.length)} of {filteredProducts.length} products
          </div>

          {/* Pagination buttons */}
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="icon"
              onClick={goToFirstPage}
              disabled={currentPage === 1}
              title="First page"
            >
              <ChevronsLeft className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToPreviousPage}
              disabled={currentPage === 1}
              title="Previous page"
            >
              <ChevronLeft className="h-4 w-4" />
            </Button>

            {/* Page numbers */}
            <div className="flex items-center gap-1">
              {Array.from({ length: Math.min(5, totalPages) }, (_, i) => {
                let pageNumber
                if (totalPages <= 5) {
                  pageNumber = i + 1
                } else if (currentPage <= 3) {
                  pageNumber = i + 1
                } else if (currentPage >= totalPages - 2) {
                  pageNumber = totalPages - 4 + i
                } else {
                  pageNumber = currentPage - 2 + i
                }

                if (pageNumber > totalPages) return null

                return (
                  <Button
                    key={pageNumber}
                    variant={currentPage === pageNumber ? "default" : "outline"}
                    size="sm"
                    className="h-8 w-8 p-0"
                    onClick={() => goToPage(pageNumber)}
                  >
                    {pageNumber}
                  </Button>
                )
              })}
            </div>

            <Button
              variant="outline"
              size="icon"
              onClick={goToNextPage}
              disabled={currentPage === totalPages}
              title="Next page"
            >
              <ChevronRight className="h-4 w-4" />
            </Button>
            <Button
              variant="outline"
              size="icon"
              onClick={goToLastPage}
              disabled={currentPage === totalPages}
              title="Last page"
            >
              <ChevronsRight className="h-4 w-4" />
            </Button>
          </div>
        </div>
      )}
    </div>
  )
}