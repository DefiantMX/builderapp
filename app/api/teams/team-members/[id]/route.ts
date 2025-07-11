import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function PUT(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    const data = await req.json();
    const member = await prisma.teamMember.update({
      where: { id: params.id },
      data: {
        name: data.name,
        email: data.email,
        role: data.role,
      },
    });
    return NextResponse.json(member);
  } catch (error) {
    return NextResponse.json({ error: 'Failed to update team member' }, { status: 500 });
  }
}

export async function DELETE(
  req: NextRequest,
  { params }: { params: { id: string } }
) {
  try {
    await prisma.teamMember.delete({ where: { id: params.id } });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to delete team member' }, { status: 500 });
  }
}

export async function POST(req: NextRequest, { params }: { params: { id: string } }) {
  try {
    const member = await prisma.teamMember.findUnique({ where: { id: params.id } });
    if (!member) {
      return NextResponse.json({ error: 'Team member not found' }, { status: 404 });
    }
    if (member.userId || member.isConverted) {
      return NextResponse.json({ error: 'Already converted to user' }, { status: 400 });
    }
    // Check if a user with this email already exists
    let user = await prisma.user.findUnique({ where: { email: member.email } });
    if (!user) {
      user = await prisma.user.create({
        data: {
          name: member.name,
          email: member.email,
        },
      });
    }
    // Generate invite token
    const { randomBytes } = await import('crypto');
    const inviteToken = randomBytes(24).toString('hex');
    const invitedAt = new Date();
    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        userId: user.id,
        isConverted: true,
        inviteToken,
        invitedAt,
        status: 'invited',
      },
    });
    // Optionally, send invite email here
    const inviteLink = `${process.env.NEXT_PUBLIC_BASE_URL || 'http://localhost:3000'}/invite/${inviteToken}`;
    return NextResponse.json({ success: true, inviteLink });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to convert to user', details: error?.message || error }, { status: 500 });
  }
} 