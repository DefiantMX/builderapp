import Link from 'next/link'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Calculator, FileText, Upload, Download, Settings } from 'lucide-react'

export const dynamic = 'force-dynamic';

type Project = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export default async function TakeoffPage() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/login')
  }

  const userId = session?.user?.id
  
  if (!userId) {
    redirect('/login')
  }

  // Fetch user's projects for takeoff
  const projects = await db.project.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 10
  })

  const takeoffTools = [
    {
      title: "Digital Takeoff",
      description: "Perform takeoffs directly on digital plans and drawings",
      icon: Calculator,
      href: "/estimating/takeoff/digital",
      color: "bg-blue-500"
    },
    {
      title: "PDF Takeoff",
      description: "Upload PDF plans and perform measurements",
      icon: FileText,
      href: "/estimating/takeoff/pdf",
      color: "bg-green-500"
    },
    {
      title: "Import Plans",
      description: "Upload and manage project plans and drawings",
      icon: Upload,
      href: "/estimating/takeoff/import",
      color: "bg-purple-500"
    },
    {
      title: "Export Results",
      description: "Export takeoff data to various formats",
      icon: Download,
      href: "/estimating/takeoff/export",
      color: "bg-orange-500"
    },
    {
      title: "Takeoff Settings",
      description: "Configure measurement units and preferences",
      icon: Settings,
      href: "/estimating/takeoff/settings",
      color: "bg-gray-500"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Takeoff Tools
        </h1>
        <p className="text-gray-600">
          Professional takeoff tools for accurate quantity calculations and cost estimates.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Takeoffs</p>
              <p className="text-2xl font-bold text-gray-900">8</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <FileText className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Plans Uploaded</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Download className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exports</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Settings className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Accuracy</p>
              <p className="text-2xl font-bold text-gray-900">98%</p>
            </div>
          </div>
        </div>
      </div>

      {/* Takeoff Tools Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Takeoff Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {takeoffTools.map((tool) => {
            const IconComponent = tool.icon
            return (
              <Link
                key={tool.title}
                href={tool.href}
                className="bg-white border border-gray-200 rounded-lg p-6 hover:shadow-lg transition-shadow duration-200"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${tool.color} bg-opacity-10`}>
                    <IconComponent className={`h-6 w-6 ${tool.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-800">
                    {tool.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {tool.description}
                </p>
              </Link>
            )
          })}
        </div>
      </div>

      {/* Project Takeoffs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Project Takeoffs</h2>
          <Link 
            href="/projects/new"
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
          >
            Create New Project
          </Link>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {projects.length > 0 ? (
            <div className="divide-y divide-gray-200">
              {projects.map((project) => (
                <div key={project.id} className="p-6">
                  <div className="flex items-center justify-between">
                    <div className="flex-1">
                      <h3 className="font-medium text-gray-800">{project.name}</h3>
                      <p className="text-sm text-gray-500">
                        {project.description || 'No description'}
                      </p>
                      <p className="text-sm text-gray-400 mt-1">
                        Last updated: {new Date(project.updatedAt).toLocaleDateString()}
                      </p>
                    </div>
                    <div className="flex space-x-2">
                      <Link
                        href={`/projects/${project.id}/takeoff`}
                        className="px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors text-sm font-medium"
                      >
                        View Takeoff
                      </Link>
                      <Link
                        href={`/projects/${project.id}`}
                        className="px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors text-sm font-medium"
                      >
                        Project Details
                      </Link>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          ) : (
            <div className="p-6 text-center text-gray-500">
              <Calculator className="h-12 w-12 text-gray-300 mx-auto mb-4" />
              <p className="text-lg font-medium mb-2">No projects yet</p>
              <p className="text-sm mb-4">Create a project to start performing takeoffs</p>
              <Link 
                href="/projects/new"
                className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md"
              >
                Create Your First Project
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Takeoff Best Practices</h3>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Always calibrate your measurements for accurate results
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Use consistent units throughout your takeoff
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Document any assumptions or exclusions clearly
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Review and verify all measurements before finalizing
            </li>
          </ul>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              href="/estimating/takeoff/digital"
              className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              Start Digital Takeoff
            </Link>
            <Link 
              href="/estimating/takeoff/import"
              className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
            >
              Upload Plans
            </Link>
            <Link 
              href="/estimating/takeoff/settings"
              className="block w-full text-left px-4 py-2 bg-gray-50 text-gray-700 rounded-md hover:bg-gray-100 transition-colors"
            >
              Configure Settings
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 