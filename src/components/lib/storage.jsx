// Storage utility functions for localStorage operations
const STORAGE_KEYS = {
  CATEGORIES: "inventory_categories",
  PRODUCTS: "inventory_products",
  VENDORS: "inventory_vendors",
  STOCK_ENTRIES: "inventory_stock_entries",
  TRANSFERS: "inventory_transfers",
  WAREHOUSES: "inventory_warehouses",
}

// Generate unique ID
export function generateId() {
  return `${Date.now()}_${Math.random().toString(36).substr(2, 9)}`
}

// Generic storage functions
export function getFromStorage(key) {
  if (typeof window === "undefined") return []
  const data = localStorage.getItem(key)
  return data ? JSON.parse(data) : []
}

export function saveToStorage(key, data) {
  if (typeof window === "undefined") return
  localStorage.setItem(key, JSON.stringify(data))
}

// Categories
export function getCategories() {
  return getFromStorage(STORAGE_KEYS.CATEGORIES)
}

export function saveCategories(categories) {
  saveToStorage(STORAGE_KEYS.CATEGORIES, categories)
}

// Products
export function getProducts() {
  return getFromStorage(STORAGE_KEYS.PRODUCTS)
}

export function saveProducts(products) {
  saveToStorage(STORAGE_KEYS.PRODUCTS, products)
}

// Vendors
export function getVendors() {
  return getFromStorage(STORAGE_KEYS.VENDORS)
}

export function saveVendors(vendors) {
  saveToStorage(STORAGE_KEYS.VENDORS, vendors)
}

// Stock Entries
export function getStockEntries() {
  return getFromStorage(STORAGE_KEYS.STOCK_ENTRIES)
}

export function saveStockEntries(entries) {
  saveToStorage(STORAGE_KEYS.STOCK_ENTRIES, entries)
}

// Transfers
export function getTransfers() {
  return getFromStorage(STORAGE_KEYS.TRANSFERS)
}

export function saveTransfers(transfers) {
  saveToStorage(STORAGE_KEYS.TRANSFERS, transfers)
}

// Warehouses
export function getWarehouses() {
  const warehouses = getFromStorage(STORAGE_KEYS.WAREHOUSES)
  if (warehouses.length === 0) {
    const defaultWarehouses = [
      { _id: generateId(), name: "Azadpur", location: "Delhi" },
      { _id: generateId(), name: "Yotta", location: "Mumbai" },
      { _id: generateId(), name: "Mumbai Central", location: "Mumbai" },
    ]
    saveToStorage(STORAGE_KEYS.WAREHOUSES, defaultWarehouses)
    return defaultWarehouses
  }
  return warehouses
}

export function saveWarehouses(warehouses) {
  saveToStorage(STORAGE_KEYS.WAREHOUSES, warehouses)
}

// Helper to find category path
export function getCategoryPath(categories, categoryId) {
  const findPath = (cats, targetId, path = []) => {
    for (const cat of cats) {
      const newPath = [...path, cat.name]
      if (cat._id === targetId) return newPath
      if (cat.children?.length) {
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
  const normalizedName = name.toLowerCase().trim()

  const checkInCategories = (cats) => {
    for (const cat of cats) {
      if (cat._id !== excludeId && cat.name.toLowerCase().trim() === normalizedName) {
        return true
      }
      if (cat.children?.length && checkInCategories(cat.children)) {
        return true
      }
    }
    return false
  }

  return checkInCategories(categories)
}

// Helper to find category by ID
export function findCategoryById(categories, categoryId) {
  for (const cat of categories) {
    if (cat._id === categoryId) return cat
    if (cat.children?.length) {
      const found = findCategoryById(cat.children, categoryId)
      if (found) return found
    }
  }
  return null
}

// Helper to flatten categories for selection
export function flattenCategories(categories, level = 0, parentPath = "") {
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
  const flat = flattenCategories(categories)
  return flat.filter((cat) => !cat.hasChildren && cat.allowItemEntry)
}
