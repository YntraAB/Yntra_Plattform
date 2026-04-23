-- YNTRA PLATFORM - SQL schema for Supabase
-- Paste this into the Supabase SQL Editor and run it.

ALTER TABLE IF EXISTS public.users
  DROP CONSTRAINT IF EXISTS only_one_platform_admin;

DROP INDEX IF EXISTS public.only_one_platform_admin;

-- Create workspaces
CREATE TABLE IF NOT EXISTS workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  modules_active JSONB NOT NULL DEFAULT '{"school": false, "assistance": false}',
  settings JSONB NOT NULL DEFAULT '{"timezone": "Europe/Stockholm", "week_start": 1, "language": "sv", "business_hours": {"start": 7, "end": 17}}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create users linked to Supabase Auth
CREATE TABLE IF NOT EXISTS users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  phone TEXT,
  role TEXT DEFAULT 'user',
  notifications_on BOOLEAN DEFAULT TRUE,
  notification_type TEXT DEFAULT 'full_content',
  preferences JSONB NOT NULL DEFAULT '{"theme": "system", "calendar_density": "relaxed", "font_scale": 100}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Platform admin email allowlist
CREATE TABLE IF NOT EXISTS platform_admin_allowlist (
  email TEXT PRIMARY KEY,
  created_at TIMESTAMP WITH TIME ZONE NOT NULL DEFAULT NOW(),
  CONSTRAINT platform_admin_allowlist_email_lowercase CHECK (email = lower(email))
);

-- Create events
CREATE TABLE IF NOT EXISTS events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL,
  team_id UUID,
  assignee_id UUID REFERENCES users(id) ON DELETE SET NULL,
  title TEXT NOT NULL,
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create teams
CREATE TABLE IF NOT EXISTS teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create workspace roles
CREATE TABLE IF NOT EXISTS workspace_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create team memberships
CREATE TABLE IF NOT EXISTS team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES workspace_roles(id) ON DELETE SET NULL,
  notes_last_read_at TIMESTAMP WITH TIME ZONE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- Create messages
CREATE TABLE IF NOT EXISTS messages (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  sender_id UUID REFERENCES users(id) ON DELETE SET NULL,
  receiver_id UUID REFERENCES users(id) ON DELETE SET NULL,
  target_team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  subject TEXT,
  body TEXT,
  is_read BOOLEAN DEFAULT FALSE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create work notes
CREATE TABLE IF NOT EXISTS work_notes (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  author_id UUID REFERENCES users(id) ON DELETE SET NULL,
  subject TEXT NOT NULL,
  content TEXT NOT NULL,
  edit_history JSONB NOT NULL DEFAULT '[]',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create time reports
CREATE TABLE IF NOT EXISTS time_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  start_time TIME,
  end_time TIME,
  hours DECIMAL(4,2) NOT NULL,
  note TEXT,
  status TEXT DEFAULT 'pending_attest',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Notification trigger logic
CREATE OR REPLACE FUNCTION public.handle_new_notification()
RETURNS TRIGGER AS $$
BEGIN
  PERFORM
    net.http_post(
      url := 'https://' || current_setting('app.settings.supabase_project_id') || '.functions.supabase.co/notify',
      headers := jsonb_build_object(
        'Content-Type', 'application/json',
        'Authorization', 'Bearer ' || current_setting('app.settings.supabase_anon_key')
      ),
      body := jsonb_build_object(
        'table', TG_TABLE_NAME,
        'type', TG_OP,
        'record', row_to_json(NEW)
      )
    );
  RETURN NEW;
END;
$$ LANGUAGE plpgsql SECURITY DEFINER;

DROP TRIGGER IF EXISTS on_message_created ON messages;
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_notification();

DROP TRIGGER IF EXISTS on_time_report_status_change ON time_reports;
CREATE TRIGGER on_time_report_status_change
  AFTER UPDATE OF status ON time_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_new_notification();

-- Private helper functions for RLS
CREATE SCHEMA IF NOT EXISTS private;

ALTER TABLE public.platform_admin_allowlist ENABLE ROW LEVEL SECURITY;

CREATE OR REPLACE FUNCTION private.is_platform_admin_email(candidate_email TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT EXISTS (
    SELECT 1
    FROM public.platform_admin_allowlist pal
    WHERE pal.email = lower(candidate_email)
  )
$$;

CREATE OR REPLACE FUNCTION private.resolve_user_full_name(raw_meta JSONB, fallback_email TEXT)
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = ''
STABLE
AS $$
  SELECT COALESCE(
    NULLIF(trim(raw_meta ->> 'full_name'), ''),
    NULLIF(trim(raw_meta ->> 'name'), ''),
    NULLIF(trim(raw_meta ->> 'user_name'), ''),
    fallback_email
  )
$$;

CREATE OR REPLACE FUNCTION private.sync_public_user_from_auth()
RETURNS TRIGGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  resolved_email TEXT;
  resolved_role TEXT;
  resolved_full_name TEXT;
BEGIN
  resolved_email := lower(new.email);
  resolved_role := CASE
    WHEN private.is_platform_admin_email(resolved_email) THEN 'platform_admin'
    ELSE 'user'
  END;
  resolved_full_name := private.resolve_user_full_name(new.raw_user_meta_data, resolved_email);

  INSERT INTO public.users (id, email, full_name, role)
  VALUES (new.id, resolved_email, resolved_full_name, resolved_role)
  ON CONFLICT (id) DO UPDATE
  SET email = excluded.email,
      full_name = COALESCE(excluded.full_name, public.users.full_name),
      role = CASE
        WHEN private.is_platform_admin_email(excluded.email) THEN 'platform_admin'
        WHEN public.users.role = 'platform_admin' THEN public.users.role
        ELSE COALESCE(public.users.role, excluded.role)
      END;

  RETURN new;
END;
$$;

DROP TRIGGER IF EXISTS on_auth_user_synced ON auth.users;
CREATE TRIGGER on_auth_user_synced
  AFTER INSERT OR UPDATE OF email, raw_user_meta_data ON auth.users
  FOR EACH ROW EXECUTE FUNCTION private.sync_public_user_from_auth();

CREATE OR REPLACE FUNCTION private.sync_platform_admin_allowlist()
RETURNS INTEGER
LANGUAGE plpgsql
SECURITY DEFINER
SET search_path = ''
AS $$
DECLARE
  affected INTEGER;
BEGIN
  UPDATE public.users
  SET role = 'platform_admin',
      email = lower(public.users.email)
  WHERE lower(public.users.email) IN (
    SELECT email FROM public.platform_admin_allowlist
  );

  GET DIAGNOSTICS affected = ROW_COUNT;
  RETURN affected;
END;
$$;

CREATE OR REPLACE FUNCTION private.current_user_role()
RETURNS TEXT
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT role
  FROM public.users
  WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.current_user_workspace_id()
RETURNS UUID
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT workspace_id
  FROM public.users
  WHERE id = auth.uid()
$$;

CREATE OR REPLACE FUNCTION private.is_platform_admin()
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(private.current_user_role() = 'platform_admin', false)
$$;

CREATE OR REPLACE FUNCTION private.is_workspace_admin(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    private.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = auth.uid()
        AND workspace_id = target_workspace_id
        AND role = 'admin'
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION private.is_workspace_member(target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    auth.uid() IS NOT NULL
    AND (
      private.is_platform_admin()
      OR EXISTS (
        SELECT 1
        FROM public.users
        WHERE id = auth.uid()
          AND workspace_id = target_workspace_id
      )
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION private.is_team_member(target_team_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    auth.uid() IS NOT NULL
    AND EXISTS (
      SELECT 1
      FROM public.team_members tm
      WHERE tm.team_id = target_team_id
        AND tm.user_id = auth.uid()
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION private.team_in_workspace(target_team_id UUID, target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.teams
      WHERE id = target_team_id
        AND workspace_id = target_workspace_id
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION private.user_in_workspace(target_user_id UUID, target_workspace_id UUID)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    EXISTS (
      SELECT 1
      FROM public.users
      WHERE id = target_user_id
        AND workspace_id = target_workspace_id
    ),
    false
  )
$$;

CREATE OR REPLACE FUNCTION private.can_manage_team(target_team_id UUID, permission_key TEXT)
RETURNS BOOLEAN
LANGUAGE sql
SECURITY DEFINER
SET search_path = public
STABLE
AS $$
  SELECT COALESCE(
    private.is_platform_admin()
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = target_team_id
        AND private.is_workspace_admin(t.workspace_id)
    )
    OR EXISTS (
      SELECT 1
      FROM public.team_members tm
      JOIN public.workspace_roles wr ON wr.id = tm.role_id
      WHERE tm.team_id = target_team_id
        AND tm.user_id = auth.uid()
        AND COALESCE((wr.permissions ->> permission_key)::BOOLEAN, false)
    ),
    false
  )
$$;

-- Backfill schema drift for existing databases.
ALTER TABLE events
  ADD COLUMN IF NOT EXISTS team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  ADD COLUMN IF NOT EXISTS assignee_id UUID REFERENCES users(id) ON DELETE SET NULL;

DO $$
BEGIN
  IF NOT EXISTS (
    SELECT 1
    FROM pg_constraint
    WHERE conname = 'events_team_id_fkey'
  ) THEN
    ALTER TABLE events
      ADD CONSTRAINT events_team_id_fkey
      FOREIGN KEY (team_id) REFERENCES teams(id) ON DELETE SET NULL;
  END IF;
END $$;

ALTER TABLE time_reports
  ADD COLUMN IF NOT EXISTS start_time TIME,
  ADD COLUMN IF NOT EXISTS end_time TIME,
  ADD COLUMN IF NOT EXISTS note TEXT;

ALTER TABLE users
  ADD COLUMN IF NOT EXISTS phone TEXT;

ALTER TABLE team_members
  ADD COLUMN IF NOT EXISTS notes_last_read_at TIMESTAMP WITH TIME ZONE;

-- Enable row level security
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE workspace_roles ENABLE ROW LEVEL SECURITY;
ALTER TABLE team_members ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE work_notes ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_reports ENABLE ROW LEVEL SECURITY;
ALTER TABLE clients ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_medications ENABLE ROW LEVEL SECURITY;
ALTER TABLE client_journals ENABLE ROW LEVEL SECURITY;

-- Remove insecure starter policies if the script is re-run.
DROP POLICY IF EXISTS "Allow all access to workspaces" ON workspaces;
DROP POLICY IF EXISTS "Allow all access to users" ON users;
DROP POLICY IF EXISTS "Allow all access to events" ON events;
DROP POLICY IF EXISTS "Allow all access to teams" ON teams;
DROP POLICY IF EXISTS "Allow all access to messages" ON messages;
DROP POLICY IF EXISTS "Allow all access to time_reports" ON time_reports;

DROP POLICY IF EXISTS "Workspace members can read workspaces" ON workspaces;
DROP POLICY IF EXISTS "Platform admins can insert workspaces" ON workspaces;
DROP POLICY IF EXISTS "Workspace admins can update their workspace" ON workspaces;

DROP POLICY IF EXISTS "Users can read workspace members and themselves" ON users;
DROP POLICY IF EXISTS "Users can update themselves" ON users;
DROP POLICY IF EXISTS "Workspace admins can manage workspace users" ON users;
DROP POLICY IF EXISTS "Platform admins can manage all users" ON users;

DROP POLICY IF EXISTS "Workspace members can read teams" ON teams;
DROP POLICY IF EXISTS "Workspace admins can manage teams" ON teams;

DROP POLICY IF EXISTS "Workspace members can read workspace roles" ON workspace_roles;
DROP POLICY IF EXISTS "Workspace admins can manage workspace roles" ON workspace_roles;

DROP POLICY IF EXISTS "Workspace members can read team memberships" ON team_members;
DROP POLICY IF EXISTS "Workspace admins can manage team memberships" ON team_members;

DROP POLICY IF EXISTS "Workspace members can read events" ON events;
DROP POLICY IF EXISTS "Workspace admins can manage events" ON events;

DROP POLICY IF EXISTS "Users can read relevant messages" ON messages;
DROP POLICY IF EXISTS "Users can send messages in their workspace" ON messages;
DROP POLICY IF EXISTS "Users can update messages they can access" ON messages;
DROP POLICY IF EXISTS "Workspace admins can delete workspace messages" ON messages;

DROP POLICY IF EXISTS "Workspace members can read work notes" ON work_notes;
DROP POLICY IF EXISTS "Authors and note managers can manage work notes" ON work_notes;

DROP POLICY IF EXISTS "Users can read relevant time reports" ON time_reports;
DROP POLICY IF EXISTS "Users can create their own time reports" ON time_reports;
DROP POLICY IF EXISTS "Users and approvers can update relevant time reports" ON time_reports;
DROP POLICY IF EXISTS "Users and approvers can delete relevant time reports" ON time_reports;

-- Workspaces
CREATE POLICY "Workspace members can read workspaces"
  ON workspaces
  FOR SELECT
  TO authenticated
  USING (private.is_workspace_member(id));

CREATE POLICY "Platform admins can insert workspaces"
  ON workspaces
  FOR INSERT
  TO authenticated
  WITH CHECK (private.is_platform_admin());

CREATE POLICY "Workspace admins can update their workspace"
  ON workspaces
  FOR UPDATE
  TO authenticated
  USING (private.is_workspace_admin(id))
  WITH CHECK (private.is_workspace_admin(id));

-- Users
CREATE POLICY "Users can read workspace members and themselves"
  ON users
  FOR SELECT
  TO authenticated
  USING (
    id = auth.uid()
    OR private.is_platform_admin()
    OR private.is_workspace_member(workspace_id)
  );

CREATE POLICY "Users can update themselves"
  ON users
  FOR UPDATE
  TO authenticated
  USING (id = auth.uid())
  WITH CHECK (id = auth.uid() AND workspace_id = private.current_user_workspace_id());

CREATE POLICY "Workspace admins can manage workspace users"
  ON users
  FOR ALL
  TO authenticated
  USING (private.is_workspace_admin(workspace_id))
  WITH CHECK (private.is_workspace_admin(workspace_id));

CREATE POLICY "Platform admins can manage all users"
  ON users
  FOR ALL
  TO authenticated
  USING (private.is_platform_admin())
  WITH CHECK (private.is_platform_admin());

-- Teams
CREATE POLICY "Workspace members can read teams"
  ON teams
  FOR SELECT
  TO authenticated
  USING (private.is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage teams"
  ON teams
  FOR ALL
  TO authenticated
  USING (private.is_workspace_admin(workspace_id))
  WITH CHECK (private.is_workspace_admin(workspace_id));

-- Workspace roles
CREATE POLICY "Workspace members can read workspace roles"
  ON workspace_roles
  FOR SELECT
  TO authenticated
  USING (private.is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage workspace roles"
  ON workspace_roles
  FOR ALL
  TO authenticated
  USING (private.is_workspace_admin(workspace_id))
  WITH CHECK (private.is_workspace_admin(workspace_id));

-- Team memberships
CREATE POLICY "Workspace members can read team memberships"
  ON team_members
  FOR SELECT
  TO authenticated
  USING (
    private.is_platform_admin()
    OR user_id = auth.uid()
    OR private.is_team_member(team_id)
    OR EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND private.is_workspace_admin(t.workspace_id)
    )
  );

CREATE POLICY "Workspace admins can manage team memberships"
  ON team_members
  FOR ALL
  TO authenticated
  USING (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND private.is_workspace_admin(t.workspace_id)
    )
  )
  WITH CHECK (
    EXISTS (
      SELECT 1
      FROM public.teams t
      WHERE t.id = team_members.team_id
        AND private.is_workspace_admin(t.workspace_id)
    )
  );

-- Events
CREATE POLICY "Workspace members can read events"
  ON events
  FOR SELECT
  TO authenticated
  USING (private.is_workspace_member(workspace_id));

CREATE POLICY "Workspace admins can manage events"
  ON events
  FOR ALL
  TO authenticated
  USING (private.is_workspace_admin(workspace_id))
  WITH CHECK (
    private.is_workspace_member(workspace_id)
    AND private.is_workspace_admin(workspace_id)
  );

-- Messages
CREATE POLICY "Users can read relevant messages"
  ON messages
  FOR SELECT
  TO authenticated
  USING (
    private.is_platform_admin()
    OR (
      private.is_workspace_member(workspace_id)
      AND (
        sender_id = auth.uid()
        OR receiver_id = auth.uid()
        OR (target_team_id IS NOT NULL AND private.is_team_member(target_team_id))
        OR private.is_workspace_admin(workspace_id)
      )
    )
  );

CREATE POLICY "Users can send messages in their workspace"
  ON messages
  FOR INSERT
  TO authenticated
  WITH CHECK (
    sender_id = auth.uid()
    AND private.is_workspace_member(workspace_id)
    AND (
      receiver_id IS NULL
      OR private.user_in_workspace(receiver_id, workspace_id)
    )
    AND (
      target_team_id IS NULL
      OR private.team_in_workspace(target_team_id, workspace_id)
    )
  );

CREATE POLICY "Users can update messages they can access"
  ON messages
  FOR UPDATE
  TO authenticated
  USING (
    private.is_platform_admin()
    OR (
      private.is_workspace_member(workspace_id)
      AND (
        sender_id = auth.uid()
        OR receiver_id = auth.uid()
        OR (target_team_id IS NOT NULL AND private.is_team_member(target_team_id))
        OR private.is_workspace_admin(workspace_id)
      )
    )
  )
  WITH CHECK (
    private.is_platform_admin()
    OR (
      private.is_workspace_member(workspace_id)
      AND (
        sender_id = auth.uid()
        OR receiver_id = auth.uid()
        OR (target_team_id IS NOT NULL AND private.is_team_member(target_team_id))
        OR private.is_workspace_admin(workspace_id)
      )
    )
  );

CREATE POLICY "Workspace admins can delete workspace messages"
  ON messages
  FOR DELETE
  TO authenticated
  USING (
    private.is_platform_admin()
    OR private.is_workspace_admin(workspace_id)
  );

-- Work notes
CREATE POLICY "Workspace members can read work notes"
  ON work_notes
  FOR SELECT
  TO authenticated
  USING (private.is_workspace_member(workspace_id));

CREATE POLICY "Authors and note managers can manage work notes"
  ON work_notes
  FOR ALL
  TO authenticated
  USING (
    author_id = auth.uid()
    OR private.is_workspace_admin(workspace_id)
    OR private.can_manage_team(team_id, 'can_manage_notes')
  )
  WITH CHECK (
    private.is_workspace_member(workspace_id)
    AND (
      author_id = auth.uid()
      OR private.is_workspace_admin(workspace_id)
      OR private.can_manage_team(team_id, 'can_manage_notes')
    )
  );

-- Time reports
CREATE POLICY "Users can read relevant time reports"
  ON time_reports
  FOR SELECT
  TO authenticated
  USING (
    private.is_platform_admin()
    OR user_id = auth.uid()
    OR private.is_workspace_admin(workspace_id)
    OR (team_id IS NOT NULL AND private.can_manage_team(team_id, 'can_approve_time_reports'))
  );

CREATE POLICY "Users can create their own time reports"
  ON time_reports
  FOR INSERT
  TO authenticated
  WITH CHECK (
    user_id = auth.uid()
    AND private.is_workspace_member(workspace_id)
    AND (
      team_id IS NULL
      OR private.is_team_member(team_id)
      OR private.is_workspace_admin(workspace_id)
    )
  );

CREATE POLICY "Users and approvers can update relevant time reports"
  ON time_reports
  FOR UPDATE
  TO authenticated
  USING (
    private.is_platform_admin()
    OR user_id = auth.uid()
    OR private.is_workspace_admin(workspace_id)
    OR (team_id IS NOT NULL AND private.can_manage_team(team_id, 'can_approve_time_reports'))
  )
  WITH CHECK (
    private.is_platform_admin()
    OR user_id = auth.uid()
    OR private.is_workspace_admin(workspace_id)
    OR (team_id IS NOT NULL AND private.can_manage_team(team_id, 'can_approve_time_reports'))
  );

CREATE POLICY "Users and approvers can delete relevant time reports"
  ON time_reports
  FOR DELETE
  TO authenticated
  USING (
    private.is_platform_admin()
    OR user_id = auth.uid()
    OR private.is_workspace_admin(workspace_id)
    OR (team_id IS NOT NULL AND private.can_manage_team(team_id, 'can_approve_time_reports'))
  );
