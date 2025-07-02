import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import ProjectNav from "@/app/components/ProjectNav"

export default async function ProjectLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { id: string }
}) {
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
    }
  })

  if (!project) {
    redirect("/projects")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectNav project={project} />
      <div className="mt-6">
        {children}
      </div>
    </div>
  )
} 