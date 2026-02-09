import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth.config'

export async function GET(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const invoices = await db.invoice.findMany({
      where: {
        projectId: params.id,
        project: {
          userId: session.user.id
        }
      },
      orderBy: {
        date: 'desc'
      }
    })

    return NextResponse.json(invoices)
  } catch (error) {
    console.error("[INVOICES_GET]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    let vendor: string, amount: number, date: string, description: string | null, division: string
    let invoiceNumber: string | null, dueDate: string | null, paymentDate: string | null, status: string

    const contentType = req.headers.get('content-type') || ''
    
    if (contentType.includes('multipart/form-data')) {
      const formData = await req.formData()
      vendor = formData.get('vendor') as string
      amount = parseFloat(formData.get('amount') as string)
      date = formData.get('date') as string
      description = formData.get('description') as string || null
      division = formData.get('division') as string
      invoiceNumber = formData.get('invoiceNumber') as string || null
      dueDate = formData.get('dueDate') as string || null
      paymentDate = formData.get('paymentDate') as string || null
      status = formData.get('status') as string || 'UNPAID'
    } else {
      const body = await req.json()
      vendor = body.vendor
      amount = parseFloat(body.amount)
      date = body.date
      description = body.description
      division = body.division
      invoiceNumber = body.invoiceNumber || null
      dueDate = body.dueDate || null
      paymentDate = body.paymentDate || null
      status = body.status || 'UNPAID'
    }

    // Validate required fields
    if (!vendor || isNaN(amount) || !date || !division) {
      return new NextResponse("Missing required fields", { status: 400 })
    }

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

    // Create invoice
    const invoice = await db.invoice.create({
      data: {
        vendor,
        amount,
        date: new Date(date),
        description,
        division,
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        status: status as any,
        projectId: params.id
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[INVOICE_POST]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { 
      id, 
      division, 
      vendor, 
      amount, 
      date, 
      description, 
      invoiceNumber, 
      dueDate, 
      paymentDate, 
      status 
    } = await req.json()

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

    // Update invoice
    const invoice = await db.invoice.update({
      where: {
        id
      },
      data: {
        division,
        vendor,
        amount,
        date: new Date(date),
        description,
        invoiceNumber,
        dueDate: dueDate ? new Date(dueDate) : null,
        paymentDate: paymentDate ? new Date(paymentDate) : null,
        status: status as any
      }
    })

    return NextResponse.json(invoice)
  } catch (error) {
    console.error("[INVOICE_PUT]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { searchParams } = new URL(req.url)
    const invoiceId = searchParams.get('invoiceId')

    if (!invoiceId) {
      return new NextResponse("Invoice ID is required", { status: 400 })
    }

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

    // Delete invoice
    await db.invoice.delete({
      where: {
        id: invoiceId
      }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("[INVOICE_DELETE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
} 