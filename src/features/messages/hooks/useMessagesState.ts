import { useState, useMemo } from 'react';
import type { ComposeData, ProcessedMessage } from '../types';

export const useMessagesState = (processedMessages: ProcessedMessage[]) => {
  const [filterType, setFilterType] = useState('inbox');
  const [activeMessageId, setActiveMessageId] = useState<string | null>(null);
  const [searchQuery, setSearchQuery] = useState('');
  const [currentPage, setCurrentPage] = useState(1);
  const [selectedMsgs, setSelectedMsgs] = useState<string[]>([]);

  const [isComposing, setIsComposing] = useState(false);
  const [composeData, setComposeData] = useState<ComposeData>({
    targetType: 'user',
    targetId: '',
    subject: '',
    content: '',
    quote: null
  });

  const activeMessage = useMemo(() => {
    return processedMessages.find(m => m.id === activeMessageId) || null;
  }, [processedMessages, activeMessageId]);

  return {
    filterType, setFilterType,
    activeMessageId, setActiveMessageId,
    searchQuery, setSearchQuery,
    currentPage, setCurrentPage,
    selectedMsgs, setSelectedMsgs,
    isComposing, setIsComposing,
    composeData, setComposeData,
    activeMessage
  };
};
