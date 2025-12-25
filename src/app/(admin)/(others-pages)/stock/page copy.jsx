"use client"

import { useEffect, useState } from "react"
// import { HeaderNav } from "@/components/header-nav"
// import { PageHeader } from "@/components/page-header"
import { StockEntryForm } from "@/components/stock/stock-entry-form"
import { StockEntryList } from "@/components/stock/stock-entry-list"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"
import { getVendors, getProducts, getWarehouses, getStockEntries, saveStockEntries } from "@/components/lib/storage"

export default function StockEntryPage() {
  const [vendors, setVendors] = useState([])
  const [products, setProducts] = useState([])
  const [warehouses, setWarehouses] = useState([])
  const [stockEntries, setStockEntries] = useState([])

  useEffect(() => {
    setVendors(getVendors())
    setProducts(getProducts())
    setWarehouses(getWarehouses())
    setStockEntries(getStockEntries())
  }, [])

  const handleSubmit = (entry) => {
    const updated = [entry, ...stockEntries]
    setStockEntries(updated)
    saveStockEntries(updated)
  }

  return (
    <div className="min-h-screen bg-background">
      {/* <HeaderNav /> */}
      <main className="container mx-auto p-6">
        {/* <PageHeader title="Stock Entry" description="Record new stock arrivals" /> */}

        <Tabs defaultValue="entry" className="space-y-6">
          <TabsList>
            <TabsTrigger value="entry">Stock Entry</TabsTrigger>
            <TabsTrigger value="list">Stock List</TabsTrigger>
          </TabsList>

          <TabsContent value="entry" className="space-y-6">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">New Stock Entry</h2>
              <StockEntryForm vendors={vendors} products={products} warehouses={warehouses} onSubmit={handleSubmit} />
            </div>

            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">Recent Entries (Top 8)</h2>
              <StockEntryList
                entries={stockEntries}
                vendors={vendors}
                products={products}
                warehouses={warehouses}
                showFilters={false}
                limit={8}
              />
            </div>
          </TabsContent>

          <TabsContent value="list">
            <div className="bg-card rounded-lg border p-6">
              <h2 className="text-lg font-semibold mb-4 text-foreground">All Stock Entries</h2>
              <StockEntryList
                entries={stockEntries}
                vendors={vendors}
                products={products}
                warehouses={warehouses}
                showFilters={true}
              />
            </div>
          </TabsContent>
        </Tabs>
      </main>
    </div>
  )
}
