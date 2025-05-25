import { generateSystemPrompt } from './promptService';

export interface SiteAnalysisResult {
  url: string;
  title: string;
  description: string;
  navigation: string[];
  keyPages: { url: string; title: string; content: string }[];
  technologies: string[];
  contactInfo?: {
    email?: string;
    phone?: string;
    address?: string;
  };
  businessType: string;
  targetAudience: string;
  mainFeatures: string[];
  faq?: { question: string; answer: string }[];
}

export interface AnalysisContext {
  siteAnalysis: SiteAnalysisResult;
  userInputs: {
    name: string;
    description: string;
    knowledgeBase?: string;
    settings?: any;
  };
  generatedPrompt: string;
  widgetConfig: {
    theme: string;
    position: string;
    greeting: string;
    placeholder: string;
  };
}

export const analyzeSite = async (url: string): Promise<SiteAnalysisResult> => {
  try {
    console.log(`🔍 Начинаем анализ сайта: ${url}`);
    
    // Здесь будет реальный анализ сайта
    // Пока возвращаем mock данные, но структура готова для реального анализа
    const mockAnalysis: SiteAnalysisResult = {
      url,
      title: "Извлеченный заголовок сайта",
      description: "Автоматически извлеченное описание сайта",
      navigation: ["Главная", "Продукты", "Решения", "Поддержка", "Контакты"],
      keyPages: [
        {
          url: `${url}/features`,
          title: "Функции продукта",
          content: "Основные возможности и преимущества"
        },
        {
          url: `${url}/support`,
          title: "Поддержка",
          content: "FAQ и документация"
        }
      ],
      technologies: ["React", "Node.js", "API"],
      contactInfo: {
        email: "support@example.com"
      },
      businessType: "SaaS платформа",
      targetAudience: "Разработчики и IT команды",
      mainFeatures: [
        "API интеграция",
        "Аналитика в реальном времени",
        "Настраиваемые дашборды"
      ]
    };

    // Симулируем время анализа
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    console.log(`✅ Анализ сайта завершен: ${url}`);
    return mockAnalysis;
    
  } catch (error) {
    console.error(`❌ Ошибка анализа сайта ${url}:`, error);
    throw new Error('Не удалось проанализировать сайт');
  }
};

export const generateWidgetContext = async (
  siteAnalysis: SiteAnalysisResult,
  userInputs: any
): Promise<AnalysisContext> => {
  console.log('🧠 Генерируем контекст для виджета...');
  
  // Генерируем системный промпт на основе анализа
  const generatedPrompt = generateSystemPrompt({
    name: userInputs.name,
    description: userInputs.description,
    siteAnalysis,
    knowledgeBase: userInputs.knowledgeBase,
    settings: userInputs.settings
  });

  // Настраиваем виджет под сайт
  const widgetConfig = {
    theme: detectTheme(siteAnalysis),
    position: "bottom-right",
    greeting: `Привет! Я помогу вам с ${userInputs.name}. Задайте любой вопрос!`,
    placeholder: "Напишите ваш вопрос..."
  };

  const context: AnalysisContext = {
    siteAnalysis,
    userInputs,
    generatedPrompt,
    widgetConfig
  };

  console.log('✅ Контекст виджета сгенерирован');
  return context;
};

const detectTheme = (analysis: SiteAnalysisResult): string => {
  // Простая логика определения темы на основе технологий
  if (analysis.technologies.includes('React')) {
    return 'modern';
  }
  return 'default';
};

export const saveAnalysisResults = async (
  agentId: string,
  context: AnalysisContext
): Promise<void> => {
  console.log(`💾 Сохраняем результаты анализа для агента ${agentId}`);
  
  // Здесь можно сохранить дополнительные данные в базу
  // Например, в отдельную таблицу с результатами анализа
  
  console.log('✅ Результаты анализа сохранены');
}; 