import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"

// GET: Fetch invoices for a project
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

    // Get all invoices for the project
    const invoices = await prisma.invoice.findMany({
      where: { projectId },
      orderBy: { date: "desc" }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[INVOICES_GET]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

// POST: Create a new invoice
export async function POST(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    console.log("[INVOICE_POST] Starting...")
    const session = await getServerSession(authOptions)
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

// DELETE: Delete an invoice
export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const invoiceId = Number(params.id)
    if (isNaN(invoiceId)) {
      return new NextResponse("Invalid invoice ID", { status: 400 })
    }

    // Get invoice with project to check ownership
    const invoice = await prisma.invoice.findUnique({
      where: { id: invoiceId },
      include: { project: true }
    })

    if (!invoice) {
      return new NextResponse("Invoice not found", { status: 404 })
    }

    if (invoice.project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Delete invoice
    await prisma.invoice.delete({
      where: { id: invoiceId }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[INVOICE_DELETE]", error)
    return new NextResponse("Internal error", { status: 500 })
  }
}

