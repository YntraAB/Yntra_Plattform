import React, { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import { supabase } from '@/lib/supabase';
import type { CalendarEvent, EventCategory } from '@/types';
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogFooter
} from '@/components/ui/dialog';
import { Button } from '@/components/ui/button';
import {
  Collapsible,
  CollapsibleContent,
  CollapsibleTrigger,
} from '@/components/ui/collapsible';
import { Checkbox } from '@/components/ui/checkbox';
import { Label } from '@/components/ui/label';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { ChevronDown } from 'lucide-react';

interface AddEventModalProps {
  selectedDate: Date;
  event?: CalendarEvent | null;
  onClose: () => void;
  onSave: (event: Omit<CalendarEvent, 'id'>, eventId?: string) => Promise<void>;
}

export const AddEventModal: React.FC<AddEventModalProps> = ({ selectedDate, event, onClose, onSave }) => {
  const { workspaceId } = useWorkspace();
  const { t } = useTranslation();
  const { data: dbTeams = [] } = useWorkspaceTeams(workspaceId);
  const { data: dbUsers = [] } = useWorkspaceUsers(workspaceId);

  const [teamId, setTeamId] = useState(event?.teamId || '');
  const [assigneeId, setAssigneeId] = useState(event?.assigneeId || '');
  const [startDate, setStartDate] = useState((event?.startTime || selectedDate).toISOString().split('T')[0]);
  const [endDate, setEndDate] = useState((event?.endTime || selectedDate).toISOString().split('T')[0]);
  const [startTime, setStartTime] = useState(event?.startTime ? event.startTime.toTimeString().slice(0, 5) : '09:00');
  const [endTime, setEndTime] = useState(event?.endTime ? event.endTime.toTimeString().slice(0, 5) : '10:00');
  const [category, setCategory] = useState<EventCategory>(event?.category || 'assistance_time');
  const [description, setDescription] = useState(event?.description || '');
  const [clientId, setClientId] = useState(event?.clientId || '');
  const [clients, setClients] = useState<{ id: string, name: string }[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [waitingFrom, setWaitingFrom] = useState(event?.waitingTime?.from || '');
  const [waitingTo, setWaitingTo] = useState(event?.waitingTime?.to || '');
  const [active1From, setActive1From] = useState(event?.activeTimes?.[0]?.from || '');
  const [active1To, setActive1To] = useState(event?.activeTimes?.[0]?.to || '');
  const [active2From, setActive2From] = useState(event?.activeTimes?.[1]?.from || '');
  const [active2To, setActive2To] = useState(event?.activeTimes?.[1]?.to || '');
  const [active3From, setActive3From] = useState(event?.activeTimes?.[2]?.from || '');
  const [active3To, setActive3To] = useState(event?.activeTimes?.[2]?.to || '');
  const [breakFrom, setBreakFrom] = useState(event?.break?.from || '');
  const [breakTo, setBreakTo] = useState(event?.break?.to || '');
  const [isBreakPaid, setIsBreakPaid] = useState(event?.break?.isPaid || false);

  useEffect(() => {
    if (dbTeams.length === 1) {
      setTeamId(dbTeams[0].id);
    }
  }, [dbTeams]);

  useEffect(() => {
    if (workspaceId) {
      supabase.from('clients').select('id, first_name, last_name').eq('workspace_id', workspaceId).then(({ data }) => {
        if (data) setClients(data.map(c => ({ id: c.id, name: `${c.first_name} ${c.last_name}` })));
      });
    }
  }, [workspaceId]);

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

      const eventTitle = t(`scheduler.categories.${category}`, { defaultValue: category });

      await onSave({
        title: eventTitle,
        teamId,
        assigneeId,
        clientId: clientId || undefined,
        startTime: start,
        endTime: end,
        category,
        description,
        waitingTime: (waitingFrom || waitingTo) ? { from: waitingFrom, to: waitingTo } : undefined,
        activeTimes: [
          { from: active1From, to: active1To },
          { from: active2From, to: active2To },
          { from: active3From, to: active3To },
        ].filter(t => t.from || t.to),
        break: (breakFrom || breakTo) ? { from: breakFrom, to: breakTo, isPaid: isBreakPaid } : undefined,
      }, event?.id);
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
            {event ? t('scheduler.edit_event', { defaultValue: 'Redigera händelse' }) : t('scheduler.new_event')}
          </DialogTitle>
        </DialogHeader>

        <form id="add-event-form" onSubmit={handleSubmit} className="p-6 space-y-5 max-h-[70vh] overflow-y-auto scrollbar-dark">
          {/* Category moved to top */}
          <div className="space-y-2.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.category')}</label>
            <Select
              value={category}
              onValueChange={(val) => setCategory(val as EventCategory)}
            >
              <SelectTrigger className="w-full bg-muted/50 border-border">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                {(['assistance_time', 'on_call', 'travel_time', 'introduction', 'meeting', 'administrative_hours', 'training', 'escort_service', 'respite_care', 'unauthorized_absence', 'involuntary_leave', 'other_time', 'customer_staff_note', 'severance_pay', 'other'] as const).map((cat) => (
                  <SelectItem key={cat} value={cat}>
                    {t(`scheduler.categories.${cat}`, { defaultValue: cat })}
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>

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
              <Select
                value={teamId}
                onValueChange={setTeamId}
              >
                <SelectTrigger className="w-full bg-muted/50 border-border">
                  <SelectValue placeholder={t('scheduler.select_team')} />
                </SelectTrigger>
                <SelectContent>
                  {dbTeams.map(t => <SelectItem key={t.id} value={t.id}>{t.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            <div className="space-y-1.5">
              <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('scheduler.staff')}</label>
              <Select
                value={assigneeId}
                onValueChange={setAssigneeId}
              >
                <SelectTrigger className="w-full bg-muted/50 border-border">
                  <SelectValue placeholder={t('scheduler.select_staff')} />
                </SelectTrigger>
                <SelectContent>
                  {dbUsers.map(u => <SelectItem key={u.id} value={u.id}>{u.full_name || u.name}</SelectItem>)}
                </SelectContent>
              </Select>
            </div>
            {clients.length > 0 && (
              <div className="space-y-1.5 col-span-2 mt-2">
                <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('scheduler.client_optional')}</label>
                <Select
                  value={clientId}
                  onValueChange={setClientId}
                >
                  <SelectTrigger className="w-full bg-muted/50 border-border">
                    <SelectValue placeholder={t('scheduler.no_specific_client')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="">{t('scheduler.no_specific_client')}</SelectItem>
                    {clients.map(c => <SelectItem key={c.id} value={c.id}>{c.name}</SelectItem>)}
                  </SelectContent>
                </Select>
              </div>
            )}
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

          {/* Overlap, waiting & active time section */}
          <Collapsible className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center justify-between w-full px-4 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm font-medium hover:bg-muted/30 transition-all"
              >
                <span>{t('scheduler.overlap_waiting_active')}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 space-y-4 bg-muted/10 border border-border/30 rounded-lg mt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">
                  {t('scheduler.waiting_time')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{t('common.from')}</span>
                    <input
                      type="time"
                      value={waitingFrom}
                      onChange={(e) => setWaitingFrom(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{t('common.to')}</span>
                    <input
                      type="time"
                      value={waitingTo}
                      onChange={(e) => setWaitingTo(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>

              {[
                { label: t('scheduler.active_time') + ' 1', from: active1From, setFrom: setActive1From, to: active1To, setTo: setActive1To },
                { label: t('scheduler.active_time') + ' 2', from: active2From, setFrom: setActive2From, to: active2To, setTo: setActive2To },
                { label: t('scheduler.active_time') + ' 3', from: active3From, setFrom: setActive3From, to: active3To, setTo: setActive3To }
              ].map((item, idx) => (
                <div key={idx} className="space-y-2">
                  <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">
                    {item.label}
                  </label>
                  <div className="grid grid-cols-2 gap-3">
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{t('common.from')}</span>
                      <input
                        type="time"
                        value={item.from}
                        onChange={(e) => item.setFrom(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                    <div className="flex items-center gap-2">
                      <span className="text-[10px] text-muted-foreground">{t('common.to')}</span>
                      <input
                        type="time"
                        value={item.to}
                        onChange={(e) => item.setTo(e.target.value)}
                        className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                      />
                    </div>
                  </div>
                </div>
              ))}
            </CollapsibleContent>
          </Collapsible>

          {/* Breaks section */}
          <Collapsible className="space-y-2">
            <CollapsibleTrigger asChild>
              <Button
                type="button"
                variant="ghost"
                className="flex items-center justify-between w-full px-4 py-2 bg-muted/20 border border-border/50 rounded-lg text-sm font-medium hover:bg-muted/30 transition-all"
              >
                <span>{t('scheduler.breaks')}</span>
                <ChevronDown className="h-4 w-4 text-muted-foreground" />
              </Button>
            </CollapsibleTrigger>
            <CollapsibleContent className="p-4 space-y-4 bg-muted/10 border border-border/30 rounded-lg mt-2">
              <div className="space-y-2">
                <label className="text-[10px] font-bold text-muted-foreground uppercase tracking-wider opacity-70">
                  {t('scheduler.break')}
                </label>
                <div className="grid grid-cols-2 gap-3">
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{t('common.from')}</span>
                    <input
                      type="time"
                      value={breakFrom}
                      onChange={(e) => setBreakFrom(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                  <div className="flex items-center gap-2">
                    <span className="text-[10px] text-muted-foreground">{t('common.to')}</span>
                    <input
                      type="time"
                      value={breakTo}
                      onChange={(e) => setBreakTo(e.target.value)}
                      className="w-full bg-background border border-border rounded px-2 py-1 text-xs outline-none focus:ring-1 focus:ring-primary"
                    />
                  </div>
                </div>
              </div>
              <div className="flex items-center space-x-2 pt-1">
                <Checkbox
                  id="break-paid"
                  checked={isBreakPaid}
                  onCheckedChange={(checked) => setIsBreakPaid(checked === true)}
                />
                <Label
                  htmlFor="break-paid"
                  className="text-xs font-medium text-muted-foreground cursor-pointer"
                >
                  {t('scheduler.paid')}
                </Label>
              </div>
            </CollapsibleContent>
          </Collapsible>

          <div className="space-y-1.5">
            <label className="text-xs font-semibold text-muted-foreground uppercase tracking-wider">{t('common.description')}</label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              className="w-full bg-muted/50 border border-border rounded-lg px-3 py-2 text-foreground focus:ring-1 focus:ring-primary outline-none min-h-[100px] resize-none"
              placeholder={t('scheduler.description_placeholder')}
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
