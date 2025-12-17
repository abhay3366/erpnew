"use client"

import { useEffect, useState } from "react"
import { useRouter } from "next/navigation"
import { CategoryTable } from "@/components/category/category-table"
import { CategoryForm } from "@/components/category/category-form"
import { CategorySearchModal } from "@/components/category/category-search-modal"
import { CategoryTreeModal } from "@/components/category/category-tree-modal"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft, Home, Search, GitBranch, Package } from "lucide-react"

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
      const response = await fetch('http://localhost:5002/categories')

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

      const response = await fetch('http://localhost:5002/categories', {
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

  const handleCreate = async ({ name, allowItemEntry, productName }) => {
    const newCategory = {
      _id: Date.now().toString(),
      name: name.trim(),
      allowItemEntry: Boolean(allowItemEntry),
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
      // Check if parent allows sub-categories
      if (currentParent.allowItemEntry) {
        alert(`Cannot add sub-category because "${currentParent.name}" has "Allow Last Product Category" enabled.`)
        return
      }

      updatedCategories = addCategoryToTree(categories, currentParent._id, newCategory)
    } else if (parentCategory) {
      // Check if parent allows sub-categories
      if (parentCategory.allowItemEntry) {
        alert(`Cannot add sub-category because "${parentCategory.name}" has "Allow Last Product Category" enabled.`)
        return
      }

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

  const handleUpdate = async ({ name, allowItemEntry, productName }) => {
    if (!editingCategory) return

    const updateCategory = (cats) => {
      return cats.map((cat) => {
        if (cat._id === editingCategory._id) {
          // When making a category a product category, KEEP existing children
          return {
            ...cat,
            name,
            allowItemEntry: Boolean(allowItemEntry),
            productName: productName || "",
            children: cat.children || [] // Keep existing children
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

  const handleAddChild = (category) => {
    if (category.allowItemEntry) {
      alert(`Cannot add sub-category because "${category.name}" has "Allow Last Product Category" enabled.`)
      return
    }
    setParentCategory(category)
    setEditingCategory(null)
    setFormOpen(true)
  }

  const handleNavigate = (category) => {
    if (category.allowItemEntry) {
      handleAddProduct(category)
      return
    }

    setCurrentPath([...currentPath, { _id: category._id, name: category.name }])
  }

  const handleAddProductDirectly = () => {
    if (currentPath.length > 0) {
      const currentParent = getCurrentParent()

      if (currentParent) {
        // If already a product category, just redirect to products
        if (currentParent.allowItemEntry) {
          router.push(`/products?categoryId=${currentParent._id}&categoryName=${encodeURIComponent(currentParent.name)}`)
          return
        }

        // Check if any child is already a product category
        const findLastCategoryInChildren = (category) => {
          if (category.allowItemEntry) return category

          if (category.children && Array.isArray(category.children)) {
            for (const child of category.children) {
              const found = findLastCategoryInChildren(child)
              if (found) return found
            }
          }
          return null
        }

        const existingLastCategory = findLastCategoryInChildren(currentParent)

        if (existingLastCategory) {
          const useExisting = confirm(
            `"${existingLastCategory.name}" is already a product category.\n\nDo you want to add product to "${existingLastCategory.name}"?`
          )

          if (useExisting) {
            router.push(`/products?categoryId=${existingLastCategory._id}&categoryName=${encodeURIComponent(existingLastCategory.name)}`)
          } else {
            const makeCurrentLast = confirm(
              `Do you want to make "${currentParent.name}" a new product category?\n\nNote: "${existingLastCategory.name}" will remain as a product category.`
            )

            if (makeCurrentLast) {
              // Mark current category as product category
              handleMarkAsProductCategory(currentParent)
            }
          }
          return
        }

        // No existing product category found, ask to make current one
        const confirmCreate = confirm(
          `Make "${currentParent.name}" a product category?\n\nThis will allow you to add products directly to "${currentParent.name}".`
        )

        if (confirmCreate) {
          handleMarkAsProductCategory(currentParent)
        }
      }
    }
  }

  const handleMarkAsProductCategory = async (category) => {
    // Update category to be a product category WITHOUT clearing children
    const updateCategoryToLast = (cats) => {
      return cats.map((cat) => {
        if (cat._id === category._id) {
          return {
            ...cat,
            allowItemEntry: true,
            children: category.children || [] // Keep existing children
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
      // Redirect to products page
      router.push(`/products?categoryId=${category._id}&categoryName=${encodeURIComponent(category.name)}&autoMarkLast=true`)
    }
  }

  const handleAddProduct = async (category) => {
    if (category.allowItemEntry) {
      // Already a product category, go to products page
      router.push(`/products?categoryId=${category._id}&categoryName=${encodeURIComponent(category.name)}`)
    } else {
      // Ask user if they want to make it a product category
      const confirmMakeProductCategory = confirm(
        `Make "${category.name}" a product category?\n\nThis will allow you to add products directly to "${category.name}".`
      )

      if (confirmMakeProductCategory) {
        handleMarkAsProductCategory(category)
      }
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
          return cat.allowItemEntry ? path : [...path, { _id: cat._id, name: cat.name }]
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
    
    if (currentParent && currentParent.allowItemEntry) {
      alert(`Cannot add sub-category because "${currentParent.name}" has "Allow Last Product Category" enabled.`)
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

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-6">
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
                    ? "bg-orange-100 text-orange-700"
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
          
          {!isCurrentCategoryProductCategory && (
            <Button onClick={handleAddRoot} className="bg-primary hover:bg-primary/90">
              <Plus className="h-4 w-4 mr-2" />
              Create Product Category
            </Button>
          )}

          {currentPath.length > 0 && (
            <Button
              onClick={handleAddProductDirectly}
              className="bg-green-600 hover:bg-green-700"
              variant="default"
              title="Add product to this category"
            >
              <Package className="h-4 w-4 mr-2" />
              {isCurrentCategoryProductCategory ? "View Products" : "Add Item"}
              {currentPath.length > 0 && (
                <span className="ml-2 text-xs bg-green-800 px-2 py-0.5 rounded-full">
                  {currentParent?.name}
                </span>
              )}
            </Button>
          )}
        </div>

        <div className="bg-card rounded-lg border">
          <CategoryTable
            categories={currentCategories}
            onEdit={handleEdit}
            onDelete={handleDelete}
            onAddChild={handleAddChild}
            onNavigate={handleNavigate}
            onAddProduct={handleAddProduct}
            parentPath={getParentPathString()}
            isParentProductCategory={isCurrentCategoryProductCategory}
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