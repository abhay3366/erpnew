'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';

const API_URL = 'http://localhost:5001';
const PRODUCTS_API = `${API_URL}/products`;
const FIELD_MASTER_API = `${API_URL}/fieldMasters`;

// ====================== Sub-Components ======================

const LoadingState = () => (
  <div className="flex justify-center items-center h-64">
    <div className="text-lg text-gray-600">Loading stock details...</div>
  </div>
);

const NotFoundState = ({ onBack }) => (
  <div className="flex flex-col items-center justify-center h-64 gap-4">
    <div className="text-lg text-red-600">Stock not found</div>
    <BackButton onClick={onBack} />
  </div>
);

const BackButton = ({ onClick, className = "", children }) => (
  <button
    onClick={onClick}
    className={`px-4 py-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 flex items-center gap-2 transition-colors ${className}`}
  >
    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
    </svg>
    {children || 'Go Back'}
  </button>
);

const SearchBar = ({ searchTerm, onSearchChange }) => (
  <div className="relative">
    <input
      type="text"
      placeholder="Search items..."
      value={searchTerm}
      onChange={(e) => onSearchChange(e.target.value)}
      className="w-full px-4 py-2 pl-10 pr-4 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
    />
    <div className="absolute left-3 top-2.5">
      <svg className="w-5 h-5 text-gray-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
      </svg>
    </div>
    {searchTerm && (
      <button
        onClick={() => onSearchChange('')}
        className="absolute right-3 top-2.5 text-gray-400 hover:text-gray-600"
      >
        ✕
      </button>
    )}
  </div>
);

const ItemsCount = ({ filteredItems, searchTerm }) => (
  <div className="mb-4">
    <p className="text-gray-600">
      Showing {filteredItems.length} item{filteredItems.length !== 1 ? 's' : ''}
      {searchTerm && ` for "${searchTerm}"`}
    </p>
  </div>
);

const Pagination = ({
  currentPage,
  totalPages,
  filteredItems,
  itemsPerPage,
  onPageChange
}) => {
  const indexOfFirstItem = (currentPage - 1) * itemsPerPage;
  const indexOfLastItem = Math.min(currentPage * itemsPerPage, filteredItems.length);

  return (
    <div className="flex flex-col md:flex-row items-center justify-between mt-6 gap-4">
      <div className="text-sm text-gray-700">
        Showing <span className="font-medium">{indexOfFirstItem + 1}</span> to{' '}
        <span className="font-medium">{indexOfLastItem}</span>{' '}
        of <span className="font-medium">{filteredItems.length}</span> results
      </div>

      <div className="flex items-center space-x-2">
        <button
          onClick={() => onPageChange(currentPage - 1)}
          disabled={currentPage === 1}
          className={`px-4 py-2 rounded-md transition-colors ${currentPage === 1
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Previous
        </button>

        <div className="flex space-x-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map((page) => (
            <button
              key={page}
              onClick={() => onPageChange(page)}
              className={`px-3 py-1 rounded transition-colors ${currentPage === page
                ? 'bg-blue-600 text-white'
                : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
            >
              {page}
            </button>
          ))}
        </div>

        <button
          onClick={() => onPageChange(currentPage + 1)}
          disabled={currentPage === totalPages}
          className={`px-4 py-2 rounded-md transition-colors ${currentPage === totalPages
            ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
            : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
            }`}
        >
          Next
        </button>
      </div>
    </div>
  );
};

const BatchRow = ({ 
  index, 
  row, 
  errors, 
  duplicateError, 
  onInputChange, 
  onRemove, 
  totalRows,
  dynamicFields 
}) => {
  const rowNumber = index + 1;

  return (
    <tr className={`${duplicateError ? 'bg-red-50' : ''} ${Object.keys(errors).length > 0 ? 'bg-yellow-50' : ''}`}>
      <td className="px-4 py-3 whitespace-nowrap">
        <div className="text-sm font-medium text-gray-900">{rowNumber}</div>
      </td>
      
      {/* Dynamic Fields based on fieldMasters */}
      {dynamicFields.map((field) => (
        <td key={field.id} className="px-4 py-3">
          <div>
            <label className="block text-xs text-gray-500 mb-1">
              {field.label} {field.isRequired && '*'}
            </label>
            
            {field.type === 'select' ? (
              <select
                value={row[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors[field.key] ? 'border-red-500' : 'border-gray-300'
                }`}
              >
                <option value="">Select {field.label}</option>
                {field.options?.map((option) => (
                  <option key={option} value={option}>
                    {option}
                  </option>
                ))}
              </select>
            ) : (
              <input
                type={field.type === 'number' ? 'number' : 'text'}
                value={row[field.key] || ''}
                onChange={(e) => onInputChange(field.key, e.target.value)}
                className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                  errors[field.key] ? 'border-red-500' : 'border-gray-300'
                }`}
                placeholder={field.placeholder || `Enter ${field.label}`}
                min={field.validations?.minValue}
                maxLength={field.validations?.maxLength}
              />
            )}
            
            {errors[field.key] && (
              <p className="mt-1 text-xs text-red-600">{errors[field.key]}</p>
            )}
            {duplicateError?.includes(field.label) && (
              <p className="mt-1 text-xs text-red-600">{duplicateError}</p>
            )}
          </div>
        </td>
      ))}
      
      <td className="px-4 py-3 whitespace-nowrap">
        <button
          type="button"
          onClick={onRemove}
          className="text-red-600 hover:text-red-800 p-1"
          disabled={totalRows === 1}
        >
          <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
          </svg>
        </button>
      </td>
    </tr>
  );
};

const AddItemsModal = ({
  isOpen,
  onClose,
  batchRows,
  errors,
  duplicateErrors,
  onInputChange,
  onAddRow,
  onRemoveRow,
  onBatchSizeChange,
  onSubmit,
  onClearAll,
  dynamicFields,
  loadingFields
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50 overflow-y-auto">
      <div className="bg-white rounded-lg shadow-xl max-w-6xl w-full my-8">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Add Multiple Items
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <div className="px-6 py-4">
          {loadingFields ? (
            <div className="flex justify-center items-center py-8">
              <div className="text-gray-600">Loading fields...</div>
            </div>
          ) : dynamicFields.length === 0 ? (
            <div className="text-center py-8 text-red-600">
              No dynamic fields configured for this product
            </div>
          ) : (
            <>
              {/* Batch size buttons */}
              <div className="mb-6">
                <p className="text-sm font-medium text-gray-700 mb-2">Add Rows in Batch:</p>
                <div className="flex gap-2">
                  {[10, 20, 30].map((size) => (
                    <button
                      key={size}
                      type="button"
                      onClick={() => onBatchSizeChange(size)}
                      className="px-4 py-2 bg-blue-100 text-blue-700 rounded-lg hover:bg-blue-200 transition-colors"
                    >
                      {size} Row{size > 1 ? 's' : ''}
                    </button>
                  ))}
                </div>
              </div>

              {/* Row count and actions */}
              <div className="flex justify-between items-center mb-4">
                <p className="text-sm text-gray-600">
                  Total Rows: <span className="font-semibold">{batchRows.length}</span>
                </p>
                <div className="flex gap-2">
                  <button
                    type="button"
                    onClick={onAddRow}
                    className="px-3 py-1 text-sm bg-green-100 text-green-700 rounded hover:bg-green-200 transition-colors flex items-center gap-1"
                  >
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
                    </svg>
                    Add 1 Row
                  </button>
                  <button
                    type="button"
                    onClick={onClearAll}
                    className="px-3 py-1 text-sm bg-red-100 text-red-700 rounded hover:bg-red-200 transition-colors"
                  >
                    Clear All
                  </button>
                </div>
              </div>

              {/* Batch items form */}
              <div className="overflow-y-scroll max-h-[400px]">
                <table className="min-w-full divide-y divide-gray-200">
                  <thead className="bg-gray-50 sticky top-0">
                    <tr>
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        #
                      </th>
                      {dynamicFields.map(field => (
                        <th key={field.id} className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                          {field.label} {field.isRequired && '*'}
                        </th>
                      ))}
                      <th className="px-4 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                        Action
                      </th>
                    </tr>
                  </thead>
                  <tbody className="bg-white divide-y divide-gray-200">
                    {batchRows.map((row, index) => (
                      <BatchRow
                        key={index}
                        index={index}
                        row={row}
                        errors={errors[index] || {}}
                        duplicateError={duplicateErrors[index]}
                        onInputChange={(fieldKey, value) => onInputChange(index, fieldKey, value)}
                        onRemove={() => onRemoveRow(index)}
                        totalRows={batchRows.length}
                        dynamicFields={dynamicFields}
                      />
                    ))}
                  </tbody>
                </table>
              </div>

              {/* Error messages */}
              {Object.keys(errors).length > 0 && (
                <div className="mt-4 p-3 bg-red-50 border border-red-200 rounded">
                  <p className="text-sm text-red-600">
                    Please fix the validation errors before submitting.
                  </p>
                </div>
              )}

              {duplicateErrors.some(error => error) && (
                <div className="mt-4 p-3 bg-yellow-50 border border-yellow-200 rounded">
                  <p className="text-sm text-yellow-600">
                    Some items have duplicate values. Please check and correct them.
                  </p>
                </div>
              )}
            </>
          )}
        </div>

        <div className="px-6 py-4 border-t flex justify-end space-x-3">
          <button
            type="button"
            onClick={onClose}
            className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
          >
            Cancel
          </button>
          <button
            type="button"
            onClick={onSubmit}
            className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            disabled={batchRows.length === 0 || dynamicFields.length === 0}
          >
            Add All Items ({batchRows.length})
          </button>
        </div>
      </div>
    </div>
  );
};

const EditItemModal = ({
  isOpen,
  onClose,
  editingItem,
  formData,
  errors,
  duplicateError,
  onInputChange,
  onSubmit,
  dynamicFields
}) => {
  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <div className="bg-white rounded-lg shadow-xl max-w-md w-full">
        <div className="px-6 py-4 border-b flex justify-between items-center">
          <h2 className="text-xl font-semibold text-gray-800">
            Edit Item
          </h2>
          <button
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors"
          >
            ✕
          </button>
        </div>

        <form onSubmit={onSubmit}>
          <div className="px-6 py-4 space-y-4">
            {duplicateError && (
              <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded text-sm">
                {duplicateError}
              </div>
            )}

            {dynamicFields.map((field) => (
              <div key={field.id}>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  {field.label} {field.isRequired && '*'}
                </label>
                
                {field.type === 'select' ? (
                  <select
                    name={field.key}
                    value={formData[field.key] || ''}
                    onChange={onInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                  >
                    <option value="">Select {field.label}</option>
                    {field.options?.map((option) => (
                      <option key={option} value={option}>
                        {option}
                      </option>
                    ))}
                  </select>
                ) : (
                  <input
                    type={field.type === 'number' ? 'number' : 'text'}
                    name={field.key}
                    value={formData[field.key] || ''}
                    onChange={onInputChange}
                    className={`w-full px-3 py-2 border rounded-lg focus:outline-none focus:ring-2 focus:ring-blue-500 transition-colors ${
                      errors[field.key] ? 'border-red-500' : 'border-gray-300'
                    }`}
                    placeholder={field.placeholder || `Enter ${field.label}`}
                    min={field.validations?.minValue}
                    maxLength={field.validations?.maxLength}
                  />
                )}
                
                {errors[field.key] && (
                  <p className="mt-1 text-sm text-red-600">{errors[field.key]}</p>
                )}
              </div>
            ))}
          </div>

          <div className="px-6 py-4 border-t flex justify-end space-x-3">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2 border border-gray-300 rounded-lg text-gray-700 hover:bg-gray-50 transition-colors"
            >
              Cancel
            </button>
            <button
              type="submit"
              className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
            >
              Update Item
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};

// ====================== Main Component ======================

const StockDetails = ({ currentSerialsIdProduct }) => {
  const id = currentSerialsIdProduct;
  const router = useRouter();

  // State declarations
  const [stock, setStock] = useState(null);
  const [items, setItems] = useState([]);
  const [filteredItems, setFilteredItems] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // New states for dynamic fields
  const [dynamicFields, setDynamicFields] = useState([]);
  const [loadingFields, setLoadingFields] = useState(false);

  // Modals state
  const [isAddModalOpen, setIsAddModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Editing state
  const [editingItem, setEditingItem] = useState(null);

  // Batch adding state
  const [batchRows, setBatchRows] = useState([]);
  const [batchErrors, setBatchErrors] = useState({});
  const [batchDuplicateErrors, setBatchDuplicateErrors] = useState([]);

  // Single edit state
  const [editFormData, setEditFormData] = useState({});
  const [editErrors, setEditErrors] = useState({});
  const [editDuplicateError, setEditDuplicateError] = useState('');

  // Other state
  const [searchTerm, setSearchTerm] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 5;

  // Handle back navigation
  const handleBack = () => {
    router.back();
  };

  // Fetch dynamic fields based on product
  const fetchDynamicFields = async (productId) => {
    if (!productId) return;
    
    setLoadingFields(true);
    try {
      // Fetch product details
      const productResponse = await fetch(`${PRODUCTS_API}/${productId}`);
      if (!productResponse.ok) throw new Error('Failed to fetch product');
      const productData = await productResponse.json();
      
      // Fetch all field masters
      const fieldsResponse = await fetch(FIELD_MASTER_API);
      if (!fieldsResponse.ok) throw new Error('Failed to fetch field masters');
      const allFields = await fieldsResponse.json();
      
      // Filter fields based on selectedFieldIds
      const filteredFields = allFields.filter(field => 
        productData.selectedFieldIds.includes(field.id)
      );
      
      setDynamicFields(filteredFields);
      
      // Initialize batch rows with these fields
      initializeBatchRows(filteredFields);
      
    } catch (error) {
      console.error('Error fetching dynamic fields:', error);
    } finally {
      setLoadingFields(false);
    }
  };

  // Fetch stock details by ID
  const fetchStockDetails = async () => {
    if (!id) return;

    setLoading(true);
    try {
      const response = await fetch(`${API_URL}/stocks/${id}`);
      if (!response.ok) throw new Error('Failed to fetch stock');
      const stockData = await response.json();

      setStock(stockData);
      setItems(stockData.items || []);
      setFilteredItems(stockData.items || []);
      
      // Fetch dynamic fields after stock is loaded
      if (stockData.productId) {
        await fetchDynamicFields(stockData.productId);
      }
      
    } catch (error) {
      console.error('Error fetching stock:', error);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStockDetails();
  }, [id]);

  // Filter and search functionality
  useEffect(() => {
    const filtered = items.filter(item => {
      const searchLower = searchTerm.toLowerCase();
      return dynamicFields.some(field => {
        const value = item[field.key];
        return value && value.toString().toLowerCase().includes(searchLower);
      });
    });
    setFilteredItems(filtered);
    setCurrentPage(1);
  }, [searchTerm, items, dynamicFields]);

  // Calculate pagination
  const totalPages = Math.ceil(filteredItems.length / itemsPerPage);

  // ==================== Initialize Batch Rows with Dynamic Fields ====================

  const initializeBatchRows = (fields, count = 1) => {
    if (!fields || fields.length === 0) return;
    
    const initialRow = {};
    fields.forEach(field => {
      if (field.defaultValue) {
        initialRow[field.key] = field.defaultValue;
      } else if (field.type === 'select' && field.options && field.options.length > 0) {
        initialRow[field.key] = field.options[0];
      } else {
        initialRow[field.key] = '';
      }
    });
    
    const rows = Array(count).fill(null).map(() => ({ ...initialRow }));
    setBatchRows(rows);
    setBatchErrors({});
    setBatchDuplicateErrors(Array(count).fill(''));
  };

  // Handle batch size change
  const handleBatchSizeChange = (size) => {
    initializeBatchRows(dynamicFields, size);
  };

  // Add a single row
  const handleAddRow = () => {
    const newRow = {};
    dynamicFields.forEach(field => {
      if (field.defaultValue) {
        newRow[field.key] = field.defaultValue;
      } else if (field.type === 'select' && field.options && field.options.length > 0) {
        newRow[field.key] = field.options[0];
      } else {
        newRow[field.key] = '';
      }
    });
    
    setBatchRows(prev => [...prev, newRow]);
    setBatchDuplicateErrors(prev => [...prev, '']);
  };

  // Remove a row
  const handleRemoveRow = (index) => {
    if (batchRows.length > 1) {
      setBatchRows(prev => prev.filter((_, i) => i !== index));
      setBatchErrors(prev => {
        const newErrors = { ...prev };
        delete newErrors[index];
        // Shift errors down
        Object.keys(newErrors).forEach(key => {
          if (parseInt(key) > index) {
            newErrors[parseInt(key) - 1] = newErrors[key];
            delete newErrors[key];
          }
        });
        return newErrors;
      });
      setBatchDuplicateErrors(prev => prev.filter((_, i) => i !== index));
    }
  };

  // Handle input change for batch rows
  const handleBatchInputChange = (index, fieldKey, value) => {
    const newRows = [...batchRows];
    newRows[index][fieldKey] = value;
    setBatchRows(newRows);

    // Clear error for this field
    setBatchErrors(prev => {
      const newErrors = { ...prev };
      if (newErrors[index] && newErrors[index][fieldKey]) {
        delete newErrors[index][fieldKey];
        if (Object.keys(newErrors[index]).length === 0) {
          delete newErrors[index];
        }
      }
      return newErrors;
    });

    // Clear duplicate error
    setBatchDuplicateErrors(prev => {
      const newErrors = [...prev];
      newErrors[index] = '';
      return newErrors;
    });
  };

  // Validate batch rows
  const validateBatchRows = () => {
    const newErrors = {};
    let isValid = true;

    batchRows.forEach((row, index) => {
      const rowErrors = {};

      dynamicFields.forEach(field => {
        if (field.isRequired && !row[field.key]?.toString().trim()) {
          rowErrors[field.key] = `${field.label} is required`;
          isValid = false;
        }
        
        // Additional validations
        if (row[field.key] && field.validations) {
          if (field.validations.minLength && row[field.key].length < field.validations.minLength) {
            rowErrors[field.key] = `${field.label} must be at least ${field.validations.minLength} characters`;
            isValid = false;
          }
          
          if (field.validations.maxLength && row[field.key].length > field.validations.maxLength) {
            rowErrors[field.key] = `${field.label} must be at most ${field.validations.maxLength} characters`;
            isValid = false;
          }
          
          if (field.type === 'number' && field.validations.minValue && 
              parseFloat(row[field.key]) < field.validations.minValue) {
            rowErrors[field.key] = `${field.label} must be at least ${field.validations.minValue}`;
            isValid = false;
          }
        }
      });

      if (Object.keys(rowErrors).length > 0) {
        newErrors[index] = rowErrors;
      }
    });

    setBatchErrors(newErrors);
    return isValid;
  };

  // Check for duplicates in batch
  const checkBatchDuplicates = () => {
    const newDuplicateErrors = Array(batchRows.length).fill('');
    let hasDuplicates = false;

    // Get unique identifier fields (like serialno, macaddress)
    const uniqueFields = dynamicFields.filter(field => 
      field.key === 'serialno' || field.key === 'macaddress'
    );

    batchRows.forEach((row, index) => {
      // Check against other batch rows
      batchRows.forEach((otherRow, otherIndex) => {
        if (index !== otherIndex) {
          uniqueFields.forEach(field => {
            if (row[field.key] && otherRow[field.key] && 
                row[field.key] === otherRow[field.key]) {
              newDuplicateErrors[index] = `${field.label} "${row[field.key]}" is duplicate`;
              hasDuplicates = true;
            }
          });
        }
      });

      // Check against existing items
      items.forEach(item => {
        uniqueFields.forEach(field => {
          if (row[field.key] && item[field.key] === row[field.key]) {
            newDuplicateErrors[index] = `${field.label} "${row[field.key]}" already exists`;
            hasDuplicates = true;
          }
        });
      });
    });

    setBatchDuplicateErrors(newDuplicateErrors);
    return !hasDuplicates;
  };

  // Clear all batch rows
  const handleClearAll = () => {
    initializeBatchRows(dynamicFields, 1);
  };

  // Submit batch items
  const handleBatchSubmit = async () => {
    // Filter out empty rows
    const validRows = batchRows.filter(row => {
      return dynamicFields.every(field => 
        !field.isRequired || row[field.key]?.toString().trim()
      );
    });

    if (validRows.length === 0) {
      alert('Please enter at least one valid item');
      return;
    }

    if (!validateBatchRows()) return;
    if (!checkBatchDuplicates()) return;

    try {
      const newItems = validRows.map(row => ({
        id: Date.now() + Math.random(),
        ...row,
        vendorId: stock.vendorId,
        productId: stock.productId
      }));

      const updatedItems = [...items, ...newItems];
      const updatedStock = {
        ...stock,
        items: updatedItems,
        quantity: updatedItems.length
      };

      const response = await fetch(`${API_URL}/stocks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStock),
      });

      if (response.ok) {
        await fetchStockDetails();
        setIsAddModalOpen(false);
        initializeBatchRows(dynamicFields, 1);
        alert(`Successfully added ${newItems.length} item${newItems.length !== 1 ? 's' : ''}`);
      }
    } catch (error) {
      console.error('Error adding batch items:', error);
      alert('Error adding items. Please try again.');
    }
  };

  // ==================== Single Edit Functions ====================

  // Open edit modal
  const handleEdit = (item) => {
    setEditingItem(item);
    
    // Prepare form data with all dynamic fields
    const formData = {};
    dynamicFields.forEach(field => {
      formData[field.key] = item[field.key] || '';
    });
    
    setEditFormData(formData);
    setEditErrors({});
    setEditDuplicateError('');
    setIsEditModalOpen(true);
  };

  // Handle edit input change
  const handleEditInputChange = (e) => {
    const { name, value } = e.target;
    setEditFormData(prev => ({
      ...prev,
      [name]: value
    }));

    // Clear duplicate error when user starts typing
    setEditDuplicateError('');
  };

  // Check for duplicate in edit
  const checkEditDuplicate = (itemData) => {
    const uniqueFields = dynamicFields.filter(field => 
      field.key === 'serialno' || field.key === 'macaddress'
    );
    
    let duplicateError = '';

    items.forEach(item => {
      if (editingItem && item.id === editingItem.id) return;

      uniqueFields.forEach(field => {
        if (itemData[field.key] && item[field.key] === itemData[field.key]) {
          duplicateError = `${field.label} "${itemData[field.key]}" already exists`;
        }
      });
    });

    return duplicateError;
  };

  // Validate edit form
  const validateEditForm = () => {
    const newErrors = {};

    dynamicFields.forEach(field => {
      if (field.isRequired && !editFormData[field.key]?.toString().trim()) {
        newErrors[field.key] = `${field.label} is required`;
      }
      
      // Additional validations
      if (editFormData[field.key] && field.validations) {
        if (field.validations.minLength && editFormData[field.key].length < field.validations.minLength) {
          newErrors[field.key] = `${field.label} must be at least ${field.validations.minLength} characters`;
        }
        
        if (field.validations.maxLength && editFormData[field.key].length > field.validations.maxLength) {
          newErrors[field.key] = `${field.label} must be at most ${field.validations.maxLength} characters`;
        }
        
        if (field.type === 'number' && field.validations.minValue && 
            parseFloat(editFormData[field.key]) < field.validations.minValue) {
          newErrors[field.key] = `${field.label} must be at least ${field.validations.minValue}`;
        }
      }
    });

    const duplicateError = checkEditDuplicate(editFormData);
    if (duplicateError) {
      setEditDuplicateError(duplicateError);
      return false;
    }

    setEditErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  // Submit edit
  const handleEditSubmit = async (e) => {
    e.preventDefault();
    if (!validateEditForm()) return;

    try {
      const updatedItems = items.map(item =>
        item.id === editingItem.id ? { ...item, ...editFormData } : item
      );

      const updatedStock = {
        ...stock,
        items: updatedItems,
        quantity: updatedItems.length
      };

      const response = await fetch(`${API_URL}/stocks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStock),
      });

      if (response.ok) {
        await fetchStockDetails();
        setIsEditModalOpen(false);
        setEditingItem(null);
      }
    } catch (error) {
      console.error('Error updating item:', error);
    }
  };

  // ==================== Common Functions ====================

  // Delete item
  const handleDelete = async (itemId) => {
    if (!window.confirm('Are you sure you want to delete this item?')) return;

    try {
      const updatedItems = items.filter(item => item.id !== itemId);
      const updatedStock = {
        ...stock,
        items: updatedItems,
        quantity: updatedItems.length
      };

      const response = await fetch(`${API_URL}/stocks/${id}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(updatedStock),
      });

      if (response.ok) {
        await fetchStockDetails();
      }
    } catch (error) {
      console.error('Error deleting item:', error);
    }
  };

  // Open add modal
  const handleAddNew = () => {
    if (dynamicFields.length === 0) {
      alert('No dynamic fields found for this product');
      return;
    }
    setIsAddModalOpen(true);
  };

  // Close add modal
  const closeAddModal = () => {
    setIsAddModalOpen(false);
    initializeBatchRows(dynamicFields, 1);
  };

  // Close edit modal
  const closeEditModal = () => {
    setIsEditModalOpen(false);
    setEditingItem(null);
    setEditFormData({});
    setEditErrors({});
    setEditDuplicateError('');
  };

  // Handle page change
  const handlePageChange = (pageNumber) => {
    setCurrentPage(pageNumber);
  };

  // StockHeader Component
  const StockHeader = ({ stock, vendorId, productId }) => {
    const productFields = dynamicFields.map(field => field.label).join(', ');
    
    return (
      <div className="bg-white rounded-lg shadow p-6">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <h2 className="text-2xl font-bold text-gray-800">Stock Details</h2>
            <p className="text-sm text-gray-600 mt-1">
              Fields: {productFields || 'Loading...'}
            </p>
          </div>
          <div className="text-left md:text-right">
            <p className="text-sm text-gray-500">Product: {stock?.productName || ''}</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-4">
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Product ID</p>
            <p className="font-medium text-gray-800">{productId}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Total Items</p>
            <p className="font-medium text-gray-800">{stock?.quantity || 0}</p>
          </div>
          <div className="bg-gray-50 p-4 rounded-lg">
            <p className="text-sm text-gray-500">Items Displayed</p>
            <p className="font-medium text-gray-800">{stock?.items?.length || 0}</p>
          </div>
        </div>
      </div>
    );
  };

  // ItemsTable Component
  const ItemsTable = ({
    currentItems,
    currentPage,
    itemsPerPage,
    onEdit,
    onDelete,
    dynamicFields
  }) => (
    <div className="bg-white rounded-lg shadow overflow-scroll">
      <div className="overflow-x-auto">
        <table className="min-w-full divide-y divide-gray-200">
          <thead className="bg-gray-50">
            <tr>
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                S.No
              </th>
              {dynamicFields.map(field => (
                <th key={field.id} className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                  {field.label}
                </th>
              ))}
              <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="bg-white divide-y divide-gray-200">
            {currentItems.length === 0 ? (
              <tr>
                <td colSpan={dynamicFields.length + 2} className="px-6 py-12 text-center text-gray-500">
                  No items found
                </td>
              </tr>
            ) : (
              currentItems.map((item, index) => (
                <ItemRow
                  key={item.id}
                  item={item}
                  index={index}
                  currentPage={currentPage}
                  itemsPerPage={itemsPerPage}
                  onEdit={onEdit}
                  onDelete={onDelete}
                  dynamicFields={dynamicFields}
                />
              ))
            )}
          </tbody>
        </table>
      </div>
    </div>
  );

  // ItemRow Component
  const ItemRow = ({ item, index, currentPage, itemsPerPage, onEdit, onDelete, dynamicFields }) => (
    <tr className="hover:bg-gray-50 transition-colors">
      <td className="px-6 py-4 whitespace-nowrap">
        <div className="text-sm text-gray-900">
          {(currentPage - 1) * itemsPerPage + index + 1}
        </div>
      </td>
      {dynamicFields.map(field => (
        <td key={field.id} className="px-6 py-4 whitespace-nowrap">
          <div className="text-sm font-medium text-gray-900">
            {item[field.key] || '-'}
          </div>
        </td>
      ))}
      <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
        <div className="flex gap-2">
          <button
            onClick={() => onEdit(item)}
            className="text-blue-600 hover:text-blue-900 px-3 py-1 border border-blue-600 rounded hover:bg-blue-50 transition-colors"
          >
            Edit
          </button>
          <button
            onClick={() => onDelete(item.id)}
            className="text-red-600 hover:text-red-900 px-3 py-1 border border-red-600 rounded hover:bg-red-50 transition-colors"
          >
            Delete
          </button>
        </div>
      </td>
    </tr>
  );

  // Loading and error states
  if (loading) return <LoadingState />;
  if (!stock) return <NotFoundState onBack={handleBack} />;

  // Calculate current items for pagination
  const indexOfLastItem = currentPage * itemsPerPage;
  const indexOfFirstItem = indexOfLastItem - itemsPerPage;
  const currentItems = filteredItems.slice(indexOfFirstItem, indexOfLastItem);

  return (
    <div className="p-4 bg-gray-50 min-h-screen">
      <div className="max-w-7xl mx-auto">
        {/* Back Button and Header */}
        <div className="mb-6">
          <BackButton onClick={handleBack} className="mb-4" />
          <StockHeader
            stock={stock}
            vendorId={stock.vendorId}
            productId={stock.productId}
          />
        </div>

        {/* Search and Add Button */}
        <div className="flex flex-col md:flex-row justify-between items-center mb-6 gap-4">
          <div className="w-full md:w-1/3">
            <SearchBar
              searchTerm={searchTerm}
              onSearchChange={setSearchTerm}
            />
          </div>

          <div className="flex gap-3">
            <button
              onClick={handleBack}
              className="px-4 py-2 border border-gray-300 text-gray-700 rounded-lg hover:bg-gray-50 flex items-center gap-2 transition-colors"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
              Back
            </button>
            <button
              onClick={handleAddNew}
              className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg font-medium flex items-center gap-2 transition-colors"
              disabled={dynamicFields.length === 0}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
              </svg>
              Add Multiple Items
            </button>
          </div>
        </div>

        {/* Items Count */}
        <ItemsCount
          filteredItems={filteredItems}
          searchTerm={searchTerm}
        />

        {/* Items Table */}
        <ItemsTable
          currentItems={currentItems}
          currentPage={currentPage}
          itemsPerPage={itemsPerPage}
          onEdit={handleEdit}
          onDelete={handleDelete}
          dynamicFields={dynamicFields}
        />

        {/* Pagination */}
        {totalPages > 1 && (
          <Pagination
            currentPage={currentPage}
            totalPages={totalPages}
            filteredItems={filteredItems}
            itemsPerPage={itemsPerPage}
            onPageChange={handlePageChange}
          />
        )}

        {/* Modal for Batch Adding */}
        <AddItemsModal
          isOpen={isAddModalOpen}
          onClose={closeAddModal}
          batchRows={batchRows}
          errors={batchErrors}
          duplicateErrors={batchDuplicateErrors}
          onInputChange={handleBatchInputChange}
          onAddRow={handleAddRow}
          onRemoveRow={handleRemoveRow}
          onBatchSizeChange={handleBatchSizeChange}
          onSubmit={handleBatchSubmit}
          onClearAll={handleClearAll}
          dynamicFields={dynamicFields}
          loadingFields={loadingFields}
        />

        {/* Modal for Editing */}
        <EditItemModal
          isOpen={isEditModalOpen}
          onClose={closeEditModal}
          editingItem={editingItem}
          formData={editFormData}
          errors={editErrors}
          duplicateError={editDuplicateError}
          onInputChange={handleEditInputChange}
          onSubmit={handleEditSubmit}
          dynamicFields={dynamicFields}
        />
      </div>
    </div>
  );
};

export default StockDetails;