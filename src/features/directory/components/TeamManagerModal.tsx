import React, { useState } from 'react'
import { Users, UserPlus, Plus, Trash2, ChevronRight, ChevronLeft, Loader2 } from 'lucide-react'
import { useTranslation } from 'react-i18next'
import { Button } from '@/components/ui/button'
import { supabase } from '@/lib/supabase'
import { toast } from 'sonner'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'
import { Input } from '@/components/ui/input'
import { Label } from '@/components/ui/label'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { cn } from '@/lib/utils'

interface TeamManagerModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string | null
  selectedWorkspace: string | null
}

interface ClientForm {
  id?: string
  firstName: string
  lastName: string
  personalNumber: string
  messageSetting: string
  contactPersonEmail: string
}

export const TeamManagerModal: React.FC<TeamManagerModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  selectedWorkspace,
}) => {
  const { t } = useTranslation()
  const [step, setStep] = useState(1)
  const [isSubmitting, setIsSubmitting] = useState(false)

  // Team State
  const [newTeamName, setNewTeamName] = useState('')

  // Client State
  const [clients, setClients] = useState<ClientForm[]>([])
  const [currentClient, setCurrentClient] = useState({
    firstName: '',
    lastName: '',
    personalNumber: '',
    messageSetting: 'contact_person',
    contactPersonEmail: '',
  })

  const resetModal = () => {
    setStep(1)
    setNewTeamName('')
    setClients([])
    setCurrentClient({
      firstName: '',
      lastName: '',
      personalNumber: '',
      messageSetting: 'contact_person',
      contactPersonEmail: '',
    })
  }

  const handleAddClientToList = () => {
    if (!currentClient.firstName || !currentClient.lastName) {
      toast.error(t('common.fill_required_fields'))
      return
    }
    setClients([...clients, { ...currentClient, id: crypto.randomUUID() }])
    setCurrentClient({
      firstName: '',
      lastName: '',
      personalNumber: '',
      messageSetting: 'contact_person',
      contactPersonEmail: '',
    })
  }

  const handleRemoveClient = (id: string) => {
    setClients(clients.filter((c) => c.id !== id))
  }

  const handleCreateAll = async () => {
    const targetWS = selectedWorkspace || workspaceId
    if (!targetWS) return

    setIsSubmitting(true)
    try {
      // 1. Create Team
      const { data: teamData, error: teamError } = await supabase
        .from('teams')
        .insert([{ workspace_id: targetWS, name: newTeamName }])
        .select()
        .single()

      if (teamError) throw teamError

      const teamId = teamData.id

      // 2. Prepare all clients to insert
      const clientsToInsert = [...clients]
      // Include current client if they started filling it out
      if (currentClient.firstName && currentClient.lastName) {
        clientsToInsert.push({ ...currentClient, id: crypto.randomUUID() })
      }

      if (clientsToInsert.length > 0) {
        const { error: clientsError } = await supabase.from('clients').insert(
          clientsToInsert.map((c) => ({
            workspace_id: targetWS,
            first_name: c.firstName,
            last_name: c.lastName,
            personal_number: c.personalNumber,
            team_id: teamId,
            message_settings: {
              allowed_contacts: c.messageSetting,
              contact_person_email: c.contactPersonEmail || null,
            },
          })),
        )

        if (clientsError) throw clientsError

        for (const c of clientsToInsert) {
          if (c.contactPersonEmail) {
            // Here we could invoke the same invite_user function if needed,
            // but following ClientManagerModal, it's just stored in message_settings.
            // If the user explicitly asked for "invited", we might want to call the function.
            await supabase.functions.invoke('invite_user', {
              body: {
                email: c.contactPersonEmail,
                role: 'user', // Clients might be 'user' or a specific 'client' role
                workspaceId: targetWS,
              },
            })
          }
        }
      }

      toast.success(t('directory.create_team.success'))
      onClose()
      resetModal()
    } catch (error: unknown) {
      const message = error instanceof Error ? error.message : t('directory.members.delete_error')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent
        className={cn(
          'overflow-hidden border-border bg-sidebar p-0 transition-all duration-300',
          step === 1 ? 'sm:max-w-md' : 'sm:max-w-lg',
        )}
      >
        <DialogHeader className="flex h-14 flex-row items-center justify-between space-y-0 border-b border-border px-6">
          <DialogTitle className="flex items-center gap-2 font-medium text-foreground">
            {step === 1 ? (
              <>
                <Users className="h-5 w-5 text-primary" /> {t('directory.create_team.submit')}
              </>
            ) : (
              <>
                <UserPlus className="h-5 w-5 text-primary" /> {t('directory.client_manager.title')}
              </>
            )}
          </DialogTitle>
          <div className="flex items-center gap-1.5">
            <div className={cn('h-2 w-2 rounded-full', step === 1 ? 'bg-primary' : 'bg-muted')} />
            <div className={cn('h-2 w-2 rounded-full', step === 2 ? 'bg-primary' : 'bg-muted')} />
          </div>
        </DialogHeader>

        <div className="p-6">
          {step === 1 ? (
            <div className="space-y-4 duration-300 animate-in fade-in slide-in-from-right-4">
              <div className="space-y-2">
                <Label htmlFor="teamName" className="text-muted-foreground">
                  {t('directory.create_team.name_label')} *
                </Label>
                <Input
                  id="teamName"
                  value={newTeamName}
                  onChange={(e) => setNewTeamName(e.target.value)}
                  className="border-border bg-background"
                  placeholder={t('directory.create_team.name_placeholder')}
                  autoFocus
                />
              </div>
              <div className="flex justify-end gap-3 pt-4">
                <Button variant="ghost" onClick={onClose} className="h-9 text-muted-foreground">
                  {t('directory.hub.cancel')}
                </Button>
                <Button
                  onClick={() => setStep(2)}
                  disabled={!newTeamName}
                  className="h-9 bg-primary text-primary-foreground"
                >
                  {t('common.next')} <ChevronRight className="ml-1 h-4 w-4" />
                </Button>
              </div>
            </div>
          ) : (
            <div className="space-y-6 duration-300 animate-in fade-in slide-in-from-left-4">
              {/* Added Clients List */}
              {clients.length > 0 && (
                <div className="space-y-2">
                  <Label className="text-xs font-bold uppercase tracking-wider text-muted-foreground">
                    {t('directory.members.team_title')} ({clients.length})
                  </Label>
                  <div className="grid gap-2">
                    {clients.map((client) => (
                      <div
                        key={client.id}
                        className="flex items-center justify-between rounded-lg border border-border/50 bg-muted/50 p-2"
                      >
                        <div className="flex flex-col">
                          <span className="text-sm font-medium">
                            {client.firstName} {client.lastName}
                          </span>
                          <span className="text-[10px] text-muted-foreground">
                            {client.contactPersonEmail || t('directory.detail.private')}
                          </span>
                        </div>
                        <Button
                          variant="ghost"
                          size="icon"
                          onClick={() => client.id && handleRemoveClient(client.id)}
                          className="h-7 w-7 text-muted-foreground hover:text-destructive"
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </Button>
                      </div>
                    ))}
                  </div>
                </div>
              )}

              {/* Client Form */}
              <div className="space-y-4 rounded-xl border border-dashed border-border bg-muted/20 p-4">
                <div className="mb-2 flex items-center justify-between">
                  <h4 className="text-sm font-semibold">
                    {t('directory.client_manager.title')} (Valfritt)
                  </h4>
                  {currentClient.firstName && (
                    <Button
                      variant="outline"
                      size="sm"
                      onClick={handleAddClientToList}
                      className="h-7 gap-1 text-xs"
                    >
                      <Plus className="h-3 w-3" /> {t('common.add')}
                    </Button>
                  )}
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">
                      {t('common.first_name')}
                    </Label>
                    <Input
                      value={currentClient.firstName}
                      onChange={(e) =>
                        setCurrentClient({ ...currentClient, firstName: e.target.value })
                      }
                      className="h-8 bg-background"
                    />
                  </div>
                  <div className="space-y-1.5">
                    <Label className="text-xs text-muted-foreground">{t('common.last_name')}</Label>
                    <Input
                      value={currentClient.lastName}
                      onChange={(e) =>
                        setCurrentClient({ ...currentClient, lastName: e.target.value })
                      }
                      className="h-8 bg-background"
                    />
                  </div>
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t('directory.client_manager.contact_email_label')}
                  </Label>
                  <Input
                    type="email"
                    value={currentClient.contactPersonEmail}
                    onChange={(e) =>
                      setCurrentClient({ ...currentClient, contactPersonEmail: e.target.value })
                    }
                    placeholder="E-post för inbjudan..."
                    className="h-8 bg-background"
                  />
                </div>

                <div className="space-y-1.5">
                  <Label className="text-xs text-muted-foreground">
                    {t('directory.client_manager.comm_level_label')}
                  </Label>
                  <Select
                    value={currentClient.messageSetting}
                    onValueChange={(val) =>
                      setCurrentClient({ ...currentClient, messageSetting: val })
                    }
                  >
                    <SelectTrigger className="h-8 bg-background">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="admin_only">
                        {t('directory.client_manager.comm_admin_only')}
                      </SelectItem>
                      <SelectItem value="contact_person">
                        {t('directory.client_manager.comm_contact')}
                      </SelectItem>
                      <SelectItem value="open">
                        {t('directory.client_manager.comm_open')}
                      </SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              <div className="flex justify-between gap-3 pt-4">
                <Button
                  variant="ghost"
                  onClick={() => setStep(1)}
                  className="h-9 text-muted-foreground"
                >
                  <ChevronLeft className="mr-1 h-4 w-4" /> {t('common.back')}
                </Button>
                <div className="flex gap-3">
                  <Button variant="ghost" onClick={onClose} className="h-9 text-muted-foreground">
                    {t('directory.hub.cancel')}
                  </Button>
                  <Button
                    onClick={handleCreateAll}
                    disabled={isSubmitting}
                    className="h-9 bg-primary px-6 text-primary-foreground"
                  >
                    {isSubmitting ? (
                      <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    ) : (
                      <Users className="mr-2 h-4 w-4" />
                    )}
                    {t('directory.create_team.submit')}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </div>
      </DialogContent>
    </Dialog>
  )
}
