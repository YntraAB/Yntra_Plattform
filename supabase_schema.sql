-- YNTRA PLATTFORM - SQL SCHEMAN FÖR SUPABASE
-- Kopiera och klistra in detta i Supabase "SQL Editor" och tryck "Run" (kör)

-- 1. Skapa "workspaces" (Företag / Arbetsytor)
CREATE TABLE workspaces (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  name TEXT NOT NULL,
  modules_active JSONB NOT NULL DEFAULT '{"school": false, "assistance": false}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 2. Skapa "users" (Kopplas med Supabase Auth)
-- Detta kräver att man använder Supabase inbyggda auth.users för inloggning, men
-- vi skapar en public profil-tabell för all extra data (roll, företag).
CREATE TABLE users (
  id UUID REFERENCES auth.users(id) ON DELETE CASCADE PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE SET NULL,
  email TEXT NOT NULL,
  full_name TEXT,
  role TEXT DEFAULT 'user', -- 'superadmin', 'admin', 'user'
  notifications_on BOOLEAN DEFAULT TRUE,
  notification_type TEXT DEFAULT 'full_content', -- 'full_content' or 'alert_only'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 3. Skapa "events" (Schemapass / Lektioner)
CREATE TABLE events (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE SET NULL, -- Vem som ska jobba
  title TEXT NOT NULL, -- T.ex. "Nattpass" eller "Matte 2b"
  start_time TIMESTAMP WITH TIME ZONE NOT NULL,
  end_time TIMESTAMP WITH TIME ZONE NOT NULL,
  metadata JSONB DEFAULT '{}', -- Flexibel data för specifika yrken
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4. Skapa "teams" (Arbetslag)
CREATE TABLE teams (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.1 Skapa "workspace_roles" (Anpassade roller i organisationen)
CREATE TABLE workspace_roles (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  name TEXT NOT NULL,
  permissions JSONB DEFAULT '{}',
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 4.2 Skapa "team_members" (Kopplingstabell)
CREATE TABLE team_members (
  team_id UUID REFERENCES teams(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  role_id UUID REFERENCES workspace_roles(id) ON DELETE SET NULL,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  PRIMARY KEY (team_id, user_id)
);

-- 5. Skapa "messages" (Inkorg)
CREATE TABLE messages (
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

-- 6. Skapa "time_reports" (Tidsrapporter)
CREATE TABLE time_reports (
  id UUID DEFAULT uuid_generate_v4() PRIMARY KEY,
  workspace_id UUID REFERENCES workspaces(id) ON DELETE CASCADE NOT NULL,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE NOT NULL,
  team_id UUID REFERENCES teams(id) ON DELETE SET NULL,
  date DATE NOT NULL,
  hours DECIMAL(4,2) NOT NULL,
  status TEXT DEFAULT 'pending_attest', -- 'pending_attest', 'approved', 'rejected'
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- 7. Notification Trigger Logic
-- Denna funktion anropar vår Edge Function "notify" när nåt händer
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

-- Triggers för meddelanden
CREATE TRIGGER on_message_created
  AFTER INSERT ON messages
  FOR EACH ROW EXECUTE FUNCTION handle_new_notification();

-- Triggers för tidsrapporter (när status ändras)
CREATE TRIGGER on_time_report_status_change
  AFTER UPDATE OF status ON time_reports
  FOR EACH ROW
  WHEN (OLD.status IS DISTINCT FROM NEW.status)
  EXECUTE FUNCTION handle_new_notification();

-- Ställ in Row Level Security (RLS) - Säkerhetsregler
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE messages ENABLE ROW LEVEL SECURITY;
ALTER TABLE time_reports ENABLE ROW LEVEL SECURITY;

-- För att det ska vara enkelt nu i början, tillåter vi alla att läsa och skriva.
CREATE POLICY "Allow all access to workspaces" ON workspaces FOR ALL USING (true);
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to events" ON events FOR ALL USING (true);
CREATE POLICY "Allow all access to teams" ON teams FOR ALL USING (true);
CREATE POLICY "Allow all access to messages" ON messages FOR ALL USING (true);
CREATE POLICY "Allow all access to time_reports" ON time_reports FOR ALL USING (true);
