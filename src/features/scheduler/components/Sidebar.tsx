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

import { useUnreadNotes } from '@/hooks/useUnreadNotes';
import { useTranslation } from 'react-i18next';
import { TeamSwitcher } from './TeamSwitcher';
import { GlobalSearch } from '@/components/GlobalSearch';

/**
 * Main Sidebar Component
 * Provides navigation and user profile section
 */
export const Sidebar: React.FC<SidebarProps> = ({
  activeSection,
  onSectionChange,
}) => {
  const { modules, workspaceId, setAdminWorkspace } = useWorkspace();
  const { t } = useTranslation();
  const { user } = useAuth();
  const unreadNotes = useUnreadNotes();

  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin';

  const [adminWorkspaces, setAdminWorkspaces] = useState<{ id: string, name: string }[]>([]);
  useEffect(() => {
    if (user?.role === 'platform_admin' && adminWorkspaces.length === 0) {
      supabase.from('workspaces').select('id, name').then(({ data }) => {
        if (data && data.length > 0) setAdminWorkspaces(data);
      });
    }
  }, [user?.role, adminWorkspaces.length]);

  const [unreadMessages, setUnreadMessages] = useState<number>(0);

  useEffect(() => {
    async function fetchUnreadCounts() {
      if (!workspaceId || !user) return;
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_read', false)
        .neq('sender_id', user.id);

      if (count !== null) setUnreadMessages(count);
    }
    fetchUnreadCounts();
  }, [workspaceId, user]);

  const [expandedSections, setExpandedSections] = useState<Set<string>>(
    new Set(['time'])
  );

  const [isSearchOpen, setIsSearchOpen] = useState(false);

  // Keyboard shortcut for search (Ctrl+K)
  useEffect(() => {
    const handleKeyDown = (e: KeyboardEvent) => {
      if ((e.ctrlKey || e.metaKey) && e.key === 'k') {
        e.preventDefault();
        setIsSearchOpen(true);
      }
    };

    window.addEventListener('keydown', handleKeyDown);
    return () => window.removeEventListener('keydown', handleKeyDown);
  }, []);

  const NAVIGATION_ITEMS: NavItem[] = modules.assistance ? [
    {
      id: 'time',
      label: t('sidebar.time_management'),
      icon: Clock,
      children: [
        { id: 'timereports', label: t('sidebar.time_reports'), icon: FileCheck },
        { id: 'schedule', label: t('sidebar.schedule'), icon: CalendarDays },
      ],
    },
    {
      id: 'work-notes',
      label: t('sidebar.work_notes'),
      icon: FileText,
      badge: unreadNotes.total > 0 ? unreadNotes.total : undefined,
    },
    {
      id: 'inbox',
      label: t('sidebar.inbox'),
      icon: Mail,
      badge: unreadMessages > 0 ? unreadMessages : undefined,
    },
    {
      id: 'directory',
      label: t('sidebar.teams'),
      icon: Users,
    },
    {
      id: 'medication',
      label: t('sidebar.medication'),
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
      <GlobalSearch open={isSearchOpen} onOpenChange={setIsSearchOpen} />

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
            {user?.role === 'platform_admin' ? (
              <select
                className="mt-0.5 bg-transparent border-none text-xs text-muted-foreground outline-none cursor-pointer p-0 appearance-none underline decoration-dashed underline-offset-4 pointer-events-auto w-full max-w-[120px] truncate"
                value={workspaceId || ''}
                onChange={(e) => setAdminWorkspace(e.target.value)}
              >
                {adminWorkspaces.map(w => <option key={w.id} value={w.id}>{w.name}</option>)}
              </select>
            ) : (
              <p className="text-muted-foreground text-xs">EE24</p>
            )}
          </div>
        </div>
      </div>

      {/* Search Trigger */}
      <div className="px-3 py-3">
        <button
          onClick={() => setIsSearchOpen(true)}
          className="
            flex items-center w-full h-9 px-3 gap-2 rounded-md
            bg-secondary border border-border
            text-muted-foreground transition-all duration-200
            hover:bg-secondary/80 hover:border-primary/30
          "
        >
          <Search className="w-4 h-4" />
          <span className="text-sm font-medium">{t('common.search')}</span>
          <span className="ml-auto text-[10px] bg-background/50 border border-border px-1.5 py-0.5 rounded text-muted-foreground opacity-60">
            Ctrl+K
          </span>
        </button>
      </div>

      {/* Team Switcher (Admins only) */}
      {isAdmin && <TeamSwitcher />}

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
              {t('sidebar.show')}
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
