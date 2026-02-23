import React from 'react';
import { BrowserRouter, Routes, Route, Outlet } from 'react-router-dom';

import ProtectedRoute from './routes/ProtectedRoute';
import Layout from './components/Layout';
import LoginPage from './pages/LoginPage';
import Dashboard from './pages/Dashboard';
import TaskList from './pages/TaskList';
import AINoted from './pages/AINoted';
import { useAuth } from './context/AuthContext';

const LayoutWrapper = () => {
  const { user, logout } = useAuth();
  if (!user) return null;

  return (
    <Layout currentUser={user} onLogout={logout}>
      <Outlet />
    </Layout>
  );
};

const App: React.FC = () => {
  return (
    <BrowserRouter basename="/bodwatchlist">
      <Routes>

        <Route path="/login" element={<LoginPage />} />

        <Route element={<ProtectedRoute />}>
          <Route element={<LayoutWrapper />}>
            <Route index element={<Dashboard />} />
            <Route path="tasks" element={<TaskList />} />
            <Route path="ai-noted" element={<AINoted />} />
          </Route>
        </Route>

      </Routes>
    </BrowserRouter>
  );
};

export default App;