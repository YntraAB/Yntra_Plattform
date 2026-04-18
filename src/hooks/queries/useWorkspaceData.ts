import { useQuery, useQueryClient } from '@tanstack/react-query';
import { queryKeys } from '@/lib/query-keys';
import { supabase } from '@/lib/supabase';
import { useEffect, useMemo, useCallback } from 'react';
import { teamService } from '@/services/teamService';
import { userService } from '@/services/userService';
import { workspaceService } from '@/services/workspaceService';
import { noteService } from '@/services/noteService';
import type { WorkspaceSettings, WorkspaceModules, UserPreferences } from '@/types';

export function useWorkspaceTeams(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => queryKeys.workspaceTeams(workspaceId), [workspaceId]);

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
  }, [workspaceId, queryClient, queryKey]);

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
  const queryKey = useMemo(() => queryKeys.workspaceUsers(workspaceId), [workspaceId]);

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
  }, [workspaceId, queryClient, queryKey]);

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
  const queryKey = useMemo(() => queryKeys.workspace(workspaceId), [workspaceId]);

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
  }, [workspaceId, queryClient, queryKey]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return null;
      return workspaceService.getWorkspace(workspaceId);
    },
    enabled: !!workspaceId,
  });

  const updateSettings = useCallback(async (settings: Partial<WorkspaceSettings>) => {
    if (!workspaceId) {
      console.error('Cannot update settings: No workspace ID');
      return;
    }
    await workspaceService.updateSettings(workspaceId, settings);
    queryClient.invalidateQueries({ queryKey });
  }, [workspaceId, queryClient, queryKey]);

  const updateModules = useCallback(async (modules_active: Partial<WorkspaceModules>) => {
    if (!workspaceId) {
      console.error('Cannot update modules: No workspace ID');
      return;
    }
    await workspaceService.updateModules(workspaceId, modules_active);
    queryClient.invalidateQueries({ queryKey });
  }, [workspaceId, queryClient, queryKey]);

  return useMemo(() => ({
    ...query,
    updateSettings,
    updateModules
  }), [query, updateSettings, updateModules]);
}

export function useUserPreferences(userId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => queryKeys.userPreferences(userId), [userId]);

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
  }, [userId, queryClient, queryKey]);

  const query = useQuery({
    queryKey,
    queryFn: async () => {
      if (!userId) return null;
      return userService.getUserPreferences(userId);
    },
    enabled: !!userId,
  });

  const updatePreferences = useCallback(async (preferences: Partial<UserPreferences>) => {
    if (!userId) {
      console.error('Cannot update preferences: No user ID');
      return;
    }
    await userService.updateUserPreferences(userId, preferences);
    queryClient.invalidateQueries({ queryKey });
  }, [userId, queryClient, queryKey]);

  return useMemo(() => ({
    ...query,
    updatePreferences
  }), [query, updatePreferences]);
}

export function useWorkspaceNotes(workspaceId: string | null) {
  const queryClient = useQueryClient();
  const queryKey = useMemo(() => queryKeys.workspaceNotes(workspaceId), [workspaceId]);

  useEffect(() => {
    if (!workspaceId) return;

    const channelId = `notes-${workspaceId}-${Math.random().toString(36).slice(2, 9)}`;
    const channel = supabase.channel(channelId)
      .on('postgres_changes', {
        event: '*',
        schema: 'public',
        table: 'work_notes',
        filter: `workspace_id=eq.${workspaceId}`
      }, () => {
        queryClient.invalidateQueries({ queryKey });
      })
      .subscribe();

    return () => {
      supabase.removeChannel(channel);
    };
  }, [workspaceId, queryClient, queryKey]);

  return useQuery({
    queryKey,
    queryFn: async () => {
      if (!workspaceId) return [];
      return noteService.getWorkspaceNotes(workspaceId);
    },
    enabled: !!workspaceId,
  });
}

