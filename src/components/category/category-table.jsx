"use client"

import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronRight, Folder, Package } from "lucide-react"
import { cn } from "@/lib/utils"

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
          <TableHead className="text-right font-semibold">ACTIONS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => {
          // Check if this category is eligible for Add Item in table row
          const isEligibleForAddItemInRow = shouldShowAddItemOnlyForSingleCategory && 
                                          hasSingleCategory && 
                                          !category.allowItemEntry &&
                                          (!category.children || category.children.length === 0)

          return (
            <TableRow
              key={category._id}
              className={cn(
                "hover:bg-muted/30",
                category.allowItemEntry
                  ? "bg-green-100 hover:bg-green-50"
                  : ""
              )}
            >
              <TableCell>
                <button
                  onClick={() => {
                    if (category.allowItemEntry) {
                      // Last category - go to products
                      onAddProduct(category)
                    } else {
                      // Regular category - navigate deeper
                      onNavigate(category)
                    }
                  }}
                  className={cn(
                    "flex items-center gap-2 font-medium text-foreground",
                    category.allowItemEntry
                      ? "text-green-700 hover:underline"
                      : "hover:underline"
                  )}
                >
                  <Folder className={cn(
                    "h-4 w-4",
                    category.allowItemEntry ? "text-green-600" : "text-primary"
                  )} />
                  {category.name}
                  {!category.allowItemEntry && <ChevronRight className="h-4 w-4 text-muted-foreground" />}
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
                <div className="flex items-center justify-end gap-2">
                  {/* ✅ Add Item button - only show for single category when it's not already last category AND has NO children */}
                  {isEligibleForAddItemInRow && (
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
                  )}

                  {/* Add Item button for last category - ALWAYS show */}
                  {category.allowItemEntry && (
                    <Button
                      variant="ghost"
                      size="sm"
                      className="h-8 px-3 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                      onClick={() => onAddProduct(category)}
                      title="Add Product"
                    >
                      <Package className="h-4 w-4 mr-2" />
                      Add Item
                    </Button>
                  )}

                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    onClick={() => onEdit(category)}
                    title="Edit"
                  >
                    <Edit className="h-4 w-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-red-50 text-red-600 hover:bg-red-100 hover:text-red-700"
                    onClick={() => onDelete(category)}
                    title="Delete"
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