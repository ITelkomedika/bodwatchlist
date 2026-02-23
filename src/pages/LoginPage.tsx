import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Navigate } from 'react-router-dom';
import { useNavigate } from 'react-router-dom';

const LoginPage: React.FC = () => {
  const { login, user, loading } = useAuth();
  const navigate = useNavigate();

  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');

  if (user) {
    return <Navigate to="/" replace />;
  }

  const handleSubmit = async () => {
    if (!username || !password) {
      setError('Username dan password wajib diisi');
      return;
    }

    try {
      setError('');
      await login(username, password);
      navigate('/', { replace: true });
    } catch (err) {
      setError('Username atau password salah');
    }
  };

  return (
    <div className="min-h-screen bg-slate-900 flex items-center justify-center p-6">
      <div className="bg-white rounded-[50px] shadow-2xl p-8 sm:p-12 max-w-md w-full text-center space-y-8">

        <div className="space-y-4">
          <div className="w-16 h-16 bg-red-600 rounded-2xl mx-auto flex items-center justify-center font-black text-2xl italic text-white shadow-xl shadow-red-900/20">
            TM
          </div>
          <h1 className="text-3xl font-black text-slate-900 tracking-tighter italic">
            Watchlist BOD Concern
          </h1>
          <p className="text-slate-400 text-[10px] font-black uppercase tracking-[0.4em]">
            Board Of Directors Task Control
          </p>
        </div>

        <div className="space-y-4 text-left">
          <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
          />

          <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full px-6 py-4 rounded-2xl bg-slate-50 border border-slate-200 text-sm font-bold text-slate-900 outline-none focus:ring-4 focus:ring-blue-100 transition-all"
          />

          {error && (
            <p className="text-xs font-bold text-red-600">
              {error}
            </p>
          )}
        </div>

        <button
          onClick={handleSubmit}
          disabled={loading}
          className="w-full bg-slate-900 text-white px-6 py-4 rounded-2xl font-black text-sm shadow-xl hover:bg-blue-700 transition-all disabled:opacity-50"
        >
          {loading ? 'Authenticating...' : 'Login'}
        </button>

      </div>
    </div>
  );
};

export default LoginPage;