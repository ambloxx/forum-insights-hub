export interface HealthData {
  status: string;
  total_posts_db: number;
  total_posts_vec: number;
  llm_model: string;
  embedding_model: string;
}

export interface StatsData {
  total_posts: number;
  total_questions: number;
  total_ideas: number;
  total_problems: number;
  total_discussions: number;
  total_announcements: number;
  resolved_posts: number;
  unresolved_posts: number;
  unreplied_posts: number;
  resolution_rate_pct: number;
  avg_likes: number;
  avg_views: number;
  avg_comments: number;
  max_likes: number;
  max_views: number;
  max_comments: number;
  breakdown_by_type: Array<{ type: string; count: number }>;
  breakdown_by_label: Array<{ label: string; count: number }>;
  vector_docs: number;
}



export interface Post {
  id: number;
  subject: string;
  type: string;
  label: string;
  like_count: number;
  view_count: number;
  comment_count: number;
  created_time: string;
  latest_comment_time?: string;
  unreplied: boolean;
  topic_url: string;
  creator_name?: string;
  last_commenter_name?: string;
  content?: string;
  engagement_score: number;
  is_unreplied?: boolean;
  permalink: string;
}

export interface PostsResponse {
  posts: Post[];
  total: number;
}

export interface SyncStatus {
  last_sync_type: string;
  last_sync_time: string;
  posts_inserted: number;
  posts_updated: number;
  success: boolean;
  total_posts_in_db: number;
  vector_docs: number;
}

export interface SyncProgress {
  running: boolean;
  type: string;
  categories_done: number;
  categories_total: number;
  pages_fetched: number;
  posts_found: number;
  inserted: number;
  updated: number;
  message: string;
  error: string | null;
}

export interface NotificationCheck {
  new_posts: any[];
  updated_posts: any[];
  total_new: number;
  total_updated: number;
}
// Add this field to your existing ChatMessage interface:

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  think?: string;
  steps?: string[];
  fetches?: string[];
  timestamp?: Date;
  isStreaming?: boolean;
  meta?: {
    intent: string;
    type: string;
    limit: string;
  };
  confirmPending?: boolean;
  confirmType?: 'research' | 'reasoning';  // ← NEW FIELD
  confirmQuestion?: string;
}