import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

interface Plan {
  id: string
  title: string
  description: string | null
  fileUrl: string
  fileType: string
  createdAt: Date
  updatedAt: Date
}

export default async function PlansPage({ params }: { params: { id: string } }) {
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
      plans: {
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
        <h1 className="text-2xl font-bold">Project Plans</h1>
        <Link
          href={`/projects/${params.id}/plans/upload`}
          className="px-4 py-2 bg-blue-600 text-white rounded-md hover:bg-blue-700 focus:outline-none focus:ring-2 focus:ring-blue-500"
        >
          Upload Plan
        </Link>
      </div>

      {project.plans.length === 0 ? (
        <div className="text-center py-12">
          <h3 className="text-lg font-medium text-gray-900 mb-2">No plans uploaded</h3>
          <p className="text-gray-500 mb-4">Upload your first plan to get started</p>
          <Link
            href={`/projects/${params.id}/plans/upload`}
            className="text-blue-600 hover:text-blue-700"
          >
            Upload your first plan →
          </Link>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {project.plans.map((plan) => (
            <div
              key={plan.id}
              className="bg-white rounded-lg shadow-sm border border-gray-200 p-6"
            >
              <div className="flex items-center mb-4">
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
                    d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"
                  />
                </svg>
                <div className="ml-3">
                  <h3 className="text-lg font-medium text-gray-900">{plan.title}</h3>
                  <p className="text-sm text-gray-500">{plan.fileType}</p>
                </div>
              </div>
              {plan.description && (
                <p className="text-sm text-gray-600 mb-4">{plan.description}</p>
              )}
              <div className="flex justify-between items-center text-sm text-gray-500">
                <span>
                  {new Date(plan.createdAt).toLocaleDateString()}
                </span>
                <div className="space-x-4">
                  <a
                    href={plan.fileUrl}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="text-blue-600 hover:text-blue-700"
                  >
                    View Plan →
                  </a>
                  <Link
                    href={`/projects/${params.id}/plans/${plan.id}/measure`}
                    className="text-green-600 hover:text-green-700"
                  >
                    Measure →
                  </Link>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

