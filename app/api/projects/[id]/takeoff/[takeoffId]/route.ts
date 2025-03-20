import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; takeoffId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    // Delete the takeoff and all its items (cascade delete will handle items)
    await prisma.takeoff.delete({
      where: {
        id: parseInt(params.takeoffId),
        projectId: parseInt(params.id),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/takeoff/[takeoffId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; takeoffId: string } }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session) {
      return new NextResponse('Unauthorized', { status: 401 });
    }

    // Verify project ownership
    const project = await prisma.project.findUnique({
      where: {
        id: parseInt(params.id),
        userId: session.user.id,
      },
    });

    if (!project) {
      return new NextResponse('Project not found', { status: 404 });
    }

    const json = await request.json();
    const { title, description, category, status } = json;

    const takeoff = await prisma.takeoff.update({
      where: {
        id: parseInt(params.takeoffId),
        projectId: parseInt(params.id),
      },
      data: {
        title,
        description,
        category,
        status,
      },
      include: {
        items: true,
      },
    });

    return NextResponse.json(takeoff);
  } catch (error) {
    console.error('Error in PUT /api/projects/[id]/takeoff/[takeoffId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 