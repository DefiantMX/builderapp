"use client"

import { useState } from 'react'
import Link from 'next/link'
import { usePathname } from 'next/navigation'

type Project = {
  id: string
  name: string
  description: string | null
}

export default function ProjectNav({ project }: { project: Project }) {
  const pathname = usePathname()
  
  const navItems = [
    { name: 'Overview', href: `/projects/${project.id}` },
    { name: 'Tasks', href: `/projects/${project.id}/tasks` },
    { name: 'Plans', href: `/projects/${project.id}/plans` },
    { name: 'Schedule', href: `/projects/${project.id}/schedule` },
    { name: 'Daily Log', href: `/projects/${project.id}/daily-log` },
    { name: 'Finance', href: `/projects/${project.id}/finance` },
    { name: 'Documents', href: `/projects/${project.id}/documents` },
    { name: 'Bids', href: `/projects/${project.id}/bids` },
  ]

  return (
    <div>
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-3xl font-bold text-gray-800">{project.name}</h1>
        <Link
          href="/projects"
          className="text-blue-600 hover:text-blue-800 font-medium"
        >
          ← Back to Projects
        </Link>
      </div>
      
      <nav className="border-b border-gray-200">
        <div className="flex -mb-px">
          {navItems.map((item) => {
            const isActive = pathname === item.href || 
              (item.name !== 'Overview' && pathname.startsWith(item.href))
            
            return (
              <Link
                key={item.name}
                href={item.href}
                className={`py-4 px-6 font-medium text-sm ${
                  isActive
                    ? 'border-b-2 border-blue-500 text-blue-600'
                    : 'text-gray-500 hover:text-gray-700 hover:border-b-2 hover:border-gray-300'
                }`}
              >
                {item.name}
              </Link>
            )
          })}
        </div>
      </nav>
    </div>
  )
} 
