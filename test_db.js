import { createClient } from '@supabase/supabase-js'
import fs from 'fs'

const envContent = fs.readFileSync('.env', 'utf-8')
const envVars = Object.fromEntries(
  envContent.split('\n')
    .filter(line => line.includes('='))
    .map(line => line.split('=').map(part => part.trim()))
)

const supabaseUrl = envVars.VITE_SUPABASE_URL
const supabaseKey = envVars.VITE_SUPABASE_ANON_KEY

const supabase = createClient(supabaseUrl, supabaseKey)

async function test() {
  const { data: workspaces } = await supabase.from('workspaces').select('id').limit(1)
  const workspaceId = workspaces?.[0]?.id

  const { data: users } = await supabase.from('users').select('id').limit(1)
  const userId = users?.[0]?.id

  const fakeShifts = [
    {
      workspace_id: workspaceId,
      user_id: userId,
      assignee_id: userId,
      title: 'Morgonpass Brukare A',
      start_time: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
      end_time: new Date(Date.now() - 16 * 60 * 60 * 1000).toISOString(),
      metadata: { category: 'shift' }
    }
  ]
  const { data, error } = await supabase.from('events').insert(fakeShifts).select()
  console.log("Insert Error:", error)
  console.log("Insert Data:", data)
}
test()
