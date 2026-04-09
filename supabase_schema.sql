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

-- Ställ in Row Level Security (RLS) - Säkerhetsregler
ALTER TABLE workspaces ENABLE ROW LEVEL SECURITY;
ALTER TABLE users ENABLE ROW LEVEL SECURITY;
ALTER TABLE events ENABLE ROW LEVEL SECURITY;

-- För att det ska vara enkelt nu i början, tillåter vi alla att läsa och skriva.
-- Du bör justera dessa senare så man bara ser information från sitt eget `workspace_id`.
CREATE POLICY "Allow all access to workspaces" ON workspaces FOR ALL USING (true);
CREATE POLICY "Allow all access to users" ON users FOR ALL USING (true);
CREATE POLICY "Allow all access to events" ON events FOR ALL USING (true);
