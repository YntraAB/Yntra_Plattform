import React from 'react'
import { Badge } from '@/components/ui/badge'
import { CheckCircle2 } from 'lucide-react'

interface StatusBadgeProps {
  status: string
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pending_attest':
      return (
        <Badge
          variant="outline"
          className="border-amber-500/20 bg-amber-500/10 font-medium text-amber-400"
        >
          Väntar attest
        </Badge>
      )
    case 'approved':
      return (
        <Badge
          variant="outline"
          className="flex items-center gap-1 border-emerald-500/20 bg-emerald-500/10 font-medium text-emerald-400"
        >
          <CheckCircle2 className="h-3 w-3" /> Godkänd
        </Badge>
      )
    case 'not_submitted':
      return (
        <Badge variant="secondary" className="font-medium text-muted-foreground">
          Ej inlämnad
        </Badge>
      )
    default:
      return <Badge variant="outline">{status}</Badge>
  }
}
