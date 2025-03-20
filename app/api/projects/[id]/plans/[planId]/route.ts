import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; planId: string } }
) {
  try {
    const session = await getServerSession(authOptions)

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    })

    if (!project) {
      return NextResponse.json({ error: "Project not found" }, { status: 404 })
    }

    // Then verify that the plan belongs to the project
    const plan = await prisma.plan.findFirst({
      where: {
        id: parseInt(params.planId),
        projectId: parseInt(params.id),
      },
    })

    if (!plan) {
      return NextResponse.json({ error: "Plan not found" }, { status: 404 })
    }

    // TODO: Delete the actual file from storage service

    await prisma.plan.delete({
      where: {
        id: parseInt(params.planId),
      },
    })

    return NextResponse.json({ message: "Plan deleted successfully" })
  } catch (error) {
    console.error("Error deleting plan:", error)
    return NextResponse.json(
      { error: "Error deleting plan" },
      { status: 500 }
    )
  }
}

