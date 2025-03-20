import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { redirect } from "next/navigation"
import { prisma } from "@/lib/prisma"
import DocumentList from "@/app/components/DocumentList"
import DocumentUpload from "@/app/components/DocumentUpload"

interface Props {
  params: {
    id: string
  }
}

export default async function DocumentsPage({ params }: Props) {
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

  // Fetch documents separately
  const documents = await prisma.document.findMany({
    where: { projectId: Number(params.id) },
    orderBy: { createdAt: "desc" }
  })

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Documents</h1>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        <div className="lg:col-span-2">
          <DocumentList documents={documents} />
        </div>
        <div>
          <DocumentUpload projectId={params.id} />
        </div>
      </div>
    </div>
  )
} 