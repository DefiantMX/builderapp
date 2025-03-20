import { NextResponse } from "next/server"
import { writeFile } from "fs/promises"
import path from "path"

// This is a mock database. In a real application, you'd use a proper database.
const dailyLogs: any[] = []

export async function GET(request: Request, { params }: { params: { id: string } }) {
  const projectLogs = dailyLogs.filter((log) => log.projectId === params.id)
  return NextResponse.json(projectLogs)
}

export async function POST(request: Request, { params }: { params: { id: string } }) {
  const formData = await request.formData()
  const content = formData.get("content") as string
  const author = formData.get("author") as string
  const currentConditions = formData.get("currentConditions") as string
  const incidentReport = formData.get("incidentReport") as string
  const image = formData.get("image") as File | null

  if (!content || !author || !currentConditions) {
    return NextResponse.json({ message: "Content, author, and current conditions are required" }, { status: 400 })
  }

  let imageUrl = null
  if (image) {
    const bytes = await image.arrayBuffer()
    const buffer = Buffer.from(bytes)
    const fileName = `${Date.now()}_${image.name}`
    const filePath = path.join(process.cwd(), "public", "uploads", fileName)
    await writeFile(filePath, buffer)
    imageUrl = `/uploads/${fileName}`
  }

  const newEntry = {
    id: dailyLogs.length + 1,
    projectId: params.id,
    date: new Date().toISOString(),
    content,
    author,
    currentConditions,
    incidentReport,
    imageUrl,
  }

  dailyLogs.push(newEntry)

  return NextResponse.json(newEntry, { status: 201 })
}

