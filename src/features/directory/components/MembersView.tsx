import React from 'react'
import {
  User,
  ChevronRight,
  Trash2,
  Plus,
  UserPlus,
  MapPin,
  Calendar,
  StickyNote,
  Pill,
  HeartPulse,
} from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { useNavigate } from 'react-router-dom'
import { supabase } from '@/lib/supabase'
import type { MemberItem, WorkspaceRole, ClientItem } from '../hooks/useDirectoryData'

interface MembersViewProps {
  members: MemberItem[]
  userRole: string
  selectedTeam: string | null
  dbWorkspaceRoles: WorkspaceRole[]
  onSelectMember: (member: MemberItem) => void
  onOpenInviteManager: () => void
  onOpenClientManager: () => void
  onEditClient: (client: ClientItem) => void
  client?: ClientItem | null
}

export const MembersView: React.FC<MembersViewProps> = ({
  members,
  userRole,
  selectedTeam,
  dbWorkspaceRoles,
  onSelectMember,
  onOpenInviteManager,
  onOpenClientManager,
  onEditClient,
  client,
}) => {
  const { t } = useTranslation()
  const navigate = useNavigate()

  const getRoleName = React.useCallback((role: string) => {
    if (role === 'platform_admin') return t('directory.roles.platform_admin')
    if (role === 'admin') return t('directory.roles.admin')
    if (role === 'assistant') return t('directory.roles.assistant')
    if (role === 'user') return t('directory.roles.user')
    return role ? role.charAt(0).toUpperCase() + role.slice(1) : t('directory.roles.unknown')
  }, [t])

  const groupedMembers = React.useMemo(() => {
    return members.reduce(
      (acc, member) => {
        const roleGroup = getRoleName(member.role)
        if (!acc[roleGroup]) acc[roleGroup] = []
        acc[roleGroup].push(member)
        return acc
      },
      {} as Record<string, MemberItem[]>,
    )
  }, [members, getRoleName])

  const sortedRoles = React.useMemo(() => {
    return Object.keys(groupedMembers).sort((a, b) => {
      if (a === t('directory.roles.platform_admin')) return -1
      if (a === t('directory.roles.admin') && b !== t('directory.roles.platform_admin')) return -1
      return a.localeCompare(b)
    })
  }, [groupedMembers, t])

  const calculateAge = React.useCallback((personalNumber: string) => {
    if (!personalNumber) return null
    const cleanPn = personalNumber.replace(/\D/g, '')
    if (cleanPn.length < 4) return null
    if (cleanPn.length > 4 && cleanPn.length < 10) return null

    const yearStr = cleanPn.length === 12 ? cleanPn.substring(0, 4) : cleanPn.substring(0, 2)
    const monthStr = cleanPn.length === 12 ? cleanPn.substring(4, 6) : cleanPn.substring(2, 4)
    const dayStr = cleanPn.length === 12 ? cleanPn.substring(6, 8) : cleanPn.substring(4, 6)

    let year = parseInt(yearStr)
    if (cleanPn.length === 10) {
      const now = new Date().getFullYear() % 100
      year += year <= now ? 2000 : 1900
    } else if (cleanPn.length === 4) {
      // Just a year provided
      year = parseInt(cleanPn)
    }

    const birthDate =
      cleanPn.length === 4
        ? new Date(year, 0, 1)
        : new Date(year, parseInt(monthStr) - 1, parseInt(dayStr))
    const today = new Date()
    let age = today.getFullYear() - birthDate.getFullYear()
    if (cleanPn.length !== 4) {
      const m = today.getMonth() - birthDate.getMonth()
      if (m < 0 || (m === 0 && today.getDate() < birthDate.getDate())) {
        age--
      }
    }
    return age
  }, [])

  return (
    <div className="relative flex h-full flex-1 flex-col bg-background">
      <div className="scrollbar-dark w-full flex-1 overflow-y-auto">
        <div className="sticky top-0 z-10 flex h-16 items-center justify-between border-b border-border bg-sidebar px-8">
          <h2 className="flex items-center gap-2 text-base font-medium text-foreground">
            <User className="h-4 w-4 text-primary" />{' '}
            {selectedTeam === 'all_members'
              ? t('directory.members.org_title')
              : t('directory.members.team_title')}
          </h2>
          <div className="flex items-center gap-2">
            {selectedTeam !== 'all_members' &&
              (userRole === 'platform_admin' || userRole === 'admin') && (
                <>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border border-border bg-secondary text-xs text-foreground hover:bg-muted"
                    onClick={onOpenClientManager}
                  >
                    <UserPlus className="mr-1.5 h-3.5 w-3.5 text-primary" />{' '}
                    {t('directory.teams.create_client_button')}
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    className="h-8 border-border text-xs text-foreground hover:bg-muted hover:text-foreground"
                    onClick={onOpenInviteManager}
                  >
                    <Plus className="mr-1.5 h-3.5 w-3.5" /> {t('directory.members.invite_button')}
                  </Button>
                </>
              )}
          </div>
        </div>

        {/* Client Overview Section */}
        {client && selectedTeam !== 'all_members' && userRole !== 'client' && (
          <div className="border-b border-border bg-muted/20 px-8 py-8">
            <div className="flex flex-col justify-between gap-6 md:flex-row md:items-center">
              <div className="flex items-center gap-6">
                <Avatar className="h-20 w-20 border-2 border-primary/20 shadow-xl ring-4 ring-background">
                  <AvatarImage src={client.avatar} />
                  <AvatarFallback className="bg-primary/10 text-2xl font-bold text-primary">
                    {client.firstName.charAt(0)}
                    {client.lastName.charAt(0)}
                  </AvatarFallback>
                </Avatar>
                <div className="space-y-1">
                  <h3 className="text-2xl font-bold tracking-tight text-foreground">
                    {client.firstName} {client.lastName}
                  </h3>
                  <div className="flex flex-wrap items-center gap-x-4 gap-y-1 text-sm text-muted-foreground">
                    {calculateAge(client.personalNumber) !== null && (
                      <span className="flex items-center gap-1.5">
                        <Calendar className="h-4 w-4" />
                        {calculateAge(client.personalNumber)} {t('common.years_old')}
                      </span>
                    )}
                    {(client.location || client.address) && (
                      <span className="flex items-center gap-1.5">
                        <MapPin className="h-4 w-4" />
                        {client.location || client.address}
                      </span>
                    )}
                    <span className="flex items-center gap-1.5 font-medium text-primary/80">
                      <HeartPulse className="h-4 w-4" />
                      {client.careLevel}
                    </span>
                  </div>
                </div>
              </div>

              <div className="flex items-center gap-2">
                <Button
                  variant="outline"
                  className="h-10 gap-2 border-border bg-background px-4 transition-all hover:bg-muted"
                  onClick={() => navigate(`/notes?team=${client.teamId}`)}
                >
                  <StickyNote className="h-4 w-4 text-primary" />
                  <span>{t('sidebar.notes')}</span>
                </Button>
                <Button
                  variant="outline"
                  className="h-10 gap-2 border-border bg-background px-4 transition-all hover:bg-muted"
                  onClick={() => navigate(`/medication?team=${client.teamId}`)}
                >
                  <Pill className="h-4 w-4 text-emerald-500" />
                  <span>{t('sidebar.medication')}</span>
                </Button>
                {(userRole === 'admin' || userRole === 'platform_admin') && (
                  <Button
                    variant="outline"
                    className="h-10 gap-2 border-primary/20 bg-background px-4 text-primary transition-all hover:bg-primary/5 hover:text-primary"
                    onClick={() => onEditClient(client)}
                  >
                    <Plus className="h-4 w-4 rotate-45" />
                    <span>{t('common.edit')}</span>
                  </Button>
                )}
              </div>
            </div>
          </div>
        )}

        <div className="pb-8">
          {sortedRoles.map((roleGroup) => (
            <div key={roleGroup}>
              <div className="sticky top-16 z-0 flex items-center border-b border-border bg-muted/40 px-8 py-2 text-[10px] font-semibold uppercase tracking-wider text-muted-foreground backdrop-blur-md">
                {roleGroup} ({groupedMembers[roleGroup].length})
              </div>
              {groupedMembers[roleGroup].map((member) => {
                const displayName =
                  member.name === member.email
                    ? t('directory.members.name_unspecified')
                    : member.name
                const displayInitial = (
                  displayName !== t('directory.members.name_unspecified')
                    ? displayName.charAt(0)
                    : member.email.charAt(0)
                ).toUpperCase()

                return (
                  <div
                    key={member.id}
                    onClick={() => onSelectMember(member)}
                    className="group flex cursor-pointer items-center border-b border-border px-8 py-3 transition-colors hover:bg-muted"
                  >
                    <Avatar className="mr-4 h-10 w-10 shrink-0 border border-border">
                      <AvatarImage src={member.avatar} />
                      <AvatarFallback className="bg-muted text-xs font-bold text-primary">
                        {displayInitial}
                      </AvatarFallback>
                    </Avatar>

                    <div className="w-64 shrink-0 pr-4 text-[14px] font-medium text-foreground md:w-80">
                      {displayName}
                      <div className="mt-0.5 overflow-hidden text-ellipsis text-[12px] font-normal text-muted-foreground">
                        {member.email}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center justify-end pr-4">
                      {selectedTeam !== 'all_members' &&
                      (userRole === 'admin' || userRole === 'platform_admin') ? (
                        <div className="w-48" onClick={(e) => e.stopPropagation()}>
                          <Select
                            value={member.roleId || 'none'}
                            onValueChange={async (value) => {
                              const newRoleId = value === 'none' ? null : value
                              const { error } = await supabase
                                .from('team_members')
                                .update({ role_id: newRoleId })
                                .eq('user_id', member.id)
                                .eq('team_id', selectedTeam)
                              if (error)
                                alert(
                                  t('directory.members.update_role_error') + ' ' + error.message,
                                )
                            }}
                          >
                            <SelectTrigger className="h-8 w-full border-border bg-muted/50 text-xs">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="none">
                                {t('directory.members.default_assistant_role')}
                              </SelectItem>
                              {dbWorkspaceRoles.map((r) => (
                                <SelectItem key={r.id} value={r.id}>
                                  {r.name}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      ) : null}
                    </div>

                    <div className="flex w-16 shrink-0 items-center justify-end gap-2 text-muted-foreground transition-colors group-hover:text-foreground">
                      {(userRole === 'admin' || userRole === 'platform_admin') && (
                        <button
                          onClick={async (e) => {
                            e.stopPropagation()
                            if (selectedTeam !== 'all_members') {
                              if (
                                confirm(
                                  t('directory.members.delete_team_confirm', { name: member.name }),
                                )
                              ) {
                                const { error } = await supabase
                                  .from('team_members')
                                  .delete()
                                  .eq('user_id', member.id)
                                  .eq('team_id', selectedTeam)
                                if (error)
                                  alert(t('directory.members.delete_error') + ' ' + error.message)
                              }
                            } else {
                              if (
                                confirm(
                                  t('directory.members.delete_org_confirm', { name: member.name }),
                                )
                              ) {
                                const { error } = await supabase
                                  .from('users')
                                  .update({ workspace_id: null })
                                  .eq('id', member.id)
                                if (error)
                                  alert(t('directory.members.delete_error') + ' ' + error.message)
                                else {
                                  await supabase
                                    .from('team_members')
                                    .delete()
                                    .eq('user_id', member.id)
                                }
                              }
                            }
                          }}
                          className="transition-colors hover:text-red-500"
                          title={
                            selectedTeam !== 'all_members'
                              ? t('directory.members.delete_team_tooltip')
                              : t('directory.members.delete_org_tooltip')
                          }
                        >
                          <Trash2 className="h-4 w-4" />
                        </button>
                      )}
                      <ChevronRight className="h-5 w-5" />
                    </div>
                  </div>
                )
              })}
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
