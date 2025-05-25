import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { Bot } from 'lucide-react';
import { useAuth } from '../contexts/AuthContext';

const Auth: React.FC = () => {
  const [isRegister, setIsRegister] = useState(false);
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [name, setName] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  
  const { login, register: registerUser } = useAuth();
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    
    try {
      if (isRegister) {
        await registerUser(email, password, name);
        navigate('/onboarding');
      } else {
        await login(email, password);
        navigate('/dashboard');
      }
    } catch (err: any) {
      setError(err.message);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-primary-50 to-purple-50 flex items-center justify-center px-4">
      <div className="max-w-md w-full">
        <div className="text-center mb-8">
          <Link to="/" className="inline-flex items-center space-x-2 mb-6">
            <Bot className="h-8 w-8 text-primary-600" />
            <span className="text-2xl font-bold text-gray-900">Bloop.ai</span>
          </Link>
          
          <h1 className="text-3xl font-bold text-gray-900 mb-2">
            {isRegister ? 'Создать аккаунт' : 'Добро пожаловать'}
          </h1>
          <p className="text-gray-600">
            {isRegister 
              ? 'Начните создавать ИИ-агентов для вашего бизнеса'
              : 'Войдите в свой аккаунт для продолжения'
            }
          </p>
        </div>

        <div className="card">
          {error && (
            <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="space-y-4">
            {isRegister && (
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">
                  Имя
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="input-field"
                  placeholder="Ваше имя"
                />
              </div>
            )}

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Email
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="input-field"
                placeholder="your@email.com"
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                Пароль
              </label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="input-field"
                placeholder="Минимум 6 символов"
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full btn-primary"
            >
              {loading ? 'Загрузка...' : (isRegister ? 'Создать аккаунт' : 'Войти')}
            </button>
          </form>

          <div className="mt-6 text-center">
            <p className="text-sm text-gray-600">
              {isRegister ? 'Уже есть аккаунт?' : 'Нет аккаунта?'}{' '}
              <button
                onClick={() => setIsRegister(!isRegister)}
                className="text-primary-600 hover:text-primary-700 font-medium"
              >
                {isRegister ? 'Войти' : 'Зарегистрироваться'}
              </button>
            </p>
          </div>
        </div>

        <div className="text-center mt-6">
          <Link 
            to="/" 
            className="text-sm text-gray-500 hover:text-gray-700 transition-colors"
          >
            ← Вернуться на главную
          </Link>
        </div>
      </div>
    </div>
  );
};

export default Auth; 