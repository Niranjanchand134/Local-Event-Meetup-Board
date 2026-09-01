import React, { useState } from 'react';
import type { ScreenType } from '../../types/eventboard';

interface AuthViewProps {
  initialMode?: 'login' | 'signup';
  onNavigate: (screen: ScreenType) => void;
}

export const AuthView: React.FC<AuthViewProps> = ({ initialMode = 'login', onNavigate }) => {
  const [isLogin, setIsLogin] = useState(initialMode === 'login');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [fullName, setFullName] = useState('');
  const [role, setRole] = useState('Attendee');
  const [loading, setLoading] = useState(false);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);
    setTimeout(() => {
      setLoading(false);
      onNavigate('dashboard');
    }, 800);
  };

  return (
    <div className="flex flex-col items-center justify-center min-h-[85vh] px-4 py-12 relative">
      {/* Background pattern */}
      <div className="absolute inset-0 pointer-events-none opacity-10 bg-[linear-gradient(to_right,#e5e2e1_1px,transparent_1px),linear-gradient(to_bottom,#e5e2e1_1px,transparent_1px)] bg-[size:3rem_3rem]"></div>

      <div className="w-full max-w-md bg-[#201f1f] border border-[#353534] rounded-2xl shadow-2xl p-8 relative z-10">
        {/* Brand */}
        <div className="flex items-center gap-3 justify-center mb-8">
          <div className="w-9 h-9 rounded-lg bg-[#ffb4ab] flex items-center justify-center text-[#690005] font-headline-md font-bold">
            EB
          </div>
          <span className="font-headline-md text-[20px] text-[#e5e2e1] font-bold tracking-tight">
            EventBoard
          </span>
        </div>

        {/* Tab Toggle */}
        <div className="flex rounded-xl bg-[#131313] p-1 mb-8 border border-[#353534]">
          <button
            type="button"
            onClick={() => setIsLogin(true)}
            className={`flex-1 py-2 rounded-lg font-label-caps text-[12px] font-bold transition-all ${
              isLogin ? 'bg-[#2a2a2a] text-[#ffb4ab] shadow-sm' : 'text-[#e6bdb8] hover:text-white'
            }`}
          >
            SIGN IN
          </button>
          <button
            type="button"
            onClick={() => setIsLogin(false)}
            className={`flex-1 py-2 rounded-lg font-label-caps text-[12px] font-bold transition-all ${
              !isLogin ? 'bg-[#2a2a2a] text-[#ffb4ab] shadow-sm' : 'text-[#e6bdb8] hover:text-white'
            }`}
          >
            REGISTER
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-4">
          {!isLogin && (
            <div>
              <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                Full Name
              </label>
              <input
                type="text"
                required
                value={fullName}
                onChange={(e) => setFullName(e.target.value)}
                placeholder="e.g. Alex Mercer"
                className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none transition-colors"
              />
            </div>
          )}

          <div>
            <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
              Email Address
            </label>
            <input
              type="email"
              required
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="alex.mercer@example.com"
              className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none transition-colors"
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-1.5">
              <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase font-bold">
                Password
              </label>
              {isLogin && (
                <button
                  type="button"
                  onClick={() => alert('Password reset link sent to email.')}
                  className="font-data-mono text-[11px] text-[#ffb4ab] hover:underline"
                >
                  Forgot?
                </button>
              )}
            </div>
            <input
              type="password"
              required
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••••"
              className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none transition-colors"
            />
          </div>

          {!isLogin && (
            <div>
              <label className="block font-label-caps text-[11px] text-[#e6bdb8] uppercase mb-1.5 font-bold">
                Account Type
              </label>
              <select
                value={role}
                onChange={(e) => setRole(e.target.value)}
                className="w-full bg-[#131313] border border-[#353534] focus:border-[#ffb4ab] rounded-xl p-3 text-[14px] text-white outline-none font-data-mono"
              >
                <option value="Attendee">Attendee / Participant</option>
                <option value="Host">Event Organizer &amp; Host</option>
              </select>
            </div>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-[#ffb4ab] hover:bg-[#ffdad6] text-[#690005] font-label-caps text-[12px] py-3.5 rounded-xl font-bold transition-all shadow-lg hover:scale-[1.02] flex items-center justify-center gap-2 mt-6 uppercase"
          >
            {loading ? (
              <span className="material-symbols-outlined animate-spin text-[20px]">progress_activity</span>
            ) : isLogin ? (
              <span>SIGN IN TO EVENTBOARD →</span>
            ) : (
              <span>CREATE FREE ACCOUNT →</span>
            )}
          </button>
        </form>

        <div className="mt-8 pt-6 border-t border-[#353534] text-center">
          <p className="text-[13px] text-[#e6bdb8]">
            {isLogin ? "Don't have an account yet?" : "Already have an account?"}{' '}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="text-[#ffb4ab] font-bold hover:underline ml-1"
            >
              {isLogin ? 'Sign up' : 'Log in'}
            </button>
          </p>
        </div>
      </div>
    </div>
  );
};
