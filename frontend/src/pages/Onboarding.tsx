import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { Bot, ArrowLeft, ArrowRight, Check, Upload, Globe, FileText, Settings } from 'lucide-react';
import { onboardingAPI } from '../services/api';

interface OnboardingData {
  companyName: string;
  productName: string;
  productDescription: string;
  targetAudience: string;
  websiteUrl: string;
  documentationUrl: string;
  knowledgeBase: string;
  supportEmail: string;
}

const Onboarding: React.FC = () => {
  const navigate = useNavigate();
  const [currentStep, setCurrentStep] = useState(1);
  const [loading, setLoading] = useState(false);
  const [formData, setFormData] = useState<OnboardingData>({
    companyName: '',
    productName: '',
    productDescription: '',
    targetAudience: '',
    websiteUrl: '',
    documentationUrl: '',
    knowledgeBase: '',
    supportEmail: ''
  });

  const steps = [
    {
      id: 1,
      title: 'Расскажите о продукте',
      description: 'Опишите ваш IT-продукт и целевую аудиторию',
      icon: <Settings className="h-6 w-6" />
    },
    {
      id: 2,
      title: 'Подключите ресурсы',
      description: 'Добавьте ссылки на сайт и документацию',
      icon: <Globe className="h-6 w-6" />
    },
    {
      id: 3,
      title: 'Обучите ассистента',
      description: 'Загрузите базу знаний и FAQ',
      icon: <FileText className="h-6 w-6" />
    },
    {
      id: 4,
      title: 'Получите код виджета',
      description: 'Встройте ИИ-ассистента на ваш сайт',
      icon: <Bot className="h-6 w-6" />
    }
  ];

  const handleInputChange = (field: keyof OnboardingData, value: string) => {
    setFormData(prev => ({
      ...prev,
      [field]: value
    }));
  };

  const handleNext = async () => {
    if (currentStep < 4) {
      setCurrentStep(currentStep + 1);
    } else {
      // Переходим к анализу вместо создания агента
      handleStartAnalysis();
    }
  };

  const handleBack = () => {
    if (currentStep > 1) {
      setCurrentStep(currentStep - 1);
    } else {
      navigate('/dashboard');
    }
  };

  const handleStartAnalysis = () => {
    // Переходим на страницу анализа с данными
    navigate('/analysis', {
      state: {
        formData: {
          name: formData.productName,
          description: formData.productDescription,
          websiteUrl: formData.websiteUrl,
          knowledgeBase: formData.knowledgeBase,
          settings: {
            companyName: formData.companyName,
            targetAudience: formData.targetAudience,
            documentationUrl: formData.documentationUrl,
            supportEmail: formData.supportEmail
          }
        }
      }
    });
  };

  const handleCreateAgent = async () => {
    setLoading(true);
    try {
      const response = await onboardingAPI.createAgent({
        name: formData.productName,
        description: formData.productDescription,
        websiteUrl: formData.websiteUrl,
        knowledgeBase: formData.knowledgeBase,
        settings: {
          companyName: formData.companyName,
          targetAudience: formData.targetAudience,
          documentationUrl: formData.documentationUrl,
          supportEmail: formData.supportEmail
        }
      });

      if (response.success && response.data) {
        // Перенаправляем в dashboard с уведомлением об успехе
        navigate('/dashboard', { 
          state: { 
            message: `ИИ-ассистент "${formData.productName}" успешно создан!`,
            agentId: response.data.agent.id 
          } 
        });
      } else {
        alert('Ошибка при создании агента: ' + response.error);
      }
    } catch (error) {
      console.error('Error creating agent:', error);
      alert('Произошла ошибка при создании агента. Попробуйте еще раз.');
    } finally {
      setLoading(false);
    }
  };

  const isStepValid = (step: number) => {
    switch (step) {
      case 1:
        return formData.companyName && formData.productName && formData.productDescription;
      case 2:
        return formData.websiteUrl;
      case 3:
        return formData.knowledgeBase;
      default:
        return true;
    }
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название компании *
              </label>
              <input
                type="text"
                value={formData.companyName}
                onChange={(e) => handleInputChange('companyName', e.target.value)}
                className="input-field"
                placeholder="Например: TechFlow Inc."
              />
            </div>
            
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Название продукта *
              </label>
              <input
                type="text"
                value={formData.productName}
                onChange={(e) => handleInputChange('productName', e.target.value)}
                className="input-field"
                placeholder="Например: CloudAPI Manager"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Описание продукта *
              </label>
              <textarea
                value={formData.productDescription}
                onChange={(e) => handleInputChange('productDescription', e.target.value)}
                className="input-field h-24 resize-none"
                placeholder="Кратко опишите что делает ваш продукт, основные функции и преимущества..."
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Целевая аудитория
              </label>
              <input
                type="text"
                value={formData.targetAudience}
                onChange={(e) => handleInputChange('targetAudience', e.target.value)}
                className="input-field"
                placeholder="Например: Разработчики, DevOps инженеры, IT команды"
              />
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                URL вашего сайта *
              </label>
              <input
                type="url"
                value={formData.websiteUrl}
                onChange={(e) => handleInputChange('websiteUrl', e.target.value)}
                className="input-field"
                placeholder="https://yourcompany.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                ИИ проанализирует структуру вашего сайта
              </p>
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Ссылка на документацию
              </label>
              <input
                type="url"
                value={formData.documentationUrl}
                onChange={(e) => handleInputChange('documentationUrl', e.target.value)}
                className="input-field"
                placeholder="https://docs.yourcompany.com"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                Email для поддержки
              </label>
              <input
                type="email"
                value={formData.supportEmail}
                onChange={(e) => handleInputChange('supportEmail', e.target.value)}
                className="input-field"
                placeholder="support@yourcompany.com"
              />
              <p className="text-sm text-gray-500 mt-1">
                Будет использоваться в случае, если ИИ не может ответить
              </p>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-2">
                База знаний *
              </label>
              <textarea
                value={formData.knowledgeBase}
                onChange={(e) => handleInputChange('knowledgeBase', e.target.value)}
                className="input-field h-32 resize-none"
                placeholder="Вставьте сюда FAQ, инструкции, описания API, частые вопросы клиентов..."
              />
            </div>

            <div className="border-2 border-dashed border-gray-300 rounded-lg p-6 text-center">
              <Upload className="h-8 w-8 text-gray-400 mx-auto mb-2" />
              <p className="text-gray-600 mb-2">Загрузите файлы документации</p>
              <p className="text-sm text-gray-500">PDF, DOC, TXT (скоро)</p>
              <button className="btn-secondary mt-2" disabled>
                Выбрать файлы
              </button>
            </div>

            <div className="bg-blue-50 border border-blue-200 rounded-lg p-4">
              <h4 className="font-medium text-blue-900 mb-2">💡 Советы для лучшего обучения:</h4>
              <ul className="text-sm text-blue-800 space-y-1">
                <li>• Включите частые вопросы клиентов</li>
                <li>• Добавьте пошаговые инструкции</li>
                <li>• Опишите возможные проблемы и решения</li>
                <li>• Укажите системные требования</li>
              </ul>
            </div>
          </div>
        );

      case 4:
        return (
          <div className="text-center space-y-6">
            <div className="bg-green-50 border border-green-200 rounded-lg p-6">
              <Check className="h-12 w-12 text-green-600 mx-auto mb-3" />
              <h3 className="text-lg font-semibold text-green-900 mb-2">
                ИИ-ассистент готов!
              </h3>
              <p className="text-green-800">
                Все данные обработаны, ассистент обучен и готов помогать вашим клиентам
              </p>
            </div>

            <div className="bg-white border rounded-lg p-6 text-left">
              <h4 className="font-medium text-gray-900 mb-3">Что дальше:</h4>
              <div className="space-y-2 text-sm text-gray-600">
                <p>✅ Ассистент создан и настроен</p>
                <p>✅ Код виджета будет доступен в Dashboard</p>
                <p>✅ Можно тестировать и встраивать на сайт</p>
                <p>✅ Аналитика и управление в панели</p>
              </div>
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 py-8 px-4">
      <div className="max-w-4xl mx-auto">
        {/* Header */}
        <div className="text-center mb-8">
          <button 
            onClick={handleBack}
            className="mb-6 flex items-center gap-2 text-gray-600 hover:text-gray-900 transition-colors mx-auto"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Назад в Dashboard' : 'Назад'}
          </button>

          <Bot className="h-12 w-12 text-primary-600 mx-auto mb-4" />
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            Настройка ИИ-ассистента
          </h1>
          <p className="text-gray-600">
            Шаг {currentStep} из 4: {steps[currentStep - 1].title}
          </p>
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            {steps.map((step, index) => (
              <div
                key={step.id}
                className={`flex items-center ${index < steps.length - 1 ? 'flex-1' : ''}`}
              >
                <div className={`
                  flex items-center justify-center w-10 h-10 rounded-full border-2 transition-colors
                  ${currentStep >= step.id 
                    ? 'bg-primary-600 border-primary-600 text-white' 
                    : 'bg-white border-gray-300 text-gray-400'
                  }
                `}>
                  {currentStep > step.id ? (
                    <Check className="h-5 w-5" />
                  ) : (
                    <span className="text-sm font-medium">{step.id}</span>
                  )}
                </div>
                {index < steps.length - 1 && (
                  <div className={`
                    flex-1 h-1 mx-4 transition-colors
                    ${currentStep > step.id ? 'bg-primary-600' : 'bg-gray-200'}
                  `} />
                )}
              </div>
            ))}
          </div>
          
          <div className="text-center">
            <h2 className="text-xl font-semibold text-gray-900 mb-1">
              {steps[currentStep - 1].title}
            </h2>
            <p className="text-gray-600">
              {steps[currentStep - 1].description}
            </p>
          </div>
        </div>

        {/* Step Content */}
        <div className="bg-white rounded-xl shadow-sm border p-8 mb-8">
          {renderStepContent()}
        </div>

        {/* Navigation */}
        <div className="flex justify-between">
          <button
            onClick={handleBack}
            className="btn-secondary flex items-center gap-2"
          >
            <ArrowLeft className="h-4 w-4" />
            {currentStep === 1 ? 'Dashboard' : 'Назад'}
          </button>

          <button
            onClick={handleNext}
            disabled={!isStepValid(currentStep) || loading}
            className="btn-primary flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
          >
            {loading ? 'Создаем...' : currentStep === 4 ? 'Начать анализ' : 'Далее'}
            <ArrowRight className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
};

export default Onboarding; 