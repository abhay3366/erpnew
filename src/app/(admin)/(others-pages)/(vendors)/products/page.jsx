"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Search, X, Lock, Save } from "lucide-react"

const UNITS = ["pieces", "meter", "liter", "kg"]

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    name: "",
    productGroupId: "",
    unit: "pieces",
    imageUrl: "",
    hasUniqueIdentifier: false,
    hasSerialNo: false,
    hasMacAddress: false,
    hasWarranty: false,
  })

  const [categories, setCategories] = useState([])
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProductId, setEditingProductId] = useState("")

  // Create ref for dropdown container
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)

  const categoryIdFromUrl = searchParams.get('productGroupId')
  const categoryNameFromUrl = searchParams.get('categoryName')
  const markAsLastOnFirstProduct = searchParams.get('markAsLastOnFirstProduct')
  const autoMarkLast = searchParams.get('autoMarkLast')

  // Check if edit mode
  const editParam = searchParams.get('edit')
  const productIdParam = searchParams.get('productId')
  const productNameParam = searchParams.get('productName')
  const productGroupIdParam = searchParams.get('productGroupId')
  const unitParam = searchParams.get('unit')
  const imageUrlParam = searchParams.get('imageUrl')
  const hasUniqueIdentifierParam = searchParams.get('hasUniqueIdentifier')
  const hasSerialNoParam = searchParams.get('hasSerialNo')
  const hasMacAddressParam = searchParams.get('hasMacAddress')
  const hasWarrantyParam = searchParams.get('hasWarranty')

  useEffect(() => {
    fetchCategories()

    // Check if we're in edit mode
    if (editParam === 'true' && productIdParam) {
      console.log("EDIT MODE DETECTED")
      console.log("Product ID:", productIdParam)
      console.log("Product Name:", productNameParam)
      console.log("Category ID:", productGroupIdParam)

      setIsEditMode(true)
      setEditingProductId(productIdParam)

      // Set form data from URL params
      setFormData({
        name: productNameParam || "",
        productGroupId: productGroupIdParam || "",
        unit: unitParam || "pieces",
        imageUrl: imageUrlParam || "",
        hasUniqueIdentifier: hasUniqueIdentifierParam === 'true',
        hasSerialNo: hasSerialNoParam === 'true',
        hasMacAddress: hasMacAddressParam === 'true',
        hasWarranty: hasWarrantyParam === 'true',
      })

      // Set category search text
      if (productGroupIdParam) {
        setCategorySearch(`Editing product category: ${productGroupIdParam}`)
      }
    }
  }, [])

  useEffect(() => {
    if (categories.length > 0 && categoryIdFromUrl) {
      console.log("URL Category ID:", categoryIdFromUrl)
      console.log("Auto Mark Last:", autoMarkLast)
      console.log("Mark on First Product:", markAsLastOnFirstProduct)

      const category = findCategoryById(categories, categoryIdFromUrl)
      console.log("Found Category:", category)

      if (category) {
        handleCategorySelect(category)

        // If category comes from Add Item button, lock it
        if (categoryIdFromUrl) {
          setIsCategoryLocked(true)
        }

        // If autoMarkLast is true, mark category as last immediately
        if (autoMarkLast === 'true' && !category.allowItemEntry) {
          handleAutoMarkAsLastCategory(category)
        }
      } else {
        console.log("Category not found with ID:", categoryIdFromUrl)
      }
    }

    // If edit mode, find and set the category
    if (isEditMode && categories.length > 0 && formData.productGroupId) {
      const category = findCategoryById(categories, formData.productGroupId)
      if (category) {
        setSelectedCategory(category)
        setCategorySearch(category.name)
      }
    }
  }, [categories, categoryIdFromUrl, autoMarkLast, markAsLastOnFirstProduct, isEditMode, formData.productGroupId])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5001/categories')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()
      console.log("Fetched categories data:", data)

      let categoriesList = []
      if (Array.isArray(data)) {
        categoriesList = data
      } else if (data && data.list) {
        categoriesList = data.list
      } else if (data && Array.isArray(data.categories)) {
        categoriesList = data.categories
      }

      console.log("Categories list:", categoriesList)

      // ✅ Normalize the categories structure
      const normalizeCategories = (cats) => {
        if (!Array.isArray(cats)) return []

        return cats.map(cat => {
          if (!cat) return null

          return {
            id: cat.id || cat.id || String(Date.now()),
            name: cat.name || "",
            allowItemEntry: Boolean(cat.allowItemEntry),
            productName: cat.productName || "",
            children: normalizeCategories(cat.children || [])
          }
        }).filter(Boolean)
      }

      const normalizedCategories = normalizeCategories(categoriesList)
      console.log("Normalized categories:", normalizedCategories)

      setCategories(normalizedCategories)
    } catch (error) {
      console.error('Error fetching categories:', error)
    } finally {
      setLoading(false)
    }
  }

  const findCategoryById = (cats, id) => {
    if (!cats || !Array.isArray(cats)) return null

    for (const cat of cats) {
      console.log("Checking category:", cat.id, "against:", id)

      if (String(cat.id) === String(id) || String(cat.id) === String(id)) {
        console.log("Category found:", cat)
        return cat
      }

      if (cat.children && Array.isArray(cat.children)) {
        const found = findCategoryById(cat.children, id)
        if (found) return found
      }
    }
    return null
  }

  // Function to mark category as last category (product category)
  const handleAutoMarkAsLastCategory = async (category) => {
    try {
      console.log("Auto-marking category as last:", category.name)

      // Update category to be a product category
      const updateCategoryInTree = (cats, targetId) => {
        return cats.map((cat) => {
          if (cat.id === targetId || cat.id === targetId) {
            return {
              ...cat,
              allowItemEntry: true,
              children: cat.children || []
            }
          }
          if (cat.children && Array.isArray(cat.children)) {
            return {
              ...cat,
              children: updateCategoryInTree(cat.children, targetId)
            }
          }
          return cat
        })
      }

      const updatedCategories = updateCategoryInTree(categories, category.id || category.id)

      // Save to server
      const response = await fetch('http://localhost:5001/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ list: updatedCategories }),
      })

      if (response.ok) {
        console.log("Category marked as last successfully")
        setCategories(updatedCategories)

        // Update selected category in state
        const updatedCategory = findCategoryById(updatedCategories, category.id || category.id)
        if (updatedCategory) {
          setSelectedCategory(updatedCategory)
        }
      }
    } catch (error) {
      console.error('Error marking category as last:', error)
    }
  }

  const getLeafCategories = (cats = []) => {
    let result = []

    const traverse = (category, path = []) => {
      if (!category) return

      const newPath = [...path, category.name]

      if (category.allowItemEntry) {
        result.push({
          ...category,
          path: newPath.join(" > "),
          level: path.length
        })
      }

      if (category.children && Array.isArray(category.children)) {
        category.children.forEach(child => traverse(child, newPath))
      }
    }

    if (Array.isArray(cats)) {
      cats.forEach(cat => traverse(cat))
    }

    return result
  }

  const leafCategories = getLeafCategories(categories)

  const filteredCategories = categorySearch.trim()
    ? leafCategories.filter(
      (cat) =>
        cat.name.toLowerCase().includes(categorySearch.toLowerCase()) ||
        (cat.path && cat.path.toLowerCase().includes(categorySearch.toLowerCase()))
    )
    : leafCategories

  const handleCategorySelect = (category) => {
    console.log("Category selected:", category)
    setSelectedCategory(category)
    setFormData(prev => ({
      ...prev,
      productGroupId: String(category.id || category.id)
    }))
    setCategorySearch(category.path || category.name)
    setShowCategoryDropdown(false)

    // If user selects a category manually, don't lock it
    setIsCategoryLocked(false)
  }

  const clearCategory = () => {
    if (isCategoryLocked) {
      alert("Category is locked. Go back to categories page to change.")
      return
    }
    setSelectedCategory(null)
    setFormData(prev => ({
      ...prev,
      productGroupId: ""
    }))
    setCategorySearch("")
    setShowCategoryDropdown(false)
  }

  const updateField = (field, value) => {
    setFormData(prev => ({ ...prev, [field]: value }))
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Please enter product name")
      return
    }

    if (!formData.productGroupId) {
      alert("Please select a category")
      return
    }

    const productData = {
      id: isEditMode ? editingProductId : Date.now().toString(),
      productGroupId: formData.productGroupId,
      productName: formData.name.trim(),
      unit: formData.unit,
      sku: isEditMode ? `SKU-${editingProductId}` : `SKU-${Date.now()}`,
      image: formData.imageUrl,
      hasUniqueIdentifier: formData.hasUniqueIdentifier,
      hasSerialNo: formData.hasSerialNo,
      hasMacAddress: formData.hasMacAddress,
      hasWarranty: formData.hasWarranty,
      createdAt: isEditMode ? new Date().toISOString() : new Date().toISOString()
    }

    console.log("Saving product:", productData)
    console.log("Edit mode:", isEditMode)
    console.log("Product ID:", editingProductId)

    try {
      setSaving(true)

      if (isEditMode) {
        // EDIT MODE: Update existing product
        console.log("Updating existing product...")

        // First, let's test if the API is working
        console.log("Testing API connection...")

        // Method 1: Try direct PUT to individual product
        try {
          console.log("Trying PUT to /products/:id")
          const putResponse = await fetch(`http://localhost:5001/products/${editingProductId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          })

          console.log("PUT Response status:", putResponse.status)
          console.log("PUT Response:", putResponse)

          if (putResponse.ok) {
            alert("✅ Product updated successfully!")
            router.push('/product-table')
            return
          }
        } catch (putError) {
          console.log("PUT failed, trying alternative method:", putError)
        }

        // Method 2: Try PATCH to individual product
        try {
          console.log("Trying PATCH to /products/:id")
          const patchResponse = await fetch(`http://localhost:5001/products/${editingProductId}`, {
            method: 'PATCH',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          })

          console.log("PATCH Response status:", patchResponse.status)

          if (patchResponse.ok) {
            alert("✅ Product updated successfully!")
            router.push('/product-table')
            return
          }
        } catch (patchError) {
          console.log("PATCH failed, trying third method:", patchError)
        }

        // Method 3: Fetch all products, update in memory, and PUT back entire array
        try {
          console.log("Trying to update entire products array")

          // Get all products
          const getResponse = await fetch('http://localhost:5001/products')
          console.log("GET Response status:", getResponse.status)

          if (!getResponse.ok) {
            throw new Error(`Failed to fetch products: ${getResponse.status}`)
          }

          const allProducts = await getResponse.json()
          console.log("Fetched products:", allProducts)
          console.log("Looking for product with ID:", editingProductId)

          // Check if product exists
          const productExists = allProducts.some(p =>
            p.id === editingProductId || p._id === editingProductId
          )
          console.log("Product exists:", productExists)

          if (!productExists) {
            alert("❌ Product not found in database!")
            return
          }

          // Find and update the product
          const updatedProducts = allProducts.map(product => {
            if (product.id === editingProductId || product._id === editingProductId) {
              console.log("Found and updating product:", product)
              return productData
            }
            return product
          })

          console.log("Updated products array:", updatedProducts)

          // Save updated products back
          console.log("Sending PUT to /products with entire array")
          const saveResponse = await fetch('http://localhost:5001/products', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProducts),
          })

          console.log("PUT Response status:", saveResponse.status)

          if (saveResponse.ok) {
            alert("✅ Product updated successfully!")
            router.push('/product-table')
          } else {
            throw new Error(`Failed to save: ${saveResponse.status}`)
          }
        } catch (finalError) {
          console.error('Final error:', finalError)
          alert(`❌ Failed to update product: ${finalError.message}`)
        }
      } else {
        // CREATE MODE: Create new product
        console.log("Creating new product...")
        const response = await fetch('http://localhost:5001/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        })

        if (response.ok) {
          console.log("Product created successfully")

          // Check if we need to mark category as last on first product
          if (markAsLastOnFirstProduct === 'true' && selectedCategory && !selectedCategory.allowItemEntry) {
            console.log("Marking category as last on first product")
            await handleAutoMarkAsLastCategory(selectedCategory)
          }

          alert("✅ Product created successfully!")
          router.push('/product-table')
        } else {
          alert("Failed to create product")
        }
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert(`Error saving product: ${error.message}`)
    } finally {
      setSaving(false)
    }
  }

  const handleCancel = () => {
    router.push('/product-table')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading product...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-2">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              {isEditMode ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? "Update product information" : "Add new product to your inventory"}
            </p>

            {isEditMode && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Editing Product ID:</span> {editingProductId}
                </p>
              </div>
            )}

            {/* Show info if category will be marked as last on first product */}
            {!isEditMode && markAsLastOnFirstProduct === 'true' && selectedCategory && !selectedCategory.allowItemEntry && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-300 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Note:</span> This category will be marked as a "Product Category" after you create the first product.
                </p>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Products
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Product Information" : "Product Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category selection */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Product Category *
                </Label>

                {isEditMode && selectedCategory ? (
                  <div className="p-3 bg-blue-50 border border-blue-300 rounded-md">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-blue-700">
                          {selectedCategory.name}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Current category for editing
                        </p>
                      </div>
                    </div>
                  </div>
                ) : isCategoryLocked && selectedCategory ? (
                  <div className="p-3 bg-green-50 border border-green-300 rounded-md">
                    <div className="flex items-center gap-3">
                      <Lock className="h-5 w-5 text-green-600" />
                      <div>
                        <p className="font-medium text-green-700">
                          {selectedCategory.name}
                        </p>
                        {categoryNameFromUrl && (
                          <p className="text-xs text-green-600 mt-1">
                            URL Category: {categoryNameFromUrl}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ) : selectedCategory ? (
                  <div className="flex items-center gap-2 p-3 bg-orange-100 border border-orange-300 rounded-lg">
                    <div className="flex-1">
                      <p className="font-medium text-foreground">{selectedCategory.name}</p>
                      {selectedCategory.path && (
                        <p className="text-xs text-muted-foreground">{selectedCategory.path}</p>
                      )}
                      {markAsLastOnFirstProduct === 'true' && !selectedCategory.allowItemEntry && (
                        <p className="text-xs text-blue-600 mt-1">
                          ⓘ Will become Product Category after first product
                        </p>
                      )}
                    </div>
                    <Button
                      type="button"
                      variant="ghost"
                      size="sm"
                      onClick={clearCategory}
                      className="h-8 w-8 p-0"
                    >
                      <X className="h-4 w-4" />
                    </Button>
                  </div>
                ) : (
                  <div className="relative">
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value)
                          setShowCategoryDropdown(true)
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder={isEditMode ? "Select new category (optional)" : "Search product category..."}
                        className="pl-9"
                      />
                    </div>
                    {showCategoryDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            {leafCategories.length === 0
                              ? "No Product with Product Entry enabled"
                              : "No matching Product"}
                          </div>
                        ) : (
                          filteredCategories.map((cat) => (
                            <div
                              key={cat.id || cat.id}
                              className="p-3 hover:bg-muted cursor-pointer border-b last:border-b-0"
                              onClick={() => handleCategorySelect(cat)}
                            >
                              <p className="font-medium text-foreground">{cat.name}</p>
                              {cat.path && (
                                <p className="text-xs text-muted-foreground">{cat.path}</p>
                              )}
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="productName" className="text-sm font-medium">
                  Product Name *
                </Label>
                <Input
                  id="productName"
                  placeholder="Enter product name"
                  value={formData.name}
                  onChange={(e) => updateField("name", e.target.value)}
                  required
                />
              </div>

              <div className="space-y-2">
                <Label htmlFor="unit" className="text-sm font-medium">
                  Unit *
                </Label>
                <Select value={formData.unit} onValueChange={(v) => updateField("unit", v)}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    {UNITS.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit.charAt(0).toUpperCase() + unit.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>

              <div className="space-y-2">
                <Label htmlFor="imageUrl" className="text-sm font-medium">
                  Image URL
                </Label>
                <Input
                  id="imageUrl"
                  placeholder="https://..."
                  value={formData.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                />
              </div>

              <div className="flex items-center justify-between py-3 px-4 bg-muted/50 rounded-lg">
                <Label htmlFor="uniqueIdentifier" className="cursor-pointer">
                  Unique Identifier
                </Label>
                <Switch
                  id="uniqueIdentifier"
                  checked={formData.hasUniqueIdentifier}
                  onCheckedChange={(v) => {
                    updateField("hasUniqueIdentifier", v)
                    if (!v) {
                      updateField("hasSerialNo", false)
                      updateField("hasMacAddress", false)
                      updateField("hasWarranty", false)
                    }
                  }}
                />
              </div>

              {formData.hasUniqueIdentifier && (
                <div className="space-y-3 pl-4 border-l-2 border-primary bg-primary/5 p-4 rounded-r-lg">
                  <div className="flex items-center justify-between">
                    <Label htmlFor="serialNo" className="cursor-pointer">
                      Has Serial Number
                    </Label>
                    <Switch
                      id="serialNo"
                      checked={formData.hasSerialNo}
                      onCheckedChange={(v) => updateField("hasSerialNo", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="macAddress" className="cursor-pointer">
                      Has MAC Address
                    </Label>
                    <Switch
                      id="macAddress"
                      checked={formData.hasMacAddress}
                      onCheckedChange={(v) => updateField("hasMacAddress", v)}
                    />
                  </div>
                  <div className="flex items-center justify-between">
                    <Label htmlFor="warranty" className="cursor-pointer">
                      Has Warranty
                    </Label>
                    <Switch
                      id="warranty"
                      checked={formData.hasWarranty}
                      onCheckedChange={(v) => updateField("hasWarranty", v)}
                    />
                  </div>
                </div>
              )}

              <div className="flex gap-4 pt-4">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleCancel}
                  className="flex-1"
                  disabled={saving}
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!formData.name.trim() || !formData.productGroupId || saving}
                >
                  {saving ? (
                    "Saving..."
                  ) : isEditMode ? (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Update Product
                    </>
                  ) : markAsLastOnFirstProduct === 'true' && !selectedCategory?.allowItemEntry ? (
                    "Create First Product & Mark Category"
                  ) : (
                    "Create Product"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}