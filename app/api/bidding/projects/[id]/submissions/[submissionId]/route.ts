import { NextRequest, NextResponse } from 'next/server'
import { auth } from '@/lib/auth'
import { db } from '@/lib/db'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
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
    const { division, amount, description, fileUrl, fileType, validUntil, notes, status } = body

    const updateData: any = {}
    if (division !== undefined) updateData.division = division
    if (amount !== undefined) updateData.amount = parseFloat(amount)
    if (description !== undefined) updateData.description = description
    if (fileUrl !== undefined) updateData.fileUrl = fileUrl
    if (fileType !== undefined) updateData.fileType = fileType
    if (validUntil !== undefined) updateData.validUntil = validUntil ? new Date(validUntil) : null
    if (notes !== undefined) updateData.notes = notes
    if (status !== undefined) {
      updateData.status = status
      if (status === 'Accepted' || status === 'Rejected') {
        updateData.reviewedAt = new Date()
        updateData.reviewedBy = session.user.id
      }
    }

    const submission = await db.bidSubmission.update({
      where: {
        id: params.submissionId,
        biddingProjectId: params.id
      },
      data: updateData,
      include: {
        bidder: true
      }
    })

    return NextResponse.json(submission)
  } catch (error) {
    console.error('Error updating bid submission:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; submissionId: string } }
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

    await db.bidSubmission.delete({
      where: {
        id: params.submissionId,
        biddingProjectId: params.id
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error deleting bid submission:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

