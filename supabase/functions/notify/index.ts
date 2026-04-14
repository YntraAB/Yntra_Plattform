import { serve } from "https://deno.land/std@0.168.0/http/server.ts"
import { createClient } from "https://esm.sh/@supabase/supabase-js@2"

const RESEND_API_KEY = (Deno as any).env.get("RESEND_API_KEY")
const SUPABASE_URL = (Deno as any).env.get("SUPABASE_INTERNAL_URL") // Or SUPABASE_URL
const SUPABASE_SERVICE_ROLE_KEY = (Deno as any).env.get("SUPABASE_SERVICE_ROLE_KEY")

const corsHeaders = {
  'Access-Control-Allow-Origin': '*',
  'Access-Control-Allow-Headers': 'authorization, x-client-info, apikey, content-type',
}

serve(async (req: Request) => {
  if (req.method === 'OPTIONS') {
    return new Response('ok', { headers: corsHeaders })
  }

  try {
    const supabase = createClient(
      SUPABASE_URL!,
      SUPABASE_SERVICE_ROLE_KEY!
    )

    const payload = await req.json()
    const { table, type, record } = payload

    if (type !== 'INSERT' && type !== 'UPDATE') {
      return new Response(JSON.stringify({ message: 'Ignore' }), { headers: { ...corsHeaders, 'Content-Type': 'application/json' } })
    }

    let notifications: { email: string, subject: string, body: string }[] = []

    if (table === 'messages' && type === 'INSERT') {
      const msg = record
      if (msg.receiver_id) {
        // Individual message
        const { data: user } = await supabase.from('users').select('email, full_name, notifications_on, notification_type').eq('id', msg.receiver_id).single()
        if (user?.notifications_on) {
          notifications.push({
            email: user.email,
            subject: `Nytt meddelande: ${msg.subject || 'Ingen rubrik'}`,
            body: user.notification_type === 'alert_only'
              ? `Du har fått ett nytt meddelande i Inkorg från ${msg.sender_id || 'System'}.`
              : `Nytt meddelande från ${msg.sender_id}:\n\n${msg.body}`
          })
        }
      } else if (msg.target_team_id) {
        // Team message
        const { data: members } = await supabase.from('team_members').select('user_id').eq('team_id', msg.target_team_id)
        if (members) {
          const userIds = members.map(m => m.user_id)
          const { data: users } = await supabase.from('users').select('email, notifications_on, notification_type').in('id', userIds)
          users?.forEach(u => {
            if (u.notifications_on) {
              notifications.push({
                email: u.email,
                subject: `Team-meddelande: ${msg.subject || 'Ingen rubrik'}`,
                body: u.notification_type === 'alert_only'
                  ? `Ditt team har fått ett nytt meddelande i Inkorg.`
                  : `Nytt team-meddelande:\n\n${msg.body}`
              })
            }
          })
        }
      }
    } else if (table === 'time_reports' && type === 'UPDATE') {
      const report = record
      if (report.status === 'approved') {
        const { data: user } = await supabase.from('users').select('email, notifications_on, notification_type').eq('id', report.user_id).single()
        if (user?.notifications_on) {
          notifications.push({
            email: user.email,
            subject: `Din tidsrapport har blivit godkänd`,
            body: `Hej!\n\nDin tidsrapport för ${report.date} (${report.hours}h) har blivit godkänd av din chef.`
          })
        }
      }
    }

    // Send emails via Resend
    for (const note of notifications) {
      await fetch('https://api.resend.com/emails', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${RESEND_API_KEY}`,
        },
        body: JSON.stringify({
          from: 'Yntra <notifications@yntra.se>', // Replace with your verified domain
          to: [note.email],
          subject: note.subject,
          text: note.body,
        }),
      })
    }

    return new Response(JSON.stringify({ success: true, count: notifications.length }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 200,
    })
  } catch (error) {
    return new Response(JSON.stringify({ error: error.message }), {
      headers: { ...corsHeaders, 'Content-Type': 'application/json' },
      status: 400,
    })
  }
})
