import React, { useState, useEffect } from 'react'
import { supabase } from '@/lib/supabase'
import { Loader2, Plus, Pill } from 'lucide-react'
import { Button } from '@/components/ui/button'

interface Medication {
  id: string
  name: string
  dosage: string
  time_to_take: string
  is_active: boolean
}

export const MedicationTab: React.FC<{ clientId: string }> = ({ clientId }) => {
  const [meds, setMeds] = useState<Medication[]>([])
  const [isLoading, setIsLoading] = useState(true)

  const fetchMeds = React.useCallback(async () => {
    try {
      const { data } = await supabase
        .from('client_medications')
        .select('*')
        .eq('client_id', clientId)
        .eq('is_active', true)
        .order('created_at', { ascending: false })
      if (data) setMeds(data as Medication[])
    } catch (e) {
      console.error(e)
    } finally {
      setIsLoading(false)
    }
  }, [clientId])

  useEffect(() => {
    fetchMeds()
  }, [clientId, fetchMeds])

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-semibold">Aktiv Medicinlista</h3>
        <Button size="sm" variant="outline" className="border-border">
          <Plus className="mr-2 h-4 w-4" /> Lägg till recept
        </Button>
      </div>

      {isLoading ? (
        <div className="flex justify-center py-8">
          <Loader2 className="h-6 w-6 animate-spin text-primary" />
        </div>
      ) : meds.length === 0 ? (
        <div className="rounded-xl border border-dashed border-border bg-sidebar py-12 text-center text-muted-foreground">
          <Pill className="mx-auto mb-4 h-12 w-12 opacity-50" />
          Brukaren har ingen aktiv medicin inlagd.
        </div>
      ) : (
        <div className="grid grid-cols-1 gap-4 md:grid-cols-2">
          {meds.map((med) => (
            <div
              key={med.id}
              className="flex items-start gap-4 rounded-xl border border-border bg-sidebar p-5 shadow-sm"
            >
              <div className="flex h-12 w-12 shrink-0 items-center justify-center rounded-full bg-blue-500/10 text-blue-500">
                <Pill className="h-6 w-6" />
              </div>
              <div>
                <h4 className="text-lg font-bold text-foreground">{med.name}</h4>
                <div className="mt-1 text-sm text-muted-foreground">
                  Dos: <span className="font-medium text-foreground">{med.dosage}</span>
                </div>
                <div className="text-sm text-muted-foreground">
                  Tid: <span className="font-medium text-foreground">{med.time_to_take}</span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
