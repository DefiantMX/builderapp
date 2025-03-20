import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// This is a mock draws database. In a real application, you'd use a proper database.
const draws: any[] = []

export async function GET() {
  return NextResponse.json(draws)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const projectId = Number(formData.get("projectId"))
    const drawNumber = Number(formData.get("drawNumber"))
    const date = formData.get("date") as string
    const amount = Number(formData.get("amount"))
    const description = formData.get("description") as string
    const status = formData.get("status") as "Draft" | "Submitted" | "Approved" | "Paid" | "Rejected"
    const selectedInvoicesStr = formData.get("selectedInvoices") as string
    const file = formData.get("file") as File | null

    if (!projectId || !drawNumber || !date || !amount || !status) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    let selectedInvoices: number[] = []
    try {
      selectedInvoices = JSON.parse(selectedInvoicesStr || "[]")
    } catch (e) {
      console.error("Error parsing selectedInvoices:", e)
    }

    let fileUrl = null

    if (file) {
      // Create the uploads directory structure if it doesn't exist
      const publicDir = path.join(process.cwd(), "public")
      const uploadsDir = path.join(publicDir, "uploads")
      const drawsDir = path.join(uploadsDir, "draws", projectId.toString())

      try {
        // Create directories recursively
        await mkdir(publicDir, { recursive: true })
        await mkdir(uploadsDir, { recursive: true })
        await mkdir(drawsDir, { recursive: true })
      } catch (error) {
        console.error("Error creating directories:", error)
        return NextResponse.json({ message: "Error creating upload directories" }, { status: 500 })
      }

      // Generate a unique filename to avoid collisions
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const fileName = `${timestamp}_${safeName}`
      const filePath = path.join(drawsDir, fileName)

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)
        fileUrl = `/uploads/draws/${projectId}/${fileName}`
      } catch (error) {
        console.error("Error writing file:", error)
        return NextResponse.json({ message: "Error saving file" }, { status: 500 })
      }
    }

    // Get the invoices data to include in the draw
    let includedInvoices = []
    if (selectedInvoices.length > 0) {
      // In a real app, you'd fetch these from your database
      // For this mock example, we'll use static data
      const allInvoices = [
        {
          id: 1,
          projectId: 1,
          invoiceNumber: "INV-001",
          vendor: "ABC Concrete",
          amount: 45000,
          division: "03",
          date: "2023-06-01",
        },
        {
          id: 2,
          projectId: 1,
          invoiceNumber: "INV-002",
          vendor: "XYZ Excavation",
          amount: 80000,
          division: "31",
          date: "2023-06-10",
        },
        {
          id: 3,
          projectId: 1,
          invoiceNumber: "INV-003",
          vendor: "Framing Co",
          amount: 95000,
          division: "06",
          date: "2023-07-05",
        },
      ]

      includedInvoices = allInvoices.filter((invoice) => selectedInvoices.includes(invoice.id))
    }

    const newDraw = {
      id: draws.length + 1,
      projectId,
      drawNumber,
      date,
      amount,
      description,
      status,
      fileUrl,
      createdAt: new Date().toISOString(),
      invoices: includedInvoices,
    }

    draws.push(newDraw)

    return NextResponse.json(newDraw, { status: 201 })
  } catch (error) {
    console.error("Error processing draw creation:", error)
    return NextResponse.json({ message: "An error occurred during draw creation" }, { status: 500 })
  }
}

