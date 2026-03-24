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
  unreplied_posts: number;
  avg_likes: number;
  avg_views: number;
  avg_comments: number;
  max_likes: number;
  max_views: number;
  max_comments: number;
  by_label: Record<string, number>;
  by_type: Record<string, number>;
  vector_docs: number;
}

export interface Post {
  id: number;
  title: string;
  post_type: string;
  label: string;
  likes: number;
  views: number;
  comment_count: number;
  created_at: string;
  unreplied: boolean;
  topic_url: string;
  engagement_score: number;
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

export interface ChatMessage {
  id: string;
  role: 'user' | 'assistant';
  content: string;
  think?: string;
  meta?: { intent: string; type: string; limit: string };
  steps: string[];
  timestamp: Date;
  isStreaming?: boolean;
}
