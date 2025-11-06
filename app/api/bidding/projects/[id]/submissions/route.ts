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

    const { searchParams } = new URL(request.url)
    const division = searchParams.get('division')
    const status = searchParams.get('status')

    const where: any = {
      biddingProjectId: params.id
    }

    if (division) {
      where.division = division
    }

    if (status) {
      where.status = status
    }

    const submissions = await db.bidSubmission.findMany({
      where,
      include: {
        bidder: true
      },
      orderBy: {
        submittedAt: 'desc'
      }
    })

    return NextResponse.json(submissions)
  } catch (error) {
    console.error('Error fetching bid submissions:', error)
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
    const { bidderId, division, amount, description, fileUrl, fileType, validUntil, notes } = body

    if (!bidderId || !division || amount === undefined) {
      return new NextResponse('Bidder, division, and amount are required', { status: 400 })
    }

    const submission = await db.bidSubmission.create({
      data: {
        biddingProjectId: params.id,
        bidderId,
        division,
        amount: parseFloat(amount),
        description,
        fileUrl,
        fileType,
        validUntil: validUntil ? new Date(validUntil) : null,
        notes,
        status: 'Submitted'
      },
      include: {
        bidder: true
      }
    })

    return NextResponse.json(submission, { status: 201 })
  } catch (error) {
    console.error('Error creating bid submission:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

