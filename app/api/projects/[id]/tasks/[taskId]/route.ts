import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// This is a mock task database. In a real application, you'd use a proper database.
const tasks: any[] = []

export async function PUT(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
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

    // Then verify that the task belongs to the project
    const existingTask = await prisma.task.findFirst({
      where: {
        id: parseInt(params.taskId),
        projectId: parseInt(params.id),
      },
    })

    if (!existingTask) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    const updates = await request.json()

    const updatedTask = await prisma.task.update({
      where: {
        id: parseInt(params.taskId),
      },
      data: {
        ...updates,
        dueDate: updates.dueDate ? new Date(updates.dueDate) : existingTask.dueDate,
      },
    })

    return NextResponse.json(updatedTask)
  } catch (error) {
    console.error("Error updating task:", error)
    return NextResponse.json(
      { error: "Error updating task" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
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

    // Then verify that the task belongs to the project
    const task = await prisma.task.findFirst({
      where: {
        id: parseInt(params.taskId),
        projectId: parseInt(params.id),
      },
    })

    if (!task) {
      return NextResponse.json({ error: "Task not found" }, { status: 404 })
    }

    await prisma.task.delete({
      where: {
        id: parseInt(params.taskId),
      },
    })

    return NextResponse.json({ message: "Task deleted successfully" })
  } catch (error) {
    console.error("Error deleting task:", error)
    return NextResponse.json(
      { error: "Error deleting task" },
      { status: 500 }
    )
  }
}

export async function PATCH(request: Request, { params }: { params: { id: string; taskId: string } }) {
  const taskIndex = tasks.findIndex(
    (task) => task.projectId === Number.parseInt(params.id) && task.id === Number.parseInt(params.taskId),
  )

  if (taskIndex === -1) {
    return NextResponse.json({ message: "Task not found" }, { status: 404 })
  }

  const updates = await request.json()
  tasks[taskIndex] = { ...tasks[taskIndex], ...updates }

  return NextResponse.json(tasks[taskIndex])
}

