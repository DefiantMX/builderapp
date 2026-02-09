"use client"

import { useState, useEffect } from 'react';
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import InvoiceFilters, { InvoiceFilters as InvoiceFiltersType } from './InvoiceFilters';
import { 
  CheckCircle, 
  XCircle, 
  Clock, 
  AlertTriangle,
  Edit,
  Trash2,
  Eye,
  MoreHorizontal,
  Calendar,
  Building2,
  DollarSign
} from "lucide-react";

type DivisionCode = "00" | "01" | "02" | "03" | "04" | "05" | "06" | "07" | "08" | "09" | "10" | "11" | "12" | "13" | "14" | "15" | "16" | "17" | "21" | "22" | "23" | "26" | "27" | "28" | "31" | "32" | "33";

interface Invoice {
  id: string;
  invoiceNumber?: string;
  vendor: string;
  amount: number;
  date: string;
  dueDate?: string;
  paymentDate?: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  description?: string;
  division: DivisionCode;
  projectId: string;
}

interface EnhancedInvoiceListProps {
  invoices: Invoice[];
  onEdit: (invoice: Invoice) => void;
  onDelete: (invoiceId: string) => void;
  onView: (invoice: Invoice) => void;
  onBulkStatusUpdate: (invoiceIds: string[], status: string) => void;
  onExport: (format: 'csv' | 'pdf' | 'excel') => void;
}

const STATUS_CONFIG = {
  UNPAID: { 
    label: 'Unpaid', 
    color: 'bg-red-100 text-red-800', 
    icon: <XCircle className="h-4 w-4" /> 
  },
  PAID: { 
    label: 'Paid', 
    color: 'bg-green-100 text-green-800', 
    icon: <CheckCircle className="h-4 w-4" /> 
  },
  OVERDUE: { 
    label: 'Overdue', 
    color: 'bg-orange-100 text-orange-800', 
    icon: <AlertTriangle className="h-4 w-4" /> 
  },
  PARTIAL: { 
    label: 'Partial', 
    color: 'bg-yellow-100 text-yellow-800', 
    icon: <Clock className="h-4 w-4" /> 
  },
};

export default function EnhancedInvoiceList({
  invoices,
  onEdit,
  onDelete,
  onView,
  onBulkStatusUpdate,
  onExport
}: EnhancedInvoiceListProps) {
  const [selectedInvoices, setSelectedInvoices] = useState<Set<string>>(new Set());
  const [filters, setFilters] = useState<InvoiceFiltersType>({
    search: '',
    vendor: '',
    status: '',
    month: '',
    year: '',
    minAmount: '',
    maxAmount: '',
    sortBy: 'date',
    sortOrder: 'desc'
  });

  // Get unique vendors for filter dropdown
  const vendorOptions = Array.from(new Set(invoices.map(invoice => invoice.vendor)));

  // Filter and sort invoices
  const filteredInvoices = invoices.filter(invoice => {
    // Search filter
    if (filters.search) {
      const searchTerm = filters.search.toLowerCase();
      const matchesSearch = 
        invoice.vendor.toLowerCase().includes(searchTerm) ||
        invoice.description?.toLowerCase().includes(searchTerm) ||
        invoice.invoiceNumber?.toLowerCase().includes(searchTerm);
      if (!matchesSearch) return false;
    }

    // Vendor filter
    if (filters.vendor && invoice.vendor !== filters.vendor) return false;

    // Status filter
    if (filters.status && invoice.status !== filters.status) return false;

    // Month filter
    if (filters.month) {
      const invoiceMonth = new Date(invoice.date).getMonth() + 1;
      if (invoiceMonth !== parseInt(filters.month)) return false;
    }

    // Year filter
    if (filters.year) {
      const invoiceYear = new Date(invoice.date).getFullYear();
      if (invoiceYear !== parseInt(filters.year)) return false;
    }

    // Amount filters
    if (filters.minAmount && invoice.amount < parseFloat(filters.minAmount)) return false;
    if (filters.maxAmount && invoice.amount > parseFloat(filters.maxAmount)) return false;

    return true;
  }).sort((a, b) => {
    let comparison = 0;
    
    switch (filters.sortBy) {
      case 'date':
        comparison = new Date(a.date).getTime() - new Date(b.date).getTime();
        break;
      case 'amount':
        comparison = a.amount - b.amount;
        break;
      case 'vendor':
        comparison = a.vendor.localeCompare(b.vendor);
        break;
      case 'status':
        comparison = a.status.localeCompare(b.status);
        break;
      case 'dueDate':
        const aDueDate = a.dueDate ? new Date(a.dueDate).getTime() : 0;
        const bDueDate = b.dueDate ? new Date(b.dueDate).getTime() : 0;
        comparison = aDueDate - bDueDate;
        break;
      default:
        comparison = 0;
    }

    return filters.sortOrder === 'asc' ? comparison : -comparison;
  });

  const handleSelectInvoice = (invoiceId: string, selected: boolean) => {
    const newSelected = new Set(selectedInvoices);
    if (selected) {
      newSelected.add(invoiceId);
    } else {
      newSelected.delete(invoiceId);
    }
    setSelectedInvoices(newSelected);
  };

  const handleSelectAll = (selected: boolean) => {
    if (selected) {
      setSelectedInvoices(new Set(filteredInvoices.map(invoice => invoice.id)));
    } else {
      setSelectedInvoices(new Set());
    }
  };

  const handleBulkStatusUpdate = (status: string) => {
    onBulkStatusUpdate(Array.from(selectedInvoices), status);
    setSelectedInvoices(new Set());
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD'
    }).format(amount);
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  };

  const isOverdue = (invoice: Invoice) => {
    if (invoice.status === 'PAID') return false;
    if (!invoice.dueDate) return false;
    return new Date(invoice.dueDate) < new Date();
  };

  return (
    <div className="space-y-6">
      {/* Filters */}
      <InvoiceFilters
        filters={filters}
        onFiltersChange={setFilters}
        onExport={() => onExport('csv')}
        vendorOptions={vendorOptions}
        totalInvoices={invoices.length}
        filteredCount={filteredInvoices.length}
      />

      {/* Bulk Actions */}
      {selectedInvoices.size > 0 && (
        <Card className="bg-blue-50 border-blue-200">
          <CardContent className="py-4">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-4">
                <span className="text-sm font-medium text-blue-800">
                  {selectedInvoices.size} invoice{selectedInvoices.size !== 1 ? 's' : ''} selected
                </span>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate('PAID')}
                    className="text-green-700 border-green-300 hover:bg-green-50"
                  >
                    Mark as Paid
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleBulkStatusUpdate('UNPAID')}
                    className="text-red-700 border-red-300 hover:bg-red-50"
                  >
                    Mark as Unpaid
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => setSelectedInvoices(new Set())}
                  >
                    Clear Selection
                  </Button>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      )}

      {/* Invoice Table */}
      <Card>
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-xl font-semibold">Invoices</CardTitle>
            <div className="text-sm text-gray-600">
              {filteredInvoices.length} of {invoices.length} invoices
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div className="overflow-x-auto">
            <table className="w-full">
              <thead>
                <tr className="border-b">
                  <th className="text-left py-3 px-4">
                    <input
                      type="checkbox"
                      checked={selectedInvoices.size === filteredInvoices.length && filteredInvoices.length > 0}
                      onChange={(e) => handleSelectAll(e.target.checked)}
                      className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                    />
                  </th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Invoice #</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Vendor</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Due Date</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Amount</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Status</th>
                  <th className="text-left py-3 px-4 font-medium text-gray-700">Division</th>
                  <th className="text-right py-3 px-4 font-medium text-gray-700">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredInvoices.map((invoice) => {
                  const statusConfig = STATUS_CONFIG[invoice.status];
                  const overdue = isOverdue(invoice);
                  
                  return (
                    <tr 
                      key={invoice.id}
                      className={`border-b hover:bg-gray-50 ${
                        selectedInvoices.has(invoice.id) ? 'bg-blue-50' : ''
                      } ${overdue ? 'bg-red-50' : ''}`}
                    >
                      <td className="py-3 px-4">
                        <input
                          type="checkbox"
                          checked={selectedInvoices.has(invoice.id)}
                          onChange={(e) => handleSelectInvoice(invoice.id, e.target.checked)}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {invoice.invoiceNumber || 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Building2 className="h-4 w-4 text-gray-400" />
                          {invoice.vendor}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <Calendar className="h-4 w-4 text-gray-400" />
                          {formatDate(invoice.date)}
                        </div>
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        {invoice.dueDate ? formatDate(invoice.dueDate) : 'N/A'}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4 text-gray-400" />
                          {formatCurrency(invoice.amount)}
                        </div>
                      </td>
                      <td className="py-3 px-4">
                        <Badge className={`${statusConfig.color} flex items-center gap-1 w-fit`}>
                          {statusConfig.icon}
                          {statusConfig.label}
                        </Badge>
                        {overdue && (
                          <Badge className="ml-2 bg-red-100 text-red-800">
                            Overdue
                          </Badge>
                        )}
                      </td>
                      <td className="py-3 px-4 text-sm text-gray-900">
                        Division {invoice.division}
                      </td>
                      <td className="py-3 px-4">
                        <div className="flex items-center gap-2">
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onView(invoice)}
                            className="text-blue-600 hover:text-blue-800"
                          >
                            <Eye className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onEdit(invoice)}
                            className="text-gray-600 hover:text-gray-800"
                          >
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button
                            size="sm"
                            variant="ghost"
                            onClick={() => onDelete(invoice.id)}
                            className="text-red-600 hover:text-red-800"
                          >
                            <Trash2 className="h-4 w-4" />
                          </Button>
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            
            {filteredInvoices.length === 0 && (
              <div className="text-center py-8">
                <div className="text-gray-500 mb-2">No invoices found</div>
                <div className="text-sm text-gray-400">
                  {invoices.length === 0 
                    ? 'No invoices have been added yet.' 
                    : 'Try adjusting your filters to see more results.'
                  }
                </div>
              </div>
            )}
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
