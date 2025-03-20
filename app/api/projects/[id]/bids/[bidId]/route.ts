import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; bidId: string } }
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

    // Then verify that the bid belongs to the project
    const existingBid = await prisma.bid.findFirst({
      where: {
        id: parseInt(params.bidId),
        projectId: parseInt(params.id),
      },
    })

    if (!existingBid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    const updates = await request.json()

    const updatedBid = await prisma.bid.update({
      where: {
        id: parseInt(params.bidId),
      },
      data: {
        ...updates,
        validUntil: updates.validUntil ? new Date(updates.validUntil) : existingBid.validUntil,
      },
    })

    return NextResponse.json(updatedBid)
  } catch (error) {
    console.error("Error updating bid:", error)
    return NextResponse.json(
      { error: "Error updating bid" },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; bidId: string } }
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

    // Then verify that the bid belongs to the project
    const bid = await prisma.bid.findFirst({
      where: {
        id: parseInt(params.bidId),
        projectId: parseInt(params.id),
      },
    })

    if (!bid) {
      return NextResponse.json({ error: "Bid not found" }, { status: 404 })
    }

    await prisma.bid.delete({
      where: {
        id: parseInt(params.bidId),
      },
    })

    return NextResponse.json({ message: "Bid deleted successfully" })
  } catch (error) {
    console.error("Error deleting bid:", error)
    return NextResponse.json(
      { error: "Error deleting bid" },
      { status: 500 }
    )
  }
} 