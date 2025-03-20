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

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const note = stickyNotes.find((note) => note.id === params.id)

  if (!note) {
    return NextResponse.json({ message: "Sticky note not found" }, { status: 404 })
  }

  return NextResponse.json(note)
}

export async function PATCH(request: Request, { params }: { params: { id: string } }) {
  try {
    const updates = await request.json()
    const noteIndex = stickyNotes.findIndex((note) => note.id === params.id)

    if (noteIndex === -1) {
      return NextResponse.json({ message: "Sticky note not found" }, { status: 404 })
    }

    // Update the note with the provided changes
    stickyNotes[noteIndex] = { ...stickyNotes[noteIndex], ...updates }

    return NextResponse.json(stickyNotes[noteIndex])
  } catch (error) {
    console.error("Error updating sticky note:", error)
    return NextResponse.json({ message: "Error updating sticky note" }, { status: 500 })
  }
}

export async function DELETE(request: Request, { params }: { params: { id: string } }) {
  const noteIndex = stickyNotes.findIndex((note) => note.id === params.id)

  if (noteIndex === -1) {
    return NextResponse.json({ message: "Sticky note not found" }, { status: 404 })
  }

  stickyNotes.splice(noteIndex, 1)

  return NextResponse.json({ message: "Sticky note deleted successfully" })
}

