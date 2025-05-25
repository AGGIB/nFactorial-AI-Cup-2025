import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateWidgetCode } from '../services/widgetService';
import { analyzeSite, generateWidgetContext, saveAnalysisResults } from '../services/analysisService';
import { z } from 'zod';

const router = Router();

// Схема валидации для нового онбординга
const onboardingSchema = z.object({
  name: z.string().min(1, 'Название продукта обязательно'),
  description: z.string().min(1, 'Описание продукта обязательно'),
  websiteUrl: z.string().url('Некорректный URL сайта').optional(),
  knowledgeBase: z.string().optional(),
  settings: z.object({
    companyName: z.string().optional(),
    targetAudience: z.string().optional(),
    documentationUrl: z.string().url('Некорректный URL документации').optional().or(z.literal('')),
    supportEmail: z.string().email('Некорректный email').optional().or(z.literal('')),
  }).optional()
});

// POST /api/onboarding - Создание агента после онбординга
router.post('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const validatedData = onboardingSchema.parse(req.body);

    console.log(`🚀 Создание агента для пользователя ${req.user!.id}`);

    // Генерируем уникальный код виджета
    const widgetCode = generateWidgetCode();

    let analysisContext = null;
    let enhancedPrompt = '';

    // Если есть URL сайта, проводим анализ
    if (validatedData.websiteUrl) {
      console.log(`🔍 Запускаем анализ сайта: ${validatedData.websiteUrl}`);
      
      try {
        const siteAnalysis = await analyzeSite(validatedData.websiteUrl);
        analysisContext = await generateWidgetContext(siteAnalysis, validatedData);
        enhancedPrompt = analysisContext.generatedPrompt;
        
        console.log('✅ Анализ сайта завершен успешно');
      } catch (analysisError) {
        console.warn('⚠️ Ошибка анализа сайта, используем базовый промпт:', analysisError);
        enhancedPrompt = generateBasicPrompt(validatedData);
      }
    } else {
      enhancedPrompt = generateBasicPrompt(validatedData);
    }

    // Создаем агента
    const agent = await prisma.agent.create({
      data: {
        userId: req.user!.id,
        name: validatedData.name,
        description: validatedData.description,
        websiteUrl: validatedData.websiteUrl,
        knowledgeBase: validatedData.knowledgeBase,
        settings: validatedData.settings ? JSON.stringify(validatedData.settings) : null,
        widgetCode,
        isActive: true,
        systemPrompt: enhancedPrompt
      },
      include: {
        user: {
          select: {
            id: true,
            email: true,
            name: true
          }
        }
      }
    });

    // Сохраняем результаты анализа если они есть
    if (analysisContext) {
      await saveAnalysisResults(agent.id, analysisContext);
    }

    console.log(`✅ Агент создан успешно: ${agent.id}`);

    res.status(201).json({
      success: true,
      message: 'ИИ-ассистент успешно создан и настроен',
      data: { 
        agent,
        analysisPerformed: !!analysisContext,
        widgetConfig: analysisContext?.widgetConfig
      }
    });
  } catch (error) {
    if (error instanceof z.ZodError) {
      const firstError = error.errors[0];
      return next(createError(firstError.message, 400));
    }
    next(error);
  }
});

// Функция генерации базового промпта без анализа сайта
function generateBasicPrompt(data: z.infer<typeof onboardingSchema>): string {
  const companyName = data.settings?.companyName || 'компания';
  const productName = data.name;
  const targetAudience = data.settings?.targetAudience || 'пользователи';
  const supportEmail = data.settings?.supportEmail;

  let prompt = `Ты - ИИ-ассистент для продукта "${productName}" от ${companyName}.

ОПИСАНИЕ ПРОДУКТА:
${data.description}

ЦЕЛЕВАЯ АУДИТОРИЯ:
${targetAudience}

ТВОЯ РОЛЬ:
- Помогай пользователям разобраться с продуктом
- Отвечай на вопросы об онбординге и настройке
- Предоставляй пошаговые инструкции
- Будь дружелюбным и терпеливым

ПРАВИЛА:
- Отвечай только на вопросы, связанные с ${productName}
- Если не знаешь ответ, честно признайся и предложи обратиться в поддержку
- Используй простой и понятный язык
- Предлагай конкретные шаги для решения проблем`;

  if (data.knowledgeBase) {
    prompt += `\n\nБАЗА ЗНАНИЙ:
${data.knowledgeBase}`;
  }

  if (supportEmail) {
    prompt += `\n\nДля сложных вопросов направляй пользователей к команде поддержки: ${supportEmail}`;
  }

  return prompt;
}

// GET /api/onboarding/validate-url - Проверка доступности URL
router.get('/validate-url', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { url } = req.query;

    if (!url || typeof url !== 'string') {
      throw createError('URL обязателен', 400);
    }

    // Проверяем доступность URL
    try {
      const response = await fetch(url, { 
        method: 'HEAD',
        timeout: 5000 // 5 секунд таймаут
      });
      
      const isValid = response.ok;
      
      res.json({
        success: true,
        data: {
          isValid,
          status: response.status,
          statusText: response.statusText
        }
      });
    } catch (fetchError) {
      res.json({
        success: true,
        data: {
          isValid: false,
          error: 'Сайт недоступен или не отвечает'
        }
      });
    }
  } catch (error) {
    next(error);
  }
});

export default router; 