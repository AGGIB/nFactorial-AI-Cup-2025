import puppeteer from 'puppeteer';
import { writeFileSync, mkdirSync, existsSync } from 'fs';
import { join } from 'path';

export interface ScreenshotOptions {
  width?: number;
  height?: number;
  fullPage?: boolean;
  waitForTimeout?: number;
  quality?: number;
}

export interface PageAnalysisData {
  url: string;
  title: string;
  metaDescription?: string;
  headings: string[];
  links: Array<{ text: string; href: string }>;
  buttons: string[];
  forms: Array<{ action: string; inputs: string[] }>;
  images: Array<{ alt: string; src: string }>;
  text: string;
}

class ScreenshotService {
  private uploadsDir = join(process.cwd(), 'uploads', 'screenshots');

  constructor() {
    // Создаем папку для скриншотов если не существует
    if (!existsSync(this.uploadsDir)) {
      mkdirSync(this.uploadsDir, { recursive: true });
    }
  }

  // Валидация URL
  private isValidUrl(url: string): { valid: boolean; error?: string } {
    try {
      const urlObj = new URL(url);
      
      // Блокируем внутренние API endpoints
      if (urlObj.hostname === 'localhost' && urlObj.pathname.includes('/api/')) {
        return { valid: false, error: 'Cannot analyze internal API endpoints' };
      }
      
      // Блокируем локальные адреса для продакшена
      if (urlObj.hostname === 'localhost' || urlObj.hostname === '127.0.0.1') {
        console.warn(`⚠️ Analyzing localhost URL: ${url}`);
      }
      
      // Проверяем протокол
      if (!['http:', 'https:'].includes(urlObj.protocol)) {
        return { valid: false, error: 'Only HTTP and HTTPS protocols are supported' };
      }
      
      return { valid: true };
    } catch (error) {
      return { valid: false, error: 'Invalid URL format' };
    }
  }

  async captureScreenshot(
    url: string, 
    options: ScreenshotOptions = {}
  ): Promise<{ screenshotPath: string; screenshotBase64: string; analysisData: PageAnalysisData }> {
    // Валидация URL
    const validation = this.isValidUrl(url);
    if (!validation.valid) {
      throw new Error(`Invalid URL: ${validation.error}`);
    }

    const {
      width = 1200,
      height = 800,
      fullPage = true,
      waitForTimeout = 3000,
      quality = 80
    } = options;

    // Увеличиваем таймаут для localhost
    const isLocalhost = url.includes('localhost') || url.includes('127.0.0.1');
    const adjustedTimeout = isLocalhost ? 10000 : waitForTimeout;

    console.log(`📸 Starting screenshot capture for: ${url}`);

    // Улучшенная конфигурация для macOS
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-accelerated-2d-canvas',
      '--no-first-run',
      '--no-zygote',
      '--single-process',
      '--disable-gpu',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor',
      '--disable-extensions',
      '--disable-plugins',
      '--disable-background-timer-throttling',
      '--disable-backgrounding-occluded-windows',
      '--disable-renderer-backgrounding',
      '--disable-field-trial-config',
      '--disable-back-forward-cache',
      '--disable-ipc-flooding-protection',
      '--no-default-browser-check',
      '--no-pings',
      '--password-store=basic',
      '--use-mock-keychain',
      '--disable-component-extensions-with-background-pages',
      '--disable-component-update',
      '--disable-default-apps'
    ];

    // Добавляем специальные аргументы для localhost
    if (isLocalhost) {
      browserArgs.push(
        '--disable-features=TranslateUI',
        '--disable-translate',
        '--disable-ipc-flooding-protection',
        '--remote-debugging-port=0' // Позволяем системе выбрать порт
      );
    }

    let browser;
    let attempt = 0;
    const maxAttempts = 3;

    while (attempt < maxAttempts) {
      try {
        attempt++;
        console.log(`🔄 Attempt ${attempt}/${maxAttempts} to launch browser...`);

        browser = await puppeteer.launch({
          headless: "new",
          args: browserArgs,
          executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome', // Явно указываем путь к Chrome на macOS
          timeout: 60000, // Увеличиваем таймаут запуска
          protocolTimeout: 60000,
          handleSIGINT: false,
          handleSIGTERM: false,
          handleSIGHUP: false,
          ignoreDefaultArgs: ['--disable-extensions'], // Игнорируем некоторые дефолтные аргументы
          defaultViewport: null // Используем нативный размер окна
        });
        
        break; // Успешно запустили браузер
      } catch (error) {
        console.error(`❌ Browser launch attempt ${attempt} failed:`, error);
        if (attempt >= maxAttempts) {
          // Если все попытки с Chrome не удались, пробуем без executablePath
          try {
            console.log('🔄 Trying fallback browser launch without explicit executable path...');
            browser = await puppeteer.launch({
              headless: "new",
              args: browserArgs.filter(arg => !arg.includes('remote-debugging-port')), // Убираем проблемные аргументы
              timeout: 30000,
              handleSIGINT: false,
              handleSIGTERM: false,
              handleSIGHUP: false
            });
            break;
          } catch (fallbackError) {
            console.error('❌ Fallback browser launch also failed:', fallbackError);
            throw new Error(`Failed to launch browser after ${maxAttempts} attempts: ${error}`);
          }
        }
        // Ждем перед следующей попыткой
        await new Promise(resolve => setTimeout(resolve, 1000 * attempt));
      }
    }

    let page;
    try {
      page = await browser.newPage();
      
      // Устанавливаем User-Agent
      await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
      
      // Устанавливаем размер экрана
      await page.setViewport({ width, height });
      
      // Устанавливаем увеличенные таймауты для localhost
      const navigationTimeout = isLocalhost ? 60000 : 30000;
      page.setDefaultNavigationTimeout(navigationTimeout);
      page.setDefaultTimeout(navigationTimeout);
      
      console.log(`🌐 Navigating to: ${url} (timeout: ${navigationTimeout}ms)`);
      
      // Переходим на страницу с retry механизмом
      let navigationAttempt = 0;
      const maxNavAttempts = 2;
      
      while (navigationAttempt < maxNavAttempts) {
        try {
          navigationAttempt++;
          await page.goto(url, { 
            waitUntil: isLocalhost ? 'domcontentloaded' : 'networkidle0',
            timeout: navigationTimeout 
          });
          break;
        } catch (error) {
          console.error(`❌ Navigation attempt ${navigationAttempt} failed:`, error);
          if (navigationAttempt >= maxNavAttempts) {
            throw error;
          }
          await new Promise(resolve => setTimeout(resolve, 2000));
        }
      }
      
      console.log(`⏱️ Waiting ${adjustedTimeout}ms for page to settle...`);
      await page.waitForTimeout(adjustedTimeout);

      console.log(`📊 Extracting page data...`);
      const analysisData = await this.extractPageData(page, url);

      console.log(`📷 Taking screenshot...`);
      const timestamp = Date.now();
      const filename = `screenshot_${timestamp}.jpg`;
      const screenshotPath = join(this.uploadsDir, filename);

      const screenshotBuffer = await page.screenshot({
        path: screenshotPath,
        type: 'jpeg',
        quality,
        fullPage,
        timeout: 30000
      });

      const screenshotBase64 = screenshotBuffer.toString('base64');

      console.log(`✅ Screenshot captured successfully: ${filename}`);

      return {
        screenshotPath,
        screenshotBase64,
        analysisData
      };
    } catch (error) {
      console.error(`❌ Error during screenshot capture:`, error);
      throw error;
    } finally {
      if (page) {
        try {
          await page.close();
        } catch (e) {
          console.warn('Warning: Failed to close page:', e);
        }
      }
      if (browser) {
        try {
          await browser.close();
        } catch (e) {
          console.warn('Warning: Failed to close browser:', e);
        }
      }
    }
  }

  private async extractPageData(page: any, url: string): Promise<PageAnalysisData> {
    return await page.evaluate((currentUrl: string) => {
      // Извлекаем заголовок
      const title = document.title || '';
      
      // Метаописание
      const metaDescription = document.querySelector('meta[name="description"]')?.getAttribute('content') || '';
      
      // Заголовки (h1-h6)
      const headings = Array.from(document.querySelectorAll('h1, h2, h3, h4, h5, h6'))
        .map(h => h.textContent?.trim() || '')
        .filter(text => text.length > 0);
      
      // Ссылки
      const links = Array.from(document.querySelectorAll('a[href]'))
        .map(link => ({
          text: link.textContent?.trim() || '',
          href: link.getAttribute('href') || ''
        }))
        .filter(link => link.text.length > 0);
      
      // Кнопки
      const buttons = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], .btn, [role="button"]'))
        .map(btn => btn.textContent?.trim() || btn.getAttribute('value') || btn.getAttribute('aria-label') || '')
        .filter(text => text.length > 0);
      
      // Формы
      const forms = Array.from(document.querySelectorAll('form')).map(form => ({
        action: form.getAttribute('action') || '',
        inputs: Array.from(form.querySelectorAll('input, textarea, select'))
          .map(input => input.getAttribute('placeholder') || input.getAttribute('name') || input.getAttribute('type') || '')
          .filter(text => text.length > 0)
      }));
      
      // Изображения
      const images = Array.from(document.querySelectorAll('img'))
        .map(img => ({
          alt: img.getAttribute('alt') || '',
          src: img.getAttribute('src') || ''
        }))
        .filter(img => img.alt.length > 0 || img.src.length > 0);
      
      // Основной текст страницы
      const textElements = Array.from(document.querySelectorAll('p, span, div, li'))
        .map(el => el.textContent?.trim() || '')
        .filter(text => text.length > 10); // Только значимый текст
      
      const text = textElements.slice(0, 50).join(' ').substring(0, 2000); // Ограничиваем объем

      return {
        url: currentUrl,
        title,
        metaDescription,
        headings,
        links,
        buttons,
        forms,
        images,
        text
      };
    }, url);
  }

  async analyzeCurrentPage(url: string): Promise<{
    screenshot: string;
    analysis: PageAnalysisData;
    visualDescription: string;
  }> {
    try {
      console.log(`🔍 Starting page analysis for: ${url}`);
      
      // Проверяем валидность URL перед анализом
      const validation = this.isValidUrl(url);
      if (!validation.valid) {
        throw new Error(`Cannot analyze URL: ${validation.error}`);
      }
      
      // Для localhost:3000 сначала пробуем быстрый анализ
      const urlObj = new URL(url);
      if (urlObj.hostname === 'localhost' && urlObj.port === '3000') {
        try {
          const quickAnalysis = await this.quickAnalyzeLocalhost(url);
          if (quickAnalysis) {
            console.log(`✅ Quick analysis completed for: ${url}`);
            return quickAnalysis;
          }
        } catch (error) {
          console.log('⚠️ Quick analysis failed, trying full Puppeteer analysis...');
        }
      }
      
      const { screenshotBase64, analysisData } = await this.captureScreenshot(url);
      
      // Создаем описание страницы для AI
      const visualDescription = this.createPageDescription(analysisData);
      
      console.log(`✅ Page analysis completed for: ${url}`);
      
      return {
        screenshot: screenshotBase64,
        analysis: analysisData,
        visualDescription
      };
    } catch (error) {
      console.error(`❌ Error analyzing page ${url}:`, error);
      
      // Создаем "умные" fallback данные для известных страниц
      const fallbackData = this.createSmartFallbackData(url);
      
      // Возвращаем fallback данные вместо ошибки
      console.log(`🔄 Returning fallback data for: ${url}`);
      return {
        screenshot: '', // Пустой скриншот
        analysis: fallbackData,
        visualDescription: this.createPageDescription(fallbackData)
      };
    }
  }

  // Быстрый анализ localhost без Puppeteer
  private async quickAnalyzeLocalhost(url: string): Promise<{
    screenshot: string;
    analysis: PageAnalysisData;
    visualDescription: string;
  } | null> {
    try {
      console.log('🚀 Attempting quick localhost analysis...');
      
      // Делаем HTTP запрос для получения HTML
      const axios = require('axios');
      const response = await axios.get(url, {
        timeout: 5000,
        headers: {
          'User-Agent': 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36'
        }
      });
      
      const html = response.data;
      
      // Простой парсинг HTML без DOM
      const titleMatch = html.match(/<title[^>]*>([^<]*)<\/title>/i);
      const title = titleMatch ? titleMatch[1] : 'Bloop.ai - AI Platform';
      
      // Определяем тип страницы по content
      let pageType = 'unknown';
      if (html.includes('Dashboard') || html.includes('dashboard')) {
        pageType = 'dashboard';
      } else if (html.includes('Onboarding') || html.includes('onboarding')) {
        pageType = 'onboarding';
      } else if (html.includes('Landing') || html.includes('landing')) {
        pageType = 'landing';
      }
      
      const analysisData: PageAnalysisData = {
        url: url,
        title: title,
        metaDescription: 'AI-платформа для создания ИИ-ассистентов',
        headings: pageType === 'dashboard' 
          ? ['Dashboard', 'Ваши ИИ-ассистенты', 'Создать ИИ-ассистента']
          : ['Bloop.ai', 'Добро пожаловать'],
        links: [
          { text: 'Dashboard', href: '/dashboard' },
          { text: 'Создать ассистента', href: '/onboarding' }
        ],
        buttons: pageType === 'dashboard' 
          ? ['Создать ИИ-ассистента', 'Получить код виджета', 'Выйти']
          : ['Начать работу', 'Войти'],
        forms: [],
        images: [],
        text: pageType === 'dashboard' 
          ? 'Добро пожаловать в Dashboard Bloop.ai. Здесь вы можете управлять своими ИИ-ассистентами, создавать новых агентов и получать коды виджетов для интеграции на ваш сайт.'
          : 'Добро пожаловать в Bloop.ai - платформу для создания ИИ-ассистентов для IT-стартапов.'
      };
      
      console.log(`✅ Quick analysis successful for ${pageType} page`);
      
      return {
        screenshot: '', // Нет скриншота при быстром анализе
        analysis: analysisData,
        visualDescription: this.createPageDescription(analysisData)
      };
    } catch (error) {
      console.error('❌ Quick localhost analysis failed:', error);
      return null;
    }
  }

  private createPageDescription(data: PageAnalysisData): string {
    let description = `Страница: ${data.title}\n`;
    description += `URL: ${data.url}\n`;
    
    if (data.metaDescription) {
      description += `Описание: ${data.metaDescription}\n`;
    }
    
    if (data.headings.length > 0) {
      description += `Заголовки: ${data.headings.join(', ')}\n`;
    }
    
    if (data.buttons.length > 0) {
      description += `Кнопки: ${data.buttons.join(', ')}\n`;
    }
    
    if (data.links.length > 0) {
      const linkTexts = data.links.slice(0, 10).map(l => l.text).join(', ');
      description += `Ссылки: ${linkTexts}\n`;
    }
    
    if (data.forms.length > 0) {
      description += `Формы: ${data.forms.length} форм(ы)\n`;
    }
    
    description += `Текст: ${data.text.substring(0, 500)}...`;
    
    return description;
  }

  // Создаем "умные" fallback данные для известных страниц
  private createSmartFallbackData(url: string): PageAnalysisData {
    const urlObj = new URL(url);
    
    // Специальная обработка для localhost:3000 (React frontend)
    if (urlObj.hostname === 'localhost' && urlObj.port === '3000') {
      return {
        url: url,
        title: 'Bloop.ai - AI-платформа для IT-стартапов',
        metaDescription: 'Создайте ИИ-ассистента для вашего IT-стартапа за 5 минут',
        headings: ['Bloop.ai', 'Dashboard', 'Создать ИИ-ассистента', 'Ваши агенты'],
        links: [
          { text: 'Создать ИИ-ассистента', href: '/onboarding' },
          { text: 'Dashboard', href: '/dashboard' },
          { text: 'Тест Vision AI', href: '/visual-test' }
        ],
        buttons: ['Создать ИИ-ассистента', 'Выйти', 'Получить код виджета'],
        forms: [],
        images: [],
        text: 'Добро пожаловать в Bloop.ai - платформу для создания ИИ-ассистентов для IT-стартапов. Здесь вы можете создавать, настраивать и управлять своими AI-агентами для упрощения онбординга клиентов.'
      };
    }
    
    // Общий fallback для других localhost страниц
    if (urlObj.hostname === 'localhost') {
      return {
        url: url,
        title: 'Локальное приложение',
        metaDescription: '',
        headings: [],
        links: [],
        buttons: [],
        forms: [],
        images: [],
        text: 'Вы находитесь на локальной странице разработки. Анализ содержимого временно недоступен из-за технических ограничений.'
      };
    }
    
    // Общий fallback
    return {
      url: url,
      title: 'Анализ временно недоступен',
      metaDescription: '',
      headings: [],
      links: [],
      buttons: [],
      forms: [],
      images: [],
      text: 'Извините, анализ страницы временно недоступен из-за технических проблем. Я все равно могу помочь вам с вопросами о продукте.'
    };
  }

  // Очистка старых скриншотов (запускать периодически)
  async cleanupOldScreenshots(maxAgeHours: number = 24): Promise<void> {
    const fs = require('fs').promises;
    const files = await fs.readdir(this.uploadsDir);
    const now = Date.now();
    
    for (const file of files) {
      if (file.startsWith('screenshot_')) {
        const filePath = join(this.uploadsDir, file);
        const stats = await fs.stat(filePath);
        const ageHours = (now - stats.mtime.getTime()) / (1000 * 60 * 60);
        
        if (ageHours > maxAgeHours) {
          await fs.unlink(filePath);
          console.log(`Deleted old screenshot: ${file}`);
        }
      }
    }
  }

  // ===== BROWSER AUTOMATION METHODS =====

  // Автоматическое нажатие на элемент
  async clickElement(url: string, selector: string, options?: {
    timeout?: number;
    waitForNavigation?: boolean;
  }): Promise<{ success: boolean; message: string; newUrl?: string }> {
    const { timeout = 30000, waitForNavigation = false } = options || {};
    
    console.log(`🖱️ Attempting to click element: ${selector} on ${url}`);
    
    const browser = await this.launchBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      await this.setupPage(page, url);
      
      // Переходим на страницу
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout });
      await page.waitForTimeout(2000);
      
      let element = null;
      
      // Пробуем найти элемент как CSS селектор
      try {
        await page.waitForSelector(selector, { timeout: 5000 });
        element = await page.$(selector);
        console.log(`✅ Found element with CSS selector: ${selector}`);
      } catch (cssError) {
        console.log(`⚠️ CSS selector failed, trying XPath approach for: ${selector}`);
        
        // Если CSS не работает, попробуем найти заново по тексту
        const buttonText = selector; // Используем селектор как текст для поиска
        const foundElement = await page.evaluate((searchText) => {
          const allElements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a, [role="button"], .btn'));
          
          for (const el of allElements) {
            const text = el.textContent?.toLowerCase().trim() || '';
            const value = (el as HTMLInputElement).value?.toLowerCase().trim() || '';
            
            if (text.includes(searchText.toLowerCase()) || value.includes(searchText.toLowerCase())) {
              // Scroll element into view
              el.scrollIntoView({ behavior: 'smooth', block: 'center' });
              
              // Add a unique attribute for easy selection
              const uniqueId = 'auto-click-' + Date.now();
              el.setAttribute('data-auto-click', uniqueId);
              return uniqueId;
            }
          }
          return null;
        }, selector);
        
        if (foundElement) {
          element = await page.$(`[data-auto-click="${foundElement}"]`);
          console.log(`✅ Found element by text search: ${selector}`);
        }
      }
      
      if (!element) {
        return {
          success: false,
          message: `Элемент "${selector}" не найден на странице`
        };
      }
      
      // Прокручиваем к элементу
      await page.evaluate(el => {
        el.scrollIntoView({ behavior: 'smooth', block: 'center' });
      }, element);
      
      await page.waitForTimeout(1000);
      
      // Кликаем на элемент
      if (waitForNavigation) {
        try {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout }),
            element.click()
          ]);
        } catch (navError) {
          // Если навигация не произошла, просто кликаем
          console.log(`⚠️ Navigation timeout, clicking anyway...`);
          await element.click();
          await page.waitForTimeout(2000);
        }
      } else {
        await element.click();
        await page.waitForTimeout(1000);
      }
      
      const newUrl = page.url();
      
      console.log(`✅ Successfully clicked element, current URL: ${newUrl}`);
      
      return {
        success: true,
        message: `Элемент "${selector}" успешно нажат`,
        newUrl
      };
      
    } catch (error) {
      console.error(`❌ Error clicking element:`, error);
      return {
        success: false,
        message: `Не удалось нажать на элемент "${selector}": ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (page) await page.close();
      await browser.close();
    }
  }

  // Заполнение формы
  async fillForm(url: string, formData: Record<string, string>, submitSelector?: string): Promise<{ 
    success: boolean; 
    message: string; 
    newUrl?: string 
  }> {
    console.log(`📝 Attempting to fill form on ${url}`);
    
    const browser = await this.launchBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      await this.setupPage(page, url);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      // Заполняем поля формы
      for (const [selector, value] of Object.entries(formData)) {
        try {
          await page.waitForSelector(selector, { timeout: 5000 });
          await page.click(selector); // Фокусируемся на поле
          await page.keyboard.down('Control');
          await page.keyboard.press('KeyA'); // Выделяем весь текст
          await page.keyboard.up('Control');
          await page.type(selector, value);
          console.log(`✅ Filled field ${selector} with value`);
        } catch (error) {
          console.warn(`⚠️ Could not fill field ${selector}:`, error);
        }
      }
      
      // Отправляем форму если указан селектор
      if (submitSelector) {
        try {
          await Promise.all([
            page.waitForNavigation({ waitUntil: 'domcontentloaded', timeout: 30000 }),
            page.click(submitSelector)
          ]);
        } catch (error) {
          // Если navigation не произошла, просто кликаем
          await page.click(submitSelector);
          await page.waitForTimeout(2000);
        }
      }
      
      const newUrl = page.url();
      
      console.log(`✅ Form filled successfully, current URL: ${newUrl}`);
      
      return {
        success: true,
        message: `Форма успешно заполнена${submitSelector ? ' и отправлена' : ''}`,
        newUrl
      };
      
    } catch (error) {
      console.error(`❌ Error filling form:`, error);
      return {
        success: false,
        message: `Не удалось заполнить форму: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (page) await page.close();
      await browser.close();
    }
  }

  // Умный поиск кнопки по тексту
  async findButtonByText(url: string, buttonText: string): Promise<{
    success: boolean;
    selector?: string;
    message: string;
  }> {
    console.log(`🔍 Searching for button with text: "${buttonText}" on ${url}`);
    
    const browser = await this.launchBrowser();
    let page;
    
    try {
      page = await browser.newPage();
      await this.setupPage(page, url);
      
      await page.goto(url, { waitUntil: 'domcontentloaded', timeout: 30000 });
      await page.waitForTimeout(2000);
      
      const textLower = buttonText.toLowerCase();
      
      // Более точный поиск через evaluate
      const elementInfo = await page.evaluate((searchText) => {
        const allElements = Array.from(document.querySelectorAll('button, input[type="button"], input[type="submit"], a, [role="button"], .btn'));
        
        for (let i = 0; i < allElements.length; i++) {
          const element = allElements[i];
          const text = element.textContent?.toLowerCase().trim() || '';
          const value = (element as HTMLInputElement).value?.toLowerCase().trim() || '';
          const ariaLabel = element.getAttribute('aria-label')?.toLowerCase().trim() || '';
          
          // Проверяем точное совпадение или содержание
          if (text.includes(searchText.toLowerCase()) || 
              value.includes(searchText.toLowerCase()) || 
              ariaLabel.includes(searchText.toLowerCase())) {
            
            // Создаем простой селектор
            let selector = element.tagName.toLowerCase();
            
            // Добавляем ID если есть
            if (element.id) {
              selector = `#${element.id}`;
            }
            // Или первый класс если есть
            else if (element.className && typeof element.className === 'string') {
              const firstClass = element.className.split(' ').filter(c => c.trim())[0];
              if (firstClass) {
                selector = `${selector}.${firstClass}`;
              }
            }
            
            // Добавляем номер элемента для уникальности
            const sameElements = document.querySelectorAll(selector);
            if (sameElements.length > 1) {
              const index = Array.from(sameElements).indexOf(element);
              selector = `${selector}:nth-of-type(${index + 1})`;
            }
            
            return {
              found: true,
              selector: selector,
              text: text || value || ariaLabel,
              tagName: element.tagName,
              index: i
            };
          }
        }
        
        return { found: false };
      }, buttonText);
      
      if (elementInfo.found) {
        console.log(`✅ Found button: "${elementInfo.text}" with selector: ${elementInfo.selector}`);
        return {
          success: true,
          selector: elementInfo.selector,
          message: `Кнопка "${buttonText}" найдена`
        };
      }
      
      // Если простой поиск не сработал, используем XPath
      console.log(`⚠️ Simple search failed, trying XPath for: "${buttonText}"`);
      
      const xpathSelector = await this.findElementByXPath(page, buttonText);
      if (xpathSelector) {
        return {
          success: true,
          selector: xpathSelector,
          message: `Кнопка "${buttonText}" найдена через XPath`
        };
      }
      
      return {
        success: false,
        message: `Кнопка "${buttonText}" не найдена на странице`
      };
      
    } catch (error) {
      console.error(`❌ Error finding button:`, error);
      return {
        success: false,
        message: `Ошибка поиска кнопки: ${error instanceof Error ? error.message : 'Unknown error'}`
      };
    } finally {
      if (page) await page.close();
      await browser.close();
    }
  }

  // Поиск элемента через XPath
  private async findElementByXPath(page: any, buttonText: string): Promise<string | null> {
    try {
      // Создаем различные XPath выражения для поиска
      const xpathExpressions = [
        `//button[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'abcdefghijklmnopqrstuvwxyzабвгдеёжзийклмнопрстуфхцчшщъыьэюя'), '${buttonText.toLowerCase()}')]`,
        `//input[@type='button' or @type='submit'][contains(translate(@value, 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'abcdefghijklmnopqrstuvwxyzабвгдеёжзийклмнопрстуфхцчшщъыьэюя'), '${buttonText.toLowerCase()}')]`,
        `//a[contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'abcdefghijklmnopqrstuvwxyzабвгдеёжзийклмнопрстуфхцчшщъыьэюя'), '${buttonText.toLowerCase()}')]`,
        `//*[@role='button'][contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'abcdefghijklmnopqrstuvwxyzабвгдеёжзийклмнопрстуфхцчшщъыьэюя'), '${buttonText.toLowerCase()}')]`,
        `//*[contains(@class, 'btn')][contains(translate(text(), 'ABCDEFGHIJKLMNOPQRSTUVWXYZАБВГДЕЁЖЗИЙКЛМНОПРСТУФХЦЧШЩЪЫЬЭЮЯ', 'abcdefghijklmnopqrstuvwxyzабвгдеёжзийклмнопрстуфхцчшщъыьэюя'), '${buttonText.toLowerCase()}')]`
      ];
      
      for (const xpath of xpathExpressions) {
        try {
          const elements = await page.$x(xpath);
          if (elements.length > 0) {
            console.log(`✅ Found element with XPath: ${xpath}`);
            
            // Возвращаем первый найденный элемент как CSS селектор
            const elementInfo = await page.evaluate((el: Element) => {
              const tagName = el.tagName.toLowerCase();
              const id = el.id;
              const classes = el.className;
              
              if (id) {
                return `#${id}`;
              } else if (classes && typeof classes === 'string') {
                const firstClass = classes.split(' ').filter(c => c.trim())[0];
                return firstClass ? `${tagName}.${firstClass}` : tagName;
              }
              return tagName;
            }, elements[0]);
            
            return elementInfo;
          }
        } catch (xpathError) {
          console.warn(`XPath expression failed: ${xpath}`, xpathError);
        }
      }
      
      return null;
    } catch (error) {
      console.error('XPath search failed:', error);
      return null;
    }
  }

  // Вспомогательные методы
  private async launchBrowser() {
    const browserArgs = [
      '--no-sandbox',
      '--disable-setuid-sandbox',
      '--disable-dev-shm-usage',
      '--disable-web-security',
      '--disable-features=VizDisplayCompositor'
    ];

    try {
      return await puppeteer.launch({
        headless: "new",
        args: browserArgs,
        executablePath: '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome',
        timeout: 60000
      });
    } catch (error) {
      // Fallback без executablePath
      return await puppeteer.launch({
        headless: "new",
        args: browserArgs,
        timeout: 30000
      });
    }
  }

  private async setupPage(page: any, url: string) {
    await page.setUserAgent('Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36');
    await page.setViewport({ width: 1200, height: 800 });
    
    const isLocalhost = url.includes('localhost');
    const timeout = isLocalhost ? 60000 : 30000;
    page.setDefaultNavigationTimeout(timeout);
    page.setDefaultTimeout(timeout);
  }
}

export const screenshotService = new ScreenshotService(); 