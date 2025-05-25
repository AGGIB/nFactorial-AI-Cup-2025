import { Router, Request, Response, NextFunction } from 'express';
import { prisma } from '../index';
import { chatMessageSchema } from '../utils/validation';
import { createError } from '../middleware/errorHandler';
import { generateAIResponse } from '../services/aiService';
import { aiService } from '../services/aiService';

const router = Router();

// Middleware для разрешения iframe embedding
router.use((req: Request, res: Response, next: NextFunction) => {
  res.setHeader('X-Frame-Options', 'ALLOWALL');
  res.setHeader('Content-Security-Policy', "frame-ancestors *; frame-src *");
  res.setHeader('X-Content-Type-Options', 'nosniff');
  res.setHeader('Referrer-Policy', 'strict-origin-when-cross-origin');
  next();
});

// GET /api/widget/:code/config - Получить конфигурацию виджета
router.get('/:code/config', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { 
        widgetCode: code,
        isActive: true 
      },
      select: {
        id: true,
        name: true,
        description: true,
        settings: true,
        systemPrompt: true
      }
    });

    if (!agent) {
      throw createError('Виджет не найден или неактивен', 404);
    }

    // Парсим settings если это JSON строка
    let settings = {};
    if (typeof agent.settings === 'string') {
      try {
        settings = JSON.parse(agent.settings);
      } catch (error) {
        console.error('Ошибка парсинга settings:', error);
      }
    } else if (agent.settings) {
      settings = agent.settings;
    }

    res.json({
      success: true,
      data: {
        businessName: agent.name,
        businessDesc: agent.description,
        responseStyle: (settings as any)?.responseStyle || 'helpful',
        welcomeMessage: `Привет! Я AI-ассистент ${agent.name}. Как я могу вам помочь?`
      }
    });
  } catch (error) {
    next(error);
  }
});

// POST /api/widget/:code/chat - Отправить сообщение в чат
router.post('/:code/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;
    const { message, sessionId, userInfo, pageContext } = chatMessageSchema.parse(req.body);

    // Найти агента
    const agent = await prisma.agent.findUnique({
      where: { 
        widgetCode: code,
        isActive: true 
      },
      include: {
        knowledgeFiles: true
      }
    });

    if (!agent) {
      throw createError('Виджет не найден или неактивен', 404);
    }

    // Найти или создать разговор
    let conversation = await prisma.conversation.findFirst({
      where: {
        agentId: agent.id,
        sessionId: sessionId
      }
    });

    if (!conversation) {
      conversation = await prisma.conversation.create({
        data: {
          agentId: agent.id,
          sessionId: sessionId,
          messages: [],
          userIp: userInfo?.ip,
          userAgent: userInfo?.userAgent
        }
      });
    }

    // Получить историю сообщений
    const messages = conversation.messages as any[];
    
    // Добавить новое сообщение пользователя
    const userMessage = {
      role: 'user',
      content: message,
      timestamp: new Date().toISOString(),
      pageContext: pageContext || null
    };
    
    messages.push(userMessage);

    let aiResponse: string;

    // Если есть контекст страницы - используем анализ в реальном времени
    if (pageContext && pageContext.url) {
      console.log(`🔍 Using page context for: ${pageContext.url}`);
      
      try {
        // Проверяем что URL не является внутренним API endpoint
        const url = new URL(pageContext.url);
        if (url.hostname === 'localhost' && url.pathname.includes('/api/')) {
          console.log(`⚠️ Skipping analysis of internal API endpoint: ${pageContext.url}`);
          // Fallback к обычному ответу
          aiResponse = await generateAIResponse({
            message,
            history: messages.slice(-10),
            agent: {
              businessName: agent.name,
              businessDesc: agent.description,
              systemPrompt: agent.systemPrompt,
              responseStyle: 'helpful',
              knowledgeBase: agent.knowledgeFiles.map(f => f.content).join('\n')
            },
            sessionId: sessionId,
            userInfo: userInfo
          });
        } else {
          // Анализируем страницу в реальном времени
          const response = await fetch(`${process.env.API_BASE_URL || 'http://localhost:5001'}/api/analysis/context`, {
            method: 'POST',
            headers: {
              'Content-Type': 'application/json'
            },
            body: JSON.stringify({
              url: pageContext.url,
              question: message,
              agentId: agent.id,
              sessionId: sessionId
            })
          });

          if (response.ok) {
            const data = await response.json();
            aiResponse = data.response;
          } else {
            throw new Error('Failed to get contextual response');
          }
        }
      } catch (error) {
        console.error('❌ Error with page context analysis:', error);
        // Fallback к обычному ответу с информацией о контексте
        const contextInfo = pageContext.title ? `\n\nКонтекст: Пользователь находится на странице "${pageContext.title}" (${pageContext.url})` : '';
        
        aiResponse = await generateAIResponse({
          message: message + contextInfo,
          history: messages.slice(-10),
          agent: {
            businessName: agent.name,
            businessDesc: agent.description,
            systemPrompt: agent.systemPrompt,
            responseStyle: 'helpful',
            knowledgeBase: agent.knowledgeFiles.map(f => f.content).join('\n')
          },
          sessionId: sessionId,
          userInfo: userInfo
        });
      }
    } else {
      // Обычный ответ без анализа страницы
      aiResponse = await generateAIResponse({
        message,
        history: messages.slice(-10),
        agent: {
          businessName: agent.name,
          businessDesc: agent.description,
          systemPrompt: agent.systemPrompt,
          responseStyle: 'helpful',
          knowledgeBase: agent.knowledgeFiles.map(f => f.content).join('\n')
        },
        sessionId: sessionId,
        userInfo: userInfo
      });
    }

    // Добавить ответ AI
    const assistantMessage = {
      role: 'assistant',
      content: aiResponse,
      timestamp: new Date().toISOString()
    };
    
    messages.push(assistantMessage);

    // Обновить разговор
    await prisma.conversation.update({
      where: { id: conversation.id },
      data: {
        messages: messages
      }
    });

    // Обновить статистику агента
    await prisma.agent.update({
      where: { id: agent.id },
      data: {
        totalMessages: {
          increment: 2
        }
      }
    });

    res.json({
      success: true,
      data: {
        response: aiResponse,
        sessionId: sessionId,
        hasPageContext: !!pageContext
      }
    });
  } catch (error) {
    next(error);
  }
});

// GET /api/widget/:code/chat - Получить интерфейс чата (HTML)
router.get('/:code/chat', async (req: Request, res: Response, next: NextFunction) => {
  try {
    const { code } = req.params;

    const agent = await prisma.agent.findUnique({
      where: { 
        widgetCode: code,
        isActive: true 
      },
      select: {
        name: true,
        description: true
      }
    });

    if (!agent) {
      return res.status(404).send('Виджет не найден');
    }

    const chatHTML = `
<!DOCTYPE html>
<html lang="ru">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Chat - ${agent.name}</title>
  <style>
    * {
      margin: 0;
      padding: 0;
      box-sizing: border-box;
    }
    
    body {
      font-family: system-ui, -apple-system, sans-serif;
      height: 100vh;
      display: flex;
      flex-direction: column;
      background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
      position: relative;
      overflow: hidden;
    }
    
    /* Анимированный фон */
    body::before {
      content: '';
      position: absolute;
      top: 0;
      left: 0;
      right: 0;
      bottom: 0;
      background: 
        radial-gradient(circle at 20% 80%, rgba(120, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 80% 20%, rgba(255, 119, 198, 0.3) 0%, transparent 50%),
        radial-gradient(circle at 40% 40%, rgba(120, 200, 255, 0.3) 0%, transparent 50%);
      animation: gradient-shift 6s ease-in-out infinite;
    }
    
    @keyframes gradient-shift {
      0%, 100% { opacity: 1; transform: translateY(0px); }
      50% { opacity: 0.8; transform: translateY(-10px); }
    }
    
    .chat-container {
      position: relative;
      z-index: 1;
      height: 100%;
      display: flex;
      flex-direction: column;
      background: rgba(255, 255, 255, 0.95);
      backdrop-filter: blur(10px);
      margin: 8px;
      border-radius: 16px;
      overflow: hidden;
      box-shadow: 0 8px 32px rgba(0,0,0,0.1);
    }
    
    .chat-header {
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      padding: 16px;
      text-align: center;
      border-bottom: 1px solid rgba(255,255,255,0.1);
    }
    
    .chat-messages {
      flex: 1;
      overflow-y: auto;
      padding: 16px;
      display: flex;
      flex-direction: column;
      gap: 12px;
    }
    
    .message {
      max-width: 80%;
      padding: 12px 16px;
      border-radius: 18px;
      font-size: 14px;
      line-height: 1.4;
      animation: slideIn 0.3s ease-out;
    }
    
    @keyframes slideIn {
      from { opacity: 0; transform: translateY(10px); }
      to { opacity: 1; transform: translateY(0); }
    }
    
    .message.user {
      align-self: flex-end;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
    }
    
    .message.assistant {
      align-self: flex-start;
      background: #f1f3f4;
      color: #333;
      border: 1px solid #e1e3e4;
    }
    
    .chat-input {
      padding: 16px;
      border-top: 1px solid #e1e3e4;
      background: white;
    }
    
    .input-form {
      display: flex;
      gap: 8px;
      align-items: flex-end;
    }
    
    .input-field {
      flex: 1;
      padding: 12px 16px;
      border: 2px solid #e1e3e4;
      border-radius: 24px;
      outline: none;
      font-size: 14px;
      resize: none;
      min-height: 24px;
      max-height: 120px;
      font-family: inherit;
      transition: border-color 0.2s;
    }
    
    .input-field:focus {
      border-color: #667eea;
    }
    
    .send-button {
      padding: 12px 20px;
      background: linear-gradient(135deg, #667eea, #764ba2);
      color: white;
      border: none;
      border-radius: 20px;
      cursor: pointer;
      font-size: 14px;
      font-weight: 500;
      transition: transform 0.2s;
    }
    
    .send-button:hover {
      transform: translateY(-1px);
    }
    
    .send-button:disabled {
      opacity: 0.6;
      transform: none;
      cursor: not-allowed;
    }
    
    .typing-indicator {
      align-self: flex-start;
      display: none;
      padding: 12px 16px;
      background: #f1f3f4;
      border-radius: 18px;
      font-style: italic;
      color: #666;
    }
    
    .loading {
      display: inline-block;
      width: 4px;
      height: 4px;
      border-radius: 50%;
      background: #667eea;
      animation: loading 1.4s infinite ease-in-out both;
    }
    
    .loading:nth-child(1) { animation-delay: -0.32s; }
    .loading:nth-child(2) { animation-delay: -0.16s; margin: 0 2px; }
    .loading:nth-child(3) { animation-delay: 0s; }
    
    @keyframes loading {
      0%, 80%, 100% { transform: scale(0); }
      40% { transform: scale(1); }
    }
  </style>
</head>
<body>
  <div class="chat-container">
    <div class="chat-header">
      <h3>${agent.name}</h3>
      <p style="font-size: 12px; opacity: 0.9; margin-top: 4px;">AI-ассистент готов помочь</p>
    </div>
    
    <div class="chat-messages" id="messages">
      <div class="message assistant">
        Привет! Я AI-ассистент ${agent.name}. Как я могу вам помочь?
      </div>
    </div>
    
    <div class="typing-indicator" id="typing">
      <span class="loading"></span>
      <span class="loading"></span>
      <span class="loading"></span>
      <span style="margin-left: 8px;">AI печатает...</span>
    </div>
    
    <div class="chat-input">
      <form class="input-form" id="chatForm">
        <textarea class="input-field" id="messageInput" placeholder="Напишите ваше сообщение..." rows="1"></textarea>
        <button type="submit" class="send-button" id="sendButton">Отправить</button>
      </form>
    </div>
  </div>
  
  <script>
    const messagesContainer = document.getElementById('messages');
    const messageInput = document.getElementById('messageInput');
    const sendButton = document.getElementById('sendButton');
    const chatForm = document.getElementById('chatForm');
    const typingIndicator = document.getElementById('typing');
    
    const sessionId = 'session_' + Math.random().toString(36).substr(2, 9);
    
    // Получаем URL родительской страницы если виджет встроен в iframe
    const getParentUrl = () => {
      try {
        // Если мы в iframe, пытаемся получить URL родительской страницы
        if (window.parent !== window) {
          return window.parent.location.href;
        }
        return window.location.href;
      } catch (error) {
        // Если доступ к родительской странице заблокирован (cross-origin)
        // используем referrer или fallback
        return document.referrer || window.location.href;
      }
    };
    
    // Auto-resize textarea
    messageInput.addEventListener('input', function() {
      this.style.height = 'auto';
      this.style.height = Math.min(this.scrollHeight, 120) + 'px';
    });
    
    chatForm.addEventListener('submit', async function(e) {
      e.preventDefault();
      
      const message = messageInput.value.trim();
      if (!message) return;
      
      // Add user message
      addMessage(message, 'user');
      messageInput.value = '';
      messageInput.style.height = 'auto';
      
      // Show typing indicator
      showTyping(true);
      
      try {
        const parentUrl = getParentUrl();
        console.log('🌐 Parent URL:', parentUrl);
        
        const response = await fetch('/api/widget/${code}/chat', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({
            message,
            sessionId,
            userInfo: {
              userAgent: navigator.userAgent
            },
            pageContext: {
              url: parentUrl,
              title: document.title,
              pathname: window.location.pathname,
              userAgent: navigator.userAgent
            }
          })
        });
        
        const data = await response.json();
        
        if (data.success) {
          addMessage(data.data.response, 'assistant');
        } else {
          addMessage('Извините, произошла ошибка. Попробуйте еще раз.', 'assistant');
        }
      } catch (error) {
        console.error('Chat error:', error);
        addMessage('Извините, произошла ошибка соединения.', 'assistant');
      } finally {
        showTyping(false);
      }
    });
    
    function addMessage(content, role) {
      const messageDiv = document.createElement('div');
      messageDiv.className = 'message ' + role;
      messageDiv.textContent = content;
      messagesContainer.appendChild(messageDiv);
      messagesContainer.scrollTop = messagesContainer.scrollHeight;
    }
    
    function showTyping(show) {
      typingIndicator.style.display = show ? 'block' : 'none';
      sendButton.disabled = show;
      if (show) {
        messagesContainer.scrollTop = messagesContainer.scrollHeight;
      }
    }
    
    // Handle Enter key
    messageInput.addEventListener('keydown', function(e) {
      if (e.key === 'Enter' && !e.shiftKey) {
        e.preventDefault();
        chatForm.dispatchEvent(new Event('submit'));
      }
    });
  </script>
</body>
</html>`;

    res.send(chatHTML);
  } catch (error) {
    next(error);
  }
});

export default router; 