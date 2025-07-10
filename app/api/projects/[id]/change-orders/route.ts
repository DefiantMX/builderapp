import { NextRequest, NextResponse } from 'next/server'
import { getServerSession } from 'next-auth'
import { authConfig } from '@/lib/auth'
import { prisma } from '@/lib/prisma'

export async function GET(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const changeOrders = await prisma.changeOrder.findMany({
      where: {
        projectId: params.id,
      },
      orderBy: {
        createdAt: 'desc',
      },
    })

    return NextResponse.json(changeOrders)
  } catch (error) {
    console.error('Error fetching change orders:', error)
    return NextResponse.json(
      { error: 'Failed to fetch change orders' },
      { status: 500 }
    )
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    if (!session?.user?.email) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 })
    }

    const body = await request.json()
    const { title, description, amount, status, date, division, reason, approvedBy, approvedAt } = body

    const changeOrder = await prisma.changeOrder.create({
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
        projectId: params.id,
      },
    })

    return NextResponse.json(changeOrder)
  } catch (error) {
    console.error('Error creating change order:', error)
    return NextResponse.json(
      { error: 'Failed to create change order' },
      { status: 500 }
    )
  }
} 