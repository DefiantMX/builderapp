import Link from 'next/link'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { Calculator, FileText, BarChart3, Settings, Users, Database } from 'lucide-react'

export const dynamic = 'force-dynamic';

export default async function EstimatingPage() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/login')
  }

  const estimatingTools = [
    {
      title: "Takeoff Calculator",
      description: "Calculate material quantities and costs from project plans",
      icon: Calculator,
      href: "/estimating/takeoff",
      color: "bg-blue-500"
    },
    {
      title: "Budget Templates",
      description: "Use pre-built budget templates for common project types",
      icon: FileText,
      href: "/estimating/templates",
      color: "bg-green-500"
    },
    {
      title: "Cost Analysis",
      description: "Analyze project costs and compare estimates",
      icon: BarChart3,
      href: "/estimating/analysis",
      color: "bg-purple-500"
    },
    {
      title: "Material Database",
      description: "Access current material prices and specifications",
      icon: Database,
      href: "/estimating/materials",
      color: "bg-orange-500"
    },
    {
      title: "Subcontractor Quotes",
      description: "Manage and compare subcontractor bids",
      icon: Users,
      href: "/estimating/quotes",
      color: "bg-red-500"
    },
    {
      title: "Settings & Preferences",
      description: "Configure estimating parameters and defaults",
      icon: Settings,
      href: "/estimating/settings",
      color: "bg-gray-500"
    }
  ]

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-800 mb-2">
          Estimating Tools
        </h1>
        <p className="text-gray-600">
          Professional construction estimating tools to help you create accurate bids and budgets.
        </p>
      </div>

      {/* Quick Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-blue-100 rounded-lg">
              <Calculator className="h-6 w-6 text-blue-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Active Estimates</p>
              <p className="text-2xl font-bold text-gray-900">12</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-green-100 rounded-lg">
              <BarChart3 className="h-6 w-6 text-green-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Win Rate</p>
              <p className="text-2xl font-bold text-gray-900">68%</p>
            </div>
          </div>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <div className="flex items-center">
            <div className="p-2 bg-purple-100 rounded-lg">
              <FileText className="h-6 w-6 text-purple-600" />
            </div>
            <div className="ml-4">
              <p className="text-sm font-medium text-gray-600">Templates</p>
              <p className="text-2xl font-bold text-gray-900">24</p>
            </div>
          </div>
        </div>
      </div>

      {/* Estimating Tools Grid */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-6">Estimating Tools</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {estimatingTools.map((tool) => {
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

      {/* Recent Activity */}
      <div className="mb-8">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Recent Estimating Activity</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="p-6">
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-800">Kitchen Remodel - 123 Main St</h3>
                <p className="text-sm text-gray-500">Updated 2 hours ago</p>
              </div>
              <span className="px-3 py-1 bg-green-100 text-green-800 text-sm font-medium rounded-full">
                In Progress
              </span>
            </div>
            <div className="flex items-center justify-between mb-4">
              <div>
                <h3 className="font-medium text-gray-800">Office Building - Downtown Project</h3>
                <p className="text-sm text-gray-500">Updated 1 day ago</p>
              </div>
              <span className="px-3 py-1 bg-blue-100 text-blue-800 text-sm font-medium rounded-full">
                Submitted
              </span>
            </div>
            <div className="flex items-center justify-between">
              <div>
                <h3 className="font-medium text-gray-800">Residential Addition - 456 Oak Ave</h3>
                <p className="text-sm text-gray-500">Updated 3 days ago</p>
              </div>
              <span className="px-3 py-1 bg-gray-100 text-gray-800 text-sm font-medium rounded-full">
                Draft
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tips Section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Estimating Best Practices</h3>
          <ul className="text-gray-600 space-y-2">
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Always verify material prices before submitting bids
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Include contingency allowances for unexpected costs
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Review and update your cost database regularly
            </li>
            <li className="flex items-start">
              <span className="text-blue-500 mr-2">•</span>
              Document all assumptions and exclusions clearly
            </li>
          </ul>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Actions</h3>
          <div className="space-y-3">
            <Link 
              href="/estimating/takeoff"
              className="block w-full text-left px-4 py-2 bg-blue-50 text-blue-700 rounded-md hover:bg-blue-100 transition-colors"
            >
              Start New Takeoff
            </Link>
            <Link 
              href="/estimating/templates"
              className="block w-full text-left px-4 py-2 bg-green-50 text-green-700 rounded-md hover:bg-green-100 transition-colors"
            >
              Browse Templates
            </Link>
            <Link 
              href="/estimating/materials"
              className="block w-full text-left px-4 py-2 bg-orange-50 text-orange-700 rounded-md hover:bg-orange-100 transition-colors"
            >
              Update Material Prices
            </Link>
          </div>
        </div>
      </div>
    </div>
  )
} 