'use client'

import ClientFinancePage from '@/app/components/ClientFinancePage'
import { useParams } from 'next/navigation'

export default function ChangeOrdersPage() {
  const params = useParams()
  const projectId = params.id as string

  return <ClientFinancePage projectId={projectId} activeTab="change-orders" />
} 