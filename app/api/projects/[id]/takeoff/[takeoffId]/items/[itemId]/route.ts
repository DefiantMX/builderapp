import { NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/app/api/auth/[...nextauth]/route';
import { prisma } from '@/lib/prisma';

export async function DELETE(
  request: Request,
  { params }: { params: { id: string; takeoffId: string; itemId: string } }
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

    // Verify takeoff exists and belongs to the project
    const takeoff = await prisma.takeoff.findUnique({
      where: {
        id: parseInt(params.takeoffId),
        projectId: parseInt(params.id),
      },
    });

    if (!takeoff) {
      return new NextResponse('Takeoff not found', { status: 404 });
    }

    // Delete the item
    await prisma.takeoffItem.delete({
      where: {
        id: parseInt(params.itemId),
        takeoffId: parseInt(params.takeoffId),
      },
    });

    return new NextResponse(null, { status: 204 });
  } catch (error) {
    console.error('Error in DELETE /api/projects/[id]/takeoff/[takeoffId]/items/[itemId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
}

export async function PUT(
  request: Request,
  { params }: { params: { id: string; takeoffId: string; itemId: string } }
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

    // Verify takeoff exists and belongs to the project
    const takeoff = await prisma.takeoff.findUnique({
      where: {
        id: parseInt(params.takeoffId),
        projectId: parseInt(params.id),
      },
    });

    if (!takeoff) {
      return new NextResponse('Takeoff not found', { status: 404 });
    }

    const json = await request.json();
    const { description, quantity, unit, unitPrice, notes, location } = json;

    const item = await prisma.takeoffItem.update({
      where: {
        id: parseInt(params.itemId),
        takeoffId: parseInt(params.takeoffId),
      },
      data: {
        description,
        quantity,
        unit,
        unitPrice,
        notes,
        location,
      },
    });

    return NextResponse.json(item);
  } catch (error) {
    console.error('Error in PUT /api/projects/[id]/takeoff/[takeoffId]/items/[itemId]:', error);
    return new NextResponse('Internal Server Error', { status: 500 });
  }
} 