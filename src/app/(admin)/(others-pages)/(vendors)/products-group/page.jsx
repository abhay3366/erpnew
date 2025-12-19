"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CategoryTable } from "@/components/category/category-table"
import { CategoryForm } from "@/components/category/category-form"
import { CategorySearchModal } from "@/components/category/category-search-modal"
import { CategoryTreeModal } from "@/components/category/category-tree-modal"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { ArrowLeft, Home, Search, GitBranch, Package, Plus, Filter, X, View } from "lucide-react"
import { ProductTable } from "@/components/products/ProductTable"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
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

  // Fetch categories and products from JSON Server
  useEffect(() => {
    fetchCategoriesAndProducts()
  }, [])

  const fetchCategoriesAndProducts = async () => {
    try {
      setLoading(true)
      const [categoriesResponse, productsResponse] = await Promise.all([
        fetch('http://localhost:5001/categories'),
        fetch('http://localhost:5001/products')
      ])

      if (!categoriesResponse.ok || !productsResponse.ok) {
        throw new Error(`HTTP error! status: ${categoriesResponse.status}`)
      }

      const categoriesData = await categoriesResponse.json()
      const productsData = await productsResponse.json()

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

    } catch (error) {
      console.error('Error fetching data:', error)
      setCategories([])
      setProducts([])
    } finally {
      setLoading(false)
    }
  }

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

      // Update local state with normalized data
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

  // Check if current level has only one category
  const hasSingleCategoryInCurrentLevel = () => {
    const currentCats = getCurrentCategories()
    return currentCats.length === 1
  }

  // Check if current parent has children
  const currentParentHasChildren = () => {
    const currentParent = getCurrentParent()
    return currentParent && currentParent.children && currentParent.children.length > 0
  }

  // Check if current parent is a leaf node (has no children)
  const isCurrentParentLeafNode = () => {
    const currentParent = getCurrentParent()
    return currentParent && (!currentParent.children || currentParent.children.length === 0)
  }

  // Check if we are in a last category (product category)
  const isInLastCategory = () => {
    const currentParent = getCurrentParent()
    return currentParent ? currentParent.allowItemEntry : false
  }

  // Check if we should show Add Item button
  const shouldShowAddItem = () => {
    // If we're already in a last category, always show Add Item
    if (isInLastCategory()) return true

    const currentParent = getCurrentParent()
    if (!currentParent) return false

    // Check if current parent is NOT already a product category
    if (currentParent.allowItemEntry) return false

    // Get the categories at current level (children of current parent)
    const currentCats = getCurrentCategories()

    // CASE 1: If we're INSIDE a single category and it has NO sub-categories
    // (i.e., current level is empty because the single category has no children)
    if (currentCats.length === 0 && isCurrentParentLeafNode()) {
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

  // Get filtered products for current last category
  const getFilteredProductsForCurrentCategory = () => {
    const allProducts = getProductsForCurrentCategory()

    return allProducts.filter((product) => {
      if (!product) return false

      const productName = product.name || product.productName || ""

      // Filter by unit
      if (filterUnit !== "all" && product.unit !== filterUnit) {
        return false
      }

      // Filter by unique identifier
      if (filterUniqueId === "yes" && !product.hasUniqueIdentifier) {
        return false
      }
      if (filterUniqueId === "no" && product.hasUniqueIdentifier) {
        return false
      }

      // Search filter
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

  const handleCreate = async ({ name, productName }) => {
    const newCategory = {
      id: Date.now().toString(),
      name: name.trim(),
      allowItemEntry: false,
      productName: productName || "",
      children: [],
    }

    const currentParent = getCurrentParent()

    // Function to add category to the tree
    const addCategoryToTree = (cats, targetId, newCat) => {
      if (!Array.isArray(cats)) return cats

      return cats.map((cat) => {
        if (!cat) return cat

        if (cat.id === targetId) {
          // Check if parent is already a product category
          if (cat.allowItemEntry) {
            alert(`Cannot add sub-category because "${cat.name}" is already a product category.`)
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
      // Add as root category
      updatedCategories = [...categories, newCategory]
    }

    // Save to server
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
    // First check if this category or any of its children have products
    try {
      // Get all category IDs in the hierarchy
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

      // Get all category IDs in this hierarchy
      const categoryHierarchy = findCategoryById(categories, category.id)
      const allCategoryIdsInHierarchy = getAllCategoryIdsInHierarchy(categoryHierarchy)

      // Check if any product belongs to any category in this hierarchy
      const productsInHierarchy = Array.isArray(products)
        ? products.filter(product => allCategoryIdsInHierarchy.includes(product.productGroupId))
        : []

      if (productsInHierarchy.length > 0) {
        let errorMessage = `Cannot delete "${category.name}" because:\n\n`

        const categoryWithProducts = findCategoryById(categories, productsInHierarchy[0].productGroupId)
        if (categoryWithProducts) {
          errorMessage += `• "${categoryWithProducts.name}" has ${productsInHierarchy.length} product(s)\n`
        }

        errorMessage += `\nPlease delete all products in these categories first.`
        alert(errorMessage)
        return
      }
    } catch (error) {
      console.error("Error checking products:", error)
      alert("Cannot delete category at the moment. Please try again later.")
      return
    }

    // Only proceed if no products found in entire hierarchy
    if (!confirm(`Are you sure you want to delete "${category.name}" and all its sub-categories?`)) return

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
    // Reset product filters when navigating to a new category
    if (category.allowItemEntry) {
      resetProductFilters()
    }
    // Navigate within categories
    setCurrentPath([...currentPath, { id: category.id, name: category.name }])
  }

  const handleAddProductDirectly = () => {
    const currentParent = getCurrentParent()
    if (!currentParent) return

    const currentCats = getCurrentCategories()

    // If in last category, go to products page for this category
    if (currentParent.allowItemEntry) {
      router.push(`/products?productGroupId=${currentParent.id}&categoryName=${encodeURIComponent(currentParent.name)}`)
      return
    }

    // If we're inside a single category that has no children
    if (currentCats.length === 0 && isCurrentParentLeafNode()) {
      // Mark as last category and go to products page
      handleMarkAsLastAndAddProduct(currentParent)
      return
    }

    alert("Cannot add items at this level. Please navigate to a single category with no sub-categories.")
  }

  const handleAddProduct = async (category) => {
    // Check if category has children
    if (category.children && category.children.length > 0) {
      alert(`Cannot add items to "${category.name}" because it has sub-categories.\n\nPlease remove all sub-categories first.`)
      return
    }

    // Check if category is already a product category
    if (category.allowItemEntry) {
      // Just go to products page
      router.push(`/products?productGroupId=${category.id}&categoryName=${encodeURIComponent(category.name)}`)
    } else {
      // Mark as last category and go to products page
      handleMarkAsLastAndAddProduct(category)
    }
  }

  const handleMarkAsLastAndAddProduct = async (category) => {
    if (confirm(`Mark "${category.name}" as a product category and add items?\n\nOnce marked as product category, you cannot add sub-categories to it.`)) {
      // Mark the category as allowItemEntry
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
        // Refresh categories and navigate to products page
        await fetchCategoriesAndProducts()
        router.push(`/products?productGroupId=${category.id}&categoryName=${encodeURIComponent(category.name)}&markAsLastOnFirstProduct=true`)
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
    // Reset product filters when going back
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

    // Check if we're at a product category level
    if (currentParent && currentParent.allowItemEntry) {
      alert(`Cannot add category because "${currentParent.name}" is already a product category.`)
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

  // Check if we are in a last category
  const inLastCategory = isInLastCategory()
  const currentParent = getCurrentParent()
  const currentCategories = getCurrentCategories()
  const currentProducts = getProductsForCurrentCategory()
  const filteredProducts = getFilteredProductsForCurrentCategory()
  const uniqueUnits = getUniqueUnitsForCurrentProducts()
  const shouldShowAddItemButton = shouldShowAddItem()
  const isInsideSingleCategory = currentCategories.length === 0 && currentParent && !currentParentHasChildren()

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
                  Product Category
                </span>
              )}
              {isInsideSingleCategory && !inLastCategory && (
                <span className="ml-2 text-sm bg-blue-100 text-blue-800 px-2 py-1 rounded-full">
                  Single Category
                </span>
              )}
            </h1>
            {inLastCategory ? (
              <p className="text-sm text-gray-600 mt-1">
                ✓ This is a product category. You can add and manage products here.
              </p>
            ) : isInsideSingleCategory ? (
              <p className="text-sm text-gray-600 mt-1">
                ✓ You are inside a single category. You can mark it as a product category to add items.
              </p>
            ) : null}
          </div>
          <div className="flex items-center gap-2">
            <Button onClick={ViewProductFn} className="bg-blue-600 hover:bg-blue-700">
              <View className="h-4 w-4 mr-2" />
              View All Products
            </Button>
            <Button onClick={() => setSearchOpen(true)} className="bg-blue-600 hover:bg-blue-700">
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button onClick={() => setTreeOpen(true)} className="bg-purple-600 hover:bg-purple-700">
              <GitBranch className="h-4 w-4 mr-2" />
              Tree Structure
            </Button>
          </div>
        </div>

        <div className="bg-card rounded-lg border p-4 mb-4">
          <div className="flex items-center gap-2 flex-wrap">
            <button
              onClick={() => handleBreadcrumbClick(-1)}
              className={`flex items-center gap-1 px-2 py-1 rounded-md text-sm font-medium transition-colors ${currentPath.length === 0
                ? "bg-orange-100 text-orange-700"
                : "text-muted-foreground hover:text-foreground hover:bg-muted"
                }`}
            >
              <Home className="h-4 w-4" />
              Home
            </button>
            {currentPath.map((item, index) => (
              <div key={item.id} className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${index === currentPath.length - 1
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
            <Button variant="secondary" onClick={handleBack}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back
            </Button>
          )}

          {/* Create Category Button - Show when not in last category and not inside a single leaf category */}
          {!inLastCategory && (
            <Button onClick={handleAddRoot} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          )}

          {/* Show Add Item button when inside a single category (with no children) */}
          {shouldShowAddItemButton && (
            <Button
              onClick={handleAddProductDirectly}
              className="bg-green-600 hover:bg-green-700 ml-auto"
              variant="default"
              title="Add product to this category"
            >
              <Package className="h-4 w-4 mr-2" />
              Add Item
            </Button>
          )}
        </div>

        {/* Show message if inside a single category but it's not marked as last category */}
        {/* {isInsideSingleCategory && !inLastCategory && (
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4 mb-4">
            <div className="flex items-start gap-3">
              <Package className="h-5 w-5 text-blue-600 mt-0.5" />
              <div>
                <h3 className="font-medium text-blue-800">Ready to Add Products?</h3>
                <p className="text-blue-600 text-sm mt-1">
                  This category has no sub-categories. Click "Add Item" to mark it as a product category and start adding products.
                </p>
              </div>
            </div>
          </div>
        )} */}

        {/* Show Products Table if in last category */}
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
                <ProductTable
                  products={filteredProducts}
                  categories={categories}
                  onDelete={async (product) => {
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
                  }}
                  showActions={true}
                  compact={false}
                />
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
          /* Show Categories Table if not in last category */
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