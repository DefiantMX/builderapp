import { NextResponse } from "next/server"
import { writeFile, mkdir } from "fs/promises"
import path from "path"

// This is a mock invoice database. In a real application, you'd use a proper database.
const invoices: any[] = []

export async function GET() {
  return NextResponse.json(invoices)
}

export async function POST(request: Request) {
  try {
    const formData = await request.formData()

    const projectId = formData.get("projectId") as string
    const division = formData.get("division") as string
    const vendor = formData.get("vendor") as string
    const amount = Number.parseFloat(formData.get("amount") as string)
    const date = formData.get("date") as string
    const dueDate = (formData.get("dueDate") as string) || null
    const invoiceNumber = (formData.get("invoiceNumber") as string) || null
    const description = formData.get("description") as string
    const file = formData.get("file") as File | null

    if (!projectId || !division || !vendor || isNaN(amount) || !date) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    let fileUrl = null

    if (file) {
      // Create the uploads directory structure if it doesn't exist
      const publicDir = path.join(process.cwd(), "public")
      const uploadsDir = path.join(publicDir, "uploads")
      const invoicesDir = path.join(uploadsDir, "invoices", projectId)

      try {
        // Create directories recursively
        await mkdir(publicDir, { recursive: true })
        await mkdir(uploadsDir, { recursive: true })
        await mkdir(invoicesDir, { recursive: true })
      } catch (error) {
        console.error("Error creating directories:", error)
        return NextResponse.json({ message: "Error creating upload directories" }, { status: 500 })
      }

      // Generate a unique filename to avoid collisions
      const timestamp = Date.now()
      const safeName = file.name.replace(/[^a-zA-Z0-9.-]/g, "_")
      const fileName = `${timestamp}_${safeName}`
      const filePath = path.join(invoicesDir, fileName)

      try {
        const bytes = await file.arrayBuffer()
        const buffer = Buffer.from(bytes)
        await writeFile(filePath, buffer)
        fileUrl = `/uploads/invoices/${projectId}/${fileName}`
      } catch (error) {
        console.error("Error writing file:", error)
        return NextResponse.json({ message: "Error saving file" }, { status: 500 })
      }
    }

    const newInvoice = {
      id: invoices.length + 1,
      projectId: Number.parseInt(projectId, 10),
      division,
      vendor,
      amount,
      date,
      dueDate,
      invoiceNumber,
      description,
      fileUrl,
      createdAt: new Date().toISOString(),
    }

    invoices.push(newInvoice)

    // Update budget data
    await updateBudgetWithInvoice(newInvoice)

    return NextResponse.json(newInvoice, { status: 201 })
  } catch (error) {
    console.error("Error processing invoice upload:", error)
    return NextResponse.json({ message: "An error occurred during invoice upload" }, { status: 500 })
  }
}

async function updateBudgetWithInvoice(invoice: any) {
  // This would update the budget in a real application
  // For now, we'll just make sure the budget API is aware of the new invoice
  try {
    await fetch(`${process.env.NEXT_PUBLIC_APP_URL || ""}/api/finances/budgets/update`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
      },
      body: JSON.stringify(invoice),
    })
  } catch (error) {
    console.error("Error updating budget:", error)
  }
}

