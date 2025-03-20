import Link from "next/link"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import { 
  ClipboardList, 
  FileText, 
  Calendar
} from "lucide-react"

interface Props {
  params: {
    id: string
  }
}

export default async function ProjectPage({ params }: Props) {
  const session = await getServerSession(authOptions)
  if (!session?.user) {
    redirect("/login")
  }

  const project = await prisma.project.findUnique({
    where: { id: Number(params.id) },
    include: {
      tasks: true,
      plans: true,
      events: true
    }
  })

  if (!project) {
    redirect("/projects")
  }

  if (project.userId !== session.user.id) {
    redirect("/projects")
  }

  const projectFeatures = [
    {
      name: "Tasks",
      href: `/projects/${params.id}/tasks`,
      icon: ClipboardList,
      color: "text-blue-600",
      count: project.tasks.length,
      label: "tasks"
    },
    {
      name: "Plans",
      href: `/projects/${params.id}/plans`,
      icon: FileText,
      color: "text-green-600",
      count: project.plans.length,
      label: "plans"
    },
    {
      name: "Schedule",
      href: `/projects/${params.id}/schedule`,
      icon: Calendar,
      color: "text-purple-600",
      count: project.events.length,
      label: "events"
    },
    {
      name: "Documents",
      href: `/projects/${params.id}/documents`,
      icon: FileText,
      color: "text-yellow-600",
      count: 0,
      label: "documents"
    }
  ]

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <div>
          <h1 className="text-3xl font-bold mb-2">{project.name}</h1>
          <span className={`px-3 py-1 rounded-full text-sm font-medium ${
            project.status === "In Progress"
              ? "bg-blue-100 text-blue-800"
              : project.status === "Completed"
              ? "bg-green-100 text-green-800"
              : "bg-gray-100 text-gray-800"
          }`}>
            {project.status}
          </span>
        </div>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {projectFeatures.map((feature) => {
          const Icon = feature.icon
          return (
            <Link
              key={feature.name}
              href={feature.href}
              className="p-6 bg-white rounded-lg shadow hover:shadow-md transition-shadow"
            >
              <div className="flex items-center gap-3">
                <Icon className={`w-6 h-6 ${feature.color}`} />
                <h2 className="text-xl font-semibold">{feature.name}</h2>
              </div>
              <p className="mt-2 text-gray-600">
                {feature.count} {feature.label}
              </p>
            </Link>
          )
        })}
      </div>

      {project.description && (
        <div className="mt-8">
          <h2 className="text-xl font-semibold mb-2">Description</h2>
          <p className="text-gray-600">{project.description}</p>
        </div>
      )}
    </div>
  )
}

