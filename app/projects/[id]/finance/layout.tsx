'use client'

import Link from 'next/link'
import { usePathname } from 'next/navigation'

export default function FinanceLayout({
  children,
  params
}: {
  children: React.ReactNode
  params: { id: string }
}) {
  const pathname = usePathname()

  const tabs = [
    {
      name: 'Overview',
      href: `/projects/${params.id}/finance`,
      current: pathname === `/projects/${params.id}/finance`
    },
    {
      name: 'Budget',
      href: `/projects/${params.id}/finance/budget`,
      current: pathname === `/projects/${params.id}/finance/budget`
    },
    {
      name: 'Invoices',
      href: `/projects/${params.id}/finance/invoices`,
      current: pathname === `/projects/${params.id}/finance/invoices`
    },
    {
      name: 'Monthly Draws',
      href: `/projects/${params.id}/finance/draws`,
      current: pathname === `/projects/${params.id}/finance/draws`
    }
  ]

  return (
    <div className="space-y-6">
      <div className="border-b border-gray-200">
        <nav className="-mb-px flex space-x-8" aria-label="Tabs">
          {tabs.map((tab) => (
            <Link
              key={tab.name}
              href={tab.href}
              className={`
                whitespace-nowrap py-4 px-1 border-b-2 font-medium text-sm
                ${tab.current
                  ? 'border-blue-500 text-blue-600'
                  : 'border-transparent text-gray-500 hover:text-gray-700 hover:border-gray-300'
                }
              `}
              aria-current={tab.current ? 'page' : undefined}
            >
              {tab.name}
            </Link>
          ))}
        </nav>
      </div>
      {children}
    </div>
  )
} 