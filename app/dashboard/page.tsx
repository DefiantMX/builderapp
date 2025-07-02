import Link from 'next/link'
import { auth } from "@/lib/auth"
import { redirect } from "next/navigation"
import { db } from "@/lib/db"

type Project = {
  id: string
  name: string
  description: string | null
  createdAt: Date
  updatedAt: Date
}

export default async function Dashboard() {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect('/login')
  }

  // Safely access user ID
  const userId = session?.user?.id
  
  if (!userId) {
    console.error("User ID not found in session")
    redirect('/login')
  }

  // Fetch user's projects
  const projects = await db.project.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      updatedAt: 'desc'
    },
    take: 5 // Get most recent 5 projects
  })

  // Get counts for metrics
  const todayStart = new Date()
  todayStart.setHours(0, 0, 0, 0)
  
  const weekStart = new Date()
  weekStart.setDate(weekStart.getDate() - 7)
  
  const monthStart = new Date()
  monthStart.setDate(monthStart.getDate() - 30)
  
  // You could replace these with actual metrics from your database
  const todayCount = projects.length
  const weekCount = projects.length
  const monthCount = projects.length
  const totalCount = projects.length

  return (
    <div className="max-w-6xl mx-auto px-4 py-8">
      {/* Welcome section */}
      <div className="flex justify-between items-center mb-10">
        <h1 className="text-3xl font-bold text-gray-800">
          Welcome back, {session?.user?.name || 'Builder'}
        </h1>
        <div>
          <Link
            href="/projects/new" 
            className="bg-blue-600 hover:bg-blue-700 text-white font-medium py-2 px-4 rounded-md inline-flex items-center"
          >
            Create New Project
          </Link>
        </div>
      </div>
      
      {/* Metrics section */}
      <div className="mb-10">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-semibold text-gray-800">Projects Overview</h2>
          <Link href="/projects" className="text-blue-600 hover:text-blue-800 text-sm font-medium inline-flex items-center">
            View All Projects
          </Link>
        </div>
        
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-2">Today</div>
            <div className="text-3xl font-bold text-gray-800">{todayCount}</div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-2">Past 7 days</div>
            <div className="text-3xl font-bold text-gray-800">{weekCount}</div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-2">Past 30 days</div>
            <div className="text-3xl font-bold text-gray-800">{monthCount}</div>
          </div>
          <div className="bg-gray-50 p-6 rounded-lg">
            <div className="text-sm font-medium text-gray-500 mb-2">Total</div>
            <div className="text-3xl font-bold text-gray-800">{totalCount}</div>
          </div>
        </div>
      </div>
      
      {/* Recent projects section */}
      <div className="mb-10">
        <h2 className="text-xl font-semibold text-gray-800 mb-4">Most recent projects</h2>
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          {projects.length > 0 ? (
            projects.map((project, index) => (
              <Link 
                key={project.id} 
                href={`/projects/${project.id}`}
                className={`flex items-center p-4 hover:bg-gray-50 ${
                  index < projects.length - 1 ? 'border-b border-gray-200' : ''
                }`}
              >
                <div className="flex-1">
                  <div className="font-medium text-gray-800">{project.name}</div>
                  <div className="text-sm text-gray-500">
                    {project.description || 'No description'}
                  </div>
                </div>
                <div className="text-sm text-gray-500">
                  {new Date(project.updatedAt).toLocaleDateString()}
                </div>
              </Link>
            ))
          ) : (
            <div className="p-6 text-center text-gray-500">
              No projects yet. Create your first project!
            </div>
          )}
        </div>
      </div>
      
      {/* Tips section */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Quick Start</h3>
          <p className="text-gray-600 mb-4">
            Create your first project and start tracking tasks, managing timelines, and more.
          </p>
          <Link 
            href="/projects/new" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create a project →
          </Link>
        </div>
        
        <div className="bg-white border border-gray-200 rounded-lg p-6">
          <h3 className="text-lg font-semibold text-gray-800 mb-4">Need Help?</h3>
          <p className="text-gray-600 mb-4">
            Check out our documentation for tips on how to get the most out of your project management tools.
          </p>
          <Link 
            href="/help" 
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            View documentation →
          </Link>
        </div>
      </div>
    </div>
  )
} 