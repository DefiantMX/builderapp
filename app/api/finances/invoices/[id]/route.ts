import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"

// GET: Fetch invoices for a project
export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
      },
    })

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 })
    }

    // Check if user owns the project
    if (invoice.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    return NextResponse.json(invoice)
  } catch (error) {
    console.error('Error in GET /api/finances/invoices/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// POST: Create a new invoice
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[INVOICE_POST] Starting...")
    const session = await auth()
    if (!session?.user) {
      console.log("[INVOICE_POST] No session found")
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const projectId = Number(params.id)
    if (isNaN(projectId)) {
      console.log("[INVOICE_POST] Invalid project ID:", params.id)
      return new NextResponse("Invalid project ID", { status: 400 })
    }

    // Check project ownership
    console.log("[INVOICE_POST] Checking project ownership...")
    const project = await prisma.project.findUnique({
      where: { id: projectId }
    })

    if (!project) {
      console.log("[INVOICE_POST] Project not found:", projectId)
      return new NextResponse("Project not found", { status: 404 })
    }

    if (project.userId !== session.user.id) {
      console.log("[INVOICE_POST] Unauthorized user:", session.user.id)
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const body = await request.json()
    console.log("[INVOICE_POST] Request body:", body)
    const { division, vendor, amount, date, description } = body

    // Validate required fields
    if (!division || !vendor || !amount || !date) {
      console.log("[INVOICE_POST] Missing required fields")
      return new NextResponse("Missing required fields", { status: 400 })
    }

    // Create invoice
    console.log("[INVOICE_POST] Creating invoice...")
    const invoice = await prisma.invoice.create({
      data: {
        division,
        vendor,
        amount: Number(amount),
        date: new Date(date),
        description: description || "",
        projectId
      }
    })

    console.log("[INVOICE_POST] Created invoice:", invoice)
    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[INVOICE_POST] Error:", error)
    return new NextResponse(error instanceof Error ? error.message : "Internal error", { status: 500 })
  }
}

// PATCH: Update an invoice
export async function PATCH(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
      },
    })

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 })
    }

    // Check if user owns the project
    if (invoice.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const data = await request.json()

    const updatedInvoice = await prisma.invoice.update({
      where: {
        id: parseInt(params.id),
      },
      data: {
        division: data.division,
        vendor: data.vendor,
        amount: data.amount,
        date: new Date(data.date),
        description: data.description,
      },
    })

    return NextResponse.json(updatedInvoice)
  } catch (error) {
    console.error('Error in PATCH /api/finances/invoices/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

// DELETE: Delete an invoice
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const invoice = await prisma.invoice.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
      },
    })

    if (!invoice) {
      return new NextResponse('Invoice not found', { status: 404 })
    }

    // Check if user owns the project
    if (invoice.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    await prisma.invoice.delete({
      where: {
        id: parseInt(params.id),
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/finances/invoices/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

