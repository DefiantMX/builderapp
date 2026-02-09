import { NextRequest, NextResponse } from "next/server"
import { db } from "@/lib/db"
import { getServerSession } from 'next-auth/next'
import { authConfig } from '@/lib/auth.config'

export async function POST(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authConfig)
    
    if (!session?.user?.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const { invoiceIds, status, paymentDate } = await req.json()

    if (!invoiceIds || !Array.isArray(invoiceIds) || invoiceIds.length === 0) {
      return new NextResponse("Invoice IDs are required", { status: 400 })
    }

    if (!status) {
      return new NextResponse("Status is required", { status: 400 })
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

    // Verify all invoices belong to this project
    const invoices = await db.invoice.findMany({
      where: {
        id: { in: invoiceIds },
        projectId: params.id
      }
    })

    if (invoices.length !== invoiceIds.length) {
      return new NextResponse("Some invoices not found or don't belong to this project", { status: 400 })
    }

    // Update invoices
    const updateData: any = {
      status: status as any
    }

    if (status === 'PAID' && paymentDate) {
      updateData.paymentDate = new Date(paymentDate)
    } else if (status === 'UNPAID') {
      updateData.paymentDate = null
    }

    await db.invoice.updateMany({
      where: {
        id: { in: invoiceIds }
      },
      data: updateData
    })

    return NextResponse.json({ 
      message: `Updated ${invoiceIds.length} invoice${invoiceIds.length !== 1 ? 's' : ''}`,
      updatedCount: invoiceIds.length
    })
  } catch (error) {
    console.error("[INVOICE_BULK_UPDATE]", error)
    return new NextResponse("Internal Error", { status: 500 })
  }
}
