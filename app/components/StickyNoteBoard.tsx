"use client"

import type React from "react"

import { useState, useEffect } from "react"
import { DndProvider, useDrop } from "react-dnd"
import { HTML5Backend } from "react-dnd-html5-backend"
import { Plus } from "lucide-react"
import StickyNote from "./StickyNote"

type StickyNoteType = {
  id: string
  content: string
  color: string
  position: { x: number; y: number }
}

const COLORS = [
  "#fef3c7", // amber-100
  "#e9d5ff", // purple-200
  "#bae6fd", // sky-200
  "#bbf7d0", // green-200
  "#fed7aa", // orange-200
  "#fecaca", // red-200
]

export default function StickyNoteBoard() {
  const [notes, setNotes] = useState<StickyNoteType[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    // Fetch sticky notes from API
    const fetchNotes = async () => {
      try {
        const response = await fetch("/api/sticky-notes")
        if (response.ok) {
          const data = await response.json()
          setNotes(data)
        }
      } catch (error) {
        console.error("Error fetching sticky notes:", error)
      } finally {
        setLoading(false)
      }
    }

    fetchNotes()
  }, [])

  const addNote = async () => {
    // Calculate position for new note - slightly offset from previous notes
    const offsetX = (notes.length % 3) * 30
    const offsetY = (notes.length % 4) * 30

    const newNote: StickyNoteType = {
      id: Date.now().toString(),
      content: "New note",
      color: COLORS[Math.floor(Math.random() * COLORS.length)],
      position: { x: 100 + offsetX, y: 100 + offsetY },
    }

    try {
      const response = await fetch("/api/sticky-notes", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newNote),
      })

      if (response.ok) {
        const savedNote = await response.json()
        setNotes([...notes, savedNote])
      }
    } catch (error) {
      console.error("Error adding sticky note:", error)
    }
  }

  const moveNote = async (id: string, position: { x: number; y: number }) => {
    const updatedNotes = notes.map((note) => (note.id === id ? { ...note, position } : note))
    setNotes(updatedNotes)

    try {
      await fetch(`/api/sticky-notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ position }),
      })
    } catch (error) {
      console.error("Error updating sticky note position:", error)
    }
  }

  const deleteNote = async (id: string) => {
    try {
      await fetch(`/api/sticky-notes/${id}`, {
        method: "DELETE",
      })
      setNotes(notes.filter((note) => note.id !== id))
    } catch (error) {
      console.error("Error deleting sticky note:", error)
    }
  }

  const editNote = async (id: string, content: string) => {
    const updatedNotes = notes.map((note) => (note.id === id ? { ...note, content } : note))
    setNotes(updatedNotes)

    try {
      await fetch(`/api/sticky-notes/${id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content }),
      })
    } catch (error) {
      console.error("Error updating sticky note content:", error)
    }
  }

  return (
    <DndProvider backend={HTML5Backend}>
      <DropArea moveNote={moveNote}>
        <div className="relative min-h-[600px] w-full border border-gray-200 rounded-lg bg-gray-50 p-4">
          <div className="absolute top-4 right-4 z-10">
            <button
              onClick={addNote}
              className="bg-blue-500 hover:bg-blue-600 text-white rounded-full p-2 shadow-md"
              title="Add new note"
            >
              <Plus size={20} />
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center items-center h-full">
              <p>Loading sticky notes...</p>
            </div>
          ) : (
            <>
              {notes.map((note) => (
                <StickyNote
                  key={note.id}
                  id={note.id}
                  content={note.content}
                  color={note.color}
                  position={note.position}
                  onMove={moveNote}
                  onDelete={deleteNote}
                  onEdit={editNote}
                />
              ))}

              {notes.length === 0 && (
                <div className="flex flex-col justify-center items-center h-full text-gray-500">
                  <p className="mb-2">No sticky notes yet</p>
                  <p>Click the + button to add your first note</p>
                </div>
              )}
            </>
          )}
        </div>
      </DropArea>
    </DndProvider>
  )
}

function DropArea({
  children,
  moveNote,
}: {
  children: React.ReactNode
  moveNote: (id: string, position: { x: number; y: number }) => void
}) {
  const [, drop] = useDrop(() => ({
    accept: "sticky-note",
    drop: (item: { id: string }, monitor) => {
      const delta = monitor.getDifferenceFromInitialOffset()
      const x = Math.round(item.position.x + (delta?.x || 0))
      const y = Math.round(item.position.y + (delta?.y || 0))
      moveNote(item.id, { x, y })
      return { x, y }
    },
  }))

  return (
    <div ref={drop} className="h-full w-full">
      {children}
    </div>
  )
}

