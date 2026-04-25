import React, { useState } from 'react'
import { Settings, Plus } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import type { WorkspaceRole } from '../hooks/useDirectoryData'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface RoleManagerModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceRoles: WorkspaceRole[]
  workspaceId: string | null
  selectedWorkspace: string | null
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  isOpen,
  onClose,
  workspaceRoles,
  workspaceId,
  selectedWorkspace,
}) => {
  const { t } = useTranslation()
  const [editingRole, setEditingRole] = useState<WorkspaceRole | 'new' | null>(null) // null = list view, 'new' = creating, or role_object = editing
  const [roleForm, setRoleForm] = useState({
    name: '',
    can_manage_schedule: false,
    can_manage_notes: false,
    can_approve_time_reports: false,
  })

  if (!isOpen) return null

  const handleSaveRole = async () => {
    const targetWS = selectedWorkspace || workspaceId
    const payload = {
      workspace_id: targetWS,
      name: roleForm.name,
      permissions: {
        can_manage_schedule: roleForm.can_manage_schedule,
        can_manage_notes: roleForm.can_manage_notes,
        can_approve_time_reports: roleForm.can_approve_time_reports,
      },
    }

    let error
    if (editingRole === 'new') {
      const res = await supabase.from('workspace_roles').insert([payload])
      error = res.error
    } else {
      if (!editingRole) return
      const res = await supabase.from('workspace_roles').update(payload).eq('id', editingRole.id)
      error = res.error
    }

    if (error) alert(t('directory.members.delete_error') + ' ' + error.message)
    else {
      alert(
        editingRole === 'new'
          ? t('directory.role_manager.create_success')
          : t('directory.role_manager.update_success'),
      )
      setEditingRole(null)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="gap-0 overflow-hidden border-border bg-sidebar p-0 sm:max-w-[850px]">
        <div className="flex h-[700px]">
          {/* Left side: List of Roles */}
          <div className="flex w-[240px] flex-col border-r border-border bg-sidebar/50">
            <div className="flex h-14 items-center border-b border-border px-4">
              <h3 className="flex items-center gap-2 font-medium text-foreground">
                <Settings className="h-4 w-4 text-primary" /> {t('directory.role_manager.title')}
              </h3>
            </div>
            <div className="scrollbar-dark flex-1 overflow-y-auto p-3">
              {/* Default Assistant Role (Read Only) */}
              <div
                className={`mb-2 cursor-pointer rounded-lg p-3 transition-colors ${editingRole === null ? 'border border-primary/20 bg-primary/10' : 'border border-transparent hover:bg-muted'}`}
                onClick={() => {
                  setEditingRole(null)
                  setRoleForm({
                    name: '',
                    can_manage_schedule: false,
                    can_manage_notes: false,
                    can_approve_time_reports: false,
                  })
                }}
              >
                <div className="text-sm font-medium text-foreground">
                  {t('directory.members.default_assistant_role')}
                </div>
                <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                  {t('directory.role_manager.locked_role_desc')}
                </div>
              </div>

              {workspaceRoles.map((role) => (
                <div
                  key={role.id}
                  className={`mb-2 cursor-pointer rounded-lg p-3 transition-colors ${editingRole !== 'new' && editingRole?.id === role.id ? 'border border-primary/20 bg-primary/10' : 'border border-transparent hover:bg-muted'}`}
                  onClick={() => {
                    setEditingRole(role)
                    setRoleForm({
                      name: role.name,
                      can_manage_schedule: role.permissions?.can_manage_schedule || false,
                      can_manage_notes: role.permissions?.can_manage_notes || false,
                      can_approve_time_reports: role.permissions?.can_approve_time_reports || false,
                    })
                  }}
                >
                  <div className="text-sm font-medium text-foreground">{role.name}</div>
                  <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                    {t('directory.role_manager.custom_role_desc')}
                  </div>
                </div>
              ))}
            </div>
            <div className="border-t border-border p-4">
              <Button
                variant="outline"
                className="h-9 w-full border-border bg-background text-xs hover:bg-muted"
                onClick={() => {
                  setEditingRole('new')
                  setRoleForm({
                    name: '',
                    can_manage_schedule: false,
                    can_manage_notes: false,
                    can_approve_time_reports: false,
                  })
                }}
              >
                <Plus className="mr-1.5 h-3.5 w-3.5" /> Skapa ny roll
              </Button>
            </div>
          </div>

          {/* Right side: Editor */}
          <div className="flex flex-1 flex-col bg-sidebar">
            <DialogHeader className="flex h-14 flex-row items-center justify-between space-y-0 border-b border-border px-6">
              <DialogTitle className="text-base font-medium text-foreground">
                {editingRole === 'new'
                  ? t('directory.role_manager.create_title')
                  : editingRole
                    ? t('directory.role_manager.edit_title')
                    : 'Information'}
              </DialogTitle>
            </DialogHeader>

            {editingRole === 'new' || (editingRole && editingRole.id) ? (
              <>
                <div className="scrollbar-dark flex-1 space-y-6 overflow-y-auto p-6">
                  <div>
                    <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                      {t('directory.role_manager.role_name_label')} *
                    </label>
                    <input
                      value={roleForm.name}
                      onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                      className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm text-foreground focus:outline-none focus:ring-1 focus:ring-primary"
                      placeholder={t('directory.role_manager.role_name_placeholder')}
                    />
                  </div>

                  <div className="space-y-3">
                    <label className="block border-b border-border pb-2 text-[11px] font-semibold uppercase tracking-widest text-muted-foreground">
                      {t('directory.role_manager.permissions_label')}
                    </label>

                    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                      <input
                        type="checkbox"
                        id="p_sched"
                        checked={roleForm.can_manage_schedule}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, can_manage_schedule: e.target.checked })
                        }
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border"
                      />
                      <label htmlFor="p_sched" className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-foreground">
                          {t('directory.role_manager.perm_schedule_title')}
                        </div>
                        <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {t('directory.role_manager.perm_schedule_desc')}
                        </div>
                      </label>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                      <input
                        type="checkbox"
                        id="p_notes"
                        checked={roleForm.can_manage_notes}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, can_manage_notes: e.target.checked })
                        }
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border"
                      />
                      <label htmlFor="p_notes" className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-foreground">
                          {t('directory.role_manager.perm_notes_title')}
                        </div>
                        <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {t('directory.role_manager.perm_notes_desc')}
                        </div>
                      </label>
                    </div>

                    <div className="flex items-start gap-3 rounded-lg border border-border bg-background p-4">
                      <input
                        type="checkbox"
                        id="p_time"
                        checked={roleForm.can_approve_time_reports}
                        onChange={(e) =>
                          setRoleForm({ ...roleForm, can_approve_time_reports: e.target.checked })
                        }
                        className="mt-0.5 h-4 w-4 cursor-pointer rounded border-border"
                      />
                      <label htmlFor="p_time" className="flex-1 cursor-pointer">
                        <div className="text-sm font-medium text-foreground">
                          {t('directory.role_manager.perm_time_title')}
                        </div>
                        <div className="mt-1 text-[11px] leading-relaxed text-muted-foreground">
                          {t('directory.role_manager.perm_time_desc')}
                        </div>
                      </label>
                    </div>
                  </div>
                </div>

                <div className="flex justify-end gap-3 border-t border-border bg-sidebar p-4">
                  <Button
                    variant="ghost"
                    onClick={onClose}
                    className="h-9 text-muted-foreground hover:text-foreground"
                  >
                    {t('directory.role_manager.close')}
                  </Button>
                  {editingRole !== 'new' && (
                    <Button
                      variant="ghost"
                      onClick={async () => {
                        if (confirm(t('directory.role_manager.delete_confirm'))) {
                          await supabase.from('workspace_roles').delete().eq('id', editingRole.id)
                          setEditingRole(null)
                        }
                      }}
                      className="h-9 text-red-500 hover:bg-red-500/10 hover:text-red-600"
                    >
                      Ta bort
                    </Button>
                  )}
                  <Button
                    onClick={handleSaveRole}
                    disabled={!roleForm.name}
                    className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
                  >
                    {editingRole === 'new'
                      ? t('directory.role_manager.save_new')
                      : t('directory.role_manager.save_changes')}
                  </Button>
                </div>
              </>
            ) : (
              <div className="flex flex-1 flex-col items-center justify-center text-muted-foreground">
                <Settings className="mb-4 h-12 w-12 opacity-20" />
                <p className="text-sm">{t('directory.role_manager.empty_state')}</p>
                <Button
                  variant="outline"
                  className="mt-6 border-border bg-background"
                  onClick={onClose}
                >
                  {t('directory.role_manager.close_manager')}
                </Button>
              </div>
            )}
          </div>
        </div>
      </DialogContent>
    </Dialog>
  )
}
