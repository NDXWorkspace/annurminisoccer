// === Database Types ===

export type MatchStatus = 'scheduled' | 'live' | 'halftime' | 'finished';
export type MatchStage = 'grup' | 'semifinal' | 'final';

export interface Team {
  id: string;
  name: string;
  short_name: string;
  logo_url: string | null;
  group_name: string;
  color: string | null;
  created_at: string;
}

export interface Match {
  id: string;
  team_a_id: string;
  team_b_id: string;
  score_a: number;
  score_b: number;
  status: MatchStatus;
  match_date: string;
  kickoff_time: string;
  field: string;
  stage: MatchStage;
  group_name: string | null;
  updated_at: string;
}

export interface MatchWithTeams extends Match {
  team_a: Team;
  team_b: Team;
}

export interface EventSettings {
  id: string;
  event_name: string;
  start_date: string;
  end_date: string;
  location: string;
  map_url: string | null;
  rules_text: string | null;
  tiebreak_rules: string;
  contact_info: string | null;
}

// === Computed Types ===

export interface StandingRow {
  team: Team;
  played: number;
  won: number;
  drawn: number;
  lost: number;
  goals_for: number;
  goals_against: number;
  goal_difference: number;
  points: number;
}

export interface GroupStandings {
  group_name: string;
  rows: StandingRow[];
}

// === API Types ===

export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface TeamFormData {
  name: string;
  short_name: string;
  logo_url?: string;
  group_name: string;
  color?: string;
}

export interface MatchFormData {
  team_a_id: string;
  team_b_id: string;
  match_date: string;
  kickoff_time: string;
  field: string;
  stage: MatchStage;
  group_name?: string;
}
