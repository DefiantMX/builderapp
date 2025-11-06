import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify bidding project belongs to user
    const biddingProject = await db.biddingProject.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!biddingProject) {
      return NextResponse.json({ error: 'Bidding project not found' }, { status: 404 })
    }

    // Archive the project
    const archivedProject = await db.biddingProject.update({
      where: {
        id: params.id,
        userId: session.user.id
      },
      data: {
        archivedAt: new Date(),
        status: 'Completed'
      },
      select: {
        id: true,
        name: true,
        description: true,
        projectNumber: true,
        location: true,
        bidDueDate: true,
        status: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bidders: true,
            bidSubmissions: true,
            biddingPlans: true
          }
        }
      }
    })

    return NextResponse.json(archivedProject)
  } catch (error: any) {
    console.error('Error archiving bidding project:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    // Verify bidding project belongs to user
    const biddingProject = await db.biddingProject.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!biddingProject) {
      return NextResponse.json({ error: 'Bidding project not found' }, { status: 404 })
    }

    // Unarchive the project
    const unarchivedProject = await db.biddingProject.update({
      where: {
        id: params.id,
        userId: session.user.id
      },
      data: {
        archivedAt: null
      },
      select: {
        id: true,
        name: true,
        description: true,
        projectNumber: true,
        location: true,
        bidDueDate: true,
        status: true,
        archivedAt: true,
        createdAt: true,
        updatedAt: true,
        _count: {
          select: {
            bidders: true,
            bidSubmissions: true,
            biddingPlans: true
          }
        }
      }
    })

    return NextResponse.json(unarchivedProject)
  } catch (error: any) {
    console.error('Error unarchiving bidding project:', error)
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 })
  }
}

