import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  // Clear the user_id cookie
  cookies().delete("user_id")
  return NextResponse.json({ message: "Logged out successfully" })
}

