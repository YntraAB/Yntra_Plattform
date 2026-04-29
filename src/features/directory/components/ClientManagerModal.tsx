import React, { useState } from 'react'
import { supabase } from '@/lib/supabase'
import { Button } from '@/components/ui/button'
import { UserPlus, Loader2 } from 'lucide-react'
import { toast } from 'sonner'
import { useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData'
import { useTranslation } from 'react-i18next'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog'

interface ClientManagerModalProps {
  isOpen: boolean
  onClose: () => void
  workspaceId: string | null
  teams: { id: string; name: string }[]
  initialData?: import('../hooks/useDirectoryData').ClientItem | null
}

export const ClientManagerModal: React.FC<ClientManagerModalProps> = ({
  isOpen,
  onClose,
  workspaceId,
  teams,
  initialData,
}) => {
  const { t } = useTranslation()
  const [firstName, setFirstName] = useState('')
  const [lastName, setLastName] = useState('')
  const [personalNumber, setPersonalNumber] = useState('')
  const [teamId, setTeamId] = useState('')
  const [messageSetting, setMessageSetting] = useState('contact_person')
  const [contactPersonEmail, setContactPersonEmail] = useState('')
  const [location, setLocation] = useState('')
  const [address, setAddress] = useState('')
  const [avatar, setAvatar] = useState('')
  const [careLevel, setCareLevel] = useState('medium')
  const [showSuggestions, setShowSuggestions] = useState(false)
  const [hasContactPerson, setHasContactPerson] = useState(false)
  const [isSubmitting, setIsSubmitting] = useState(false)

  React.useEffect(() => {
    if (initialData) {
      setFirstName(initialData.firstName)
      setLastName(initialData.lastName)
      setPersonalNumber(initialData.personalNumber)
      setTeamId(initialData.teamId || '')
      setLocation(initialData.location || '')
      setAddress(initialData.address || '')
      setAvatar(initialData.avatar || '')
      setCareLevel(initialData.careLevel || 'medium')
    } else {
      setFirstName('')
      setLastName('')
      setPersonalNumber('')
      setTeamId('')
      setLocation('')
      setAddress('')
      setAvatar('')
    }
  }, [initialData, isOpen])

  const { data: users = [] } = useWorkspaceUsers(workspaceId || null)

  const filteredUsers = React.useMemo(() => {
    if (!contactPersonEmail) return []
    const lower = contactPersonEmail.toLowerCase()
    return users
      .filter((u) => u.email.toLowerCase().includes(lower) || u.name.toLowerCase().includes(lower))
      .slice(0, 5)
  }, [contactPersonEmail, users])

  const handleSelectUser = (email: string) => {
    setContactPersonEmail(email)
    setShowSuggestions(false)
  }

  if (!isOpen) return null

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!workspaceId) return

    setIsSubmitting(true)
    try {
      const finalEmail =
        messageSetting === 'contact_person' || (messageSetting === 'open' && hasContactPerson)
          ? contactPersonEmail
          : null

      const { error } = await supabase.from('clients').upsert({
        id: initialData?.id || undefined,
        workspace_id: workspaceId,
        first_name: firstName,
        last_name: lastName,
        personal_number: personalNumber,
        team_id: teamId || null,
        location: location || null,
        address: address || null,
        avatar: avatar || null,
        care_level: careLevel,
        message_settings: {
          allowed_contacts: messageSetting,
          contact_person_email: finalEmail,
        },
      })

      if (error) throw error

      toast.success(t('directory.client_manager.success'))
      onClose()
    } catch (err: unknown) {
      const message = err instanceof Error ? err.message : t('directory.client_manager.error')
      toast.error(message)
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <Dialog open={isOpen} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="overflow-hidden border-border bg-sidebar p-0 sm:max-w-[425px]">
        <DialogHeader className="flex h-14 flex-row items-center justify-between space-y-0 border-b border-border px-6">
          <DialogTitle className="flex items-center gap-2 font-medium text-foreground">
            <UserPlus className="h-5 w-5 text-primary" />{' '}
            {initialData
              ? t('directory.client_manager.edit_title', 'Redigera Brukare')
              : t('directory.client_manager.title')}
          </DialogTitle>
        </DialogHeader>

        <form onSubmit={handleSubmit} className="p-6">
          <div className="space-y-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('common.first_name')} *
                </label>
                <input
                  required
                  value={firstName}
                  onChange={(e) => setFirstName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('common.last_name')} *
                </label>
                <input
                  required
                  value={lastName}
                  onChange={(e) => setLastName(e.target.value)}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('common.ssn')}
              </label>
              <input
                value={personalNumber}
                onChange={(e) => setPersonalNumber(e.target.value)}
                placeholder={t('directory.client_manager.ssn_placeholder')}
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('directory.client_manager.care_level_label')}
              </label>
              <Select value={careLevel} onValueChange={setCareLevel}>
                <SelectTrigger className="h-9 w-full rounded-lg border border-border bg-background text-sm shadow-none outline-none focus:ring-1 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="low">{t('directory.client_manager.care_level_low')}</SelectItem>
                  <SelectItem value="medium">
                    {t('directory.client_manager.care_level_medium')}
                  </SelectItem>
                  <SelectItem value="high">
                    {t('directory.client_manager.care_level_high')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('directory.members.location_label')}
                </label>
                <input
                  value={location}
                  onChange={(e) => setLocation(e.target.value)}
                  placeholder={t('directory.members.location_placeholder')}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                  {t('directory.members.address_label')}
                </label>
                <input
                  value={address}
                  onChange={(e) => setAddress(e.target.value)}
                  placeholder={t('directory.members.address_placeholder')}
                  className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                />
              </div>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('directory.members.avatar_label')}
              </label>
              <input
                value={avatar}
                onChange={(e) => setAvatar(e.target.value)}
                placeholder="https://..."
                className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('directory.client_manager.team_label')}
              </label>
              <Select required value={teamId} onValueChange={setTeamId}>
                <SelectTrigger className="h-9 w-full rounded-lg border border-border bg-background text-sm shadow-none outline-none focus:ring-1 focus:ring-primary">
                  <SelectValue placeholder={t('directory.client_manager.team_placeholder')} />
                </SelectTrigger>
                <SelectContent>
                  {teams.map((t) => (
                    <SelectItem key={t.id} value={t.id}>
                      {t.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('directory.client_manager.team_info')}
              </p>
            </div>
            <div>
              <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                {t('directory.client_manager.comm_level_label')}
              </label>
              <Select
                value={messageSetting}
                onValueChange={(val) => {
                  setMessageSetting(val)
                  if (val === 'admin_only') {
                    setHasContactPerson(false)
                    setContactPersonEmail('')
                  }
                }}
              >
                <SelectTrigger className="h-9 w-full rounded-lg border border-border bg-background text-sm shadow-none outline-none focus:ring-1 focus:ring-primary">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="admin_only">
                    {t('directory.client_manager.comm_admin_only')}
                  </SelectItem>
                  <SelectItem value="contact_person">
                    {t('directory.client_manager.comm_contact')}
                  </SelectItem>
                  <SelectItem value="open">{t('directory.client_manager.comm_open')}</SelectItem>
                </SelectContent>
              </Select>
              <p className="mt-1 text-[11px] text-muted-foreground">
                {t('directory.client_manager.comm_info')}
              </p>
            </div>

            {messageSetting === 'open' && (
              <div className="mt-2 flex items-center gap-2">
                <input
                  type="checkbox"
                  id="hasContactPersonCheck"
                  checked={hasContactPerson}
                  onChange={(e) => setHasContactPerson(e.target.checked)}
                  className="h-4 w-4 cursor-pointer rounded border-border"
                />
                <label
                  htmlFor="hasContactPersonCheck"
                  className="cursor-pointer text-[13px] text-muted-foreground"
                >
                  {t('directory.client_manager.contact_person_label')}
                </label>
              </div>
            )}

            {(messageSetting === 'contact_person' ||
              (messageSetting === 'open' && hasContactPerson)) && (
                <div className="relative mt-2 animate-in fade-in slide-in-from-top-1">
                  <label className="mb-1.5 block text-xs font-medium text-muted-foreground">
                    {t('directory.client_manager.contact_email_label')}
                  </label>
                  <input
                    value={contactPersonEmail}
                    onChange={(e) => {
                      setContactPersonEmail(e.target.value)
                      setShowSuggestions(true)
                    }}
                    onFocus={() => setShowSuggestions(true)}
                    onBlur={() => setTimeout(() => setShowSuggestions(false), 200)}
                    placeholder={t('directory.client_manager.contact_email_placeholder')}
                    className="h-9 w-full rounded-lg border border-border bg-background px-3 text-sm outline-none focus:ring-1 focus:ring-primary"
                  />
                  {showSuggestions && filteredUsers.length > 0 && (
                    <div className="absolute left-0 right-0 top-full z-10 mt-1 max-h-40 overflow-y-auto rounded-md border border-border bg-popover shadow-md">
                      {filteredUsers.map((u) => (
                        <div
                          key={u.id}
                          onClick={() => handleSelectUser(u.email)}
                          className="flex cursor-pointer flex-col px-3 py-2 text-sm text-foreground hover:bg-muted"
                        >
                          <span className="font-medium">{u.name}</span>
                          <span className="text-xs text-muted-foreground">{u.email}</span>
                        </div>
                      ))}
                    </div>
                  )}
                  <p className="mt-1 text-[11px] text-muted-foreground">
                    {t('directory.client_manager.contact_info')}
                  </p>
                </div>
              )}
          </div>

          <div className="mt-8 flex items-center justify-end gap-3">
            <Button
              type="button"
              variant="ghost"
              onClick={onClose}
              className="h-9 hover:bg-secondary"
            >
              {t('common.cancel')}
            </Button>
            <Button
              type="submit"
              disabled={isSubmitting}
              className="h-9 bg-primary text-primary-foreground hover:bg-primary/90"
            >
              {isSubmitting ? <Loader2 className="mr-2 h-4 w-4 animate-spin" /> : null}
              {t('directory.client_manager.save_button')}
            </Button>
          </div>
        </form>
      </DialogContent>
    </Dialog>
  )
}
