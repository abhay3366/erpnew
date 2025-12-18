"use client"

import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog"
import { Folder, X } from "lucide-react"
import { cn } from "../lib/utils"

const LEVEL_COLORS = [
  "border-red-500",
  "border-green-500",
  "border-yellow-500",
  "border-purple-500",
  "border-blue-500",
  "border-pink-500",
]

function TreeNode({ category, level = 0, onSelect }) {
  const lineColor = LEVEL_COLORS[level % LEVEL_COLORS.length]

  return (
    <div className="relative">
      {level > 0 && (
        <div className={cn("absolute left-0 top-0 bottom-0 w-0.5 border-l-2", lineColor)} style={{ left: -16 }} />
      )}
      <div className="flex items-center gap-2">
        {level > 0 && (
          <div className="flex items-center">
            <span className={cn("inline-block w-4 h-0.5 border-t-2", lineColor)} />
          </div>
        )}
        <button
          onClick={() => onSelect(category)}
          className={cn(
            "flex items-center gap-2 px-3 py-1.5 rounded-md transition-colors",
            category.allowItemEntry
              ? "bg-green-100 text-green-700 border border-green-300 hover:bg-green-200"
              : "bg-background border hover:bg-accent",
          )}
        >
          <Folder className="h-4 w-4" />
          <span className="font-medium">{category.name}</span>
        </button>
      </div>
      {category.children?.length > 0 && (
        <div className="ml-8 mt-2 space-y-2 relative">
          {category.children.map((child) => (
            <TreeNode key={child.id} category={child} level={level + 1} onSelect={onSelect} />
          ))}
        </div>
      )}
    </div>
  )
}

export function CategoryTreeModal({ open, onOpenChange, categories, onSelect, currentPath = [] }) {
  const handleSelect = (category) => {
    onSelect(category)
    onOpenChange(false)
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl max-h-[80vh] overflow-hidden flex flex-col">
        <DialogHeader className="flex-row items-center justify-between">
          <DialogTitle className="text-green-600">Product Tree Structure</DialogTitle>
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </DialogHeader>
        <div className="flex-1 overflow-y-auto p-4">
          <div className="flex items-center gap-2 mb-4">
            <Folder className="h-4 w-4" />
            <span className="font-medium">Home</span>
          </div>
          <div className="ml-4 space-y-2">
            {categories.length === 0 ? (
              <p className="text-muted-foreground text-center py-8">No categories yet</p>
            ) : (
              categories.map((category) => (
                <TreeNode key={category.id} category={category} level={0} onSelect={handleSelect} />
              ))
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
