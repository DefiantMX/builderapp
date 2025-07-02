import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

export default async function DocumentUploadPage({ params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session?.user?.id) {
    redirect("/login")
  }

  const project = await db.project.findUnique({
    where: {
      id: params.id,
      userId: session.user.id
    }
  })

  if (!project) {
    redirect("/projects")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-2xl mx-auto">
        <div className="flex items-center justify-between mb-6">
          <h1 className="text-2xl font-bold">Upload Document</h1>
          <Link
            href={`/projects/${params.id}/documents`}
            className="text-gray-600 hover:text-gray-900"
          >
            Back to Documents
          </Link>
        </div>

        <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
          <form action={`/api/projects/${params.id}/documents`} method="POST" className="space-y-6">
            <div>
              <label htmlFor="title" className="block text-sm font-medium text-gray-700">
                Document Title
              </label>
              <input
                type="text"
                name="title"
                id="title"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter document title"
              />
            </div>

            <div>
              <label htmlFor="category" className="block text-sm font-medium text-gray-700">
                Category
              </label>
              <select
                id="category"
                name="category"
                required
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
              >
                <option value="">Select a category</option>
                <option value="Contract">Contract</option>
                <option value="Permit">Permit</option>
                <option value="Insurance">Insurance</option>
                <option value="Invoice">Invoice</option>
                <option value="Other">Other</option>
              </select>
            </div>

            <div>
              <label htmlFor="description" className="block text-sm font-medium text-gray-700">
                Description
              </label>
              <textarea
                id="description"
                name="description"
                rows={3}
                className="mt-1 block w-full rounded-md border border-gray-300 px-3 py-2 focus:border-blue-500 focus:outline-none focus:ring-1 focus:ring-blue-500"
                placeholder="Enter document description (optional)"
              />
            </div>

            <div>
              <label htmlFor="file" className="block text-sm font-medium text-gray-700">
                Document File
              </label>
              <input
                type="file"
                id="file"
                name="file"
                required
                className="mt-1 block w-full text-sm text-gray-500 file:mr-4 file:py-2 file:px-4 file:rounded-md file:border-0 file:text-sm file:font-semibold file:bg-blue-50 file:text-blue-700 hover:file:bg-blue-100"
              />
            </div>

            <div className="flex justify-end space-x-3">
              <Link
                href={`/projects/${params.id}/documents`}
                className="px-4 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-md hover:bg-gray-200 focus:outline-none focus:ring-2 focus:ring-gray-500"
              >
                Cancel
              </Link>
              <button
                type="submit"
                className="px-4 py-2 text-sm font-medium text-white bg-blue-600 rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
              >
                Upload Document
              </button>
            </div>
          </form>
        </div>
      </div>
    </div>
  )
} 