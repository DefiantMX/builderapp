import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { db } from "@/lib/db"

export async function PUT(
  request: Request,
  { params }: { params: { id: string; bidId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const bid = await db.bid.findFirst({
      where: {
        id: params.bidId,
        projectId: params.id
      }
    })

    if (!bid) {
      return new NextResponse('Bid not found', { status: 404 })
    }

    const updates = await request.json()
    const updatedBid = await db.bid.update({
      where: {
        id: params.bidId
      },
      data: updates
    })

    return NextResponse.json(updatedBid)
  } catch (error) {
    console.error('Error in PUT /api/projects/[id]/bids/[bidId]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; bidId: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const bid = await db.bid.findFirst({
      where: {
        id: params.bidId,
        projectId: params.id
      }
    })

    if (!bid) {
      return new NextResponse('Bid not found', { status: 404 })
    }

    await db.bid.delete({
      where: {
        id: params.bidId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/bids/[bidId]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 