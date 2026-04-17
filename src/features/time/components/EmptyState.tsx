import React from 'react';
import type { LucideIcon } from 'lucide-react';

interface EmptyStateProps {
  icon: LucideIcon;
  title: string;
  description: string;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ icon: Icon, title, description }) => (
  <div className="flex flex-col items-center justify-center h-full text-muted-foreground py-12 animate-in fade-in zoom-in duration-300">
    <Icon className="w-12 h-12 mb-4 opacity-20" />
    <h3 className="text-lg font-medium text-foreground">{title}</h3>
    <p className="text-sm max-w-[250px] text-center mt-1">{description}</p>
  </div>
);
