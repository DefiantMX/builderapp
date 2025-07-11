import { NextRequest, NextResponse } from 'next/server';
import { prisma } from '@/lib/prisma';

export async function POST(req: NextRequest) {
  try {
    // Only allow in development
    if (process.env.NODE_ENV === 'production') {
      return NextResponse.json({ 
        error: 'This endpoint is only available in development' 
      }, { status: 403 });
    }

    // Clear test data
    await prisma.$executeRaw`DELETE FROM "TeamMember" WHERE email LIKE '%test%' OR email LIKE '%example%'`;
    
    return NextResponse.json({ 
      success: true, 
      message: 'Test data cleared successfully' 
    });
  } catch (error: any) {
    console.error('Clear data error:', error);
    return NextResponse.json({ 
      error: 'Failed to clear data', 
      details: error?.message || error 
    }, { status: 500 });
  }
} 