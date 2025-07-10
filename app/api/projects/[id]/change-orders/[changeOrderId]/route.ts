import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function PUT(
  request: NextRequest,
  { params }: { params: { id: string; changeOrderId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, amount, status, date, division, reason, approvedBy, approvedAt } = body

    const changeOrder = await prisma.changeOrder.update({
      where: {
        id: params.changeOrderId,
      },
      data: {
        title,
        description,
        amount: parseFloat(amount),
        status,
        date: new Date(date),
        division,
        reason,
        approvedBy,
        approvedAt: approvedAt ? new Date(approvedAt) : null,
      },
    })

    return NextResponse.json(changeOrder)
  } catch (error) {
    console.error('Error updating change order:', error)
    return NextResponse.json(
      { error: 'Failed to update change order' },
      { status: 500 }
    )
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: { id: string; changeOrderId: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    await prisma.changeOrder.delete({
      where: {
        id: params.changeOrderId,
      },
    })

    return NextResponse.json({ success: true })
  } catch (error) {
    console.error('Error deleting change order:', error)
    return NextResponse.json(
      { error: 'Failed to delete change order' },
      { status: 500 }
    )
  }
} 