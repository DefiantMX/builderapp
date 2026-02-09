"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Search, 
  Filter, 
  Download, 
  Calendar, 
  Building2, 
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

export interface InvoiceFilters {
  search: string;
  vendor: string;
  status: string;
  month: string;
  year: string;
  minAmount: string;
  maxAmount: string;
  sortBy: string;
  sortOrder: 'asc' | 'desc';
}

interface InvoiceFiltersProps {
  filters: InvoiceFilters;
  onFiltersChange: (filters: InvoiceFilters) => void;
  onExport: () => void;
  vendorOptions: string[];
  totalInvoices: number;
  filteredCount: number;
}

const STATUS_OPTIONS = [
  { value: '', label: 'All Status', icon: null },
  { value: 'UNPAID', label: 'Unpaid', icon: <XCircle className="h-4 w-4 text-red-500" /> },
  { value: 'PAID', label: 'Paid', icon: <CheckCircle className="h-4 w-4 text-green-500" /> },
  { value: 'OVERDUE', label: 'Overdue', icon: <AlertTriangle className="h-4 w-4 text-orange-500" /> },
  { value: 'PARTIAL', label: 'Partial', icon: <Clock className="h-4 w-4 text-yellow-500" /> },
];

const SORT_OPTIONS = [
  { value: 'date', label: 'Date' },
  { value: 'amount', label: 'Amount' },
  { value: 'vendor', label: 'Vendor' },
  { value: 'status', label: 'Status' },
  { value: 'dueDate', label: 'Due Date' },
];

const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function InvoiceFilters({
  filters,
  onFiltersChange,
  onExport,
  vendorOptions,
  totalInvoices,
  filteredCount
}: InvoiceFiltersProps) {
  const [showAdvanced, setShowAdvanced] = useState(false);

  const handleFilterChange = (key: keyof InvoiceFilters, value: string) => {
    onFiltersChange({
      ...filters,
      [key]: value
    });
  };

  const clearFilters = () => {
    onFiltersChange({
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
  };

  const getActiveFiltersCount = () => {
    let count = 0;
    if (filters.search) count++;
    if (filters.vendor) count++;
    if (filters.status) count++;
    if (filters.month) count++;
    if (filters.year) count++;
    if (filters.minAmount) count++;
    if (filters.maxAmount) count++;
    return count;
  };

  const activeFiltersCount = getActiveFiltersCount();

  return (
    <Card className="mb-6">
      <CardHeader className="pb-4">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg font-semibold flex items-center gap-2">
            <Filter className="h-5 w-5" />
            Invoice Filters
            {activeFiltersCount > 0 && (
              <Badge variant="secondary" className="ml-2">
                {activeFiltersCount} active
              </Badge>
            )}
          </CardTitle>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setShowAdvanced(!showAdvanced)}
            >
              {showAdvanced ? 'Hide' : 'Show'} Advanced
            </Button>
            <Button
              variant="outline"
              size="sm"
              onClick={onExport}
              className="flex items-center gap-2"
            >
              <Download className="h-4 w-4" />
              Export
            </Button>
          </div>
        </div>
        
        <div className="text-sm text-gray-600">
          Showing {filteredCount} of {totalInvoices} invoices
        </div>
      </CardHeader>

      <CardContent className="space-y-4">
        {/* Basic Filters */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          {/* Search */}
          <div className="relative">
            <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
            <Input
              placeholder="Search invoices..."
              value={filters.search}
              onChange={(e) => handleFilterChange('search', e.target.value)}
              className="pl-10"
            />
          </div>

          {/* Vendor Filter */}
          <select
            value={filters.vendor}
            onChange={(e) => handleFilterChange('vendor', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            <option value="">All Vendors</option>
            {vendorOptions.map((vendor) => (
              <option key={vendor} value={vendor}>
                {vendor}
              </option>
            ))}
          </select>

          {/* Status Filter */}
          <select
            value={filters.status}
            onChange={(e) => handleFilterChange('status', e.target.value)}
            className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
          >
            {STATUS_OPTIONS.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
        </div>

        {/* Advanced Filters */}
        {showAdvanced && (
          <div className="border-t pt-4">
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {/* Month Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Month
                </label>
                <select
                  value={filters.month}
                  onChange={(e) => handleFilterChange('month', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Months</option>
                  {MONTHS.map((month, index) => (
                    <option key={month} value={String(index + 1)}>
                      {month}
                    </option>
                  ))}
                </select>
              </div>

              {/* Year Filter */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Year
                </label>
                <select
                  value={filters.year}
                  onChange={(e) => handleFilterChange('year', e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  <option value="">All Years</option>
                  {Array.from({ length: 5 }, (_, i) => {
                    const year = new Date().getFullYear() - i;
                    return (
                      <option key={year} value={String(year)}>
                        {year}
                      </option>
                    );
                  })}
                </select>
              </div>

              {/* Min Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Min Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="0"
                    value={filters.minAmount}
                    onChange={(e) => handleFilterChange('minAmount', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>

              {/* Max Amount */}
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Max Amount
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    placeholder="No limit"
                    value={filters.maxAmount}
                    onChange={(e) => handleFilterChange('maxAmount', e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>
          </div>
        )}

        {/* Sort Options */}
        <div className="border-t pt-4">
          <div className="flex items-center gap-4">
            <label className="text-sm font-medium text-gray-700">Sort by:</label>
            <select
              value={filters.sortBy}
              onChange={(e) => handleFilterChange('sortBy', e.target.value)}
              className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
            >
              {SORT_OPTIONS.map((option) => (
                <option key={option.value} value={option.value}>
                  {option.label}
                </option>
              ))}
            </select>
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => handleFilterChange('sortOrder', filters.sortOrder === 'asc' ? 'desc' : 'asc')}
            >
              {filters.sortOrder === 'asc' ? '↑' : '↓'}
            </Button>
          </div>
        </div>

        {/* Action Buttons */}
        {activeFiltersCount > 0 && (
          <div className="border-t pt-4">
            <Button
              variant="outline"
              size="sm"
              onClick={clearFilters}
              className="text-gray-600 hover:text-gray-800"
            >
              Clear All Filters
            </Button>
          </div>
        )}
      </CardContent>
    </Card>
  );
}
