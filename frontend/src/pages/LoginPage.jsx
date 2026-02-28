import React from 'react';
import { useNavigate } from 'react-router-dom';
import Logo from '../components/Logo';

const LoginPage = () => {
  const navigate = useNavigate();

  const handleLogin = (e) => {
    e.preventDefault();
    navigate('/scan');
  };

  return (
    <div className="min-h-screen relative flex items-center justify-center bg-gradient-to-br from-blue-50 to-lavender-100 p-4">
      {/* Absolute Logo at top-left outside the card for branding */}
      <div className="absolute top-6 left-6 md:top-8 md:left-8">
        <Logo />
      </div>

      <div className="w-full max-w-md bg-white/80 backdrop-blur-md rounded-3xl shadow-xl p-8 border border-white/20">
        <h1 className="text-4xl font-bold text-center text-blue-900 mb-2 font-serif hidden">Chill Dude</h1>
        <h2 className="text-3xl font-extrabold text-center text-transparent bg-clip-text bg-gradient-to-r from-blue-600 to-indigo-600 mb-2 font-sans tracking-tight">Welcome Back</h2>
        <p className="text-center text-blue-600/60 mb-8">Your companion for a calmer day</p>

        <form onSubmit={handleLogin} className="space-y-6">
          <div>
            <label className="block text-sm font-medium text-blue-900/70 mb-2">Email</label>
            <input
              type="email"
              className="w-full px-4 py-3 rounded-2xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all bg-white/50"
              placeholder="hello@chilldude.com"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-blue-900/70 mb-2">Password</label>
            <input
              type="password"
              className="w-full px-4 py-3 rounded-2xl border border-blue-100 focus:outline-none focus:ring-2 focus:ring-blue-200 transition-all bg-white/50"
              placeholder="••••••••"
            />
          </div>
          <button
            type="submit"
            className="w-full py-4 bg-blue-600 text-white rounded-2xl font-semibold shadow-lg shadow-blue-200 hover:bg-blue-700 hover:-translate-y-0.5 transition-all active:scale-95"
          >
            Login
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
