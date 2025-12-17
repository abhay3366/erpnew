"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card"
import { ArrowLeft, Package, Search, X, Lock } from "lucide-react"

const UNITS = ["pieces", "meter", "liter", "kg"]

export default function ProductsPage() {
  const router = useRouter()
  const searchParams = useSearchParams()
  
  const [formData, setFormData] = useState({
    name: "",
    categoryId: "",
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
  
  const categoryIdFromUrl = searchParams.get('categoryId')
  const categoryNameFromUrl = searchParams.get('categoryName')

  useEffect(() => {
    fetchCategories()
  }, [])

  useEffect(() => {
    if (categories.length > 0 && categoryIdFromUrl) {
      console.log("URL Category ID:", categoryIdFromUrl)
      console.log("Available Categories:", categories)
      
      const category = findCategoryById(categories, categoryIdFromUrl)
      console.log("Found Category:", category)
      
      if (category) {
        handleCategorySelect(category)
        setIsCategoryLocked(true)
      } else {
        console.log("Category not found with ID:", categoryIdFromUrl)
      }
    }
  }, [categories, categoryIdFromUrl])

  const fetchCategories = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5002/categories')
      
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
            _id: cat._id || cat.id || String(Date.now()),
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
      console.log("Checking category:", cat._id, "against:", id)
      
      if (String(cat._id) === String(id) || String(cat.id) === String(id)) {
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
      categoryId: String(category._id || category.id)
    }))
    setCategorySearch(category.path || category.name)
    setShowCategoryDropdown(false)
  }

  const clearCategory = () => {
    if (isCategoryLocked) {
      alert("Category is locked. Go back to categories page to change.")
      return
    }
    setSelectedCategory(null)
    setFormData(prev => ({
      ...prev,
      categoryId: ""
    }))
    setCategorySearch("")
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
    
    if (!formData.categoryId) {
      alert("Please select a category")
      return
    }
    
    const productData = {
      id: Date.now().toString(),
      categoryId: formData.categoryId,
      productName: formData.name.trim(),
      unit: formData.unit,
      sku: `SKU-${Date.now()}`,
      image: formData.imageUrl,
      hasUniqueIdentifier: formData.hasUniqueIdentifier,
      hasSerialNo: formData.hasSerialNo,
      hasMacAddress: formData.hasMacAddress,
      hasWarranty: formData.hasWarranty,
      createdAt: new Date().toISOString()
    }

    console.log("Saving product:", productData)

    try {
      const response = await fetch('http://localhost:5002/products', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(productData),
      })

      if (response.ok) {
        alert("Product created successfully!")
        router.push('/categories')
        if (isCategoryLocked) {
          // Reset form but keep category
          setFormData(prev => ({
            ...prev,
            name: "",
            unit: "pieces",
            imageUrl: "",
            hasUniqueIdentifier: false,
            hasSerialNo: false,
            hasMacAddress: false,
            hasWarranty: false,
          }))
        } else {
          router.push('/products-group')
        }
      } else {
        alert("Failed to create product")
      }
    } catch (error) {
      console.error('Error saving product:', error)
      alert("Error creating product")
    }
  }

  const handleCancel = () => {
    router.push('/products-group')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading Prodcust Group...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6" />
              Create Product
            </h1>
            <p className="text-muted-foreground mt-1">Add new product to your inventory</p>
          </div>
          <Button variant="outline" onClick={handleCancel}>
            <ArrowLeft className="h-4 w-4 mr-2" />
            Back to Product Groups
          </Button>
        </div>
        
        <Card>
          <CardHeader>
            <CardTitle>Product Information</CardTitle>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-5">
              {/* Category selection */}
              <div className="space-y-2">
                <Label htmlFor="category" className="text-sm font-medium">
                  Product Category *
                </Label>
                
                {isCategoryLocked && selectedCategory ? (
                  <div className="p-3 bg-green-50 border border-green-300 rounded-md">
                    <div className="flex items-center justify-between">
                      <div className="flex items-center gap-3">
                        <Lock className="h-5 w-5 text-green-600" />
                        <div>
                          <p className="font-medium text-green-700">
                            {selectedCategory.name}
                          </p>
                          <p className="text-sm text-green-600 mt-1">
                            Category locked from category page
                          </p>
                          {categoryNameFromUrl && (
                            <p className="text-xs text-green-600 mt-1">
                              URL Category: {categoryNameFromUrl}
                            </p>
                          )}
                        </div>
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
                        placeholder="Search product category..."
                        className="pl-9"
                      />
                    </div>
                    {showCategoryDropdown && (
                      <div className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-60 overflow-y-auto">
                        {filteredCategories.length === 0 ? (
                          <div className="p-3 text-center text-muted-foreground text-sm">
                            {leafCategories.length === 0
                              ? "No Products Gruop with Product Entry enabled"
                              : "No matching Products Gruop"}
                          </div>
                        ) : (
                          filteredCategories.map((cat) => (
                            <div
                              key={cat._id || cat.id}
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
                >
                  Cancel
                </Button>
                <Button
                  type="submit"
                  className="flex-1 bg-green-600 hover:bg-green-700"
                  disabled={!formData.name.trim() || !formData.categoryId}
                >
                  Create Product
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>
      </main>
    </div>
  )
}