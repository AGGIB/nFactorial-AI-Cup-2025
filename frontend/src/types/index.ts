export interface User {
  id: string;
  email: string;
  name?: string;
  createdAt: string;
  agents?: Agent[];
}

export interface Agent {
  id: string;
  userId: string;
  name: string;
  description: string;
  websiteUrl?: string;
  knowledgeBase?: string;
  settings?: {
    companyName?: string;
    targetAudience?: string;
    documentationUrl?: string;
    supportEmail?: string;
    responseStyle?: 'helpful' | 'formal' | 'casual' | 'technical';
  };
  widgetCode: string;
  isActive: boolean;
  systemPrompt?: string;
  totalChats: number;
  totalMessages: number;
  createdAt: string;
  updatedAt: string;
  conversations?: Conversation[];
  knowledgeFiles?: KnowledgeBase[];
  _count?: {
    conversations: number;
    knowledgeFiles: number;
  };
}

export interface Conversation {
  id: string;
  agentId: string;
  sessionId: string;
  messages: ChatMessage[];
  userIp?: string;
  userAgent?: string;
  isResolved: boolean;
  rating?: number;
  feedbackText?: string;
  createdAt: string;
  updatedAt: string;
}

export interface ChatMessage {
  role: 'user' | 'assistant' | 'system';
  content: string;
  timestamp: string;
}

export interface KnowledgeBase {
  id: string;
  agentId: string;
  fileName: string;
  filePath: string;
  fileType: string;
  fileSize: number;
  content: string;
  isProcessed: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface ApiResponse<T = any> {
  success: boolean;
  message?: string;
  data?: T;
  error?: string;
  details?: any;
}

export interface AuthContextType {
  user: User | null;
  token: string | null;
  login: (email: string, password: string) => Promise<void>;
  register: (email: string, password: string, name?: string) => Promise<void>;
  logout: () => void;
  loading: boolean;
}

export interface OnboardingData {
  name: string;
  description: string;
  websiteUrl: string;
  knowledgeBase?: string;
  settings?: {
    companyName?: string;
    targetAudience?: string;
    documentationUrl?: string;
    supportEmail?: string;
  };
} 