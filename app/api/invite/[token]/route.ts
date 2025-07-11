import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';
import bcrypt from 'bcryptjs';

export async function POST(req: NextRequest, { params }: { params: { token: string } }) {
  try {
    const { name, password } = await req.json();
    const member = await prisma.teamMember.findUnique({ where: { inviteToken: params.token } });
    if (!member || member.status !== 'invited') {
      return NextResponse.json({ error: 'Invalid or expired invite token.' }, { status: 400 });
    }
    // Optionally, create a User account here as well
    // For now, just update the TeamMember
    await prisma.teamMember.update({
      where: { id: member.id },
      data: {
        name: name || member.name,
        status: 'active',
        inviteToken: null,
        // Optionally store hashed password if you want TeamMember to be a login entity
        // password: await bcrypt.hash(password, 10),
      },
    });
    return NextResponse.json({ success: true });
  } catch (error) {
    return NextResponse.json({ error: 'Failed to accept invite', details: error?.message || error }, { status: 500 });
  }
} 