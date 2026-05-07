import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

type LoginFieldErrors = {
  email?: string;
  password?: string;
};

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

  const getInputClass = (hasError?: boolean) => {
    return [
      'w-full h-[44px] px-4 bg-transparent rounded-[28px] text-[14px] text-white outline-none transition-all duration-200 placeholder:text-white/30',
      hasError
        ? 'border border-red-400/60 focus:border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.08),0_0_18px_rgba(248,113,113,0.12)]'
        : 'border border-white/10 focus:border-[#8348C1] focus:shadow-[0_0_0_3px_rgba(131,72,193,0.10)]',
    ].join(' ');
  };

  const getPasswordInputClass = (hasError?: boolean) => {
    return [
      'w-full h-[44px] px-4 pr-12 bg-transparent rounded-[28px] text-[14px] text-white outline-none transition-all duration-200 placeholder:text-white/30 tracking-widest',
      hasError
        ? 'border border-red-400/60 focus:border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.08),0_0_18px_rgba(248,113,113,0.12)]'
        : 'border border-white/10 focus:border-[#8348C1] focus:shadow-[0_0_0_3px_rgba(131,72,193,0.10)]',
    ].join(' ');
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError('Заповніть дані для входу');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:8000/auth/login', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        setGeneralError(data.detail || 'Помилка входу');
        return;
      }

      localStorage.setItem('user_id', String(data.user_id));
      localStorage.setItem('user_email', data.email);

      navigate('/dashboard');
    } catch {
      setGeneralError('Не вдалося підключитися до сервера');
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

      <div className="absolute top-1/4 -left-[200px] w-[500px] h-[500px] bg-[#522E8B]/30 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-[200px] w-[600px] h-[600px] bg-[#522E8B]/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex-1 flex items-center justify-center z-10 p-4">
        <div className="p-[1px] rounded-[30px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] w-full max-w-[480px]">
          <div className="relative h-full rounded-[29px] bg-[#050506] px-10 py-12 text-center shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] overflow-hidden">
            <h1 className="font-bold text-[32px] text-white mb-2 leading-[40px]">
              Вітаємо
            </h1>

            <p className="font-light text-[18px] text-[#A3A4B0] mb-8 leading-[24px]">
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

            <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4 text-left">
              <div className="flex flex-col gap-1">
                <label className="text-[12px] text-[#A3A4B0] font-normal leading-[16px]">
                  Електронна пошта
                </label>

                <input
                  type="email"
                  placeholder="Введіть електронну пошту"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError('email');
                    setGeneralError('');
                  }}
                  className={getInputClass(Boolean(fieldErrors.email))}
                />

                <ErrorMessage message={fieldErrors.email} />
              </div>

              <div className="flex flex-col gap-1 relative mb-2">
                <div className="flex justify-between items-center">
                  <label className="text-[12px] text-[#A3A4B0] font-normal leading-[16px]">
                    Пароль
                  </label>

                  <a href="#" className="text-[11px] text-white/50 hover:text-white transition-colors">
                    Забули пароль?
                  </a>
                </div>

                <input
                  type={showPassword ? 'text' : 'password'}
                  placeholder="••••••••"
                  value={password}
                  onChange={(e) => {
                    setPassword(e.target.value);
                    clearFieldError('password');
                    setGeneralError('');
                  }}
                  className={getPasswordInputClass(Boolean(fieldErrors.password))}
                />

                <button
                  type="button"
                  onClick={() => setShowPassword(!showPassword)}
                  className="absolute right-4 top-[26px] text-white/50 hover:text-white transition-colors"
                >
                  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
                    {showPassword ? (
                      <>
                        <path d="M17.94 17.94A10.07 10.07 0 0 1 12 20c-7 0-11-8-11-8a18.45 18.45 0 0 1 5.06-5.94M9.9 4.24A9.12 9.12 0 0 1 12 4c7 0 11 8 11 8a18.5 18.5 0 0 1-2.16 3.19m-6.72-1.07a3 3 0 1 1-4.24-4.24"></path>
                        <line x1="1" y1="1" x2="23" y2="23"></line>
                      </>
                    ) : (
                      <>
                        <path d="M1 12s4-8 11-8 11 8 11 8-4 8-11 8-11-8-11-8z"></path>
                        <circle cx="12" cy="12" r="3"></circle>
                      </>
                    )}
                  </svg>
                </button>

                <ErrorMessage message={fieldErrors.password} />
              </div>

              <button
                type="submit"
                disabled={loading}
                className="w-full h-[44px] mt-2 rounded-[28px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium transition-transform duration-150 hover:scale-[1.03] disabled:opacity-60 disabled:hover:scale-100 shadow-[0_4px_15px_rgba(131,72,193,0.3)]"
              >
                {loading ? 'Вхід...' : 'Увійти'}
              </button>
            </form>

            <div className="flex items-center justify-center gap-4 my-6 opacity-60">
              <div className="h-[1px] w-full bg-gradient-to-r from-transparent to-[#8348C1]/50"></div>
              <span className="text-[12px] text-white/60">або</span>
              <div className="h-[1px] w-full bg-gradient-to-l from-transparent to-[#8348C1]/50"></div>
            </div>

            <div className="flex flex-col gap-3">
              <button
                type="button"
                className="w-full h-[44px] rounded-[28px] border border-white/10 bg-transparent flex items-center justify-center gap-3 text-[13px] text-white hover:bg-white/5 transition-colors"
              >
                <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                Увійти з Google
              </button>

              <button
                type="button"
                className="w-full h-[44px] rounded-[28px] border border-white/10 bg-transparent flex items-center justify-center gap-3 text-[13px] text-white hover:bg-white/5 transition-colors"
              >
                <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
                Увійти з Facebook
              </button>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full text-center pb-8 z-10">
        <span className="text-[13px] text-white/50">Не маєте акаунту? </span>

        <Link to="/register" className="text-[13px] text-[#22C55E] hover:underline transition-all">
          Зареєструватись
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;