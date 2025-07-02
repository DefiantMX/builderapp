import { NextRequest, NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { writeFile } from "fs/promises"
import { join } from "path"

export async function POST(request: NextRequest) {
  try {
    const session = await auth()
    if (!session?.user?.id) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 })
    }

    const formData = await request.formData()
    const file = formData.get("file") as File

    if (!file) {
      return NextResponse.json({ error: "No file provided" }, { status: 400 })
    }

    // Create a unique filename
    const bytes = new TextEncoder().encode(file.name)
    const timestamp = Date.now()
    const uniqueFilename = `${timestamp}-${file.name}`

    // Save the file to the public directory
    const bytes2 = await file.arrayBuffer()
    const buffer = Buffer.from(bytes2)
    const path = join(process.cwd(), "public/uploads", uniqueFilename)
    await writeFile(path, buffer)

    // Return the public URL
    const fileUrl = `/uploads/${uniqueFilename}`

    return NextResponse.json({ fileUrl, fileType: file.type })
  } catch (error) {
    console.error("Upload error:", error)
    return NextResponse.json(
      { error: "Failed to upload file" },
      { status: 500 }
    )
  }
} 