import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { auth } from "@/lib/auth"

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  console.log('GET /api/projects/[id]/budget called with params:', params)
  
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    console.log('GET: Fetching budget for project:', params.id)

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

    console.log('GET: Found budget:', budget ? 'yes' : 'no')
    console.log('GET: Division budgets count:', budget?.divisionBudgets?.length || 0)

    // Manually fetch subcategories for each division budget
    if (budget?.divisionBudgets) {
      for (const divisionBudget of budget.divisionBudgets) {
        console.log('GET: Fetching subcategories for division:', divisionBudget.division)
        const subcategories = await db.subcategoryBudget.findMany({
          where: {
            divisionBudgetId: divisionBudget.id
          }
        })
        console.log('GET: Found subcategories:', subcategories.length)
        divisionBudget.subcategories = subcategories
      }
    }

    console.log('GET API returning budget:', budget)
    console.log('Sample division budget:', budget?.divisionBudgets?.[0])
    console.log('Sample division subcategories:', budget?.divisionBudgets?.[0]?.subcategories)

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
    
    console.log('POST API received budget data:', { totalAmount, divisionCount: divisionBudgets?.length })
    console.log('Sample division data:', divisionBudgets?.[0])
    console.log('Sample division subcategories:', divisionBudgets?.[0]?.subcategories)

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

    // Create budget with division budgets and subcategories
    const budget = await db.budget.create({
      data: {
        totalAmount,
        projectId: params.id,
        divisionBudgets: {
          create: divisionBudgets.map((db: any) => ({
            division: db.division,
            amount: db.amount,
            description: db.description || '',
            subcategories: {
              create: (db.subcategories || []).map((sub: any) => ({
                subcategory: sub.subcategory,
                amount: sub.amount,
                description: sub.description || ''
              }))
            }
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
  console.log('PUT /api/projects/[id]/budget called with params:', params)
  
  try {
    const session = await auth()
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { totalAmount, divisionBudgets } = await req.json()
    
    console.log('PUT: Received budget data:', { totalAmount, divisionCount: divisionBudgets?.length })
    console.log('PUT: Sample division data:', divisionBudgets?.[0])
    console.log('PUT: Sample division subcategories:', divisionBudgets?.[0]?.subcategories)

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

    // Update budget and division budgets with subcategories
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
            amount: db.amount,
            description: db.description || '',
            subcategories: {
              create: (db.subcategories || []).map((sub: any) => ({
                subcategory: sub.subcategory,
                amount: sub.amount,
                description: sub.description || ''
              }))
            }
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