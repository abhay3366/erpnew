"use client"

import { useEffect, useState, useRef } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Search, X, Lock, Save, Upload, Eye, EyeOff, Settings, Edit } from "lucide-react"
import { Badge } from "@/components/ui/badge"

const UNITS = ["pieces", "meter", "liter", "kg"]

export default function CreateProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()

  const [formData, setFormData] = useState({
    name: "",
    productGroupId: "",
    unit: "pieces",
    imageUrl: "",
    identifierType: null,
    selectedFieldIds: []
  })

  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [fieldMasters, setFieldMasters] = useState([])
  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const [loading, setLoading] = useState(true)
  const [selectedCategory, setSelectedCategory] = useState(null)
  const [isCategoryLocked, setIsCategoryLocked] = useState(false)
  const [saving, setSaving] = useState(false)
  const [imagePreview, setImagePreview] = useState("")
  const [showImagePreview, setShowImagePreview] = useState(false)

  const [isEditMode, setIsEditMode] = useState(false)
  const [editingProductId, setEditingProductId] = useState("")

  const dropdownRef = useRef(null)
  const inputRef = useRef(null)
  const categoryContainerRef = useRef(null)
  const fileInputRef = useRef(null)

  // URL parameters
  const editId = searchParams.get('edit')
  const productGroupIdFromUrl = searchParams.get('productGroupId')
  const categoryNameFromUrl = searchParams.get('categoryName')
  const markAsLastOnFirstProduct = searchParams.get('markAsLastOnFirstProduct')
  const returnCategoryId = searchParams.get('returnCategoryId')

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
    if (formData.imageUrl) {
      setImagePreview(formData.imageUrl)
    }
  }, [formData.imageUrl])

  useEffect(() => {
    fetchData()
  }, [])

  // Load existing product data if edit mode
  useEffect(() => {
    if (editId && !loading) {
      loadExistingProductData(editId)
    }
  }, [editId, loading])

  const fetchData = async () => {
    try {
      setLoading(true)

      const [categoriesResponse, productsResponse, fieldMastersResponse] = await Promise.all([
        fetch('http://localhost:5001/categories'),
        fetch('http://localhost:5001/products'),
        fetch('http://localhost:5001/fieldMasters')
      ])

      const categoriesData = await categoriesResponse.json()
      const productsData = productsResponse.ok ? await productsResponse.json() : []
      const fieldMastersData = fieldMastersResponse.ok ? await fieldMastersResponse.json() : []

      let categoriesList = []
      if (categoriesData && categoriesData.list) {
        categoriesList = categoriesData.list
      } else if (Array.isArray(categoriesData)) {
        categoriesList = categoriesData
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

      // Filter only active field masters
      const activeFieldMasters = Array.isArray(fieldMastersData)
        ? fieldMastersData.filter(field => field.isActive !== false) // Show only active fields (default to true if undefined)
        : []
      setFieldMasters(activeFieldMasters)

      // Auto-select category from URL
      if (productGroupIdFromUrl && normalizedCategories.length > 0) {
        const category = findCategoryById(normalizedCategories, productGroupIdFromUrl)
        if (category) {
          handleCategorySelect(category)
          setIsCategoryLocked(true)
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
    } finally {
      setLoading(false)
    }
  }

  // Get only active fields filtered by applicableFor
  const getActiveFieldsByApplicableFor = (applicableForType) => {
    return fieldMasters.filter(field => {
      // Check if field is active (default to true if not specified)
      const isFieldActive = field.isActive !== false

      // Check if field has applicableFor and includes the requested type
      const hasApplicableFor = field.applicableFor &&
        Array.isArray(field.applicableFor) &&
        field.applicableFor.includes(applicableForType)

      return isFieldActive && hasApplicableFor
    })
  }

  // Load existing product data for edit
  const loadExistingProductData = async (productId) => {
    try {
      setIsEditMode(true)
      setEditingProductId(productId)

      const response = await fetch(`http://localhost:5001/products/${productId}`)
      if (!response.ok) throw new Error("Failed to fetch product")

      const existingProduct = await response.json()

      console.log("📝 Editing product:", existingProduct)

      // Set form data
      setFormData({
        name: existingProduct.productName || "",
        productGroupId: existingProduct.productGroupId || "",
        unit: existingProduct.unit || "pieces",
        imageUrl: existingProduct.image || "",
        identifierType: existingProduct.identifierType || null,
        selectedFieldIds: existingProduct.selectedFieldIds || []
      })

      // Select category
      if (existingProduct.productGroupId && categories.length > 0) {
        const category = findCategoryById(categories, existingProduct.productGroupId)
        if (category) {
          setSelectedCategory(category)
          setCategorySearch(category.name)
        }
      }

    } catch (error) {
      console.error("Error loading product data:", error)
      alert("Failed to load product data")
    }
  }

  const checkProductDuplicateAnywhere = (productName, excludeProductId = null) => {
    if (!productName) return false

    const normalizedProductName = productName.trim().toLowerCase()

    return products.some(product => {
      if (excludeProductId && product.id === excludeProductId) {
        return false
      }

      const existingProductName = (product.productName || "").trim().toLowerCase()
      return existingProductName === normalizedProductName
    })
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

  const getSelectedFieldDetails = () => {
    return fieldMasters.filter(field =>
      formData.selectedFieldIds.includes(field.id)
    )
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

  const handleImagePaste = (e) => {
    const items = (e.clipboardData || window.clipboardData).items;
    for (let i = 0; i < items.length; i++) {
      if (items[i].type.indexOf('image') !== -1) {
        const blob = items[i].getAsFile();
        const reader = new FileReader();
        reader.onload = function (event) {
          setFormData(prev => ({ ...prev, imageUrl: event.target.result }))
        };
        reader.readAsDataURL(blob);
        break;
      }
    }
  }

  const handleFileUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      const reader = new FileReader();
      reader.onload = function (event) {
        setFormData(prev => ({ ...prev, imageUrl: event.target.result }))
      };
      reader.readAsDataURL(file);
    }
  }

  const triggerFileUpload = () => {
    fileInputRef.current?.click();
  }

  const clearImage = () => {
    setFormData(prev => ({ ...prev, imageUrl: "" }))
    setImagePreview("")
  }

  const navigateBackToCategories = () => {
    if (returnCategoryId) {
      router.push(`/products-group?returnCategoryId=${returnCategoryId}`)
    } else if (selectedCategory) {
      router.push(`/products-group?returnCategoryId=${selectedCategory.id}`)
    } else if (productGroupIdFromUrl) {
      router.push(`/products-group?returnCategoryId=${productGroupIdFromUrl}`)
    } else {
      router.push('/products-group')
    }
  }

  const toggleField = (fieldId, checked) => {
    setFormData(prev => {
      let newSelectedIds
      if (checked) {
        newSelectedIds = [...prev.selectedFieldIds, fieldId]
      } else {
        newSelectedIds = prev.selectedFieldIds.filter(id => id !== fieldId)
      }
      return {
        ...prev,
        selectedFieldIds: newSelectedIds
      }
    })
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

    // Get field configurations with isRequired
    const fieldConfigurations = getSelectedFieldDetails().map(field => ({
      fieldId: field.id,
      key: field.key,
      label: field.label,
      type: field.type,
      isRequired: field.isRequired || false
    }))

    const productData = {
      id: isEditMode ? editingProductId : `P${Date.now()}`,
      productGroupId: formData.productGroupId,
      productName: formData.name.trim(),
      unit: formData.unit,
      sku: isEditMode ? `SKU-${editingProductId}` : `SKU-${Date.now()}`,
      image: formData.imageUrl,
      identifierType: formData.identifierType,
      selectedFieldIds: formData.selectedFieldIds,
      fieldConfigurations: fieldConfigurations,
      createdAt: isEditMode ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString(),
      isActive: true
    }

    console.log("💾 Saving product data:", productData)

    try {
      setSaving(true)

      if (isEditMode) {
        const response = await fetch(`http://localhost:5001/products/${editingProductId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        })

        if (response.ok) {
          alert("✅ Product updated successfully!")
          navigateBackToCategories()
        } else {
          throw new Error(`Failed to update: ${response.status}`)
        }
      } else {
        const response = await fetch('http://localhost:5001/products', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(productData),
        })

        if (response.ok) {
          console.log("Product created successfully")

          // Mark category as last on first product
          if (markAsLastOnFirstProduct === 'true' && selectedCategory && !selectedCategory.allowItemEntry) {
            console.log("Marking category as last on first product")
            await handleAutoMarkAsLastCategory(selectedCategory)
          }

          alert("✅ Product created successfully!")
          navigateBackToCategories()
        } else {
          const errorText = await response.text()
          throw new Error(`Failed to create: ${response.status} - ${errorText}`)
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

  const navigateToFieldMasters = () => {
    router.push('/fieldmaster')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading...</p>
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
              {isEditMode ? <Edit className="h-6 w-6" /> : <Package className="h-6 w-6" />}
              {isEditMode ? "Edit Product" : "Create Product"}
            </h1>
            <p className="text-muted-foreground mt-1">
              {isEditMode ? "Update product information" : "Add new product to your inventory"}
            </p>

            {/* Edit mode info */}
            {isEditMode && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-200 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Editing Product ID:</span> {editingProductId}
                </p>
              </div>
            )}

            {/* First product note */}
            {!isEditMode && markAsLastOnFirstProduct === 'true' && selectedCategory && !selectedCategory.allowItemEntry && (
              <div className="mt-2 p-2 bg-blue-50 border border-blue-300 rounded-md">
                <p className="text-sm text-blue-700">
                  <span className="font-medium">Note:</span> This Product Group will be marked as a "Product Product Group" after you create the first product.
                </p>
              </div>
            )}
          </div>
          <div className="flex items-center gap-2">
            <Button variant="outline" onClick={handleCancel}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              {returnCategoryId || selectedCategory || productGroupIdFromUrl ? "Back to Product Group" : "Back"}
            </Button>
            <Button variant="outline" onClick={navigateToFieldMasters}>
              <Settings className="h-4 w-4 mr-2" />
              Manage Fields
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <CardTitle>{isEditMode ? "Edit Product Information" : "Product Information"}</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Product Group Selection */}
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

              {/* Product Name */}
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

              {/* Unit Selection */}
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

              {/* Image URL */}
              <div className="space-y-2">
                <div className="flex items-center justify-between">
                  <Label htmlFor="imageUrl" className="text-sm font-medium">
                    Image URL
                  </Label>
                  <div className="flex items-center gap-2">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileUpload}
                      accept="image/*"
                      className="hidden"
                    />
                    <Button
                      type="button"
                      variant="outline"
                      size="sm"
                      onClick={triggerFileUpload}
                      className="h-8"
                    >
                      <Upload className="h-4 w-4 mr-1" />
                      Upload
                    </Button>
                    {imagePreview && (
                      <Button
                        type="button"
                        variant="outline"
                        size="sm"
                        onClick={() => setShowImagePreview(!showImagePreview)}
                        className="h-8"
                      >
                        {showImagePreview ? <EyeOff className="h-4 w-4 mr-1" /> : <Eye className="h-4 w-4 mr-1" />}
                        {showImagePreview ? "Hide" : "Preview"}
                      </Button>
                    )}
                  </div>
                </div>
                <Input
                  id="imageUrl"
                  placeholder="https://... or paste image"
                  value={formData.imageUrl}
                  onChange={(e) => updateField("imageUrl", e.target.value)}
                  onPaste={handleImagePaste}
                />
                <p className="text-xs text-muted-foreground">
                  Enter URL or paste image from clipboard or upload file
                </p>

                {showImagePreview && imagePreview && (
                  <div className="mt-2 p-2 border rounded-lg">
                    <div className="flex items-center justify-between mb-2">
                      <span className="text-sm font-medium">Image Preview</span>
                      <Button
                        type="button"
                        variant="ghost"
                        size="sm"
                        onClick={clearImage}
                        className="h-6 w-6 p-0"
                      >
                        <X className="h-4 w-4" />
                      </Button>
                    </div>
                    <div className="flex justify-center">
                      <img
                        src={imagePreview}
                        alt="Preview"
                        className="max-h-40 max-w-full object-contain rounded"
                        onError={(e) => {
                          e.target.onerror = null;
                          e.target.src = "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='200' height='150' viewBox='0 0 200 150'%3E%3Crect width='200' height='150' fill='%23f3f4f6'/%3E%3Ctext x='50%' y='50%' font-family='Arial' font-size='14' fill='%236b7280' text-anchor='middle' dy='.3em'%3EInvalid Image URL%3C/text%3E%3C/svg%3E";
                        }}
                      />
                    </div>
                  </div>
                )}
              </div>

              {/* FIELD CONFIGURATION SECTION */}
              <div className="space-y-4">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold">Field Configuration</h3>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                  {/* Non-Unique Identifier */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 px-4 bg-green-50 rounded-lg border border-green-200">
                      <Label className="cursor-pointer text-base font-medium">
                        Non-Unique Identifier
                      </Label>
                      <Switch
                        checked={formData.identifierType === "NON_UNIQUE"}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            identifierType: checked ? "NON_UNIQUE" : null,
                            selectedFieldIds: []
                          }))
                        }}
                      />
                    </div>

                    {formData.identifierType === "NON_UNIQUE" && (
                      <div className="space-y-3 pl-4 border-l-2 border-green-500">
                        {getActiveFieldsByApplicableFor("NON_UNIQUE").length === 0 ? (
                          <div className="p-3 text-center text-gray-500 bg-gray-50 rounded-lg">
                            <p className="text-sm">No active fields available for Non-Unique Identifier</p>
                            <p className="text-xs mt-1">
                              Go to <Button
                                variant="link"
                                className="h-auto p-0 text-blue-600"
                                onClick={navigateToFieldMasters}
                              >
                                Field Masters
                              </Button> to create or activate fields
                            </p>
                          </div>
                        ) : (
                          getActiveFieldsByApplicableFor("NON_UNIQUE").map(field => (
                            <div key={field.id} className="flex justify-between items-center p-1 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Label className="cursor-pointer">
                                  {field.label}
                                  {field.isRequired && (
                                    <span className="ml-1 text-red-500">*</span>
                                  )}
                                </Label>
                              </div>
                              <Switch
                                checked={formData.selectedFieldIds.includes(field.id)}
                                onCheckedChange={(checked) => toggleField(field.id, checked)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>

                  {/* Unique Identifier */}
                  <div className="space-y-3">
                    <div className="flex items-center justify-between py-3 px-4 bg-blue-50 rounded-lg border border-blue-200">
                      <Label className="cursor-pointer text-base font-medium">
                        Unique Identifier
                      </Label>
                      <Switch
                        checked={formData.identifierType === "UNIQUE"}
                        onCheckedChange={(checked) => {
                          setFormData(prev => ({
                            ...prev,
                            identifierType: checked ? "UNIQUE" : null,
                            selectedFieldIds: []
                          }))
                        }}
                      />
                    </div>

                    {formData.identifierType === "UNIQUE" && (
                      <div className="space-y-3 pl-4 border-l-2 border-blue-500">
                        {getActiveFieldsByApplicableFor("UNIQUE").length === 0 ? (
                          <div className="p-3 text-center text-gray-500 bg-gray-50 rounded-lg">
                            <p className="text-sm">No active fields available for Unique Identifier</p>
                            <p className="text-xs mt-1">
                              Go to <Button
                                variant="link"
                                className="h-auto p-0 text-blue-600"
                                onClick={navigateToFieldMasters}
                              >
                                Field Masters
                              </Button> to create or activate fields
                            </p>
                          </div>
                        ) : (
                          getActiveFieldsByApplicableFor("UNIQUE").map(field => (
                            <div key={field.id} className="flex justify-between items-center p-1 hover:bg-gray-50 rounded">
                              <div className="flex items-center gap-2">
                                <Label className="cursor-pointer">
                                  {field.label}
                                  {field.isRequired && (
                                    <span className="ml-1 text-red-500">*</span>
                                  )}
                                </Label>
                              </div>
                              <Switch
                                checked={formData.selectedFieldIds.includes(field.id)}
                                onCheckedChange={(checked) => toggleField(field.id, checked)}
                              />
                            </div>
                          ))
                        )}
                      </div>
                    )}
                  </div>
                </div>
              </div>

              {/* Submit Buttons */}
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