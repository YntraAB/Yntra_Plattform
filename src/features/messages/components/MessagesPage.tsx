import React, { useMemo, useCallback } from 'react';
import { useWorkspace } from '@/contexts/WorkspaceContext';
import { useAuth } from '@/hooks/useAuth';
import { useTranslation } from 'react-i18next';
import { useMessages, useMarkMessageAsRead, useSendMessage, useDeleteMessages } from '@/hooks/queries/useMessages';
import { useWorkspaceTeams, useWorkspaceUsers } from '@/hooks/queries/useWorkspaceData';
import { toast } from 'sonner';
import { useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';

import { MessagesListPane } from './MessagesListPane';
import { MessageReadPane } from './MessageReadPane';
import { MessageComposePane } from './MessageComposePane';
import { useMessagesState } from '../hooks/useMessagesState';
import { transformMessages } from '../utils/messageTransformers';
import { useSearchParams } from 'react-router-dom';

export const MessagesPage: React.FC = () => {
  const { workspaceId } = useWorkspace();
  const { user } = useAuth();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();

  const queryClient = useQueryClient();
  const deleteTimeoutRef = React.useRef<ReturnType<typeof setTimeout> | null>(null);

  const { data: teams = [] } = useWorkspaceTeams(workspaceId || null);
  const { data: users = [] } = useWorkspaceUsers(workspaceId || null);

  const { data: processedMessages = [], isLoading: isLoadingMessages } = useMessages(workspaceId || undefined, {
    select: (data) => transformMessages(data, teams, user, t)
  });

  const markAsReadMutation = useMarkMessageAsRead(workspaceId || undefined);
  const sendMessageMutation = useSendMessage(workspaceId || undefined);
  const deleteMessagesMutation = useDeleteMessages(workspaceId || undefined);



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

  // Handle deep-linking from search params
  React.useEffect(() => {
    const messageId = searchParams.get('messageId');
    if (messageId && processedMessages.length > 0) {
      const msg = processedMessages.find(m => m.id === messageId);
      if (msg) {
        setIsComposing(false);
        setActiveMessageId(messageId);
        if (msg.unread) {
          markAsReadMutation.mutate(messageId);
        }
      }
    }
  }, [searchParams, processedMessages.length, setIsComposing, setActiveMessageId, processedMessages, markAsReadMutation]);

  const { selectedTeamId } = useWorkspace();

  const filteredMessages = useMemo(() => {
    return processedMessages.filter(m => {
      if (selectedTeamId) {
        // If viewing a specific team, show messages to that team OR personal inbox/sent items?
        // Let's stick to only showing items related to that team if filter is active.
        if (m.target_team_id !== selectedTeamId) return false;
      }

      const searchMatch = m.subject.toLowerCase().includes(searchQuery.toLowerCase()) ||
        m.sender.name.toLowerCase().includes(searchQuery.toLowerCase());

      if (!searchMatch) return false;

      if (filterType === 'inbox') return m.folderId === 'inbox';
      if (filterType === 'unread') return m.folderId === 'inbox' && m.unread === true;
      if (filterType === 'sent') return m.folderId === 'sent';
      if (filterType === 'archive') return m.folderId === 'archive';
      if (filterType === 'trash') return m.folderId === 'trash';

      return false;
    });
  }, [processedMessages, filterType, searchQuery, selectedTeamId]);

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
    if (selectedMsgs.length === 0) return;

    const msgsToDelete = [...selectedMsgs];
    const queryKey = queryKeys.messages(workspaceId || undefined);

    // Snapshot the current data
    const previousMessages = queryClient.getQueryData(queryKey);

    // Optimistically update the cache
    queryClient.setQueryData(queryKey, (old: any[] = []) =>
      old.filter(m => !msgsToDelete.includes(m.id))
    );

    setSelectedMsgs([]);

    // Clear any existing timeout
    if (deleteTimeoutRef.current) {
      clearTimeout(deleteTimeoutRef.current);
    }

    toast.success(t('messages.messages_deleted'), {
      duration: 5000,
      action: {
        label: t('common.undo') || 'Ångra',
        onClick: () => {
          if (deleteTimeoutRef.current) {
            clearTimeout(deleteTimeoutRef.current);
            deleteTimeoutRef.current = null;
          }
          // Restore the cache
          queryClient.setQueryData(queryKey, previousMessages);
          toast.dismiss();
          toast.info(t('messages.undo_successful') || "Radering ångrad");
        }
      }
    });

    // Delay the actual mutation
    deleteTimeoutRef.current = setTimeout(() => {
      deleteMessagesMutation.mutate(msgsToDelete, {
        onError: (error) => {
          toast.error(t('messages.error_deleting') + ": " + error.message);
          // Rollback on error if not already undone
          queryClient.setQueryData(queryKey, previousMessages);
        }
      });
      deleteTimeoutRef.current = null;
    }, 5000);

  }, [workspaceId, queryClient, selectedMsgs, setSelectedMsgs, t, deleteMessagesMutation]);

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
