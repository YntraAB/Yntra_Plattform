import { lazy, type LazyExoticComponent } from 'react'
import {
  MessageSquare,
  Calendar,
  FileText,
  Clock,
  Heart,
  Users,
  LayoutGrid,
  Settings,
  HelpCircle,
  AlertTriangle
} from 'lucide-react'
import type { UserRole } from '@/types'

export type { UserRole }

export type IconName =
  | 'MessageSquare'
  | 'Calendar'
  | 'FileText'
  | 'Clock'
  | 'Heart'
  | 'Users'
  | 'LayoutGrid'
  | 'Settings'
  | 'HelpCircle'
  | 'AlertTriangle'

export const ICON_MAP: Record<IconName, any> = {
  MessageSquare,
  Calendar,
  FileText,
  Clock,
  Heart,
  Users,
  LayoutGrid,
  Settings,
  HelpCircle,
  AlertTriangle
}

export interface BlockRoute {
  path: string
  component: LazyExoticComponent<any>
  allowedRoles: UserRole[]
  breadcrumbKey: string
  isIndex?: boolean
}

export interface BlockNavItem {
  id: string
  labelKey: string
  path: string
  icon: IconName
  allowedRoles?: UserRole[]
  section: 'main' | 'tools' | 'admin'
  children?: (Omit<BlockNavItem, 'section'> & { requiredBlockId?: string })[]
  badgeKey?: 'unread_messages' | 'unread_notes'
}

export interface BlockDefinition {
  id: string
  dependencies?: string[]
  routes: BlockRoute[]
  navigation: BlockNavItem[]
}

const CalendarPage = lazy(() =>
  import('@/features/scheduler/components/CalendarPage').then((module) => ({
    default: module.CalendarPage,
  }))
)
const MessagesPage = lazy(() =>
  import('@/features/messages/components/MessagesPage').then((module) => ({
    default: module.MessagesPage,
  }))
)
const DirectoryPage = lazy(() =>
  import('@/features/directory/components/DirectoryPage').then((module) => ({
    default: module.DirectoryPage,
  }))
)
const NotesPage = lazy(() =>
  import('@/features/notes/components/NotesPage').then((module) => ({
    default: module.NotesPage,
  }))
)
const ClientOverviewPage = lazy(() =>
  import('@/features/assistance/components/ClientOverviewPage').then((module) => ({
    default: module.ClientOverviewPage,
  }))
)
const TimeManagerPage = lazy(() =>
  import('@/features/time/components/TimeManagerPage').then((module) => ({
    default: module.TimeManagerPage,
  }))
)
const ReportingPage = lazy(() =>
  import('@/features/reporting/components/ReportingPage').then((module) => ({
    default: module.ReportingPage,
  }))
)

export const BLOCK_REGISTRY: Record<string, BlockDefinition> = {
  messaging: {
    id: 'messaging',
    routes: [
      {
        path: 'inbox',
        component: MessagesPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant', 'client'],
        breadcrumbKey: 'sidebar.sections.inbox'
      }
    ],
    navigation: [
      {
        id: 'inbox',
        labelKey: 'sidebar.sections.inbox',
        path: '/inbox',
        icon: 'MessageSquare',
        section: 'main',
        badgeKey: 'unread_messages'
      }
    ]
  },
  scheduling: {
    id: 'scheduling',
    routes: [
      {
        path: 'schedule',
        component: CalendarPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant'],
        breadcrumbKey: 'sidebar.sections.schedule'
      }
    ],
    navigation: [
      {
        id: 'time_group',
        labelKey: 'sidebar.time_management',
        path: '/schedule',
        icon: 'Clock',
        section: 'main',
        children: [
          {
            id: 'schedule',
            labelKey: 'sidebar.sections.schedule',
            path: '/schedule',
            icon: 'Calendar'
          },
          {
            id: 'timereports',
            labelKey: 'sidebar.sections.timereports',
            path: '/timereports',
            icon: 'FileText',
            requiredBlockId: 'time'
          }
        ]
      }
    ]
  },
  notes: {
    id: 'notes',
    routes: [
      {
        path: 'notes',
        component: NotesPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant'],
        breadcrumbKey: 'sidebar.sections.notes'
      }
    ],
    navigation: [
      {
        id: 'notes',
        labelKey: 'sidebar.sections.notes',
        path: '/notes',
        icon: 'FileText',
        section: 'main',
        badgeKey: 'unread_notes'
      }
    ]
  },
  directory: {
    id: 'directory',
    routes: [
      {
        path: 'directory',
        component: DirectoryPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant', 'client'],
        breadcrumbKey: 'sidebar.sections.directory'
      }
    ],
    navigation: [
      {
        id: 'directory',
        labelKey: 'sidebar.sections.directory',
        path: '/directory',
        icon: 'Users',
        section: 'main'
      }
    ]
  },
  assistance: {
    id: 'assistance',
    routes: [
      {
        path: 'medication',
        component: ClientOverviewPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant'],
        breadcrumbKey: 'sidebar.sections.assistance'
      }
    ],
    navigation: [
      {
        id: 'medication',
        labelKey: 'sidebar.sections.assistance',
        path: '/medication',
        icon: 'Heart',
        section: 'main'
      }
    ]
  },
  time: {
    id: 'time',
    routes: [
      {
        path: 'time',
        component: TimeManagerPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant'],
        breadcrumbKey: 'sidebar.sections.time'
      },
      {
        path: 'timereports',
        component: TimeManagerPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant'],
        breadcrumbKey: 'sidebar.sections.timereports'
      }
    ],
    navigation: []
  },
  reporting: {
    id: 'reporting',
    routes: [
      {
        path: 'reporting',
        component: ReportingPage,
        allowedRoles: ['platform_admin', 'admin', 'user', 'assistant'],
        breadcrumbKey: 'sidebar.sections.reporting'
      }
    ],
    navigation: [
      {
        id: 'reporting',
        labelKey: 'sidebar.sections.reporting',
        path: '/reporting',
        icon: 'AlertTriangle',
        section: 'main'
      }
    ]
  }
}
