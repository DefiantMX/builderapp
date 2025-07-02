import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

interface Document {
  id: string
  title: string
  description: string | null
  fileUrl: string
  category: string
  status: string
  createdAt: Date
  updatedAt: Date
}

export default async function DocumentsPage({ params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const project = await db.project.findUnique({
    where: {
      id: params.id,
      userId: session.user.id
    },
    include: {
      documents: {
        orderBy: {
          createdAt: 'desc'
        }
      }
    }
  })

  if (!project) {
    redirect("/projects")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-2xl font-bold">Project Documents</h1>
        <Link
          href={`/projects/${params.id}/documents/upload`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Upload Document
        </Link>
      </div>

      {project.documents.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No documents uploaded</h3>
          <p className="text-gray-500 mb-4">Upload your first document to get started</p>
          <Link
            href={`/projects/${params.id}/documents/upload`}
            className="text-blue-600 hover:text-blue-700"
          >
            Upload your first document →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.documents.map((document) => (
            <div
              key={document.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center">
                  <svg
                    className="w-8 h-8 text-gray-400"
                    fill="none"
                    stroke="currentColor"
                    viewBox="0 0 24 24"
                  >
                    <path
                      strokeLinecap="round"
                      strokeLinejoin="round"
                      strokeWidth={2}
                      d="M7 21h10a2 2 0 002-2V9.414a1 1 0 00-.293-.707l-5.414-5.414A1 1 0 0012.586 3H7a2 2 0 00-2 2v14a2 2 0 002 2z"
                    />
                  </svg>
                  <div className="ml-3">
                    <h3 className="text-lg font-medium text-gray-900">{document.title}</h3>
                    <p className="text-sm text-gray-500">{document.category}</p>
                  </div>
                </div>
                <span className={`px-2 py-1 text-xs font-medium rounded-full ${
                  document.status === 'approved' ? 'bg-green-100 text-green-800' :
                  document.status === 'rejected' ? 'bg-red-100 text-red-800' :
                  'bg-yellow-100 text-yellow-800'
                }`}>
                  {document.status}
                </span>
              </div>
              {document.description && (
                <p className="text-sm text-gray-600 mb-4">{document.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {new Date(document.createdAt).toLocaleDateString()}
                </span>
                <a
                  href={document.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-600 hover:text-blue-700"
                >
                  View Document →
                </a>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 