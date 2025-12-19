"use client"

import { useState } from "react"
import { Edit, Trash2, Users, Phone, Mail, Search, Filter } from "lucide-react"
import { Button } from "@/components/ui/button"
import { Badge } from "@/components/ui/badge"
import { Input } from "@/components/ui/input"
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"

export function VendorTable({ vendors, onEdit, onDelete }) {
  const [searchQuery, setSearchQuery] = useState("")
  const [filterStatus, setFilterStatus] = useState("all")
  const [filterBlacklisted, setFilterBlacklisted] = useState("all")

const filteredVendors = Array.isArray(vendors)
  ? vendors.filter((vendor) => {
      if (!vendor) return false;

      if (filterStatus !== "all" && vendor.status !== filterStatus) return false;
      if (filterBlacklisted === "yes" && !vendor.isBlacklisted) return false;
      if (filterBlacklisted === "no" && vendor.isBlacklisted) return false;

      if (searchQuery) {
        const query = searchQuery.toLowerCase();
        if (
          !(vendor.name?.toLowerCase().includes(query)) &&
          !(vendor.contactPerson?.toLowerCase().includes(query)) &&
          !(vendor.email?.toLowerCase().includes(query)) &&
          !(vendor.phone?.toLowerCase().includes(query)) &&
          !(vendor.gstin?.toLowerCase().includes(query))
        ) {
          return false;
        }
      }

      return true;
    })
  : [];


  const clearFilters = () => {
    setSearchQuery("")
    setFilterStatus("all")
    setFilterBlacklisted("all")
  }

  if (!vendors?.length) {
    return (
      <div className="text-center py-12 text-muted-foreground">
        <Users className="h-12 w-12 mx-auto mb-4 opacity-50" />
        <p>No vendors yet. Add your first vendor!</p>
      </div>
    )
  }

  return (
    <div className="space-y-4">
      <div className="bg-muted/30 border rounded-lg p-4 space-y-4">
        <div className="flex items-center gap-2">
          <Filter className="h-4 w-4 text-muted-foreground" />
          <span className="font-medium">Filters</span>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="relative">
            <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
            <Input
              placeholder="Search vendors..."
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              className="pl-9"
            />
          </div>

          <Select value={filterStatus} onValueChange={setFilterStatus}>
            <SelectTrigger>
              <SelectValue placeholder="All Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Status</SelectItem>
              <SelectItem value="active">Active</SelectItem>
              <SelectItem value="inactive">Inactive</SelectItem>
            </SelectContent>
          </Select>

          <Select value={filterBlacklisted} onValueChange={setFilterBlacklisted}>
            <SelectTrigger>
              <SelectValue placeholder="Blacklist Status" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="all">All Vendors</SelectItem>
              <SelectItem value="yes">Blacklisted Only</SelectItem>
              <SelectItem value="no">Non-Blacklisted</SelectItem>
            </SelectContent>
          </Select>

          <Button variant="outline" onClick={clearFilters}>
            Clear Filters
          </Button>
        </div>
        <div className="text-sm text-muted-foreground">
          Showing {filteredVendors.length} of {vendors.length} vendors
        </div>
      </div>

      {filteredVendors.length === 0 ? (
        <div className="text-center py-8 text-muted-foreground border rounded-lg">
          <p>No vendors match your filters.</p>
        </div>
      ) : (
        <div className="border rounded-lg overflow-hidden">
          <Table>
            <TableHeader>
              <TableRow className="bg-muted/50">
                <TableHead>Vendor</TableHead>
                <TableHead>Contact</TableHead>
                <TableHead>GSTIN</TableHead>
                <TableHead>Status</TableHead>
                <TableHead>Products</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {filteredVendors.map((vendor) => (
                <TableRow key={vendor._id}>
                  <TableCell>
                    <div>
                      <div className="font-medium">{vendor.name}</div>
                      <div className="text-sm text-muted-foreground">{vendor.contactPerson}</div>
                    </div>
                  </TableCell>
                  <TableCell>
                    <div className="space-y-1">
                      {vendor.phone && (
                        <div className="flex items-center gap-1 text-sm">
                          <Phone className="h-3 w-3" /> {vendor.phone}
                        </div>
                      )}
                      {vendor.email && (
                        <div className="flex items-center gap-1 text-sm">
                          <Mail className="h-3 w-3" /> {vendor.email}
                        </div>
                      )}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm">{vendor.gstin || "-"}</span>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      <Badge variant={vendor.status === "active" ? "default" : "secondary"}>{vendor.status}</Badge>
                      {vendor.isBlacklisted && <Badge variant="destructive">Blacklisted</Badge>}
                    </div>
                  </TableCell>
                  <TableCell>
                    <span className="text-sm text-muted-foreground">
                      {vendor.selectedProductIds?.length || 0} products
                    </span>
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" onClick={() => onEdit(vendor)}>
                      <Edit className="h-4 w-4" />
                    </Button>
                    <Button
                      variant="ghost"
                      size="icon"
                      className="text-destructive hover:text-destructive"
                      onClick={() => onDelete(vendor)}
                    >
                      <Trash2 className="h-4 w-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </div>
      )}
    </div>
  )
}
