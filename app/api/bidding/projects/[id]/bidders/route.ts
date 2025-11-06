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

    const bidders = await db.bidder.findMany({
      where: {
        biddingProjectId: params.id
      },
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
    })

    return NextResponse.json(bidders)
  } catch (error) {
    console.error('Error fetching bidders:', error)
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
    const { companyName, contactName, email, phone, address, licenseNumber, specialties, notes } = body

    if (!companyName || !contactName || !email) {
      return new NextResponse('Company name, contact name, and email are required', { status: 400 })
    }

    const bidder = await db.bidder.create({
      data: {
        companyName,
        contactName,
        email,
        phone,
        address,
        licenseNumber,
        specialties,
        notes,
        biddingProjectId: params.id
      }
    })

    return NextResponse.json(bidder, { status: 201 })
  } catch (error) {
    console.error('Error creating bidder:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

