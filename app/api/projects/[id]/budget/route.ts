import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const budget = await db.budget.findFirst({
      where: {
        projectId: params.id,
        project: {
          userId: session.user.id
        }
      },
      include: {
        divisionBudgets: true
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error("[BUDGET_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { totalAmount, divisionBudgets } = await req.json()

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Create budget with division budgets
    const budget = await db.budget.create({
      data: {
        totalAmount,
        projectId: params.id,
        divisionBudgets: {
          create: divisionBudgets.map((db: any) => ({
            division: db.division,
            amount: db.amount
          }))
        }
      },
      include: {
        divisionBudgets: true
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error("[BUDGET_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { totalAmount, divisionBudgets } = await req.json()

    // Verify project ownership
    const project = await db.project.findUnique({
      where: {
        id: params.id,
        userId: session.user.id
      }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    // Update budget and division budgets
    const budget = await db.budget.update({
      where: {
        projectId: params.id
      },
      data: {
        totalAmount,
        divisionBudgets: {
          deleteMany: {},
          create: divisionBudgets.map((db: any) => ({
            division: db.division,
            amount: db.amount
          }))
        }
      },
      include: {
        divisionBudgets: true
      }
    })

    return NextResponse.json(budget)
  } catch (error) {
    console.error("[BUDGET_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 