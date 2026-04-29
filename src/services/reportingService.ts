import { supabase } from '@/lib/supabase'

export interface Report {
  id: string
  type: string
  content: Record<string, unknown>
  status: string
  is_anonymous: boolean
  created_at: string
  user?: {
    full_name: string
  }
}

export const reportingService = {
  async getReports(workspaceId: string, options: { isAdmin: boolean; userId: string; status?: string; type?: string }) {
    let query = supabase
      .from('reports')
      .select(`
        *,
        user:users(full_name)
      `)
      .eq('workspace_id', workspaceId)

    if (!options.isAdmin) {
      query = query.eq('user_id', options.userId)
    }

    if (options.status && options.status !== 'all') {
      query = query.eq('status', options.status)
    }

    if (options.type && options.type !== 'all') {
      query = query.eq('type', options.type)
    }

    const { data, error } = await query.order('created_at', { ascending: false })

    if (error) throw error
    return data as Report[]
  },

  async updateReportStatus(reportId: string, status: string) {
    const { error } = await supabase
      .from('reports')
      .update({ status })
      .eq('id', reportId)

    if (error) throw error
  },

  async createReport(report: Record<string, unknown>) {
    const { error } = await supabase.from('reports').insert(report)
    if (error) throw error
  },

  async getReportingStats(workspaceId: string) {
    const { data, error } = await supabase
      .from('reports')
      .select('type, status')
      .eq('workspace_id', workspaceId)

    if (error) throw error
    return data
  }
}
