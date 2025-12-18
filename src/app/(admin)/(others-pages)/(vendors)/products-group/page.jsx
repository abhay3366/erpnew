"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CategoryTable } from "@/components/category/category-table"
import { CategoryForm } from "@/components/category/category-form"
import { CategorySearchModal } from "@/components/category/category-search-modal"
import { CategoryTreeModal } from "@/components/category/category-tree-modal"
import { Button } from "@/components/ui/button"
import { ArrowLeft, Home, Search, GitBranch, Package, Plus } from "lucide-react"

export default function CategoriesPage() {
  const [categories, setCategories] = useState([])
  const [formOpen, setFormOpen] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)
  const [treeOpen, setTreeOpen] = useState(false)
  const [editingCategory, setEditingCategory] = useState(null)
  const [parentCategory, setParentCategory] = useState(null)
  const [currentPath, setCurrentPath] = useState([])
  const router = useRouter()

  // Fetch categories from JSON Server
  useEffect(() => {
    fetchCategories()
  }, [])

  const fetchCategories = async () => {
    try {
      const response = await fetch('http://localhost:5001/categories')

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`)
      }

      const data = await response.json()

      // Handle different response formats
      let categoriesList = []
      if (data && data.list) {
        categoriesList = data.list
      } else if (Array.isArray(data)) {
        categoriesList = data
      }

      // Deep normalize the fetched data
      const deepNormalize = (items) => {
        if (!Array.isArray(items)) return []

        return items.map(item => {
          if (!item) return { _id: Date.now().toString(), name: "Unknown", children: [] }

          return {
            _id: item._id || Date.now().toString(),
            name: item.name || "",
            allowItemEntry: Boolean(item.allowItemEntry),
            productName: item.productName || "",
            children: deepNormalize(item.children || [])
          }
        })
      }

      const normalizedCategories = deepNormalize(categoriesList)
      setCategories(normalizedCategories)

    } catch (error) {
      console.error('Error fetching categories:', error)
      setCategories([])
    }
  }

  const saveCategoriesToServer = async (categoriesData) => {
    try {
      const deepNormalize = (data) => {
        if (Array.isArray(data)) {
          return data.map(item => {
            if (!item) return { _id: Date.now().toString(), name: "Unknown", children: [] }

            return {
              _id: item._id || Date.now().toString(),
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

      console.log("Saving to server:", JSON.stringify(normalizedData, null, 2))

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
      const found = current.find((c) => c._id === pathItem._id)
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
    return findCategoryById(categories, currentPath[currentPath.length - 1]._id)
  }

  const getParentPathString = () => {
    if (currentPath.length === 0) return ""
    return "/" + currentPath.map((p) => p.name).join("/")
  }

  // Helper function to find category by ID
  const findCategoryById = (cats, id) => {
    if (!cats || !Array.isArray(cats)) return null

    for (const cat of cats) {
      if (String(cat._id) === String(id)) {
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

  // Check if current category has children
  const hasChildren = (category) => {
    return category && category.children && category.children.length > 0
  }

  // Check if current category is eligible for "Add Item"
  const shouldShowAddItem = () => {
    const currentParent = getCurrentParent()
    if (!currentParent) return false
    
    const currentCats = getCurrentCategories()
    
    // CASE 1: If current level has NO categories (empty), show Add Item
    if (currentCats.length <= 0) {
      return true
    }
    
    // CASE 2: If current category is already a product category, always show Add Item
    if (currentParent.allowItemEntry) return false
    
    // CASE 3: Check if single category exists AND it has NO children
    if (hasSingleCategoryInCurrentLevel()) {
      const singleCategory = currentCats[0]
      // Check if the single category has NO children (leaf node)
      if (!singleCategory.children || singleCategory.children.length < 0) {
        return true
      }
    }
    
    return false
  }

  const handleCreate = async ({ name, productName }) => {
    const newCategory = {
      _id: Date.now().toString(),
      name: name.trim(),
      allowItemEntry: false, // Always false when creating
      productName: productName || "",
      children: [],
    }

    const currentParent = getCurrentParent()

    // Function to add category to the tree
    const addCategoryToTree = (cats, targetId, newCat) => {
      if (!Array.isArray(cats)) return cats

      return cats.map((cat) => {
        if (!cat) return cat

        if (cat._id === targetId) {
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
      updatedCategories = addCategoryToTree(categories, currentParent._id, newCategory)
    } else if (parentCategory) {
      updatedCategories = addCategoryToTree(categories, parentCategory._id, newCategory)
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
        if (cat._id === editingCategory._id) {
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
    if (!confirm(`Are you sure you want to delete "${category.name}"?`)) return

    const deleteCategory = (cats) => {
      return cats
        .filter((cat) => cat._id !== category._id)
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
    // ALWAYS navigate within categories - never go to products page
    setCurrentPath([...currentPath, { _id: category._id, name: category.name }])
  }

  const handleAddProductDirectly = () => {
    const currentParent = getCurrentParent()
    const currentCats = getCurrentCategories()
    
    if (currentParent) {
      // If already a product category
      if (currentParent.allowItemEntry) {
        // Go to products page WITHOUT marking (already marked)
        router.push(`/products?categoryId=${currentParent._id}&categoryName=${encodeURIComponent(currentParent.name)}`)
        return
      }

      // Check if current level has NO categories (empty)
      if (currentCats.length === 0) {
        // Go to products page WITHOUT automatic marking
        router.push(`/products?categoryId=${currentParent._id}&categoryName=${encodeURIComponent(currentParent.name)}&markAsLastOnFirstProduct=true`)
        return
      }

      // Check if current level has only one category AND it has NO children
      if (hasSingleCategoryInCurrentLevel()) {
        const singleCategory = currentCats[0]
        
        // Check if single category has children
        if (singleCategory.children && singleCategory.children.length > 0) {
          alert(`Cannot add items to "${singleCategory.name}" because it has sub-categories.\n\nPlease remove all sub-categories first.`)
          return
        }
        
        // Go to products page WITHOUT automatic marking
        router.push(`/products?categoryId=${singleCategory._id}&categoryName=${encodeURIComponent(singleCategory.name)}&markAsLastOnFirstProduct=true`)
        return
      }

      // If multiple categories exist
      alert(`"Add Item" is only available when there is exactly one category in this level.\n\nCurrent level has ${getCurrentCategories().length} categories.`)
    }
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
      router.push(`/products?categoryId=${category._id}&categoryName=${encodeURIComponent(category.name)}`)
    } else {
      // Go to products page WITHOUT automatic marking
      router.push(`/products?categoryId=${category._id}&categoryName=${encodeURIComponent(category.name)}&markAsLastOnFirstProduct=true`)
    }
  }

  const handleBreadcrumbClick = (index) => {
    if (index === -1) {
      setCurrentPath([])
    } else {
      setCurrentPath(currentPath.slice(0, index + 1))
    }
  }

  const handleBack = () => {
    setCurrentPath(currentPath.slice(0, -1))
  }

  const handleSearchSelect = (category) => {
    const buildPath = (cats, targetId, path = []) => {
      for (const cat of cats) {
        if (cat._id === targetId) {
          return [...path, { _id: cat._id, name: cat.name }]
        }
        if (cat.children && Array.isArray(cat.children)) {
          const result = buildPath(cat.children, targetId, [...path, { _id: cat._id, name: cat.name }])
          if (result) return result
        }
      }
      return null
    }

    const newPath = buildPath(categories, category._id, [])
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

  const currentCategories = getCurrentCategories()
  const currentParent = getCurrentParent()
  const currentParentName = currentPath.length > 0 ? currentPath[currentPath.length - 1].name : "Home"

  const isCurrentCategoryProductCategory = currentParent ? currentParent.allowItemEntry : false
  const shouldShowAddItemButton = shouldShowAddItem()

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-2">
        <div className="flex items-start justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold flex items-center gap-2">
              <Home className="h-6 w-6" />
              {currentParentName}
              {isCurrentCategoryProductCategory && (
                <span className="ml-2 text-sm bg-green-100 text-green-800 px-2 py-1 rounded-full">
                  Product Category
                </span>
              )}
            </h1>
            {currentParent && isCurrentCategoryProductCategory && (
              <p className="text-sm text-gray-600 mt-1">
                ✓ This is a product category. You can add products directly here.
              </p>
            )}
          </div>
          <div className="flex items-center gap-2">
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
              <div key={item._id} className="flex items-center gap-2">
                <span className="text-muted-foreground">/</span>
                <button
                  onClick={() => handleBreadcrumbClick(index)}
                  className={`px-2 py-1 rounded-md text-sm font-medium transition-colors ${index === currentPath.length - 1
                    ? isCurrentCategoryProductCategory ? "bg-green-100 text-green-800" : "bg-orange-100 text-orange-700"
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
          
          {/* Create Category Button - Show when not in product category */}
          {!isCurrentCategoryProductCategory && (
            <Button onClick={handleAddRoot} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Category
            </Button>
          )}
          
          {/* Show Add Item button only when conditions are met */}
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

        <div className="bg-card rounded-lg border">
          <CategoryTable
            categories={currentCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onNavigate={handleNavigate}
            onAddProduct={handleAddProduct}
            parentPath={getParentPathString()}
            isParentProductCategory={isCurrentCategoryProductCategory}
            shouldShowAddItemOnlyForSingleCategory={true}
          />
        </div>

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