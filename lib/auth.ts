import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth.config"

// Use getServerSession for NextAuth 4.x
export const auth = async () => {
  try {
    const session = await getServerSession(authConfig)
    console.log('Auth session:', session ? 'Found' : 'Not found')
    return session
  } catch (error) {
    console.error('Auth error:', error)
    return null
  }
}

export { authConfig } 