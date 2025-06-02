export interface ChatMessage {
  id: number;
  content: string;
  user: {
    id: number;
    username: string;
  };
  created_at: string;
  user_id: number;
}

export interface WebSocketMessage {
  type: string;
  data?: any;
  error?: string;
}

export interface User {
  id: number;
  username: string;
  email: string;
} 