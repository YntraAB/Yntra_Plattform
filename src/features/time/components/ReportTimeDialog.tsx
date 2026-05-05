import React from 'react';
import { Dialog, DialogContent } from '@/components/ui/dialog';

interface ReportTimeDialogProps {
  open: boolean;
  onOpenChange: (open: boolean) => void;
}

export const ReportTimeDialog: React.FC<ReportTimeDialogProps> = ({ open, onOpenChange }) => {
  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="sm:max-w-[320px] bg-[hsl(220,15%,8%)] text-white border-[hsl(220,12%,18%)] shadow-2xl p-0 overflow-hidden rounded-lg gap-0">
        
        <div className="px-4 py-2.5 border-b border-[hsl(220,12%,14%)] bg-[hsl(220,12%,10%)]">
          <h2 className="text-[14px] font-bold text-white tracking-tight">Rapportera tid</h2>
        </div>

        <div className="p-4 flex flex-col gap-3">
          
          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[hsl(220,10%,50%)]">Brukare / Team</label>
            <select className="w-full h-7 bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,20%)] text-[12px] text-white rounded px-2 outline-none focus:border-[hsl(250,85%,65%)]">
              <option value="börje">Börje Olofsson</option>
              <option value="eva">Eva Larsson</option>
            </select>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[hsl(220,10%,50%)]">Datum</label>
            <input 
              type="date" 
              className="w-full h-7 bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,20%)] text-[12px] text-white rounded px-2 outline-none focus:border-[hsl(250,85%,65%)] [color-scheme:dark]"
            />
          </div>

          <div className="flex gap-2">
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[hsl(220,10%,50%)]">Start</label>
              <input 
                type="time" 
                defaultValue="08:00"
                className="w-full h-7 bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,20%)] text-[12px] text-white rounded px-2 outline-none focus:border-[hsl(250,85%,65%)] [color-scheme:dark]"
              />
            </div>
            <div className="flex-1 flex flex-col gap-1">
              <label className="text-[10px] uppercase font-bold text-[hsl(220,10%,50%)]">Slut</label>
              <input 
                type="time" 
                defaultValue="16:00"
                className="w-full h-7 bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,20%)] text-[12px] text-white rounded px-2 outline-none focus:border-[hsl(250,85%,65%)] [color-scheme:dark]"
              />
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[hsl(220,10%,50%)]">Rast (min)</label>
            <input 
              type="number" 
              placeholder="0"
              className="w-full h-7 bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,20%)] text-[12px] text-white rounded px-2 outline-none focus:border-[hsl(250,85%,65%)]"
            />
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-[10px] uppercase font-bold text-[hsl(220,10%,50%)]">Anteckning</label>
            <input 
              type="text"
              placeholder="..."
              className="w-full h-7 bg-[hsl(220,12%,12%)] border border-[hsl(220,12%,20%)] text-[12px] text-white rounded px-2 outline-none focus:border-[hsl(250,85%,65%)]"
            />
          </div>
        </div>

        <div className="px-4 py-3 bg-[hsl(220,12%,10%)] flex justify-end gap-2 border-t border-[hsl(220,12%,14%)]">
          <button 
            onClick={() => onOpenChange(false)}
            className="h-7 px-3 rounded text-[11px] font-bold text-[hsl(220,10%,60%)] hover:text-white hover:bg-[hsl(220,12%,16%)] transition-colors"
          >
            Avbryt
          </button>
          <button 
            onClick={() => onOpenChange(false)}
            className="h-7 px-4 rounded text-[11px] font-bold bg-[hsl(250,85%,65%)] hover:bg-[hsl(250,85%,70%)] text-white transition-colors shadow-md"
          >
            Spara pass
          </button>
        </div>

      </DialogContent>
    </Dialog>
  );
};
