import { NextResponse } from "next/server"

// This is a mock draws database. In a real application, you'd use a proper database.
const draws: any[] = [
  {
    id: 1,
    projectId: 1,
    drawNumber: 1,
    date: "2023-06-15",
    amount: 125000,
    status: "Paid",
    description: "Initial foundation work and site preparation",
    fileUrl: null,
    createdAt: "2023-06-15T12:00:00Z",
    invoices: [
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
    ],
  },
  {
    id: 2,
    projectId: 1,
    drawNumber: 2,
    date: "2023-07-15",
    amount: 175000,
    status: "Paid",
    description: "Framing and electrical rough-in",
    fileUrl: null,
    createdAt: "2023-07-15T12:00:00Z",
    invoices: [
      {
        id: 3,
        projectId: 1,
        invoiceNumber: "INV-003",
        vendor: "Framing Co",
        amount: 95000,
        division: "06",
        date: "2023-07-05",
      },
      {
        id: 4,
        projectId: 1,
        invoiceNumber: "INV-004",
        vendor: "Electric Masters",
        amount: 80000,
        division: "26",
        date: "2023-07-10",
      },
    ],
  },
  {
    id: 3,
    projectId: 1,
    drawNumber: 3,
    date: "2023-08-15",
    amount: 150000,
    status: "Approved",
    description: "Plumbing, HVAC installation, and exterior finishes",
    fileUrl: null,
    createdAt: "2023-08-15T12:00:00Z",
    invoices: [
      {
        id: 5,
        projectId: 1,
        invoiceNumber: "INV-005",
        vendor: "Plumbing Pro",
        amount: 60000,
        division: "22",
        date: "2023-08-02",
      },
      {
        id: 6,
        projectId: 1,
        invoiceNumber: "INV-006",
        vendor: "HVAC Solutions",
        amount: 90000,
        division: "23",
        date: "2023-08-05",
      },
    ],
  },
  {
    id: 4,
    projectId: 2,
    drawNumber: 1,
    date: "2023-05-20",
    amount: 100000,
    status: "Paid",
    description: "Site preparation and foundation work",
    fileUrl: null,
    createdAt: "2023-05-20T12:00:00Z",
    invoices: [],
  },
  {
    id: 5,
    projectId: 2,
    drawNumber: 2,
    date: "2023-06-20",
    amount: 120000,
    status: "Paid",
    description: "Framing and roofing",
    fileUrl: null,
    createdAt: "2023-06-20T12:00:00Z",
    invoices: [],
  },
  {
    id: 6,
    projectId: 2,
    drawNumber: 3,
    date: "2023-07-20",
    amount: 80000,
    status: "Submitted",
    description: "Interior finishes and fixtures",
    fileUrl: null,
    createdAt: "2023-07-20T12:00:00Z",
    invoices: [],
  },
]

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const projectId = Number.parseInt(params.id, 10)
  const projectDraws = draws.filter((draw) => draw.projectId === projectId)

  // Sort by draw number, newest first
  projectDraws.sort((a, b) => b.drawNumber - a.drawNumber)

  return NextResponse.json(projectDraws)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const drawId = Number.parseInt(params.id, 10)
    const updates = await request.json()

    const drawIndex = draws.findIndex((draw) => draw.id === drawId)
    if (drawIndex === -1) {
      return NextResponse.json({ message: "Draw not found" }, { status: 404 })
    }

    // Update the draw
    draws[drawIndex] = { ...draws[drawIndex], ...updates }

    return NextResponse.json(draws[drawIndex])
  } catch (error) {
    console.error("Error updating draw:", error)
    return NextResponse.json({ message: "An error occurred while updating the draw" }, { status: 500 })
  }
}

