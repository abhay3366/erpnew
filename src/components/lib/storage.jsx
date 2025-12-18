// JSON Server API URL
const API_BASE_URL = 'http://localhost:5001'

// Generate unique ID
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// ============ CATEGORIES ============
export async function getCategories() {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`)
    if (!response.ok) throw new Error('Failed to fetch categories')

    const data = await response.json()
    // JSON Server में data format: { list: [...] } या सीधे array
    return data.list || data || []
  } catch (error) {
    console.error('Error fetching categories:', error)
    return []
  }
}

export async function saveCategories(categories) {
  try {
    const response = await fetch(`${API_BASE_URL}/categories`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ list: categories }),
    })

    if (!response.ok) throw new Error('Failed to save categories')
    return await response.json()
  } catch (error) {
    console.error('Error saving categories:', error)
    throw error
  }
}

// ============ PRODUCTS ============
export async function getProducts() {
  try {
    const response = await fetch(`${API_BASE_URL}/products`)
    if (!response.ok) throw new Error('Failed to fetch products')

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching products:', error)
    return []
  }
}

export async function saveProduct(product) {
  try {
    const response = await fetch(`${API_BASE_URL}/products`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    })

    if (!response.ok) throw new Error('Failed to save product')
    return await response.json()
  } catch (error) {
    console.error('Error saving product:', error)
    throw error
  }
}

export async function updateProduct(id, product) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(product),
    })

    if (!response.ok) throw new Error('Failed to update product')
    return await response.json()
  } catch (error) {
    console.error('Error updating product:', error)
    throw error
  }
}

export async function deleteProduct(id) {
  try {
    const response = await fetch(`${API_BASE_URL}/products/${id}`, {
      method: 'DELETE',
    })

    if (!response.ok) throw new Error('Failed to delete product')
    return true
  } catch (error) {
    console.error('Error deleting product:', error)
    throw error
  }
}

// ============ VENDORS ============
export async function getVendors() {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors`)
    if (!response.ok) throw new Error('Failed to fetch vendors')

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching vendors:', error)
    return []
  }
}

export async function saveVendor(vendor) {
  try {
    const response = await fetch(`${API_BASE_URL}/vendors`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(vendor),
    })

    if (!response.ok) throw new Error('Failed to save vendor')
    return await response.json()
  } catch (error) {
    console.error('Error saving vendor:', error)
    throw error
  }
}

// ============ STOCK ENTRIES ============
export async function getStockEntries() {
  try {
    const response = await fetch(`${API_BASE_URL}/stockEntries`)
    if (!response.ok) throw new Error('Failed to fetch stock entries')

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching stock entries:', error)
    return []
  }
}

export async function saveStockEntry(entry) {
  try {
    const response = await fetch(`${API_BASE_URL}/stockEntries`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(entry),
    })

    if (!response.ok) throw new Error('Failed to save stock entry')
    return await response.json()
  } catch (error) {
    console.error('Error saving stock entry:', error)
    throw error
  }
}

// ============ TRANSFERS ============
export async function getTransfers() {
  try {
    const response = await fetch(`${API_BASE_URL}/transfers`)
    if (!response.ok) throw new Error('Failed to fetch transfers')

    const data = await response.json()
    return Array.isArray(data) ? data : []
  } catch (error) {
    console.error('Error fetching transfers:', error)
    return []
  }
}

export async function saveTransfer(transfer) {
  try {
    const response = await fetch(`${API_BASE_URL}/transfers`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(transfer),
    })

    if (!response.ok) throw new Error('Failed to save transfer')
    return await response.json()
  } catch (error) {
    console.error('Error saving transfer:', error)
    throw error
  }
}

// ============ WAREHOUSES ============
export async function getWarehouses() {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses`)
    if (!response.ok) throw new Error('Failed to fetch warehouses')

    const data = await response.json()

    // अगर कोई warehouses नहीं हैं, default create करें
    if (!Array.isArray(data) || data.length === 0) {
      const defaultWarehouses = [
        { id: generateId(), name: "Azadpur", location: "Delhi" },
        { id: generateId(), name: "Yotta", location: "Mumbai" },
        { id: generateId(), name: "Mumbai Central", location: "Mumbai" },
      ]

      // Save default warehouses
      for (const warehouse of defaultWarehouses) {
        await fetch(`${API_BASE_URL}/warehouses`, {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
          },
          body: JSON.stringify(warehouse),
        })
      }

      return defaultWarehouses
    }

    return data
  } catch (error) {
    console.error('Error fetching warehouses:', error)
    return []
  }
}

export async function saveWarehouse(warehouse) {
  try {
    const response = await fetch(`${API_BASE_URL}/warehouses`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(warehouse),
    })

    if (!response.ok) throw new Error('Failed to save warehouse')
    return await response.json()
  } catch (error) {
    console.error('Error saving warehouse:', error)
    throw error
  }
}

// ============ HELPER FUNCTIONS ============

// Helper to find category path
export function getCategoryPath(categories, categoryId) {
  if (!categories || !Array.isArray(categories) || !categoryId) return []

  const findPath = (cats, targetId, path = []) => {
    for (const cat of cats) {
      const newPath = [...path, cat.name]

      // Check both id and id
      if (String(cat.id) === String(targetId) || String(cat.id) === String(targetId)) {
        return newPath
      }

      if (cat.children && cat.children.length) {
        const result = findPath(cat.children, targetId, newPath)
        if (result) return result
      }
    }
    return null
  }

  return findPath(categories, categoryId) || []
}

// Helper to check if category name exists (case-insensitive)
export function categoryNameExists(categories, name, excludeId = null) {
  if (!categories || !Array.isArray(categories)) return false

  const normalizedName = name.toLowerCase().trim()

  const checkInCategories = (cats) => {
    for (const cat of cats) {
      if ((cat.id !== excludeId && cat.id !== excludeId) &&
        cat.name.toLowerCase().trim() === normalizedName) {
        return true
      }
      if (cat.children && cat.children.length && checkInCategories(cat.children)) {
        return true
      }
    }
    return false
  }

  return checkInCategories(categories)
}

// Helper to find category by ID
export function findCategoryById(categories, categoryId) {
  if (!categories || !Array.isArray(categories) || !categoryId) return null

  for (const cat of categories) {
    if (cat.id === categoryId || cat.id === categoryId) return cat
    if (cat.children && cat.children.length) {
      const found = findCategoryById(cat.children, categoryId)
      if (found) return found
    }
  }
  return null
}

// Helper to flatten categories for selection
export function flattenCategories(categories, level = 0, parentPath = "") {
  if (!categories || !Array.isArray(categories)) return []

  let result = []
  for (const cat of categories) {
    const path = parentPath ? `${parentPath}/${cat.name}` : `/${cat.name}`
    const hasChildren = cat.children && cat.children.length > 0
    result.push({
      ...cat,
      level,
      path,
      hasChildren,
      allowItemEntry: cat.allowItemEntry || false,
    })
    if (hasChildren) {
      result = [...result, ...flattenCategories(cat.children, level + 1, path)]
    }
  }
  return result
}

// Helper to get only leaf categories with allowItemEntry
export function getLeafCategoriesWithProducts(categories) {
  if (!categories || !Array.isArray(categories)) return []

  const flat = flattenCategories(categories)
  return flat.filter((cat) => !cat.hasChildren && cat.allowItemEntry)
}

import { clsx } from 'clsx'
import { twMerge } from 'tailwind-merge'

export function cn(...inputs) {
  return twMerge(clsx(inputs))
}