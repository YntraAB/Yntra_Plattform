import { useState, useEffect, useCallback } from 'react'
import { toast } from 'sonner'
import { supabase } from '@/lib/supabase'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { useAuth } from '@/hooks/useAuth'
import type { TimeReportUI, DevRole, NavLevel } from '../types'
import type { User } from '@/types'

interface WorkspaceRow {
  id: string
  name: string
}

interface TeamRow {
  id: string
  name: string
  workspace_id: string
}

export const useTimeManager = () => {
  const { workspaceId } = useWorkspace()
  const { user } = useAuth()

  const activeRole: DevRole = (user?.role as DevRole) || 'admin'
  const [shifts, setShifts] = useState<TimeReportUI[]>([])
  const [dbTeams, setDbTeams] = useState<TeamRow[]>([])
  const [dbWorkspaces, setDbWorkspaces] = useState<WorkspaceRow[]>([])
  const [dbUsers, setDbUsers] = useState<User[]>([])
  const [loading, setLoading] = useState(true)

  const [currentLevel, setCurrentLevel] = useState<NavLevel>('team_overview')
  const [selectedContext, setSelectedContext] = useState<{
    type: 'employee' | 'team' | null
    id: string | null
  }>({ type: null, id: null })

  const [filterType, setFilterType] = useState('all')
  const [searchQuery, setSearchQuery] = useState('')
  const [currentPage, setCurrentPage] = useState(1)
  const [selectedShifts, setSelectedShifts] = useState<string[]>([])
  const [listMode, setListMode] = useState<'current' | 'history'>('current')
  const [isDeleteAlertOpen, setIsDeleteAlertOpen] = useState(false)
  const [hasApprovePermission, setHasApprovePermission] = useState(false)

  const fetchData = useCallback(async () => {
    if (!workspaceId && activeRole !== 'platform_admin') return

    setLoading(true)
    try {
      let reportsData: unknown[] = []
      let teamsData: TeamRow[] = []
      let workspacesData: WorkspaceRow[] = []
      let usersData: User[] = []

      const promises = []

      if (activeRole === 'platform_admin') {
        promises.push(
          supabase
            .from('workspaces')
            .select('*')
            .then(({ data }) => (workspacesData = data || [])),
        )
        promises.push(
          supabase
            .from('teams')
            .select('*')
            .then(({ data }) => (teamsData = data || [])),
        )
        promises.push(
          supabase
            .from('users')
            .select('*')
            .then(({ data }) => (usersData = data || [])),
        )
      } else {
        promises.push(
          supabase
            .from('teams')
            .select('*')
            .eq('workspace_id', workspaceId)
            .then(({ data }) => (teamsData = data || [])),
        )
        promises.push(
          supabase
            .from('users')
            .select('*')
            .eq('workspace_id', workspaceId)
            .then(({ data }) => (usersData = data || [])),
        )
      }

      await Promise.all(promises)
      setDbWorkspaces(workspacesData)
      setDbTeams(teamsData)
      setDbUsers(usersData)

      let query = supabase.from('time_reports').select('*, user:users(*)')

      if (activeRole === 'admin') {
        query = query.eq('workspace_id', workspaceId)
      } else if (activeRole === 'assistant') {
        query = query.eq('user_id', user?.id)
      }

      const { data: r, error } = await query
      if (error) throw error
      reportsData = r || []

      const mapped: TimeReportUI[] = (reportsData as Array<{
        id: string
        user_id: string
        workspace_id: string
        team_id: string
        date: string
        start_time: string
        end_time: string
        hours: number
        status: TimeReportUI['status']
        note: string | null
        user: User | User[]
      }>).map((dbShift) => {
        const team = teamsData.find((t) => t.id === dbShift.team_id)
        const teamName = team?.name || 'Odelat team'
        const uData = Array.isArray(dbShift.user) ? dbShift.user[0] : dbShift.user
        const employeeName = uData ? uData.full_name || uData.email || 'Okänd Agent' : 'Okänd Agent'

        return {
          id: dbShift.id,
          employeeId: dbShift.user_id,
          employee: employeeName,
          role: uData?.role === 'admin' ? 'Administratör' : 'Assistent',
          teamId: dbShift.team_id,
          team: teamName,
          workspaceId: dbShift.workspace_id,
          date: new Date(dbShift.date).toLocaleDateString('sv-SE'),
          start: dbShift.start_time || '08:00',
          end: dbShift.end_time || '17:00',
          duration: dbShift.hours || 0,
          break: 0,
          status: dbShift.status,
          location: '',
          note: dbShift.note || '',
        }
      })
      setShifts(mapped)
    } catch (error: unknown) {
      console.error('Error fetching data:', error)
      const message = error instanceof Error ? error.message : 'Okänt fel'
      toast.error('Kunde inte hämta data: ' + message)
    } finally {
      setLoading(false)
    }
  }, [workspaceId, activeRole, user?.id])

  useEffect(() => {
    fetchData().catch(console.error)

    const channel = supabase
      .channel('timemanager-reports')
      .on('postgres_changes', { event: '*', schema: 'public', table: 'time_reports' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'teams' }, () => {
        fetchData()
      })
      .on('postgres_changes', { event: '*', schema: 'public', table: 'workspaces' }, () => {
        fetchData()
      })
      .subscribe()

    return () => {
      supabase.removeChannel(channel)
    }
  }, [fetchData])

  useEffect(() => {
    if (activeRole === 'platform_admin') {
      setCurrentLevel('platform_overview')
    } else {
      setCurrentLevel('team_overview')
    }
    setSelectedContext({ type: null, id: null })
  }, [activeRole])

  useEffect(() => {
    async function checkPerms() {
      if (!user) return
      if (activeRole === 'admin' || activeRole === 'platform_admin') {
        setHasApprovePermission(true)
        return
      }

      const { data: memberships } = await supabase
        .from('team_members')
        .select('role_id')
        .eq('user_id', user.id)
      if (memberships) {
        const roleIds = memberships.map((m) => m.role_id).filter(Boolean)
        if (roleIds.length > 0) {
          const { data: roles } = await supabase
            .from('workspace_roles')
            .select('permissions')
            .in('id', roleIds)
          if (
            roles?.some((r) => (r.permissions as Record<string, boolean>)?.can_approve_time_reports)
          ) {
            setHasApprovePermission(true)
            return
          }
        }
      }
      setHasApprovePermission(false)
    }
    checkPerms()
  }, [activeRole, user])

  const openEmployeeShifts = (empId: string) => {
    setSelectedContext({ type: 'employee', id: empId })
    setCurrentLevel('shift_list')
    setFilterType('all')
    setSearchQuery('')
    setListMode('current')
  }

  const openTeamShifts = (teamName: string) => {
    setSelectedContext({ type: 'team', id: teamName })
    setCurrentLevel('shift_list')
    setFilterType('all')
    setSearchQuery('')
    setListMode('current')
  }

  const handleApprove = async () => {
    if (selectedShifts.length === 0) return

    const { error } = await supabase
      .from('time_reports')
      .update({ status: 'approved' })
      .in('id', selectedShifts)
    if (error) {
      toast.error('Kunde inte godkänna rapporter: ' + error.message)
      return
    }

    toast.success(`${selectedShifts.length} rapporter har godkänts`)
    setSelectedShifts([])
    fetchData()
  }

  const handleDelete = async () => {
    if (selectedShifts.length === 0) return

    const { error } = await supabase.from('time_reports').delete().in('id', selectedShifts)
    if (error) {
      toast.error('Kunde inte radera rapporter: ' + error.message)
      return
    }

    toast.success(`${selectedShifts.length} rapporter har raderats`)
    setSelectedShifts([])
    setIsDeleteAlertOpen(false)
    fetchData()
  }

  return {
    workspaceId,
    activeRole,
    shifts,
    dbTeams,
    dbWorkspaces,
    dbUsers,
    loading,
    currentLevel,
    selectedContext,
    filterType,
    searchQuery,
    currentPage,
    selectedShifts,
    listMode,
    isDeleteAlertOpen,
    hasApprovePermission,
    setListMode,
    setFilterType,
    setSearchQuery,
    setCurrentPage,
    setSelectedShifts,
    setIsDeleteAlertOpen,
    openEmployeeShifts,
    openTeamShifts,
    handleApprove,
    handleDelete,
  }
}
