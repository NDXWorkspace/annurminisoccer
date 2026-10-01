-- =============================================
-- An-Nur Mini Soccer — Supabase Database Schema
-- =============================================

-- Teams table
CREATE TABLE teams (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  name TEXT NOT NULL,
  short_name VARCHAR(3) NOT NULL,
  logo_url TEXT,
  group_name VARCHAR(10) NOT NULL,
  color VARCHAR(7),
  created_at TIMESTAMPTZ DEFAULT now()
);

-- Matches table
CREATE TABLE matches (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  team_a_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  team_b_id UUID NOT NULL REFERENCES teams(id) ON DELETE RESTRICT,
  score_a INT DEFAULT 0,
  score_b INT DEFAULT 0,
  status VARCHAR(20) DEFAULT 'scheduled' CHECK (status IN ('scheduled', 'live', 'halftime', 'finished')),
  match_date DATE NOT NULL,
  kickoff_time TIME NOT NULL,
  field VARCHAR(50) NOT NULL,
  stage VARCHAR(20) DEFAULT 'grup' CHECK (stage IN ('grup', 'semifinal', 'final')),
  group_name VARCHAR(10),
  updated_at TIMESTAMPTZ DEFAULT now()
);

-- Event settings table (single row)
CREATE TABLE event_settings (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  event_name TEXT NOT NULL DEFAULT 'An-Nur Mini Soccer',
  start_date DATE NOT NULL DEFAULT '2026-10-09',
  end_date DATE NOT NULL DEFAULT '2026-10-10',
  location TEXT NOT NULL DEFAULT 'Lapangan An-Nur',
  map_url TEXT,
  rules_text TEXT,
  tiebreak_rules TEXT DEFAULT 'poin → selisih gol → gol masuk',
  contact_info TEXT
);

-- Insert default event settings
INSERT INTO event_settings (event_name, start_date, end_date, location, tiebreak_rules)
VALUES ('An-Nur Mini Soccer', '2026-10-09', '2026-10-10', 'Lapangan An-Nur', 'poin → selisih gol → gol masuk');

-- Indexes for performance
CREATE INDEX idx_matches_status ON matches(status);
CREATE INDEX idx_matches_date ON matches(match_date);
CREATE INDEX idx_matches_team_a ON matches(team_a_id);
CREATE INDEX idx_matches_team_b ON matches(team_b_id);
CREATE INDEX idx_teams_group ON teams(group_name);

-- Enable Row Level Security
ALTER TABLE teams ENABLE ROW LEVEL SECURITY;
ALTER TABLE matches ENABLE ROW LEVEL SECURITY;
ALTER TABLE event_settings ENABLE ROW LEVEL SECURITY;

-- Public read policies
CREATE POLICY "Public can read teams" ON teams FOR SELECT USING (true);
CREATE POLICY "Public can read matches" ON matches FOR SELECT USING (true);
CREATE POLICY "Public can read event_settings" ON event_settings FOR SELECT USING (true);

-- Service role can do everything (used by admin API routes)
CREATE POLICY "Service role full access teams" ON teams FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access matches" ON matches FOR ALL USING (true) WITH CHECK (true);
CREATE POLICY "Service role full access event_settings" ON event_settings FOR ALL USING (true) WITH CHECK (true);

-- Auto-update updated_at on matches
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER matches_updated_at
  BEFORE UPDATE ON matches
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();

-- =============================================
-- DATA DUMMY / CONTOH (Opsional untuk Uji Coba)
-- =============================================
/*
-- 1. Contoh Tim Grup A & B
INSERT INTO teams (id, name, short_name, group_name, color) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'Garuda Muda FC', 'GAR', 'A', '#0B3D91'),
  ('a2222222-2222-2222-2222-222222222222', 'Bintang Timur FC', 'BTM', 'A', '#1E63D6'),
  ('a3333333-3333-3333-3333-333333333333', 'Elang Perkasa', 'ELG', 'A', '#2563EB'),
  ('a4444444-4444-4444-4444-444444444444', 'Rajawali Sakti', 'RJW', 'A', '#0284C7'),
  ('b1111111-1111-1111-1111-111111111111', 'Harimau Putih', 'HMP', 'B', '#059669'),
  ('b2222222-2222-2222-2222-222222222222', 'Singa Muda', 'SGM', 'B', '#D97706'),
  ('b3333333-3333-3333-3333-333333333333', 'Badak Mandiri', 'BDK', 'B', '#DC2626'),
  ('b4444444-4444-4444-4444-444444444444', 'An-Nur All Star', 'ANN', 'B', '#7C3AED');

-- 2. Contoh Pertandingan
INSERT INTO matches (team_a_id, team_b_id, score_a, score_b, status, match_date, kickoff_time, field, stage, group_name) VALUES
  ('a1111111-1111-1111-1111-111111111111', 'a2222222-2222-2222-2222-222222222222', 2, 1, 'finished', '2026-10-09', '08:00', 'A', 'grup', 'A'),
  ('a3333333-3333-3333-3333-333333333333', 'a4444444-4444-4444-4444-444444444444', 0, 0, 'live', '2026-10-09', '09:00', 'A', 'grup', 'A'),
  ('b1111111-1111-1111-1111-111111111111', 'b2222222-2222-2222-2222-222222222222', 0, 0, 'scheduled', '2026-10-09', '10:00', 'B', 'grup', 'B'),
  ('b3333333-3333-3333-3333-333333333333', 'b4444444-4444-4444-4444-444444444444', 0, 0, 'scheduled', '2026-10-09', '11:00', 'B', 'grup', 'B');
*/
