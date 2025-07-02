"use client"

import { useState } from "react"
import { redirect } from "next/navigation"
import Link from "next/link"

export default async function AdminPage() {
  const session = await auth()
  
  if (!session) {
    redirect("/login")
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">Admin Dashboard</h1>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        <div>
          <h2 className="text-2xl font-semibold mb-4">Quick Actions</h2>
          {/* Add quick action buttons */}
        </div>
        
        <div>
          <h2 className="text-2xl font-semibold mb-4">Recent Activity</h2>
          {/* Add recent activity list */}
        </div>
      </div>
    </div>
  )
}

