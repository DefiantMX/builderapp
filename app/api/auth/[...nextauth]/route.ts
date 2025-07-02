import NextAuth from "next-auth"
import { authConfig } from "@/lib/auth.config"

// Create the API handler with proper configuration
const handler = NextAuth(authConfig)

export { handler as GET, handler as POST } 