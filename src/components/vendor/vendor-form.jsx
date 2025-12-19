"use client"

import { useState, useEffect, useMemo, useRef } from "react"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Switch } from "@/components/ui/switch"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Badge } from "@/components/ui/badge"
import { getLeafCategoriesWithProducts } from "@/components/lib/storage"
import { Search, X, Check } from "lucide-react"

const ACCOUNT_TYPES = ["Savings", "Current", "Business"]

export function VendorForm({ onSubmit, initialData, categories, products, onCancel }) {
  const [formData, setFormData] = useState({
    name: "",
    gstin: "",
    contactPerson: "",
    authorizedSignature: "",
    phone: "",
    email: "",
    address: "",
    bankName: "",
    accountNumber: "",
    accountType: "Current",
    micr: "",
    rtgs: "",
    neft: "",
    status: "active",
    isBlacklisted: false,
    selectedCategoryIds: [],
    selectedProductIds: [],
  })
  console.log("🚀 ~ VendorForm ~ formData:", formData)

  const [categorySearch, setCategorySearch] = useState("")
  const [showCategoryDropdown, setShowCategoryDropdown] = useState(false)
  const categoryDropdownRef = useRef(null)
  const searchInputRef = useRef(null)

  const categoriesWithProducts = useMemo(() => {
    return getLeafCategoriesWithProducts(categories)
  }, [categories])

  const filteredCategories = useMemo(() => {
    if (!categorySearch.trim()) return categoriesWithProducts
    const search = categorySearch.toLowerCase()
    return categoriesWithProducts.filter(
      (cat) =>
        cat.name.toLowerCase().includes(search) ||
        cat.path.toLowerCase().includes(search)
    )
  }, [categoriesWithProducts, categorySearch])

  useEffect(() => {
    if (initialData) {
      setFormData({
        name: initialData.name || "",
        gstin: initialData.gstin || "",
        contactPerson: initialData.contactPerson || "",
        authorizedSignature: initialData.authorizedSignature || "",
        phone: initialData.phone || "",
        email: initialData.email || "",
        address: initialData.address || "",
        bankName: initialData.bankName || "",
        accountNumber: initialData.accountNumber || "",
        accountType: initialData.accountType || "Current",
        micr: initialData.micr || "",
        rtgs: initialData.rtgs || "",
        neft: initialData.neft || "",
        status: initialData.status || "active",
        isBlacklisted: initialData.isBlacklisted || false,
        selectedCategoryIds: (initialData.selectedCategoryIds || []).map(String),
        selectedProductIds: (initialData.selectedProductIds || []).map(String),
      })
    } else {
      setFormData({
        name: "",
        gstin: "",
        contactPerson: "",
        authorizedSignature: "",
        phone: "",
        email: "",
        address: "",
        bankName: "",
        accountNumber: "",
        accountType: "Current",
        micr: "",
        rtgs: "",
        neft: "",
        status: "active",
        isBlacklisted: false,
        selectedCategoryIds: [],
        selectedProductIds: [],
      })
    }
    setCategorySearch("")
  }, [initialData])

  // Category dropdown को बाहर click करने पर close करने के लिए
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (
        categoryDropdownRef.current &&
        !categoryDropdownRef.current.contains(event.target) &&
        searchInputRef.current &&
        !searchInputRef.current.contains(event.target)
      ) {
        setShowCategoryDropdown(false)
      }
    }

    document.addEventListener("mousedown", handleClickOutside)
    return () => {
      document.removeEventListener("mousedown", handleClickOutside)
    }
  }, [])

  const handleSubmit = (e) => {
    e.preventDefault()
    if (!formData.name.trim()) return
    onSubmit(formData)
  }

  const updateField = (field, value) => {
    setFormData((prev) => ({ ...prev, [field]: value }))
  }

  // ✅ Toggle Category
  const toggleCategory = (category) => {
    const id = String(category.id)

    setFormData((prev) => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.includes(id)
        ? prev.selectedCategoryIds.filter((cid) => cid !== id)
        : [...prev.selectedCategoryIds, id],
    }))

    setCategorySearch("")
    setShowCategoryDropdown(false)
  }

  // ✅ Remove Category
  const removeCategory = (categoryId) => {
    const id = String(categoryId)
    setFormData((prev) => ({
      ...prev,
      selectedCategoryIds: prev.selectedCategoryIds.filter((cid) => cid !== id),
      selectedProductIds: prev.selectedProductIds.filter((pId) => {
        const product = products.find((p) => String(p.id) === String(pId))
        return String(product?.categoryId) !== id
      }),
    }))
  }

  // ✅ Toggle Product
  const toggleProduct = (productId) => {
    const id = String(productId)
    setFormData((prev) => ({
      ...prev,
      selectedProductIds: prev.selectedProductIds.includes(id)
        ? prev.selectedProductIds.filter((pid) => pid !== id)
        : [...prev.selectedProductIds, id],
    }))
  }

  const availableProducts =
    Array.isArray(products) && Array.isArray(formData.selectedCategoryIds)
      ? products.filter((p) => formData.selectedCategoryIds.includes(String(p.categoryId)))
      : []

  const selectedCategoriesInfo = categoriesWithProducts.filter((cat) =>
    formData.selectedCategoryIds.includes(String(cat.id))
  )

  return (
    <form onSubmit={handleSubmit} className="space-y-6 p-6 bg-muted/30 rounded-lg border-2 border-primary/20">
      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b pb-2">Basic Information</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Vendor Name *</Label>
            <Input value={formData.name} onChange={(e) => updateField("name", e.target.value)} placeholder="Vendor name" />
          </div>
          <div className="space-y-2">
            <Label>GSTIN Number</Label>
            <Input value={formData.gstin} onChange={(e) => updateField("gstin", e.target.value)} placeholder="GSTIN" />
          </div>
          <div className="space-y-2">
            <Label>Contact Person</Label>
            <Input value={formData.contactPerson} onChange={(e) => updateField("contactPerson", e.target.value)} placeholder="Contact person name" />
          </div>
          <div className="space-y-2">
            <Label>Authorized Signature</Label>
            <Input value={formData.authorizedSignature} onChange={(e) => updateField("authorizedSignature", e.target.value)} placeholder="Authorized signature" />
          </div>
          <div className="space-y-2">
            <Label>Phone</Label>
            <Input value={formData.phone} onChange={(e) => updateField("phone", e.target.value)} placeholder="Phone number" />
          </div>
          <div className="space-y-2">
            <Label>Email</Label>
            <Input value={formData.email} onChange={(e) => updateField("email", e.target.value)} placeholder="Email address" />
          </div>
        </div>
        <div className="space-y-2">
          <Label>Address</Label>
          <Input value={formData.address} onChange={(e) => updateField("address", e.target.value)} placeholder="Full address" />
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b pb-2">Bank Details</h3>
        <div className="grid grid-cols-2 gap-4">
          <div className="space-y-2">
            <Label>Bank Name</Label>
            <Input value={formData.bankName} onChange={(e) => updateField("bankName", e.target.value)} placeholder="Bank name" />
          </div>
          <div className="space-y-2">
            <Label>Account Number</Label>
            <Input value={formData.accountNumber} onChange={(e) => updateField("accountNumber", e.target.value)} placeholder="Account number" />
          </div>
          <div className="space-y-2">
            <Label>Account Type</Label>
            <Select value={formData.accountType} onValueChange={(v) => updateField("accountType", v)}>
              <SelectTrigger>
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {ACCOUNT_TYPES.map((type) => (
                  <SelectItem key={type} value={type}>
                    {type}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>
          <div className="space-y-2">
            <Label>MICR</Label>
            <Input value={formData.micr} onChange={(e) => updateField("micr", e.target.value)} placeholder="MICR code" />
          </div>
          <div className="space-y-2">
            <Label>RTGS</Label>
            <Input value={formData.rtgs} onChange={(e) => updateField("rtgs", e.target.value)} placeholder="RTGS code" />
          </div>
          <div className="space-y-2">
            <Label>NEFT</Label>
            <Input value={formData.neft} onChange={(e) => updateField("neft", e.target.value)} placeholder="NEFT code" />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b pb-2">Status</h3>
        <div className="flex items-center gap-6">
          <div className="flex items-center gap-2">
            <Label>Status</Label>
            <Select value={formData.status} onValueChange={(v) => updateField("status", v)}>
              <SelectTrigger className="w-32">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Active</SelectItem>
                <SelectItem value="inactive">Inactive</SelectItem>
              </SelectContent>
            </Select>
          </div>
          <div className="flex items-center gap-2">
            <Label>Blacklisted</Label>
            <Switch checked={formData.isBlacklisted} onCheckedChange={(v) => updateField("isBlacklisted", v)} />
          </div>
        </div>
      </div>

      <div className="space-y-4">
        <h3 className="font-semibold text-foreground border-b pb-2">Product Categories</h3>

        {selectedCategoriesInfo.length > 0 && (
          <div className="flex flex-wrap gap-2 mb-3">
            {selectedCategoriesInfo.map((cat) => (
              <Badge key={cat.id} variant="secondary" className="flex items-center gap-1 py-1 px-2">
                <span>{cat.name}</span>
                <button type="button" onClick={() => removeCategory(cat.id)} className="ml-1 hover:text-destructive">
                  <X className="h-3 w-3" />
                </button>
              </Badge>
            ))}
          </div>
        )}

        <div className="relative">
          <div className="relative" ref={searchInputRef}>
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              value={categorySearch}
              onChange={(e) => {
                setCategorySearch(e.target.value)
                setShowCategoryDropdown(true)
              }}
              onFocus={() => setShowCategoryDropdown(true)}
              placeholder="Search and select categories..."
              className="pl-9"
            />
          </div>
          {showCategoryDropdown && (
            <div ref={categoryDropdownRef} className="absolute z-50 w-full mt-1 bg-background border rounded-lg shadow-lg max-h-48 overflow-y-auto">
              {filteredCategories.length === 0 ? (
                <div className="p-3 text-center text-muted-foreground text-sm">
                  {categoriesWithProducts.length === 0
                    ? "No categories with Product Entry enabled"
                    : "No matching categories"}
                </div>
              ) : (
                filteredCategories.map((cat) => {
                  const isSelected = formData.selectedCategoryIds.includes(String(cat.id))
                  return (
                    <div
                      key={cat.id}
                      className={`p-3 hover:bg-muted cursor-pointer border-b last:border-b-0 flex items-center justify-between ${isSelected ? "bg-primary/10" : ""}`}
                      onClick={() => toggleCategory(cat)}
                    >
                      <div>
                        <p className="font-medium text-foreground">{cat.name}</p>
                        <p className="text-xs text-muted-foreground">{cat.path}</p>
                      </div>
                      {isSelected && <Check className="h-4 w-4 text-primary" />}
                    </div>
                  )
                })
              )}
            </div>
          )}
        </div>
        <p className="text-xs text-muted-foreground">Only leaf categories with Product Entry enabled are shown</p>
      </div>

      {availableProducts.length > 0 && (
        <div className="space-y-4">
          <h3 className="font-semibold text-foreground border-b pb-2">Products</h3>
          <div className="border rounded-lg p-4 max-h-48 overflow-y-auto space-y-2">
            {availableProducts.map((product) => {
              const isSelected = formData.selectedProductIds.includes(String(product.id))
              return (
                <div
                  key={product.id}
                  className={`flex items-center justify-between p-2 rounded cursor-pointer hover:bg-muted ${isSelected ? "bg-primary/10" : ""}`}
                  onClick={() => toggleProduct(product.id)}
                >
                  <span className="text-sm">{product.productName}</span>
                  {isSelected && <Check className="h-4 w-4 text-primary" />}
                </div>
              )
            })}
          </div>
        </div>
      )}

      <div className="flex justify-end gap-2 pt-4">
        <Button type="button" variant="outline" onClick={onCancel}>
          Cancel
        </Button>
        <Button type="submit" disabled={!formData.name.trim()}>
          {initialData ? "Update" : "Create"}
        </Button>
      </div>
    </form>
  )
}
