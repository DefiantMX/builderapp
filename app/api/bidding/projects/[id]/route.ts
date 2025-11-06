import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const biddingProject = await db.biddingProject.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      },
      include: {
        bidders: {
          include: {
            _count: {
              select: {
                bidSubmissions: true,
                bidInvitations: true
              }
            }
          },
          orderBy: {
            createdAt: 'desc'
          }
        },
        bidSubmissions: {
          include: {
            bidder: true
          },
          orderBy: {
            submittedAt: 'desc'
          }
        },
        biddingPlans: {
          orderBy: {
            createdAt: 'desc'
          }
        },
        bidInvitations: {
          include: {
            bidder: true,
            biddingPlan: true
          },
          orderBy: {
            sentAt: 'desc'
          }
        }
      }
    })

    if (!biddingProject) {
      return new NextResponse('Bidding project not found', { status: 404 })
    }

    return NextResponse.json(biddingProject)
  } catch (error) {
    console.error('Error fetching bidding project:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const body = await request.json()
    const { name, description, projectNumber, location, bidDueDate, status } = body

    const biddingProject = await db.biddingProject.update({
      where: {
        id: params.id,
        userId: session.user.id
      },
      data: {
        name,
        description,
        projectNumber,
        location,
        bidDueDate: bidDueDate ? new Date(bidDueDate) : null,
        status,
        // If status is being set to Completed, optionally archive it
        archivedAt: status === 'Completed' ? undefined : undefined
      }
    })

    return NextResponse.json(biddingProject)
  } catch (error) {
    console.error('Error updating bidding project:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await db.biddingProject.delete({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting bidding project:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

