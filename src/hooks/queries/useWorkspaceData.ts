import { useQuery, useQueryClient } from '@tanstack/react-query';
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo } from 'react';
import { teamService } from '@/services/teamService';
import { userService } from '@/services/userService';
import { workspaceService } from '@/services/workspaceService';
import type { WorkspaceSettings, WorkspaceModules, UserPreferences } from '@/types';

export function useWorkspaceTeams(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['teams', workspaceId];

  useEffect(() => {
    if (!workspaceId) return;

    const channelId = `teams-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'teams',
        filter: `workspace_id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, JSON.stringify(queryKey)]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      return teamService.getWorkspaceTeams(workspaceId);
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceUsers(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['users', workspaceId];

  useEffect(() => {
    if (!workspaceId) return;

    const channelId = `users-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'users',
        filter: `workspace_id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, JSON.stringify(queryKey)]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      return userService.getWorkspaceUsers(workspaceId);
    },
    enabled: !!workspaceId,
  });
}

export function useWorkspaceInfo(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['workspace', workspaceId];

  useEffect(() => {
    if (!workspaceId) return;

    const channelId = `workspace-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'workspaces',
        filter: `id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, JSON.stringify(queryKey)]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return null;
      return workspaceService.getWorkspace(workspaceId);
    },
    enabled: !!workspaceId,
  });

  const updateSettings = async (settings: Partial<WorkspaceSettings>) => {
    if (!workspaceId) return;
    await workspaceService.updateSettings(workspaceId, settings);
    queryClient.invalidateQueries({ queryKey });
  };

  const updateModules = async (modules_active: Partial<WorkspaceModules>) => {
    if (!workspaceId) return;
    await workspaceService.updateModules(workspaceId, modules_active);
    queryClient.invalidateQueries({ queryKey });
  };

  return useMemo(() => ({
    ...query,
    updateSettings,
    updateModules
  }), [query, updateSettings, updateModules]);
}

export function useUserPreferences(userId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = ['user-preferences', userId];

  useEffect(() => {
    if (!userId) return;

    const channelId = `user-prefs-${userId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: 'UPDATE',
        schema: 'public',
        table: 'users',
        filter: `id=eq.${userId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [userId, queryClient, JSON.stringify(queryKey)]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return null;
      return userService.getUserPreferences(userId);
    },
    enabled: !!userId,
  });

  const updatePreferences = async (preferences: Partial<UserPreferences>) => {
    if (!userId) return;
    await userService.updateUserPreferences(userId, preferences);
    queryClient.invalidateQueries({ queryKey });
  };

  return useMemo(() => ({
    ...query,
    updatePreferences
  }), [query, updatePreferences]);
}
