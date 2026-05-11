import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

// ─── Змінні оточення Supabase ────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

// Єдиний стиль для інпутів (як у RegisterPage)
const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  background: hasError
    ? 'linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(248,113,113,0.6),rgba(239,68,68,0.4)) border-box'
    : 'linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box',
  border: '1px solid transparent',
});

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;

  return (
    <div className="mt-1 ml-3 flex items-center gap-2 text-[11px] leading-[16px] text-red-300">
      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-[9px] text-red-300">
        !
      </span>
      <span>{message}</span>
    </div>
  );
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');

  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: keyof LoginFieldErrors) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  const validateForm = () => {
    const errors: LoginFieldErrors = {};
    const emailValue = email.trim();

    if (!emailValue) {
      errors.email = 'Введіть електронну пошту';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.email = 'Введіть коректну електронну пошту';
    }

    if (!password.trim()) {
      errors.password = 'Введіть пароль';
    }

    return errors;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      return;
    }

    try {
      setLoading(true);

      // 🔥 Логін через Supabase API (token endpoint)
      const response = await fetch(`${SUPABASE_URL}/auth/v1/token?grant_type=password`, {
        method: 'POST',
        headers: {
          'apikey': SUPABASE_ANON_KEY,
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          email: email.trim(),
          password: password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        // Supabase повертає помилки в полі error_description або msg
        const errMsg = data.error_description || data.msg || 'Неправильний email або пароль';
        setGeneralError(errMsg === 'Invalid login credentials' ? 'Неправильний email або пароль' : errMsg);
        return;
      }

      // Supabase успішно видав токен доступу. Зберігаємо його.
      localStorage.setItem('access_token', data.access_token);
      
      if (data.user) {
        localStorage.setItem('user_id', data.user.id);
        localStorage.setItem('user_email', data.user.email);
      }

      navigate('/dashboard'); // Або куди тобі треба перекинути після входу
    } catch {
      setGeneralError('Не вдалося підключитися до бази даних Supabase');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#000008] flex flex-col relative overflow-hidden font-montserrat">
      <div
        className="absolute top-8 left-8 flex items-center gap-3 cursor-pointer z-20"
        onClick={() => navigate('/')}
      >
        <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-7 h-7 object-contain" />

        <div className="text-[18px] tracking-wide">
          <span className="font-light text-white">Crypto</span>
          <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">
            Pulse
          </span>
        </div>
      </div>

      <div className="absolute top-1/4 -left-[200px] w-[480px] h-[680px] bg-[#522E8B]/30 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-[200px] w-[600px] h-[600px] bg-[#522E8B]/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex-1 flex items-center justify-center z-10 p-4">
        <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]  w-[480px] h-[680px]">
          <div className="relative h-full rounded-[28px] bg-[#050506] px-[60px] py-[60px] text-center shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] overflow-hidden">
            <h1 className="text-white text-[32px] font-bold font-montserrat text-center">
              Вітаємо
            </h1>

            <p className="w-[200px] h-[24px] mx-auto font-light text-[16px] text-[#A3A4B0] mt-[4px] mb-[48px] flex items-center justify-center font-light font-montserrat">
              Увійдіть у свій акаунт
            </p>

            {generalError && (
              <div className="mb-5 rounded-[18px] border border-red-400/30 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(131,72,193,0.08))] px-4 py-3 text-left shadow-[0_0_24px_rgba(239,68,68,0.08)]">
                <div className="flex items-start gap-3">
                  <div className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-[13px] text-red-200">
                    !
                  </div>

                  <div>
                    <p className="text-[12px] font-medium text-red-200 leading-[18px]">
                      Не вдалося увійти
                    </p>
                    <p className="text-[12px] text-red-300/90 leading-[18px]">
                      {generalError}
                    </p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4 text-left items-center">
              
              {/* Email */}
              <div className="w-[360px] mb-[2px] text-left">
                <label className="text-[12px] text-[#A3A4B0] text-left pl-[1px] mb-[12px] block font-montserrat">
                  Електронна пошта
                </label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                    setGeneralError('');
                  }}
                  placeholder="Введіть електронну пошту"
                  className="w-full h-[44px] px-5 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                  style={inputStyle(Boolean(fieldErrors.email))}
                />
                <ErrorMessage message={fieldErrors.email} />
              </div>

              {/* Password */}
              <div className="w-[360px] mb-[12px]">
                <div className="flex justify-between items-center mb-[12px]">
                  <label className="text-[12px] text-[#A3A4B0] text-left pl-[1px]">
                    Пароль
                  </label>
                  <a href="#" className="text-[12px] text-[#A3A4B0] hover:text-white transition-colors">
                    Забули пароль?
                  </a>
                </div>

                <div className="relative h-[44px]">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError('password');
                      setGeneralError('');
                    }}
                    className="w-full h-full px-5 pr-12 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all font-sans focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                    style={inputStyle(Boolean(fieldErrors.password))}
                  />

                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A4B0] hover:text-white transition-colors"
                  >
                    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
                      {showPassword ? (
                        <>
                          <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" />
                          <circle cx="12" cy="12" r="3" />
                        </>
                      ) : (
                        <>
                          <path d="M2 10C2 10 5.63636 15 12 15C18.3636 15 22 10 22 10" />
                          <path d="M12 15V19" />
                          <path d="M18 13L21 17" />
                          <path d="M6 13L3 17" />
                        </>
                      )}
                    </svg>
                  </button>
                </div>
                <ErrorMessage message={fieldErrors.password} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-[360px] h-[44px] mt-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_15px_rgba(131,72,193,0.2)]"
              >
                {loading ? 'Вхід...' : 'Увійти'}
              </button>
            </form>

            <div className="flex items-center w-[360px] mx-auto my-[32px]">
              <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg,#000 0%,#8348C1 48%,#2C1969 100%)' }} />
              <span className="px-4 text-[12px] text-[#A3A4B0]">або</span>
              <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg,#2C1969 0%,#8348C1 52%,#000 100%)' }} />
            </div>

            <div className="flex flex-col gap-[24px] w-[360px] mx-auto">
              <button
                type="button"
                className="relative w-[360px] h-[44px] p-[1px] rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)]" />
                <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[14px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  <span>Увійти з Google</span>
                </div>
              </button>

              <button
                type="button"
                className="relative w-[360px] h-[44px] p-[1px] rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95"
              >
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)]" />
                <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[14px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                  <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
                  <span>Увійти з Facebook</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center pb-8 z-10">
        <span className="text-[13px] text-[#A3A4B0]">Не маєте акаунту? </span>
        <Link to="/register" className="text-[13px] text-[#22C55E] hover:text-[#1ea84f] transition-all">
          Зареєструватись
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;