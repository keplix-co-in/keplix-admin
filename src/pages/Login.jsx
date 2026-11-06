import { useState } from 'react';
import { adminLogin } from '../services/authApi';
import { Icon } from '../components/ui/Icon';

export default function Login({ onLogin }) {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      // Security review 2026-10-28 O-003: the login email and a success
      // trace used to be console.log'd here; removed so admin identities
      // don't land in the browser console. Production builds also drop all
      // console.* calls (vite.config.js).
      const response = await adminLogin(email, password);
      onLogin(response.user);
    } catch (err) {
      // Message only — not the error object (O-003).
      console.error('Login failed:', err?.message);
      setError(err.message || 'Login failed. Please check your credentials.');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-brand-gray-100 flex items-center justify-center p-4 font-sans relative overflow-hidden">
      {/* Background aesthetics */}
      <div className="absolute top-[-10%] left-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-red/5 blur-[100px] pointer-events-none" />
      <div className="absolute bottom-[-10%] right-[-10%] w-[40vw] h-[40vw] rounded-full bg-brand-gray-300/50 blur-[100px] pointer-events-none" />

      <div className="w-full max-w-md bg-[rgba(255,255,255,0.02)] border border-white/5 p-8 rounded-3xl shadow-[0_20px_40px_rgba(0,0,0,0.5)] backdrop-blur-md relative z-10 animate-[fadeInUp_0.4s_ease_forwards]">
        
        <div className="flex flex-col items-center mb-8">
          <div className="w-16 h-16 bg-[rgba(255,61,61,0.08)] border border-[rgba(255,61,61,0.15)] rounded-2xl flex items-center justify-center mb-4 shadow-[inset_0_2px_10px_rgba(255,61,61,0.1)]">
            <svg width="32" height="32" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
              <path d="M12 2L2 22H22L12 2Z" fill="#ff3d3d" fillOpacity="0.8" />
              <path d="M12 2L12 22H22L12 2Z" fill="#ff3d3d" />
            </svg>
          </div>
          <h1 className="text-2xl font-bold text-white mb-2 font-syne tracking-wide">Keplix Admin</h1>
          <p className="text-brand-gray-600 text-sm">Sign in to continue to operations</p>
        </div>

        {error && (
          <div className="bg-[rgba(255,61,61,0.1)] border border-[rgba(255,61,61,0.2)] text-brand-red text-sm px-4 py-3 rounded-xl mb-6 flex items-center gap-3 animate-[fadeIn_0.3s_ease]">
            <Icon name="error" size={16} />
            {error}
          </div>
        )}

        <form onSubmit={handleLogin} className="space-y-5">
          <div>
            <label className="block text-xs font-semibold text-brand-gray-600 mb-2 ml-1">Email Address</label>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-50">
                <Icon name="profile" size={16} color="#fff" />
              </div>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="admin@keplix.com"
                className="w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[rgba(255,61,61,0.5)] focus:bg-brand-gray-400 transition-all"
                required
              />
            </div>
          </div>

          <div>
            <div className="flex justify-between items-center mb-2 ml-1">
              <label className="block text-xs font-semibold text-brand-gray-600">Password</label>
            </div>
            <div className="relative">
              <div className="absolute left-4 top-1/2 -translate-y-1/2 flex items-center pointer-events-none opacity-50">
                <Icon name="settings" size={16} color="#fff" />
              </div>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="w-full bg-[rgba(255,255,255,0.03)] border border-white/10 rounded-xl py-3 pl-11 pr-4 text-sm text-white focus:outline-none focus:border-[rgba(255,61,61,0.5)] focus:bg-brand-gray-400 transition-all tracking-[4px]"
                required
              />
            </div>
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-brand-red hover:bg-[#ff5252] disabled:opacity-50 disabled:cursor-not-allowed text-white font-bold text-sm py-3.5 px-4 rounded-xl transition-all duration-200 mt-4 shadow-[0_4px_15px_rgba(255,61,61,0.3)] hover:shadow-[0_6px_20px_rgba(255,61,61,0.4)] flex items-center justify-center gap-2"
          >
            {loading ? (
              <>
                <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                <span>Signing in...</span>
              </>
            ) : (
              'Sign In'
            )}
          </button>
        </form>
        
        <div className="mt-8 text-center text-xs text-brand-gray-700">
          Secure admin portal access is restricted to authorized Keplix personnel only.
        </div>
      </div>
    </div>
  );
}
