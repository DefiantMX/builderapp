import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import ProjectNavWrapper from "@/app/components/ProjectNavWrapper"

interface Props {
  children: React.ReactNode
  params: {
    id: string
  }
}

export default async function ProjectLayout({ children, params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const project = await prisma.project.findUnique({
    where: { id: Number(params.id) }
  })

  if (!project) {
    redirect("/projects")
  }

  if (project.userId !== session.user.id) {
    redirect("/projects")
  }

  return (
    <div>
      <div className="bg-white shadow">
        <div className="container mx-auto px-4">
          <ProjectNavWrapper projectId={params.id} />
        </div>
      </div>
      <main>{children}</main>
    </div>
  )
} 