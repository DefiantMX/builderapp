import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Fetch budget for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
        divisionBudgets: true,
      },
    })

    if (!budget) {
      return new NextResponse('Budget not found', { status: 404 })
    }

    // Check if user owns the project
    if (budget.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    return NextResponse.json(budget)
  } catch (error) {
    console.error('Error in GET /api/finances/budgets/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// PATCH: Update a budget
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const budget = await prisma.budget.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
      },
    })

    if (!budget) {
      return new NextResponse('Budget not found', { status: 404 })
    }

    // Check if user owns the project
    if (budget.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()

    const updatedBudget = await prisma.budget.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        totalAmount: data.totalAmount,
        divisionBudgets: {
          deleteMany: {},
          create: data.divisionBudgets,
        },
      },
      include: {
        divisionBudgets: true,
      },
    })

    return NextResponse.json(updatedBudget)
  } catch (error) {
    console.error('Error in PATCH /api/finances/budgets/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

