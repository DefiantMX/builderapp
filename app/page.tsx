import { redirect } from 'next/navigation'
import { auth } from '@/lib/auth'
import { prisma } from '@/lib/prisma'
import Link from 'next/link'
import { Session } from 'next-auth'
import Image from 'next/image'

export const dynamic = 'force-dynamic';

// Define the Project type
type Project = {
  id: string | number;
  name: string;
  description: string | null;
  updatedAt: Date | string;
  userId: string;
}

// Define session type
type SessionWithUserId = Session & {
  user?: {
    id?: string;
    name?: string;
    email?: string;
  }
}

export default async function Home() {
  const session = await auth()
  
  // If logged in, redirect to dashboard
  if (session) {
    redirect('/dashboard')
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center p-8 bg-gradient-to-b from-blue-50 to-white">
      <div className="z-10 max-w-5xl w-full items-center justify-center text-center">
        <h1 className="text-4xl font-bold mb-8 text-gray-800">
          Welcome to Builder App
        </h1>
        <p className="text-xl mb-12 text-gray-600">
          Your construction project management solution
        </p>
        <div className="flex flex-col sm:flex-row gap-4 justify-center">
          <Link
            href="/login"
            className="rounded-md bg-blue-600 px-6 py-3 text-white font-medium hover:bg-blue-700 transition-colors"
          >
            Log In
          </Link>
          <Link
            href="/register"
            className="rounded-md bg-gray-100 px-6 py-3 text-gray-800 font-medium hover:bg-gray-200 transition-colors"
          >
            Sign Up
          </Link>
        </div>
      </div>
    </main>
  )
}

