import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import type { CalendarEvent, EventCategory } from '@/types';
import { 
  Dialog, 
  DialogContent, 
  DialogHeader, 
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';

interface AddEventModalProps {
  selectedDate: Date;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>) => Promise<void>;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ selectedDate, onClose, onSave }) => {
  const { workspaceId } = useWorkspace();
  const { t } = useTranslation();
  const { data: dbTeams = [] } = useWorkspaceTeams(workspaceId);
  const { data: dbUsers = [] } = useWorkspaceUsers(workspaceId);

  const [teamId, setTeamId] = useState('');
  const [assigneeId, setAssigneeId] = useState('');
  const [startDate, setStartDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState(selectedDate.toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState('09:00');
  const [endTime, setEndTime] = useState('10:00');
  const [category, setCategory] = useState<EventCategory>('assistance_time');
  const [description, setDescription] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Auto-select team if only one exists
  useEffect(() => {
    if (dbTeams.length === 1) {
      setTeamId(dbTeams[0].id);
    }
  }, [dbTeams]);

  // Sync end date if start date changes and they were same
  const handleStartDateChange = (newStartDate: string) => {
    if (startDate === endDate) {
      setEndDate(newStartDate);
    }
    setStartDate(newStartDate);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamId || !assigneeId) return;

    setIsSubmitting(true);
    try {
      const start = new Date(startDate);
      const [startH, startM] = startTime.split(':').map(Number);
      start.setHours(startH, startM, 0, 0);

      const end = new Date(endDate);
      const [endH, endM] = endTime.split(':').map(Number);
      end.setHours(endH, endM, 0, 0);

      // Use category label as title
      const eventTitle = t(`scheduler.categories.${category}`, { defaultValue: category });

      await onSave({
        title: eventTitle,
        teamId,
        assigneeId,
        startTime: start,
        endTime: end,
        category,
        description,
      });
      onClose();
    } catch (error) {
      console.error('Failed to save event:', error);
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <Dialog open={true} onOpenChange={(open) => !open && onClose()}>
      <DialogContent className="sm:max-w-lg p-0 overflow-hidden border-border bg-card shadow-2xl">
        <DialogHeader className="px-6 py-4 border-b border-border bg-card">
          <DialogTitle className="text-lg font-semibold text-foreground">
            {t('scheduler.new_event')}
          </DialogTitle>
        </DialogHeader>

        <form id="add-event-form" onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-dark">
          {/* Category moved to top */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.category')}</label>
            <select
              required
              value={category}
              onChange={(e) => setCategory(e.target.value as EventCategory)}
              className="w-full bg-muted/50 border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
            >
              {(['assistance_time', 'on_call', 'travel_time', 'introduction', 'meeting', 'administrative_hours', 'training', 'escort_service', 'respite_care', 'unauthorized_absence', 'involuntary_leave', 'other_time', 'customer_staff_note', 'severance_pay', 'other'] as const).map((cat) => (
                <option key={cat} value={cat}>
                  {t(`scheduler.categories.${cat}`, { defaultValue: cat })}
                </option>
              ))}
            </select>

            <div className="flex flex-wrap gap-2 pt-1">
              {(['assistance_time', 'on_call', 'administrative_hours', 'meeting', 'other'] as const).map((cat) => (
                <button
                  key={cat}
                  type="button"
                  onClick={() => setCategory(cat)}
                  className={`px-3 py-1.5 rounded-lg text-[11px] font-medium transition-all ${category === cat
                    ? 'bg-primary/20 text-primary border-primary/50 border shadow-sm'
                    : 'bg-muted/50 text-muted-foreground hover:bg-muted/80 border border-transparent'
                    }`}
                >
                  {t(`scheduler.categories.${cat}`, { defaultValue: cat })}
                </button>
              ))}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.team')}</label>
              <select
                required
                value={teamId}
                onChange={(e) => setTeamId(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="" disabled>{t('scheduler.select_team')}</option>
                {dbTeams.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
              </select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('scheduler.staff')}</label>
              <select
                required
                value={assigneeId}
                onChange={(e) => setAssigneeId(e.target.value)}
                className="w-full bg-muted/50 border border-border rounded-lg px-2 py-2 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none"
              >
                <option value="" disabled>{t('scheduler.select_staff')}</option>
                {dbUsers.map(u => <option key={u.id} value={u.id}>{u.full_name || u.name}</option>)}
              </select>
            </div>
          </div>

          <div className="grid grid-cols-2 gap-x-4 gap-y-3 p-4 bg-muted/30 rounded-xl border border-border/50">
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">{t('common.start_date')}</label>
              <input
                type="date"
                value={startDate}
                onChange={(e) => handleStartDateChange(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">{t('common.start_time')}</label>
              <input
                type="time"
                value={startTime}
                onChange={(e) => setStartTime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">{t('common.end_date')}</label>
              <input
                type="date"
                value={endDate}
                onChange={(e) => setEndDate(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none shadow-sm"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">{t('common.end_time')}</label>
              <input
                type="time"
                value={endTime}
                onChange={(e) => setEndTime(e.target.value)}
                className="w-full bg-background border border-border rounded-lg px-3 py-1.5 text-sm text-foreground focus:ring-1 focus:ring-primary outline-none shadow-sm"
              />
            </div>
          </div>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none"
              placeholder={t('scheduler.description_placeholder') || 'Mer detaljer...'}
            />
          </div>
        </form>

        <DialogFooter className="px-6 py-4 border-t border-border bg-muted/20 gap-3">
          <Button
            type="button"
            variant="ghost"
            onClick={onClose}
            className="text-muted-foreground hover:text-foreground"
          >
            {t('common.cancel')}
          </Button>
          <Button
            form="add-event-form"
            type="submit"
            disabled={isSubmitting || !teamId || !assigneeId}
            className="bg-primary hover:bg-primary/90 text-white shadow-lg shadow-primary/20 min-w-[100px]"
          >
            {isSubmitting ? t('common.saving') : t('common.save')}
          </Button>
        </DialogFooter>
      </DialogContent>
    </Dialog>
  );
};
