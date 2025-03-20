"use client"

import { useState } from "react"
import { X, Edit, Check } from "lucide-react"
import { useDrag } from "react-dnd"

type StickyNoteProps = {
  id: string
  content: string
  color: string
  position: { x: number; y: number }
  onMove: (id: string, position: { x: number; y: number }) => void
  onDelete: (id: string) => void
  onEdit: (id: string, content: string) => void
}

export default function StickyNote({ id, content, color, position, onMove, onDelete, onEdit }: StickyNoteProps) {
  const [isEditing, setIsEditing] = useState(false)
  const [editedContent, setEditedContent] = useState(content)
  const [{ isDragging }, drag] = useDrag(() => ({
    type: "sticky-note",
    item: { id, position },
    collect: (monitor) => ({
      isDragging: !!monitor.isDragging(),
    }),
    end: (item, monitor) => {
      const dropResult = monitor.getDropResult<{ x: number; y: number }>()
      if (item && dropResult) {
        onMove(id, { x: dropResult.x, y: dropResult.y })
      }
    },
  }))

  const handleSaveEdit = () => {
    onEdit(id, editedContent)
    setIsEditing(false)
  }

  return (
    <div
      ref={drag}
      className={`absolute shadow-md rounded-md p-3 w-64 cursor-move ${isDragging ? "opacity-50" : "opacity-100"}`}
      style={{
        backgroundColor: color,
        left: `${position.x}px`,
        top: `${position.y}px`,
        zIndex: isEditing ? 10 : 1,
      }}
    >
      <div className="flex justify-between items-start mb-2">
        <button onClick={() => setIsEditing(!isEditing)} className="text-gray-700 hover:text-gray-900">
          {isEditing ? <Check size={16} /> : <Edit size={16} />}
        </button>
        <button onClick={() => onDelete(id)} className="text-gray-700 hover:text-red-600">
          <X size={16} />
        </button>
      </div>

      {isEditing ? (
        <textarea
          value={editedContent}
          onChange={(e) => setEditedContent(e.target.value)}
          onBlur={handleSaveEdit}
          autoFocus
          className="w-full h-32 p-1 bg-transparent border border-gray-400 rounded resize-none focus:outline-none focus:border-blue-500"
        />
      ) : (
        <p className="whitespace-pre-wrap break-words text-gray-800">{content}</p>
      )}
    </div>
  )
}

