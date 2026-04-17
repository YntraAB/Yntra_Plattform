import React from 'react';
import { Badge } from '@/components/ui/badge';
import { CheckCircle2 } from 'lucide-react';

interface StatusBadgeProps {
  status: string;
}

export const StatusBadge: React.FC<StatusBadgeProps> = ({ status }) => {
  switch (status) {
    case 'pending_attest':
      return <Badge variant="outline" className="bg-amber-500/10 text-amber-400 border-amber-500/20 font-medium">Väntar attest</Badge>;
    case 'approved':
      return <Badge variant="outline" className="bg-emerald-500/10 text-emerald-400 border-emerald-500/20 font-medium flex items-center gap-1"><CheckCircle2 className="w-3 h-3" /> Godkänd</Badge>;
    case 'not_submitted':
      return <Badge variant="secondary" className="text-muted-foreground font-medium">Ej inlämnad</Badge>;
    default:
      return <Badge variant="outline">{status}</Badge>;
  }
};
