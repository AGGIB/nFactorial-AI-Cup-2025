import React, { useState } from 'react';
import { analysisAPI } from '../services/api';

const VisualTestPage: React.FC = () => {
  const [url, setUrl] = useState('http://localhost:3000/');
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<any>(null);
  const [screenshot, setScreenshot] = useState<string>('');

  // Состояние для автоматизации
  const [automationAction, setAutomationAction] = useState('click');
  const [buttonText, setButtonText] = useState('Войти');
  const [automationResult, setAutomationResult] = useState<any>(null);
  const [automationLoading, setAutomationLoading] = useState(false);

  const handleAnalyze = async () => {
    setLoading(true);
    try {
      const analysisResponse = await analysisAPI.analyzePage({ url, agentId: 'test' });
      setResult(analysisResponse.data);
      
      // Также получаем скриншот
      const screenshotResponse = await analysisAPI.captureScreenshot({ url });
      if (screenshotResponse.data.screenshot) {
        setScreenshot(`data:image/jpeg;base64,${screenshotResponse.data.screenshot}`);
      }
    } catch (error) {
      console.error('Error analyzing page:', error);
      setResult({ error: 'Failed to analyze page' });
    } finally {
      setLoading(false);
    }
  };

  const handleAutomation = async () => {
    setAutomationLoading(true);
    try {
      const response = await fetch('/api/analysis/automate', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          action: automationAction,
          url: url,
          params: {
            buttonText: buttonText,
            waitForNavigation: true
          }
        }),
      });

      const data = await response.json();
      setAutomationResult(data);
    } catch (error) {
      console.error('Error with automation:', error);
      setAutomationResult({ error: 'Failed to execute automation' });
    } finally {
      setAutomationLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-8">
      <div className="max-w-6xl mx-auto px-4">
        <div className="bg-white rounded-lg shadow-sm p-6 mb-6">
          <h1 className="text-2xl font-bold text-gray-900 mb-6">
            🤖 Тест Vision AI + Browser Automation
          </h1>
          
          <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
            {/* Панель анализа */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">📊 Анализ страницы</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  URL для анализа:
                </label>
                <input
                  type="url"
                  value={url}
                  onChange={(e) => setUrl(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-blue-500"
                  placeholder="https://example.com"
                />
              </div>

              <button
                onClick={handleAnalyze}
                disabled={loading}
                className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {loading ? '🔄 Анализирую...' : '🔍 Анализировать страницу'}
              </button>
            </div>

            {/* Панель автоматизации */}
            <div className="space-y-4">
              <h2 className="text-lg font-semibold text-gray-800">🤖 Browser Automation</h2>
              
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Действие:
                </label>
                <select
                  value={automationAction}
                  onChange={(e) => setAutomationAction(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                >
                  <option value="click">Нажать кнопку</option>
                  <option value="find_button">Найти кнопку</option>
                </select>
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Текст кнопки:
                </label>
                <input
                  type="text"
                  value={buttonText}
                  onChange={(e) => setButtonText(e.target.value)}
                  className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-green-500"
                  placeholder="Войти"
                />
              </div>

              <button
                onClick={handleAutomation}
                disabled={automationLoading}
                className="w-full bg-green-600 text-white py-2 px-4 rounded-md hover:bg-green-700 disabled:opacity-50 disabled:cursor-not-allowed"
              >
                {automationLoading ? '🔄 Выполняю...' : '🚀 Выполнить действие'}
              </button>

              {/* Быстрые команды */}
              <div className="border-t pt-4">
                <h3 className="text-sm font-medium text-gray-700 mb-2">🎯 Быстрые команды:</h3>
                <div className="grid grid-cols-2 gap-2">
                  <button
                    onClick={() => {
                      setButtonText('Войти');
                      setAutomationAction('click');
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    Войти
                  </button>
                  <button
                    onClick={() => {
                      setButtonText('Регистрация');
                      setAutomationAction('click');
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    Регистрация
                  </button>
                  <button
                    onClick={() => {
                      setButtonText('Начать работу');
                      setAutomationAction('click');
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    Начать работу
                  </button>
                  <button
                    onClick={() => {
                      setButtonText('Dashboard');
                      setAutomationAction('click');
                    }}
                    className="text-xs bg-gray-100 hover:bg-gray-200 px-2 py-1 rounded"
                  >
                    Dashboard
                  </button>
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Результаты */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Результат анализа */}
          {result && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">📊 Результат анализа</h2>
              
              {result.error ? (
                <div className="text-red-600">
                  <p className="font-medium">Ошибка:</p>
                  <p>{result.error}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div>
                    <p className="font-medium text-gray-700">Заголовок:</p>
                    <p className="text-gray-600">{result.analysis?.title || 'Не определен'}</p>
                  </div>
                  
                  <div>
                    <p className="font-medium text-gray-700">URL:</p>
                    <p className="text-gray-600 text-sm break-all">{result.analysis?.url}</p>
                  </div>
                  
                  {result.analysis?.buttons && result.analysis.buttons.length > 0 && (
                    <div>
                      <p className="font-medium text-gray-700">Кнопки:</p>
                      <div className="flex flex-wrap gap-1 mt-1">
                        {result.analysis.buttons.slice(0, 5).map((button: string, index: number) => (
                          <span key={index} className="text-xs bg-blue-100 text-blue-800 px-2 py-1 rounded">
                            {button}
                          </span>
                        ))}
                      </div>
                    </div>
                  )}
                  
                  {result.visualDescription && (
                    <div>
                      <p className="font-medium text-gray-700">AI описание:</p>
                      <p className="text-gray-600 text-sm">{result.visualDescription.slice(0, 200)}...</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}

          {/* Результат автоматизации */}
          {automationResult && (
            <div className="bg-white rounded-lg shadow-sm p-6">
              <h2 className="text-lg font-semibold text-gray-800 mb-4">🤖 Результат автоматизации</h2>
              
              {automationResult.error ? (
                <div className="text-red-600">
                  <p className="font-medium">Ошибка:</p>
                  <p>{automationResult.error}</p>
                </div>
              ) : (
                <div className="space-y-3">
                  <div className={`p-3 rounded-md ${automationResult.success ? 'bg-green-50 border-l-4 border-green-400' : 'bg-red-50 border-l-4 border-red-400'}`}>
                    <p className={`font-medium ${automationResult.success ? 'text-green-800' : 'text-red-800'}`}>
                      {automationResult.success ? '✅ Успешно' : '❌ Ошибка'}
                    </p>
                    <p className={`text-sm ${automationResult.success ? 'text-green-700' : 'text-red-700'}`}>
                      {automationResult.message}
                    </p>
                  </div>
                  
                  {automationResult.data?.newUrl && (
                    <div>
                      <p className="font-medium text-gray-700">Новый URL:</p>
                      <p className="text-gray-600 text-sm break-all">{automationResult.data.newUrl}</p>
                    </div>
                  )}
                  
                  {automationResult.data?.selector && (
                    <div>
                      <p className="font-medium text-gray-700">Найденный селектор:</p>
                      <code className="text-xs bg-gray-100 px-2 py-1 rounded">{automationResult.data.selector}</code>
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Скриншот */}
        {screenshot && (
          <div className="bg-white rounded-lg shadow-sm p-6 mt-6">
            <h2 className="text-lg font-semibold text-gray-800 mb-4">📸 Скриншот страницы</h2>
            <img 
              src={screenshot} 
              alt="Screenshot" 
              className="max-w-full h-auto border border-gray-200 rounded-md shadow-sm"
            />
          </div>
        )}

        {/* Инструкции */}
        <div className="bg-blue-50 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-blue-900 mb-4">📋 Инструкции по тестированию</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-sm text-blue-800">
            <div>
              <h3 className="font-medium mb-2">🔍 Анализ страницы:</h3>
              <ul className="space-y-1">
                <li>• Введите URL любого сайта</li>
                <li>• AI проанализирует контент и интерфейс</li>
                <li>• Получите скриншот и описание</li>
              </ul>
            </div>
            <div>
              <h3 className="font-medium mb-2">🤖 Автоматизация:</h3>
              <ul className="space-y-1">
                <li>• Выберите действие и укажите кнопку</li>
                <li>• AI найдет и нажмет кнопку автоматически</li>
                <li>• Протестируйте с виджетом чата!</li>
              </ul>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default VisualTestPage; 