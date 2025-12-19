"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronRight, Folder, Package, Lock, MoreHorizontal } from "lucide-react"
import { cn } from "../lib/utils"
import { useState, useEffect, useRef } from "react"
import { Badge } from "@/components/ui/badge"
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog"

export function CategoryTable({
  categories,
  onEdit,
  onDelete,
  onNavigate,
  onAddProduct,
  parentPath = "",
  isParentProductCategory = false,
  shouldShowAddItemOnlyForSingleCategory = false
}) {
  const [productsData, setProductsData] = useState([])
  const [loading, setLoading] = useState(true)
  const [hoveredCategory, setHoveredCategory] = useState(null)
  const [selectedCategoryForModal, setSelectedCategoryForModal] = useState(null)
  const [hoverTimeout, setHoverTimeout] = useState(null)
  const typeCellRef = useRef(null)

  // Fetch products when component mounts
  useEffect(() => {
    fetchProducts()
  }, [])

  const fetchProducts = async () => {
    try {
      const response = await fetch('http://localhost:5001/products')
      if (response.ok) {
        const data = await response.json()
        setProductsData(data || [])
      }
    } catch (error) {
      console.error("Error fetching products:", error)
    } finally {
      setLoading(false)
    }
  }

  // Function to get products for a specific category
  const getProductsForCategory = (categoryId) => {
    if (!Array.isArray(productsData)) return []
    return productsData.filter(product => product.productGroupId === categoryId)
  }

  // Function to check if category has products
  const doesCategoryHaveProducts = (productGroupId) => {
    if (loading) return true
    return getProductsForCategory(productGroupId).length > 0
  }

  const handleDeleteClick = (category, e) => {
    e.stopPropagation() // Prevent navigation

    const products = getProductsForCategory(category.id)
    const productCount = products.length

    if (loading) {
      alert("Please wait while we check for products...")
      return
    }

    if (productCount > 0) {
      alert(`🚫 CANNOT DELETE!\n\nCategory "${category.name}" has ${productCount} product(s).\n\nFirst delete all products in this category from Products page.`)
      return
    }

    // Only call onDelete if no products
    if (onDelete && productCount === 0) {
      onDelete(category)
    }
  }

  // Handle mouse enter on TYPE cell only
  const handleTypeCellMouseEnter = (e, category) => {
    if (!category.children || category.children.length === 0) return

    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }

    const rect = e.currentTarget.getBoundingClientRect()
    const timeout = setTimeout(() => {
      setHoveredCategory({
        ...category,
        mouseX: rect.left,
        mouseY: rect.bottom + 5
      })
    }, 100)

    setHoverTimeout(timeout)
  }

  // Handle mouse leave from TYPE cell
  const handleTypeCellMouseLeave = () => {
    if (hoverTimeout) {
      clearTimeout(hoverTimeout)
    }
    setHoveredCategory(null)
  }

  // Function to get all sub-categories recursively
  const getAllSubCategories = (category, level = 0) => {
    if (!category || !category.children || category.children.length === 0) return []

    let allSubCats = []
    category.children.forEach(child => {
      allSubCats.push({
        ...child,
        level: level,
        isProductCategory: child.allowItemEntry
      })
      if (child.children && child.children.length > 0) {
        allSubCats = allSubCats.concat(getAllSubCategories(child, level + 1))
      }
    })

    return allSubCats
  }

  // Handle Read More click - opens modal in center
  const handleReadMoreClick = (category, e) => {
    e.stopPropagation()
    setSelectedCategoryForModal(category)
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No categories at this level. Create your first product category!
      </div>
    )
  }

  return (
    <div className="relative">
      <Table>
        <TableHeader>
          <TableRow className="bg-muted/50">
            <TableHead className="font-semibold">NAME</TableHead>
            <TableHead className="font-semibold">PATH</TableHead>
            <TableHead className="font-semibold">TYPE</TableHead>
            <TableHead className="font-semibold">PRODUCTS</TableHead>
            <TableHead className="text-right font-semibold">ACTIONS</TableHead>
          </TableRow>
        </TableHeader>
        <TableBody>
          {categories.map((category) => {
            // Get products for this category
            const categoryProducts = getProductsForCategory(category.id)
            const productCount = categoryProducts.length
            const hasProducts = productCount > 0

            // Get sub-categories for this category
            const hasSubCategories = category.children && category.children.length > 0

            // Check if this is a last category
            const isLastCategory = category.allowItemEntry

            return (
              <TableRow
                key={category.id}
                className={cn(
                  "hover:bg-muted/30",
                  isLastCategory
                    ? "bg-green-100 hover:bg-green-50"
                    : hasProducts
                      ? "bg-amber-50 hover:bg-amber-50"
                      : ""
                )}
              >
                <TableCell>
                  <button
                    onClick={() => {
                      // Navigate to category
                      onNavigate(category)
                    }}
                    className={cn(
                      "flex items-center gap-2 font-medium text-foreground w-full text-left",
                      isLastCategory
                        ? "text-green-700 hover:underline"
                        : hasProducts
                          ? "text-amber-700 hover:underline"
                          : "hover:underline"
                    )}
                  >
                    {isLastCategory ? (
                      <Package className="h-4 w-4 text-green-600" />
                    ) : (
                      <Folder className="h-4 w-4 text-primary" />
                    )}
                    {category.name}
                    <ChevronRight className="h-4 w-4 text-muted-foreground" />
                  </button>
                </TableCell>
                <TableCell className="text-muted-foreground text-sm">
                  {parentPath ? `${parentPath}/${category.name}` : `/${category.name}`}
                </TableCell>
                <TableCell
                  className="text-muted-foreground relative cursor-pointer"
                  ref={typeCellRef}
                  onMouseEnter={(e) => hasSubCategories && handleTypeCellMouseEnter(e, category)}
                  onMouseLeave={handleTypeCellMouseLeave}
                >
                  {isLastCategory ? (
                    <span className="text-green-600 font-medium flex items-center gap-1">
                      <Package className="h-3 w-3" />
                      Last Category
                    </span>
                  ) : (
                    <div className="flex items-center gap-2">
                      <span className={cn(
                        "cursor-default",
                        hasSubCategories && "hover:text-primary transition-colors"
                      )}>
                        {category.children?.length || 0} sub-categories
                      </span>
                      {hasSubCategories && (
                        <Button
                          variant="ghost"
                          size="sm"
                          className="h-6 w-6 p-0 hover:bg-muted hover:text-primary"
                          onClick={(e) => handleReadMoreClick(category, e)}
                          title="View all sub-categories"
                          onMouseEnter={(e) => e.stopPropagation()}
                        >
                          <MoreHorizontal className="h-3 w-3" />
                        </Button>
                      )}
                    </div>
                  )}
                </TableCell>
                <TableCell>
                  {loading ? (
                    <span className="text-gray-500 text-sm">Checking...</span>
                  ) : hasProducts ? (
                    <div className="flex items-center gap-2 text-amber-600">
                      <Lock className="h-3 w-3" />
                      <span className="text-sm font-medium">{productCount} product(s)</span>
                    </div>
                  ) : (
                    <span className="text-green-600 text-sm">No products</span>
                  )}
                </TableCell>
                <TableCell>
                  <div className="flex items-center justify-end gap-2">
                    <Button
                      variant="ghost"
                      size="icon"
                      className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                      onClick={(e) => {
                        e.stopPropagation()
                        onEdit(category)
                      }}
                      title="Edit"
                    >
                      <Edit className="h-4 w-4" />
                    </Button>

                    {/* DELETE BUTTON */}
                    <Button
                      variant="ghost"
                      size="icon"
                      className={cn(
                        "h-8 w-8",
                        hasProducts
                          ? "bg-gray-100 text-gray-400 cursor-not-allowed opacity-50"
                          : "bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                      )}
                      onClick={(e) => handleDeleteClick(category, e)}
                      title={hasProducts ? "Cannot delete: Category has products" : "Delete"}
                      disabled={hasProducts || loading}
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

      {/* HOVER BOX - Shows sub-categories on TYPE cell hover */}
      {hoveredCategory && hoveredCategory.children && hoveredCategory.children.length > 0 && (
        <div
          className="fixed z-50 bg-background border rounded-lg shadow-lg p-4 w-80 max-h-80 overflow-y-auto"
          style={{
            top: hoveredCategory.mouseY || 0,
            left: hoveredCategory.mouseX || 0,
            transform: 'translate(0, 0)'
          }}
          onMouseEnter={() => setHoveredCategory(hoveredCategory)}
          onMouseLeave={handleTypeCellMouseLeave}
        >
          <div className="space-y-2">
            <div className="flex items-center justify-between mb-2">
              <h4 className="font-medium text-sm">
                Immediate Sub-categories
              </h4>
              <Badge variant="outline" className="text-xs">
                {hoveredCategory.children.length} items
              </Badge>
            </div>
            {hoveredCategory.children.map((subCat) => (
              <div
                key={subCat.id}
                className="p-2 hover:bg-muted rounded cursor-pointer flex items-center justify-between"
                onClick={() => {
                  onNavigate(subCat)
                  setHoveredCategory(null)
                }}
              >
                <div className="flex items-center gap-2">
                  {subCat.allowItemEntry ? (
                    <Package className="h-3 w-3 text-green-600" />
                  ) : (
                    <Folder className="h-3 w-3 text-muted-foreground" />
                  )}
                  <span className="text-sm">{subCat.name}</span>
                </div>
                <div className="flex items-center gap-2">
                  {subCat.allowItemEntry ? (
                    <Badge variant="secondary" className="text-xs px-1">
                      Last
                    </Badge>
                  ) : (
                    <span className="text-xs text-muted-foreground">
                      {subCat.children?.length || 0} sub
                    </span>
                  )}
                  <ChevronRight className="h-3 w-3 text-muted-foreground" />
                </div>
              </div>
            ))}
            <div className="pt-2 border-t mt-2">
              <Button
                variant="ghost"
                size="sm"
                className="w-full text-xs"
                onClick={() => {
                  setSelectedCategoryForModal(hoveredCategory)
                  setHoveredCategory(null)
                }}
              >
                View All Nested Sub-categories →
              </Button>
            </div>
          </div>
        </div>
      )}

      {/* MODAL FOR READ MORE - Opens in center of screen */}
      <Dialog open={!!selectedCategoryForModal} onOpenChange={(open) => !open && setSelectedCategoryForModal(null)}>
        <DialogContent className="sm:max-w-md max-h-[70vh] overflow-hidden flex flex-col">
          <DialogHeader>
            <DialogTitle className="flex items-center gap-2">
              <Folder className="h-4 w-4 text-primary" />
              All Sub-categories of "{selectedCategoryForModal?.name}"
              <Badge variant="outline" className="ml-2">
                {getAllSubCategories(selectedCategoryForModal)?.length || 0} total
              </Badge>
            </DialogTitle>
          </DialogHeader>

          {selectedCategoryForModal && (
            <div className="flex-1 overflow-y-auto p-1">
              <div className="space-y-2">
                {getAllSubCategories(selectedCategoryForModal).map((subCat) => (
                  <div
                    key={subCat.id}
                    className="p-3 border rounded hover:bg-muted cursor-pointer transition-colors"
                    onClick={() => {
                      onNavigate(subCat)
                      setSelectedCategoryForModal(null)
                    }}
                  >
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-2">
                        <span className="font-medium">{subCat.name}</span>
                      </div>
                      <div className="flex items-center gap-2">
                        {subCat.isProductCategory ? (
                          <Badge variant="secondary" className="text-xs">
                            Last Category
                          </Badge>
                        ) : (
                          <span className="text-xs text-muted-foreground">
                            {subCat.children?.length || 0} sub
                          </span>
                        )}
                        <ChevronRight className="h-3 w-3 text-muted-foreground" />
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          )}
        </DialogContent>
      </Dialog>
    </div>
  )
}