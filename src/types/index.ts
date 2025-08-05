export interface User {
  id: number;
  email: string;
  name: string;
  telegram_id?: string;
  telegram_username?: string;
  partner_id?: number;
  partner_name?: string;
  partner_telegram?: string;
  role: 'participant' | 'admin';
  total_points?: number;
  streak_count: number;
  last_submission_date?: string;
  created_at: string;
  updated_at: string;
}

export interface Quest {
  id: number;
  title: string;
  description: string;
  category: string;
  points: number;
  status: 'active' | 'inactive' | 'archived';
  requirements: string;
  validation_criteria: Record<string, any>;
  created_by: number;
  created_at: string;
  updated_at: string;
}

export interface Submission {
  id: number;
  user_id: number;
  quest_id: number;
  telegram_file_id: string;
  telegram_message_id?: number;
  status: 'pending_ai' | 'ai_approved' | 'ai_rejected' | 'manual_review' | 'approved' | 'rejected';
  ai_analysis: Record<string, any>;
  ai_confidence_score?: number;
  admin_feedback?: string;
  reviewed_by?: number;
  points_awarded: number;
  submitted_at: string;
  reviewed_at?: string;
  created_at: string;
  updated_at: string;
}

export interface Activity {
  id: number;
  type: string;
  user_id: number;
  target_user_id?: number;
  quest_id?: number;
  submission_id?: number;
  description: string;
  points_change: number;
  metadata: Record<string, any>;
  created_at: string;
  created_by?: number;
  actor_name?: string;
  actor_telegram?: string;
  target_user_name?: string;
  target_user_telegram?: string;
  quest_title?: string;
  quest_category?: string;
  quest_points?: number;
  submission_status?: string;
}

export interface LeaderboardEntry {
  user_id: string;
  name: string;
  telegram_username?: string;
  total_points: number;
  completed_quests: number;
  rank: number;
}