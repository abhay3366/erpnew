"use client"

import { useEffect, useState } from "react"
// import { HeaderNav } from "@/components/header-nav"
// import { PageHeader } from "@/components/page-header"
import { VendorTable } from "@/components/vendor/vendor-table"
import { VendorForm } from "@/components/vendor/vendor-form"
import { Button } from "@/components/ui/button"
import { Plus, ArrowLeft } from "lucide-react"
import { getVendors, saveVendors, getCategories, getProducts, generateId } from "@/components/lib/storage"

export default function VendorsPage() {
  const [vendors, setVendors] = useState([])
  const [categories, setCategories] = useState([])
  const [products, setProducts] = useState([])
  const [showForm, setShowForm] = useState(false)
  const [editingVendor, setEditingVendor] = useState(null)

useEffect(() => {
  const fetchData = async () => {
    const vendors = await getVendors()
    const categories = await getCategories()
    const products = await getProducts()

    setVendors(vendors)
    setCategories(categories)
    setProducts(products)
  }

  fetchData()
}, [])

  console.log("🚀 ~ VendorsPage ~ categories:", categories)
  const handleSubmit = (data) => {
    if (editingVendor) {
      const updated = vendors.map((v) => (v._id === editingVendor._id ? { ...v, ...data } : v))
      setVendors(updated)
      saveVendors(updated)
    } else {
      const newVendor = { _id: generateId(), ...data }
      const updated = [...vendors, newVendor]
      setVendors(updated)
      saveVendors(updated)
    }
    setEditingVendor(null)
    setShowForm(false)
  }

  const handleEdit = (vendor) => {
    setEditingVendor(vendor)
    setShowForm(true)
  }

  const handleDelete = (vendor) => {
    if (!confirm(`Are you sure you want to delete "${vendor.name}"?`)) return
    const updated = vendors.filter((v) => v._id !== vendor._id)
    setVendors(updated)
    saveVendors(updated)
  }

  const handleAdd = () => {
    setEditingVendor(null)
    setShowForm(true)
  }

  const handleCancel = () => {
    setShowForm(false)
    setEditingVendor(null)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <HeaderNav /> */}
      <main className="container mx-auto p-6">
        {showForm ? (
          <div className="space-y-4">
            <div className="flex items-center gap-4">
              <Button variant="outline" onClick={handleCancel} size="sm">
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to List
              </Button>
              <h2 className="text-2xl font-bold">{editingVendor ? "Edit Vendor" : "Add New Vendor"}</h2>
            </div>
            <VendorForm
              onSubmit={handleSubmit}
              initialData={editingVendor}
              categories={categories}
              products={products}
              onCancel={handleCancel}
            />
          </div>
        ) : (
          <>
            {/* <PageHeader title="Vendors" description="Manage your vendor relationships"> */}
              <Button onClick={handleAdd}>
                <Plus className="h-4 w-4 mr-2" />
                Add Vendor
              </Button>
            {/* </PageHeader> */}
            <VendorTable vendors={vendors} onEdit={handleEdit} onDelete={handleDelete} />
          </>
        )}
      </main>
    </div>
  )
}
