"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronRight, Folder, Package, Lock } from "lucide-react"
import { cn } from "../lib/utils"
import { useState, useEffect } from "react"

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

  // Function to check if category has products
  const doesCategoryHaveProducts = (productGroupId) => {
    if (loading) return true // Loading हो रहा है तो delete नहीं होने दें
    return productsData.some(product => product.productGroupId === productGroupId)
  }

  const handleDeleteClick = (category, e) => {
    e.stopPropagation() // Prevent navigation

    const hasProducts = doesCategoryHaveProducts(category.id)
    const productCount = productsData.filter(p => p.productGroupId === category.id).length

    if (loading) {
      alert("Please wait while we check for products...")
      return
    }

    if (hasProducts) {
      alert(`🚫 CANNOT DELETE!\n\nCategory "${category.name}" has ${productCount} product(s).\n\nFirst delete all products in this category from Products page.`)
      return
    }

    // Only call onDelete if no products
    if (onDelete && !hasProducts) {
      onDelete(category)
    }
  }

  if (!categories?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No categories at this level. Create your first product category!
      </div>
    )
  }

  // Check if this level has single category
  const hasSingleCategory = categories.length === 1

  return (
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
          // Check if category has products
          const hasProducts = doesCategoryHaveProducts(category.id)
          const productCount = productsData.filter(p => p.productGroupId === category.id).length

          // Check if this category is eligible for Add Item in table row
          const isEligibleForAddItemInRow = shouldShowAddItemOnlyForSingleCategory &&
            hasSingleCategory &&
            !category.allowItemEntry &&
            (!category.children || category.children.length === 0)

          return (
            <TableRow
              key={category.id}
              className={cn(
                "hover:bg-muted/30",
                category.allowItemEntry
                  ? "bg-green-100 hover:bg-green-50"
                  : hasProducts
                    ? "bg-amber-50 hover:bg-amber-50"
                    : ""
              )}
            >
              <TableCell>
                <button
                  onClick={() => {
                    // ALWAYS navigate - never redirect to products page
                    onNavigate(category)
                  }}
                  className={cn(
                    "flex items-center gap-2 font-medium text-foreground w-full text-left",
                    category.allowItemEntry
                      ? "text-green-700 hover:underline"
                      : hasProducts
                        ? "text-amber-700 hover:underline"
                        : "hover:underline"
                  )}
                >
                  <Folder className={cn(
                    "h-4 w-4",
                    category.allowItemEntry ? "text-green-600" :
                      hasProducts ? "text-amber-600" : "text-primary"
                  )} />
                  {category.name}
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                </button>
              </TableCell>
              <TableCell className="text-muted-foreground text-sm">
                {parentPath ? `${parentPath}/${category.name}` : `/${category.name}`}
              </TableCell>
              <TableCell className="text-muted-foreground">
                {category.allowItemEntry ? (
                  <span className="text-green-600 font-medium flex items-center gap-1">
                    <Package className="h-3 w-3" />
                    Last Category
                  </span>
                ) : (
                  `${category.children?.length || 0} sub-categories`
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
                  {/* Add Item button for eligible categories */}
                  {/* {(isEligibleForAddItemInRow || category.allowItemEntry) && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                      onClick={() => onAddProduct(category)}
                      title="Add Item to this category"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )} */}

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

                  {/* DELETE BUTTON - COMPLETELY PREVENT DELETION IF PRODUCTS EXIST */}
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
  )
}