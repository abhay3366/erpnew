"use client"

import { useState, useEffect } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogFooter } from "@/components/ui/dialog"
import { Switch } from "@/components/ui/switch"
import { Alert, AlertDescription } from "@/components/ui/alert"
import { AlertCircle } from "lucide-react"

export function CategoryForm({ open, onOpenChange, onSubmit, initialData, parentCategory, allCategories = [] }) {
  const [name, setName] = useState("")
  const [allowItemEntry, setAllowItemEntry] = useState(false)
  const [error, setError] = useState("")

  useEffect(() => {
    if (initialData) {
      setName(initialData.name)
      setAllowItemEntry(initialData.allowItemEntry || false)
    } else {
      setName("")
      setAllowItemEntry(false)
    }
    setError("")
  }, [initialData, open])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!name.trim()) return


    onSubmit({
      name: name.trim(),
      allowItemEntry,
    })
    setName("")
    setAllowItemEntry(false)
    setError("")
    onOpenChange(false)
  }

  const title = initialData
    ? "Edit Product Category"
    : parentCategory
      ? `Add Sub-category to "${parentCategory.name}"`
      : "Add Product Category"

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
              Cannot add sub-category because "{parentCategory.name}" has "Allow Last Product Category" enabled.
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
                <Label htmlFor="name">Category Name</Label>
                <Input
                  id="name"
                  value={name}
                  onChange={(e) => {
                    setName(e.target.value)
                    setError("")
                  }}
                  placeholder="Enter category name"
                  autoFocus
                />
              </div>

              <div className="flex items-center justify-between py-2">
                <div>
                  <Label htmlFor="allowItemEntry">Allow Last Product Category</Label>
                  <p className="text-sm text-muted-foreground">Mark as final category (no sub-categories allowed)</p>
                </div>
                <Switch
                  id="allowItemEntry"
                  checked={allowItemEntry}
                  onCheckedChange={(v) => {
                    setAllowItemEntry(v)
                    setError("")
                  }}
                />
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
