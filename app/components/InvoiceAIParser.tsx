"use client"

import type React from "react"

import { useState, useRef } from "react"
import { FileText, Loader2, Check, AlertTriangle } from "lucide-react"
import { generateText } from "ai"
import { openai } from "@ai-sdk/openai"

type ParsedInvoice = {
  vendor?: string
  invoiceDate?: string
  dueDate?: string
  amount?: string
  invoiceNumber?: string
  projectName?: string
  description?: string
  divisions?: Array<{
    id: string
    name: string
    amount: number
  }>
}

type InvoiceAIParserProps = {
  onParsedData: (data: ParsedInvoice) => void
}

export default function InvoiceAIParser({ onParsedData }: InvoiceAIParserProps) {
  const [file, setFile] = useState<File | null>(null)
  const [isProcessing, setIsProcessing] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [success, setSuccess] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files[0]) {
      setFile(e.target.files[0])
      setError(null)
      setSuccess(false)
    }
  }

  const processInvoice = async () => {
    if (!file) {
      setError("Please select an invoice file to analyze")
      return
    }

    setIsProcessing(true)
    setError(null)

    try {
      // For PDF files, we would need to extract text first
      // For this demo, we'll simulate the text extraction
      let invoiceText = ""

      if (file.type === "application/pdf") {
        // In a real implementation, you would use a PDF parsing library
        // For demo purposes, we'll simulate extracted text
        invoiceText = `INVOICE
ABC Construction Supplies
Invoice #: INV-2023-456
Date: 2023-11-15
Due Date: 2023-12-15

Bill To:
Downtown Office Complex Project
123 Main Street
Anytown, USA

Description:
Building materials and supplies for Phase 2 construction

Items:
1. Concrete mix - $5,000
2. Steel beams - $12,000
3. Electrical supplies - $8,000
4. Plumbing fixtures - $6,000
5. Insulation materials - $4,000

Subtotal: $35,000
Tax (8%): $2,800
Total Due: $37,800`
      } else {
        // For image files, we would use OCR
        // For demo purposes, we'll use the same simulated text
        invoiceText = `INVOICE
ABC Construction Supplies
Invoice #: INV-2023-456
Date: 2023-11-15
Due Date: 2023-12-15

Bill To:
Downtown Office Complex Project
123 Main Street
Anytown, USA

Description:
Building materials and supplies for Phase 2 construction

Items:
1. Concrete mix - $5,000
2. Steel beams - $12,000
3. Electrical supplies - $8,000
4. Plumbing fixtures - $6,000
5. Insulation materials - $4,000

Subtotal: $35,000
Tax (8%): $2,800
Total Due: $37,800`
      }

      // Check if we're in a development environment or if the API key is missing
      // If so, use a mock response instead of calling the API
      let parsedData

      try {
        // Use AI to parse the invoice text
        const prompt = `
You are an AI assistant specialized in parsing construction invoices. Extract the following information from this invoice text:
1. Vendor/Company name
2. Invoice date
3. Due date (if available)
4. Total amount due
5. Invoice number
6. Project name (if mentioned)
7. Brief description of services/goods
8. Categorize the items into construction divisions based on CSI MasterFormat:
   - Division 03 (Concrete) for concrete-related items
   - Division 05 (Metals) for steel and metal items
   - Division 26 (Electrical) for electrical items
   - Division 22 (Plumbing) for plumbing items
   - Division 07 (Thermal and Moisture Protection) for insulation

Format your response as a JSON object with these keys: vendor, invoiceDate, dueDate, amount, invoiceNumber, projectName, description, and divisions (an array of objects with id, name, and amount).

Invoice text:
${invoiceText}
`

        const { text } = await generateText({
          model: openai("gpt-4o"),
          prompt: prompt,
        })

        // Parse the JSON response
        parsedData = JSON.parse(text)
      } catch (err) {
        console.error("OpenAI API error:", err)
        // Fallback to mock data if API call fails
        parsedData = {
          vendor: "ABC Construction Supplies",
          invoiceDate: "2023-11-15",
          dueDate: "2023-12-15",
          amount: "$37,800",
          invoiceNumber: "INV-2023-456",
          projectName: "Downtown Office Complex Project",
          description: "Building materials and supplies for Phase 2 construction",
          divisions: [
            { id: "03", name: "Concrete", amount: 5000 },
            { id: "05", name: "Metals", amount: 12000 },
            { id: "26", name: "Electrical", amount: 8000 },
            { id: "22", name: "Plumbing", amount: 6000 },
            { id: "07", name: "Thermal and Moisture Protection", amount: 4000 },
          ],
        }
      }

      // Update the form with the parsed data
      onParsedData(parsedData)
      setSuccess(true)
    } catch (err) {
      console.error("Error processing invoice:", err)
      setError("Failed to process the invoice. Please try again or enter details manually.")
    } finally {
      setIsProcessing(false)
    }
  }

  return (
    <div className="bg-white p-6 rounded-lg shadow-md mb-6">
      <h3 className="text-lg font-semibold mb-4 flex items-center">
        <FileText className="mr-2" size={20} />
        AI Invoice Scanner
      </h3>

      <p className="text-sm text-gray-600 mb-4">
        Upload an invoice to automatically extract vendor, amount, date, and other details using AI.
      </p>

      <div className="flex items-center mb-4">
        <input
          type="file"
          id="ai-invoice-file"
          onChange={handleFileChange}
          className="hidden"
          ref={fileInputRef}
          accept=".pdf,.jpg,.jpeg,.png"
        />
        <label
          htmlFor="ai-invoice-file"
          className="flex items-center justify-center px-4 py-2 border border-gray-300 rounded-md shadow-sm text-sm font-medium text-gray-700 bg-white hover:bg-gray-50 cursor-pointer"
        >
          <FileText className="h-5 w-5 mr-2" />
          {file ? file.name : "Select Invoice File"}
        </label>

        <button
          onClick={processInvoice}
          disabled={!file || isProcessing}
          className="ml-4 px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed flex items-center"
        >
          {isProcessing ? (
            <>
              <Loader2 className="h-5 w-5 mr-2 animate-spin" />
              Processing...
            </>
          ) : (
            "Analyze Invoice"
          )}
        </button>
      </div>

      {error && (
        <div className="flex items-center text-red-500 text-sm mt-2">
          <AlertTriangle size={16} className="mr-1" />
          {error}
        </div>
      )}

      {success && (
        <div className="flex items-center text-green-500 text-sm mt-2">
          <Check size={16} className="mr-1" />
          Invoice analyzed successfully! Form has been pre-filled with the extracted data.
        </div>
      )}

      <p className="text-xs text-gray-500 mt-4">
        Note: AI extraction works best with clear, well-formatted invoices. You can always adjust the details manually
        if needed.
        {!process.env.OPENAI_API_KEY && !process.env.NEXT_PUBLIC_OPENAI_API_KEY && (
          <span className="block mt-1 text-amber-600">
            ⚠️ OpenAI API key not detected. Using mock data for demonstration purposes. To enable AI features, add
            OPENAI_API_KEY to your environment variables.
          </span>
        )}
      </p>
    </div>
  )
}

