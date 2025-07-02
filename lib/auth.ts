import { getServerSession } from "next-auth/next"
import { authConfig } from "@/lib/auth.config"

// Use getServerSession for NextAuth 4.x
export const auth = async () => getServerSession(authConfig)

export { authConfig } 