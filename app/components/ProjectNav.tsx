"use client"

import Link from "next/link"
import { usePathname } from "next/navigation"

interface ProjectNavProps {
  projectId: string
}

export default function ProjectNav({ projectId }: ProjectNavProps) {
  const pathname = usePathname()

  const navigation = [
    { name: "Overview", href: `/projects/${projectId}` },
    { name: "Tasks", href: `/projects/${projectId}/tasks` },
    { name: "Plans", href: `/projects/${projectId}/plans` },
    { name: "Schedule", href: `/projects/${projectId}/schedule` },
    { name: "Documents", href: `/projects/${projectId}/documents` },
    { name: "Bids", href: `/projects/${projectId}/bids` },
    { name: "Takeoff", href: `/projects/${projectId}/takeoff` }
  ]

  return (
    <nav className="flex space-x-8 overflow-x-auto">
      {navigation.map((item) => (
        <Link
          key={item.name}
          href={item.href}
          className={`border-b-2 px-1 py-4 text-sm font-medium transition-colors ${
            pathname === item.href
              ? "border-blue-500 text-blue-600"
              : "border-transparent text-gray-500 hover:border-gray-300 hover:text-gray-700"
          }`}
        >
          {item.name}
        </Link>
      ))}
    </nav>
  )
} 