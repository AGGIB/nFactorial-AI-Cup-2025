import React, { useState, useEffect, useCallback } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { 
  Bot, 
  ArrowLeft, 
  Settings, 
  FileText, 
  TestTube, 
  MessageSquare, 
  BarChart3,
  Upload,
  Eye,
  Code,
  Save
} from 'lucide-react';
import { agentsAPI } from '../services/api';
import { Agent } from '../types';

type TabType = 'overview' | 'settings' | 'knowledge' | 'testing' | 'messages' | 'analytics';

const AgentDetail: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();
  const [agent, setAgent] = useState<Agent | null>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<TabType>('overview');
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  const menuItems = [
    { id: 'overview', label: 'Ассистент', icon: <Bot className="h-5 w-5" /> },
    { id: 'settings', label: 'Настройки', icon: <Settings className="h-5 w-5" /> },
    { id: 'knowledge', label: 'База знаний', icon: <FileText className="h-5 w-5" /> },
    { id: 'testing', label: 'Тестирование', icon: <TestTube className="h-5 w-5" /> },
    { id: 'messages', label: 'Сообщения', icon: <MessageSquare className="h-5 w-5" /> },
    { id: 'analytics', label: 'Статистика', icon: <BarChart3 className="h-5 w-5" /> },
  ];

  const loadAgent = useCallback(async () => {
    if (!id) return;
    
    try {
      setLoading(true);
      const response = await agentsAPI.getById(id);
      
      if (response.success && response.data) {
        const agentData = response.data.agent;
        
        // Парсим settings если это JSON строка
        if (typeof agentData.settings === 'string') {
          try {
            agentData.settings = JSON.parse(agentData.settings);
          } catch (error) {
            console.error('Ошибка парсинга settings:', error);
            agentData.settings = {};
          }
        }
        
        setAgent(agentData);
      } else {
        showNotification('Агент не найден', 'error');
        navigate('/dashboard');
      }
    } catch (error: any) {
      console.error('Ошибка загрузки агента:', error);
      showNotification('Ошибка загрузки агента', 'error');
      navigate('/dashboard');
    } finally {
      setLoading(false);
    }
  }, [id, navigate]);

  useEffect(() => {
    loadAgent();
  }, [loadAgent]);

  const showNotification = (message: string, type: 'success' | 'error' = 'success') => {
    setNotification(message);
    setNotificationType(type);
    setTimeout(() => setNotification(null), 5000);
  };

  const handleBack = () => {
    navigate('/dashboard');
  };

  const renderContent = () => {
    if (!agent) return null;

    switch (activeTab) {
      case 'overview':
        return <OverviewTab agent={agent} onUpdate={loadAgent} showNotification={showNotification} />;
      case 'settings':
        return <SettingsTab agent={agent} onUpdate={loadAgent} showNotification={showNotification} />;
      case 'knowledge':
        return <KnowledgeTab agent={agent} onUpdate={loadAgent} showNotification={showNotification} />;
      case 'testing':
        return <TestingTab agent={agent} showNotification={showNotification} />;
      case 'messages':
        return <MessagesTab agent={agent} />;
      case 'analytics':
        return <AnalyticsTab agent={agent} />;
      default:
        return <OverviewTab agent={agent} onUpdate={loadAgent} showNotification={showNotification} />;
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <Bot className="h-16 w-16 text-gray-400 animate-pulse" />
      </div>
    );
  }

  if (!agent) {
    return (
      <div className="min-h-screen bg-gray-50 flex items-center justify-center">
        <div className="text-center">
          <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
          <p className="text-gray-600">Агент не найден</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Notification */}
      {notification && (
        <div className={`fixed top-4 right-4 bg-${notificationType === 'success' ? 'green' : 'red'}-500 text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slideDown`}>
          {notification}
        </div>
      )}

      {/* Header */}
      <header className="bg-white shadow-sm border-b border-gray-200">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <div className="flex items-center space-x-4">
              <button
                onClick={handleBack}
                className="flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors"
              >
                <ArrowLeft className="h-5 w-5" />
                Dashboard
              </button>
              
              <div className="h-6 w-px bg-gray-300"></div>
              
              <div className="flex items-center space-x-3">
                <div className="w-8 h-8 bg-primary-100 rounded-lg flex items-center justify-center">
                  <Bot className="h-4 w-4 text-primary-600" />
                </div>
                <div>
                  <h1 className="text-lg font-semibold text-gray-900">{agent.name}</h1>
                  <p className="text-sm text-gray-500">ИИ-ассистент</p>
                </div>
              </div>
            </div>
            
            <div className="flex items-center space-x-4">
              <span className="text-sm text-gray-600">
                {user?.name || user?.email}
              </span>
            </div>
          </div>
        </div>
      </header>

      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="flex gap-6">
          {/* Sidebar */}
          <div className="w-64 bg-white rounded-lg shadow-sm border p-4">
            <nav className="space-y-2">
              {menuItems.map((item) => (
                <button
                  key={item.id}
                  onClick={() => setActiveTab(item.id as TabType)}
                  className={`w-full flex items-center gap-3 px-3 py-2 text-left rounded-lg transition-colors ${
                    activeTab === item.id
                      ? 'bg-primary-50 text-primary-700 border border-primary-200'
                      : 'text-gray-700 hover:bg-gray-50'
                  }`}
                >
                  {item.icon}
                  {item.label}
                </button>
              ))}
            </nav>
          </div>

          {/* Main Content */}
          <div className="flex-1">
            {renderContent()}
          </div>
        </div>
      </div>
    </div>
  );
};

// Overview Tab Component
const OverviewTab: React.FC<{ agent: Agent; onUpdate: () => void; showNotification: (msg: string, type?: 'success' | 'error') => void }> = ({ agent, onUpdate, showNotification }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Обзор ассистента</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Основная информация</h3>
          <div className="space-y-3">
            <div>
              <label className="text-sm font-medium text-gray-700">Название</label>
              <p className="text-gray-900">{agent.name}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Описание</label>
              <p className="text-gray-600">{agent.description}</p>
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Веб-сайт</label>
              {agent.websiteUrl ? (
                <a 
                  href={agent.websiteUrl} 
                  target="_blank" 
                  rel="noopener noreferrer"
                  className="text-primary-600 hover:text-primary-700"
                >
                  {agent.websiteUrl}
                </a>
              ) : (
                <p className="text-gray-400">Не указан</p>
              )}
            </div>
            <div>
              <label className="text-sm font-medium text-gray-700">Статус</label>
              <div className="flex items-center gap-2">
                <div className={`w-2 h-2 rounded-full ${agent.isActive ? 'bg-green-500' : 'bg-gray-400'}`}></div>
                <span className={agent.isActive ? 'text-green-700' : 'text-gray-500'}>
                  {agent.isActive ? 'Активен' : 'Неактивен'}
                </span>
              </div>
            </div>
          </div>
        </div>

        <div>
          <h3 className="text-lg font-medium text-gray-900 mb-4">Статистика</h3>
          <div className="space-y-3">
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Всего диалогов</span>
                <span className="text-lg font-semibold text-gray-900">{agent.totalChats || 0}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Всего сообщений</span>
                <span className="text-lg font-semibold text-gray-900">{agent.totalMessages || 0}</span>
              </div>
            </div>
            <div className="bg-gray-50 p-4 rounded-lg">
              <div className="flex justify-between items-center">
                <span className="text-sm text-gray-600">Создан</span>
                <span className="text-sm text-gray-900">
                  {new Date(agent.createdAt).toLocaleDateString('ru-RU')}
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

// Settings Tab Component
const SettingsTab: React.FC<{ agent: Agent; onUpdate: () => void; showNotification: (msg: string, type?: 'success' | 'error') => void }> = ({ agent, onUpdate, showNotification }) => {
  const [formData, setFormData] = useState({
    name: agent.name,
    description: agent.description,
    websiteUrl: agent.websiteUrl || '',
    isActive: agent.isActive,
    responseStyle: agent.settings?.responseStyle || 'helpful'
  });
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      
      // Подготавливаем данные для отправки
      const updateData = {
        name: formData.name,
        description: formData.description,
        websiteUrl: formData.websiteUrl,
        isActive: formData.isActive,
        settings: {
          ...(agent.settings || {}),
          responseStyle: formData.responseStyle
        }
      };
      
      const response = await agentsAPI.update(agent.id, updateData);
      
      if (response.success) {
        showNotification('Настройки сохранены');
        onUpdate();
      } else {
        showNotification('Ошибка сохранения настроек', 'error');
      }
    } catch (error) {
      showNotification('Ошибка сохранения настроек', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <div className="flex justify-between items-center mb-6">
        <h2 className="text-xl font-semibold text-gray-900">Настройки ассистента</h2>
        <button
          onClick={handleSave}
          disabled={saving}
          className="btn-primary flex items-center gap-2"
        >
          <Save className="h-4 w-4" />
          {saving ? 'Сохранение...' : 'Сохранить'}
        </button>
      </div>

      <div className="space-y-6">
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Название ассистента
          </label>
          <input
            type="text"
            value={formData.name}
            onChange={(e) => setFormData({...formData, name: e.target.value})}
            className="input-field"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Описание
          </label>
          <textarea
            value={formData.description}
            onChange={(e) => setFormData({...formData, description: e.target.value})}
            className="input-field h-24 resize-none"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Веб-сайт
          </label>
          <input
            type="url"
            value={formData.websiteUrl}
            onChange={(e) => setFormData({...formData, websiteUrl: e.target.value})}
            className="input-field"
            placeholder="https://example.com"
          />
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Стиль ответов
          </label>
          <select
            value={formData.responseStyle}
            onChange={(e) => setFormData({...formData, responseStyle: e.target.value as 'helpful' | 'formal' | 'casual' | 'technical'})}
            className="input-field"
          >
            <option value="helpful">Дружелюбный</option>
            <option value="formal">Формальный</option>
            <option value="casual">Неформальный</option>
            <option value="technical">Технический</option>
          </select>
        </div>

        <div className="flex items-center gap-3">
          <input
            type="checkbox"
            id="isActive"
            checked={formData.isActive}
            onChange={(e) => setFormData({...formData, isActive: e.target.checked})}
            className="h-4 w-4 text-primary-600 border-gray-300 rounded focus:ring-primary-500"
          />
          <label htmlFor="isActive" className="text-sm font-medium text-gray-700">
            Ассистент активен
          </label>
        </div>
      </div>
    </div>
  );
};

// Knowledge Tab Component
const KnowledgeTab: React.FC<{ agent: Agent; onUpdate: () => void; showNotification: (msg: string, type?: 'success' | 'error') => void }> = ({ agent, onUpdate, showNotification }) => {
  const [knowledgeBase, setKnowledgeBase] = useState(agent.knowledgeBase || '');
  const [saving, setSaving] = useState(false);

  const handleSave = async () => {
    try {
      setSaving(true);
      const response = await agentsAPI.update(agent.id, { knowledgeBase });
      
      if (response.success) {
        showNotification('База знаний обновлена');
        onUpdate();
      } else {
        showNotification('Ошибка обновления базы знаний', 'error');
      }
    } catch (error) {
      showNotification('Ошибка обновления базы знаний', 'error');
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="space-y-6">
      <div className="bg-white rounded-lg shadow-sm border p-6">
        <div className="flex justify-between items-center mb-6">
          <h2 className="text-xl font-semibold text-gray-900">База знаний</h2>
          <button
            onClick={handleSave}
            disabled={saving}
            className="btn-primary flex items-center gap-2"
          >
            <Save className="h-4 w-4" />
            {saving ? 'Сохранение...' : 'Сохранить'}
          </button>
        </div>

        <div>
          <label className="block text-sm font-medium text-gray-700 mb-2">
            Текстовая база знаний
          </label>
          <textarea
            value={knowledgeBase}
            onChange={(e) => setKnowledgeBase(e.target.value)}
            className="input-field h-64 resize-none"
            placeholder="Введите FAQ, инструкции, описания API и другую информацию, которую должен знать ассистент..."
          />
          <p className="text-sm text-gray-500 mt-2">
            Эта информация будет использоваться ассистентом для ответов на вопросы пользователей.
          </p>
        </div>
      </div>

      <div className="bg-white rounded-lg shadow-sm border p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4">Загрузка файлов</h3>
        
        <div className="border-2 border-dashed border-gray-300 rounded-lg p-8 text-center">
          <Upload className="h-12 w-12 text-gray-400 mx-auto mb-4" />
          <h4 className="text-lg font-medium text-gray-900 mb-2">Загрузите документы</h4>
          <p className="text-gray-600 mb-4">
            Поддерживаются файлы PDF, DOC, DOCX, TXT
          </p>
          <button className="btn-secondary" disabled>
            Выбрать файлы (скоро)
          </button>
        </div>
        
        <p className="text-sm text-gray-500 mt-4">
          Функция загрузки файлов будет доступна в следующем обновлении.
        </p>
      </div>
    </div>
  );
};

// Testing Tab Component
const TestingTab: React.FC<{ agent: Agent; showNotification: (msg: string, type?: 'success' | 'error') => void }> = ({ agent, showNotification }) => {
  const [widgetCode, setWidgetCode] = useState('');
  const [loading, setLoading] = useState(false);
  const [iframeKey, setIframeKey] = useState(0);

  useEffect(() => {
    if (agent.isActive) {
      getWidgetCode();
    }
  }, [agent.isActive]);

  const getWidgetCode = async () => {
    setLoading(true);
    try {
      console.log('Получаем код виджета для агента:', agent.id);
      
      const response = await agentsAPI.getWidgetCode(agent.id);
      console.log('Ответ от API:', response);
      
      if (response.success && response.data) {
        console.log('Код виджета получен:', response.data.script.substring(0, 100) + '...');
        setWidgetCode(response.data.script);
        showNotification('Код виджета обновлен');
      } else {
        console.error('Ошибка получения кода виджета:', response);
        showNotification('Ошибка получения кода виджета', 'error');
      }
    } catch (error) {
      console.error('Исключение при получении кода виджета:', error);
      showNotification('Ошибка получения кода виджета', 'error');
    } finally {
      setLoading(false);
    }
  };

  const copyToClipboard = () => {
    navigator.clipboard.writeText(widgetCode);
    showNotification('Код скопирован в буфер обмена');
  };

  const reloadPreview = () => {
    setIframeKey(prev => prev + 1);
    showNotification('Предпросмотр перезагружен');
  };

  const generatePreviewHTML = () => {
    // Добавляем отладочную информацию
    console.log('Генерируем HTML предпросмотр для агента:', agent.name);
    console.log('Код виджета:', widgetCode ? 'Есть' : 'Отсутствует');
    
    return `
<!DOCTYPE html>
<html lang="ru">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>Предпросмотр виджета - ${agent.name}</title>
    <style>
        * {
            box-sizing: border-box;
        }
        body {
            font-family: -apple-system, BlinkMacSystemFont, 'Segoe UI', Roboto, Oxygen, Ubuntu, Cantarell, sans-serif;
            margin: 0;
            padding: 20px;
            background: linear-gradient(135deg, #667eea 0%, #764ba2 100%);
            min-height: 100vh;
            color: white;
            position: relative;
        }
        .preview-container {
            max-width: 1000px;
            margin: 0 auto;
            text-align: center;
        }
        .hero {
            margin-bottom: 40px;
        }
        .hero h1 {
            font-size: 2.5rem;
            margin-bottom: 15px;
            font-weight: 700;
            line-height: 1.2;
        }
        .hero p {
            font-size: 1.1rem;
            opacity: 0.9;
            margin-bottom: 25px;
            max-width: 600px;
            margin-left: auto;
            margin-right: auto;
        }
        .demo-content {
            background: rgba(255, 255, 255, 0.1);
            border-radius: 15px;
            padding: 30px;
            margin-bottom: 30px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.2);
        }
        .features {
            display: grid;
            grid-template-columns: repeat(auto-fit, minmax(220px, 1fr));
            gap: 20px;
            margin-top: 30px;
        }
        .feature {
            background: rgba(255, 255, 255, 0.1);
            padding: 25px;
            border-radius: 12px;
            backdrop-filter: blur(10px);
            border: 1px solid rgba(255, 255, 255, 0.1);
        }
        .feature h3 {
            margin-bottom: 10px;
            font-size: 1.2rem;
        }
        .feature p {
            font-size: 0.9rem;
            opacity: 0.8;
        }
        .cta {
            background: #ff6b6b;
            color: white;
            padding: 12px 25px;
            border: none;
            border-radius: 25px;
            font-size: 1rem;
            font-weight: 600;
            cursor: pointer;
            margin: 15px 8px;
            transition: all 0.2s;
            display: inline-block;
        }
        .cta:hover {
            transform: translateY(-2px);
            box-shadow: 0 8px 15px rgba(255, 107, 107, 0.3);
        }
        .widget-indicator {
            position: fixed;
            bottom: 80px;
            right: 20px;
            background: #4CAF50;
            color: white;
            padding: 8px 12px;
            border-radius: 20px;
            font-size: 0.8rem;
            z-index: 999;
            box-shadow: 0 4px 12px rgba(0,0,0,0.3);
            pointer-events: none;
        }
        .widget-indicator::before {
            content: "→";
            margin-right: 6px;
        }
        .debug-info {
            position: fixed;
            top: 10px;
            left: 10px;
            background: rgba(0,0,0,0.7);
            color: white;
            padding: 10px;
            border-radius: 5px;
            font-size: 0.8rem;
            z-index: 1000;
        }
        
        /* Стили для обеспечения корректной работы виджета */
        #bloop-widget-container {
            z-index: 9999 !important;
        }
    </style>
</head>
<body>
    <div class="debug-info">
        Виджет: ${widgetCode ? '✅ Загружен' : '❌ Не загружен'}<br>
        Агент: ${agent.name}<br>
        Статус: ${agent.isActive ? 'Активен' : 'Неактивен'}
    </div>

    <div class="preview-container">
        <div class="hero">
            <h1>${agent.name}</h1>
            <p>${agent.description}</p>
            <button class="cta">Попробовать бесплатно</button>
            <button class="cta">Узнать больше</button>
        </div>
        
        <div class="demo-content">
            <h2>Демо-сайт для тестирования виджета</h2>
            <p>Это пример сайта для демонстрации работы виджета. Виджет должен появиться в правом нижнем углу.</p>
            
            <div class="features">
                <div class="feature">
                    <h3>🚀 Быстрый запуск</h3>
                    <p>Начните работу за несколько минут</p>
                </div>
                <div class="feature">
                    <h3>💬 Поддержка 24/7</h3>
                    <p>Наш ИИ-ассистент всегда готов помочь</p>
                </div>
                <div class="feature">
                    <h3>📊 Аналитика</h3>
                    <p>Отслеживайте метрики и результаты</p>
                </div>
            </div>
        </div>
    </div>
    
    <div class="widget-indicator">
        Виджет чата
    </div>
    
    <script>
        console.log('Предпросмотр загружен');
        console.log('Код виджета:', ${widgetCode ? 'true' : 'false'});
        
        // Функция для отладки
        function checkWidget() {
            const widget = document.querySelector('#bloop-widget-container');
            if (widget) {
                console.log('Виджет найден:', widget);
            } else {
                console.log('Виджет не найден');
            }
        }
        
        // Проверяем виджет через несколько секунд
        setTimeout(checkWidget, 2000);
        setTimeout(checkWidget, 5000);
    </script>
    
    ${widgetCode || '<!-- Код виджета отсутствует -->'}
    
    <script>
        // Дополнительная проверка после загрузки виджета
        setTimeout(() => {
            checkWidget();
            const scripts = document.querySelectorAll('script');
            console.log('Всего скриптов на странице:', scripts.length);
        }, 3000);
    </script>
</body>
</html>`;
  };

  return (
    <div className="space-y-6">
      {/* Секция действий ИИ */}
      <div className="bg-gradient-to-r from-blue-50 to-indigo-50 border border-blue-200 rounded-lg p-6">
        <h3 className="text-lg font-semibold text-gray-900 mb-4 flex items-center">
          <span className="text-2xl mr-2">🤖</span>
          Тестирование действий ИИ-ассистента
        </h3>
        
        <div className="text-sm text-gray-600 mb-4">
          Ваш ИИ-ассистент может выполнять различные действия за пользователя. Попробуйте отправить эти команды в чат:
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-medium text-gray-900 mb-2 flex items-center">
                🎫 <span className="ml-2">Создание заявки</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Создать заявку test@example.com"
                </div>
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Нужна помощь с настройкой"
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-medium text-gray-900 mb-2 flex items-center">
                🔍 <span className="ml-2">Поиск информации</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Найди информацию о ценах"
                </div>
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Расскажи о возможностях"
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-medium text-gray-900 mb-2 flex items-center">
                📧 <span className="ml-2">Подписка на обновления</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Подписаться на уведомления test@example.com"
                </div>
              </div>
            </div>
          </div>

          <div className="space-y-3">
            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-medium text-gray-900 mb-2 flex items-center">
                📅 <span className="ml-2">Запись на демо</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Записаться на демо test@example.com"
                </div>
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Хочу презентацию продукта"
                </div>
              </div>
            </div>

            <div className="bg-white rounded-lg p-4 border border-gray-200">
              <div className="font-medium text-gray-900 mb-2 flex items-center">
                📞 <span className="ml-2">Получение контактов</span>
              </div>
              <div className="text-sm text-gray-600 space-y-1">
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Показать контакты"
                </div>
                <div className="bg-gray-50 rounded p-2 font-mono text-xs">
                  "Как связаться с поддержкой?"
                </div>
              </div>
            </div>

            <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-3">
              <div className="text-sm text-yellow-800">
                <strong>💡 Совет:</strong> ИИ автоматически определит намерение и выполнит соответствующее действие. Все действия логируются в консоль backend.
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Существующий контент */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-start mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Код виджета</h3>
            <p className="text-sm text-gray-600">
              Скопируйте этот код и вставьте на ваш сайт перед закрывающим тегом &lt;/body&gt;
            </p>
          </div>
          <div className="flex space-x-2">
            {agent.isActive ? (
              <div className="flex items-center px-3 py-1 bg-green-100 text-green-800 rounded-full text-sm">
                <span className="w-2 h-2 bg-green-400 rounded-full mr-2"></span>
                Активен
              </div>
            ) : (
              <div className="flex items-center px-3 py-1 bg-yellow-100 text-yellow-800 rounded-full text-sm">
                <span className="w-2 h-2 bg-yellow-400 rounded-full mr-2"></span>
                Неактивен
              </div>
            )}
          </div>
        </div>

        {agent.isActive ? (
          <div className="space-y-4">
            <div className="flex space-x-3">
              <button
                onClick={getWidgetCode}
                disabled={loading}
                className="px-4 py-2 bg-blue-500 text-white rounded-lg hover:bg-blue-600 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? 'Загрузка...' : 'Получить код'}
              </button>
              
              {widgetCode && (
                <button
                  onClick={copyToClipboard}
                  className="px-4 py-2 bg-green-500 text-white rounded-lg hover:bg-green-600"
                >
                  📋 Скопировать
                </button>
              )}
            </div>

            {widgetCode && (
              <div className="bg-gray-50 rounded-lg p-4 overflow-auto max-h-64">
                <pre className="text-sm text-gray-800 whitespace-pre-wrap">
                  {widgetCode}
                </pre>
              </div>
            )}
          </div>
        ) : (
          <div className="text-center py-8">
            <div className="text-4xl mb-4">⚠️</div>
            <p className="text-gray-600 mb-4">
              Агент неактивен. Активируйте агента в настройках для получения кода виджета.
            </p>
          </div>
        )}
      </div>

      {/* Предпросмотр */}
      <div className="bg-white rounded-lg shadow-sm border border-gray-200 p-6">
        <div className="flex justify-between items-center mb-6">
          <div>
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Предпросмотр виджета</h3>
            <p className="text-sm text-gray-600">
              Тестируйте виджет в реальном окружении. Попробуйте команды из раздела выше.
            </p>
          </div>
          <button
            onClick={reloadPreview}
            className="px-4 py-2 bg-gray-500 text-white rounded-lg hover:bg-gray-600 text-sm"
          >
            🔄 Перезагрузить
          </button>
        </div>

        {agent.isActive && widgetCode ? (
          <div className="border border-gray-200 rounded-lg overflow-hidden">
            <iframe
              key={iframeKey}
              srcDoc={generatePreviewHTML()}
              className="w-full h-[600px]"
              sandbox="allow-scripts allow-same-origin allow-popups"
              title="Предпросмотр виджета"
            />
          </div>
        ) : (
          <div className="border border-gray-200 rounded-lg p-8 text-center">
            <div className="text-4xl mb-4">💬</div>
            <p className="text-gray-600 mb-4">
              {!agent.isActive 
                ? 'Активируйте агента для просмотра виджета'
                : 'Получите код виджета для предпросмотра'
              }
            </p>
          </div>
        )}
      </div>
    </div>
  );
};

// Messages Tab Component
const MessagesTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">История сообщений</h2>
      
      <div className="text-center py-12">
        <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Пока нет сообщений</h3>
        <p className="text-gray-600">
          Когда пользователи начнут общаться с вашим ассистентом, здесь появится история диалогов
        </p>
      </div>
    </div>
  );
};

// Analytics Tab Component
const AnalyticsTab: React.FC<{ agent: Agent }> = ({ agent }) => {
  return (
    <div className="bg-white rounded-lg shadow-sm border p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-6">Аналитика</h2>
      
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-8">
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900">Диалоги</h3>
          <p className="text-3xl font-bold text-primary-600 mt-2">{agent.totalChats || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Всего диалогов</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900">Сообщения</h3>
          <p className="text-3xl font-bold text-green-600 mt-2">{agent.totalMessages || 0}</p>
          <p className="text-sm text-gray-600 mt-1">Всего сообщений</p>
        </div>
        
        <div className="bg-gray-50 p-6 rounded-lg">
          <h3 className="text-lg font-semibold text-gray-900">Среднее время</h3>
          <p className="text-3xl font-bold text-purple-600 mt-2">—</p>
          <p className="text-sm text-gray-600 mt-1">Время ответа</p>
        </div>
      </div>

      <div className="text-center py-12">
        <BarChart3 className="h-16 w-16 text-gray-400 mx-auto mb-4" />
        <h3 className="text-lg font-medium text-gray-900 mb-2">Детальная аналитика скоро</h3>
        <p className="text-gray-600">
          Здесь будут графики использования, популярные вопросы и другая статистика
        </p>
      </div>
    </div>
  );
};

export default AgentDetail; 