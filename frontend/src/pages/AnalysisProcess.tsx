import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Bot, CheckCircle, Globe, Brain, Code, BarChart3, Shield, Zap } from 'lucide-react';
import { analysisAPI } from '../services/api';

interface AnalysisData {
  name: string;
  description: string;
  websiteUrl: string;
  knowledgeBase: string;
  settings: any;
}

interface AnalysisStep {
  id: string;
  title: string;
  description: string;
  status: 'pending' | 'processing' | 'completed';
  duration: number; // в секундах
}

const AnalysisProcess: React.FC = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [analysisData] = useState<AnalysisData>(location.state?.formData);
  const [currentStep, setCurrentStep] = useState(0);
  const [timeRemaining, setTimeRemaining] = useState(300); // 5 минут = 300 секунд
  const [totalTime] = useState(300);
  const [analysisResults, setAnalysisResults] = useState<any>(null);

  const analysisSteps: AnalysisStep[] = [
    {
      id: 'url-analysis',
      title: 'Анализ веб-сайта',
      description: 'Изучаем структуру вашего сайта, навигацию и ключевые страницы',
      status: 'pending',
      duration: 60
    },
    {
      id: 'content-extraction',
      title: 'Извлечение контента',
      description: 'Анализируем содержимое, FAQ, документацию и пользовательские пути',
      status: 'pending',
      duration: 90
    },
    {
      id: 'ai-training',
      title: 'Обучение ИИ-модели',
      description: 'Настраиваем ИИ на основе ваших данных и базы знаний',
      status: 'pending',
      duration: 80
    },
    {
      id: 'widget-generation',
      title: 'Генерация виджета',
      description: 'Создаем персонализированный виджет и настраиваем интеграцию',
      status: 'pending',
      duration: 70
    }
  ];

  const [steps, setSteps] = useState(analysisSteps);

  const benefits = [
    {
      icon: <Brain className="h-6 w-6" />,
      title: "Умное понимание контекста",
      description: "ИИ изучает специфику вашего продукта"
    },
    {
      icon: <Zap className="h-6 w-6" />,
      title: "Мгновенные ответы",
      description: "Средний ответ за 2-3 секунды"
    },
    {
      icon: <Shield className="h-6 w-6" />,
      title: "Точность информации",
      description: "Отвечает только на основе ваших данных"
    },
    {
      icon: <BarChart3 className="h-6 w-6" />,
      title: "Детальная аналитика",
      description: "Полная статистика взаимодействий"
    },
    {
      icon: <Code className="h-6 w-6" />,
      title: "Простая интеграция",
      description: "Один скрипт - готовый ассистент"
    },
    {
      icon: <Globe className="h-6 w-6" />,
      title: "Кроссплатформенность",
      description: "Работает на любых сайтах"
    }
  ];

  useEffect(() => {
    if (!analysisData) {
      navigate('/onboarding');
      return;
    }

    // Запуск процесса анализа
    startAnalysis();
  }, []);

  useEffect(() => {
    if (timeRemaining <= 0) {
      completeAnalysis();
      return;
    }

    const timer = setInterval(() => {
      setTimeRemaining(prev => prev - 1);
      updateStepsProgress();
    }, 1000);

    return () => clearInterval(timer);
  }, [timeRemaining]);

  const startAnalysis = async () => {
    try {
      // Здесь будет реальный API вызов для начала анализа
      console.log('Начинаем анализ:', analysisData);
    } catch (error) {
      console.error('Ошибка при запуске анализа:', error);
    }
  };

  const updateStepsProgress = () => {
    const elapsedTime = totalTime - timeRemaining;
    let currentStepIndex = 0;
    let accumulatedTime = 0;

    setSteps(prevSteps => {
      return prevSteps.map((step, index) => {
        accumulatedTime += step.duration;
        
        if (elapsedTime >= accumulatedTime) {
          currentStepIndex = index + 1;
          return { ...step, status: 'completed' as const };
        } else if (elapsedTime >= accumulatedTime - step.duration) {
          setCurrentStep(index);
          return { ...step, status: 'processing' as const };
        } else {
          return { ...step, status: 'pending' as const };
        }
      });
    });
  };

  const completeAnalysis = async () => {
    try {
      // Реальный API вызов для создания агента
      const response = await analysisAPI.createAgent(analysisData);
      
      if (response.data.success && response.data.data) {
        setAnalysisResults(response.data.data);
        // Переходим к результатам через 2 секунды
        setTimeout(() => {
          navigate('/dashboard', {
            state: {
              message: `ИИ-ассистент "${analysisData.name}" успешно создан и настроен!`,
              agentId: response.data.data.agent.id,
              analysisComplete: true
            }
          });
        }, 2000);
      }
    } catch (error) {
      console.error('Ошибка при завершении анализа:', error);
      navigate('/onboarding');
    }
  };

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const progressPercentage = ((totalTime - timeRemaining) / totalTime) * 100;

  if (!analysisData) {
    return null;
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <Bot className="h-16 w-16 text-primary-600 mx-auto mb-4 animate-pulse" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Создаем ваш ИИ-ассистент
          </h1>
          <p className="text-gray-600 mb-4">
            Анализируем "{analysisData.name}" и настраиваем персональный ассистент
          </p>
          
          {/* Timer */}
          <div className="bg-white rounded-lg shadow-sm border p-4 mb-6 max-w-md mx-auto">
            <div className="text-2xl font-bold text-primary-600 mb-2">
              {formatTime(timeRemaining)}
            </div>
            <div className="w-full bg-gray-200 rounded-full h-2">
              <div 
                className="bg-primary-600 h-2 rounded-full transition-all duration-1000"
                style={{ width: `${progressPercentage}%` }}
              ></div>
            </div>
            <p className="text-sm text-gray-500 mt-2">Осталось до завершения</p>
          </div>
        </div>

        {/* Analysis Steps */}
        <div className="bg-white rounded-xl shadow-sm border p-6 mb-8">
          <h2 className="text-xl font-semibold text-gray-900 mb-6">Процесс анализа</h2>
          <div className="space-y-4">
            {steps.map((step, index) => (
              <div key={step.id} className="flex items-center gap-4">
                <div className={`
                  w-8 h-8 rounded-full flex items-center justify-center transition-colors
                  ${step.status === 'completed' 
                    ? 'bg-green-500 text-white' 
                    : step.status === 'processing'
                    ? 'bg-primary-600 text-white animate-pulse'
                    : 'bg-gray-200 text-gray-400'
                  }
                `}>
                  {step.status === 'completed' ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{index + 1}</span>
                  )}
                </div>
                
                <div className="flex-1">
                  <h3 className={`font-medium ${
                    step.status === 'processing' ? 'text-primary-600' : 'text-gray-900'
                  }`}>
                    {step.title}
                  </h3>
                  <p className="text-sm text-gray-500">{step.description}</p>
                </div>

                <div className={`
                  px-2 py-1 rounded-full text-xs font-medium
                  ${step.status === 'completed' 
                    ? 'bg-green-100 text-green-800' 
                    : step.status === 'processing'
                    ? 'bg-primary-100 text-primary-800'
                    : 'bg-gray-100 text-gray-500'
                  }
                `}>
                  {step.status === 'completed' ? 'Готово' 
                   : step.status === 'processing' ? 'Обработка...' 
                   : 'Ожидание'}
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Benefits Carousel */}
        <div className="bg-white rounded-xl shadow-sm border p-6">
          <h2 className="text-xl font-semibold text-gray-900 mb-6 text-center">
            Пока вы ждете, изучите преимущества Bloop.ai
          </h2>
          
          <div className="overflow-hidden">
            <div className="benefits-carousel">
              {/* Дублируем массив для бесконечной прокрутки */}
              {[...benefits, ...benefits].map((benefit, index) => (
                <div key={index} className="benefit-card">
                  <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center text-primary-600 mb-4">
                    {benefit.icon}
                  </div>
                  <h3 className="font-semibold text-gray-900 mb-2">{benefit.title}</h3>
                  <p className="text-sm text-gray-600">{benefit.description}</p>
                </div>
              ))}
            </div>
          </div>
        </div>

        {/* Current Analysis Info */}
        <div className="mt-8 text-center">
          <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
            <p className="text-blue-800">
              <strong>Сейчас анализируем:</strong> {steps[currentStep]?.title || 'Завершение...'}
            </p>
            <p className="text-sm text-blue-600 mt-1">
              {steps[currentStep]?.description || 'Финальная настройка вашего ассистента'}
            </p>
          </div>
        </div>
      </div>
    </div>
  );
};

export default AnalysisProcess; 