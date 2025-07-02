import { NextResponse } from "next/server"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; taskId: string } }
) {
  try {
    // First verify that the project exists
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
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
    // First verify that the project exists
    const project = await prisma.project.findFirst({
      where: {
        id: parseInt(params.id),
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

