import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authOptions } from "../../../auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
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

    // Get all bids for the project
    const bids = await prisma.bid.findMany({
      where: {
        projectId: parseInt(params.id),
      },
      orderBy: {
        submissionDate: "desc",
      },
    })

    return NextResponse.json(bids)
  } catch (error) {
    console.error("Error fetching bids:", error)
    return NextResponse.json(
      { error: "Error fetching bids" },
      { status: 500 }
    )
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
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

    const {
      title,
      description,
      contractorName,
      contractorEmail,
      amount,
      validUntil,
      notes,
    } = await request.json()

    const bid = await prisma.bid.create({
      data: {
        title,
        description,
        contractorName,
        contractorEmail,
        amount,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        projectId: parseInt(params.id),
      },
    })

    return NextResponse.json(bid, { status: 201 })
  } catch (error) {
    console.error("Error creating bid:", error)
    return NextResponse.json(
      { error: "Error creating bid" },
      { status: 500 }
    )
  }
}

