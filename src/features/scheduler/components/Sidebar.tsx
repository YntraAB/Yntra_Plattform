/**
 * This component provides the main navigation sidebar for the scheduler.
 */

import React, { useState, useEffect } from 'react'
import {
  ChevronDown,
  ChevronRight,
  Search,
} from 'lucide-react'
import { cn } from '@/lib/utils'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import { supabase } from '@/lib/supabase'
import { Badge } from '@/components/ui/badge'
import { BLOCK_REGISTRY } from '@/lib/blocks/registry'
import { ICON_MAP } from '@/lib/blocks/icons'
import type { UserRole } from '@/types'

/**
 * Navigation item structure
 */
interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  badge?: number
  children?: NavItem[]
}

/**
 * Props for the Sidebar component
 */
interface SidebarProps {
  /** Currently active section ID */
  activeSection: string
  /** Callback when a section is selected */
  onSectionChange: (sectionId: string) => void
}

/**
 * Sidebar Navigation Item Component
 * Renders a single navigation item with optional children
 */
interface SidebarNavItemProps {
  item: NavItem
  activeSection: string
  isExpanded: boolean
  onToggle: () => void
  onSelect: (id: string) => void
  depth?: number
}

const SidebarNavItem: React.FC<SidebarNavItemProps> = ({
  item,
  activeSection,
  isExpanded,
  onToggle,
  onSelect,
  depth = 0,
}) => {
  const hasChildren = item.children && item.children.length > 0
  const Icon = item.icon

  return (
    <div>
      {/* Main item */}
      <div
        onClick={hasChildren ? onToggle : () => onSelect(item.id)}
        className={cn(
          'flex cursor-pointer items-center gap-3 rounded-md px-3 py-2',
          'text-muted-foreground hover:bg-muted hover:text-foreground',
          'transition-all duration-150',
          activeSection === item.id && 'bg-muted text-foreground',
          depth > 0 && 'ml-4',
        )}
      >
        {/* Expand/collapse chevron for items with children */}
        {hasChildren && (
          <span className="flex h-4 w-4 items-center justify-center">
            {isExpanded ? (
              <ChevronDown className="h-4 w-4" />
            ) : (
              <ChevronRight className="h-4 w-4" />
            )}
          </span>
        )}

        {/* Icon */}
        {!hasChildren && <span className="w-4" />}
        <Icon className="h-5 w-5" />

        {/* Label */}
        <span className="flex-1 text-sm" data-testid={`sidebar-item-${item.id}`}>
          {item.label}
        </span>

        {/* Badge */}
        {item.badge && (
          <Badge
            variant="default"
            className="h-5 min-w-[20px] justify-center px-1.5 text-[10px] font-bold"
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
              onClick={(e) => {
                e.stopPropagation()
                onSelect(child.id)
              }}
              className={cn(
                'ml-8 flex cursor-pointer items-center gap-3 rounded-md px-3 py-2',
                'text-muted-foreground hover:bg-muted hover:text-foreground',
                'transition-all duration-150',
                activeSection === child.id && 'bg-muted text-foreground',
              )}
            >
              <child.icon className="h-4 w-4" />
              <span className="text-sm">{child.label}</span>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

import { useUnreadNotes } from '@/hooks/useUnreadNotes'
import { useTranslation } from 'react-i18next'
import { TeamSwitcher } from './TeamSwitcher'
import { openGlobalSearch } from '@/components/GlobalSearch'

/**
 * Main Sidebar Component
 * Provides navigation and user profile section
 */
export const Sidebar: React.FC<SidebarProps> = ({ activeSection, onSectionChange }) => {
  const { modules, workspaceId, workspaceName, workspaceLogo, setAdminWorkspace } = useWorkspace()
  const { t } = useTranslation()
  const { user } = useAuth()
  const unreadNotes = useUnreadNotes()

  const isAdmin = user?.role === 'admin' || user?.role === 'platform_admin'

  const [adminWorkspaces, setAdminWorkspaces] = useState<{ id: string; name: string }[]>([])
  useEffect(() => {
    if (user?.role === 'platform_admin' && adminWorkspaces.length === 0) {
      supabase
        .from('workspaces')
        .select('id, name')
        .then(({ data }) => {
          if (data && data.length > 0) setAdminWorkspaces(data)
        })
    }
  }, [user?.role, adminWorkspaces.length])

  const [unreadMessages, setUnreadMessages] = useState<number>(0)

  useEffect(() => {
    async function fetchUnreadCounts() {
      if (!workspaceId || !user) return
      const { count } = await supabase
        .from('messages')
        .select('*', { count: 'exact', head: true })
        .eq('workspace_id', workspaceId)
        .eq('is_read', false)
        .neq('sender_id', user.id)

      if (count !== null) setUnreadMessages(count)
    }
    fetchUnreadCounts()
  }, [workspaceId, user])

  const [expandedSections, setExpandedSections] = useState<Set<string>>(new Set(['time']))

  const NAVIGATION_ITEMS: NavItem[] = Object.values(BLOCK_REGISTRY).flatMap((block) => {
    if (block.id !== 'dashboard' && !(modules as any)[block.id]) return []

    return block.navigation
      .filter((item) => {
        if (!item.allowedRoles) return true
        return item.allowedRoles.includes(user?.role as UserRole)
      })
      .map((item) => {
        let badge: number | undefined = undefined
        if (item.badgeKey === 'unread_messages') badge = unreadMessages > 0 ? unreadMessages : undefined
        if (item.badgeKey === 'unread_notes') badge = unreadNotes.total > 0 ? unreadNotes.total : undefined

        return {
          id: item.id,
          label: t(item.labelKey),
          icon: ICON_MAP[item.icon],
          badge,
          children: item.children
            ?.filter((child) => !child.requiredBlockId || (modules as any)[child.requiredBlockId])
            .map((child) => ({
              id: child.id,
              label: t(child.labelKey),
              icon: ICON_MAP[child.icon],
            })),
        }
      })
  })

  /**
   * Toggle section expansion
   */
  const toggleSection = (sectionId: string) => {
    setExpandedSections((prev) => {
      const next = new Set(prev)
      if (next.has(sectionId)) {
        next.delete(sectionId)
      } else {
        next.add(sectionId)
      }
      return next
    })
  }

  return (
    <aside className="flex h-full w-64 flex-col border-r border-border bg-sidebar">

      {/* Header / Logo Area */}
      <div className="border-b border-border p-4">
        <div className="flex items-center gap-3">
          {/* Workspace Logo */}
          {workspaceLogo ? (
            <div className="group/logo relative">
              <img
                src={workspaceLogo}
                alt={workspaceName}
                className="h-8 w-8 rounded-lg border border-border/50 object-contain shadow-sm transition-transform group-hover/logo:scale-110"
              />
            </div>
          ) : (
            <svg
              width="28"
              height="28"
              viewBox="0 0 48 48"
              fill="none"
              xmlns="http://www.w3.org/2000/svg"
              className="-rotate-12 transform"
            >
              <path
                d="M28 4L12 24H22L18 44L36 20H24L28 4Z"
                fill="#8B5CF6"
                stroke="#8B5CF6"
                strokeWidth="2"
                strokeLinejoin="round"
              />
            </svg>
          )}
          <div className="min-w-0 flex-1">
            <h2 className="truncate text-sm font-bold leading-tight text-foreground">
              {workspaceName || 'Yntra Platform'}
            </h2>
            {user?.role === 'platform_admin' ? (
              <select
                className="pointer-events-auto mt-0.5 w-full max-w-[120px] cursor-pointer appearance-none truncate border-none bg-transparent p-0 text-xs text-muted-foreground underline decoration-dashed underline-offset-4 outline-none"
                value={workspaceId || ''}
                onChange={(e) => setAdminWorkspace(e.target.value)}
              >
                {adminWorkspaces.map((w) => (
                  <option key={w.id} value={w.id}>
                    {w.name}
                  </option>
                ))}
              </select>
            ) : (
              <p className="text-xs text-muted-foreground">EE24</p>
            )}
          </div>
        </div>
      </div>

      {/* Search Trigger */}
      <div className="px-3 py-3">
        <div
          onClick={() => openGlobalSearch()}
          className="flex cursor-pointer items-center gap-2 rounded-md border border-border/50 bg-background/50 px-3 py-1.5 text-sm text-muted-foreground transition-colors hover:bg-muted"
        >
          <Search className="h-4 w-4" />
          <span className="flex-1">{t('common.search')}...</span>
          <kbd className="hidden rounded bg-muted px-1.5 py-0.5 text-[10px] font-medium sm:inline-block">
            ⌘K
          </kbd>
        </div>
      </div>

      {/* Team Switcher (Admins only) */}
      {isAdmin && <TeamSwitcher />}

      {/* Navigation */}
      <nav className="scrollbar-dark flex-1 space-y-1 overflow-y-auto px-3 py-2">
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
      <div className="border-t border-border px-3 py-3">
        {modules.assistance && (
          <>
            <h3 className="mb-3 px-3 text-xs font-medium uppercase tracking-wider text-muted-foreground">
              {t('sidebar.show')}
            </h3>
            <div className="space-y-2">
              {[
                { id: 'schedule', label: t('sidebar.general_schedule'), color: 'bg-violet-500' },
                { id: 'bookings', label: t('sidebar.bookings'), color: 'bg-blue-500' },
                { id: 'personal', label: t('sidebar.personal'), color: 'bg-pink-500' },
                { id: 'assistance', label: t('sidebar.assistance_time'), color: 'bg-amber-500' },
                { id: 'medical', label: t('sidebar.medication_deviations'), color: 'bg-cyan-500' },
              ].map((filter) => (
                <label
                  key={filter.id}
                  className="flex cursor-pointer items-center gap-3 rounded-md px-3 py-1.5 transition-colors hover:bg-secondary"
                >
                  <input
                    type="checkbox"
                    defaultChecked
                    className="h-4 w-4 rounded border-border bg-secondary text-primary focus:ring-primary"
                  />
                  <span className={`h-2.5 w-2.5 rounded-full ${filter.color}`} />
                  <span className="text-sm text-muted-foreground">{filter.label}</span>
                </label>
              ))}
            </div>
          </>
        )}
      </div>
    </aside>
  )
}

export default Sidebar
