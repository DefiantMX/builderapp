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

    // Verify bidding project belongs to user
    const biddingProject = await db.biddingProject.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!biddingProject) {
      return new NextResponse('Bidding project not found', { status: 404 })
    }

    const plans = await db.biddingPlan.findMany({
      where: {
        biddingProjectId: params.id
      },
      include: {
        _count: {
          select: {
            bidInvitations: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(plans)
  } catch (error) {
    console.error('Error fetching bidding plans:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Verify bidding project belongs to user
    const biddingProject = await db.biddingProject.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!biddingProject) {
      return new NextResponse('Bidding project not found', { status: 404 })
    }

    const body = await request.json()
    const { title, description, fileUrl, fileType } = body

    if (!title || !fileUrl) {
      return new NextResponse('Title and file URL are required', { status: 400 })
    }

    const plan = await db.biddingPlan.create({
      data: {
        title,
        description,
        fileUrl,
        fileType: fileType || 'application/pdf',
        biddingProjectId: params.id
      }
    })

    return NextResponse.json(plan, { status: 201 })
  } catch (error) {
    console.error('Error creating bidding plan:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

