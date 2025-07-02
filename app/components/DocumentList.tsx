"use client"

import { FileText, Download, Trash2 } from "lucide-react"
import { useState } from "react"

type DocumentType = "CONTRACT" | "SUBMITTAL" | "RFI" | "CHANGE_ORDER"

interface Document {
  id: string
  title: string
  description?: string | null
  fileUrl: string
  fileType: string
  category: DocumentType
  status: string
  createdAt: Date
  updatedAt: Date
  projectId: number
  userId: string
}

interface DocumentListProps {
  documents: Document[]
}

export default function DocumentList({ documents }: DocumentListProps) {
  const [selectedCategory, setSelectedCategory] = useState<"ALL" | DocumentType>("ALL")
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null)

  const filteredDocuments = selectedCategory === "ALL" 
    ? documents 
    : documents.filter(doc => doc.category === selectedCategory)

  const handleDelete = async (documentId: string) => {
    try {
      const response = await fetch(`/api/documents/${documentId}`, {
        method: "DELETE",
      })
      if (!response.ok) throw new Error("Failed to delete document")
      window.location.reload()
    } catch (error) {
      console.error("Error deleting document:", error)
    }
  }

  const documentTypes: DocumentType[] = ["CONTRACT", "SUBMITTAL", "RFI", "CHANGE_ORDER"]

  const getDocumentTypeColor = (category: DocumentType) => {
    switch (category) {
      case "CONTRACT":
        return "bg-blue-100 text-blue-800"
      case "SUBMITTAL":
        return "bg-green-100 text-green-800"
      case "RFI":
        return "bg-yellow-100 text-yellow-800"
      case "CHANGE_ORDER":
        return "bg-purple-100 text-purple-800"
      default:
        return "bg-gray-100 text-gray-800"
    }
  }

  return (
    <div className="bg-white rounded-lg shadow p-6">
      <div className="flex flex-wrap gap-2 mb-6">
        <button
          onClick={() => setSelectedCategory("ALL")}
          className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
            selectedCategory === "ALL"
              ? "bg-blue-100 text-blue-800 ring-2 ring-blue-600"
              : "bg-gray-100 text-gray-800 hover:bg-gray-200"
          }`}
        >
          All Documents
        </button>
        {documentTypes.map((category) => (
          <button
            key={category}
            onClick={() => setSelectedCategory(category)}
            className={`px-3 py-1 rounded-full text-sm font-medium transition-colors ${
              selectedCategory === category
                ? `${getDocumentTypeColor(category)} ring-2 ring-current`
                : "bg-gray-100 text-gray-800 hover:bg-gray-200"
            }`}
          >
            {category.replace("_", " ")}
          </button>
        ))}
      </div>

      <div className="space-y-4">
        {filteredDocuments.length === 0 ? (
          <div className="text-center py-8">
            <FileText className="w-12 h-12 text-gray-400 mx-auto mb-3" />
            <p className="text-gray-500 text-lg">No documents found</p>
            <p className="text-gray-400 text-sm">
              {selectedCategory === "ALL" 
                ? "Upload your first document to get started"
                : `No ${selectedCategory.toLowerCase()} documents available`}
            </p>
          </div>
        ) : (
          filteredDocuments.map((document) => (
            <div
              key={document.id}
              className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50 transition-colors"
            >
              <div className="flex items-center gap-4 flex-1 min-w-0">
                <div className={`p-2 rounded-lg ${getDocumentTypeColor(document.category)}`}>
                  <FileText className="w-6 h-6" />
                </div>
                <div className="min-w-0">
                  <h3 className="font-medium truncate">{document.title}</h3>
                  {document.description && (
                    <p className="text-sm text-gray-500 truncate">{document.description}</p>
                  )}
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs text-gray-400">
                      {new Date(document.createdAt).toLocaleDateString()}
                    </span>
                    <span className={`px-2 py-0.5 rounded-full text-xs ${getDocumentTypeColor(document.category)}`}>
                      {document.category}
                    </span>
                  </div>
                </div>
              </div>
              <div className="flex items-center gap-2 ml-4">
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 text-gray-400 hover:text-gray-600 transition-colors"
                  title="Download Document"
                >
                  <Download className="w-5 h-5" />
                </a>
                {deleteConfirm === document.id ? (
                  <div className="flex items-center gap-2">
                    <button
                      onClick={() => handleDelete(document.id)}
                      className="px-3 py-1 bg-red-100 text-red-600 rounded-md text-sm hover:bg-red-200 transition-colors"
                    >
                      Confirm
                    </button>
                    <button
                      onClick={() => setDeleteConfirm(null)}
                      className="px-3 py-1 bg-gray-100 text-gray-600 rounded-md text-sm hover:bg-gray-200 transition-colors"
                    >
                      Cancel
                    </button>
                  </div>
                ) : (
                  <button
                    onClick={() => setDeleteConfirm(document.id)}
                    className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                    title="Delete Document"
                  >
                    <Trash2 className="w-5 h-5" />
                  </button>
                )}
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  )
} 
