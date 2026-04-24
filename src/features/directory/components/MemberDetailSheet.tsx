import React from 'react';
import { User, Phone, Mail, MapPin, AlertTriangle, FileText, Lock } from 'lucide-react';
import { useTranslation } from 'react-i18next';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { useAuth } from '@/hooks/useAuth';
import {
  Sheet,
  SheetContent,
  SheetDescription,
  SheetHeader,
  SheetTitle,
} from '@/components/ui/sheet';
import type { MemberItem } from '../hooks/useDirectoryData';

interface MemberDetailSheetProps {
  member: MemberItem | null;
  onClose: () => void;
  userRole: string;
}

export const MemberDetailSheet: React.FC<MemberDetailSheetProps> = ({
  member,
  onClose,
  userRole
}) => {
  const { t } = useTranslation();
  const { user: viewer } = useAuth();

  if (!member) return null;
  const isPatient = member.role === 'Patient';
  const isSelf = viewer?.id === member.id;
  const canSeeAll = userRole === 'admin' || userRole === 'platform_admin' || isSelf;

  // Privacy checks
  const showPhone = canSeeAll || member.privacy_settings?.phone === 'everyone' || 
    (member.privacy_settings?.phone === 'organization'); // Since we only show members of the same org in the directory anyway
  
  const showLocation = canSeeAll || member.privacy_settings?.location === 'everyone' || 
    (member.privacy_settings?.location === 'organization');

  let headerGradient = 'from-primary/20';
  if (isPatient) headerGradient = 'from-violet-500/20';

  return (
    <Sheet open={!!member} onOpenChange={(open) => !open && onClose()}>
      <SheetContent className="bg-sidebar border-l-border text-foreground sm:max-w-md w-full p-0 overflow-y-auto scrollbar-dark flex flex-col h-full">

        <div className="p-6 border-b border-border bg-card relative">
          <div className={`absolute top-0 left-0 w-full h-32 bg-gradient-to-b ${headerGradient} to-transparent pointer-events-none`} />

          <SheetHeader className="relative z-10 pt-4">
            <div className="flex flex-col items-center text-center">
              <Avatar className="w-20 h-20 border-4 border-border shadow-md mb-3">
                <AvatarImage src={member.avatar} />
                <AvatarFallback className="text-xl">{member.name.charAt(0)}</AvatarFallback>
              </Avatar>
              <SheetTitle className="text-xl text-foreground">{member.name}</SheetTitle>

              {isPatient ? (
                <SheetDescription className="text-muted-foreground mt-1 flex items-center gap-1.5 justify-center text-xs">
                  <User className="w-3 h-3" /> {member.ssn}
                </SheetDescription>
              ) : (
                <Badge variant="outline" className="mt-2 text-primary border-primary/30 bg-primary/10 text-[10px] capitalize">
                  {member.role === 'platform_admin' ? t('directory.roles.platform_admin') : member.role}
                </Badge>
              )}
            </div>
          </SheetHeader>

          {isPatient && (
            <div className="flex gap-2 justify-center mt-4">
              <Badge variant="secondary" className="bg-muted text-muted-foreground text-[10px]">
                {t('settings.font_scale')}: {member.careLevel}
              </Badge>
            </div>
          )}
        </div>

        <div className="p-6 space-y-6 flex-1">

          {/* Contact Info */}
          <div className="space-y-3">
            <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('directory.detail.info_title')}</h4>
            <div className="bg-background rounded-lg p-3 space-y-2 border border-border">
              {/* Phone */}
              <div className="flex items-center justify-between text-xs">
                <div className="flex items-center gap-3">
                  <Phone className="w-3.5 h-3.5 text-muted-foreground" />
                  {showPhone ? (
                    <span className="text-foreground">{member.phone || t('directory.detail.phone_unspecified')}</span>
                  ) : (
                    <span className="text-muted-foreground italic flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> {t('directory.detail.private')}
                    </span>
                  )}
                </div>
              </div>

              {/* Email */}
              {!isPatient && member.email && (
                <div className="flex items-center gap-3 text-xs border-t border-border pt-2 mt-2">
                  <Mail className="w-3.5 h-3.5 text-muted-foreground" />
                  <span className="text-foreground">{member.email}</span>
                </div>
              )}

              {/* Location/Address */}
              {(isPatient || member.location) && (
                <div className="flex items-center gap-3 text-xs border-t border-border pt-2 mt-2">
                  <MapPin className="w-3.5 h-3.5 text-muted-foreground" />
                  {isPatient ? (
                    <span className="text-foreground">{member.address}</span>
                  ) : showLocation ? (
                    <span className="text-foreground">{member.location || t('directory.detail.location_unspecified')}</span>
                  ) : (
                    <span className="text-muted-foreground italic flex items-center gap-1.5">
                      <Lock className="w-3 h-3" /> {t('directory.detail.private')}
                    </span>
                  )}
                </div>
              )}
            </div>
          </div>

          {/* Alerts */}
          {member.alerts && member.alerts.length > 0 && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold text-rose-500/80 uppercase tracking-wider">{t('directory.detail.warnings_title')}</h4>
              <div className="bg-rose-500/10 border border-rose-500/20 rounded-lg p-3">
                {member.alerts.map((alert: string, i: number) => (
                  <div key={i} className="flex items-center gap-2 text-rose-400 text-xs font-medium">
                    <AlertTriangle className="w-3.5 h-3.5" />
                    {alert}
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* Notes */}
          {isPatient && member.notes && (
            <div className="space-y-3">
              <h4 className="text-[10px] font-semibold text-muted-foreground uppercase tracking-wider">{t('directory.detail.care_plan_title')}</h4>
              <div className="bg-background rounded-lg p-4 border border-border">
                <p className="text-muted-foreground text-xs leading-relaxed">
                  {member.notes}
                </p>
              </div>
            </div>
          )}
        </div>

        {/* Action Footer */}
        <div className="p-4 border-t border-border bg-muted/30 flex gap-2">
          {isPatient && (
            <Button size="sm" className="flex-1 bg-violet-600 hover:bg-violet-700 text-foreground h-9 text-xs">
              <FileText className="w-3.5 h-3.5 mr-2" />
              {t('directory.detail.journal_button')}
            </Button>
          )}
          {(userRole === 'platform_admin' || userRole === 'admin') && (
            <Button size="sm" variant="outline" className={`flex-1 bg-transparent border-border text-foreground hover:bg-muted h-9 text-xs border border-border ${!isPatient && "w-full"}`}>
              {t('directory.detail.edit_button', { type: isPatient ? t('directory.detail.patient') : t('directory.detail.staff') })}
            </Button>
          )}
        </div>
      </SheetContent>
    </Sheet>
  );
};
