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

export default function ProductsCreatePage() {
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
  const [products, setProducts] = useState([])
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)
  const [saving, setSaving] = useState(false)

  // Edit mode states
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProductId, setEditingProductId] = useState("")

  // Refs
  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const categoryContainerRef = useRef(null)

  // Get URL parameters
  const categoryIdFromUrl = searchParams.get('productGroupId')
  const categoryNameFromUrl = searchParams.get('categoryName')
  const markAsLastOnFirstProduct = searchParams.get('markAsLastOnFirstProduct')
  const autoMarkLast = searchParams.get('autoMarkLast')
  const returnCategoryId = searchParams.get('returnCategoryId') // New parameter

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

  // Click outside handler
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryContainerRef.current &&
        !categoryContainerRef.current.contains(event.target) &&
        dropdownRef.current &&
        !dropdownRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false)
      }
    }

    if (showCategoryDropdown) {
      document.addEventListener('mousedown', handleClickOutside)
    }

    return () => {
      document.removeEventListener('mousedown', handleClickOutside)
    }
  }, [showCategoryDropdown])

  useEffect(() => {
    fetchData()

    if (editParam === 'true' && productIdParam) {
      setIsEditMode(true)
      setEditingProductId(productIdParam)

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

      if (productGroupIdParam) {
        setCategorySearch(`Editing product category: ${productGroupIdParam}`)
      }
    }
  }, [])

  const fetchData = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch('http://localhost:5001/categories'),
        fetch('http://localhost:5001/products')
      ])

      if (!categoriesResponse.ok) {
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`)
      }

      const categoriesData = await categoriesResponse.json()
      const productsData = productsResponse.ok ? await productsResponse.json() : []

      let categoriesList = []
      if (Array.isArray(categoriesData)) {
        categoriesList = categoriesData
      } else if (categoriesData && categoriesData.list) {
        categoriesList = categoriesData.list
      }

      const normalizeCategories = (cats) => {
        if (!Array.isArray(cats)) return []

        return cats.map(cat => {
          if (!cat) return null

          return {
            id: cat.id || String(Date.now()),
            name: cat.name || "",
            allowItemEntry: Boolean(cat.allowItemEntry),
            productName: cat.productName || "",
            children: normalizeCategories(cat.children || [])
          }
        }).filter(Boolean)
      }

      const normalizedCategories = normalizeCategories(categoriesList)
      setCategories(normalizedCategories)
      setProducts(Array.isArray(productsData) ? productsData : [])

      if (normalizedCategories.length > 0 && categoryIdFromUrl) {
        const category = findCategoryById(normalizedCategories, categoryIdFromUrl)

        if (category) {
          handleCategorySelect(category)
          setIsCategoryLocked(true)

          if (autoMarkLast === 'true' && !category.allowItemEntry) {
            handleAutoMarkAsLastCategory(category)
          }
        }
      }

      if (isEditMode && normalizedCategories.length > 0 && formData.productGroupId) {
        const category = findCategoryById(normalizedCategories, formData.productGroupId)
        if (category) {
          setSelectedCategory(category)
          setCategorySearch(category.name)
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  const checkProductDuplicateAnywhere = (productName, excludeProductId = null) => {
    if (!productName) return false

    const normalizedProductName = productName.trim().toLowerCase()

    return products.some(product => {
      if (excludeProductId && (product.id === excludeProductId || product._id === excludeProductId)) {
        return false
      }

      const existingProductName = (product.productName || product.name || "").trim().toLowerCase()
      return existingProductName === normalizedProductName
    })
  }

  const findCategoryById = (cats, id) => {
    if (!cats || !Array.isArray(cats)) return null

    for (const cat of cats) {
      if (String(cat.id) === String(id)) {
        return cat
      }

      if (cat.children && Array.isArray(cat.children)) {
        const found = findCategoryById(cat.children, id)
        if (found) return found
      }
    }
    return null
  }

  const handleAutoMarkAsLastCategory = async (category) => {
    try {
      const updateCategoryInTree = (cats, targetId) => {
        return cats.map((cat) => {
          if (cat.id === targetId) {
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

      const updatedCategories = updateCategoryInTree(categories, category.id)

      const response = await fetch('http://localhost:5001/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ list: updatedCategories }),
      })

      if (response.ok) {
        setCategories(updatedCategories)
        const updatedCategory = findCategoryById(updatedCategories, category.id)
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
    setSelectedCategory(category)
    setFormData(prev => ({
      ...prev,
      productGroupId: String(category.id)
    }))
    setCategorySearch(category.path || category.name)
    setShowCategoryDropdown(false)
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

  // Navigate back to categories page with the same category
  const navigateBackToCategories = () => {
    // If we have returnCategoryId, use it
    if (returnCategoryId) {
      router.push(`/products-group?returnCategoryId=${returnCategoryId}`)
    } else if (selectedCategory) {
      // Otherwise use current selected category
      router.push(`/products-group?returnCategoryId=${selectedCategory.id}`)
    } else if (categoryIdFromUrl) {
      // Or use category from URL
      router.push(`/products-group?returnCategoryId=${categoryIdFromUrl}`)
    } else {
      // Fallback to home
      router.push('/products-group')
    }
  }

  const handleSubmit = async (e) => {
    e.preventDefault()

    if (!formData.name.trim()) {
      alert("Please enter product name")
      return
    }

    if (!formData.productGroupId) {
      alert("Please select a Product Group")
      return
    }

    // Check for duplicate product
    const isDuplicate = checkProductDuplicateAnywhere(
      formData.name,
      isEditMode ? editingProductId : null
    )

    if (isDuplicate) {
      alert(`❌ Product "${formData.name}" already exists in the system!\n\nYou cannot create a product with the same name anywhere.`)
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

    try {
      setSaving(true)

      if (isEditMode) {
        // EDIT MODE
        try {
          const putResponse = await fetch(`http://localhost:5001/products/${editingProductId}`, {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(productData),
          })

          if (putResponse.ok) {
            alert("✅ Product updated successfully!")
            navigateBackToCategories()
            return
          }
        } catch (error) {
          console.error("Error updating product:", error)
        }

        // Fallback method
        try {
          const getResponse = await fetch('http://localhost:5001/products')
          
          if (!getResponse.ok) {
            throw new Error(`Failed to fetch products: ${getResponse.status}`)
          }

          const allProducts = await getResponse.json()

          const updatedProducts = allProducts.map(product => {
            if (product.id === editingProductId || product._id === editingProductId) {
              return productData
            }
            return product
          })

          const saveResponse = await fetch('http://localhost:5001/products', {
            method: 'PUT',
            headers: {
              'Content-Type': 'application/json',
            },
            body: JSON.stringify(updatedProducts),
          })

          if (saveResponse.ok) {
            alert("✅ Product updated successfully!")
            navigateBackToCategories()
          } else {
            throw new Error(`Failed to save: ${saveResponse.status}`)
          }
        } catch (finalError) {
          console.error('Final error:', finalError)
          alert(`❌ Failed to update product: ${finalError.message}`)
        }
      } else {
        // CREATE MODE
        const response = await fetch('http://localhost:5001/products', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(productData),
        })

        if (response.ok) {
          console.log("Product created successfully")

          if (markAsLastOnFirstProduct === 'true' && selectedCategory && !selectedCategory.allowItemEntry) {
            console.log("Marking category as last on first product")
            await handleAutoMarkAsLastCategory(selectedCategory)
          }

          alert("✅ Product created successfully!")
          navigateBackToCategories()
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
    navigateBackToCategories()
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

            {!isEditMode && markAsLastOnFirstProduct === 'true' && selectedCategory && !selectedCategory.allowItemEntry && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-300 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Note:</span> This Product Group will be marked as a "Product Product Group" after you create the first product.
                </p>
              </div>
            )}
          </div>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            {returnCategoryId || selectedCategory || categoryIdFromUrl ? "Back to Product Group" : "Back"}
          </Button>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Product Information" : "Product Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                   Product Group *
                </Label>

                {isEditMode && selectedCategory ? (
                  <div className="p-3 bg-blue-50 border border-blue-300 rounded-md">
                    <div className="flex items-center gap-3">
                      <div>
                        <p className="font-medium text-blue-700">
                          {selectedCategory.name}
                        </p>
                        <p className="text-xs text-blue-600 mt-1">
                          Current Product Group for editing
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
                            URL Product Group: {categoryNameFromUrl}
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
                          ⓘ Will become Product Product Group after first product
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
                  <div className="relative" ref={categoryContainerRef}>
                    <div className="relative">
                      <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                      <Input
                        ref={inputRef}
                        value={categorySearch}
                        onChange={(e) => {
                          setCategorySearch(e.target.value)
                          setShowCategoryDropdown(true)
                        }}
                        onFocus={() => setShowCategoryDropdown(true)}
                        placeholder={isEditMode ? "Select new Product Group (optional)" : "Search product Product Group..."}
                        className="pl-9"
                      />
                    </div>
                    {showCategoryDropdown && (
                      <div
                        ref={dropdownRef}
                        className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto"
                      >
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            {leafCategories.length === 0
                              ? "No Product with Product Entry enabled"
                              : "No matching Product"}
                          </div>
                        ) : (
                          filteredCategories.map((cat) => (
                            <div
                              key={cat.id}
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
                <p className="text-xs text-muted-foreground">
                  Product name must be unique across all categories
                </p>
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
                    "Create First Product & Mark Product Group"
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