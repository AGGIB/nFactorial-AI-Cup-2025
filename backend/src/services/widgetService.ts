import crypto from 'crypto';

export const generateWidgetCode = (): string => {
  // Генерируем уникальный код из 8 символов
  return crypto.randomBytes(4).toString('hex');
};

export const generateWidgetScript = (widgetCode: string, config?: any): string => {
  const scriptConfig = {
    widgetCode,
    apiUrl: process.env.API_URL || 'http://localhost:5001',
    theme: config?.theme || 'light',
    position: config?.position || 'bottom-right',
    primaryColor: config?.primaryColor || '#3B82F6',
    ...config
  };

  return `
<!-- Bloop.ai Widget Script -->
<script>
(function() {
  const config = ${JSON.stringify(scriptConfig, null, 2)};
  
  // Создаем контейнер для виджета
  const widgetContainer = document.createElement('div');
  widgetContainer.id = 'bloop-widget-' + config.widgetCode;
  widgetContainer.style.cssText = \`
    position: fixed;
    bottom: 20px;
    right: 20px;
    width: 60px;
    height: 60px;
    z-index: 9999;
    font-family: system-ui, -apple-system, sans-serif;
  \`;
  
  // Создаем кнопку чата
  const chatButton = document.createElement('button');
  chatButton.style.cssText = \`
    width: 100%;
    height: 100%;
    border: none;
    border-radius: 50%;
    background: linear-gradient(135deg, \${config.primaryColor}, #8B5CF6);
    color: white;
    font-size: 24px;
    cursor: pointer;
    box-shadow: 0 4px 12px rgba(0,0,0,0.15);
    transition: all 0.3s ease;
  \`;
  chatButton.innerHTML = '💬';
  chatButton.title = 'Открыть чат';
  
  // Создаем iframe для чата
  const chatFrame = document.createElement('iframe');
  chatFrame.src = \`\${config.apiUrl}/api/widget/\${config.widgetCode}/chat\`;
  chatFrame.style.cssText = \`
    position: absolute;
    bottom: 80px;
    right: 0;
    width: 350px;
    height: 500px;
    border: none;
    border-radius: 12px;
    box-shadow: 0 8px 32px rgba(0,0,0,0.12);
    background: white;
    display: none;
    overflow: hidden;
  \`;
  
  let isOpen = false;
  
  // Обработчик клика на кнопку
  chatButton.addEventListener('click', function() {
    isOpen = !isOpen;
    chatFrame.style.display = isOpen ? 'block' : 'none';
    chatButton.innerHTML = isOpen ? '✕' : '💬';
    chatButton.title = isOpen ? 'Закрыть чат' : 'Открыть чат';
  });
  
  // Добавляем элементы в контейнер
  widgetContainer.appendChild(chatButton);
  widgetContainer.appendChild(chatFrame);
  
  // Добавляем виджет на страницу когда DOM готов
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      document.body.appendChild(widgetContainer);
    });
  } else {
    document.body.appendChild(widgetContainer);
  }
})();
</script>
<!-- End Bloop.ai Widget -->`;
}; 