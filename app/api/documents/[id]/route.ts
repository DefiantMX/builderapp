import { NextResponse } from "next/server"
import { getServerSession } from "next-auth/next"
import { authOptions } from "@/app/api/auth/[...nextauth]/route"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import path from "path"

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await getServerSession(authOptions)
    if (!session?.user) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: { id: params.id },
      include: { project: true }
    })

    if (!document) {
      return new NextResponse("Document not found", { status: 404 })
    }

    if (document.project.userId !== session.user.id) {
      return new NextResponse("Unauthorized", { status: 401 })
    }

    // Delete the file from the filesystem
    const filename = document.fileUrl.split("/").pop()
    if (filename) {
      const filepath = path.join(process.cwd(), "public/uploads", filename)
      try {
        await unlink(filepath)
      } catch (error) {
        console.error("Error deleting file:", error)
        // Continue with document deletion even if file deletion fails
      }
    }

    // Delete the document from the database
    await prisma.document.delete({
      where: { id: params.id }
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error("Error deleting document:", error)
    return new NextResponse("Internal Server Error", { status: 500 })
  }
} 