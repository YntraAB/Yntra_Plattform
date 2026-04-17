import React, { useState } from 'react';
import { Settings, Plus } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { supabase } from '@/lib/supabase';
import type { WorkspaceRole } from '../hooks/useDirectoryData';

interface RoleManagerModalProps {
  isOpen: boolean;
  onClose: () => void;
  workspaceRoles: WorkspaceRole[];
  workspaceId: string | null;
  selectedWorkspace: string | null;
}

export const RoleManagerModal: React.FC<RoleManagerModalProps> = ({
  isOpen,
  onClose,
  workspaceRoles,
  workspaceId,
  selectedWorkspace
}) => {
  const { t } = useTranslation();
  const [editingRole, setEditingRole] = useState<any>(null); // null = list view, 'new' = creating, or role_object = editing
  const [roleForm, setRoleForm] = useState({
    name: '',
    can_manage_schedule: false,
    can_manage_notes: false,
    can_approve_time_reports: false
  });

  if (!isOpen) return null;

  const handleSaveRole = async () => {
    const targetWS = selectedWorkspace || workspaceId;
    const payload = {
      workspace_id: targetWS,
      name: roleForm.name,
      permissions: {
        can_manage_schedule: roleForm.can_manage_schedule,
        can_manage_notes: roleForm.can_manage_notes,
        can_approve_time_reports: roleForm.can_approve_time_reports
      }
    };

    let error;
    if (editingRole === 'new') {
      const res = await supabase.from('workspace_roles').insert([payload]);
      error = res.error;
    } else {
      const res = await supabase.from('workspace_roles').update(payload).eq('id', editingRole.id);
      error = res.error;
    }

    if (error) alert(t('directory.members.delete_error') + " " + error.message);
    else {
      alert(editingRole === 'new' ? t('directory.role_manager.create_success') : t('directory.role_manager.update_success'));
      setEditingRole(null);
    }
  };

  return (
    <div className="absolute inset-0 bg-black/50 z-50 flex items-center justify-center p-4">
      <div className="bg-sidebar border border-border rounded-xl w-[700px] shadow-2xl flex overflow-hidden min-h-[500px]">
        {/* Left side: List of Roles */}
        <div className="w-1/3 border-r border-border bg-muted/20 flex flex-col">
          <div className="p-4 border-b border-border">
            <h3 className="text-foreground font-medium flex items-center gap-2 text-sm"><Settings className="w-4 h-4" /> {t('directory.role_manager.title')}</h3>
          </div>
          <div className="flex-1 overflow-y-auto p-2">
            {/* Default Assistant Role (Read Only) */}
            <div
              className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${editingRole === null ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}
              onClick={() => { setEditingRole(null); setRoleForm({ name: '', can_manage_schedule: false, can_manage_notes: false, can_approve_time_reports: false }); }}
            >
              <div className="text-sm font-medium text-foreground">{t('directory.members.default_assistant_role')}</div>
              <div className="text-xs text-muted-foreground mt-0.5">{t('directory.role_manager.locked_role_desc')}</div>
            </div>

            {workspaceRoles.map(role => (
              <div
                key={role.id}
                className={`p-3 rounded-lg cursor-pointer transition-colors mb-1 ${editingRole?.id === role.id ? 'bg-primary/10 border border-primary/20' : 'hover:bg-muted border border-transparent'}`}
                onClick={() => {
                  setEditingRole(role);
                  setRoleForm({
                    name: role.name,
                    can_manage_schedule: role.permissions?.can_manage_schedule || false,
                    can_manage_notes: role.permissions?.can_manage_notes || false,
                    can_approve_time_reports: role.permissions?.can_approve_time_reports || false
                  });
                }}
              >
                <div className="text-sm font-medium text-foreground">{role.name}</div>
                <div className="text-xs text-muted-foreground mt-0.5">{t('directory.role_manager.custom_role_desc')}</div>
              </div>
            ))}
          </div>
          <div className="p-4 border-t border-border">
            <Button
              variant="outline"
              className="w-full text-xs h-8"
              onClick={() => {
                setEditingRole('new');
                setRoleForm({ name: '', can_manage_schedule: false, can_manage_notes: false, can_approve_time_reports: false });
              }}
            >
              <Plus className="w-3.5 h-3.5 mr-1" /> {t('directory.role_manager.create_new_button')}
            </Button>
          </div>
        </div>

        {/* Right side: Editor */}
        <div className="flex-1 flex flex-col bg-background">
          {(editingRole === 'new' || (editingRole && editingRole.id)) ? (
            <>
              <div className="p-6 border-b border-border">
                <h3 className="text-lg font-medium text-foreground">{editingRole === 'new' ? t('directory.role_manager.create_title') : t('directory.role_manager.edit_title')}</h3>
                <p className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.config_desc')}</p>
              </div>

              <div className="flex-1 p-6 overflow-y-auto space-y-6">
                <div>
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest mb-2 block">{t('directory.role_manager.role_name_label')}</label>
                  <input
                    value={roleForm.name}
                    onChange={(e) => setRoleForm({ ...roleForm, name: e.target.value })}
                    className="w-full bg-muted border border-border text-foreground rounded-lg px-4 py-2.5 text-sm focus:outline-none focus:border-primary/50 transition-colors"
                    placeholder={t('directory.role_manager.role_name_placeholder')}
                  />
                </div>

                <div className="space-y-4">
                  <label className="text-xs font-semibold text-muted-foreground uppercase tracking-widest block border-b border-border pb-2">{t('directory.role_manager.permissions_label')}</label>

                  <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id="p_sched"
                      checked={roleForm.can_manage_schedule}
                      onChange={(e) => setRoleForm({ ...roleForm, can_manage_schedule: e.target.checked })}
                      className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
                    />
                    <label htmlFor="p_sched" className="cursor-pointer">
                      <div className="text-sm font-medium text-foreground">{t('directory.role_manager.perm_schedule_title')}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.perm_schedule_desc')}</div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id="p_notes"
                      checked={roleForm.can_manage_notes}
                      onChange={(e) => setRoleForm({ ...roleForm, can_manage_notes: e.target.checked })}
                      className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
                    />
                    <label htmlFor="p_notes" className="cursor-pointer">
                      <div className="text-sm font-medium text-foreground">{t('directory.role_manager.perm_notes_title')}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.perm_notes_desc')}</div>
                    </label>
                  </div>

                  <div className="flex items-start gap-3 bg-muted/40 p-4 rounded-lg border border-border">
                    <input
                      type="checkbox"
                      id="p_time"
                      checked={roleForm.can_approve_time_reports}
                      onChange={(e) => setRoleForm({ ...roleForm, can_approve_time_reports: e.target.checked })}
                      className="w-5 h-5 cursor-pointer mt-0.5 accent-primary"
                    />
                    <label htmlFor="p_time" className="cursor-pointer">
                      <div className="text-sm font-medium text-foreground">{t('directory.role_manager.perm_time_title')}</div>
                      <div className="text-xs text-muted-foreground mt-1">{t('directory.role_manager.perm_time_desc')}</div>
                    </label>
                  </div>
                </div>
              </div>

              <div className="p-4 border-t border-border flex justify-end gap-3 bg-sidebar">
                <Button variant="ghost" onClick={onClose} className="text-muted-foreground hover:text-foreground">{t('directory.role_manager.close')}</Button>
                {editingRole !== 'new' && (
                  <Button
                    variant="ghost"
                    onClick={async () => {
                      if (confirm(t('directory.role_manager.delete_confirm'))) {
                        await supabase.from('workspace_roles').delete().eq('id', editingRole.id);
                        setEditingRole(null);
                      }
                    }}
                    className="text-red-500 hover:text-red-600 hover:bg-red-500/10"
                  >
                    {t('directory.role_manager.delete_button')}
                  </Button>
                )}
                <Button
                  onClick={handleSaveRole}
                  disabled={!roleForm.name}
                  className="bg-primary dark:bg-[#0F1115] hover:bg-primary/80 dark:hover:bg-[#1A1D24] text-white"
                >
                  {editingRole === 'new' ? t('directory.role_manager.save_new') : t('directory.role_manager.save_changes')}
                </Button>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center text-muted-foreground flex-col">
              <Settings className="w-12 h-12 mb-4 opacity-20" />
              <p>{t('directory.role_manager.empty_state')}</p>
              <Button variant="ghost" className="mt-6" onClick={onClose}>{t('directory.role_manager.close_manager')}</Button>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};
