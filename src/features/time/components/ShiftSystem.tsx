import React, { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import {
  Check,
  ChevronLeft,
  ChevronRight,
  Search,
  Trash2,
  FileCheck,
  Calendar,
  CheckCircle2,
} from 'lucide-react'
import { Button } from '@/components/ui/button'
import { Input } from '@/components/ui/input'
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select'
import {
  AlertDialog,
  AlertDialogAction,
  AlertDialogCancel,
  AlertDialogContent,
  AlertDialogDescription,
  AlertDialogFooter,
  AlertDialogHeader,
  AlertDialogTitle,
} from '@/components/ui/alert-dialog'
import { StatusBadge } from './StatusBadge'
import { EmptyState } from './EmptyState'
import type { TimeReportUI } from '../types'

interface ShiftSystemProps {
  shifts: TimeReportUI[]
  selectedContext: { type: 'employee' | 'team' | null; id: string | null }
  searchQuery: string
  filterType: string
  currentPage: number
  selectedShifts: string[]
  listMode: 'current' | 'history'
  isDeleteAlertOpen: boolean
  hasApprovePermission: boolean
  setListMode: (mode: 'current' | 'history') => void
  setFilterType: (type: string) => void
  setSearchQuery: (q: string) => void
  setCurrentPage: (p: number | ((prev: number) => number)) => void
  setSelectedShifts: (s: string[] | ((prev: string[]) => string[])) => void
  setIsDeleteAlertOpen: (open: boolean) => void
  handleApprove: () => void
  handleDelete: () => void
}

export const ShiftSystem: React.FC<ShiftSystemProps> = ({
  shifts,
  selectedContext,
  searchQuery,
  filterType,
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
  handleApprove,
  handleDelete,
}) => {
  const { t } = useTranslation()
  let contextShifts = shifts
  if (selectedContext.type === 'employee') {
    contextShifts = shifts.filter((s) => s.employeeId === selectedContext.id)
  } else if (selectedContext.type === 'team') {
    contextShifts = shifts.filter((s) => s.team === selectedContext.id)
  }

  const filteredShifts = useMemo(() => {
    return contextShifts.filter((s) => {
      const searchMatch =
        s.employee.toLowerCase().includes(searchQuery.toLowerCase()) ||
        s.team.toLowerCase().includes(searchQuery.toLowerCase())

      let statusMatch = true
      if (filterType !== 'all') {
        statusMatch = s.status === filterType
      }

      return searchMatch && statusMatch
    })
  }, [contextShifts, searchQuery, filterType])

  const itemsPerPage = 10
  const totalPages = Math.max(1, Math.ceil(filteredShifts.length / itemsPerPage))
  const currentShifts = filteredShifts.slice(
    (currentPage - 1) * itemsPerPage,
    currentPage * itemsPerPage,
  )

  const isAllSelected = filteredShifts.length > 0 && selectedShifts.length === filteredShifts.length
  const toggleSelectAll = () => {
    if (isAllSelected) setSelectedShifts([])
    else setSelectedShifts(filteredShifts.map((s) => s.id))
  }

  const toggleSelect = (id: string, e: React.MouseEvent<HTMLDivElement>) => {
    e.stopPropagation()
    setSelectedShifts((prev) =>
      Array.isArray(prev)
        ? prev.includes(id)
          ? prev.filter((s) => s !== id)
          : [...prev, id]
        : [id],
    )
  }

  const renderHistory = () => {
    let history = shifts
      .filter((s) => s.status === 'approved')
      .map((s) => {
        const d = new Date(s.date)
        const monthStr = d.toLocaleDateString('sv-SE', { month: 'long', year: 'numeric' })
        return {
          id: 'h' + s.id,
          employeeId: s.employeeId,
          teamId: s.team,
          month: monthStr.charAt(0).toUpperCase() + monthStr.slice(1),
          hours: s.duration,
          ob: 0,
          absence: 0,
          salary: '-',
        }
      })
    if (selectedContext.type === 'employee') {
      history = history.filter((h) => h.employeeId === selectedContext.id)
    } else if (selectedContext.type === 'team') {
      history = history.filter((h) => h.teamId === selectedContext.id)
    }

    return (
      <div className="scrollbar-none duration-400 w-full flex-1 overflow-y-auto animate-in fade-in slide-in-from-bottom-2">
        {history.length === 0 ? (
          <EmptyState
            icon={Calendar}
            title={t('timereports.no_history_title')}
            description={t('timereports.no_history_desc')}
          />
        ) : (
          history.map((h) => (
            <div
              key={h.id}
              className="group flex items-center border-b border-border/40 px-8 py-5 transition-all hover:bg-muted/50"
            >
              <div className="mr-5 flex h-11 w-11 shrink-0 items-center justify-center rounded-lg bg-emerald-500/5 font-bold text-emerald-500">
                <FileCheck className="h-5 w-5" />
              </div>
              <div className="w-56 shrink-0 pr-4">
                <div className="text-[15px] font-semibold text-foreground">{h.month}</div>
                <div className="mt-1 flex items-center gap-1.5 text-[11px] font-bold uppercase tracking-widest text-emerald-400">
                  <CheckCircle2 className="h-3.5 w-3.5" /> {t('timereports.attested')}
                </div>
              </div>

              <div className="flex min-w-0 flex-1 items-center gap-10 pr-4">
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {t('timereports.work_time')}
                  </div>
                  <div className="font-mono text-[14px] font-bold text-foreground">{h.hours}h</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                    {t('timereports.ob_bonus')}
                  </div>
                  <div className="font-mono text-[14px] font-bold text-foreground">{h.ob}h</div>
                </div>
                <div className="flex flex-col gap-1">
                  <div className="text-[10px] font-bold uppercase tracking-widest text-rose-400/40">
                    {t('timereports.absence')}
                  </div>
                  <div className="font-mono text-[14px] font-bold text-foreground">
                    {h.absence > 0 ? `${h.absence}h` : '-'}
                  </div>
                </div>
              </div>

              <div className="flex w-48 shrink-0 flex-col items-end justify-center pr-6">
                <div className="mb-0.5 text-[10px] font-bold uppercase tracking-widest text-muted-foreground/50">
                  {t('timereports.salary_before_tax')}
                </div>
                <span className="text-[16px] font-bold text-foreground">{h.salary}</span>
              </div>

              <div className="flex w-8 shrink-0 items-center justify-end text-muted-foreground/30 transition-all group-hover:translate-x-1 group-hover:text-foreground">
                <ChevronRight className="h-5 w-5" />
              </div>
            </div>
          ))
        )}
      </div>
    )
  }

  return (
    <div className="relative flex h-full flex-1 flex-col bg-background duration-300 animate-in fade-in">
      <div className="flex h-14 shrink-0 items-center gap-8 border-b border-border/50 px-8">
        <button
          onClick={() => setListMode('current')}
          className={`flex h-full items-center gap-2 border-b-2 text-sm font-semibold transition-all duration-200 ${listMode === 'current' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/70'}`}
        >
          {t('timereports.current_reports')}
        </button>
        <button
          onClick={() => setListMode('history')}
          className={`flex h-full items-center gap-2 border-b-2 text-sm font-semibold transition-all duration-200 ${listMode === 'history' ? 'border-primary text-foreground' : 'border-transparent text-muted-foreground hover:text-foreground/70'}`}
        >
          {t('timereports.previous_months')}
        </button>
      </div>

      {listMode === 'history' ? (
        renderHistory()
      ) : (
        <div className="flex min-h-0 flex-1 flex-col">
          <div className="flex h-16 shrink-0 items-center justify-between border-b border-border/50 px-8">
            <div className="flex items-center gap-5">
              <div
                className="group flex w-8 cursor-pointer justify-center"
                onClick={toggleSelectAll}
              >
                <div
                  className={`w-4.5 h-4.5 rounded-[5px] border-2 transition-all ${isAllSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/50'} flex items-center justify-center`}
                >
                  {isAllSelected && (
                    <Check className="h-3.5 w-3.5 stroke-[3] text-primary-foreground" />
                  )}
                </div>
              </div>

              <div className="flex items-center gap-3">
                <Select value={filterType} onValueChange={setFilterType}>
                  <SelectTrigger className="h-9 w-[160px] border-none bg-muted/30 text-xs font-semibold focus:ring-1 focus:ring-primary/20">
                    <SelectValue placeholder={t('timereports.filter_status')} />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">{t('timereports.all_reports')}</SelectItem>
                    <SelectItem value="pending_attest">
                      {t('timereports.pending')} (
                      {filteredShifts.filter((s) => s.status === 'pending_attest').length})
                    </SelectItem>
                    <SelectItem value="approved">
                      {t('timereports.approved')} (
                      {filteredShifts.filter((s) => s.status === 'approved').length})
                    </SelectItem>
                  </SelectContent>
                </Select>
              </div>

              {selectedShifts.length > 0 && (
                <div className="ml-2 flex items-center gap-2 border-l border-border/50 pl-5 duration-300 animate-in fade-in slide-in-from-left-2">
                  {hasApprovePermission && (
                    <Button
                      onClick={handleApprove}
                      size="sm"
                      className="h-8 bg-emerald-500 px-4 text-xs font-bold text-white shadow-lg shadow-emerald-500/20 hover:bg-emerald-600"
                    >
                      <FileCheck className="mr-2 h-3.5 w-3.5" />{' '}
                      {t('timereports.approve_count', { count: selectedShifts.length })}
                    </Button>
                  )}
                  <Button
                    variant="secondary"
                    size="icon"
                    className="h-8 w-8 text-muted-foreground transition-colors hover:bg-rose-500/10 hover:text-rose-500"
                    onClick={() => setIsDeleteAlertOpen(true)}
                  >
                    <Trash2 className="h-4 w-4" />
                  </Button>
                </div>
              )}
            </div>

            <div className="flex items-center gap-5">
              <div className="relative hidden w-56 sm:block">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-muted-foreground/50" />
                <Input
                  placeholder={t('timereports.search_placeholder')}
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="h-9 rounded-lg border-none bg-muted/40 pl-9 text-xs font-medium text-foreground focus-visible:ring-1 focus-visible:ring-primary/30"
                />
              </div>
              <div className="flex items-center gap-3 text-muted-foreground/60">
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage === 1}
                  onClick={() => setCurrentPage((prev) => prev - 1)}
                >
                  <ChevronLeft className="h-4 w-4" />
                </Button>
                <span className="text-[11px] font-bold tracking-widest">
                  {currentPage} / {totalPages}
                </span>
                <Button
                  variant="ghost"
                  size="icon"
                  className="h-8 w-8 rounded-lg"
                  disabled={currentPage === totalPages}
                  onClick={() => setCurrentPage((prev) => prev + 1)}
                >
                  <ChevronRight className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          <div className="scrollbar-none w-full flex-1 overflow-y-auto">
            {filteredShifts.length === 0 ? (
              <EmptyState
                icon={Calendar}
                title={t('timereports.no_reports_title')}
                description={t('timereports.no_reports_desc')}
              />
            ) : (
              currentShifts.map((shift) => {
                const isSelected = selectedShifts.includes(shift.id)
                return (
                  <div
                    key={shift.id}
                    className={`group flex items-center border-b border-border/40 px-8 py-3.5 transition-all duration-200 hover:bg-muted/50 ${isSelected ? 'bg-primary/5' : ''}`}
                  >
                    <div
                      className="flex w-8 shrink-0 cursor-pointer justify-center p-1"
                      onClick={(e) => toggleSelect(shift.id, e)}
                    >
                      <div
                        className={`h-[18px] w-[18px] rounded-[5px] border-2 transition-all ${isSelected ? 'border-primary bg-primary' : 'border-border group-hover:border-primary/40'} flex items-center justify-center`}
                      >
                        {isSelected && (
                          <Check className="h-3.5 w-3.5 stroke-[3] text-primary-foreground" />
                        )}
                      </div>
                    </div>

                    <div className="ml-3 w-48 shrink-0 truncate pr-4 text-[15px] font-semibold text-foreground md:w-64">
                      <div className="transition-colors group-hover:text-primary">
                        {selectedContext.type === 'team' ? shift.employee : shift.team}
                      </div>
                      <div className="mt-0.5 text-[11px] font-medium uppercase tracking-widest text-muted-foreground/70">
                        {selectedContext.type === 'team' ? shift.role : t('timereports.client')}
                      </div>
                    </div>

                    <div className="flex min-w-0 flex-1 items-center pr-4">
                      <div className="rounded-md border border-border/40 bg-secondary/60 px-2.5 py-1.5 font-mono text-[13px] font-bold text-foreground">
                        {shift.start} - {shift.end}
                      </div>
                      <div className="ml-5 flex items-baseline gap-1.5">
                        <span className="text-[16px] font-black text-foreground">
                          {shift.duration}
                        </span>
                        <span className="text-[11px] font-bold uppercase tracking-tighter text-muted-foreground/60">
                          h
                        </span>
                      </div>
                    </div>

                    <div className="flex w-40 shrink-0 items-center justify-end pr-4">
                      <StatusBadge status={shift.status} />
                    </div>

                    <div className="flex w-[120px] shrink-0 items-center justify-end gap-3 text-right text-[14px]">
                      <span className="font-mono text-[13px] font-bold text-foreground">
                        {shift.date}
                      </span>
                    </div>
                  </div>
                )
              })
            )}
          </div>
        </div>
      )}

      <AlertDialog open={isDeleteAlertOpen} onOpenChange={setIsDeleteAlertOpen}>
        <AlertDialogContent>
          <AlertDialogHeader>
            <AlertDialogTitle>{t('timereports.delete_alert.title')}</AlertDialogTitle>
            <AlertDialogDescription>
              {t('timereports.delete_alert.description', { count: selectedShifts.length })}
            </AlertDialogDescription>
          </AlertDialogHeader>
          <AlertDialogFooter>
            <AlertDialogCancel>{t('common.cancel')}</AlertDialogCancel>
            <AlertDialogAction
              onClick={handleDelete}
              className="bg-rose-500 font-bold text-white hover:bg-rose-600"
            >
              {t('timereports.delete_alert.confirm')}
            </AlertDialogAction>
          </AlertDialogFooter>
        </AlertDialogContent>
      </AlertDialog>
    </div>
  )
}
