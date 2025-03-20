import { NextResponse } from "next/server"

// This is a mock database. In a real application, you'd use a proper database.
const stickyNotes: any[] = [
  {
    id: "1",
    content: "Call contractor about foundation issues",
    color: "#fef3c7",
    position: { x: 100, y: 100 },
  },
  {
    id: "2",
    content: "Order additional materials for Site B",
    color: "#e9d5ff",
    position: { x: 400, y: 150 },
  },
  {
    id: "3",
    content: "Schedule inspection for electrical work",
    color: "#bae6fd",
    position: { x: 200, y: 300 },
  },
]

export async function GET() {
  return NextResponse.json(stickyNotes)
}

export async function POST(request: Request) {
  try {
    const newNote = await request.json()

    // Generate a unique ID if not provided
    if (!newNote.id) {
      newNote.id = Date.now().toString()
    }

    stickyNotes.push(newNote)
    return NextResponse.json(newNote, { status: 201 })
  } catch (error) {
    console.error("Error creating sticky note:", error)
    return NextResponse.json({ message: "Error creating sticky note" }, { status: 500 })
  }
}

