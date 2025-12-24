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
  Eye,
  Search,
  RefreshCw,
  Grid,
  List,
  Filter,
  ChevronDown,
  CheckSquare,
  ListFilter,
  Check,
  X,
  Power,
  AlertCircle,
  MinusCircle,
  PlusCircle,
  Hash,
  Calendar,
  Type,
  CheckCircle
} from "lucide-react"
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
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
import { toast } from "sonner"
import { Alert, AlertDescription } from "@/components/ui/alert"

// Updated FIELD_TYPES with icons
const FIELD_TYPES = [
  { value: "text", label: "Text", icon: Type },
  { value: "number", label: "Number", icon: Hash },
  { value: "date", label: "Date", icon: Calendar },
  { value: "select", label: "Select", icon: ListFilter },
  { value: "checkbox", label: "Checkbox", icon: CheckSquare }
]

// Available/Unavailable status options
const STATUS_OPTIONS = [
  { value: true, label: "Available", icon: CheckCircle, variant: "success" },
  { value: false, label: "Unavailable", icon: X, variant: "warning" }
]

// Validation types
const VALIDATION_TYPES = {
  text: ["minLength", "maxLength", "pattern"],
  number: ["minValue", "maxValue", "step"],
  date: ["minDate", "maxDate"],
  select: [],
  checkbox: []
}

export default function FieldMastersPage() {
  const router = useRouter()

  const [fieldMasters, setFieldMasters] = useState([])
  const [loading, setLoading] = useState(true)
  const [searchTerm, setSearchTerm] = useState("")
  const [filterType, setFilterType] = useState("all")
  const [filterApplicableFor, setFilterApplicableFor] = useState("all")
  const [filterStatus, setFilterStatus] = useState("available") // Default available only

  // Form states
  const [formData, setFormData] = useState({
    key: "",
    label: "",
    type: "text",
    applicableFor: [],
    isRequired: false,
    status: true, // Available/Unavailable
    options: [],
    defaultValue: "",
    validations: {}, // Dynamic validations based on field type
    placeholder: "", // Field placeholder
  })

  const [isDialogOpen, setIsDialogOpen] = useState(false)
  const [isEditMode, setIsEditMode] = useState(false)
  const [editingId, setEditingId] = useState(null)
  const [optionsInput, setOptionsInput] = useState("")
  const [validationErrors, setValidationErrors] = useState({})
  const [activeValidation, setActiveValidation] = useState("") // Currently editing validation

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
      toast.error("Failed to load field masters")
    } finally {
      setLoading(false)
    }
  }

  const resetForm = () => {
    setFormData({
      key: "",
      label: "",
      type: "text",
      applicableFor: [],
      isRequired: false,
      status: true,
      options: [],
      defaultValue: "",
      validations: {},
      placeholder: "",
    })
    setOptionsInput("")
    setValidationErrors({})
    setActiveValidation("")
    setIsEditMode(false)
    setEditingId(null)
  }

  // Get validation options for current field type
  const getValidationOptions = () => {
    return VALIDATION_TYPES[formData.type] || []
  }

  // Add a new validation rule
  const handleAddValidation = (validationType) => {
    setFormData(prev => ({
      ...prev,
      validations: {
        ...prev.validations,
        [validationType]: validationType.includes("Date") ? "" : validationType.includes("Length") ? "" : 0
      }
    }))
    setActiveValidation(validationType)
  }

  // Remove a validation rule
  const handleRemoveValidation = (validationType) => {
    setFormData(prev => {
      const newValidations = { ...prev.validations }
      delete newValidations[validationType]
      return { ...prev, validations: newValidations }
    })
  }

  // Update validation value
  const handleValidationChange = (validationType, value) => {
    setFormData(prev => ({
      ...prev,
      validations: {
        ...prev.validations,
        [validationType]: validationType.includes("Date") || validationType === "pattern"
          ? value
          : Number(value) || 0
      }
    }))
  }

  // Validate field uniqueness
  const validateFieldUniqueness = () => {
    const errors = {}
    const key = formData.key.trim().toLowerCase().replace(/\s+/g, '_')
    const label = formData.label.trim()

    // Check for duplicate key across all fields
    const duplicateKey = fieldMasters.find(field =>
      field.key === key &&
      field.id !== editingId
    )

    // Check for duplicate label across all fields
    const duplicateLabel = fieldMasters.find(field =>
      field.label.toLowerCase() === label.toLowerCase() &&
      field.id !== editingId
    )

    if (duplicateKey) {
      errors.key = `Field key "${key}" already exists for field "${duplicateKey.label}"`
    }

    if (duplicateLabel) {
      errors.label = `Field label "${label}" already exists (key: "${duplicateLabel.key}")`
    }

    // Check for same field in same applicableFor categories
    if (formData.applicableFor.length > 0) {
      const sortedApplicableFor = [...formData.applicableFor].sort()

      const duplicateInSameCategories = fieldMasters.find(field => {
        if (field.id === editingId) return false

        const fieldSortedApplicableFor = [...(field.applicableFor || [])].sort()

        if (field.key === key || field.label.toLowerCase() === label.toLowerCase()) {
          const hasOverlap = sortedApplicableFor.some(category =>
            fieldSortedApplicableFor.includes(category)
          )

          if (hasOverlap) {
            const isSameCombination =
              JSON.stringify(sortedApplicableFor) === JSON.stringify(fieldSortedApplicableFor)

            if (isSameCombination) {
              return true
            }
          }
        }
        return false
      })

      if (duplicateInSameCategories) {
        errors.applicableFor = `This field already exists with the same applicable for categories`
      }
    }

    return errors
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
      applicableFor: field.applicableFor || [],
      isRequired: field.isRequired || false,
      status: field.status !== undefined ? field.status : true,
      options: field.options || [],
      defaultValue: field.defaultValue || "",
      validations: field.validations || {},
      placeholder: field.placeholder || "",
    })
    setIsEditMode(true)
    setEditingId(field.id)
    setIsDialogOpen(true)
  }

  const handleDeleteClick = async (fieldId, fieldLabel) => {
    if (!confirm(`Are you sure you want to delete "${fieldLabel}" permanently? This action cannot be undone.`)) {
      return
    }

    try {
      const response = await fetch(`http://localhost:5001/fieldMasters/${fieldId}`, {
        method: 'DELETE'
      })

      if (response.ok) {
        setFieldMasters(prev => prev.filter(f => f.id !== fieldId))
        toast.success(`Field "${fieldLabel}" deleted successfully!`)
      }
    } catch (error) {
      console.error('Error deleting field:', error)
      toast.error('Failed to delete field')
    }
  }

  const handleToggleStatus = async (fieldId, fieldLabel, currentStatus) => {
    const newStatus = !currentStatus
    const action = newStatus ? "make available" : "make unavailable"

    if (!confirm(`Are you sure you want to ${action} "${fieldLabel}"?`)) {
      return
    }

    try {
      const fieldToUpdate = fieldMasters.find(f => f.id === fieldId)
      if (!fieldToUpdate) return

      const updatedField = {
        ...fieldToUpdate,
        status: newStatus
      }

      const response = await fetch(`http://localhost:5001/fieldMasters/${fieldId}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(updatedField)
      })

      if (response.ok) {
        setFieldMasters(prev =>
          prev.map(f => f.id === fieldId ? updatedField : f)
        )
        toast.success(`Field "${fieldLabel}" ${action}d successfully!`)
      }
    } catch (error) {
      console.error('Error updating field status:', error)
      toast.error(`Failed to ${action} field`)
    }
  }

  const handleFormSubmit = async (e) => {
    e.preventDefault()
    setValidationErrors({})

    // Basic validation
    const basicErrors = {}

    if (!formData.key.trim()) {
      basicErrors.key = "Please enter field key"
    } else if (!/^[a-zA-Z_][a-zA-Z0-9_]*$/.test(formData.key.trim())) {
      basicErrors.key = "Field key can only contain letters, numbers and underscores, and must start with a letter"
    }

    if (!formData.label.trim()) {
      basicErrors.label = "Please enter field label"
    }

    if (formData.applicableFor.length === 0) {
      basicErrors.applicableFor = "Please select at least one applicable for option"
    }

    if (formData.type === "select" && formData.options.length === 0) {
      basicErrors.options = "Please add at least one option for select field"
    }

    // Validation rules validation
    if (formData.validations) {
      Object.entries(formData.validations).forEach(([key, value]) => {
        if (key.includes("min") && key.includes("max")) {
          const minKey = key.includes("Length") ? "minLength" : key.includes("Date") ? "minDate" : "minValue"
          const maxKey = key.includes("Length") ? "maxLength" : key.includes("Date") ? "maxDate" : "maxValue"

          if (formData.validations[minKey] !== undefined && formData.validations[maxKey] !== undefined) {
            const min = formData.validations[minKey]
            const max = formData.validations[maxKey]

            if (min > max) {
              basicErrors.validations = `${minKey} cannot be greater than ${maxKey}`
            }
          }
        }
      })
    }

    if (Object.keys(basicErrors).length > 0) {
      setValidationErrors(basicErrors)
      Object.values(basicErrors).forEach(error => toast.error(error))
      return
    }

    // Uniqueness validation
    const uniquenessErrors = validateFieldUniqueness()
    if (Object.keys(uniquenessErrors).length > 0) {
      setValidationErrors(uniquenessErrors)
      Object.values(uniquenessErrors).forEach(error => toast.error(error))
      return
    }

    // Generate ID if new
    const id = isEditMode ? editingId : `FM${Date.now()}`

    // Get icon based on field type
    const fieldType = FIELD_TYPES.find(t => t.value === formData.type)

    const fieldData = {
      id,
      key: formData.key.trim().toLowerCase().replace(/\s+/g, '_'),
      label: formData.label.trim(),
      type: formData.type,
      applicableFor: formData.applicableFor,
      isRequired: formData.isRequired,
      status: formData.status,
      options: formData.type === "select" ? formData.options : undefined,
      defaultValue: formData.type === "checkbox" ? formData.defaultValue :
        formData.type === "select" ? (formData.defaultValue || "") :
          undefined,
      validations: Object.keys(formData.validations).length > 0 ? formData.validations : undefined,
      placeholder: formData.placeholder || undefined,
      icon: fieldType?.label || formData.type,
      createdAt: isEditMode ? new Date().toISOString() : new Date().toISOString(),
      updatedAt: new Date().toISOString()
    }

    // Remove undefined values
    Object.keys(fieldData).forEach(key => {
      if (fieldData[key] === undefined) {
        delete fieldData[key]
      }
    })

    try {
      if (isEditMode) {
        const response = await fetch(`http://localhost:5001/fieldMasters/${editingId}`, {
          method: 'PUT',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldData)
        })

        if (response.ok) {
          setFieldMasters(prev =>
            prev.map(f => f.id === editingId ? fieldData : f)
          )
          toast.success("Field updated successfully!")
          setIsDialogOpen(false)
          resetForm()
        }
      } else {
        const response = await fetch('http://localhost:5001/fieldMasters', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(fieldData)
        })

        if (response.ok) {
          setFieldMasters(prev => [...prev, fieldData])
          toast.success("Field created successfully!")
          setIsDialogOpen(false)
          resetForm()
        }
      }
    } catch (error) {
      console.error('Error saving field:', error)
      toast.error('Failed to save field')
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

  const handleAddOption = () => {
    if (!optionsInput.trim()) {
      toast.error("Please enter an option")
      return
    }

    setFormData(prev => ({
      ...prev,
      options: [...prev.options, optionsInput.trim()]
    }))
    setOptionsInput("")
  }

  const handleRemoveOption = (index) => {
    setFormData(prev => ({
      ...prev,
      options: prev.options.filter((_, i) => i !== index)
    }))
  }

  const handleViewProducts = () => {
    router.push('/product-table')
  }

  // Filtered field masters with all filters
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
      (filterApplicableFor === "BOTH" &&
        field.applicableFor.includes("UNIQUE") &&
        field.applicableFor.includes("NON_UNIQUE")) ||
      field.applicableFor.includes(filterApplicableFor)

    // Status filter
    const matchesStatus = filterStatus === "all" ||
      (filterStatus === "available" && field.status) ||
      (filterStatus === "unavailable" && !field.status)

    return matchesSearch && matchesType && matchesApplicableFor && matchesStatus
  })

  const availableFieldsCount = fieldMasters.filter(f => f.status).length
  const unavailableFieldsCount = fieldMasters.filter(f => !f.status).length

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
      <main className="container mx-auto p-2">
        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center justify-between mb-6 gap-4">
          <div>
            <h1 className="text-2xl md:text-3xl font-bold">
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
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-2">
          <Card className="w-full h-14 justify-center p-1">
            <CardContent className="p-2 flex gap-3 items-center">
              <div className="text-sm text-muted-foreground">Total Fields :</div>
              <div className="font-bold">{fieldMasters.length}</div>
            </CardContent>
          </Card>
          <Card className="w-full h-14 justify-center p-1">
            <CardContent className="p-2 flex gap-3 items-center">
              <div className="text-sm text-muted-foreground">Available :</div>
              <div className="font-bold text-green-600">
                {availableFieldsCount}
              </div>
            </CardContent>
          </Card>
          <Card className="w-full h-14 justify-center p-1">
            <CardContent className="p-2 flex gap-3 items-center">
              <div className="text-sm text-muted-foreground">Unavailable :</div>
              <div className="font-bold text-yellow-600">
                {unavailableFieldsCount}
              </div>
            </CardContent>
          </Card>
          <Card className="w-full h-14 justify-center p-1">
            <CardContent className="p-2 flex gap-3 items-center">
              <div className="text-sm text-muted-foreground">Unique Fields :</div>
              <div className="font-bold">
                {fieldMasters.filter(f => f.applicableFor.includes("UNIQUE") && f.status).length}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Search and Filters */}
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
                <div className="flex items-center gap-2">
                  <Filter className="h-4 w-4 text-muted-foreground" />
                  <Select value={filterType} onValueChange={setFilterType}>
                    <SelectTrigger className="w-[130px]">
                      <SelectValue placeholder="Field Type" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">All Types</SelectItem>
                      {FIELD_TYPES.map(type => (
                        <SelectItem key={type.value} value={type.value} className="flex items-center gap-2">
                          <type.icon className="h-4 w-4" />
                          {type.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <Select value={filterApplicableFor} onValueChange={setFilterApplicableFor}>
                  <SelectTrigger className="w-[150px]">
                    <SelectValue placeholder="Applicable For" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All</SelectItem>
                    <SelectItem value="UNIQUE">Unique Only</SelectItem>
                    <SelectItem value="NON_UNIQUE">Non-Unique Only</SelectItem>
                    <SelectItem value="BOTH">Both</SelectItem>
                  </SelectContent>
                </Select>

                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger className="w-[130px]">
                    <SelectValue placeholder="Status" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">All Status</SelectItem>
                    <SelectItem value="available">Available Only</SelectItem>
                    <SelectItem value="unavailable">Unavailable Only</SelectItem>
                  </SelectContent>
                </Select>

                <Button variant="outline" onClick={fetchFieldMasters}>
                  <RefreshCw className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Tabs for Table and Card Views */}
        <Tabs defaultValue="table" className="mb-6">
          <TabsList className="grid w-full max-w-md grid-cols-2">
            <TabsTrigger value="table">
              <List className="h-4 w-4 mr-2" />
              Table View
            </TabsTrigger>
            <TabsTrigger value="cards">
              <Grid className="h-4 w-4 mr-2" />
              Card View
            </TabsTrigger>
          </TabsList>

          {/* Table View */}
          <TabsContent value="table">
            <Card>
              <CardHeader>
                <CardTitle>All Fields</CardTitle>
                <CardDescription>
                  {filteredFieldMasters.length} fields found
                  {filterStatus === "all" && ` (${availableFieldsCount} available, ${unavailableFieldsCount} unavailable)`}
                </CardDescription>
              </CardHeader>
              <CardContent>
                <div className="rounded-md border">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Label</TableHead>
                        <TableHead>Key</TableHead>
                        <TableHead>Type</TableHead>
                        <TableHead>Applicable For</TableHead>
                        <TableHead>Required</TableHead>
                        <TableHead>Additional Info</TableHead>
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
                        filteredFieldMasters.map((field) => {
                          const statusOption = STATUS_OPTIONS.find(s => s.value === field.status)
                          const fieldType = FIELD_TYPES.find(t => t.value === field.type)
                          const IconComponent = fieldType?.icon || Type

                          return (
                            <TableRow key={field.id} className={!field.status ? "bg-gray-50" : ""}>
                              <TableCell>
                                <Badge
                                  variant="outline"
                                  className={`${statusOption?.variant === "success"
                                      ? "bg-green-50 text-green-700 border-green-200"
                                      : "bg-yellow-50 text-yellow-700 border-yellow-200"
                                    }`}
                                >
                                  {statusOption?.icon && <statusOption.icon className="h-3 w-3 mr-1" />}
                                  {statusOption?.label}
                                </Badge>
                              </TableCell>
                              <TableCell className="font-medium">
                                <div className="flex items-center gap-2">
                                  <IconComponent className="h-4 w-4 text-gray-500" />
                                  {field.label}
                                  {!field.status && (
                                    <span className="text-xs text-gray-500">(Unavailable)</span>
                                  )}
                                </div>
                              </TableCell>
                              <TableCell>
                                <code className="px-2 py-1 bg-gray-100 rounded text-xs">
                                  {field.key}
                                </code>
                              </TableCell>
                              <TableCell>
                                <Badge variant="outline" className="flex items-center gap-1">
                                  <IconComponent className="h-3 w-3" />
                                  {fieldType?.label || field.type}
                                </Badge>
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
                                {field.isRequired ? (
                                  <Badge variant="destructive" className="text-xs">
                                    Required
                                  </Badge>
                                ) : (
                                  <Badge variant="outline" className="text-xs">
                                    Optional
                                  </Badge>
                                )}
                              </TableCell>
                              <TableCell>
                                {field.type === "select" && field.options && (
                                  <div className="text-xs text-muted-foreground">
                                    {field.options.length} options
                                  </div>
                                )}
                                {field.type === "checkbox" && field.defaultValue !== undefined && (
                                  <div className="text-xs text-muted-foreground">
                                    Default: {field.defaultValue ? "Yes" : "No"}
                                  </div>
                                )}
                                {field.validations && Object.keys(field.validations).length > 0 && (
                                  <div className="text-xs text-muted-foreground">
                                    {Object.keys(field.validations).length} validation(s)
                                  </div>
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button
                                    variant="outline"
                                    size="sm"
                                    onClick={() => handleToggleStatus(field.id, field.label, field.status)}
                                    className={field.status ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                                    title={field.status ? "Make Unavailable" : "Make Available"}
                                  >
                                    <Power className="h-4 w-4" />
                                  </Button>
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
                                    onClick={() => handleDeleteClick(field.id, field.label)}
                                    className="text-red-600 hover:text-red-700 hover:bg-red-50"
                                  >
                                    <Trash2 className="h-4 w-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          )
                        })
                      )}
                    </TableBody>
                  </Table>
                </div>
              </CardContent>
            </Card>
          </TabsContent>

          {/* Card View */}
          <TabsContent value="cards">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredFieldMasters.length === 0 ? (
                <Card className="col-span-3">
                  <CardContent className="p-4 text-center">
                    <p className="text-muted-foreground">No fields found. Create your first field!</p>
                  </CardContent>
                </Card>
              ) : (
                filteredFieldMasters.map((field) => {
                  const statusOption = STATUS_OPTIONS.find(s => s.value === field.status)
                  const fieldType = FIELD_TYPES.find(t => t.value === field.type)
                  const IconComponent = fieldType?.icon || Type

                  return (
                    <Card key={field.id} className={`overflow-hidden ${!field.status ? "border-yellow-300 bg-yellow-50" : ""}`}>
                      <CardHeader className="pb-1">
                        <div className="flex justify-between items-start">
                          <div>
                            <CardTitle className="text-lg flex items-center gap-2">
                              <IconComponent className="h-5 w-5 text-gray-500" />
                              {field.label}
                              {!field.status && (
                                <Badge variant="outline" className="text-xs bg-yellow-100 text-yellow-800">
                                  Unavailable
                                </Badge>
                              )}
                            </CardTitle>
                            <CardDescription>
                              <code className="text-xs">{field.key}</code>
                            </CardDescription>
                          </div>
                          <div className="flex flex-col items-end gap-1">
                            <Badge
                              variant="outline"
                              className={`text-xs ${statusOption?.variant === "success"
                                  ? "bg-green-50 text-green-700"
                                  : "bg-yellow-50 text-yellow-700"
                                }`}
                            >
                              {statusOption?.label}
                            </Badge>
                            {field.isRequired && (
                              <Badge variant="destructive" className="text-xs">
                                Required
                              </Badge>
                            )}
                            <Badge variant="outline" className="text-xs flex items-center gap-1">
                              <IconComponent className="h-3 w-3" />
                              {fieldType?.label || field.type}
                            </Badge>
                          </div>
                        </div>
                      </CardHeader>
                      <CardContent>
                        <div className="space-y-3">
                          <div>
                            <span className="text-sm font-medium block mb-1">Applicable For:</span>
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
                          </div>

                          {field.type === "select" && field.options && field.options.length > 0 && (
                            <div>
                              <span className="text-sm font-medium block mb-1">Select Options:</span>
                              <div className="text-xs text-muted-foreground">
                                {field.options.slice(0, 3).join(", ")}
                                {field.options.length > 3 && ` +${field.options.length - 3} more`}
                              </div>
                            </div>
                          )}

                          {field.type === "checkbox" && field.defaultValue !== undefined && (
                            <div className="flex justify-between items-center">
                              <span className="text-sm font-medium">Default Value:</span>
                              <span className="text-gray-600">
                                {field.defaultValue ? "Checked" : "Unchecked"}
                              </span>
                            </div>
                          )}

                          {field.validations && Object.keys(field.validations).length > 0 && (
                            <div>
                              <span className="text-sm font-medium block mb-1">Validations:</span>
                              <div className="flex flex-wrap gap-1">
                                {Object.entries(field.validations).map(([key, value]) => (
                                  <Badge key={key} variant="outline" className="text-xs">
                                    {key}: {value}
                                  </Badge>
                                ))}
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
                            onClick={() => handleToggleStatus(field.id, field.label, field.status)}
                            className={field.status ? "text-yellow-600 hover:text-yellow-700 hover:bg-yellow-50" : "text-green-600 hover:text-green-700 hover:bg-green-50"}
                            title={field.status ? "Make Unavailable" : "Make Available"}
                          >
                            <Power className="h-4 w-4" />
                          </Button>
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
                            onClick={() => handleDeleteClick(field.id, field.label)}
                            className="flex-1 text-red-600 hover:text-red-700 hover:bg-red-50"
                          >
                            <Trash2 className="h-4 w-4 mr-2" />
                            Delete
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  )
                })
              )}
            </div>
          </TabsContent>
        </Tabs>

        {/* Create/Edit Field Dialog */}
        <Dialog open={isDialogOpen} onOpenChange={setIsDialogOpen}>
          <DialogContent className="max-w-md max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>
                {isEditMode ? "Edit Field" : "Create New Field"}
              </DialogTitle>
              <DialogDescription>
                {isEditMode
                  ? "Update the field details. Note: Some validations may apply when changing field properties."
                  : "Create a new dynamic field. Field key and label must be unique."}
              </DialogDescription>
            </DialogHeader>

            <form onSubmit={handleFormSubmit}>
              <div className="space-y-4 py-4">
                {validationErrors.key && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validationErrors.key}
                    </AlertDescription>
                  </Alert>
                )}

                {validationErrors.label && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validationErrors.label}
                    </AlertDescription>
                  </Alert>
                )}

                {validationErrors.applicableFor && (
                  <Alert variant="destructive" className="py-2">
                    <AlertCircle className="h-4 w-4" />
                    <AlertDescription className="text-xs">
                      {validationErrors.applicableFor}
                    </AlertDescription>
                  </Alert>
                )}

                <div className="space-y-2">
                  <Label htmlFor="label">Field Label *</Label>
                  <Input
                    id="label"
                    placeholder="e.g., Serial Number"
                    value={formData.label}
                    onChange={(e) => setFormData(prev => ({ ...prev, label: e.target.value }))}
                    required
                    className={validationErrors.label ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique label for the field
                  </p>
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
                    className={validationErrors.key ? "border-red-500" : ""}
                  />
                  <p className="text-xs text-muted-foreground">
                    Unique key (auto-converted to snake_case, only letters, numbers and underscores)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="type">Field Type *</Label>
                  <Select
                    value={formData.type}
                    onValueChange={(value) => {
                      setFormData(prev => ({
                        ...prev,
                        type: value,
                        validations: {}, // Reset validations when type changes
                        defaultValue: "",
                        options: []
                      }))
                    }}
                  >
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      {FIELD_TYPES.map(type => {
                        const Icon = type.icon
                        return (
                          <SelectItem key={type.value} value={type.value} className="flex items-center gap-2">
                            <Icon className="h-4 w-4" />
                            {type.label}
                          </SelectItem>
                        )
                      })}
                    </SelectContent>
                  </Select>
                </div>

                {/* Placeholder */}
                <div className="space-y-2">
                  <Label htmlFor="placeholder">Placeholder Text</Label>
                  <Input
                    id="placeholder"
                    placeholder="e.g., Enter serial number..."
                    value={formData.placeholder}
                    onChange={(e) => setFormData(prev => ({ ...prev, placeholder: e.target.value }))}
                  />
                  <p className="text-xs text-muted-foreground">
                    Hint text to show in the input field
                  </p>
                </div>

                {/* Select Field Options */}
                {formData.type === "select" && (
                  <div className="space-y-2">
                    <Label>Select Options *</Label>
                    <div className="space-y-2">
                      <div className="flex gap-2">
                        <Input
                          placeholder="Enter an option"
                          value={optionsInput}
                          onChange={(e) => setOptionsInput(e.target.value)}
                          onKeyDown={(e) => e.key === 'Enter' && (e.preventDefault(), handleAddOption())}
                          className={validationErrors.options ? "border-red-500" : ""}
                        />
                        <Button type="button" onClick={handleAddOption}>
                          <PlusCircle className="h-4 w-4 mr-1" />
                          Add
                        </Button>
                      </div>

                      {formData.options.length > 0 && (
                        <div className="border rounded-md p-3">
                          <Label className="text-sm font-medium mb-2 block">Added Options:</Label>
                          <div className="space-y-2 max-h-32 overflow-y-auto">
                            {formData.options.map((option, index) => (
                              <div key={index} className="flex justify-between items-center p-2 bg-gray-50 rounded">
                                <span>{option}</span>
                                <Button
                                  type="button"
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRemoveOption(index)}
                                  className="h-6 w-6 p-0 text-red-500 hover:text-red-700"
                                >
                                  <MinusCircle className="h-4 w-4" />
                                </Button>
                              </div>
                            ))}
                          </div>
                          <p className="text-xs text-muted-foreground mt-2">
                            {formData.options.length} option(s) added
                          </p>
                        </div>
                      )}
                    </div>
                    {validationErrors.options && (
                      <p className="text-xs text-red-500">{validationErrors.options}</p>
                    )}

                    {/* Select Default Value - FIXED */}
                    {formData.options.length > 0 && (
                      <div className="space-y-2">
                        <Label>Default Value</Label>
                        <Select
                          value={formData.defaultValue || "none"}
                          onValueChange={(value) =>
                            setFormData(prev => ({
                              ...prev,
                              defaultValue: value === "none" ? "" : value
                            }))
                          }
                        >
                          <SelectTrigger>
                            <SelectValue placeholder="Select default value" />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="none">None</SelectItem>
                            {formData.options.map((option, index) => (
                              <SelectItem key={index} value={option}>
                                {option}
                              </SelectItem>
                            ))}
                          </SelectContent>
                        </Select>
                      </div>
                    )}
                  </div>
                )}

                {/* Checkbox Default Value */}
                {formData.type === "checkbox" && (
                  <div className="space-y-2">
                    <Label>Default Value</Label>
                    <div className="flex flex-col space-y-2">
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="defaultTrue"
                          checked={formData.defaultValue === true}
                          onChange={() => setFormData(prev => ({ ...prev, defaultValue: true }))}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="defaultTrue" className="cursor-pointer">
                          Checked (Yes/True)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="defaultFalse"
                          checked={formData.defaultValue === false}
                          onChange={() => setFormData(prev => ({ ...prev, defaultValue: false }))}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="defaultFalse" className="cursor-pointer">
                          Unchecked (No/False)
                        </Label>
                      </div>
                      <div className="flex items-center space-x-2">
                        <input
                          type="radio"
                          id="defaultNone"
                          checked={formData.defaultValue === ""}
                          onChange={() => setFormData(prev => ({ ...prev, defaultValue: "" }))}
                          className="h-4 w-4"
                        />
                        <Label htmlFor="defaultNone" className="cursor-pointer">
                          No Default Value
                        </Label>
                      </div>
                    </div>
                  </div>
                )}

                {/* Field Validations */}
                {getValidationOptions().length > 0 && (
                  <div className="space-y-3 border rounded-lg p-3">
                    <div className="flex items-center justify-between">
                      <Label className="text-sm font-medium">Field Validations</Label>
                      <Select
                        value={activeValidation}
                        onValueChange={(value) => handleAddValidation(value)}
                      >
                        <SelectTrigger className="w-[180px]">
                          <SelectValue placeholder="Add validation" />
                        </SelectTrigger>
                        <SelectContent>
                          {getValidationOptions()
                            .filter(v => !Object.keys(formData.validations).includes(v))
                            .map(v => (
                              <SelectItem key={v} value={v}>
                                {v}
                              </SelectItem>
                            ))
                          }
                        </SelectContent>
                      </Select>
                    </div>

                    {Object.keys(formData.validations).length > 0 && (
                      <div className="space-y-3">
                        {Object.entries(formData.validations).map(([key, value]) => (
                          <div key={key} className="flex items-center gap-2">
                            <div className="flex-1">
                              <Label className="text-xs capitalize">{key.replace(/([A-Z])/g, ' $1').toLowerCase()}</Label>
                              <Input
                                type={key.includes("Date") ? "date" : "text"}
                                value={value}
                                onChange={(e) => handleValidationChange(key, e.target.value)}
                                placeholder={`Enter ${key}`}
                                className="mt-1"
                              />
                            </div>
                            <Button
                              type="button"
                              variant="ghost"
                              size="sm"
                              onClick={() => handleRemoveValidation(key)}
                              className="h-10 w-10 p-0 text-red-500 hover:text-red-700"
                            >
                              <MinusCircle className="h-4 w-4" />
                            </Button>
                          </div>
                        ))}
                      </div>
                    )}

                    {validationErrors.validations && (
                      <Alert variant="destructive" className="py-2">
                        <AlertCircle className="h-4 w-4" />
                        <AlertDescription className="text-xs">
                          {validationErrors.validations}
                        </AlertDescription>
                      </Alert>
                    )}
                  </div>
                )}

                <div className="space-y-2">
                  <Label>Applicable For *</Label>
                  <div className="space-y-2">
                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="unique"
                        checked={formData.applicableFor.includes("UNIQUE")}
                        onChange={(e) => handleApplicableForChange("UNIQUE")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="unique" className="cursor-pointer">
                        Unique Identifier
                      </Label>
                    </div>

                    <div className="flex items-center space-x-2">
                      <input
                        type="checkbox"
                        id="nonUnique"
                        checked={formData.applicableFor.includes("NON_UNIQUE")}
                        onChange={(e) => handleApplicableForChange("NON_UNIQUE")}
                        className="h-4 w-4"
                      />
                      <Label htmlFor="nonUnique" className="cursor-pointer">
                        Non-Unique Identifier
                      </Label>
                    </div>
                  </div>
                  {validationErrors.applicableFor && (
                    <p className="text-xs text-red-500">{validationErrors.applicableFor}</p>
                  )}
                  <p className="text-xs text-muted-foreground">
                    Note: A field with same key/label cannot exist in overlapping categories
                  </p>
                </div>

                <div className="space-y-4">
                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.isRequired}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, isRequired: checked }))
                      }
                    />
                    <Label className="cursor-pointer">Required Field</Label>
                  </div>

                  <div className="flex items-center space-x-2">
                    <Switch
                      checked={formData.status}
                      onCheckedChange={(checked) =>
                        setFormData(prev => ({ ...prev, status: checked }))
                      }
                    />
                    <Label className="cursor-pointer">
                      {formData.status ? "Field is Available" : "Field is Unavailable"}
                    </Label>
                  </div>
                  <p className="text-xs text-muted-foreground">
                    Unavailable fields won't appear in product forms
                  </p>
                </div>
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
      </main>
    </div>
  )
}