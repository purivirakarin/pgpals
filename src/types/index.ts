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
  category: 'pair' | 'multiple-pair' | 'bonus';
  points: number;
  status: 'active' | 'inactive' | 'archived';
  requirements: string;
  validation_criteria: Record<string, any>;
  expires_at?: string;
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
  ai_processed_at?: string;
  reviewed_at?: string;
  // New fields for group submissions
  is_group_submission?: boolean;
  group_submission_id?: number;
  represents_pairs?: string[];
  // New fields for pair submissions
  pair_submission?: boolean;
  visible_to_partner?: boolean;
  // New fields for soft deletion
  is_deleted?: boolean;
  deleted_at?: string;
  deleted_by?: number;
}

// Extended submission interface for API responses that include additional metadata
export interface SubmissionWithMetadata extends Submission {
  submitted_by: 'self' | 'partner' | 'group';
  submitter_name?: string;
  submitter_telegram?: string;
  user_opted_out?: boolean;
  opted_out_at?: string;
  is_submitter: boolean;
  can_delete: boolean;
  can_opt_out: boolean;
  quest?: Quest;
  users?: User;
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
  user_id: string | number;
  name: string;
  telegram_username?: string;
  total_points: number;
  completed_quests: number;
  rank: number;
  is_partnership?: boolean;
  partner_names?: string[];
}

// New interfaces for group submission system
export interface GroupSubmission {
  id: number;
  quest_id: number;
  submitter_user_id: number;
  submission_id: number;
  created_at: string;
  updated_at: string;
}

export interface GroupParticipant {
  id: number;
  group_submission_id: number;
  user_id: number;
  partner_id?: number;
  opted_out: boolean;
  opted_out_at?: string;
  created_at: string;
  updated_at: string;
}

export interface PairSubmissionStatus {
  user_id: number;
  partner_id?: number;
  quest_id: number;
  quest_title: string;
  quest_category: 'pair' | 'multiple-pair' | 'bonus';
  // Direct submissions
  user_submission_id?: number;
  user_submission_status?: string;
  user_submitted_at?: string;
  partner_submission_id?: number;
  partner_submission_status?: string;
  partner_submitted_at?: string;
  // Group submission info
  group_submission_id?: number;
  group_submitter_id?: number;
  group_submission_status?: string;
  group_submitted_at?: string;
  opted_out_of_group?: boolean;
  // Overall status
  pair_status: 'available' | 'pending' | 'completed' | 'rejected';
}

export interface UserQuestStatus {
  status: 'available' | 'pending' | 'completed' | 'rejected';
  submission_id?: number;
  submitted_by?: 'self' | 'partner' | 'group';
  submitted_at?: string;
  can_opt_out?: boolean;
  group_submission_id?: number;
}