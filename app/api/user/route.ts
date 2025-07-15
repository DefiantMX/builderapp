import { NextResponse } from "next/server"
import { getServerSession } from "next-auth"
import { authConfig } from "@/lib/auth.config"

export async function GET() {
  try {
    console.log('API /user route called');
    
    const session = await getServerSession(authConfig)
    console.log('Session:', session);
    
    if (!session?.user?.email) {
      console.log('No session or user email found');
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    console.log('User email found:', session.user.email);
    
    // For now, just return the session user data
    return NextResponse.json({
      id: session.user.id,
      email: session.user.email,
      name: session.user.name
    })
  } catch (error) {
    console.error('Error in /api/user:', error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}

