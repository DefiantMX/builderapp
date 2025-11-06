import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function GET(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const { searchParams } = new URL(request.url)
    const showArchived = searchParams.get('archived') === 'true'

    const whereClause: any = {
      userId: session.user.id
    }

    if (showArchived) {
      whereClause.archivedAt = { not: null }
    } else {
      whereClause.archivedAt = { equals: null }
    }

    const biddingProjects = await db.biddingProject.findMany({
      where: whereClause,
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
      },
      orderBy: {
        createdAt: 'desc'
      }
    })

    return NextResponse.json(biddingProjects)
  } catch (error: any) {
    console.error('Error fetching bidding projects:', error)
    
    if (error.message?.includes('Unknown model')) {
      return NextResponse.json({ 
        error: 'Database schema not updated. Please run: npx prisma db push or npx prisma migrate dev' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error' 
    }, { status: 500 })
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { name, description, projectNumber, location, bidDueDate } = body

    if (!name) {
      return NextResponse.json({ error: 'Name is required' }, { status: 400 })
    }

    const biddingProject = await db.biddingProject.create({
      data: {
        name,
        description: description || null,
        projectNumber: projectNumber || null,
        location: location || null,
        bidDueDate: bidDueDate ? new Date(bidDueDate) : null,
        userId: session.user.id,
        status: 'Active'
      },
      select: {
        id: true,
        name: true,
        description: true,
        projectNumber: true,
        location: true,
        bidDueDate: true,
        status: true,
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

    return NextResponse.json(biddingProject, { status: 201 })
  } catch (error: any) {
    console.error('Error creating bidding project:', error)
    
    // Check if it's a Prisma error
    if (error.code === 'P2002') {
      return NextResponse.json({ error: 'A bidding project with this name already exists' }, { status: 400 })
    }
    
    if (error.message?.includes('Unknown model')) {
      return NextResponse.json({ 
        error: 'Database schema not updated. Please run: npx prisma db push or npx prisma migrate dev' 
      }, { status: 500 })
    }
    
    return NextResponse.json({ 
      error: error.message || 'Internal Server Error',
      details: process.env.NODE_ENV === 'development' ? error.stack : undefined
    }, { status: 500 })
  }
}

