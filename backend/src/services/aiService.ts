import axios from 'axios';
import { prisma } from '../index';
import { PageAnalysisData } from './screenshotService';
import { screenshotService } from './screenshotService';

interface AIRequestParams {
  message: string;
  history: Array<{ role: string; content: string; timestamp: string }>;
  agent: {
    businessName: string;
    businessDesc: string;
    systemPrompt?: string;
    responseStyle?: string;
    knowledgeBase?: string;
  };
  sessionId?: string;
  userInfo?: {
    ip?: string;
    userAgent?: string;
  };
}

// Определяем доступные действия
interface ActionResult {
  success: boolean;
  message: string;
  data?: any;
}

const availableActions = {
  // Создание заявки/обращения
  createTicket: async (params: { 
    title: string; 
    description: string; 
    email?: string; 
    priority?: 'low' | 'medium' | 'high' 
  }): Promise<ActionResult> => {
    try {
      // Здесь можно интегрировать с CRM или системой заявок
      const ticketId = `T${Date.now()}`;
      
      console.log('Создана заявка:', {
        id: ticketId,
        ...params,
        createdAt: new Date()
      });

      return {
        success: true,
        message: `Заявка #${ticketId} успешно создана. Мы свяжемся с вами в ближайшее время.`,
        data: { ticketId, ...params }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Не удалось создать заявку. Попробуйте позже.'
      };
    }
  },

  // Поиск в базе знаний
  searchKnowledge: async (params: { 
    query: string; 
    knowledgeBase?: string 
  }): Promise<ActionResult> => {
    try {
      const { query, knowledgeBase } = params;
      
      if (!knowledgeBase) {
        return {
          success: false,
          message: 'База знаний недоступна'
        };
      }

      // Простой поиск по ключевым словам
      const keywords = query.toLowerCase().split(' ');
      const knowledge = knowledgeBase.toLowerCase();
      
      const relevantSections = knowledgeBase
        .split('\n')
        .filter(line => 
          keywords.some(keyword => 
            line.toLowerCase().includes(keyword)
          )
        )
        .slice(0, 3);

      return {
        success: true,
        message: relevantSections.length > 0 
          ? `Найденная информация:\n${relevantSections.join('\n')}`
          : 'По вашему запросу информация не найдена',
        data: { relevantSections }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Ошибка поиска в базе знаний'
      };
    }
  },

  // Подписка на уведомления
  subscribeUpdates: async (params: { 
    email: string; 
    topics?: string[] 
  }): Promise<ActionResult> => {
    try {
      const { email, topics = ['general'] } = params;
      
      // Здесь можно интегрировать с email-сервисом
      console.log('Новая подписка:', {
        email,
        topics,
        subscribedAt: new Date()
      });

      return {
        success: true,
        message: `Спасибо! Вы подписаны на обновления по адресу ${email}`,
        data: { email, topics }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Не удалось оформить подписку'
      };
    }
  },

  // Запись на встречу/демо
  scheduleDemo: async (params: { 
    email: string; 
    name?: string; 
    preferredTime?: string;
    message?: string;
  }): Promise<ActionResult> => {
    try {
      const meetingId = `M${Date.now()}`;
      
      console.log('Запись на демо:', {
        id: meetingId,
        ...params,
        scheduledAt: new Date()
      });

      return {
        success: true,
        message: `Отлично! Заявка на демо #${meetingId} принята. Мы свяжемся с вами по email ${params.email} для уточнения времени.`,
        data: { meetingId, ...params }
      };
    } catch (error) {
      return {
        success: false,
        message: 'Не удалось записать на демо'
      };
    }
  },

  // Получение контактной информации
  getContacts: async (): Promise<ActionResult> => {
    return {
      success: true,
      message: `Наши контакты:
📧 Email: support@company.com
📞 Телефон: +7 (999) 123-45-67
🕒 Время работы: Пн-Пт 9:00-18:00 (МСК)
💬 Также вы можете написать нам прямо в этом чате!`,
      data: {
        email: 'support@company.com',
        phone: '+7 (999) 123-45-67',
        workingHours: 'Пн-Пт 9:00-18:00 (МСК)'
      }
    };
  },

  // === BROWSER AUTOMATION ACTIONS ===
  
  // Нажатие на кнопку/элемент
  clickButton: async (params: { 
    buttonText: string; 
    url: string;
    pageContext?: any;
  }): Promise<ActionResult> => {
    try {
      console.log(`🖱️ AI clicking button: "${params.buttonText}" on ${params.url}`);
      
      // Сначала находим кнопку
      const findResult = await screenshotService.findButtonByText(params.url, params.buttonText);
      
      if (!findResult.success) {
        // Если не нашли точно, попробуем с альтернативными вариантами
        const alternatives = [
          params.buttonText.toLowerCase(),
          params.buttonText.toUpperCase(),
          params.buttonText.charAt(0).toUpperCase() + params.buttonText.slice(1).toLowerCase(),
          params.buttonText.replace(/\s+/g, ' ').trim()
        ];
        
        for (const alt of alternatives) {
          if (alt !== params.buttonText) {
            console.log(`🔄 Trying alternative: "${alt}"`);
            const altResult = await screenshotService.findButtonByText(params.url, alt);
            if (altResult.success && altResult.selector) {
              console.log(`✅ Found with alternative text: "${alt}"`);
              
              const clickResult = await screenshotService.clickElement(params.url, altResult.selector, {
                waitForNavigation: true
              });
              
              if (clickResult.success) {
                return {
                  success: true,
                  message: `✅ Кнопка "${params.buttonText}" успешно нажата! ${clickResult.newUrl ? `Перешли на: ${clickResult.newUrl}` : ''}`,
                  data: { newUrl: clickResult.newUrl }
                };
              }
            }
          }
        }
        
        return {
          success: false,
          message: `Кнопка "${params.buttonText}" не найдена на странице. Возможно, она называется по-другому или не видна. Доступные кнопки можно увидеть через анализ страницы.`
        };
      }
      
      // Нажимаем на кнопку
      const clickResult = await screenshotService.clickElement(params.url, findResult.selector!, {
        waitForNavigation: true
      });
      
      if (clickResult.success) {
        return {
          success: true,
          message: `✅ Кнопка "${params.buttonText}" успешно нажата! ${clickResult.newUrl ? `Перешли на: ${clickResult.newUrl}` : ''}`,
          data: { newUrl: clickResult.newUrl }
        };
      } else {
        // Если клик не сработал, попробуем более простой подход
        console.log(`🔄 Direct click failed, trying fallback approach...`);
        
        const fallbackResult = await screenshotService.clickElement(params.url, params.buttonText, {
          waitForNavigation: false
        });
        
        if (fallbackResult.success) {
          return {
            success: true,
            message: `✅ Кнопка "${params.buttonText}" нажата (простой режим)! ${fallbackResult.newUrl ? `Текущая страница: ${fallbackResult.newUrl}` : ''}`,
            data: { newUrl: fallbackResult.newUrl }
          };
        }
        
        return {
          success: false,
          message: `Не удалось нажать кнопку "${params.buttonText}": ${clickResult.message}`
        };
      }
    } catch (error) {
      console.error('Error clicking button:', error);
      return {
        success: false,
        message: `Техническая ошибка при нажатии кнопки "${params.buttonText}". Попробуйте еще раз или укажите кнопку по-другому.`
      };
    }
  },

  // Заполнение и отправка формы регистрации
  registerUser: async (params: {
    email: string;
    password?: string;
    name?: string;
    url: string;
  }): Promise<ActionResult> => {
    try {
      console.log(`📝 AI registering user: ${params.email} on ${params.url}`);
      
      // Генерируем пароль если не указан
      const password = params.password || `Bloop${Math.random().toString(36).slice(-6)}!`;
      
      // Определяем поля формы для регистрации
      const formSelectors = {
        'input[type="email"]': params.email,
        'input[name="email"]': params.email,
        'input[placeholder*="email"]': params.email,
        'input[placeholder*="Email"]': params.email,
        
        'input[type="password"]': password,
        'input[name="password"]': password,
        'input[placeholder*="password"]': password,
        'input[placeholder*="Password"]': password,
        'input[placeholder*="пароль"]': password,
      };
      
      // Добавляем имя если указано
      if (params.name) {
        Object.assign(formSelectors, {
          'input[name="name"]': params.name,
          'input[placeholder*="name"]': params.name,
          'input[placeholder*="Name"]': params.name,
          'input[placeholder*="имя"]': params.name,
        });
      }
      
      // Заполняем форму
      const fillResult = await screenshotService.fillForm(params.url, formSelectors);
      
      if (fillResult.success) {
        // Ищем и нажимаем кнопку отправки
        const submitButtons = ['Зарегистрироваться', 'Register', 'Sign Up', 'Создать аккаунт', 'Войти'];
        
        for (const buttonText of submitButtons) {
          const findResult = await screenshotService.findButtonByText(fillResult.newUrl || params.url, buttonText);
          
          if (findResult.success && findResult.selector) {
            const clickResult = await screenshotService.clickElement(
              fillResult.newUrl || params.url, 
              findResult.selector,
              { waitForNavigation: true }
            );
            
            if (clickResult.success) {
              return {
                success: true,
                message: `✅ Регистрация выполнена! Email: ${params.email}, Пароль: ${password}. ${clickResult.newUrl ? `Текущая страница: ${clickResult.newUrl}` : ''}`,
                data: { 
                  email: params.email, 
                  password,
                  newUrl: clickResult.newUrl 
                }
              };
            }
          }
        }
        
        return {
          success: true,
          message: `✅ Форма регистрации заполнена! Email: ${params.email}, Пароль: ${password}. Нажмите "Зарегистрироваться" для завершения.`,
          data: { email: params.email, password }
        };
      } else {
        return {
          success: false,
          message: `Не удалось заполнить форму регистрации: ${fillResult.message}`
        };
      }
    } catch (error) {
      console.error('Error registering user:', error);
      return {
        success: false,
        message: 'Техническая ошибка при регистрации'
      };
    }
  },

  // Навигация по сайту
  navigateToPage: async (params: {
    url: string;
    targetPage: string; // 'login', 'register', 'dashboard', etc.
    currentUrl: string;
  }): Promise<ActionResult> => {
    try {
      console.log(`🧭 AI navigating to: ${params.targetPage}`);
      
      // Определяем возможные тексты кнопок/ссылок для навигации
      const navigationMap: Record<string, string[]> = {
        login: ['Войти', 'Login', 'Sign In', 'Вход'],
        register: ['Регистрация', 'Register', 'Sign Up', 'Создать аккаунт'],
        dashboard: ['Dashboard', 'Панель', 'Главная', 'Home'],
        profile: ['Профиль', 'Profile', 'Account', 'Аккаунт'],
        settings: ['Настройки', 'Settings', 'Конфигурация']
      };
      
      const buttonTexts = navigationMap[params.targetPage.toLowerCase()] || [params.targetPage];
      
      for (const buttonText of buttonTexts) {
        const findResult = await screenshotService.findButtonByText(params.currentUrl, buttonText);
        
        if (findResult.success && findResult.selector) {
          const clickResult = await screenshotService.clickElement(
            params.currentUrl,
            findResult.selector,
            { waitForNavigation: true }
          );
          
          if (clickResult.success) {
            return {
              success: true,
              message: `✅ Успешно перешли на страницу "${params.targetPage}"! Текущий URL: ${clickResult.newUrl}`,
              data: { newUrl: clickResult.newUrl }
            };
          }
        }
      }
      
      return {
        success: false,
        message: `Не удалось найти способ перейти на страницу "${params.targetPage}"`
      };
      
    } catch (error) {
      console.error('Error navigating:', error);
      return {
        success: false,
        message: 'Техническая ошибка при навигации'
      };
    }
  },

  // === EXISTING ACTIONS ===
};

// Функция для определения намерения и вызова действий
const detectIntentAndExecuteAction = async (
  message: string, 
  agent: AIRequestParams['agent'],
  sessionId?: string,
  pageContext?: any
): Promise<string | null> => {
  const lowerMessage = message.toLowerCase();
  const currentUrl = pageContext?.url || 'http://localhost:3000/';

  // === BROWSER AUTOMATION ACTIONS ===
  
  // Нажатие на кнопку
  if (lowerMessage.includes('нажми') || 
      lowerMessage.includes('кликни') ||
      lowerMessage.includes('нажать') ||
      lowerMessage.includes('кликнуть')) {
    
    // Извлекаем текст кнопки из сообщения
    const buttonPatterns = [
      /нажми[\s"']*([^"'\n]+?)[\s"']*/i,
      /кликни[\s"']*([^"'\n]+?)[\s"']*/i,
      /нажать[\s"']*([^"'\n]+?)[\s"']*/i,
      /кликнуть[\s"']*([^"'\n]+?)[\s"']*/i
    ];
    
    for (const pattern of buttonPatterns) {
      const match = message.match(pattern);
      if (match && match[1]) {
        let buttonText = match[1].trim();
        
        // Нормализуем некоторые общие варианты
        const buttonAliases: Record<string, string> = {
          'начать работу': 'Начать работу',
          'войти': 'Войти',
          'логин': 'Войти',
          'регистрация': 'Регистрация',
          'зарегистрироваться': 'Зарегистрироваться',
          'попробовать бесплатно': 'Попробовать бесплатно',
          'попробовать': 'Попробовать бесплатно',
          'начать': 'Начать работу',
          'старт': 'Начать работу'
        };
        
        buttonText = buttonAliases[buttonText.toLowerCase()] || buttonText;
        
        console.log(`🎯 Normalized button text: "${buttonText}"`);
        
        const result = await availableActions.clickButton({
          buttonText,
          url: currentUrl,
          pageContext
        });
        
        return result.message;
      }
    }
    
    return 'Укажите, какую кнопку нужно нажать. Например: "нажми войти", "кликни начать работу" или "нажать попробовать бесплатно"';
  }

  // Регистрация пользователя
  if ((lowerMessage.includes('зарегистрир') || 
       lowerMessage.includes('регистрац') ||
       lowerMessage.includes('создай аккаунт') ||
       lowerMessage.includes('register')) && 
      (lowerMessage.includes('@') || lowerMessage.includes('email') || lowerMessage.includes('почт'))) {
    
    // Извлекаем email из сообщения
    const emailMatch = message.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    if (emailMatch) {
      const email = emailMatch[0];
      
      // Извлекаем имя если есть
      const namePatterns = [
        /меня зовут\s+([^\s]+)/i,
        /имя\s+([^\s]+)/i,
        /name\s+([^\s]+)/i
      ];
      
      let name;
      for (const pattern of namePatterns) {
        const match = message.match(pattern);
        if (match && match[1]) {
          name = match[1].trim();
          break;
        }
      }
      
      const result = await availableActions.registerUser({
        email,
        name,
        url: currentUrl
      });
      
      return result.message;
    }
    
    return 'Для регистрации укажите ваш email адрес. Например: "зарегистрируй меня на user@example.com"';
  }

  // Навигация по сайту
  if (lowerMessage.includes('перейди') || 
      lowerMessage.includes('открой') ||
      lowerMessage.includes('переход') ||
      lowerMessage.includes('идти')) {
    
    const navigationKeywords = {
      'вход': 'login',
      'войти': 'login', 
      'логин': 'login',
      'авторизац': 'login',
      'регистрац': 'register',
      'sign up': 'register',
      'dashboard': 'dashboard',
      'панель': 'dashboard',
      'главная': 'dashboard',
      'профиль': 'profile',
      'настройки': 'settings'
    };
    
    for (const [keyword, targetPage] of Object.entries(navigationKeywords)) {
      if (lowerMessage.includes(keyword)) {
        const result = await availableActions.navigateToPage({
          url: currentUrl,
          targetPage,
          currentUrl
        });
        
        return result.message;
      }
    }
  }

  // === EXISTING ACTIONS ===

  // Создание заявки
  if (lowerMessage.includes('создать заявку') || 
      lowerMessage.includes('оставить заявку') ||
      lowerMessage.includes('нужна помощь') && lowerMessage.includes('заявка')) {
    
    // Извлекаем email если есть
    const emailMatch = message.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    const email = emailMatch ? emailMatch[0] : undefined;
    
    const result = await availableActions.createTicket({
      title: 'Обращение через чат',
      description: message,
      email,
      priority: 'medium'
    });
    
    return result.message;
  }

  // Поиск информации
  if (lowerMessage.includes('найди') || 
      lowerMessage.includes('поиск') ||
      lowerMessage.includes('расскажи о') ||
      lowerMessage.includes('что такое')) {
    
    const result = await availableActions.searchKnowledge({
      query: message,
      knowledgeBase: agent.knowledgeBase
    });
    
    return result.message;
  }

  // Подписка на обновления
  if (lowerMessage.includes('подписаться') || 
      lowerMessage.includes('уведомления') ||
      lowerMessage.includes('рассылка')) {
    
    const emailMatch = message.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    if (emailMatch) {
      const result = await availableActions.subscribeUpdates({
        email: emailMatch[0]
      });
      return result.message;
    }
    
    return 'Для подписки на обновления укажите ваш email адрес.';
  }

  // Запись на демо
  if (lowerMessage.includes('демо') || 
      lowerMessage.includes('встреча') ||
      lowerMessage.includes('презентация') ||
      lowerMessage.includes('показать продукт')) {
    
    const emailMatch = message.match(/[\w._%+-]+@[\w.-]+\.[A-Za-z]{2,}/);
    if (emailMatch) {
      const result = await availableActions.scheduleDemo({
        email: emailMatch[0],
        message: message
      });
      return result.message;
    }
    
    return 'Для записи на демо укажите ваш email адрес.';
  }

  // Получение контактов
  if (lowerMessage.includes('контакт') || 
      lowerMessage.includes('связаться') ||
      lowerMessage.includes('телефон') ||
      lowerMessage.includes('email') ||
      lowerMessage.includes('поддержка')) {
    
    const result = await availableActions.getContacts();
    return result.message;
  }

  return null; // Действие не распознано
};

export const generateAIResponse = async (params: AIRequestParams): Promise<string> => {
  try {
    const { message, history, agent, sessionId, userInfo } = params;

    // Сначала проверяем, можно ли выполнить действие
    const actionResult = await detectIntentAndExecuteAction(message, agent, sessionId, userInfo);
    if (actionResult) {
      return actionResult;
    }

    // Построить системный промпт с информацией о доступных действиях
    const systemPrompt = agent.systemPrompt || `
Ты - AI-ассистент для компании "${agent.businessName}".

Описание бизнеса: ${agent.businessDesc}

Твоя задача:
- Помогать посетителям сайта
- Отвечать на вопросы о компании и услугах
- Направлять пользователей к нужным действиям
- Быть дружелюбным и полезным
- АВТОМАТИЧЕСКИ ВЫПОЛНЯТЬ ДЕЙСТВИЯ НА САЙТЕ

🤖 ВОЗМОЖНОСТИ АВТОМАТИЗАЦИИ БРАУЗЕРА:
🖱️ Нажатие кнопок - "нажми войти", "кликни регистрация", "нажать попробовать бесплатно"
📝 Автоматическая регистрация - "зарегистрируй меня на email@example.com"
🧭 Навигация по сайту - "перейди на вход", "открой регистрацию"
📋 Заполнение форм - автоматически при регистрации

СТАНДАРТНЫЕ ДЕЙСТВИЯ:
🎫 Создание заявки - "создать заявку", "оставить заявку", "нужна помощь"
🔍 Поиск информации - "найди", "расскажи о", "что такое"
📧 Подписка на обновления - "подписаться", "уведомления"
📅 Запись на демо - "демо", "встреча", "презентация"
📞 Получение контактов - "контакты", "связаться", "телефон"

Стиль общения: ${agent.responseStyle || 'helpful'}

${agent.knowledgeBase ? `
База знаний компании:
${agent.knowledgeBase}
` : ''}

ВАЖНО: 
- Ты можешь АВТОМАТИЧЕСКИ нажимать кнопки и выполнять действия на сайте
- Когда пользователь просит нажать кнопку - ты это делаешь автоматически
- Когда просят зарегистрировать - ты заполняешь форму и отправляешь её
- Не просто говори что делать - ДЕЛАЙ это сам!
- Отвечай кратко и по существу
- Используй информацию из базы знаний, если она релевантна
- Если не знаешь ответа, честно скажи об этом
- Отвечай на русском языке
- Помни: ты можешь выполнять действия за пользователя!
`;

    // Подготовить сообщения для API
    const messages = [
      {
        role: 'system',
        content: systemPrompt
      },
      // Добавить последние сообщения для контекста
      ...history.slice(-8).map(msg => ({
        role: msg.role,
        content: msg.content
      })),
      {
        role: 'user',
        content: message
      }
    ];

    // Запрос к OpenRouter API
    const response = await axios.post(
      'https://openrouter.ai/api/v1/chat/completions',
      {
        model: process.env.OPENROUTER_MODEL || 'qwen/qwen2.5-vl-32b-instruct:free',
        messages: messages,
        max_tokens: 500,
        temperature: 0.7,
        top_p: 0.9,
        stream: false
      },
      {
        headers: {
          'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
          'Content-Type': 'application/json',
          'HTTP-Referer': process.env.FRONTEND_URL || 'http://localhost:3000',
          'X-Title': 'Bloop.ai - AI Agent Platform'
        },
        timeout: 30000 // 30 seconds timeout
      }
    );

    if (response.data?.choices?.[0]?.message?.content) {
      return response.data.choices[0].message.content.trim();
    } else {
      throw new Error('Пустой ответ от AI API');
    }

  } catch (error: any) {
    console.error('AI Service Error:', error.response?.data || error.message);
    
    // Fallback responses
    if (error.response?.status === 429) {
      return 'Извините, сейчас большая нагрузка. Попробуйте чуть позже.';
    } else if (error.response?.status === 401) {
      return 'Произошла ошибка авторизации AI сервиса. Обратитесь к администратору.';
    } else {
      return 'Извините, временно не могу ответить. Попробуйте переформулировать вопрос или обратитесь к нашему менеджеру.';
    }
  }
};

// Функция для анализа сайта (будет использоваться позже)
export const analyzeSite = async (websiteUrl: string): Promise<{
  description: string;
  features: string[];
  pages: string[];
}> => {
  try {
    // TODO: Implement website analysis using Puppeteer + AI
    // For now, return a basic structure
    return {
      description: `Анализируемый сайт: ${websiteUrl}`,
      features: ['Веб-сайт', 'Контактная информация'],
      pages: ['Главная страница']
    };
  } catch (error) {
    console.error('Site Analysis Error:', error);
    throw new Error('Ошибка при анализе сайта');
  }
};

export const aiService = {
  generateResponse: generateAIResponse,
  analyzeSite,
  
  // Новая функция: анализ страницы с помощью vision модели
  async analyzePageWithVision(params: {
    screenshot: string;
    pageData: PageAnalysisData;
    agentId: string;
  }): Promise<string> {
    try {
      const systemPrompt = `Ты ИИ-ассистент, который анализирует веб-страницы.
Твоя задача: понять что происходит на странице по скриншоту и данным.

Проанализируй изображение и данные страницы, опиши:
1. Что это за страница (главная, каталог, контакты и т.д.)
2. Какие основные элементы есть на странице (кнопки, формы, меню)
3. Какую информацию ищет или может искать пользователь
4. Какие действия может выполнить пользователь

Отвечай кратко и информативно на русском языке.`;

      const userPrompt = `Данные страницы:
Заголовок: ${params.pageData.title}
URL: ${params.pageData.url}
Основные кнопки: ${params.pageData.buttons.join(', ')}
Заголовки разделов: ${params.pageData.headings.join(', ')}
Формы: ${params.pageData.forms.length} шт.
Ссылки: ${params.pageData.links.length} шт.

Основной текст: ${params.pageData.text.substring(0, 500)}...

Проанализируй эту страницу по скриншоту.`;

      const requestPayload = {
        model: "qwen/qwen2.5-vl-32b-instruct:free",
        messages: [
          {
            role: "system",
            content: systemPrompt
          },
          {
            role: "user", 
            content: [
              {
                type: "text",
                text: userPrompt
              },
              {
                type: "image_url",
                image_url: {
                  url: `data:image/jpeg;base64,${params.screenshot}`
                }
              }
            ]
          }
        ],
        max_tokens: 1000,
        temperature: 0.7
      };

      console.log('🔍 Sending vision analysis request...');

      const response = await axios.post(
        'https://openrouter.ai/api/v1/chat/completions',
        requestPayload,
        {
          headers: {
            'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
            'Content-Type': 'application/json',
            'HTTP-Referer': 'https://bloop.ai',
            'X-Title': 'Bloop.ai Vision Analysis'
          },
          timeout: 30000
        }
      );

      const aiResponse = response.data.choices?.[0]?.message?.content || 'Не удалось проанализировать страницу';
      
      console.log('✅ Vision analysis completed');
      return aiResponse;

    } catch (error) {
      console.error('❌ Vision analysis error:', error);
      throw new Error('Failed to analyze page with vision');
    }
  },

  // Новая функция: чат с контекстом текущей страницы
  async chatWithPageContext(params: {
    message: string;
    pageData: {
      screenshot: string;
      analysis: PageAnalysisData;
      visualDescription: string;
    };
    agentId: string;
    sessionId: string;
  }): Promise<string> {
    try {
      // Получаем данные агента
      const agent = await prisma.agent.findUnique({
        where: { id: params.agentId }
      });

      if (!agent) {
        throw new Error('Agent not found');
      }

      // Сначала проверяем на действия
      const actionResult = await detectIntentAndExecuteAction(
        params.message, 
        {
          businessName: agent.businessName || '',
          businessDesc: agent.businessDesc || '',
          knowledgeBase: agent.knowledgeBase || '',
          systemPrompt: agent.systemPrompt || '',
          responseStyle: agent.responseStyle || ''
        },
        params.sessionId,
        { url: params.pageData.analysis.url, title: params.pageData.analysis.title }
      );

      if (actionResult) {
        return actionResult;
      }

      // Проверяем есть ли скриншот для vision анализа
      const hasScreenshot = params.pageData.screenshot && params.pageData.screenshot.length > 0;
      
      const systemPrompt = `Ты ${agent.agentName} - ИИ-ассистент для ${agent.businessName}.
${agent.businessDesc}

ВАЖНО: ${hasScreenshot ? 'Ты видишь текущую страницу пользователя и можешь помочь с навигацией!' : 'Пользователь находится на странице, но визуальный анализ временно недоступен.'}

Информация о текущей странице:
- Заголовок: ${params.pageData.analysis.title}
- URL: ${params.pageData.analysis.url}
- Доступные кнопки: ${params.pageData.analysis.buttons.join(', ') || 'не определены'}
- Заголовки: ${params.pageData.analysis.headings.join(', ') || 'не определены'}
- Количество форм: ${params.pageData.analysis.forms.length}
- Количество ссылок: ${params.pageData.analysis.links.length}

Описание страницы: ${params.pageData.visualDescription}

${agent.knowledgeBase ? `База знаний:\n${agent.knowledgeBase}` : ''}

Ты можешь:
1. ${hasScreenshot ? 'Объяснить что находится на текущей странице' : 'Предоставить общую информацию о странице'}
2. Подсказать какие кнопки нажать (если они определены)
3. Помочь заполнить формы (если они есть)
4. Направить к нужному разделу
5. Ответить на вопросы о продукте/услуге

${agent.systemPrompt || ''}

Стиль ответов: ${agent.responseStyle || 'дружелюбный и помогающий'}

Отвечай на русском языке, используя доступную информацию о текущей странице для более точной помощи.`;

      if (hasScreenshot) {
        // Используем vision анализ если есть скриншот
        const requestPayload = {
          model: "qwen/qwen2.5-vl-32b-instruct:free",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: [
                {
                  type: "text", 
                  text: `Пользователь находится на странице "${params.pageData.analysis.title}" и спрашивает: ${params.message}`
                },
                {
                  type: "image_url",
                  image_url: {
                    url: `data:image/jpeg;base64,${params.pageData.screenshot}`
                  }
                }
              ]
            }
          ],
          max_tokens: 800,
          temperature: 0.8
        };

        console.log(`💭 Processing contextual chat with vision for page: ${params.pageData.analysis.title}`);

        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          requestPayload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': params.pageData.analysis.url,
              'X-Title': 'Bloop.ai Contextual Chat'
            },
            timeout: 30000
          }
        );

        const aiResponse = response.data.choices?.[0]?.message?.content || 'Извините, не могу ответить на ваш вопрос.';
        
        console.log('✅ Contextual chat response with vision generated');
        return aiResponse;
      } else {
        // Используем обычный текстовый анализ без изображения
        const requestPayload = {
          model: "qwen/qwen2.5-vl-32b-instruct:free",
          messages: [
            {
              role: "system",
              content: systemPrompt
            },
            {
              role: "user",
              content: `Пользователь находится на странице "${params.pageData.analysis.title}" (${params.pageData.analysis.url}) и спрашивает: ${params.message}`
            }
          ],
          max_tokens: 800,
          temperature: 0.8
        };

        console.log(`💭 Processing contextual chat without vision for page: ${params.pageData.analysis.title}`);

        const response = await axios.post(
          'https://openrouter.ai/api/v1/chat/completions',
          requestPayload,
          {
            headers: {
              'Authorization': `Bearer ${process.env.OPENROUTER_API_KEY}`,
              'Content-Type': 'application/json',
              'HTTP-Referer': params.pageData.analysis.url,
              'X-Title': 'Bloop.ai Contextual Chat'
            },
            timeout: 30000
          }
        );

        const aiResponse = response.data.choices?.[0]?.message?.content || 'Извините, не могу ответить на ваш вопрос.';
        
        console.log('✅ Contextual chat response without vision generated');
        return aiResponse;
      }

    } catch (error) {
      console.error('❌ Contextual chat error:', error);
      return 'Извините, произошла ошибка при обработке вашего сообщения. Попробуйте еще раз.';
    }
  }
}; 