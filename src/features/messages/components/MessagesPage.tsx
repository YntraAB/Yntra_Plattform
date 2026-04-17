import React, { useMemo, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useMessages, useMarkMessageAsRead, useSendMessage, useDeleteMessages } from '@/hooks/queries/useMessages';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import { toast } from 'sonner';

import { MessagesListPane } from './MessagesListPane';
import { MessageReadPane } from './MessageReadPane';
import { MessageComposePane } from './MessageComposePane';
import { useMessagesState } from '../hooks/useMessagesState';
import type { ProcessedMessage } from '../types';

export const MessagesPage: React.FC = () => {
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  const { t } = useTranslation();

  const { data: rawMessages = [], isLoading: isLoadingMessages } = useMessages(workspaceId || undefined);
  const { data: teams = [] } = useWorkspaceTeams(workspaceId || null);
  const { data: users = [] } = useWorkspaceUsers(workspaceId || null);

  const markAsReadMutation = useMarkMessageAsRead(workspaceId || undefined);
  const sendMessageMutation = useSendMessage(workspaceId || undefined);
  const deleteMessagesMutation = useDeleteMessages(workspaceId || undefined);

  const processedMessages: ProcessedMessage[] = useMemo(() => {
    return rawMessages.map((m: any) => {
      let toName = t('messages.you');
      if (m.target_team_id) {
        toName = teams.find(t => t.id === m.target_team_id)?.name || t('common.team');
      } else if (m.receiver_id === user?.id) {
        toName = t('messages.you');
      } else {
        const rcvrData = Array.isArray(m.receiver) ? m.receiver[0] : m.receiver;
        toName = rcvrData ? (rcvrData.full_name || rcvrData.email || t('messages.anonymous')) : t('messages.anonymous');
      }

      const sndrData = Array.isArray(m.sender) ? m.sender[0] : m.sender;
      const senderName = sndrData ? (sndrData.full_name || sndrData.email || t('messages.system')) : t('messages.system');

      return {
        id: m.id,
        sender_id: m.sender_id,
        receiver_id: m.receiver_id,
        target_team_id: m.target_team_id,
        folderId: m.sender_id === user?.id ? 'sent' : 'inbox' as const,
        sender: { name: senderName, avatar: '' },
        to: toName,
        isTeamMessage: !!m.target_team_id,
        subject: m.subject || t('messages.no_header'),
        snippet: m.body ? m.body.substring(0, 40) + '...' : '',
        content: m.body,
        timestamp: new Date(m.created_at).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        date: new Date(m.created_at).toLocaleDateString(),
        unread: !m.is_read
      };
    });
  }, [rawMessages, teams, user, t]);

  const {
    filterType, setFilterType,
    activeMessageId, setActiveMessageId,
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    selectedMsgs, setSelectedMsgs,
    isComposing, setIsComposing,
    composeData, setComposeData,
    activeMessage
  } = useMessagesState(processedMessages);

  const filteredMessages = useMemo(() => {
    return processedMessages.filter(m => {
      const searchMatch = m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender.name.toLowerCase().includes(searchQuery.toLowerCase());

      let match = false;
      if (filterType === 'inbox') match = m.folderId === 'inbox';
      if (filterType === 'unread') match = m.folderId === 'inbox' && m.unread === true;
      if (filterType === 'sent') match = m.folderId === 'sent';
      if (filterType === 'archive') match = m.folderId === 'archive';
      if (filterType === 'trash') match = m.folderId === 'trash';

      return searchMatch && match;
    });
  }, [processedMessages, filterType, searchQuery]);

  const itemsPerPage = 10;
  const totalPages = Math.max(1, Math.ceil(filteredMessages.length / itemsPerPage));
  const currentMessages = filteredMessages.slice((currentPage - 1) * itemsPerPage, currentPage * itemsPerPage);

  React.useEffect(() => {
    setCurrentPage(1);
  }, [filterType, searchQuery, setCurrentPage]);

  const handleSelectMessage = useCallback((id: string) => {
    setIsComposing(false);
    setActiveMessageId(id);
    const msg = processedMessages.find(m => m.id === id);
    if (msg && msg.unread) {
      markAsReadMutation.mutate(id);
    }
  }, [processedMessages, setIsComposing, setActiveMessageId, markAsReadMutation]);

  const handleCompose = useCallback(() => {
    setActiveMessageId(null);
    setComposeData({ targetType: 'user', targetId: '', subject: '', content: '', quote: null });
    setIsComposing(true);
  }, [setActiveMessageId, setComposeData, setIsComposing]);

  const handleSendMessage = useCallback(() => {
    if (!workspaceId || !user || !composeData.targetId || !composeData.content) {
      toast.error(t('messages.fill_required_fields'));
      return;
    }

    const payload: any = {
      workspace_id: workspaceId,
      sender_id: user.id,
      subject: composeData.subject || t('messages.no_header'),
      body: composeData.content,
      is_read: false
    };

    if (composeData.targetType === 'user') {
      payload.receiver_id = composeData.targetId;
    } else {
      payload.target_team_id = composeData.targetId;
    }

    sendMessageMutation.mutate(payload, {
      onSuccess: () => {
        setIsComposing(false);
        toast.success(t('messages.message_sent'));
      },
      onError: (error) => {
        toast.error(t('messages.error_sending') + ": " + error.message);
      }
    });
  }, [workspaceId, user, composeData, t, sendMessageMutation, setIsComposing]);

  const handleDeleteSelected = useCallback(() => {
    deleteMessagesMutation.mutate(selectedMsgs, {
      onSuccess: () => {
        setSelectedMsgs([]);
        toast.success(t('messages.messages_deleted'));
      },
      onError: (error) => {
        toast.error(t('messages.error_deleting') + ": " + error.message);
      }
    });
  }, [deleteMessagesMutation, selectedMsgs, setSelectedMsgs, t]);

  const handleReply = useCallback(() => {
    if (activeMessage) {
      setComposeData({
        targetType: activeMessage.isTeamMessage ? 'team' : 'user',
        targetId: activeMessage.sender_id,
        subject: activeMessage.subject.startsWith('Svar:') ? activeMessage.subject : `Svar: ${activeMessage.subject}`,
        content: '',
        quote: {
          type: 'reply',
          sender: activeMessage.sender.name,
          date: activeMessage.date,
          timestamp: activeMessage.timestamp,
          subject: activeMessage.subject,
          content: activeMessage.content
        }
      });
      setActiveMessageId(null);
      setIsComposing(true);
    }
  }, [activeMessage, setComposeData, setActiveMessageId, setIsComposing]);

  const handleForward = useCallback(() => {
    if (activeMessage) {
      setComposeData({
        targetType: 'user',
        targetId: '',
        subject: activeMessage.subject.startsWith('VB:') ? activeMessage.subject : `VB: ${activeMessage.subject}`,
        content: '',
        quote: {
          type: 'forward',
          sender: activeMessage.sender.name,
          date: activeMessage.date,
          timestamp: activeMessage.timestamp,
          subject: activeMessage.subject,
          content: activeMessage.content
        }
      });
      setActiveMessageId(null);
      setIsComposing(true);
    }
  }, [activeMessage, setComposeData, setActiveMessageId, setIsComposing]);

  if (isComposing) {
    return (
      <MessageComposePane
        composeData={composeData}
        setComposeData={setComposeData}
        isSending={sendMessageMutation.isPending}
        handleSendMessage={handleSendMessage}
        setIsComposing={setIsComposing}
        users={users}
        teams={teams}
        currentUserId={user?.id}
      />
    );
  }

  if (activeMessageId && activeMessage) {
    return (
      <MessageReadPane
        activeMessage={activeMessage}
        currentUserId={user?.id}
        setActiveMessageId={setActiveMessageId}
        handleReply={handleReply}
        handleForward={handleForward}
      />
    );
  }

  return (
    <MessagesListPane
      messages={currentMessages}
      isLoading={isLoadingMessages}
      filterType={filterType}
      setFilterType={setFilterType}
      searchQuery={searchQuery}
      setSearchQuery={setSearchQuery}
      currentPage={currentPage}
      setCurrentPage={setCurrentPage}
      totalPages={totalPages}
      handleSelectMessage={handleSelectMessage}
      handleCompose={handleCompose}
      selectedMsgs={selectedMsgs}
      setSelectedMsgs={setSelectedMsgs}
      handleDeleteSelected={handleDeleteSelected}
    />
  );
};
