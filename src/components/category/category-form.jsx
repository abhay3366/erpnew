"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"
import { categoryNameExists } from "../lib/storage"

export function CategoryForm({ open, onOpenChange, onSubmit, initialData, parentCategory, allCategories = [] }) {
  const [name, setName] = useState("")
  const [error, setError] = useState("")

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
    } else {
      setName("")
    }
    setError("")
  }, [initialData, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return

    if (categoryNameExists(allCategories, name, initialData?.id)) {
      setError("A category with this name already exists (names are case-insensitive)")
      return
    }

    onSubmit({
      name: name.trim(),
    })
    setName("")
    setError("")
    onOpenChange(false)
  }

  const title = initialData
    ? `Edit Product Group "${initialData.name}"`
    : parentCategory
      ? `Add Sub-Product Group to "${parentCategory.name}"`
      : "Create New Product Group"

  const parentHasItemEntry = parentCategory?.allowItemEntry

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent>
        <DialogHeader>
          <DialogTitle>{title}</DialogTitle>
        </DialogHeader>

        {parentHasItemEntry ? (
          <Alert variant="destructive">
            <AlertCircle className="h-4 w-4" />
            <AlertDescription>
              Cannot add sub-Product Group because "{parentCategory.name}" is already a product Product Group.
            </AlertDescription>
          </Alert>
        ) : (
          <form onSubmit={handleSubmit}>
            <div className="space-y-4 py-4">
              {error && (
                <Alert variant="destructive">
                  <AlertCircle className="h-4 w-4" />
                  <AlertDescription>{error}</AlertDescription>
                </Alert>
              )}

              <div className="space-y-2">
                <Label htmlFor="name">Product Group Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter Product Group name"
                  autoFocus
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Note: Product Group will be marked as "Last Product Group" automatically when you click "Add Product"
                </p>
              </div>
            </div>
            <DialogFooter>
              <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
                Cancel
              </Button>
              <Button type="submit" disabled={!name.trim()}>
                {initialData ? "Update" : "Create"}
              </Button>
            </DialogFooter>
          </form>
        )}

        {parentHasItemEntry && (
          <DialogFooter>
            <Button type="button" variant="outline" onClick={() => onOpenChange(false)}>
              Close
            </Button>
          </DialogFooter>
        )}
      </DialogContent>
    </Dialog>
  )
}