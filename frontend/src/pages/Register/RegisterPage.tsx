import React, { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';

import firstGradPic from '../../assets/images/first-grad-pic.svg';
import secondGradPic from '../../assets/images/second-grad-pic.svg';

type FieldErrors = {
  email?: string;
  birthDate?: string;
  region?: string;
  password?: string;
  confirmPassword?: string;
  terms?: string;
};

type PasswordStrength = {
  label: string;
  hint: string;
  percent: string;
  textClass: string;
  barClass: string;
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

const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M2 10C2 10 5.63636 15 12 15C18.3636 15 22 10 22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 13L21 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 13L3 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none" xmlns="http://www.w3.org/2000/svg">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const RegisterPage: React.FC = () => {
  const navigate = useNavigate();

  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);

  const [email, setEmail] = useState('');
  const [region, setRegion] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');

  const [dateVal, setDateVal] = useState('');
  const [isDateFocused, setIsDateFocused] = useState(false);

  const [acceptedTerms, setAcceptedTerms] = useState(false);

  const [fieldErrors, setFieldErrors] = useState<FieldErrors>({});
  const [generalError, setGeneralError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvailable, setEmailAvailable] = useState<boolean | null>(null);

  const getAge = (birthDate: string) => {
    if (!birthDate) return 0;

    const today = new Date();
    const date = new Date(birthDate);

    let age = today.getFullYear() - date.getFullYear();
    const monthDiff = today.getMonth() - date.getMonth();

    if (monthDiff < 0 || (monthDiff === 0 && today.getDate() < date.getDate())) {
      age--;
    }

    return age;
  };

  const getPasswordStrength = (value: string): PasswordStrength => {
    let score = 0;

    if (value.length >= 8) score++;
    if (/[A-ZА-ЯІЇЄҐ]/.test(value)) score++;
    if (/[0-9]/.test(value)) score++;
    if (/[^A-Za-zА-Яа-яІіЇїЄєҐґ0-9]/.test(value)) score++;

    if (!value) {
      return {
        label: '',
        hint: '',
        percent: '0%',
        textClass: 'text-[#A3A4B0]',
        barClass: 'bg-transparent',
      };
    }

    if (score <= 1) {
      return {
        label: 'Слабкий пароль',
        hint: 'Додайте цифри, великі літери або символи',
        percent: '33%',
        textClass: 'text-red-300',
        barClass: 'bg-gradient-to-r from-red-500 to-red-300',
      };
    }

    if (score <= 3) {
      return {
        label: 'Середній пароль',
        hint: 'Можна зробити ще надійніше',
        percent: '66%',
        textClass: 'text-yellow-200',
        barClass: 'bg-gradient-to-r from-yellow-500 to-[#C38BFF]',
      };
    }

    return {
      label: 'Надійний пароль',
      hint: 'Гарний рівень захисту',
      percent: '100%',
      textClass: 'text-[#86EFAC]',
      barClass: 'bg-gradient-to-r from-[#22C55E] to-[#C38BFF]',
    };
  };

  const passwordStrength = getPasswordStrength(password);

  const clearFieldError = (field: keyof FieldErrors) => {
    setFieldErrors((prev) => ({
      ...prev,
      [field]: undefined,
    }));
  };

  useEffect(() => {
    const emailValue = email.trim();

    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      return;
    }

    const timer = setTimeout(async () => {
      try {
        setCheckingEmail(true);

        const response = await fetch(
          `http://localhost:8000/auth/check-email?email=${encodeURIComponent(emailValue)}`
        );

        const data = await response.json();

        if (data.exists) {
          setEmailAvailable(false);
          setFieldErrors((prev) => ({
            ...prev,
            email: 'Цей email вже використовується',
          }));
        } else {
          setEmailAvailable(true);
          setFieldErrors((prev) => {
            if (prev.email === 'Цей email вже використовується') {
              return {
                ...prev,
                email: undefined,
              };
            }

            return prev;
          });
        }
      } catch {
        setEmailAvailable(null);
      } finally {
        setCheckingEmail(false);
      }
    }, 600);

    return () => clearTimeout(timer);
  }, [email]);

  const validateForm = () => {
    const errors: FieldErrors = {};

    const emailValue = email.trim();
    const regionValue = region.trim();

    if (!emailValue) {
      errors.email = 'Введіть електронну пошту';
    } else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      errors.email = 'Введіть коректну електронну пошту';
    } else if (emailAvailable === false) {
      errors.email = 'Цей email вже використовується';
    }

    if (!dateVal.trim()) {
      errors.birthDate = 'Введіть дату народження';
    } else if (getAge(dateVal) < 13) {
      errors.birthDate = 'Вам має бути щонайменше 13 років для створення акаунта';
    }

    if (!regionValue) {
      errors.region = 'Введіть місце проживання';
    } else if (regionValue.length < 2) {
      errors.region = 'Місце проживання має містити мінімум 2 символи';
    }

    if (!password.trim()) {
      errors.password = 'Введіть пароль';
    } else if (password.length < 8) {
      errors.password = 'Пароль має містити мінімум 8 символів';
    } else if (password.length > 20) {
      errors.password = 'Пароль має містити максимум 20 символів';
    }

    if (!confirmPassword.trim()) {
      errors.confirmPassword = 'Підтвердіть пароль';
    } else if (password !== confirmPassword) {
      errors.confirmPassword = 'Паролі не збігаються';
    }

    return errors;
  };

  const getInputClass = (hasError?: boolean) => {
    return [
      'w-[360px] h-[44px] px-5 bg-transparent rounded-full text-[13px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all duration-200',
      hasError
        ? 'border border-red-400/60 focus:border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.08),0_0_18px_rgba(248,113,113,0.12)]'
        : 'border border-white/10 focus:border-[#8348C1] focus:shadow-[0_0_0_3px_rgba(131,72,193,0.10)]',
    ].join(' ');
  };

  const getPasswordInputClass = (hasError?: boolean) => {
    return [
      'w-[360px] h-[44px] px-5 pr-12 bg-transparent rounded-full text-[13px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all duration-200 font-sans',
      hasError
        ? 'border border-red-400/60 focus:border-red-400 shadow-[0_0_0_3px_rgba(248,113,113,0.08),0_0_18px_rgba(248,113,113,0.12)]'
        : 'border border-white/10 focus:border-[#8348C1] focus:shadow-[0_0_0_3px_rgba(131,72,193,0.10)]',
    ].join(' ');
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    setGeneralError('');
    setSuccess('');

    const errors = validateForm();
    setFieldErrors(errors);

    if (Object.keys(errors).length > 0) {
      setGeneralError('Заповніть усі поля коректно');
      return;
    }

    try {
      setLoading(true);

      const response = await fetch('http://localhost:8000/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        credentials: 'include',
        body: JSON.stringify({
          email: email.trim(),
          password,
          birth_date: dateVal,
          region: region.trim(),
        }),
      });

      const data = await response.json();

      if (!response.ok) {
        if (typeof data.detail === 'string') {
          setGeneralError(data.detail);
          return;
        }

        setGeneralError('Помилка реєстрації. Перевірте введені дані');
        return;
      }

      setSuccess('Акаунт успішно створено. Зараз перенаправимо вас на сторінку входу');

      setTimeout(() => {
        navigate('/login');
      }, 1000);
    } catch {
      setGeneralError('Не вдалося підключитися до сервера');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-[#010004] flex flex-col relative overflow-hidden font-montserrat">
      <div
        className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 cursor-pointer z-30"
        onClick={() => navigate('/')}
      >
        <img
          src="/logo-crypro-pulse.svg"
          alt="CryptoPulse"
          className="w-6 h-6 md:w-7 md:h-7 object-contain"
        />

        <div className="text-[16px] md:text-[18px] tracking-wide">
          <span className="font-light text-white">Crypto</span>
          <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">
            Pulse
          </span>
        </div>
      </div>

      <img
        src={firstGradPic}
        alt=""
        className="absolute top-[-10%] -left-[10%] w-[500px] md:w-[600px] opacity-60 pointer-events-none mix-blend-screen z-0"
      />

      <img
        src={secondGradPic}
        alt=""
        className="absolute bottom-[0%] -right-[5%] w-[400px] md:w-[500px] opacity-50 pointer-events-none mix-blend-screen z-0"
      />

      <div className="flex-1 flex flex-col items-center justify-center z-10 p-4">
        <div className="p-[1px] rounded-[30px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] w-full max-w-[480px]">
          <div className="relative h-full rounded-[29px] bg-[#050506] px-[60px] py-8 md:py-10 text-center shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] overflow-hidden">
            <div className="absolute top-[-50px] left-[-20px] w-[200px] h-[200px] bg-[#8348C1]/28 blur-[20px] rounded-full pointer-events-none z-0"></div>
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-[#522E8B]/10 blur-[80px] rounded-full pointer-events-none z-0"></div>

            <div className="relative z-10">
              <h1 className="font-bold text-[28px] md:text-[32px] text-white mb-1">
                Вітаємо
              </h1>

              <p className="font-light text-[15px] md:text-[16px] text-[#A3A4B0] mb-6">
                Створіть свій акаунт
              </p>

              {generalError && (
                <div className="mb-4 rounded-[18px] border border-red-400/30 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(131,72,193,0.08))] px-4 py-3 text-left shadow-[0_0_24px_rgba(239,68,68,0.08)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-[13px] text-red-200">
                      !
                    </div>

                    <div>
                      <p className="text-[12px] font-medium text-red-200 leading-[18px]">
                        Перевірте дані
                      </p>
                      <p className="text-[12px] text-red-300/90 leading-[18px]">
                        {generalError}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {success && (
                <div className="mb-4 rounded-[18px] border border-[#22C55E]/30 bg-[linear-gradient(135deg,rgba(34,197,94,0.13),rgba(131,72,193,0.08))] px-4 py-3 text-left shadow-[0_0_24px_rgba(34,197,94,0.08)]">
                  <div className="flex items-start gap-3">
                    <div className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[#22C55E]/40 bg-[#22C55E]/15 text-[12px] text-[#86EFAC]">
                      ✓
                    </div>

                    <div>
                      <p className="text-[12px] font-medium text-[#BBF7D0] leading-[18px]">
                        Готово
                      </p>
                      <p className="text-[12px] text-[#86EFAC]/90 leading-[18px]">
                        {success}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleSubmit} noValidate className="flex flex-col gap-3 text-left items-center">
                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#A3A4B0] ml-3">
                    Електронна пошта
                  </label>

                  <div className="relative">
                    <input
                      type="email"
                      placeholder="Введіть електронну пошту"
                      value={email}
                      onChange={(e) => {
                        setEmail(e.target.value);
                        setEmailAvailable(null);
                        clearFieldError('email');
                        setGeneralError('');
                      }}
                      className={`${getInputClass(Boolean(fieldErrors.email))} pr-20`}
                    />

                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      {checkingEmail && (
                        <span className="text-[10px] text-[#A3A4B0]">перевірка...</span>
                      )}

                      {!checkingEmail && emailAvailable === true && (
                        <span className="text-[11px] text-[#86EFAC]">✓</span>
                      )}

                      {!checkingEmail && emailAvailable === false && (
                        <span className="text-[11px] text-red-300">!</span>
                      )}
                    </div>
                  </div>

                  <ErrorMessage message={fieldErrors.email} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#A3A4B0] ml-3">
                    Дата народження
                  </label>

                  <input
                    type={isDateFocused || dateVal ? 'date' : 'text'}
                    placeholder="дд.мм.рррр"
                    onFocus={() => setIsDateFocused(true)}
                    onBlur={() => setIsDateFocused(false)}
                    onChange={(e) => {
                      setDateVal(e.target.value);
                      clearFieldError('birthDate');
                      setGeneralError('');
                    }}
                    value={dateVal}
                    className={`${getInputClass(Boolean(fieldErrors.birthDate))} [color-scheme:dark]`}
                  />

                  <ErrorMessage message={fieldErrors.birthDate} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#A3A4B0] ml-3">
                    Місце проживання
                  </label>

                  <input
                    type="text"
                    placeholder="Країна"
                    value={region}
                    onChange={(e) => {
                      setRegion(e.target.value);
                      clearFieldError('region');
                      setGeneralError('');
                    }}
                    className={getInputClass(Boolean(fieldErrors.region))}
                  />

                  <ErrorMessage message={fieldErrors.region} />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-[11px] text-[#A3A4B0] ml-3">
                    Пароль
                  </label>
                  <div className="relative w-[360px]">
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
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#A3A4B0] hover:text-white transition-colors"
                    >
                      {showPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                  <ErrorMessage message={fieldErrors.password} />

                  {password && (
                    <div className="mt-2 ml-3 mr-3 w-[336px]">
                      <div className="h-[4px] w-full overflow-hidden rounded-full bg-white/10">
                        <div
                          className={`h-full rounded-full transition-all duration-300 ${passwordStrength.barClass}`}
                          style={{ width: passwordStrength.percent }}
                        />
                      </div>
                      <div className="mt-1 flex items-center justify-between gap-3">
                        <span className={`text-[11px] leading-[16px] ${passwordStrength.textClass}`}>
                          {passwordStrength.label}
                        </span>
                        <span className="text-[10px] leading-[16px] text-[#A3A4B0]/70">
                          {passwordStrength.hint}
                        </span>
                      </div>
                    </div>
                  )}
                </div>

                <div className="flex flex-col gap-1 mb-1">
                  <label className="text-[11px] text-[#A3A4B0] ml-3">
                    Підтвердження паролю
                  </label>
                  <div className="relative w-[360px]">
                    <input
                      type={showConfirmPassword ? 'text' : 'password'}
                      placeholder="••••••••"
                      value={confirmPassword}
                      onChange={(e) => {
                        setConfirmPassword(e.target.value);
                        clearFieldError('confirmPassword');
                        setGeneralError('');
                      }}
                      className={getPasswordInputClass(Boolean(fieldErrors.confirmPassword))}
                    />
                    <button
                      type="button"
                      onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                      className="absolute right-3 top-1/2 -translate-y-1/2 flex items-center justify-center text-[#A3A4B0] hover:text-white transition-colors"
                    >
                      {showConfirmPassword ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                  <ErrorMessage message={fieldErrors.confirmPassword} />
                </div>

                <button
                  type="submit"
                  disabled={loading || checkingEmail}
                  className="w-[360px] h-[44px] mt-1 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_15px_rgba(131,72,193,0.2)]"
                >
                  {loading ? (
                    <span className="flex items-center gap-2">Створення...</span>
                  ) : (
                    'Створити акаунт'
                  )}
                </button>

                {/* ЛІНІЯ "АБО" З ГРАДІЄНТАМИ ФІГМИ */}
                <div className="flex items-center justify-center w-[360px] my-3">
                  {/* Ліва лінія: від чорного (край) до темно-фіолетового (центр) */}
                  <div
                    className="flex-1 h-[1px]"
                    style={{ background: 'linear-gradient(90deg, #000000 0%, #8348C1 48%, #2C1969 100%)' }}
                  ></div>

                  <span className="px-4 text-[12px] text-[#A3A4B0] font-light">або</span>

                  {/* Права лінія: від темно-фіолетового (центр) до чорного (край) */}
                  <div
                    className="flex-1 h-[1px]"
                    style={{ background: 'linear-gradient(90deg, #2C1969 0%, #8348C1 52%, #000000 100%)' }}
                  ></div>
                </div>

                <div className="flex flex-col gap-6 items-center">
                  {/* Кнопка Google */}
                  <button
                    type="button"
                    className="relative w-[360px] h-[44px] p-[1.0px] rounded-full overflow-hidden group transition-transform hover:scale-[1.01]"
                  >
                    {/* Шар градієнтного контуру */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969_0%,#8348C1_50%,#C38BFF_100%)]"></div>

                    {/* Внутрішня частина кнопки (чорний фон) */}
                    <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[13px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                      <span>Увійти з Google</span>
                    </div>
                  </button>

                  {/* Кнопка Facebook */}
                  <button
                    type="button"
                    className="relative w-[360px] h-[44px] p-[1.0px] rounded-full overflow-hidden group transition-transform hover:scale-[1.01] mb-[5px]"
                  >
                    {/* Шар градієнтного контуру */}
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969_0%,#8348C1_50%,#C38BFF_100%)]"></div>

                    {/* Внутрішня частина кнопки (чорний фон) */}
                    <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[13px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                      <img src="https://www.svgrepo.com/show/475647/facebook-color.svg" alt="Facebook" className="w-5 h-5" />
                      <span>Увійти з Facebook</span>
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </div>
        </div>

        <div className="w-full text-center py-6 z-10 relative">
          <span className="text-[12px] md:text-[13px] text-[#A3A4B0]">
            Вже маєте акаунт?{' '}
          </span>

          <Link
            to="/login"
            className="text-[12px] md:text-[13px] text-[#22C55E] hover:text-[#1ea84f] transition-all"
          >
            Увійти
          </Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;