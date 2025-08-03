export interface User {
  id: string;
  email: string;
  name: string;
  telegram_id?: string;
  telegram_username?: string;
  role: 'participant' | 'admin';
  total_points: number;
  streak_count: number;
  last_submission_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: string;
  title: string;
  description: string;
  category: string;
  points: number;
  status: 'active' | 'inactive' | 'archived';
  requirements: string;
  validation_criteria: Record<string, any>;
  created_by: string;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: string;
  user_id: string;
  quest_id: string;
  telegram_file_id: string;
  telegram_message_id: number;
  status: 'pending_ai' | 'ai_approved' | 'ai_rejected' | 'manual_review' | 'approved' | 'rejected';
  ai_analysis?: Record<string, any>;
  ai_confidence_score?: number;
  admin_feedback?: string;
  reviewed_by?: string;
  points_awarded?: number;
  submitted_at: string;
  ai_processed_at?: string;
  reviewed_at?: string;
  user?: User;
  quest?: Quest;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  telegram_username?: string;
  total_points: number;
  completed_quests: number;
  rank: number;
}