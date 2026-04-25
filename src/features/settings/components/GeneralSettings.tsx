import React, { useState, useEffect, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { useWorkspace } from '@/contexts/WorkspaceContext'
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card'
import { Globe, Building2, Upload, Loader2, X } from 'lucide-react'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import { Label } from '@/components/ui/label'
import { Input } from '@/components/ui/input'
import { supabase } from '@/lib/supabase'
import { ImageCropperDialog } from './ImageCropperDialog'
import type { WorkspaceSettings } from '@/types'

interface GeneralSettingsProps {
  setIsSaving: (val: boolean) => void
}

export const GeneralSettings: React.FC<GeneralSettingsProps> = ({ setIsSaving }) => {
  const { t } = useTranslation()
  const {
    settings,
    updateSettings,
    workspaceName,
    workspaceLogo,
    brandColor,
    updateWorkspace,
    workspaceId,
  } = useWorkspace()

  const [localName, setLocalName] = useState(workspaceName || '')
  const [localLogo, setLocalLogo] = useState(workspaceLogo || '')
  const [isUploading, setIsUploading] = useState(false)
  const [cropperOpen, setCropperOpen] = useState(false)
  const [selectedImage, setSelectedImage] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  useEffect(() => {
    setLocalName(workspaceName || '')
  }, [workspaceName])

  useEffect(() => {
    setLocalLogo(workspaceLogo || '')
  }, [workspaceLogo])

  const handleUpdateSettings = async (newSettings: Partial<WorkspaceSettings>) => {
    setIsSaving(true)
    await updateSettings(newSettings)
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleUpdateWorkspace = async (updates: {
    name?: string
    logo_url?: string | null
    brand_color?: string
  }) => {
    setIsSaving(true)
    await updateWorkspace(updates)
    setTimeout(() => setIsSaving(false), 500)
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return

    const reader = new FileReader()
    reader.onload = () => {
      setSelectedImage(reader.result as string)
      setCropperOpen(true)
    }
    reader.readAsDataURL(file)
    e.target.value = ''
  }

  const handleCropComplete = async (croppedBlob: Blob) => {
    if (!workspaceId) return

    setIsUploading(true)
    setIsSaving(true)
    try {
      const fileName = `${workspaceId}-${Date.now()}.png`
      const { error: uploadError } = await supabase.storage
        .from('logos')
        .upload(fileName, croppedBlob)

      if (uploadError) throw uploadError

      const {
        data: { publicUrl },
      } = supabase.storage.from('logos').getPublicUrl(fileName)

      await handleUpdateWorkspace({ logo_url: publicUrl })
      setLocalLogo(publicUrl)
    } catch (error) {
      console.error('Error uploading logo:', error)
    } finally {
      setIsUploading(false)
      setTimeout(() => setIsSaving(false), 500)
    }
  }

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-1 items-stretch gap-6 md:grid-cols-2">
        {/* Organization Identity Card */}
        <Card className="flex h-full flex-col overflow-hidden border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary shadow-inner">
                <Building2 className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">
                  {t('settings.organization_identity')}
                </CardTitle>
                <CardDescription className="text-xs">{t('settings.identity_desc')}</CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="grid grid-cols-1 gap-6 sm:grid-cols-2">
              <div className="space-y-6">
                <div className="space-y-2">
                  <Label
                    htmlFor="org-name"
                    className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70"
                  >
                    {t('settings.organization_name')}
                  </Label>
                  <div className="group relative">
                    <Input
                      id="org-name"
                      value={localName}
                      onChange={(e) => setLocalName(e.target.value)}
                      onBlur={() => handleUpdateWorkspace({ name: localName })}
                      className="h-11 rounded-xl border-border/40 bg-background/40 transition-all duration-300 focus:ring-2 focus:ring-primary/20"
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                    {t('settings.workspace_logo')}
                  </Label>
                  <div className="flex flex-col gap-3">
                    <input
                      type="file"
                      ref={fileInputRef}
                      onChange={handleFileSelect}
                      accept="image/*"
                      className="hidden"
                    />
                    <div className="flex gap-2">
                      <button
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="flex h-11 flex-1 items-center justify-center gap-2 rounded-xl bg-primary text-xs font-bold text-primary-foreground shadow-lg shadow-primary/20 transition-all hover:scale-[1.02] active:scale-95 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : (
                          <Upload className="h-4 w-4" />
                        )}
                        {t('settings.upload_new_logo')}
                      </button>
                      {localLogo && (
                        <button
                          onClick={() => handleUpdateWorkspace({ logo_url: null })}
                          className="flex h-11 w-11 items-center justify-center rounded-xl border-2 border-border/40 text-muted-foreground transition-all hover:border-destructive/40 hover:bg-destructive/10 hover:text-destructive"
                        >
                          <X className="h-4 w-4" />
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </div>

              {/* Logo Preview Area */}
              <div className="flex min-h-[220px] flex-col items-center justify-center rounded-[2rem] border-2 border-dashed border-border/30 bg-muted/10 p-8 transition-colors duration-500 hover:bg-muted/20">
                {localLogo ? (
                  <div className="group/logo relative">
                    <img
                      src={localLogo}
                      alt="Org Logo"
                      className="h-40 w-40 rounded-2xl object-contain shadow-2xl transition-transform duration-500 group-hover/logo:scale-110"
                    />
                  </div>
                ) : (
                  <div className="flex h-40 w-40 items-center justify-center rounded-2xl border border-border/40 bg-background/40 shadow-inner">
                    <Building2 className="h-16 w-16 text-muted-foreground/20" />
                  </div>
                )}
                <p className="mt-6 text-[10px] font-bold uppercase tracking-[0.3em] text-muted-foreground/50">
                  {t('settings.workspace.logo_preview')}
                </p>
              </div>
            </div>

            <div className="border-t border-border/40 pt-6">
              <div className="mb-4 flex items-center justify-between">
                <div>
                  <h4 className="text-[11px] font-bold uppercase tracking-[0.2em] text-foreground">
                    {t('settings.workspace.brand_color')}
                  </h4>
                  <p className="text-[10px] text-muted-foreground">
                    {t('settings.workspace.brand_color_desc')}
                  </p>
                </div>
                <div className="flex items-center gap-3 rounded-2xl border border-border/40 bg-muted/30 p-2">
                  <input
                    type="color"
                    value={brandColor}
                    onChange={(e) => handleUpdateWorkspace({ brand_color: e.target.value })}
                    className="h-10 w-10 cursor-pointer rounded-xl border-none bg-transparent"
                  />
                  <div className="pr-2">
                    <p className="font-mono text-[10px] font-bold">{brandColor.toUpperCase()}</p>
                  </div>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Localization & Time Card */}
        <Card className="flex h-full flex-col overflow-hidden border-2 border-border/50 bg-card/40 shadow-sm backdrop-blur-md">
          <CardHeader className="pb-4">
            <div className="flex items-center gap-3">
              <div className="rounded-xl bg-primary/10 p-2.5 text-primary shadow-inner">
                <Globe className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-bold tracking-tight">
                  {t('settings.localization_time')}
                </CardTitle>
                <CardDescription className="text-xs">
                  {t('settings.localization_desc')}
                </CardDescription>
              </div>
            </div>
          </CardHeader>
          <CardContent className="flex-1 space-y-6">
            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                {t('settings.language')}
              </Label>
              <Select
                value={settings.language}
                onValueChange={(val) => handleUpdateSettings({ language: val })}
              >
                <SelectTrigger className="h-11 rounded-xl border-border/40 bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="sv" className="rounded-lg">
                    Svenska
                  </SelectItem>
                  <SelectItem value="en" className="rounded-lg">
                    English
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                {t('settings.timezone')}
              </Label>
              <Select
                value={settings.timezone}
                onValueChange={(val) => handleUpdateSettings({ timezone: val })}
              >
                <SelectTrigger className="h-11 rounded-xl border-border/40 bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="Europe/Stockholm" className="rounded-lg">
                    Europe/Stockholm (GMT+1)
                  </SelectItem>
                  <SelectItem value="UTC" className="rounded-lg">
                    UTC / GMT
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>

            <div className="space-y-2">
              <Label className="text-[10px] font-bold uppercase tracking-[0.2em] text-muted-foreground/70">
                {t('settings.week_start')}
              </Label>
              <Select
                value={settings.week_start.toString()}
                onValueChange={(val) => handleUpdateSettings({ week_start: parseInt(val) })}
              >
                <SelectTrigger className="h-10 rounded-xl border-border/40 bg-background/40">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent className="rounded-xl border-border/50">
                  <SelectItem value="1" className="rounded-lg">
                    {t('settings.monday')}
                  </SelectItem>
                  <SelectItem value="0" className="rounded-lg">
                    {t('settings.sunday')}
                  </SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>
      </div>

      {selectedImage && (
        <ImageCropperDialog
          image={selectedImage}
          open={cropperOpen}
          onClose={() => {
            setCropperOpen(false)
            setSelectedImage(null)
          }}
          onCropComplete={handleCropComplete}
        />
      )}
    </div>
  )
}

export default GeneralSettings
