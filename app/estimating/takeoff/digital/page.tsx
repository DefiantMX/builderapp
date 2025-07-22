import Link from 'next/link'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"
import { Calculator, FileText, Upload, Download, Settings, Ruler, Square, Move } from 'lucide-react'

export const dynamic = 'force-dynamic';

type Project = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export default async function DigitalTakeoffPage() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/login')
  }

  const userId = session?.user?.id
  
  if (!userId) {
    redirect('/login')
  }

  // Fetch user's projects for digital takeoff
  const projects = await db.project.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 10
  })

  const digitalTakeoffFeatures = [
    {
      title: "Length Measurements",
      description: "Measure linear distances and perimeters",
      icon: Ruler,
      color: "bg-blue-500"
    },
    {
      title: "Area Calculations",
      description: "Calculate square footage and surface areas",
      icon: Square,
      color: "bg-green-500"
    },
    {
      title: "Calibration Tools",
      description: "Set scale and ensure measurement accuracy",
      icon: Move,
      color: "bg-purple-500"
    },
    {
      title: "PDF Support",
      description: "Work with PDF plans and drawings",
      icon: FileText,
      color: "bg-orange-500"
    },
    {
      title: "Export Results",
      description: "Export measurements to various formats",
      icon: Download,
      color: "bg-red-500"
    },
    {
      title: "Settings & Units",
      description: "Configure measurement units and preferences",
      icon: Settings,
      color: "bg-gray-500"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <div className="flex items-center mb-4">
          <Link 
            href="/estimating/takeoff"
            className="text-blue-600 hover:text-blue-800 mr-4"
          >
            ← Back to Takeoff Tools
          </Link>
        </div>
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Digital Takeoff
        </h1>
        <p className="text-gray-600">
          Professional digital takeoff tools for accurate measurements and quantity calculations.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Ruler className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Length Measurements</p>
              <p className="text-2xl font-bold text-gray-900">156</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <Square className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Area Calculations</p>
              <p className="text-2xl font-bold text-gray-900">89</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <Move className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Calibrated Plans</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-orange-100 rounded-lg">
              <Download className="h-6 w-6 text-orange-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Exports</p>
              <p className="text-2xl font-bold text-gray-900">67</p>
            </div>
          </div>
        </div>
      </div>

      {/* Digital Takeoff Features */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Digital Takeoff Features</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {digitalTakeoffFeatures.map((feature) => {
            const IconComponent = feature.icon
            return (
              <div
                key={feature.title}
                className="bg-white border border-gray-200 rounded-lg p-6"
              >
                <div className="flex items-center mb-4">
                  <div className={`p-3 rounded-lg ${feature.color} bg-opacity-10`}>
                    <IconComponent className={`h-6 w-6 ${feature.color.replace('bg-', 'text-')}`} />
                  </div>
                  <h3 className="ml-3 text-lg font-semibold text-gray-800">
                    {feature.title}
                  </h3>
                </div>
                <p className="text-gray-600 text-sm">
                  {feature.description}
                </p>
              </div>
            )
          })}
        </div>
      </div>

      {/* Project Digital Takeoffs */}
      <div className="mb-8">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-800">Project Digital Takeoffs</h2>
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
                        Start Digital Takeoff
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
              <p className="text-sm mb-4">Create a project to start digital takeoffs</p>
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

      {/* How to Use Digital Takeoff */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">How to Use Digital Takeoff</h2>
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Step-by-Step Process</h3>
              <ol className="space-y-3 text-gray-600">
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">1</span>
                  <span>Upload your project plans (PDF format supported)</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">2</span>
                  <span>Calibrate the scale using known dimensions</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">3</span>
                  <span>Use measurement tools to calculate lengths and areas</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">4</span>
                  <span>Review and verify all measurements</span>
                </li>
                <li className="flex items-start">
                  <span className="bg-blue-500 text-white rounded-full w-6 h-6 flex items-center justify-center text-sm font-medium mr-3 mt-0.5">5</span>
                  <span>Export results for use in estimates and budgets</span>
                </li>
              </ol>
            </div>
            <div>
              <h3 className="text-lg font-semibold text-gray-800 mb-4">Best Practices</h3>
              <ul className="space-y-2 text-gray-600">
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Always calibrate with known dimensions for accuracy
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Use consistent units throughout your takeoff
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Document any assumptions or exclusions
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Review measurements before finalizing
                </li>
                <li className="flex items-start">
                  <span className="text-green-500 mr-2">✓</span>
                  Save your work frequently
                </li>
              </ul>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              href="/projects/new"
              className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              Create New Project
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
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Support</h3>
          <div className="space-y-3">
            <Link 
              href="/help/takeoff"
              className="block w-full text-left px-4 py-2 bg-purple-50 text-purple-700 rounded-md hover:bg-purple-100 transition-colors"
            >
              Takeoff Tutorial
            </Link>
            <Link 
              href="/help/calibration"
              className="block w-full text-left px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
            >
              Calibration Guide
            </Link>
            <Link 
              href="/help/export"
              className="block w-full text-left px-4 py-2 bg-red-50 text-red-700 rounded-md hover:bg-red-100 transition-colors"
            >
              Export Formats
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 