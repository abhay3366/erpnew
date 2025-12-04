'use client';


import { useState } from 'react';
import VendorForm from '../../../../../components/vendor/VendorForm';
import VendorTable from '../../../../../components/vendor/VendorTable';

export default function VendorList() {
    const [currentView, setCurrentView] = useState('list'); // 'list', 'create', 'edit', 'view'
    const [selectedVendor, setSelectedVendor] = useState(null);

    // Handle view changes
    const handleViewCreate = () => {
        setCurrentView('create');
        setSelectedVendor(null);
    };

    const handleViewEdit = (vendor) => {
        setCurrentView('edit');
        setSelectedVendor(vendor);
    };

    const handleViewDetails = (vendor) => {
        setCurrentView('view');
        setSelectedVendor(vendor);
    };

    const handleBackToList = () => {
        setCurrentView('list');
        setSelectedVendor(null);
    };

    const handleSuccess = () => {
        // Success pe automatically list pe wapas jayega
        setTimeout(() => {
            setCurrentView('list');
            setSelectedVendor(null);
        }, 1500);
    };

    // Render current view
    const renderCurrentView = () => {
        switch (currentView) {
            case 'create':
                return (
                    <VendorForm
                        mode="create"
                        onBack={handleBackToList}
                        onSuccess={handleSuccess}
                    />
                );
            
            case 'edit':
                return (
                    <VendorForm 
                        mode="edit"
                        vendor={selectedVendor}
                        onBack={handleBackToList}
                        onSuccess={handleSuccess}
                    />
                );
            
            case 'view':
                return (
                    <VendorForm 
                        mode="view"
                        vendor={selectedVendor}
                        onBack={handleBackToList}
                        onEdit={() => handleViewEdit(selectedVendor)}
                    />
                );
            
            case 'list':
            default:
                return (
                    <VendorTable
                        onCreateVendor={handleViewCreate}
                        onEditVendor={handleViewEdit}
                        onViewDetails={handleViewDetails}
                    />
                );
        }
    };

    return (
        <div className="min-h-screen bg-gray-50">
            {renderCurrentView()}
        </div>
    );
}