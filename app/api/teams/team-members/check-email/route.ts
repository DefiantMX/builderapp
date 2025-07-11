import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    const { email } = await req.json();
    
    if (!email) {
      return NextResponse.json({ 
        error: 'Email is required' 
      }, { status: 400 });
    }

    // Check if email exists as a User
    const existingUser = await prisma.user.findUnique({
      where: { email }
    });

    // Check if email exists as a TeamMember
    const existingMember = await prisma.$queryRaw`
      SELECT * FROM "TeamMember" WHERE email = ${email} LIMIT 1
    `;

    const result = {
      email,
      existsAsUser: !!existingUser,
      existsAsTeamMember: Array.isArray(existingMember) && existingMember.length > 0,
      canInvite: !existingUser && (!Array.isArray(existingMember) || existingMember.length === 0),
      suggestions: []
    };

    if (existingUser) {
      result.suggestions.push('Use "Convert to User" feature instead of inviting');
    }

    if (Array.isArray(existingMember) && existingMember.length > 0) {
      result.suggestions.push('This person is already a team member');
    }

    if (result.canInvite) {
      result.suggestions.push('Email is available for invitation');
    }

    return NextResponse.json(result);
  } catch (error: any) {
    console.error('Check email error:', error);
    return NextResponse.json({ 
      error: 'Failed to check email', 
      details: error?.message || error 
    }, { status: 500 });
  }
} 