"use client"

import { Table, TableBody, TableCell, TableHeader, TableRow ,TableHead } from "../ui/table"
import { Button } from "@/components/ui/button"
import { Edit, Trash2, ChevronRight, Folder, Plus, Package } from "lucide-react"
import { cn } from "@/lib/utils"
import { useRouter } from "next/navigation"

export function CategoryTable({ categories, onEdit, onDelete, onAddChild, onNavigate, onAddProduct, parentPath = "" }) {
  const router = useRouter()

  if (!categories?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        No categories at this level. Create your first product category!
      </div>
    )
  }

  return (
    <Table>
      <TableHeader>
        <TableRow className="bg-muted/50">
          <TableHead className="font-semibold">NAME</TableHead>
          <TableHead className="font-semibold">PATH</TableHead>
          <TableHead className="font-semibold">SUB-CATEGORIES</TableHead>
          <TableHead className="text-right font-semibold">ACTIONS</TableHead>
        </TableRow>
      </TableHeader>
      <TableBody>
        {categories.map((category) => (
          <TableRow
            key={category._id}
            className={cn(
              "hover:bg-muted/30",
              category.allowItemEntry
                ? "bg-green-50/50 hover:bg-green-50 cursor-default"
                : ""
            )}
          >
            <TableCell>
              <button
                onClick={() => {
                  if (category.allowItemEntry) {
                    // ✅ Last category है - सीधे product create पर redirect
                    onAddProduct(category)
                  } else {
                    // ✅ Regular category है - navigate करें
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
                {/* ✅ Last Category के लिए Add Product button */}
                {category.allowItemEntry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-green-50 text-green-600 hover:bg-green-100 hover:text-green-700"
                    onClick={() => onAddProduct(category)}
                    title="Add Product"
                  >
                    <Plus className="h-4 w-4" />
                  </Button>
                )}

                {/* ✅ Regular categories के लिए Add Sub-category button */}
                {!category.allowItemEntry && (
                  <Button
                    variant="ghost"
                    size="icon"
                    className="h-8 w-8 bg-blue-50 text-blue-600 hover:bg-blue-100 hover:text-blue-700"
                    onClick={() => onAddChild(category)}
                    title="Add Sub-category"
                  >
                    <Plus className="h-4 w-4" />
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
        ))}
      </TableBody>
    </Table>
  )
}