import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation, Link } from 'react-router-dom';
import { useAuth } from '../contexts/AuthContext';
import { Bot, Plus, BarChart3, Settings, ExternalLink, Copy, Trash2 } from 'lucide-react';
import { agentsAPI } from '../services/api';
import { Agent } from '../types';

const Dashboard: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();
  const [agents, setAgents] = useState<Agent[]>([]);
  const [loading, setLoading] = useState(true);
  const [notification, setNotification] = useState<string | null>(null);
  const [notificationType, setNotificationType] = useState<'success' | 'error'>('success');

  useEffect(() => {
    // Показываем уведомление если пришли из онбординга
    if (location.state?.message) {
      setNotification(location.state.message);
      // Очищаем состояние чтобы уведомление не показывалось при следующих посещениях
      window.history.replaceState({}, document.title);
      
      // Скрываем уведомление через 5 секунд
      setTimeout(() => setNotification(null), 5000);
    }

    loadAgents();
  }, [location.state]);

  const loadAgents = async () => {
    try {
      setLoading(true);
      console.log('Загружаем агентов...');
      const response = await agentsAPI.getAll();
      console.log('Ответ от API:', response);
      
      if (response.success && response.data) {
        setAgents(response.data.agents);
        console.log('Агенты загружены:', response.data.agents);
      } else {
        console.error('Ошибка API:', response.error);
        const errorMessage = response.error || 'Ошибка загрузки агентов';
        setNotification(errorMessage);
        setNotificationType('error');
        setTimeout(() => setNotification(null), 5000);
      }
    } catch (error: any) {
      console.error('Ошибка при загрузке агентов:', error);
      
      // Проверяем тип ошибки
      if (error.response?.status === 401) {
        setNotification('Сессия истекла. Войдите снова.');
        setNotificationType('error');
        setTimeout(() => setNotification(null), 5000);
        // AuthContext автоматически обработает 401 ошибку
      } else {
        const errorMessage = error.response?.data?.error || 'Ошибка загрузки данных';
        setNotification(errorMessage);
        setNotificationType('error');
        setTimeout(() => setNotification(null), 5000);
      }
    } finally {
      setLoading(false);
    }
  };

  const handleCreateAgent = () => {
    navigate('/onboarding');
  };

  const handleAgentClick = (agentId: string) => {
    navigate(`/agent/${agentId}`);
  };

  const handleDeleteAgent = async (agentId: string, agentName: string) => {
    if (window.confirm(`Вы уверены, что хотите удалить ИИ-ассистента "${agentName}"?`)) {
      try {
        const response = await agentsAPI.delete(agentId);
        if (response.success) {
          setAgents(agents.filter(agent => agent.id !== agentId));
          setNotification(`ИИ-ассистент "${agentName}" удален`);
          setNotificationType('success');
          setTimeout(() => setNotification(null), 3000);
        }
      } catch (error) {
        console.error('Error deleting agent:', error);
        alert('Ошибка при удалении агента');
      }
    }
  };

  const handleGetWidgetCode = async (agentId: string, agentName: string) => {
    try {
      const response = await agentsAPI.getWidgetCode(agentId);
      if (response.success && response.data) {
        // Копируем код в буфер обмена
        navigator.clipboard.writeText(response.data.script);
        setNotification(`Код виджета для "${agentName}" скопирован в буфер обмена`);
        setNotificationType('success');
        setTimeout(() => setNotification(null), 3000);
      }
    } catch (error) {
      console.error('Error getting widget code:', error);
      alert('Ошибка при получении кода виджета');
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('ru-RU', {
      day: 'numeric',
      month: 'short',
      year: 'numeric'
    });
  };

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
            <div className="flex items-center space-x-2">
              <Bot className="h-8 w-8 text-primary-600" />
              <span className="text-2xl font-bold text-gray-900">Bloop.ai</span>
            </div>
            
            <div className="flex items-center space-x-4">
              <Link 
                to="/visual-test" 
                className="flex items-center gap-2 px-3 py-2 text-sm bg-blue-100 text-blue-700 rounded-md hover:bg-blue-200 transition-colors"
              >
                🔍 Тест Vision AI
              </Link>
              <span className="text-sm text-gray-600">
                Привет, {user?.name || user?.email}!
              </span>
              <button
                onClick={logout}
                className="text-sm text-gray-500 hover:text-gray-700"
              >
                Выйти
              </button>
            </div>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="mb-8 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
            <p className="text-gray-600">Управляйте ИИ-ассистентами для вашего IT-стартапа</p>
          </div>
          
          <button 
            onClick={handleCreateAgent}
            className="btn-primary flex items-center gap-2"
          >
            <Plus className="h-5 w-5" />
            Создать ИИ-ассистента
          </button>
        </div>

        {loading ? (
          /* Loading State */
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4 animate-pulse" />
            <p className="text-gray-600">Загружаем ваших ассистентов...</p>
          </div>
        ) : agents.length === 0 ? (
          /* Empty State */
          <div className="text-center py-12">
            <Bot className="h-16 w-16 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-medium text-gray-900 mb-2">
              У вас еще нет ИИ-ассистентов
            </h3>
            <p className="text-gray-600 mb-6">
              Создайте своего первого ИИ-агента для упрощения онбординга клиентов
            </p>
            <button 
              onClick={handleCreateAgent}
              className="btn-primary flex items-center gap-2 mx-auto"
            >
              <Plus className="h-5 w-5" />
              Создать ИИ-ассистента
            </button>
          </div>
        ) : (
          /* Agents Grid */
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {agents.map((agent) => (
              <div 
                key={agent.id} 
                className="card hover:shadow-md transition-shadow duration-200 cursor-pointer"
                onClick={() => handleAgentClick(agent.id)}
              >
                <div className="flex items-start justify-between mb-4">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-primary-100 rounded-lg flex items-center justify-center">
                      <Bot className="h-5 w-5 text-primary-600" />
                    </div>
                    <div>
                      <h3 className="font-semibold text-gray-900">{agent.name}</h3>
                      <p className="text-sm text-gray-500">
                        Создан {formatDate(agent.createdAt)}
                      </p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-2">
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleGetWidgetCode(agent.id, agent.name);
                      }}
                      className="p-2 text-gray-400 hover:text-primary-600 transition-colors"
                      title="Получить код виджета"
                    >
                      <Copy className="h-4 w-4" />
                    </button>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        handleDeleteAgent(agent.id, agent.name);
                      }}
                      className="p-2 text-gray-400 hover:text-red-600 transition-colors"
                      title="Удалить агента"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </div>

                <p className="text-gray-600 text-sm mb-4 line-clamp-2">
                  {agent.description}
                </p>

                <div className="flex items-center justify-between text-sm">
                  <div className="flex items-center gap-2 text-gray-500">
                    <div className="w-2 h-2 bg-green-500 rounded-full"></div>
                    Активен
                  </div>
                  
                  {agent.websiteUrl && (
                    <a
                      href={agent.websiteUrl}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-1 text-primary-600 hover:text-primary-700"
                    >
                      <ExternalLink className="h-3 w-3" />
                      Сайт
                    </a>
                  )}
                </div>

                <div className="mt-4 pt-4 border-t border-gray-100">
                  <button
                    onClick={(e) => {
                      e.stopPropagation();
                      handleGetWidgetCode(agent.id, agent.name);
                    }}
                    className="btn-secondary w-full text-sm"
                  >
                    Получить код виджета
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Stats */}
        {agents.length > 0 && (
          <div className="mt-12 grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Bot className="h-8 w-8 text-primary-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">{agents.length}</p>
                  <p className="text-sm text-gray-600">Активных ассистентов</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-2">
                <BarChart3 className="h-8 w-8 text-green-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-sm text-gray-600">Диалогов сегодня</p>
                </div>
              </div>
            </div>
            
            <div className="bg-white rounded-lg border p-6">
              <div className="flex items-center gap-3 mb-2">
                <Settings className="h-8 w-8 text-purple-600" />
                <div>
                  <p className="text-2xl font-bold text-gray-900">—</p>
                  <p className="text-sm text-gray-600">Время ответа</p>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  );
};

export default Dashboard; 