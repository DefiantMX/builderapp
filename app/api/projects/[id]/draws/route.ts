import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth.config'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const draws = await db.draw.findMany({
      where: {
        projectId: params.id,
        project: {
          userId: session.user.id
        }
      },
      include: {
        invoices: true
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(draws)
  } catch (error) {
    console.error("[DRAWS_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await req.json()
    const { date, amount, description, invoiceIds } = body

    // Validate required fields
    if (!date || isNaN(amount) || !invoiceIds?.length) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Get the latest draw number
    const latestDraw = await db.draw.findFirst({
      where: {
        projectId: params.id
      },
      orderBy: {
        drawNumber: 'desc'
      }
    })

    const drawNumber = latestDraw ? latestDraw.drawNumber + 1 : 1

    // Create draw and connect invoices
    const draw = await db.draw.create({
      data: {
        drawNumber,
        date: new Date(date),
        amount,
        status: 'Draft',
        description,
        projectId: params.id,
        invoices: {
          connect: invoiceIds.map((id: string) => ({ id }))
        }
      },
      include: {
        invoices: true
      }
    })

    return NextResponse.json(draw)
  } catch (error) {
    console.error("[DRAW_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { drawId, date, amount, description, invoiceIds, status } = await req.json()

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Get the current draw to verify it exists and belongs to this project
    const currentDraw = await db.draw.findUnique({
      where: {
        id: drawId,
        projectId: params.id
      },
      include: {
        invoices: true
      }
    })

    if (!currentDraw) {
      return new NextResponse("Draw not found", { status: 404 })
    }

    // If only updating status, do a simple update
    if (status && !date && !amount && !description && !invoiceIds) {
      const draw = await db.draw.update({
        where: { id: drawId },
        data: { status },
        include: { invoices: true }
      })
      return NextResponse.json(draw)
    }

    // For full updates, validate required fields
    if (date === undefined || amount === undefined || !invoiceIds?.length) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Update draw with new data and reconnect invoices
    const draw = await db.draw.update({
      where: {
        id: drawId
      },
      data: {
        date: new Date(date),
        amount,
        description,
        invoices: {
          // Disconnect all current invoices
          disconnect: currentDraw.invoices.map(invoice => ({ id: invoice.id })),
          // Connect new invoices
          connect: invoiceIds.map((id: string) => ({ id }))
        }
      },
      include: {
        invoices: true
      }
    })

    return NextResponse.json(draw)
  } catch (error) {
    console.error("[DRAW_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const drawId = searchParams.get('drawId')

    if (!drawId) {
      return new NextResponse("Draw ID is required", { status: 400 })
    }

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Delete draw
    await db.draw.delete({
      where: {
        id: drawId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[DRAW_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 