"use client"

import type React from "react"
import { createContext, useContext, useState, useEffect } from "react"
import { type UserRole, type Permission, hasPermission } from "@/lib/permissions"

type User = {
  id: number
  username: string
  email: string
  role: UserRole
}

type AuthContextType = {
  user: User | null
  login: (user: User) => void
  logout: () => void
  hasPermission: (permission: Permission) => boolean
}

const AuthContext = createContext<AuthContextType | undefined>(undefined)

// Base URL for API requests
const API_BASE_URL = typeof window !== 'undefined' 
  ? window.location.origin 
  : process.env.NEXT_PUBLIC_BASE_URL || "http://localhost:3000";

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null)

  useEffect(() => {
    // Check if user is logged in on initial load
    const checkLoggedIn = async () => {
      try {
        const response = await fetch(`${API_BASE_URL}/api/user`)
        if (response.ok) {
          const userData = await response.json()
          setUser(userData)
        }
      } catch (error) {
        console.error("Error checking login status:", error)
      }
    }
    checkLoggedIn()
  }, [])

  const login = (userData: User) => {
    setUser(userData)
  }

  const logout = async () => {
    try {
      const response = await fetch(`${API_BASE_URL}/api/logout`, { method: "POST" })
      if (response.ok) {
        setUser(null)
      }
    } catch (error) {
      console.error("Error logging out:", error)
    }
  }

  const checkPermission = (permission: Permission) => {
    if (!user) return false
    return hasPermission(user.role, permission)
  }

  return (
    <AuthContext.Provider
      value={{
        user,
        login,
        logout,
        hasPermission: checkPermission,
      }}
    >
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider")
  }
  return context
}

