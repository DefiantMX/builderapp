import { NextRequest, NextResponse } from "next/server";
import { head } from "@vercel/blob";

export async function POST(request: NextRequest) {
  const { filename } = await request.json();
  try {
    await head(filename);
    return NextResponse.json({ exists: true });
  } catch (err) {
    return NextResponse.json({ exists: false });
  }
} 