"use client"

import { useEffect, useState } from "react"
import { useRouter, useSearchParams } from "next/navigation"
import { CategoryTable } from "@/components/category/category-table"
import { CategoryForm } from "@/components/category/category-form"
import { CategorySearchModal } from "@/components/category/category-search-modal"
import { CategoryTreeModal } from "@/components/category/category-tree-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Home, Search, GitBranch, Package, Plus, Filter, X, View, Eye, Edit, Trash2, FileText, Hash, Calendar, Type, CheckCircle, XCircle, ChevronDown, MoreHorizontal } from "lucide-react"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import {
  Popover,
  PopoverContent,
  PopoverTrigger,
} from "@/components/ui/popover"
import { Separator } from "@/components/ui/separator"

export default function CreateProductGroup() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [fieldMastersData, setFieldMastersData] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [parentCategory, setParentCategory] = useState(null)
  const [currentPath, setCurrentPath] = useState([])
  const [loading, setLoading] = useState(true)

  // Filter states for products in last category
  const [productSearchQuery, setProductSearchQuery] = useState("")
  const [filterUnit, setFilterUnit] = useState("all")
  const [filterUniqueId, setFilterUniqueId] = useState("all")

  const router = useRouter()
  const searchParams = useSearchParams()

  // Load from URL when component mounts
  useEffect(() => {
    fetchCategoriesAndProducts()
    
    // Check if we have a return category ID from products page
    const returnCategoryId = searchParams.get('returnCategoryId')
    if (returnCategoryId) {
      console.log("Returning from products page with category ID:", returnCategoryId)
      
      // Wait for categories to load, then find and navigate to this category
      setTimeout(() => {
        const category = findCategoryById(categories, returnCategoryId)
        if (category) {
          console.log("Found category:", category.name)
          // Build path to this category
          const path = buildPathToCategory(categories, returnCategoryId)
          if (path && path.length > 0) {
            console.log("Setting path:", path)
            setCurrentPath(path)
          }
        }
      }, 500)
    }
  }, [searchParams])

  // Build path to a specific category
  const buildPathToCategory = (cats, targetId, path = []) => {
    for (const cat of cats) {
      if (cat.id === targetId) {
        return [...path, { id: cat.id, name: cat.name }]
      }
      if (cat.children && Array.isArray(cat.children)) {
        const result = buildPathToCategory(cat.children, targetId, [...path, { id: cat.id, name: cat.name }])
        if (result) return result
      }
    }
    return null
  }

  const fetchCategoriesAndProducts = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, productsResponse, fieldMastersResponse] = await Promise.all([
        fetch('http://localhost:5001/categories'),
        fetch('http://localhost:5001/products'),
        fetch('http://localhost:5001/fieldMasters')
      ])

      if (!categoriesResponse.ok || !productsResponse.ok) {
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`)
      }

      const categoriesData = await categoriesResponse.json()
      const productsData = await productsResponse.json()
      const fieldMastersData = await fieldMastersResponse.json()

      // Handle different response formats for categories
      let categoriesList = []
      if (categoriesData && categoriesData.list) {
        categoriesList = categoriesData.list
      } else if (Array.isArray(categoriesData)) {
        categoriesList = categoriesData
      }

      // Deep normalize the fetched data
      const deepNormalize = (items) => {
        if (!Array.isArray(items)) return []

        return items.map(item => {
          if (!item) return { id: Date.now().toString(), name: "Unknown", children: [] }

          return {
            id: item.id || Date.now().toString(),
            name: item.name || "",
            allowItemEntry: Boolean(item.allowItemEntry),
            productName: item.productName || "",
            children: deepNormalize(item.children || [])
          }
        })
      }

      const normalizedCategories = deepNormalize(categoriesList)
      setCategories(normalizedCategories)
      setProducts(productsData || [])
      setFieldMastersData(fieldMastersData || [])

      // Check for returnCategoryId after loading categories
      const returnCategoryId = searchParams.get('returnCategoryId')
      if (returnCategoryId && normalizedCategories.length > 0) {
        const category = findCategoryById(normalizedCategories, returnCategoryId)
        if (category) {
          const path = buildPathToCategory(normalizedCategories, returnCategoryId)
          if (path && path.length > 0) {
            setCurrentPath(path)
          }
        }
      }

    } catch (error) {
      console.error('Error fetching data:', error)
      setCategories([])
      setProducts([])
      setFieldMastersData([])
    } finally {
      setLoading(false)
    }
  }

  // Save categories function
  const saveCategoriesToServer = async (categoriesData) => {
    try {
      const deepNormalize = (data) => {
        if (Array.isArray(data)) {
          return data.map(item => {
            if (!item) return { id: Date.now().toString(), name: "Unknown", children: [] }

            return {
              id: item.id || Date.now().toString(),
              name: item.name || "",
              allowItemEntry: Boolean(item.allowItemEntry),
              productName: item.productName || "",
              children: deepNormalize(item.children || [])
            }
          })
        }
        return []
      }

      const normalizedData = deepNormalize(categoriesData)

      const response = await fetch('http://localhost:5001/categories', {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ list: normalizedData }),
      })

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      setCategories(normalizedData)
      return true
    } catch (error) {
      console.error('Error saving categories:', error)
      return false
    }
  }

  const getCurrentCategories = () => {
    if (currentPath.length === 0) return categories

    let current = categories
    for (const pathItem of currentPath) {
      const found = current.find((c) => c.id === pathItem.id)
      if (found) {
        current = Array.isArray(found.children) ? found.children : []
      } else {
        return []
      }
    }
    return current
  }

  const getCurrentParent = () => {
    if (currentPath.length === 0) return null
    return findCategoryById(categories, currentPath[currentPath.length - 1].id)
  }

  const getParentPathString = () => {
    if (currentPath.length === 0) return ""
    return "/" + currentPath.map((p) => p.name).join("/")
  }

  // Helper function to find category by ID
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

  // Check if we are in a last category (product category)
  const isInLastCategory = () => {
    const currentParent = getCurrentParent()
    return currentParent ? currentParent.allowItemEntry : false
  }

  // Check if we should show Add Item button
  const shouldShowAddItem = () => {
    if (isInLastCategory()) return true

    const currentParent = getCurrentParent()
    if (!currentParent) return false

    if (currentParent.allowItemEntry) return false

    const currentCats = getCurrentCategories()
    const isCurrentParentLeafNode = currentParent && (!currentParent.children || currentParent.children.length === 0)

    if (currentCats.length === 0 && isCurrentParentLeafNode) {
      return true
    }

    return false
  }

  // Get products for current last category
  const getProductsForCurrentCategory = () => {
    const currentParent = getCurrentParent()
    if (!currentParent || !currentParent.allowItemEntry) return []

    return products.filter(product => product.productGroupId === currentParent.id)
  }

  // Get field configurations for a product
  const getFieldConfigurations = (product) => {
    // If product has fieldConfigurations array, use it
    if (product.fieldConfigurations && product.fieldConfigurations.length > 0) {
      return product.fieldConfigurations
    }
    
    // If product has selectedFieldIds, create fieldConfigurations from fieldMasters
    if (product.selectedFieldIds && product.selectedFieldIds.length > 0 && fieldMastersData.length > 0) {
      return product.selectedFieldIds.map(fieldId => {
        const fieldMaster = fieldMastersData.find(fm => fm.id === fieldId)
        return fieldMaster ? {
          fieldId: fieldMaster.id,
          key: fieldMaster.key,
          label: fieldMaster.label,
          type: fieldMaster.type,
          isRequired: fieldMaster.isRequired || false,
          applicableFor: fieldMaster.applicableFor || []
        } : null
      }).filter(field => field !== null)
    }
    
    return []
  }

  // Function to get field icon based on type
  const getFieldIcon = (type) => {
    switch(type?.toLowerCase()) {
      case 'text': return <FileText className="h-3 w-3" />
      case 'number': return <Hash className="h-3 w-3" />
      case 'date': return <Calendar className="h-3 w-3" />
      default: return <Type className="h-3 w-3" />
    }
  }

  // Function to render selected fields for a product with popup for more fields
  const renderSelectedFields = (product) => {
    const fieldConfigs = getFieldConfigurations(product)
    
    return (
      <div className="space-y-2">
        
        {/* Selected Fields List - Show first 2 fields, rest in popup */}
        {fieldConfigs.length > 0 ? (
          <div className="space-y-1">
            <div className="flex flex-wrap gap-1">
              {fieldConfigs.slice(0, 2).map((field) => (
                <div 
                  key={field.fieldId} 
                  className="inline-flex items-center gap-1 px-2 py-1 bg-blue-50 text-blue-700 rounded-md border border-blue-200 text-xs"
                  title={`${field.label} (${field.type})`}
                >
                  {getFieldIcon(field.type)}
                  <span className="truncate max-w-[70px]">{field.label}</span>
                  {field.isRequired && (
                    <span className="text-red-500 font-bold" title="Required">*</span>
                  )}
                </div>
              ))}
              
              {/* More Fields Popup */}
              {fieldConfigs.length > 2 && (
                <Popover>
                  <PopoverTrigger asChild>
                    <Button 
                      variant="ghost" 
                      size="sm" 
                      className="h-6 px-2 text-xs text-muted-foreground hover:text-foreground"
                    >
                      <MoreHorizontal className="h-3 w-3 mr-1" />
                      +{fieldConfigs.length - 2} more
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                  </PopoverTrigger>
                  <PopoverContent className="w-64 p-3" align="start">
                    <div className="space-y-2">
                      <div className="font-medium text-sm">All Selected Fields</div>
                      <Separator />
                      <div className="space-y-2 max-h-60 overflow-y-auto">
                        {fieldConfigs.map((field, index) => (
                          <div 
                            key={field.fieldId} 
                            className="flex items-center justify-between p-2 hover:bg-muted/50 rounded"
                          >
                            <div className="flex items-center gap-2">
                              {getFieldIcon(field.type)}
                              <div>
                                <div className="text-sm font-medium">{field.label}</div>
                                <div className="text-xs text-muted-foreground">
                                  {field.type} • {field.isRequired ? "Required" : "Optional"}
                                </div>
                              </div>
                            </div>
                            <div className="text-xs text-gray-500">
                              {index < 2 ? "Shown" : "Hidden"}
                            </div>
                          </div>
                        ))}
                      </div>
                      <div className="text-xs text-muted-foreground pt-2 border-t">
                        {fieldConfigs.length} fields selected for {product.identifierType}
                      </div>
                    </div>
                  </PopoverContent>
                </Popover>
              )}
            </div>
          </div>
        ) : (
          <div className="text-xs text-gray-500 italic">
            No fields selected
          </div>
        )}
      </div>
    )
  }

  // Get filtered products
  const getFilteredProductsForCurrentCategory = () => {
    const allProducts = getProductsForCurrentCategory()

    return allProducts.filter((product) => {
      if (!product) return false

      const productName = product.name || product.productName || ""

      if (filterUnit !== "all" && product.unit !== filterUnit) {
        return false
      }

      if (filterUniqueId === "yes" && product.identifierType !== "UNIQUE") {
        return false
      }
      if (filterUniqueId === "no" && product.identifierType === "UNIQUE") {
        return false
      }

      if (productSearchQuery) {
        const query = productSearchQuery.toLowerCase()
        const productSku = product.sku?.toLowerCase() || ""
        const nameMatch = productName.toLowerCase().includes(query)
        const skuMatch = productSku.includes(query)

        if (!nameMatch && !skuMatch) {
          return false
        }
      }

      return true
    })
  }

  // Get category name by ID
  const getCategoryName = (categoryId) => {
    const findCategory = (cats, id) => {
      for (const cat of cats) {
        if (cat.id === id) return cat.name
        if (cat.children && cat.children.length > 0) {
          const found = findCategory(cat.children, id)
          if (found) return found
        }
      }
      return "Unknown Category"
    }
    
    return findCategory(categories, categoryId)
  }

  const handleCreate = async ({ name, productName }) => {
    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      allowItemEntry: false,
      productName: productName || "",
      children: [],
    }

    const currentParent = getCurrentParent()

    const addCategoryToTree = (cats, targetId, newCat) => {
      if (!Array.isArray(cats)) return cats

      return cats.map((cat) => {
        if (!cat) return cat

        if (cat.id === targetId) {
          if (cat.allowItemEntry) {
            alert(`Cannot add sub-Product Group because "${cat.name}" is already a product Product Group.`)
            return cat
          }

          return {
            ...cat,
            children: [...(Array.isArray(cat.children) ? cat.children : []), newCat]
          }
        }

        if (cat.children && Array.isArray(cat.children)) {
          return {
            ...cat,
            children: addCategoryToTree(cat.children, targetId, newCat)
          }
        }

        return cat
      })
    }

    let updatedCategories = []

    if (currentParent) {
      updatedCategories = addCategoryToTree(categories, currentParent.id, newCategory)
    } else if (parentCategory) {
      updatedCategories = addCategoryToTree(categories, parentCategory.id, newCategory)
    } else {
      updatedCategories = [...categories, newCategory]
    }

    const success = await saveCategoriesToServer(updatedCategories)

    if (success) {
      setParentCategory(null)
      setFormOpen(false)
    } else {
      alert("Failed to save category. Please try again.")
    }
  }

  const handleUpdate = async ({ name, productName }) => {
    if (!editingCategory) return

    const updateCategory = (cats) => {
      return cats.map((cat) => {
        if (cat.id === editingCategory.id) {
          return {
            ...cat,
            name,
            productName: productName || "",
            children: cat.children || []
          }
        }
        if (cat.children && Array.isArray(cat.children)) {
          return { ...cat, children: updateCategory(cat.children) }
        }
        return cat
      })
    }

    const updated = updateCategory(categories)
    const success = await saveCategoriesToServer(updated)

    if (success) {
      setEditingCategory(null)
      setFormOpen(false)
    }
  }

  const handleDelete = async (category) => {
    const getAllCategoryIdsInHierarchy = (cat, ids = []) => {
      if (!cat) return ids

      ids.push(cat.id)
      if (cat.children && Array.isArray(cat.children)) {
        cat.children.forEach(child => {
          getAllCategoryIdsInHierarchy(child, ids)
        })
      }
      return ids
    }

    const categoryHierarchy = findCategoryById(categories, category.id)
    const allCategoryIdsInHierarchy = getAllCategoryIdsInHierarchy(categoryHierarchy)

    const productsInHierarchy = Array.isArray(products)
      ? products.filter(product => allCategoryIdsInHierarchy.includes(product.productGroupId))
      : []

    if (productsInHierarchy.length > 0) {
      let errorMessage = `Cannot delete "${category.name}" because:\n\n`

      const categoryWithProducts = findCategoryById(categories, productsInHierarchy[0].productGroupId)
      if (categoryWithProducts) {
        errorMessage += `• "${categoryWithProducts.name}" has ${productsInHierarchy.length} product(s)\n`
      }

      errorMessage += `\nPlease delete all products in these Product Group first.`
      alert(errorMessage)
      return
    }

    if (!confirm(`Are you sure you want to delete "${category.name}" and all its sub-Product Group?`)) return

    const deleteCategory = (cats) => {
      return cats
        .filter((cat) => cat.id !== category.id)
        .map((cat) => ({
          ...cat,
          children: cat.children && Array.isArray(cat.children) ? deleteCategory(cat.children) : [],
        }))
    }

    const updated = deleteCategory(categories)
    await saveCategoriesToServer(updated)
  }

  const handleEdit = (category) => {
    setEditingCategory(category)
    setParentCategory(null)
    setFormOpen(true)
  }

  const handleNavigate = (category) => {
    const newPath = [...currentPath, { id: category.id, name: category.name }]
    setCurrentPath(newPath)
  }

  const handleAddProductDirectly = () => {
    const currentParent = getCurrentParent()
    if (!currentParent) return

    if (currentParent.allowItemEntry) {
      router.push(`/products?productGroupId=${currentParent.id}&categoryName=${encodeURIComponent(currentParent.name)}&returnCategoryId=${currentParent.id}`)
      return
    }

    const currentCats = getCurrentCategories()
    const isCurrentParentLeafNode = currentParent && (!currentParent.children || currentParent.children.length === 0)

    if (currentCats.length === 0 && isCurrentParentLeafNode) {
      handleMarkAsLastAndAddProduct(currentParent)
      return
    }

    alert("Cannot add Product at this level. Please navigate to a single Product Group with no sub-Product Group.")
  }

  const handleAddProduct = async (category) => {
    if (category.children && category.children.length > 0) {
      alert(`Cannot add Product to "${category.name}" because it has sub-Product Group.\n\nPlease remove all sub-Product Group first.`)
      return
    }

    if (category.allowItemEntry) {
      router.push(`/products?productGroupId=${category.id}&categoryName=${encodeURIComponent(category.name)}&returnCategoryId=${category.id}`)
    } else {
      handleMarkAsLastAndAddProduct(category)
    }
  }

  const handleMarkAsLastAndAddProduct = async (category) => {
    if (confirm(`Mark "${category.name}" as a  Product Group and add Product?\n\nOnce marked as Product Group, you cannot add sub-Product Group to it.`)) {
      const updateCategoryToLast = (cats) => {
        return cats.map((cat) => {
          if (cat.id === category.id) {
            return {
              ...cat,
              allowItemEntry: true,
              productName: cat.productName || ""
            }
          }
          if (cat.children && Array.isArray(cat.children)) {
            return { ...cat, children: updateCategoryToLast(cat.children) }
          }
          return cat
        })
      }

      const updated = updateCategoryToLast(categories)
      const success = await saveCategoriesToServer(updated)

      if (success) {
        await fetchCategoriesAndProducts()
        router.push(`/products?productGroupId=${category.id}&categoryName=${encodeURIComponent(category.name)}&markAsLastOnFirstProduct=true&returnCategoryId=${category.id}`)
      }
    }
  }

  const ViewProductFn = () => {
    router.push('/product-table')
  }

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, index + 1))
    }
  }

  const handleBack = () => {
    resetProductFilters()
    setCurrentPath(currentPath.slice(0, -1))
  }

  const handleSearchSelect = (category) => {
    const buildPath = (cats, targetId, path = []) => {
      for (const cat of cats) {
        if (cat.id === targetId) {
          return [...path, { id: cat.id, name: cat.name }]
        }
        if (cat.children && Array.isArray(cat.children)) {
          const result = buildPath(cat.children, targetId, [...path, { id: cat.id, name: cat.name }])
          if (result) return result
        }
      }
      return null
    }

    const newPath = buildPath(categories, category.id, [])
    if (newPath) {
      setCurrentPath(newPath)
    }
  }

  const handleAddRoot = () => {
    const currentParent = getCurrentParent()

    if (currentParent && currentParent.allowItemEntry) {
      alert(`Cannot add Product Group because "${currentParent.name}" is already a Product Group.`)
      return
    }

    setEditingCategory(null)
    setParentCategory(currentParent)
    setFormOpen(true)
  }

  // Reset product filters
  const resetProductFilters = () => {
    setProductSearchQuery("")
    setFilterUnit("all")
    setFilterUniqueId("all")
  }

  // Get unique units for current category products
  const getUniqueUnitsForCurrentProducts = () => {
    const currentProducts = getProductsForCurrentCategory()
    return [...new Set(currentProducts
      .map((p) => p?.unit)
      .filter(Boolean))]
  }

  // Handle product delete
  const handleProductDelete = async (product) => {
    try {
      const response = await fetch(`http://localhost:5001/products/${product.id}`, {
        method: 'DELETE',
      })
      if (response.ok) {
        await fetchCategoriesAndProducts() // Refresh data
      }
    } catch (error) {
      console.error("Error deleting product:", error)
      alert("Failed to delete product")
    }
  }

  // Check if we are in a last category
  const inLastCategory = isInLastCategory()
  const currentParent = getCurrentParent()
  const currentCategories = getCurrentCategories()
  const currentProducts = getProductsForCurrentCategory()
  const filteredProducts = getFilteredProductsForCurrentCategory()
  const uniqueUnits = getUniqueUnitsForCurrentProducts()
  const shouldShowAddItemButton = shouldShowAddItem()
  const isCurrentParentLeafNode = currentParent && (!currentParent.children || currentParent.children.length === 0)
  const isInsideSingleCategory = currentCategories.length === 0 && currentParent && isCurrentParentLeafNode

  if (loading) {
    return (
      <div className="min-h-screen bg-background flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto mb-4"></div>
          <p>Loading...</p>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-2">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Home className="h-6 w-6" />
              {currentParent ? currentParent.name : "Home"}
              {inLastCategory && (
                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Product Group
                </span>
              )}
            </h1>
            {inLastCategory ? (
              <p className="text-sm text-gray-600 mt-1 text-[0.7em]">
                ✓ This is a Product Group. You can add and manage products here.
              </p>
            ) : isInsideSingleCategory ? (
              <p className="text-sm text-gray-600 mt-1 text-[0.7em]">
                ✓ You are inside a single Product Group. You can mark it as a Product Group to add Products.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={ViewProductFn} className="bg-blue-600 hover:bg-blue-700 text-[0.7em]">
              <View className="h-3 w-3 mr-1" />
              View All Products
            </Button>
            <Button onClick={() => setSearchOpen(true)} className="bg-blue-600 hover:bg-blue-700 text-[0.7em]">
              <Search className="h-3 w-3 mr-1" />
              Search
            </Button>
            <Button onClick={() => setTreeOpen(true)} className="bg-purple-600 hover:bg-purple-700 text-[0.7em]">
              <GitBranch className="h-3 w-3 mr-1" />
              Tree Structure
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-2 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${currentPath.length === 0
                ? "bg-orange-100 text-orange-700"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              <Home className="h-3 w-3" />
              Home
            </button>
            {currentPath.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 rounded-md text-[0.7em] font-medium transition-colors ${index === currentPath.length - 1
                    ? inLastCategory ? "bg-green-100 text-green-800" :
                      isInsideSingleCategory ? "bg-blue-100 text-blue-800" : "bg-orange-100 text-orange-700"
                    : "text-muted-foreground hover:text-foreground hover:bg-muted"
                    }`}
                >
                  {item.name}
                </button>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2 mb-4">
          {currentPath.length > 0 && (
            <Button variant="secondary" className="text-[0.7em]" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          {/* Create Product Group Button - Show when not in last Product Group and not inside a single leaf Product Group */}
          {!inLastCategory && (
            <Button onClick={handleAddRoot} className="bg-primary hover:bg-primary/90 text-[0.7em]">
              <Plus className="h-3 w-3 mr-2" />
              Create Product Group
            </Button>
          )}

          {/* Show Add Item button when inside a single category (with no children) */}
          {shouldShowAddItemButton && (
            <Button
              onClick={handleAddProductDirectly}
              className="bg-green-600 hover:bg-green-700 ml-auto text-[0.7em]"
              variant="default"
              title="Add product to this Product Group"
            >
              <Package className="h-4 w-4 mr-2" />
              Add Products
            </Button>
          )}
        </div>

        {/* Show Products Table if in last Product Group */}
        {inLastCategory ? (
          <div className="space-y-4">
            {/* Filters Section for Products */}
            <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">Product Filters</span>
                </div>
                <div className="flex items-center gap-4">
                  <Badge variant="outline">
                    {filteredProducts.length} of {currentProducts.length} Products
                  </Badge>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={fetchCategoriesAndProducts}
                    className="text-xs"
                  >
                    Refresh
                  </Button>
                </div>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search products..."
                    value={productSearchQuery}
                    onChange={(e) => setProductSearchQuery(e.target.value)}
                    className="pl-9"
                  />
                </div>

                <Select value={filterUnit} onValueChange={setFilterUnit}>
                  <SelectTrigger>
                    <SelectValue placeholder="All Units" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Units</SelectItem>
                    {uniqueUnits.map((unit) => (
                      <SelectItem key={unit} value={unit}>
                        {unit}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>

                <Select value={filterUniqueId} onValueChange={setFilterUniqueId}>
                  <SelectTrigger>
                    <SelectValue placeholder="Unique ID" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Products</SelectItem>
                    <SelectItem value="yes">With Unique ID</SelectItem>
                    <SelectItem value="no">Without Unique ID</SelectItem>
                  </SelectContent>
                </Select>

                <Button
                  variant="outline"
                  onClick={resetProductFilters}
                  className="flex items-center gap-2"
                >
                  <X className="h-4 w-4" />
                  Clear Filters
                </Button>
              </div>

              <div className="text-sm text-muted-foreground">
                Showing {filteredProducts.length} of {currentProducts.length} products in "{currentParent.name}"
              </div>
            </div>

            {/* Products Table */}
            <div className="bg-card rounded-lg border p-4">
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-semibold">
                  Products in "{currentParent.name}"
                </h2>
              </div>

              {filteredProducts.length > 0 ? (
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead className="w-[200px]">Product</TableHead>
                        <TableHead className="w-[150px]">Category</TableHead>
                        <TableHead className="w-[100px]">Unit</TableHead>
                        <TableHead className="w-[250px]">Unique ID Fields</TableHead>
                        <TableHead className="w-[150px]">SKU</TableHead>
                        <TableHead className="text-right w-[100px]">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredProducts.map((product) => (
                        <TableRow key={product.id}>
                          <TableCell>
                            <div className="font-medium">{product.productName}</div>
                            {/* <div className="text-xs text-muted-foreground mt-1">ID: {product.id}</div> */}
                          </TableCell>
                          <TableCell>
                            <div className="text-sm">{getCategoryName(product.productGroupId)}</div>
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">{product.unit}</Badge>
                          </TableCell>
                          <TableCell>
                            {renderSelectedFields(product)}
                          </TableCell>
                          <TableCell>
                            <code className="text-sm">{product.sku}</code>
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex items-center justify-end gap-1">
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8"
                                onClick={() => window.open(`/products?edit=${product.id}`)}
                                title="Edit"
                              >
                                <Edit className="h-4 w-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="icon"
                                className="h-8 w-8 text-red-600 hover:text-red-700 hover:bg-red-50"
                                onClick={() => handleProductDelete(product)}
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
                </div>
              ) : (
                <div className="text-center py-12 border rounded-lg">
                  <Package className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
                  <h3 className="font-medium mb-2">No products found</h3>
                  <p className="text-muted-foreground mb-4">
                    {productSearchQuery || filterUnit !== "all" || filterUniqueId !== "all"
                      ? "No products match your filters. Try clearing filters."
                      : `No products in "${currentParent.name}" yet. Click "Add Item" to add your first product.`}
                  </p>
                  {(productSearchQuery || filterUnit !== "all" || filterUniqueId !== "all") && (
                    <Button
                      variant="outline"
                      onClick={resetProductFilters}
                      className="mt-2"
                    >
                      Clear Filters
                    </Button>
                  )}
                </div>
              )}
            </div>
          </div>
        ) : (
          /* Show Product Group Table if not in last Product Group */
          <div className="bg-card rounded-lg border">
            <CategoryTable
              categories={currentCategories}
              onEdit={handleEdit}
              onDelete={handleDelete}
              onNavigate={handleNavigate}
              onAddProduct={handleAddProduct}
              parentPath={getParentPathString()}
              isParentProductCategory={inLastCategory}
              shouldShowAddItemOnlyForSingleCategory={false}
            />
          </div>
        )}

        <CategoryForm
          open={formOpen}
          onOpenChange={setFormOpen}
          onSubmit={editingCategory ? handleUpdate : handleCreate}
          initialData={editingCategory}
          parentCategory={parentCategory || currentParent}
          allCategories={categories}
        />

        <CategorySearchModal
          open={searchOpen}
          onOpenChange={setSearchOpen}
          categories={categories}
          onSelect={handleSearchSelect}
        />

        <CategoryTreeModal
          open={treeOpen}
          onOpenChange={setTreeOpen}
          categories={categories}
          onSelect={handleSearchSelect}
          currentPath={currentPath}
        />
      </main>
    </div>
  )
}