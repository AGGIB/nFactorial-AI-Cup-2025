import express from 'express';
import { screenshotService } from '../services/screenshotService';
import { aiService } from '../services/aiService';

const router = express.Router();

// Анализ текущей страницы пользователя
router.post('/page', async (req, res) => {
  try {
    const { url, agentId } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    // Проверяем валидность URL
    try {
      new URL(url);
    } catch {
      return res.status(400).json({ error: 'Invalid URL format' });
    }

    console.log(`🔍 Analyzing page: ${url} for agent: ${agentId}`);

    // Получаем скриншот и данные страницы
    const pageData = await screenshotService.analyzeCurrentPage(url);

    // Анализируем с помощью AI
    const aiAnalysis = await aiService.analyzePageWithVision({
      screenshot: pageData.screenshot,
      pageData: pageData.analysis,
      agentId: agentId || 'default'
    });

    res.json({
      success: true,
      analysis: {
        visual: aiAnalysis,
        data: pageData.analysis,
        description: pageData.visualDescription
      }
    });

  } catch (error) {
    console.error('Error analyzing page:', error);
    res.status(500).json({ 
      error: 'Failed to analyze page',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Получить только скриншот страницы
router.post('/screenshot', async (req, res) => {
  try {
    const { url } = req.body;

    if (!url) {
      return res.status(400).json({ error: 'URL is required' });
    }

    console.log(`📸 Taking screenshot: ${url}`);

    const { screenshotBase64 } = await screenshotService.captureScreenshot(url);

    res.json({
      success: true,
      screenshot: screenshotBase64
    });

  } catch (error) {
    console.error('Error taking screenshot:', error);
    res.status(500).json({ 
      error: 'Failed to take screenshot',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Анализ страницы с дополнительным контекстом для чата
router.post('/context', async (req, res) => {
  try {
    const { url, question, agentId, sessionId } = req.body;

    if (!url || !question) {
      return res.status(400).json({ error: 'URL and question are required' });
    }

    console.log(`💭 Contextual analysis for: ${url}`);
    console.log(`Question: ${question}`);

    // Получаем данные страницы
    const pageData = await screenshotService.analyzeCurrentPage(url);

    // Отправляем в AI с контекстом вопроса
    const response = await aiService.chatWithPageContext({
      message: question,
      pageData,
      agentId: agentId || 'default',
      sessionId: sessionId || `session_${Date.now()}`
    });

    res.json({
      success: true,
      response,
      pageContext: {
        title: pageData.analysis.title,
        url: pageData.analysis.url,
        hasButtons: pageData.analysis.buttons.length > 0,
        hasForms: pageData.analysis.forms.length > 0
      }
    });

  } catch (error) {
    console.error('Error in contextual analysis:', error);
    res.status(500).json({ 
      error: 'Failed to analyze with context',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

// Автоматизация браузера - выполнение действий
router.post('/automate', async (req, res) => {
  try {
    const { action, url, params } = req.body;

    if (!action || !url) {
      return res.status(400).json({ error: 'Action and URL are required' });
    }

    console.log(`🤖 Browser automation: ${action} on ${url}`);

    let result;

    switch (action) {
      case 'click':
        if (!params.buttonText) {
          return res.status(400).json({ error: 'buttonText is required for click action' });
        }
        
        // Находим кнопку
        const findResult = await screenshotService.findButtonByText(url, params.buttonText);
        if (!findResult.success) {
          return res.json({
            success: false,
            message: findResult.message
          });
        }
        
        // Кликаем
        result = await screenshotService.clickElement(url, findResult.selector!, {
          waitForNavigation: params.waitForNavigation !== false
        });
        break;

      case 'fill_form':
        if (!params.formData) {
          return res.status(400).json({ error: 'formData is required for fill_form action' });
        }
        
        result = await screenshotService.fillForm(url, params.formData, params.submitSelector);
        break;

      case 'find_button':
        if (!params.buttonText) {
          return res.status(400).json({ error: 'buttonText is required for find_button action' });
        }
        
        result = await screenshotService.findButtonByText(url, params.buttonText);
        break;

      default:
        return res.status(400).json({ error: `Unknown action: ${action}` });
    }

    res.json({
      success: result.success,
      message: result.message,
      data: result
    });

  } catch (error) {
    console.error('Error in browser automation:', error);
    res.status(500).json({ 
      error: 'Failed to execute automation',
      details: error instanceof Error ? error.message : 'Unknown error'
    });
  }
});

export default router; 