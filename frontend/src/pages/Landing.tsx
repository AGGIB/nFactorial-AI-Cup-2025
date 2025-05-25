import React from 'react';
import { Link } from 'react-router-dom';
import { Bot, Zap, Globe, BarChart3, ArrowRight, CheckCircle, Users, Target, Clock } from 'lucide-react';

const Landing: React.FC = () => {
  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 to-blue-50">
      {/* Header */}
      <header className="relative z-10 px-6 py-4">
        <nav className="max-w-7xl mx-auto flex items-center justify-between">
          <div className="flex items-center space-x-2">
            <Bot className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">Bloop.ai</span>
          </div>
          
          <div className="hidden md:flex items-center space-x-8">
            <a href="#features" className="text-gray-600 hover:text-gray-900 transition-colors">
              Возможности
            </a>
            <a href="#how-it-works" className="text-gray-600 hover:text-gray-900 transition-colors">
              Как работает
            </a>
            <a href="#pricing" className="text-gray-600 hover:text-gray-900 transition-colors">
              Цены
            </a>
          </div>
          
          <div className="flex items-center space-x-4">
            <Link 
              to="/auth" 
              className="text-gray-600 hover:text-gray-900 transition-colors"
            >
              Войти
            </Link>
            <Link 
              to="/auth?mode=register" 
              className="btn-primary"
            >
              Начать бесплатно
            </Link>
          </div>
        </nav>
      </header>

      {/* Hero Section */}
      <section className="relative px-6 py-20 md:py-32">
        <div className="max-w-7xl mx-auto text-center">
          <div className="max-w-4xl mx-auto">
            <h1 className="text-5xl md:text-7xl font-bold text-gray-900 mb-8 leading-tight">
              Создайте{' '}
              <span className="bg-gradient-to-r from-primary-600 to-purple-600 bg-clip-text text-transparent">
                ИИ-ассистента
              </span>
              <br />
              для вашего IT-стартапа{' '}
              <span className="relative">
                за 5 минут
                <div className="absolute -bottom-2 left-0 right-0 h-3 bg-yellow-200 -rotate-1 -z-10"></div>
              </span>
            </h1>
            
            <p className="text-xl md:text-2xl text-gray-600 mb-12 leading-relaxed">
              Упростите сложный онбординг клиентов с помощью ИИ-ассистента. 
              Мгновенные ответы на вопросы, пошаговые инструкции и поддержка 24/7.
            </p>

            <div className="grid md:grid-cols-3 gap-6 mb-12 max-w-4xl mx-auto">
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Users className="h-8 w-8 text-primary-600 mb-3 mx-auto" />
                <div className="text-2xl font-bold text-gray-900 mb-1">87%</div>
                <div className="text-sm text-gray-600">клиентов завершают онбординг</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Clock className="h-8 w-8 text-green-600 mb-3 mx-auto" />
                <div className="text-2xl font-bold text-gray-900 mb-1">60%</div>
                <div className="text-sm text-gray-600">экономия времени поддержки</div>
              </div>
              <div className="bg-white rounded-lg p-6 shadow-sm border">
                <Target className="h-8 w-8 text-purple-600 mb-3 mx-auto" />
                <div className="text-2xl font-bold text-gray-900 mb-1">7 сек</div>
                <div className="text-sm text-gray-600">среднее время ответа</div>
              </div>
            </div>
            
            <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-16">
              <Link 
                to="/auth?mode=register" 
                className="btn-primary text-lg px-8 py-4 flex items-center gap-2"
              >
                Создать ИИ-ассистента
                <ArrowRight className="h-5 w-5" />
              </Link>
              <button className="btn-secondary text-lg px-8 py-4">
                Демо за 2 минуты
              </button>
            </div>
            
            <div className="text-sm text-gray-500 mb-8">
              Специально для IT-стартапов со сложными продуктами ✨
            </div>
            
            <div className="flex flex-wrap justify-center gap-4">
              <div className="bg-blue-100 text-blue-800 px-4 py-2 rounded-full text-sm font-medium">
                💻 SaaS платформы
              </div>
              <div className="bg-purple-100 text-purple-800 px-4 py-2 rounded-full text-sm font-medium">
                🔧 DevTools
              </div>
              <div className="bg-green-100 text-green-800 px-4 py-2 rounded-full text-sm font-medium">
                🚀 API сервисы
              </div>
              <div className="bg-orange-100 text-orange-800 px-4 py-2 rounded-full text-sm font-medium">
                ⚡ B2B решения
              </div>
            </div>
          </div>
        </div>
        
        {/* Floating Elements */}
        <div className="absolute top-20 left-10 w-20 h-20 bg-primary-200 rounded-full opacity-60 animate-pulse"></div>
        <div className="absolute top-40 right-20 w-16 h-16 bg-purple-200 rounded-full opacity-60 animate-pulse delay-1000"></div>
        <div className="absolute bottom-20 left-20 w-12 h-12 bg-yellow-200 rounded-full opacity-60 animate-pulse delay-2000"></div>
      </section>

      {/* Features Section */}
      <section id="features" className="px-6 py-20 bg-white">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Почему IT-стартапы выбирают Bloop.ai?
            </h2>
            <p className="text-xl text-gray-600 max-w-3xl mx-auto">
              Решите проблему сложного онбординга раз и навсегда. 
              Наш ИИ понимает техническую специфику вашего продукта.
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-3 gap-8">
            <div className="card group hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-primary-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-primary-200 transition-colors">
                <Zap className="h-6 w-6 text-primary-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Сложные процессы — просто
              </h3>
              <p className="text-gray-600">
                Превратите многошаговые инструкции в интерактивные диалоги. 
                Ваши клиенты больше не потеряются в документации.
              </p>
            </div>
            
            <div className="card group hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-green-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-green-200 transition-colors">
                <Globe className="h-6 w-6 text-green-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Умное понимание контекста
              </h3>
              <p className="text-gray-600">
                ИИ изучает вашу документацию, API, FAQ и создает контекстные 
                ответы для каждого этапа пользовательского пути.
              </p>
            </div>
            
            <div className="card group hover:shadow-lg transition-shadow duration-300">
              <div className="w-12 h-12 bg-purple-100 rounded-lg flex items-center justify-center mb-4 group-hover:bg-purple-200 transition-colors">
                <BarChart3 className="h-6 w-6 text-purple-600" />
              </div>
              <h3 className="text-xl font-semibold text-gray-900 mb-3">
                Аналитика воронки
              </h3>
              <p className="text-gray-600">
                Видите где клиенты "застревают" в онбординге. 
                Оптимизируйте процессы на основе реальных данных.
              </p>
            </div>
          </div>
        </div>
      </section>

      {/* How it works */}
      <section id="how-it-works" className="px-6 py-20 bg-gray-50">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6">
              Как это работает?
            </h2>
            <p className="text-xl text-gray-600">
              4 простых шага до запуска ИИ-ассистента для вашего стартапа
            </p>
          </div>
          
          <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-8">
            {[
              {
                step: '01',
                title: 'Расскажите о продукте',
                description: 'Опишите ваш IT-продукт, API, основные функции и пользовательские сценарии'
              },
              {
                step: '02', 
                title: 'Подключите ресурсы',
                description: 'Добавьте документацию, FAQ, базу знаний и ссылки на обучающие материалы'
              },
              {
                step: '03',
                title: 'Обучите ассистента',
                description: 'ИИ проанализирует ваши данные и создаст персонализированные сценарии помощи'
              },
              {
                step: '04',
                title: 'Запустите на сайте',
                description: 'Встройте виджет в личный кабинет или лендинг. Готово к помощи клиентам!'
              }
            ].map((item, index) => (
              <div key={index} className="text-center">
                <div className="w-16 h-16 bg-primary-600 text-white rounded-full flex items-center justify-center text-xl font-bold mb-4 mx-auto">
                  {item.step}
                </div>
                <h3 className="text-lg font-semibold text-gray-900 mb-2">
                  {item.title}
                </h3>
                <p className="text-gray-600 text-sm">
                  {item.description}
                </p>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="px-6 py-20 bg-primary-600">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-4xl md:text-5xl font-bold text-white mb-6">
            Превратите сложный онбординг в конкурентное преимущество
          </h2>
          <p className="text-xl text-primary-100 mb-8">
            Присоединяйтесь к IT-стартапам, которые уже упростили жизнь своим клиентам
          </p>
          
          <div className="flex flex-col sm:flex-row items-center justify-center gap-4 mb-8">
            <Link 
              to="/auth?mode=register" 
              className="bg-white text-primary-600 hover:bg-gray-50 font-medium py-3 px-8 rounded-lg transition-colors duration-200 flex items-center gap-2"
            >
              Начать бесплатно
              <ArrowRight className="h-5 w-5" />
            </Link>
          </div>
          
          <div className="flex items-center justify-center gap-6 text-primary-100 text-sm">
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Настройка за 5 минут
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              Техподдержка разработчиков
            </div>
            <div className="flex items-center gap-2">
              <CheckCircle className="h-4 w-4" />
              API для интеграций
            </div>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="px-6 py-12 bg-gray-900 text-gray-400">
        <div className="max-w-7xl mx-auto text-center">
          <div className="flex items-center justify-center space-x-2 mb-4">
            <Bot className="h-6 w-6 text-primary-400" />
            <span className="text-xl font-bold text-white">Bloop.ai</span>
          </div>
          <p className="text-sm">
            © 2024 Bloop.ai. Упрощаем онбординг для IT-стартапов.
          </p>
        </div>
      </footer>
    </div>
  );
};

export default Landing; 