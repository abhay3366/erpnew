"use client"

import { useState, useEffect, useRef } from "react"
import { Search, X, Folder } from "lucide-react"
import { Dialog, DialogContent } from "@/components/ui/dialog"
import { Input } from "@/components/ui/input"
import { flattenCategories } from "../lib/storage"
import { cn } from "@/lib/utils"

export function CategorySearchModal({ open, onOpenChange, categories, onSelect }) {
  const [search, setSearch] = useState("")
  const inputRef = useRef(null)

  useEffect(() => {
    if (open) {
      setSearch("")
      setTimeout(() => inputRef.current?.focus(), 100)
    }
  }, [open])

  const flatCategories = flattenCategories(categories)

  const filteredCategories = search.trim()
    ? flatCategories.filter(
        (cat) =>
          cat.name.toLowerCase().includes(search.toLowerCase()) ||
          cat.path.toLowerCase().includes(search.toLowerCase()),
      )
    : flatCategories.slice(0, 10)

  const handleSelect = (category) => {
    onSelect(category)
    onOpenChange(false)
  }

  const getCategoryPathDisplay = (category) => {
    const parts = category.path.split(" > ")
    return "/" + parts.join("/") + "/"
  }

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-2xl p-0 gap-0">
        <div className="flex items-center gap-3 p-4 border-b">
          <div className="bg-blue-600 p-2 rounded-lg">
            <Search className="h-5 w-5 text-white" />
          </div>
          <Input
            ref={inputRef}
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search categories..."
            className="border-0 text-lg focus-visible:ring-0 shadow-none p-0"
          />
          {search && (
            <button onClick={() => setSearch("")} className="text-muted-foreground hover:text-foreground">
              <X className="h-5 w-5" />
            </button>
          )}
          <button onClick={() => onOpenChange(false)} className="text-muted-foreground hover:text-foreground">
            <X className="h-5 w-5" />
          </button>
        </div>

        <div className="p-4">
          <p className="text-sm text-muted-foreground mb-3">Suggestions</p>
          <div className="space-y-2 max-h-80 overflow-y-auto">
            {filteredCategories.length === 0 ? (
              <p className="text-center text-muted-foreground py-4">No categories found</p>
            ) : (
              filteredCategories.map((category) => (
                <button
                  key={category._id}
                  onClick={() => handleSelect(category)}
                  className={cn(
                    "w-full flex items-center gap-3 p-3 rounded-lg text-left transition-colors",
                    category.allowItemEntry ? "hover:bg-green-50 dark:hover:bg-green-950" : "hover:bg-accent",
                  )}
                >
                  <div
                    className={cn(
                      "p-2 rounded-lg",
                      category.allowItemEntry ? "bg-green-100 dark:bg-green-900" : "bg-blue-100 dark:bg-blue-900",
                    )}
                  >
                    <Folder
                      className={cn(
                        "h-5 w-5",
                        category.allowItemEntry
                          ? "text-green-600 dark:text-green-400"
                          : "text-blue-600 dark:text-blue-400",
                      )}
                    />
                  </div>
                  <div className="flex-1">
                    <p
                      className={cn(
                        "font-semibold",
                        category.allowItemEntry ? "text-green-600 dark:text-green-400" : "text-foreground",
                      )}
                    >
                      {category.name}
                    </p>
                    <p
                      className={cn(
                        "text-sm",
                        category.allowItemEntry ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                      )}
                    >
                      {getCategoryPathDisplay(category)}
                    </p>
                  </div>
                  <span
                    className={cn(
                      category.allowItemEntry ? "text-green-600 dark:text-green-400" : "text-muted-foreground",
                    )}
                  >
                    →
                  </span>
                </button>
              ))
            )}
          </div>
        </div>

        <div className="p-3 border-t bg-muted/50 text-center text-sm text-muted-foreground">
          Press Enter to search • <span className="text-green-600">Light Green = Last Category Level</span> • Click to
          navigate
        </div>
      </DialogContent>
    </Dialog>
  )
}
