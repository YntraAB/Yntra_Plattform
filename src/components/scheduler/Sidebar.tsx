/**
 * =============================================================================
 * SIDEBAR COMPONENT
 * =============================================================================
 * This component provides the main navigation sidebar for the scheduler.
 * It's inspired by IDE layouts (like VS Code) with collapsible sections,
 * icons, and a clean hierarchical structure.
 * =============================================================================
 */

import React, { useState, useEffect } from 'react';
import {
  Clock,
  FileText,
  ChevronDown,
  ChevronRight,
  Search,
  Bell,
  Mail,
  Users,
  CalendarDays,
  FileCheck
} from 'lucide-react';
import { cn } from '@/lib/utils';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { supabase } from '@/lib/supabase';
import { Badge } from '@/components/ui/badge';

/**
 * Navigation item structure
 */
interface NavItem {
  id: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  children?: NavItem[];
}

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** Currently active section ID */
  activeSection: string;
  /** Callback when a section is selected */
  onSectionChange: (sectionId: string) => void;
}

/**
 * Sidebar Navigation Item Component
 * Renders a single navigation item with optional children
 */
interface SidebarNavItemProps {
  item: NavItem;
  activeSection: string;
  isExpanded: boolean;
  onToggle: () => void;
  onSelect: (id: string) => void;
  depth?: number;
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  activeSection,
  isExpanded,
  onToggle,
  onSelect,
  depth = 0,
}) => {
  const hasChildren = item.children && item.children.length > 0;
  const Icon = item.icon;

  return (
    <div>
      {/* Main item */}
      <div
        onClick={hasChildren ? onToggle : () => onSelect(item.id)}
        className={cn(
          'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer',
          'text-muted-foreground hover:text-foreground hover:bg-muted',
          'transition-all duration-150',
          activeSection === item.id && 'text-foreground bg-muted',
          depth > 0 && 'ml-4'
        )}
      >
        {/* Expand/collapse chevron for items with children */}
        {hasChildren && (
          <span className="w-4 h-4 flex items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="w-4 h-4" />
            ) : (
              <ChevronRight className="w-4 h-4" />
            )}
          </span>
        )}

        {/* Icon */}
        {!hasChildren && <span className="w-4" />}
        <Icon className="w-5 h-5" />

        {/* Label */}
        <span className="flex-1 text-sm">{item.label}</span>

        {/* Badge */}
        {item.badge && (
          <Badge
            variant="default"
            className="h-5 px-1.5 min-w-[20px] justify-center text-[10px] font-bold"
          >
            {item.badge}
          </Badge>
        )}
      </div>

      {/* Child items */}
      {hasChildren && isExpanded && (
        <div className="mt-1 space-y-0.5">
          {item.children!.map((child) => (
            <div
              key={child.id}
              onClick={(e) => { e.stopPropagation(); onSelect(child.id); }}
              className={cn(
                'flex items-center gap-3 px-3 py-2 rounded-md cursor-pointer ml-8',
                'text-muted-foreground hover:text-foreground hover:bg-muted',
                'transition-all duration-150',
                activeSection === child.id && 'text-foreground bg-muted'
              )}
            >
              <child.icon className="w-4 h-4" />
              <span className="text-sm">{child.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

/**
 * Main Sidebar Component
 * Provides navigation and user profile section
 */
export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { modules, workspaceId } = useWorkspace();
  const { user } = useAuth();

  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  // Fetch unread messages
  useEffect(() => {
    async function fetchUnreadCounts() {
      if (!workspaceId || !user) return;
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .is('read_at', null)
        .neq('sender_id', user.id);

      if (count !== null) setUnreadMessages(count);
    }
    fetchUnreadCounts();
  }, [workspaceId, user]);

  // Track expanded sections
  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['time'])
  );

  // Dynamic menu construction based on modules
  const NAVIGATION_ITEMS: NavItem[] = modules.assistance ? [
    {
      id: 'time',
      label: 'Tidshantering',
      icon: Clock,
      children: [
        { id: 'timereports', label: 'Tidsrapporter', icon: FileCheck },
        { id: 'schedule', label: 'Schema', icon: CalendarDays },
      ],
    },
    {
      id: 'work-notes',
      label: 'Anteckningar',
      icon: FileText,
    },
    {
      id: 'inbox',
      label: 'Inkorg',
      icon: Mail,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      id: 'directory',
      label: 'Teams',
      icon: Users,
    },
    {
      id: 'medication',
      label: 'Medicinering',
      icon: Bell,
    }
  ] : [];

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev);
      if (next.has(sectionId)) {
        next.delete(sectionId);
      } else {
        next.add(sectionId);
      }
      return next;
    });
  };

  return (
    <aside className="w-64 h-full bg-sidebar border-r border-border flex flex-col">
      {/* Header / Logo Area */}
      <div className="p-4 border-b border-border">
        <div className="flex items-center gap-3">
          {/* Volt Logo */}
          <svg
            width="28"
            height="28"
            viewBox="0 0 48 48"
            fill="none"
            xmlns="http://www.w3.org/2000/svg"
            className="transform -rotate-12"
          >
            <path
              d="M28 4L12 24H22L18 44L36 20H24L28 4Z"
              fill="#8B5CF6"
              stroke="#8B5CF6"
              strokeWidth="2"
              strokeLinejoin="round"
            />
          </svg>
          <div>
            <h2 className="text-foreground font-semibold text-sm">Volt Scheduler</h2>
            <p className="text-muted-foreground text-xs">EE24</p>
          </div>
        </div>
      </div>

      {/* Search Bar */}
      <div className="px-3 py-3">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <input
            type="text"
            placeholder="Search..."
            className="
              w-full h-9 pl-9 pr-4 rounded-md
              bg-secondary border border-border
              text-foreground text-sm placeholder:text-muted-foreground
              focus:outline-none focus:border-primary
              transition-all duration-200
            "
          />
          <span className="absolute right-3 top-1/2 -translate-y-1/2 text-muted-foreground text-xs">
            Ctrl+K
          </span>
        </div>
      </div>

      {/* Navigation */}
      <nav className="flex-1 px-3 py-2 space-y-1 overflow-y-auto scrollbar-dark">
        {NAVIGATION_ITEMS.map((item) => (
          <SidebarNavItem
            key={item.id}
            item={item}
            activeSection={activeSection}
            isExpanded={expandedSections.has(item.id)}
            onToggle={() => toggleSection(item.id)}
            onSelect={onSectionChange}
          />
        ))}
      </nav>

      {/* Filter Section */}
      <div className="px-3 py-3 border-t border-border">
        {modules.assistance && (
          <>
            <h3 className="text-muted-foreground text-xs font-medium uppercase tracking-wider mb-3 px-3">
              Show
            </h3>
            <div className="space-y-2">
              {[
                { id: 'schedule', label: 'Allmänt Schema', color: 'bg-violet-500' },
                { id: 'bookings', label: 'Bokningar', color: 'bg-blue-500' },
                { id: 'personal', label: 'Personligt', color: 'bg-pink-500' },
                { id: 'assistance', label: 'Assistanstid', color: 'bg-amber-500' },
                { id: 'medical', label: 'Medicineringsavvikelser', color: 'bg-cyan-500' },
              ].map((filter) => (
                <label
                  key={filter.id}
                  className="flex items-center gap-3 px-3 py-1.5 cursor-pointer hover:bg-secondary rounded-md transition-colors"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="w-4 h-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                  />
                  <span className={`w-2.5 h-2.5 rounded-full ${filter.color}`} />
                  <span className="text-muted-foreground text-sm">{filter.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>


    </aside>
  );
};

export default Sidebar;
