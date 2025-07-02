import { redirect } from "next/navigation"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"
import ProjectList from "@/app/components/ProjectList"
import { Session } from 'next-auth'

// Define session type
type SessionWithUserId = Session & {
  user?: {
    id?: string;
    name?: string;
    email?: string;
  }
}

export default async function ProjectsPage() {
  const session = await auth() as SessionWithUserId
  
  if (!session) {
    redirect("/login")
  }

  // Safely access user ID
  const userId = session?.user?.id
  
  if (!userId) {
    console.error("User ID not found in session")
    redirect('/login')
  }

  const projects = await db.project.findMany({
    where: {
      userId: userId
    },
    orderBy: {
      updatedAt: 'desc'
    }
  })

  console.log("Projects:", projects);

  return (
    <div className="container mx-auto px-4 py-8">
      <ProjectList projects={projects} />
    </div>
  )
}

