import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; bidderId: string } }
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

    const bidder = await db.bidder.update({
      where: {
        id: params.bidderId,
        biddingProjectId: params.id
      },
      data: {
        companyName,
        contactName,
        email,
        phone,
        address,
        licenseNumber,
        specialties,
        notes
      }
    })

    return NextResponse.json(bidder)
  } catch (error) {
    console.error('Error updating bidder:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; bidderId: string } }
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

    await db.bidder.delete({
      where: {
        id: params.bidderId,
        biddingProjectId: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting bidder:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

