import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

export default async function TasksPage({ params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const projectId = params.id

  const project = await db.project.findUnique({
    where: {
      id: projectId,
      userId
    },
    include: {
      tasks: true
    }
  })

  if (!project) {
    redirect("/projects")
  }

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold">Tasks</h2>
        <Link
          href={`/projects/${projectId}/tasks/new`}
          className="bg-blue-600 text-white px-4 py-2 rounded-md hover:bg-blue-700"
        >
          Add Task
        </Link>
      </div>

      {project.tasks.length === 0 ? (
        <div className="bg-white border border-gray-200 rounded-lg p-8 text-center">
          <h3 className="text-lg font-medium text-gray-800 mb-2">No tasks yet</h3>
          <p className="text-gray-600 mb-4">
            Get started by creating your first task for this project.
          </p>
          <Link
            href={`/projects/${projectId}/tasks/new`}
            className="text-blue-600 hover:text-blue-800 font-medium"
          >
            Create a task →
          </Link>
        </div>
      ) : (
        <div className="bg-white border border-gray-200 rounded-lg overflow-hidden">
          <div className="grid grid-cols-12 bg-gray-50 p-4 border-b border-gray-200 font-medium text-gray-700">
            <div className="col-span-6">Title</div>
            <div className="col-span-2">Status</div>
            <div className="col-span-2">Due Date</div>
            <div className="col-span-2 text-right">Actions</div>
          </div>
          
          {project.tasks.map((task) => (
            <div key={task.id} className="grid grid-cols-12 p-4 border-b border-gray-200 items-center">
              <div className="col-span-6">
                <p className="font-medium">{task.title}</p>
                {task.description && (
                  <p className="text-sm text-gray-600 truncate mt-1">{task.description}</p>
                )}
              </div>
              <div className="col-span-2">
                <span className={`px-2 py-1 rounded-full text-xs font-medium ${
                  task.status === "Completed" 
                    ? "bg-green-100 text-green-800" 
                    : task.status === "In Progress" 
                    ? "bg-blue-100 text-blue-800"
                    : "bg-gray-100 text-gray-800"
                }`}>
                  {task.status}
                </span>
              </div>
              <div className="col-span-2">
                {task.dueDate ? new Date(task.dueDate).toLocaleDateString() : "-"}
              </div>
              <div className="col-span-2 text-right">
                <Link
                  href={`/projects/${projectId}/tasks/${task.id}`}
                  className="text-blue-600 hover:text-blue-800 mr-2"
                >
                  View
                </Link>
                <Link
                  href={`/projects/${projectId}/tasks/${task.id}/edit`}
                  className="text-gray-600 hover:text-gray-800"
                >
                  Edit
                </Link>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
} 