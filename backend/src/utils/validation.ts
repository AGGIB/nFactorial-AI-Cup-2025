import { z } from 'zod';

// Auth schemas
export const registerSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(6, 'Пароль должен содержать минимум 6 символов'),
  name: z.string().optional()
});

export const loginSchema = z.object({
  email: z.string().email('Некорректный email'),
  password: z.string().min(1, 'Пароль обязателен')
});

// Onboarding schemas
export const onboardingSchema = z.object({
  businessName: z.string().min(1, 'Название компании обязательно'),
  businessDesc: z.string().min(10, 'Описание должно содержать минимум 10 символов'),
  websiteUrl: z.string().url('Некорректный URL сайта'),
  contactInfo: z.object({
    email: z.string().email('Некорректный email').optional(),
    phone: z.string().optional(),
    company: z.string().optional()
  }).optional()
});

// Agent update schema
export const updateAgentSchema = z.object({
  name: z.string().min(1).optional(),
  description: z.string().min(1).optional(),
  websiteUrl: z.string().url().optional().or(z.literal('')),
  knowledgeBase: z.string().optional(),
  settings: z.object({
    companyName: z.string().optional(),
    targetAudience: z.string().optional(),
    documentationUrl: z.string().url().optional().or(z.literal('')),
    supportEmail: z.string().email().optional().or(z.literal('')),
    responseStyle: z.enum(['helpful', 'formal', 'casual', 'technical']).optional()
  }).optional(),
  systemPrompt: z.string().optional(),
  isActive: z.boolean().optional()
});

// Widget chat schema
export const chatMessageSchema = z.object({
  message: z.string().min(1, 'Сообщение не может быть пустым'),
  sessionId: z.string().min(1, 'ID сессии обязателен'),
  userInfo: z.object({
    ip: z.string().optional(),
    userAgent: z.string().optional()
  }).optional(),
  pageContext: z.object({
    url: z.string().url('Некорректный URL страницы'),
    title: z.string().optional(),
    pathname: z.string().optional(),
    userAgent: z.string().optional()
  }).optional()
}); 