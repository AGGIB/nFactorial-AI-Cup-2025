import React from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider, useAuth } from './contexts/AuthContext';
import Landing from './pages/Landing';
import Auth from './pages/Auth';
import Dashboard from './pages/Dashboard';
import Onboarding from './pages/Onboarding';
import AnalysisProcess from './pages/AnalysisProcess';
import AgentDetail from './pages/AgentDetail';
import VisualTestPage from './pages/VisualTestPage';

// Создаем клиент для React Query
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

// Компонент для защищенных маршрутов
const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/auth" replace />;
  }

  return <>{children}</>;
};

// Компонент для публичных маршрутов (только для неавторизованных)
const PublicRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary-600"></div>
      </div>
    );
  }

  if (user) {
    return <Navigate to="/dashboard" replace />;
  }

  return <>{children}</>;
};

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AuthProvider>
        <Router>
          <div className="App">
            <Routes>
              {/* Публичные маршруты */}
              <Route path="/" element={<Landing />} />
              <Route 
                path="/auth" 
                element={
                  <PublicRoute>
                    <Auth />
                  </PublicRoute>
                } 
              />

              {/* Защищенные маршруты */}
              <Route 
                path="/dashboard" 
                element={
                  <ProtectedRoute>
                    <Dashboard />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/onboarding" 
                element={
                  <ProtectedRoute>
                    <Onboarding />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/analysis" 
                element={
                  <ProtectedRoute>
                    <AnalysisProcess />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/agent/:id" 
                element={
                  <ProtectedRoute>
                    <AgentDetail />
                  </ProtectedRoute>
                } 
              />
              <Route 
                path="/visual-test" 
                element={
                  <ProtectedRoute>
                    <VisualTestPage />
                  </ProtectedRoute>
                } 
              />

              {/* Перенаправление для неизвестных маршрутов */}
              <Route path="*" element={<Navigate to="/" replace />} />
            </Routes>
          </div>
        </Router>
      </AuthProvider>
    </QueryClientProvider>
  );
}

export default App;
