import { supabase } from '@/lib/supabase';

export interface SendMessagePayload {
  workspace_id: string;
  sender_id: string;
  subject: string;
  body: string;
  is_read: false;
  receiver_id?: string;
  target_team_id?: string;
}

export const messageService = {
  async fetchMessages(workspaceId: string) {
    const { data: messages, error } = await supabase
      .from('messages')
      .select('*, sender:users!messages_sender_id_fkey(*), receiver:users!messages_receiver_id_fkey(*)')
      .eq('workspace_id', workspaceId);

    if (error) throw error;
    return messages;
  },

  async markAsRead(messageId: string) {
    const { data, error } = await supabase
      .from('messages')
      .update({ is_read: true })
      .eq('id', messageId)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async sendMessage(payload: SendMessagePayload) {
    const { data, error } = await supabase
      .from('messages')
      .insert(payload)
      .select()
      .single();

    if (error) throw error;
    return data;
  },

  async deleteMessages(messageIds: string[]) {
    const { error } = await supabase
      .from('messages')
      .delete()
      .in('id', messageIds);

    if (error) throw error;
    return true;
  }
};
