import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET: Fetch budget for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      return new NextResponse("Invalid project ID", { status: 400 })
    }

    // First check if the user owns the project
    const project = await prisma.project.findUnique({
      where: { id: projectId },
      include: { budgets: true }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Get budget with divisions and calculate spent amounts from invoices
    const budget = await prisma.budget.findUnique({
      where: { projectId },
      include: {
        divisionBudgets: true,
      },
    })

    // Get all invoices for the project
    const invoices = await prisma.invoice.findMany({
      where: { projectId },
    })

    // Calculate spent amounts per division
    const spentByDivision: Record<string, number> = {}
    invoices.forEach(invoice => {
      spentByDivision[invoice.division] = (spentByDivision[invoice.division] || 0) + invoice.amount
    })

    // Format response
    const response = {
      projectId,
      totalBudget: budget?.totalAmount || 0,
      totalSpent: Object.values(spentByDivision).reduce((a, b) => a + b, 0),
      divisions: budget?.divisionBudgets.map(div => ({
        division: div.division,
        budget: div.amount,
        spent: spentByDivision[div.division] || 0
      })) || []
    }

    return NextResponse.json(response)
  } catch (error) {
    console.error("[BUDGET_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST: Create or update budget for a project
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      return new NextResponse("Invalid project ID", { status: 400 })
    }

    // Check project ownership
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      return new NextResponse("Project not found", { status: 404 })
    }

    if (project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    console.log("[BUDGET_POST] Request body:", body)
    const { totalAmount, divisions } = body

    // Validate required fields
    if (!totalAmount || !divisions || !Array.isArray(divisions)) {
      console.log("[BUDGET_POST] Missing or invalid required fields")
      return new NextResponse("Missing or invalid required fields", { status: 400 })
    }

    // Validate division data
    for (const div of divisions) {
      if (!div.division || typeof div.amount !== "number") {
        console.log("[BUDGET_POST] Invalid division data:", div)
        return new NextResponse("Invalid division data", { status: 400 })
      }
    }

    // Create or update budget using upsert
    const budget = await prisma.budget.upsert({
      where: { projectId },
      create: {
        totalAmount: Number(totalAmount),
        projectId,
        divisionBudgets: {
          create: divisions.map((div: { division: string; amount: number }) => ({
            division: div.division,
            amount: Number(div.amount)
          }))
        }
      },
      update: {
        totalAmount: Number(totalAmount),
        divisionBudgets: {
          deleteMany: {},
          create: divisions.map((div: { division: string; amount: number }) => ({
            division: div.division,
            amount: Number(div.amount)
          }))
        }
      },
      include: {
        divisionBudgets: true
      }
    })

    console.log("[BUDGET_POST] Created/updated budget:", budget)
    return NextResponse.json(budget)
  } catch (error) {
    console.error("[BUDGET_POST]", error)
    return new NextResponse(error instanceof Error ? error.message : "Internal error", { status: 500 })
  }
}

