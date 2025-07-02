import { NextResponse } from "next/server"
import { auth } from "@/lib/auth"
import { prisma } from "@/lib/prisma"
import { unlink } from "fs/promises"
import path from "path"

export async function GET(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
      },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // Check if user owns the project
    if (document.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    return NextResponse.json(document)
  } catch (error) {
    console.error('Error in GET /api/documents/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
}

export async function DELETE(
  request: Request,
  { params }: { params: { id: string } }
) {
  try {
    const session = await auth()
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    const document = await prisma.document.findUnique({
      where: {
        id: parseInt(params.id),
      },
      include: {
        project: true,
      },
    })

    if (!document) {
      return new NextResponse('Document not found', { status: 404 })
    }

    // Check if user owns the project
    if (document.project.userId !== session.user.id) {
      return new NextResponse('Unauthorized', { status: 401 })
    }

    // Delete the file from storage
    const filePath = path.join(process.cwd(), 'public', document.fileUrl)
    await unlink(filePath)

    // Delete the document from the database
    await prisma.document.delete({
      where: {
        id: parseInt(params.id),
      },
    })

    return new NextResponse(null, { status: 204 })
  } catch (error) {
    console.error('Error in DELETE /api/documents/[id]:', error)
    return new NextResponse('Internal Server Error', { status: 500 })
  }
} 