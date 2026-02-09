"use client"

import { useState } from 'react';
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { 
  Calendar, 
  Building2, 
  DollarSign, 
  FileText, 
  AlertCircle,
  CheckCircle,
  Clock,
  XCircle
} from "lucide-react";

interface DivisionAllocation {
  division: string;
  amount: number;
}

interface Invoice {
  id?: string;
  invoiceNumber?: string;
  vendor: string;
  amount: number;
  date: string;
  dueDate?: string;
  paymentDate?: string;
  status: 'UNPAID' | 'PAID' | 'OVERDUE' | 'PARTIAL';
  description?: string;
  division: string;
  divisionAllocations?: DivisionAllocation[];
}

interface EnhancedInvoiceFormProps {
  projectId: string;
  invoice?: Invoice;
  onSuccess: () => void;
  onCancel: () => void;
}

const DIVISIONS = {
  "01": "General Requirements",
  "02": "Site Construction", 
  "03": "Concrete",
  "04": "Masonry",
  "05": "Metals",
  "06": "Wood, Plastics, and Composites",
  "07": "Thermal and Moisture Protection",
  "08": "Openings",
  "09": "Finishes",
  "10": "Specialties",
  "11": "Equipment",
  "12": "Furnishings",
  "13": "Special Construction",
  "14": "Conveying Equipment",
  "15": "Fire Suppression",
  "16": "Plumbing",
  "17": "HVAC",
  "18": "Electrical",
  "19": "Communications",
  "20": "Electronic Safety and Security",
  "21": "Electronic Safety and Security",
  "22": "Electronic Safety and Security",
  "23": "Electronic Safety and Security",
  "24": "Electronic Safety and Security",
  "25": "Electronic Safety and Security",
  "26": "Electronic Safety and Security",
  "27": "Electronic Safety and Security",
  "28": "Electronic Safety and Security",
  "29": "Electronic Safety and Security",
  "30": "Electronic Safety and Security",
  "31": "Earthwork",
  "32": "Exterior Improvements",
  "33": "Utilities",
  "34": "Transportation",
  "35": "Waterway and Marine Construction",
  "36": "Reserved for Future Expansion",
  "37": "Reserved for Future Expansion",
  "38": "Reserved for Future Expansion",
  "39": "Reserved for Future Expansion",
  "40": "Process Integration"
};

const STATUS_OPTIONS = [
  { value: 'UNPAID', label: 'Unpaid', icon: <XCircle className="h-4 w-4" />, color: 'bg-red-100 text-red-800' },
  { value: 'PAID', label: 'Paid', icon: <CheckCircle className="h-4 w-4" />, color: 'bg-green-100 text-green-800' },
  { value: 'OVERDUE', label: 'Overdue', icon: <AlertCircle className="h-4 w-4" />, color: 'bg-orange-100 text-orange-800' },
  { value: 'PARTIAL', label: 'Partial', icon: <Clock className="h-4 w-4" />, color: 'bg-yellow-100 text-yellow-800' },
];

export default function EnhancedInvoiceForm({ 
  projectId, 
  invoice, 
  onSuccess, 
  onCancel 
}: EnhancedInvoiceFormProps) {
  const [invoiceNumber, setInvoiceNumber] = useState(invoice?.invoiceNumber || "");
  const [vendor, setVendor] = useState(invoice?.vendor || "");
  const [amount, setAmount] = useState(invoice?.amount?.toString() || "");
  const [date, setDate] = useState(invoice?.date ? new Date(invoice.date).toISOString().split("T")[0] : "");
  const [dueDate, setDueDate] = useState(invoice?.dueDate ? new Date(invoice.dueDate).toISOString().split("T")[0] : "");
  const [paymentDate, setPaymentDate] = useState(invoice?.paymentDate ? new Date(invoice.paymentDate).toISOString().split("T")[0] : "");
  const [status, setStatus] = useState(invoice?.status || "UNPAID");
  const [description, setDescription] = useState(invoice?.description || "");
  const [division, setDivision] = useState(invoice?.division || "01");
  const [divisionAllocations, setDivisionAllocations] = useState<DivisionAllocation[]>(
    invoice?.divisionAllocations || [{ division: "01", amount: 0 }]
  );
  const [error, setError] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    try {
      const response = await fetch(`/api/projects/${projectId}/invoices${invoice ? `?invoiceId=${invoice.id}` : ""}`, {
        method: invoice ? "PUT" : "POST",
        headers: {
          "Content-Type": "application/json",
        },
        body: JSON.stringify({
          invoiceNumber: invoiceNumber || null,
          vendor,
          amount: parseFloat(amount),
          date,
          dueDate: dueDate || null,
          paymentDate: paymentDate || null,
          status,
          description,
          division,
          divisionAllocations,
        }),
      });

      if (!response.ok) {
        const data = await response.json();
        throw new Error(data.message || "Failed to save invoice");
      }

      onSuccess();
    } catch (err) {
      setError(err instanceof Error ? err.message : "An error occurred");
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleAddDivision = () => {
    setDivisionAllocations([...divisionAllocations, { division: "01", amount: 0 }]);
  };

  const handleRemoveDivision = (index: number) => {
    setDivisionAllocations(divisionAllocations.filter((_, i) => i !== index));
  };

  const handleDivisionChange = (index: number, field: keyof DivisionAllocation, value: string) => {
    const updated = [...divisionAllocations];
    if (field === "amount") {
      updated[index][field] = parseFloat(value) || 0;
    } else {
      updated[index][field] = value;
    }
    setDivisionAllocations(updated);
  };

  const selectedStatus = STATUS_OPTIONS.find(option => option.value === status);

  return (
    <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center p-4 z-50">
      <Card className="w-full max-w-4xl max-h-[90vh] overflow-y-auto">
        <CardHeader>
          <CardTitle className="text-xl font-semibold flex items-center gap-2">
            <FileText className="h-5 w-5" />
            {invoice ? "Edit Invoice" : "Add New Invoice"}
          </CardTitle>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSubmit} className="space-y-6">
            {error && (
              <div className="bg-red-50 border border-red-200 rounded-md p-4">
                <div className="flex">
                  <AlertCircle className="h-5 w-5 text-red-400" />
                  <div className="ml-3">
                    <h3 className="text-sm font-medium text-red-800">Error</h3>
                    <div className="mt-2 text-sm text-red-700">{error}</div>
                  </div>
                </div>
              </div>
            )}

            {/* Basic Information */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Number
                </label>
                <Input
                  value={invoiceNumber}
                  onChange={(e) => setInvoiceNumber(e.target.value)}
                  placeholder="Enter invoice number"
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Vendor <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Building2 className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    value={vendor}
                    onChange={(e) => setVendor(e.target.value)}
                    placeholder="Enter vendor name"
                    className="pl-10"
                    required
                  />
                </div>
              </div>
            </div>

            {/* Amount and Dates */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Amount <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <DollarSign className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="number"
                    step="0.01"
                    value={amount}
                    onChange={(e) => setAmount(e.target.value)}
                    placeholder="0.00"
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Invoice Date <span className="text-red-500">*</span>
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={date}
                    onChange={(e) => setDate(e.target.value)}
                    className="pl-10"
                    required
                  />
                </div>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Due Date
                </label>
                <div className="relative">
                  <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
            </div>

            {/* Status and Payment Date */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Status
                </label>
                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value as any)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                >
                  {STATUS_OPTIONS.map((option) => (
                    <option key={option.value} value={option.value}>
                      {option.label}
                    </option>
                  ))}
                </select>
                {selectedStatus && (
                  <div className="mt-2">
                    <Badge className={`${selectedStatus.color} flex items-center gap-1 w-fit`}>
                      {selectedStatus.icon}
                      {selectedStatus.label}
                    </Badge>
                  </div>
                )}
              </div>

              {status === 'PAID' && (
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">
                    Payment Date
                  </label>
                  <div className="relative">
                    <Calendar className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                    <Input
                      type="date"
                      value={paymentDate}
                      onChange={(e) => setPaymentDate(e.target.value)}
                      className="pl-10"
                    />
                  </div>
                </div>
              )}
            </div>

            {/* Division */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Division <span className="text-red-500">*</span>
              </label>
              <select
                value={division}
                onChange={(e) => setDivision(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                required
              >
                {Object.entries(DIVISIONS).map(([code, name]) => (
                  <option key={code} value={code}>
                    {code} - {name}
                  </option>
                ))}
              </select>
            </div>

            {/* Description */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Description
              </label>
              <textarea
                value={description}
                onChange={(e) => setDescription(e.target.value)}
                placeholder="Enter invoice description"
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                rows={3}
              />
            </div>

            {/* Division Allocations */}
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Division Allocations
              </label>
              {divisionAllocations.map((allocation, index) => (
                <div key={index} className="flex items-center gap-2 mb-2">
                  <select
                    value={allocation.division}
                    onChange={(e) => handleDivisionChange(index, "division", e.target.value)}
                    className="px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  >
                    {Object.entries(DIVISIONS).map(([code, name]) => (
                      <option key={code} value={code}>
                        {code} - {name}
                      </option>
                    ))}
                  </select>
                  <Input
                    type="number"
                    step="0.01"
                    value={allocation.amount}
                    onChange={(e) => handleDivisionChange(index, "amount", e.target.value)}
                    placeholder="Amount"
                    className="flex-1"
                  />
                  <Button
                    type="button"
                    variant="outline"
                    size="sm"
                    onClick={() => handleRemoveDivision(index)}
                    disabled={divisionAllocations.length === 1}
                  >
                    Remove
                  </Button>
                </div>
              ))}
              <Button
                type="button"
                variant="outline"
                size="sm"
                onClick={handleAddDivision}
                className="mt-2"
              >
                Add Division
              </Button>
            </div>

            {/* Form Actions */}
            <div className="flex justify-end gap-3 pt-4 border-t">
              <Button
                type="button"
                variant="outline"
                onClick={onCancel}
                disabled={isSubmitting}
              >
                Cancel
              </Button>
              <Button
                type="submit"
                disabled={isSubmitting}
                className="bg-blue-600 hover:bg-blue-700"
              >
                {isSubmitting ? "Saving..." : invoice ? "Update Invoice" : "Create Invoice"}
              </Button>
            </div>
          </form>
        </CardContent>
      </Card>
    </div>
  );
}
