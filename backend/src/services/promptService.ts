import { SiteAnalysisResult } from './analysisService';

interface PromptData {
  name: string;
  description: string;
  siteAnalysis?: SiteAnalysisResult;
  knowledgeBase?: string;
  settings?: any;
}

export const generateSystemPrompt = (data: PromptData): string => {
  const companyName = data.settings?.companyName || 'компания';
  const productName = data.name;
  const targetAudience = data.settings?.targetAudience || 'пользователи';
  const supportEmail = data.settings?.supportEmail;

  let prompt = `Ты - ИИ-ассистент для продукта "${productName}" от ${companyName}.

ОПИСАНИЕ ПРОДУКТА:
${data.description}

ЦЕЛЕВАЯ АУДИТОРИЯ:
${targetAudience}`;

  // Добавляем данные анализа сайта если есть
  if (data.siteAnalysis) {
    prompt += `

АНАЛИЗ САЙТА:
- URL: ${data.siteAnalysis.url}
- Тип бизнеса: ${data.siteAnalysis.businessType}
- Основные функции: ${data.siteAnalysis.mainFeatures.join(', ')}
- Навигация: ${data.siteAnalysis.navigation.join(', ')}
- Технологии: ${data.siteAnalysis.technologies.join(', ')}`;

    if (data.siteAnalysis.keyPages.length > 0) {
      prompt += `
- Ключевые страницы: ${data.siteAnalysis.keyPages.map(p => p.title).join(', ')}`;
    }

    if (data.siteAnalysis.contactInfo?.email) {
      prompt += `
- Контактный email: ${data.siteAnalysis.contactInfo.email}`;
    }
  }

  prompt += `

ТВОЯ РОЛЬ:
- Помогай пользователям разобраться с продуктом
- Отвечай на вопросы об онбординге и настройке
- Предоставляй пошаговые инструкции
- Будь дружелюбным и терпеливым
- Используй информацию с сайта для более точных ответов

ПРАВИЛА:
- Отвечай только на вопросы, связанные с ${productName}
- Если не знаешь ответ, честно признайся и предложи обратиться в поддержку
- Используй простой и понятный язык
- Предлагай конкретные шаги для решения проблем
- Ссылайся на конкретные страницы сайта когда это уместно`;

  if (data.knowledgeBase) {
    prompt += `

БАЗА ЗНАНИЙ:
${data.knowledgeBase}`;
  }

  if (supportEmail) {
    prompt += `

Для сложных вопросов направляй пользователей к команде поддержки: ${supportEmail}`;
  }

  return prompt;
}; 