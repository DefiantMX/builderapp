"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Download, 
  FileText, 
  Table, 
  Calendar,
  Building2,
  DollarSign,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from "lucide-react";

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
  division: string;
}

interface InvoiceExportProps {
  invoices: Invoice[];
  filters: any;
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

export default function InvoiceExport({ invoices, filters, onExport }: InvoiceExportProps) {
  const [isExporting, setIsExporting] = useState(false);

  const handleExport = async (format: 'csv' | 'pdf' | 'excel') => {
    setIsExporting(true);
    try {
      await onExport(format);
    } finally {
      setIsExporting(false);
    }
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

  const getTotalAmount = () => {
    return invoices.reduce((sum, invoice) => sum + invoice.amount, 0);
  };

  const getStatusCounts = () => {
    const counts = { UNPAID: 0, PAID: 0, OVERDUE: 0, PARTIAL: 0 };
    invoices.forEach(invoice => {
      counts[invoice.status]++;
    });
    return counts;
  };

  const statusCounts = getStatusCounts();

  return (
    <Card className="mb-6">
      <CardHeader>
        <CardTitle className="text-lg font-semibold flex items-center gap-2">
          <Download className="h-5 w-5" />
          Export Invoices
        </CardTitle>
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Summary Stats */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="bg-blue-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-blue-600">
                {invoices.length}
              </div>
              <div className="text-sm text-blue-800">Total Invoices</div>
            </div>
            <div className="bg-green-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-green-600">
                {formatCurrency(getTotalAmount())}
              </div>
              <div className="text-sm text-green-800">Total Amount</div>
            </div>
            <div className="bg-red-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-red-600">
                {statusCounts.UNPAID}
              </div>
              <div className="text-sm text-red-800">Unpaid</div>
            </div>
            <div className="bg-orange-50 p-4 rounded-lg">
              <div className="text-2xl font-bold text-orange-600">
                {statusCounts.OVERDUE}
              </div>
              <div className="text-sm text-orange-800">Overdue</div>
            </div>
          </div>

          {/* Status Breakdown */}
          <div className="flex flex-wrap gap-2">
            {Object.entries(statusCounts).map(([status, count]) => {
              const config = STATUS_CONFIG[status as keyof typeof STATUS_CONFIG];
              return (
                <Badge key={status} className={`${config.color} flex items-center gap-1`}>
                  {config.icon}
                  {config.label}: {count}
                </Badge>
              );
            })}
          </div>

          {/* Active Filters */}
          {Object.values(filters).some(value => value !== '') && (
            <div className="bg-gray-50 p-4 rounded-lg">
              <h4 className="font-medium text-gray-700 mb-2">Active Filters:</h4>
              <div className="flex flex-wrap gap-2">
                {filters.search && (
                  <Badge variant="secondary">Search: {filters.search}</Badge>
                )}
                {filters.vendor && (
                  <Badge variant="secondary">Vendor: {filters.vendor}</Badge>
                )}
                {filters.status && (
                  <Badge variant="secondary">Status: {filters.status}</Badge>
                )}
                {filters.month && (
                  <Badge variant="secondary">Month: {filters.month}</Badge>
                )}
                {filters.year && (
                  <Badge variant="secondary">Year: {filters.year}</Badge>
                )}
                {filters.minAmount && (
                  <Badge variant="secondary">Min: ${filters.minAmount}</Badge>
                )}
                {filters.maxAmount && (
                  <Badge variant="secondary">Max: ${filters.maxAmount}</Badge>
                )}
              </div>
            </div>
          )}

          {/* Export Options */}
          <div className="flex flex-wrap gap-3">
            <Button
              onClick={() => handleExport('csv')}
              disabled={isExporting}
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export CSV
            </Button>
            <Button
              onClick={() => handleExport('excel')}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <Table className="h-4 w-4" />
              Export Excel
            </Button>
            <Button
              onClick={() => handleExport('pdf')}
              disabled={isExporting}
              variant="outline"
              className="flex items-center gap-2"
            >
              <FileText className="h-4 w-4" />
              Export PDF
            </Button>
          </div>

          {isExporting && (
            <div className="text-center text-gray-600">
              <div className="animate-spin rounded-full h-6 w-6 border-b-2 border-blue-600 mx-auto mb-2"></div>
              Preparing export...
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}
