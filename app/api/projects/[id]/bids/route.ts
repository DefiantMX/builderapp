import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

// Define the Bid type to match our schema
type Bid = {
  title: string
  description?: string
  contractorName: string
  contractorEmail: string
  amount: number
  division: string
  status?: string
  validUntil?: Date
  notes?: string
  projectId: string
}

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const project = await db.project.findFirst({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse('Project not found', { status: 404 })
    }

    const bids = await db.bid.findMany({
      where: {
        projectId: params.id
      }
    })

    return NextResponse.json(bids)
  } catch (error) {
    console.error('Error in GET /api/projects/[id]/bids:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()

    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    // First verify that the project belongs to the user
    const project = await db.project.findFirst({
      where: {
        id: params.id,
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
      division,
      validUntil,
      notes,
    } = await request.json()

    const bid = await db.bid.create({
      data: {
        title,
        description,
        contractorName,
        contractorEmail,
        amount,
        division,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        projectId: params.id,
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

