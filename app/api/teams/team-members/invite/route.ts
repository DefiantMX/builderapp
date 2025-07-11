import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import { randomBytes } from 'crypto';

export async function POST(req: NextRequest) {
  try {
    const { name, email, role, permissions } = await req.json();
    // Generate a unique invite token
    const inviteToken = randomBytes(24).toString('hex');
    const invitedAt = new Date();
    // Create the invited team member
    const member = await prisma.teamMember.create({
      data: {
        name,
        email,
        role,
        status: 'invited',
        inviteToken,
        invitedAt,
        permissions,
      },
    });
    // TODO: Send invite email with link (e.g., /invite/[token])
    return NextResponse.json({ success: true, member, inviteToken });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to invite user', details: error?.message || error }, { status: 500 });
  }
} 