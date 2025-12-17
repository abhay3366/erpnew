"use client"

import { useState } from "react"
import { ChevronRight, ChevronDown, Edit, Trash2, Plus, Package } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { cn } from "@/lib/utils"

export function CategoryTree({ categories, onEdit, onDelete, onAddChild, level = 0 }) {
  const [expanded, setExpanded] = useState({})

  const toggleExpand = (id) => {
    setExpanded((prev) => ({ ...prev, [id]: !prev[id] }))
  }

  if (!categories?.length) {
    return level === 0 ? (
      <p className="text-muted-foreground text-center py-8">No categories yet. Create your first category!</p>
    ) : null
  }

  return (
    <div className={cn("space-y-1", level > 0 && "ml-6 border-l border-border pl-4")}>
      {categories.map((category) => (
        <div key={category._id}>
          <div className="flex items-center gap-2 py-2 px-3 rounded-lg hover:bg-accent/50 group">
            {category.children?.length > 0 ? (
              <button onClick={() => toggleExpand(category._id)} className="p-1 hover:bg-accent rounded">
                {expanded[category._id] ? (
                  <ChevronDown className="h-4 w-4 text-muted-foreground" />
                ) : (
                  <ChevronRight className="h-4 w-4 text-muted-foreground" />
                )}
              </button>
            ) : (
              <span className="w-6" />
            )}
            <span className="flex-1 font-medium text-foreground">{category.name}</span>

            {category.allowItemEntry && (
              <Badge variant="secondary" className="flex items-center gap-1">
                <Package className="h-3 w-3" />
                {category.productName}
              </Badge>
            )}

            <div className="opacity-0 group-hover:opacity-100 flex items-center gap-1 transition-opacity">
              {!category.allowItemEntry && (
                <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onAddChild(category)}>
                  <Plus className="h-4 w-4" />
                </Button>
              )}
              <Button variant="ghost" size="icon" className="h-7 w-7" onClick={() => onEdit(category)}>
                <Edit className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="icon"
                className="h-7 w-7 text-destructive hover:text-destructive"
                onClick={() => onDelete(category)}
              >
                <Trash2 className="h-4 w-4" />
              </Button>
            </div>
          </div>
          {expanded[category._id] && category.children?.length > 0 && (
            <CategoryTree
              categories={category.children}
              onEdit={onEdit}
              onDelete={onDelete}
              onAddChild={onAddChild}
              level={level + 1}
            />
          )}
        </div>
      ))}
    </div>
  )
}
