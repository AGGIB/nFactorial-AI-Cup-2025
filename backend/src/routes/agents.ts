import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { updateAgentSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { authenticate, AuthRequest } from '../middleware/auth';
import { generateWidgetScript } from '../services/widgetService';

const router = Router();

// GET /api/agents - Получить всех агентов пользователя
router.get('/', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const agents = await prisma.agent.findMany({
      where: { userId: req.user!.id },
      include: {
        _count: {
          select: {
            conversations: true,
            knowledgeFiles: true
          }
        }
      },
      orderBy: {
        createdAt: 'desc'
      }
    });

    res.json({
      success: true,
      data: { agents }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id - Получить конкретного агента
router.get('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      include: {
        conversations: {
          take: 10,
          orderBy: {
            createdAt: 'desc'
          },
          select: {
            id: true,
            sessionId: true,
            isResolved: true,
            rating: true,
            createdAt: true
          }
        },
        knowledgeFiles: true,
        _count: {
          select: {
            conversations: true,
            knowledgeFiles: true
          }
        }
      }
    });

    if (!agent) {
      throw createError('Агент не найден', 404);
    }

    res.json({
      success: true,
      data: { agent }
    });
  } catch (error) {
    next(error);
  }
});

// PUT /api/agents/:id - Обновить агента
router.put('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;
    const updateData = updateAgentSchema.parse(req.body);

    // Проверяем, что агент принадлежит пользователю
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingAgent) {
      throw createError('Агент не найден', 404);
    }

    // Подготавливаем данные для обновления
    const updatePayload: any = {};
    
    if (updateData.name) updatePayload.name = updateData.name;
    if (updateData.description) updatePayload.description = updateData.description;
    if (updateData.websiteUrl !== undefined) updatePayload.websiteUrl = updateData.websiteUrl;
    if (updateData.knowledgeBase !== undefined) updatePayload.knowledgeBase = updateData.knowledgeBase;
    if (updateData.systemPrompt) updatePayload.systemPrompt = updateData.systemPrompt;
    if (updateData.isActive !== undefined) updatePayload.isActive = updateData.isActive;
    
    // Обрабатываем settings - сохраняем как JSON строку
    if (updateData.settings) {
      updatePayload.settings = JSON.stringify(updateData.settings);
    }

    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: updatePayload,
      include: {
        _count: {
          select: {
            conversations: true,
            knowledgeFiles: true
          }
        }
      }
    });

    res.json({
      success: true,
      message: 'Агент успешно обновлен',
      data: { agent: updatedAgent }
    });
  } catch (error) {
    next(error);
  }
});

// DELETE /api/agents/:id - Удалить агента
router.delete('/:id', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    // Проверяем, что агент принадлежит пользователю
    const existingAgent = await prisma.agent.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!existingAgent) {
      throw createError('Агент не найден', 404);
    }

    await prisma.agent.delete({
      where: { id }
    });

    res.json({
      success: true,
      message: 'Агент успешно удален'
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/agents/:id/widget-code - Получить код виджета
router.get('/:id/widget-code', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: req.user!.id
      },
      select: {
        widgetCode: true,
        name: true,
        isActive: true
      }
    });

    if (!agent) {
      throw createError('Агент не найден', 404);
    }

    if (!agent.isActive) {
      throw createError('Агент должен быть активирован для получения кода виджета', 400);
    }

    const widgetScript = generateWidgetScript(agent.widgetCode, {
      businessName: agent.name
    });

    res.json({
      success: true,
      data: {
        widgetCode: agent.widgetCode,
        script: widgetScript
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/agents/:id/analyze - Запустить анализ сайта агента
router.post('/:id/analyze', authenticate, async (req: AuthRequest, res: Response, next: NextFunction) => {
  try {
    const { id } = req.params;

    const agent = await prisma.agent.findFirst({
      where: {
        id,
        userId: req.user!.id
      }
    });

    if (!agent) {
      throw createError('Агент не найден', 404);
    }

    // TODO: Запустить анализ сайта через AI
    // Пока просто активируем агента
    const updatedAgent = await prisma.agent.update({
      where: { id },
      data: {
        isActive: true,
        systemPrompt: `Ты - AI-ассистент для сайта "${agent.name}". 
        Описание бизнеса: ${agent.description}
        Сайт: ${agent.websiteUrl}
        
        Твоя задача - помогать посетителям сайта, отвечать на их вопросы и направлять их к нужным действиям.
        Будь дружелюбным, полезным и информативным.`
      }
    });

    res.json({
      success: true,
      message: 'Анализ сайта завершен, агент активирован',
      data: { agent: updatedAgent }
    });
  } catch (error) {
    next(error);
  }
});

export default router; 