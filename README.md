    {
      "id": "1766392107706",
      "productGroupId": "1766391963118",
      "productName": "C5X",
      "unit": "pieces",
      "sku": "SKU-1766392107706",
      "image": "",
      "hasUniqueIdentifier": true,
      "hasSerialNo": true,
      "hasMacAddress": false,
      "hasWarranty": true,
      "createdAt": "2025-12-22T08:28:27.706Z"
    },



"use client"

import { useState, useEffect } from "react"
import { useRouter } from "next/navigation"
import { Button } from "@/components/ui/button"
import { Input } from "@/components/ui/input"
import { Label } from "@/components/ui/label"
import { Card, CardContent, CardHeader, CardTitle, CardDescription } from "@/components/ui/card"
import { Table, TableBody, TableCell, TableHead, TableHeader, TableRow } from "@/components/ui/table"
import { Badge } from "@/components/ui/badge"
import { 
  Plus, 
  Edit, 
  Trash2, 
  Check, 
  X, 
  Eye,
  Package,
  Filter,
  Search,
  RefreshCw
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog"
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select"
import { Switch } from "@/components/ui/switch"
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs"

const FIELD_TYPES = ["text", "number", "date", "email", "phone", "url", "textarea", "select"]
const DATA_TYPES = ["string", "integer", "decimal", "boolean", "date", "array", "object"]
const APPLICABLE_FOR_OPTIONS = ["UNIQUE", "NON_UNIQUE", "BOTH"]

export default function FieldMastersPage() {
  const router = useRouter()
  
  const [fieldMasters, setFieldMasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterApplicableFor, setFilterApplicableFor] = useState("all")
  
  // Form states
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    type: "text",
    dataType: "string",
    applicableFor: [],
    isActive: true,
    isRequired: false,
    order: 0,
    validationRules: {
      minLength: null,
      maxLength: null,
      min: null,
      max: null,
      pattern: "",
      patternMessage: ""
    },
    options: [] // For select type
  })
  
  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [deleteConfirmOpen, setDeleteConfirmOpen] = useState(false)
  const [fieldToDelete, setFieldToDelete] = useState(null)

  useEffect(() => {
    fetchFieldMasters()
  }, [])

  const fetchFieldMasters = async () => {
    try {
      setLoading(true)
      const response = await fetch('http://localhost:5001/fieldMasters')
      if (response.ok) {
        const data = await response.json()
        setFieldMasters(data || [])
      }
    } catch (error) {
      console.error('Error fetching field masters:', error)
    } finally {
      setLoading(false)
    }
  }

  // Filtered field masters
  const filteredFieldMasters = fieldMasters.filter(field => {
    // Search filter
    const matchesSearch = searchTerm === "" || 
      field.label.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.key.toLowerCase().includes(searchTerm.toLowerCase()) ||
      field.type.toLowerCase().includes(searchTerm.toLowerCase())
    
    // Type filter
    const matchesType = filterType === "all" || field.type === filterType
    
    // ApplicableFor filter
    const matchesApplicableFor = filterApplicableFor === "all" || 
      (filterApplicableFor === "BOTH" && field.applicableFor.includes("UNIQUE") && field.applicableFor.includes("NON_UNIQUE")) ||
      field.applicableFor.includes(filterApplicableFor)
    
    return matchesSearch && matchesType && matchesApplicableFor
  })

  const resetForm = () => {
    setFormData({
      key: "",
      label: "",
      type: "text",
      dataType: "string",
      applicableFor: [],
      isActive: true,
      isRequired: false,
      order: fieldMasters.length + 1,
      validationRules: {
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: "",
        patternMessage: ""
      },
      options: []
    })
    setIsEditMode(false)
    setEditingId(null)
  }

  const handleCreateClick = () => {
    resetForm()
    setIsDialogOpen(true)
  }

  const handleEditClick = (field) => {
    setFormData({
      key: field.key,
      label: field.label,
      type: field.type,
      dataType: field.dataType || "string",
      applicableFor: field.applicableFor || [],
      isActive: field.isActive !== undefined ? field.isActive : true,
      isRequired: field.isRequired || false,
      order: field.order || 0,
      validationRules: field.validationRules || {
        minLength: null,
        maxLength: null,
        min: null,
        max: null,
        pattern: "",
        patternMessage: ""
      },
      options: field.options || []
    })
    setIsEditMode(true)
    setEditingId(field.id)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = (field) => {
    setFieldToDelete(field)
    setDeleteConfirmOpen(true)
  }

  const handleDeleteConfirm = async () => {
    if (!fieldToDelete) return
    
    try {
      const response = await fetch(`http://localhost:5001/fieldMasters/${fieldToDelete.id}`, {
        method: 'DELETE'
      })
      
      if (response.ok) {
        // Update local state
        setFieldMasters(prev => prev.filter(f => f.id !== fieldToDelete.id))
        alert(`Field "${fieldToDelete.label}" deleted successfully!`)
      }
    } catch (error) {
      console.error('Error deleting field:', error)
      alert('Failed to delete field')
    } finally {
      setDeleteConfirmOpen(false)
      setFieldToDelete(null)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    
    // Validation
    if (!formData.key.trim()) {
      alert("Please enter field key")
      return
    }
    
    if (!formData.label.trim()) {
      alert("Please enter field label")
      return
    }
    
    if (formData.applicableFor.length === 0) {
      alert("Please select at least one applicable for option")
      return
    }
    
    // Generate ID if new
    const id = isEditMode ? editingId : `FM${Date.now()}`
    
    const fieldData = {
      id,
      key: formData.key.trim().toLowerCase().replace(/\s+/g, '_'),
      label: formData.label.trim(),
      type: formData.type,
      dataType: formData.dataType,
      applicableFor: formData.applicableFor,
      isActive: formData.isActive,
      isRequired: formData.isRequired,
      order: formData.order || 0,
      validationRules: formData.validationRules,
      options: formData.type === "select" ? formData.options : [],
      metadata: {
        createdAt: isEditMode ? new Date().toISOString() : new Date().toISOString(),
        updatedAt: new Date().toISOString(),
        createdBy: "admin"
      }
    }
    
    try {
      if (isEditMode) {
        // Update existing
        const response = await fetch(`http://localhost:5001/fieldMasters/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldData)
        })
        
        if (response.ok) {
          // Update local state
          setFieldMasters(prev => 
            prev.map(f => f.id === editingId ? fieldData : f)
          )
          alert("Field updated successfully!")
          setIsDialogOpen(false)
          resetForm()
        }
      } else {
        // Create new
        const response = await fetch('http://localhost:5001/fieldMasters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldData)
        })
        
        if (response.ok) {
          // Add to local state
          setFieldMasters(prev => [...prev, fieldData])
          alert("Field created successfully!")
          setIsDialogOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving field:', error)
      alert('Failed to save field')
    }
  }

  const handleApplicableForChange = (value) => {
    setFormData(prev => {
      const newApplicableFor = prev.applicableFor.includes(value)
        ? prev.applicableFor.filter(v => v !== value)
        : [...prev.applicableFor, value]
      return { ...prev, applicableFor: newApplicableFor }
    })
  }

  const addOption = () => {
    setFormData(prev => ({
      ...prev,
      options: [...prev.options, { label: "", value: "" }]
    }))
  }

  const updateOption = (index, field, value) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.map((option, i) => 
        i === index ? { ...option, [field]: value } : option
      )
    }))
  }

  const removeOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const handleViewProducts = () => {
    router.push('/products/create')
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-background">
        <main className="container mx-auto p-6">
          <div className="flex justify-center items-center h-64">
            <p>Loading field masters...</p>
          </div>
        </main>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-background">
      <main className="container mx-auto p-4 md:p-6">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold flex items-center gap-2">
              <Package className="h-6 w-6 md:h-8 md:w-8" />
              Field Masters
            </h1>
            <p className="text-muted-foreground mt-1">
              Manage dynamic fields for products
            </p>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <Button variant="outline" onClick={handleViewProducts}>
              <Eye className="h-4 w-4 mr-2" />
              View in Products
            </Button>
            <Button onClick={handleCreateClick}>
              <Plus className="h-4 w-4 mr-2" />
              Create New Field
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">{fieldMasters.length}</div>
              <div className="text-sm text-muted-foreground">Total Fields</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {fieldMasters.filter(f => f.isActive).length}
              </div>
              <div className="text-sm text-muted-foreground">Active Fields</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {fieldMasters.filter(f => f.applicableFor.includes("UNIQUE")).length}
              </div>
              <div className="text-sm text-muted-foreground">Unique Fields</div>
            </CardContent>
          </Card>
          <Card>
            <CardContent className="p-4">
              <div className="text-2xl font-bold">
                {fieldMasters.filter(f => f.applicableFor.includes("NON_UNIQUE")).length}
              </div>
              <div className="text-sm text-muted-foreground">Non-Unique Fields</div>
            </CardContent>
          </Card>
        </div>

        {/* Filters and Search */}
        <Card className="mb-6">
          <CardContent className="p-4">
            <div className="flex flex-col md:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 h-4 w-4 text-muted-foreground" />
                  <Input
                    placeholder="Search by label, key or type..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-9"
                  />
                </div>
              </div>
              
              <div className="flex flex-col sm:flex-row gap-2">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Field Type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Types</SelectItem>
                    {FIELD_TYPES.map(type => (
                      <SelectItem key={type} value={type}>
                        {type.charAt(0).toUpperCase() + type.slice(1)}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
                
                <Select value={filterApplicableFor} onValueChange={setFilterApplicableFor}>
                  <SelectTrigger className="w-[180px]">
                    <SelectValue placeholder="Applicable For" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="UNIQUE">Unique Only</SelectItem>
                    <SelectItem value="NON_UNIQUE">Non-Unique Only</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>
                
                <Button variant="outline" onClick={fetchFieldMasters}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for different views */}
        <Tabs defaultValue="table" className="mb-6">
          <TabsList>
            <TabsTrigger value="table">Table View</TabsTrigger>
            <TabsTrigger value="cards">Card View</TabsTrigger>
          </TabsList>
          
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>All Fields</CardTitle>
                <CardDescription>
                  Manage your dynamic field configurations
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Order</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applicable For</TableHead>
                        <TableHead>Status</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead className="text-right">Actions</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {filteredFieldMasters.length === 0 ? (
                        <TableRow>
                          <TableCell colSpan={8} className="text-center py-8 text-muted-foreground">
                            No fields found. Create your first field!
                          </TableCell>
                        </TableRow>
                      ) : (
                        filteredFieldMasters
                          .sort((a, b) => (a.order || 0) - (b.order || 0))
                          .map((field) => (
                            <TableRow key={field.id}>
                              <TableCell className="font-medium">{field.order || 0}</TableCell>
                              <TableCell className="font-medium">{field.label}</TableCell>
                              <TableCell>
                                <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {field.key}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline">{field.type}</Badge>
                              </TableCell>
                              <TableCell>
                                <div className="flex flex-wrap gap-1">
                                  {field.applicableFor.map((type) => (
                                    <Badge 
                                      key={type} 
                                      variant={type === "UNIQUE" ? "default" : "secondary"}
                                      className="text-xs"
                                    >
                                      {type}
                                    </Badge>
                                  ))}
                                </div>
                              </TableCell>
                              <TableCell>
                                <Badge variant={field.isActive ? "default" : "secondary"}>
                                  {field.isActive ? "Active" : "Inactive"}
                                </Badge>
                              </TableCell>
                              <TableCell>
                                {field.isRequired ? (
                                  <Check className="h-4 w-4 text-green-600" />
                                ) : (
                                  <X className="h-4 w-4 text-gray-400" />
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleEditClick(field)}
                                  >
                                    <Edit className="h-4 w-4" />
                                  </Button>
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleDeleteClick(field)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>
          
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFieldMasters.length === 0 ? (
                <Card className="col-span-3">
                  <CardContent className="p-8 text-center">
                    <p className="text-muted-foreground">No fields found. Create your first field!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFieldMasters
                  .sort((a, b) => (a.order || 0) - (b.order || 0))
                  .map((field) => (
                    <Card key={field.id} className="overflow-hidden">
                      <CardHeader className="pb-3">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg">{field.label}</CardTitle>
                            <CardDescription>
                              <code className="text-xs">{field.key}</code>
                            </CardDescription>
                          </div>
                          <Badge variant={field.isActive ? "default" : "secondary"}>
                            {field.isActive ? "Active" : "Inactive"}
                          </Badge>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Type:</span>
                            <Badge variant="outline">{field.type}</Badge>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Applicable For:</span>
                            <div className="flex gap-1">
                              {field.applicableFor.map((type) => (
                                <Badge 
                                  key={type} 
                                  variant={type === "UNIQUE" ? "default" : "secondary"}
                                  className="text-xs"
                                >
                                  {type}
                                </Badge>
                              ))}
                            </div>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Required:</span>
                            <span className={field.isRequired ? "text-green-600" : "text-gray-400"}>
                              {field.isRequired ? "Yes" : "No"}
                            </span>
                          </div>
                          
                          <div className="flex justify-between">
                            <span className="text-sm font-medium">Order:</span>
                            <span>{field.order || 0}</span>
                          </div>
                          
                          {field.validationRules && (
                            <div>
                              <span className="text-sm font-medium block mb-1">Validation Rules:</span>
                              <div className="text-xs bg-gray-50 p-2 rounded">
                                <pre className="overflow-auto">
                                  {JSON.stringify(field.validationRules, null, 2)}
                                </pre>
                              </div>
                            </div>
                          )}
                        </div>
                      </CardContent>
                      <CardContent className="pt-0">
                        <div className="flex justify-end gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleEditClick(field)}
                            className="flex-1"
                          >
                            <Edit className="h-4 w-4 mr-2" />
                            Edit
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => handleDeleteClick(field)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Field Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Field" : "Create New Field"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode 
                  ? "Update the field configuration" 
                  : "Add a new dynamic field for products"
                }
              </DialogDescription>
            </DialogHeader>
            
            <form onSubmit={handleFormSubmit}>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 py-4">
                {/* Basic Information */}
                <div className="space-y-3">
                  <h3 className="font-medium">Basic Information</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="label">Field Label *</Label>
                    <Input
                      id="label"
                      placeholder="e.g., Serial Number"
                      value={formData.label}
                      onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                      required
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="key">Field Key *</Label>
                    <Input
                      id="key"
                      placeholder="e.g., serial_no"
                      value={formData.key}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        key: e.target.value.toLowerCase().replace(/\s+/g, '_')
                      }))}
                      required
                    />
                    <p className="text-xs text-muted-foreground">
                      Lowercase, underscores allowed. This will be used in the database.
                    </p>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="order">Display Order</Label>
                    <Input
                      id="order"
                      type="number"
                      min="0"
                      value={formData.order}
                      onChange={(e) => setFormData(prev => ({ 
                        ...prev, 
                        order: parseInt(e.target.value) || 0 
                      }))}
                    />
                  </div>
                </div>
                
                {/* Type and Data Type */}
                <div className="space-y-3">
                  <h3 className="font-medium">Type Configuration</h3>
                  
                  <div className="space-y-2">
                    <Label htmlFor="type">Field Type *</Label>
                    <Select 
                      value={formData.type} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, type: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {FIELD_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="dataType">Data Type *</Label>
                    <Select 
                      value={formData.dataType} 
                      onValueChange={(value) => setFormData(prev => ({ ...prev, dataType: value }))}
                    >
                      <SelectTrigger>
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        {DATA_TYPES.map(type => (
                          <SelectItem key={type} value={type}>
                            {type.charAt(0).toUpperCase() + type.slice(1)}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label>Applicable For *</Label>
                    <div className="space-y-2">
                      {APPLICABLE_FOR_OPTIONS.map(option => (
                        <div key={option} className="flex items-center space-x-2">
                          <Switch
                            checked={formData.applicableFor.includes(option === "BOTH" ? ["UNIQUE", "NON_UNIQUE"] : option)}
                            onCheckedChange={() => {
                              if (option === "BOTH") {
                                if (formData.applicableFor.includes("UNIQUE") && formData.applicableFor.includes("NON_UNIQUE")) {
                                  setFormData(prev => ({
                                    ...prev,
                                    applicableFor: []
                                  }))
                                } else {
                                  setFormData(prev => ({
                                    ...prev,
                                    applicableFor: ["UNIQUE", "NON_UNIQUE"]
                                  }))
                                }
                              } else {
                                handleApplicableForChange(option)
                              }
                            }}
                          />
                          <Label className="cursor-pointer">
                            {option === "BOTH" ? "Both Unique & Non-Unique" : option}
                          </Label>
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
                
                {/* Settings */}
                <div className="space-y-3">
                  <h3 className="font-medium">Settings</h3>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isActive}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isActive: checked }))
                      }
                    />
                    <Label className="cursor-pointer">Active</Label>
                  </div>
                  
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isRequired}
                      onCheckedChange={(checked) => 
                        setFormData(prev => ({ ...prev, isRequired: checked }))
                      }
                    />
                    <Label className="cursor-pointer">Required</Label>
                  </div>
                </div>
                
                {/* Validation Rules */}
                <div className="space-y-3">
                  <h3 className="font-medium">Validation Rules</h3>
                  
                  <div className="grid grid-cols-2 gap-2">
                    <div className="space-y-2">
                      <Label htmlFor="minLength">Min Length</Label>
                      <Input
                        id="minLength"
                        type="number"
                        min="0"
                        value={formData.validationRules.minLength || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          validationRules: {
                            ...prev.validationRules,
                            minLength: e.target.value ? parseInt(e.target.value) : null
                          }
                        }))}
                      />
                    </div>
                    
                    <div className="space-y-2">
                      <Label htmlFor="maxLength">Max Length</Label>
                      <Input
                        id="maxLength"
                        type="number"
                        min="0"
                        value={formData.validationRules.maxLength || ""}
                        onChange={(e) => setFormData(prev => ({
                          ...prev,
                          validationRules: {
                            ...prev.validationRules,
                            maxLength: e.target.value ? parseInt(e.target.value) : null
                          }
                        }))}
                      />
                    </div>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="pattern">Regex Pattern</Label>
                    <Input
                      id="pattern"
                      placeholder="e.g., ^[A-Z0-9]+$"
                      value={formData.validationRules.pattern}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        validationRules: {
                          ...prev.validationRules,
                          pattern: e.target.value
                        }
                      }))}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="patternMessage">Pattern Error Message</Label>
                    <Input
                      id="patternMessage"
                      placeholder="e.g., Only uppercase letters and numbers allowed"
                      value={formData.validationRules.patternMessage}
                      onChange={(e) => setFormData(prev => ({
                        ...prev,
                        validationRules: {
                          ...prev.validationRules,
                          patternMessage: e.target.value
                        }
                      }))}
                    />
                  </div>
                </div>
                
                {/* Options for Select Type */}
                {formData.type === "select" && (
                  <div className="md:col-span-2 space-y-3">
                    <div className="flex items-center justify-between">
                      <h3 className="font-medium">Options</h3>
                      <Button type="button" variant="outline" size="sm" onClick={addOption}>
                        <Plus className="h-4 w-4 mr-1" />
                        Add Option
                      </Button>
                    </div>
                    
                    <div className="space-y-2">
                      {formData.options.map((option, index) => (
                        <div key={index} className="flex items-center gap-2">
                          <Input
                            placeholder="Label"
                            value={option.label}
                            onChange={(e) => updateOption(index, "label", e.target.value)}
                            className="flex-1"
                          />
                          <Input
                            placeholder="Value"
                            value={option.value}
                            onChange={(e) => updateOption(index, "value", e.target.value)}
                            className="flex-1"
                          />
                          <Button
                            type="button"
                            variant="outline"
                            size="sm"
                            onClick={() => removeOption(index)}
                            className="text-red-600"
                          >
                            <X className="h-4 w-4" />
                          </Button>
                        </div>
                      ))}
                      
                      {formData.options.length === 0 && (
                        <p className="text-sm text-muted-foreground">
                          No options added. Click "Add Option" to create select options.
                        </p>
                      )}
                    </div>
                  </div>
                )}
              </div>
              
              <DialogFooter>
                <Button type="button" variant="outline" onClick={() => setIsDialogOpen(false)}>
                  Cancel
                </Button>
                <Button type="submit">
                  {isEditMode ? "Update Field" : "Create Field"}
                </Button>
              </DialogFooter>
            </form>
          </DialogContent>
        </Dialog>

        {/* Delete Confirmation Dialog */}
        <Dialog open={deleteConfirmOpen} onOpenChange={setDeleteConfirmOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Delete Field</DialogTitle>
              <DialogDescription>
                Are you sure you want to delete the field &quot;{fieldToDelete?.label}&quot;?
                This action cannot be undone.
              </DialogDescription>
            </DialogHeader>
            <DialogFooter>
              <Button variant="outline" onClick={() => setDeleteConfirmOpen(false)}>
                Cancel
              </Button>
              <Button variant="destructive" onClick={handleDeleteConfirm}>
                Delete
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </main>
    </div>
  )
}