import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import Link from "next/link"

export default async function ProjectPage({ params }: { params: { id: string } }) {
  const session = await auth()
  
  if (!session || !session.user) {
    redirect("/login")
  }

  const userId = session.user.id
  const projectId = params.id

  if (!projectId) {
    redirect("/projects")
  }

  const project = await db.project.findUnique({
    where: {
      id: projectId,
      userId
    },
    include: {
      tasks: true,
      plans: true,
      events: true,
      bids: true
    }
  })

  if (!project) {
    redirect("/projects")
  }

  return (
    <div>
      <div className="mb-6">
        {project.description && (
          <p className="text-gray-600">{project.description}</p>
        )}
      </div>

      <div className="grid grid-cols-1 md:grid-cols-4 gap-6">
        <ProjectSection 
          title="Tasks" 
          count={project.tasks?.length || 0}
          link={`/projects/${project.id}/tasks`}
        />
        <ProjectSection 
          title="Plans" 
          count={project.plans?.length || 0}
          link={`/projects/${project.id}/plans`}
        />
        <ProjectSection 
          title="Bids" 
          count={project.bids?.length || 0}
          link={`/projects/${project.id}/bids`}
        />
        <ProjectSection 
          title="Takeoff" 
          count={project.plans?.length || 0}
          link={`/projects/${project.id}/takeoff`}
        />
      </div>
    </div>
  )
}

function ProjectSection({ 
  title, 
  count, 
  link 
}: { 
  title: string, 
  count: number, 
  link: string 
}) {
  return (
    <div className="bg-white rounded-lg border border-gray-200 p-6">
      <h2 className="text-lg font-semibold text-gray-800 mb-2">{title}</h2>
      <p className="text-3xl font-bold text-gray-900 mb-4">{count}</p>
      <Link
        href={link}
        className="text-blue-600 hover:text-blue-800 font-medium"
      >
        View {title.toLowerCase()} →
      </Link>
    </div>
  )
}

