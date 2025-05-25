import React, { createContext, useContext, useState, useEffect, ReactNode } from 'react';
import { User, AuthContextType } from '../types';
import { authAPI } from '../services/api';

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

interface AuthProviderProps {
  children: ReactNode;
}

export const AuthProvider: React.FC<AuthProviderProps> = ({ children }) => {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const initAuth = async () => {
      const savedToken = localStorage.getItem('token');
      const savedUser = localStorage.getItem('user');

      if (savedToken) {
        setToken(savedToken);
        
        // Если есть сохраненный пользователь, сначала устанавливаем его
        if (savedUser) {
          try {
            setUser(JSON.parse(savedUser));
          } catch (error) {
            console.error('Ошибка парсинга пользователя из localStorage:', error);
          }
        }
        
        // Проверяем валидность токена в фоне
        try {
          const response = await authAPI.me();
          if (response.success && response.data) {
            // Обновляем данные пользователя из API
            setUser(response.data.user);
            localStorage.setItem('user', JSON.stringify(response.data.user));
          } else {
            // API вернул неуспешный ответ
            throw new Error('Invalid token response');
          }
        } catch (error) {
          console.error('Токен невалиден, очищаем сессию:', error);
          // Токен невалиден, очищаем данные
          localStorage.removeItem('token');
          localStorage.removeItem('user');
          setToken(null);
          setUser(null);
        }
      }
      
      setLoading(false);
    };

    // Слушатель для события выхода из API interceptor
    const handleLogout = () => {
      setUser(null);
      setToken(null);
    };

    window.addEventListener('auth-logout', handleLogout);
    initAuth();

    // Очистка слушателя при размонтировании
    return () => {
      window.removeEventListener('auth-logout', handleLogout);
    };
  }, []);

  const login = async (email: string, password: string) => {
    try {
      const response = await authAPI.login(email, password);
      
      if (response.success && response.data) {
        const { user: userData, token: userToken } = response.data;
        
        setUser(userData);
        setToken(userToken);
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || 'Ошибка входа');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Ошибка входа');
    }
  };

  const register = async (email: string, password: string, name?: string) => {
    try {
      const response = await authAPI.register(email, password, name);
      
      if (response.success && response.data) {
        const { user: userData, token: userToken } = response.data;
        
        setUser(userData);
        setToken(userToken);
        
        localStorage.setItem('token', userToken);
        localStorage.setItem('user', JSON.stringify(userData));
      } else {
        throw new Error(response.error || 'Ошибка регистрации');
      }
    } catch (error: any) {
      throw new Error(error.response?.data?.error || error.message || 'Ошибка регистрации');
    }
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem('token');
    localStorage.removeItem('user');
  };

  const value: AuthContextType = {
    user,
    token,
    login,
    register,
    logout,
    loading,
  };

  return (
    <AuthContext.Provider value={value}>
      {children}
    </AuthContext.Provider>
  );
}; 