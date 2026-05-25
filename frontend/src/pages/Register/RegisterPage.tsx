import { useEffect, useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import PhoneInput from 'react-phone-input-2';
// eslint-disable-next-line @typescript-eslint/no-explicit-any
const Phone = (PhoneInput as any).default ?? PhoneInput;
import 'react-phone-input-2/lib/style.css';
import { supabase } from '../../supabaseClient';
import { mergeAccountCache } from '../../utils/accountCache';


import thirdGradPic from '../../assets/images/third-grad-pic.svg?url';
import seventhGridPic from '../../assets/images/seventh-grid-pic.svg?url';
import eighthGridPic from '../../assets/images/eighth-grid-pic.svg?url';

// ─── Змінні оточення Supabase ────────────────────────────────────────────────
const SUPABASE_URL = import.meta.env.VITE_SUPABASE_URL;
const SUPABASE_ANON_KEY = import.meta.env.VITE_SUPABASE_ANON_KEY;

// ─── Types ────────────────────────────────────────────────────────────────────
type Step1Fields = {
  email?: string;
  password?: string;
  confirmPassword?: string;
};

type Step2Fields = {
  firstName?: string;
  lastName?: string;
  username?: string;
  phone?: string;
  country?: string;
  birthDate?: string;
};

type PasswordStrength = {
  label: string;
  hint: string;
  percent: string;
  textClass: string;
  barClass: string;
};

type CountryOption = {
  name: string;
  code: string;
  region: string;
};

interface ApiCountry {
  name: { common: string };
  cca2: string;
  region?: string;
}

interface PhoneInputData {
  countryCode?: string;
}

// ─── Icons ────────────────────────────────────────────────────────────────────
const EyeClosedIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M2 10C2 10 5.63636 15 12 15C18.3636 15 22 10 22 10" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M12 15V19" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M18 13L21 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <path d="M6 13L3 17" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

const EyeOpenIcon = () => (
  <svg width="20" height="20" viewBox="0 0 24 24" fill="none">
    <path d="M1 12C1 12 5 4 12 4C19 4 23 12 23 12C23 12 19 20 12 20C5 20 1 12 1 12Z" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
    <circle cx="12" cy="12" r="3" stroke="currentColor" strokeWidth="1.5" />
  </svg>
);

const CalendarIcon = () => (
  <svg width="18" height="18" viewBox="0 0 24 24" fill="none">
    <rect x="3" y="4" width="18" height="18" rx="3" stroke="currentColor" strokeWidth="1.5" />
    <path d="M3 9H21" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
    <path d="M8 2V6M16 2V6" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" />
  </svg>
);

const CheckIcon = () => (
  <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
    <circle cx="8" cy="8" r="7" stroke="#22C55E" strokeWidth="1.2" />
    <path d="M5 8L7 10L11 6" stroke="#22C55E" strokeWidth="1.2" strokeLinecap="round" strokeLinejoin="round" />
  </svg>
);

// ─── Helpers ──────────────────────────────────────────────────────────────────
const BANNED_COUNTRIES = ['ru', 'by'];
const normalizeEmailInput = (value: string) => value.replace(/\s/g, '').toLowerCase();
const sanitizeNameInput = (value: string) =>
  value.replace(/[^A-Za-zА-Яа-яІіЇїЄєҐґ'ʼ -]/g, '');
const namePattern = /^[A-Za-zА-Яа-яІіЇїЄєҐґ'ʼ -]+$/;
const ukrainianCountryNames = new Intl.DisplayNames(['uk'], { type: 'region' });

const parseBirthDateInput = (value: string) => {
  const match = /^(\d{2})\/(\d{2})\/(\d{4})$/.exec(value.trim());
  if (!match) return null;

  const day = Number(match[1]);
  const month = Number(match[2]);
  const year = Number(match[3]);
  const date = new Date(year, month - 1, day);

  if (
    date.getFullYear() !== year ||
    date.getMonth() !== month - 1 ||
    date.getDate() !== day
  ) {
    return null;
  }

  return date;
};

const formatBirthDateForDatabase = (date: Date) => {
  const year = date.getFullYear();
  const month = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${year}-${month}-${day}`;
};

const useCountries = () => {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=name,cca2,region')
      .then(r => r.json())
      .then((data: ApiCountry[]) => {
        const mapped: CountryOption[] = data
          .filter(c => !['RU', 'BY'].includes(c.cca2))
          .map(c => ({
            name: ukrainianCountryNames.of(c.cca2) || c.name.common,
            code: c.cca2,
            region: c.region || 'Інше',
          }))
          .sort((a, b) => a.name.localeCompare(b.name, 'uk'));
        setCountries(mapped);
      })
      .catch(() => setCountries([]))
      .finally(() => setLoadingCountries(false));
  }, []);

  return { countries, loadingCountries };
};

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  background: hasError
    ? 'linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(248,113,113,0.6),rgba(239,68,68,0.4)) border-box'
    : 'linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box',
  border: '1px solid transparent',
});

// ─── Sub-components ───────────────────────────────────────────────────────────
const ErrorMsg = ({ msg }: { msg?: string }) =>
  msg ? (
    <div className="mt-1 ml-3 flex items-center gap-1.5 text-[11px] leading-[16px] text-red-300">
      <span className="flex h-[14px] w-[14px] flex-shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-[9px]">!</span>
      {msg}
    </div>
  ) : null;

const Card = ({ children }: { children: React.ReactNode }) => (
  <div className="p-[1px] rounded-[28px] w-[480px]"
    style={{ background: 'linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))' }}>
    <div className="relative rounded-[28px] bg-[#050506] text-center overflow-hidden"
      style={{ boxShadow: '0 20px 70px rgba(131,72,193,0.10),0 8px 25px rgba(0,0,0,0.35)' }}>
      <div className="absolute top-[-50px] left-[-20px] w-[200px] h-[200px] bg-[#8348C1]/28 blur-[20px] rounded-full pointer-events-none z-0" />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[80%] h-[70%] bg-[#522E8B]/10 blur-[80px] rounded-full pointer-events-none z-0" />
      <div className="relative z-10">{children}</div>
    </div>
  </div>
);

const ErrBanner = ({ msg }: { msg: string }) => (
  <div className="mb-[20px] rounded-[18px] border border-red-400/30 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(131,72,193,0.08))] px-4 py-3 text-left">
    <div className="flex items-start gap-3">
      <div className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-red-400/40 bg-red-500/15 text-[13px] text-red-200">!</div>
      <div>
        <p className="text-[12px] font-medium text-red-200 leading-[18px]">Перевірте дані</p>
        <p className="text-[12px] text-red-300/90 leading-[18px]">{msg}</p>
      </div>
    </div>
  </div>
);

const Lbl = ({ children }: { children: React.ReactNode }) => (
  <label className="text-[12px] text-[#A3A4B0] text-left pl-[1px] mb-[10px] block font-montserrat">{children}</label>
);

const Stepper = ({ step }: { step: number }) => (
  <div className="flex items-center justify-center pt-[60px] mb-[40px] px-[140px]">
    <div
      className="flex-shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-medium"
      style={{
        background: step === 1
          ? 'linear-gradient(#000,#000) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box'
          : 'linear-gradient(135deg,#2C1969,#8348C1)',
        border: step === 1 ? '1px solid transparent' : 'none',
        color: step === 1 ? '#8348C1' : '#fff',
        boxShadow: step === 1 ? '0 0 15px rgba(131,72,193,0.15)' : '0 0 20px rgba(131,72,193,0.3)',
      }}
    >
      {step > 1
        ? <svg width="18" height="18" viewBox="0 0 24 24" fill="none"><path d="M5 12L10 17L19 7" stroke="#22C55E" strokeWidth="2.2" strokeLinecap="round" strokeLinejoin="round" /></svg>
        : '1'}
    </div>
    <div
      className="flex-1 h-[1px] min-w-[80px]"
      style={{ background: step > 1 ? 'linear-gradient(90deg,#8348C1,#C38BFF,#8348C1)' : 'linear-gradient(90deg,#2C1969,#8348C1,#2C1969)' }}
    />
    <div
      className="flex-shrink-0 w-[40px] h-[40px] rounded-full flex items-center justify-center text-[16px] font-medium"
      style={{
        background: step === 2
          ? 'linear-gradient(#000,#000) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box'
          : '#050506',
        border: step === 2 ? '1px solid transparent' : '1px solid rgba(82,46,139,0.5)',
        color: step === 2 ? '#8348C1' : '#A3A4B0',
        boxShadow: step === 2 ? '0 0 15px rgba(131,72,193,0.15)' : 'none',
      }}
    >2</div>
  </div>
);

const UsernameIndicator = ({
  username,
  checkingUsername,
  usernameAvail,
  hasError,
}: {
  username: string;
  checkingUsername: boolean;
  usernameAvail: boolean | null;
  hasError: boolean;
}) => {
  if (username.trim().length < 3) return null;
  if (checkingUsername) {
    return <div className="w-4 h-4 rounded-full border-2 border-[#8348C1] border-t-transparent animate-spin" />;
  }
  if (usernameAvail === true && !hasError) {
    return <CheckIcon />;
  }
  if (usernameAvail === false) {
    return (
      <span className="flex h-4 w-4 items-center justify-center rounded-full border border-red-400/60 bg-red-500/10 text-[9px] text-red-300">!</span>
    );
  }
  return null;
};

// ─── Main ─────────────────────────────────────────────────────────────────────
const RegisterPage = () => {
  const navigate = useNavigate();
  const { countries, loadingCountries } = useCountries();
  const [step, setStep] = useState(1);
  const [oauthError, setOauthError] = useState('');

  const handleOAuth = async (provider: 'google' | 'apple') => {
    setOauthError('');
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: { redirectTo: `${window.location.origin}/dashboard` },
    });
    if (error) setOauthError(error.message);
  };

  // Step 1
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [showPwd, setShowPwd] = useState(false);
  const [showConfirmPwd, setShowConfirmPwd] = useState(false);
  const [s1Errors, setS1Errors] = useState<Step1Fields>({});
  const [s1GenErr, setS1GenErr] = useState('');
  const [checkingEmail, setCheckingEmail] = useState(false);
  const [emailAvail, setEmailAvail] = useState<boolean | null>(null);

  // Step 2
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [username, setUsername] = useState('');
  const [phoneNumber, setPhoneNumber] = useState('');
  const [selectedCountry, setSelectedCountry] = useState('');
  const [countryOpen, setCountryOpen] = useState(false);
  const [birthDate, setBirthDate] = useState('');
  const [s2Errors, setS2Errors] = useState<Step2Fields>({});
  const [s2GenErr, setS2GenErr] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [checkingUsername, setCheckingUsername] = useState(false);
  const [usernameAvail, setUsernameAvail] = useState<boolean | null>(null);
  const [isBanned, setIsBanned] = useState(false);

  const handlePhoneChange = (value: string, data: PhoneInputData) => {
    setPhoneNumber(value);
    if (data.countryCode && BANNED_COUNTRIES.includes(data.countryCode)) {
      setIsBanned(true);
    } else {
      setIsBanned(false);
    }
  };

  const getPwdStrength = (v: string): PasswordStrength => {
    let s = 0;
    if (v.length >= 8) s++;
    if (/[A-ZА-ЯІЇЄҐ]/.test(v)) s++;
    if (/[0-9]/.test(v)) s++;
    if (/[^A-Za-zА-Яа-яІіЇїЄєҐґ0-9]/.test(v)) s++;
    if (!v) return { label: '', hint: '', percent: '0%', textClass: 'text-[#A3A4B0]', barClass: 'bg-transparent' };
    if (s <= 1) return { label: 'Слабкий пароль', hint: 'Додайте цифри, великі літери або символи', percent: '33%', textClass: 'text-red-300', barClass: 'bg-gradient-to-r from-red-500 to-red-300' };
    if (s <= 3) return { label: 'Середній пароль', hint: 'Можна зробити ще надійніше', percent: '66%', textClass: 'text-yellow-200', barClass: 'bg-gradient-to-r from-yellow-500 to-[#C38BFF]' };
    return { label: 'Надійний пароль', hint: 'Гарний рівень захисту', percent: '100%', textClass: 'text-[#86EFAC]', barClass: 'bg-gradient-to-r from-[#22C55E] to-[#C38BFF]' };
  };
  const pwdStrength = getPwdStrength(password);

  useEffect(() => {
    const v = email.trim();
    if (!v || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) return;
    
    const t = setTimeout(async () => {
      try {
        setCheckingEmail(true);
        const r = await fetch(`${SUPABASE_URL}/rest/v1/rpc/check_email_exists`, {
          method: 'POST',
          headers: {
            'apikey': SUPABASE_ANON_KEY,
            'Content-Type': 'application/json'
          },
          body: JSON.stringify({ lookup_email: v.toLowerCase() })
        });
        
        const isExists = await r.json();
        
        if (isExists === true) {
          setEmailAvail(false);
          setS1Errors(p => ({ ...p, email: 'Цей email вже зареєстровано' }));
        } else {
          setEmailAvail(true);
          setS1Errors(p => p.email === 'Цей email вже зареєстровано' ? { ...p, email: undefined } : p);
        }
      } catch { 
        setEmailAvail(null); 
      } finally { 
        setCheckingEmail(false); 
      }
    }, 600);
    
    return () => clearTimeout(t);
  }, [email]);

  useEffect(() => {
    if (step !== 2) return;
    const v = username.trim();
    if (!v || v.length < 3) return;
    const t = setTimeout(() => {
      setCheckingUsername(true);
      setTimeout(() => {
        setUsernameAvail(true);
        setCheckingUsername(false);
      }, 400);
    }, 400);
    return () => clearTimeout(t);
  }, [username, step]);

  useEffect(() => {
    if (!countryOpen) return;
    const h = (e: MouseEvent) => { if (!(e.target as HTMLElement).closest('[data-country]')) setCountryOpen(false); };
    document.addEventListener('mousedown', h);
    return () => document.removeEventListener('mousedown', h);
  }, [countryOpen]);

  const validateS1 = () => {
    const e: Step1Fields = {};
    const v = email.trim();
    if (!v) e.email = 'Введіть електронну пошту';
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(v)) e.email = 'Введіть коректну електронну пошту';
    else if (emailAvail === false) e.email = 'Цей email вже зареєстровано';
    
    if (!password.trim()) e.password = 'Введіть пароль';
    else if (password.length < 8) e.password = 'Мінімум 8 символів';
    else if (password.length > 20) e.password = 'Максимум 20 символів';
    if (!confirmPassword.trim()) e.confirmPassword = 'Підтвердіть пароль';
    else if (password !== confirmPassword) e.confirmPassword = 'Паролі не збігаються';
    return e;
  };

  const validateS2 = () => {
    const e: Step2Fields = {};
    if (!firstName.trim()) e.firstName = "Введіть ім'я";
    else if (!namePattern.test(firstName.trim())) e.firstName = 'Лише букви';
    if (!lastName.trim()) e.lastName = 'Введіть прізвище';
    else if (!namePattern.test(lastName.trim())) e.lastName = 'Лише букви';

    const rawPhone = phoneNumber.replace(/\D/g, '');
    if (rawPhone.length < 7) e.phone = 'Введіть коректний номер телефону';

    if (birthDate.trim()) {
      const parsedBirthDate = parseBirthDateInput(birthDate);
      if (!parsedBirthDate) {
        e.birthDate = 'Введіть коректну дату';
      } else {
        const today = new Date();
        today.setHours(0, 0, 0, 0);
        parsedBirthDate.setHours(0, 0, 0, 0);
        if (parsedBirthDate > today) e.birthDate = 'Дата народження не може бути в майбутньому';
      }
    }

    const u = username.trim();
    if (!u) e.username = "Введіть ім'я користувача";
    else if (u.length < 3) e.username = 'Мінімум 3 символи';
    else if (u.length > 20) e.username = 'Максимум 20 символів';
    else if (!/^[a-zA-Z0-9_]+$/.test(u)) e.username = 'Лише латиниця, цифри та _';
    return e;
  };

  const handleS1Submit = (e: React.FormEvent) => {
    e.preventDefault();
    setS1GenErr('');
    const errs = validateS1();
    setS1Errors(errs);
    if (Object.keys(errs).length) { setS1GenErr('Заповніть усі поля коректно'); return; }
    setStep(2); setS1Errors({}); setS1GenErr('');
  };

  const handleS2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setS2GenErr(''); setSuccess('');
    const errs = validateS2();
    setS2Errors(errs);
    if (Object.keys(errs).length) { setS2GenErr('Заповніть усі поля коректно'); return; }
    
    try {
      setLoading(true);

      const parsedBirthDate = birthDate ? parseBirthDateInput(birthDate) : null;
      const formattedDate = parsedBirthDate ? formatBirthDateForDatabase(parsedBirthDate) : null;

      const profileData = {
  username: username.trim(),
  first_name: firstName.trim(),
  last_name: lastName.trim(),
  phone_number: phoneNumber ? `+${phoneNumber.replace(/\D/g, '')}` : null,
  region: selectedCountry || null,
  birth_date: formattedDate,
};

const { data, error } = await supabase.auth.signUp({
  email: email.trim().toLowerCase(),
  password,
  options: {
    data: profileData,
  },
});
	
if (error) {
  const message = error.message || '';
  setS2GenErr(
    message.includes('Database error saving new user')
      ? 'Supabase не зміг створити профіль користувача. Оновіть SQL trigger handle_new_user у базі.'
      : message || 'Помилка реєстрації. Перевірте дані.'
  );
  return;
}

if (!data.user) {
  setS2GenErr('Не вдалося створити акаунт.');
  return;
}

if (!data.session) {
  setS2GenErr('Акаунт створено, але сесія не активна. Вимкніть Confirm email у Supabase або увійдіть після підтвердження пошти.');
  return;
}

const profilePayload = {
  email: data.user.email || email.trim().toLowerCase(),
  username: profileData.username,
  first_name: profileData.first_name,
  last_name: profileData.last_name,
  phone_number: profileData.phone_number,
  birth_date: profileData.birth_date,
  region: profileData.region,
  active_plan: 'free',
  subscription: 'free',
  billing_cycle: 'monthly',
};

const { data: updatedProfile, error: updateProfileError } = await supabase
  .from('users')
  .update(profilePayload)
  .eq('id', data.user.id)
  .select('id')
  .maybeSingle();

let profileError = updateProfileError;

if (!profileError && !updatedProfile) {
  const { error: insertProfileError } = await supabase.from('users').insert({
    id: data.user.id,
    hashed_password: 'managed_by_supabase',
    is_active: true,
    ...profilePayload,
  });

  profileError = insertProfileError;
}
	
if (profileError) {
  console.error('Profile upsert error:', profileError);
  setS2GenErr('Акаунт створено, але профіль не записався в таблицю users.');
  return;
}

mergeAccountCache({
  userId: data.user.id,
  email: data.user.email || email.trim(),
  firstName: profileData.first_name,
  lastName: profileData.last_name,
  username: profileData.username,
  phoneNumber: profileData.phone_number || '',
  birthDate: profileData.birth_date || '',
  region: profileData.region || '',
  planKey: 'free',
  billingCycle: 'monthly',
  cardLast4: null,
});

setSuccess('Акаунт успішно створено. Оберіть план підписки...');
setTimeout(() => navigate('/select-plan'), 1500);

    } catch { 
      setS2GenErr('Не вдалося підключитися до бази даних Supabase'); 
    } finally { 
      setLoading(false); 
    }
  };

  return (
    <div className="min-h-screen bg-[#010004] flex flex-col relative overflow-hidden font-montserrat">
      <div className="absolute top-6 left-6 md:top-8 md:left-8 flex items-center gap-3 cursor-pointer z-30" onClick={() => navigate('/')}>
        <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-6 h-6 md:w-7 md:h-7 object-contain" />
        <div className="text-[16px] md:text-[18px] tracking-wide">
          <span className="font-light text-white">Crypto</span>
          <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
        </div>
      </div>

     <img src={eighthGridPic} alt="" className="absolute top-[-10%] -left-[10%] w-[600px] opacity-60 pointer-events-none mix-blend-screen z-0" />
      <img src={seventhGridPic} alt="" className="absolute bottom-0 -right-[5%] w-[500px] opacity-50 pointer-events-none mix-blend-screen z-0" />
      <div className="flex-1 flex flex-col items-center justify-center z-10 p-4 py-12">

        {step === 1 && (
          <Card>
            <Stepper step={step} />
            <h1 className="text-white text-[32px] font-bold">Вітаємо</h1>
            {/* Верхній лівий градієнт */}
            <img
              src={thirdGradPic}
              alt=""
              className="absolute top-0 left-0 w-[300px] h-[220px] object-cover object-left opacity-60 pointer-events-none mix-blend-screen z-0 block"
            />
            {/* Нижній правий градієнт */}
            <img
              src={thirdGradPic}
              alt=""
              className="absolute bottom-0 right-0 w-[240px] h-[240px] object-cover object-right-bottom pointer-events-none z-0 select-none transform rotate-180 mix-blend-screen opacity-80"
            />
            {/* ============================================================== */}
            <p className="font-light text-[16px] text-[#A3A4B0] mt-[4px] mb-[48px]">Створіть свій акаунт</p>

            <div className="px-[60px] pb-[60px]">
              {s1GenErr && <ErrBanner msg={s1GenErr} />}

              <form onSubmit={handleS1Submit} noValidate className="flex flex-col items-center">
                <div className="w-[360px] mb-[24px] text-left">
                  <Lbl>Електронна пошта</Lbl>
                  <input
                    type="email"
                    value={email}
                    onChange={e => {
                      setEmail(normalizeEmailInput(e.target.value));
                      if (s1Errors.email) setS1Errors(p => ({ ...p, email: undefined }));
                      setEmailAvail(null);
                    }}
                    autoComplete="email"
                    autoCapitalize="none"
                    spellCheck={false}
                    placeholder="Введіть електронну пошту"
                    className="w-full h-[44px] px-5 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                    style={inputStyle(Boolean(s1Errors.email))}
                  />
                  <ErrorMsg msg={s1Errors.email} />
                </div>

                <div className="w-[360px] mb-[8px] text-left">
                  <Lbl>Пароль</Lbl>
                  <div className="relative h-[44px]">
                    <input
                      type={showPwd ? 'text' : 'password'}
                      value={password}
                      onChange={e => {
                        setPassword(e.target.value);
                        if (s1Errors.password) setS1Errors(p => ({ ...p, password: undefined }));
                      }}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full h-full px-5 pr-12 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all font-sans focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                      style={inputStyle(Boolean(s1Errors.password))}
                    />
                    <button type="button" onClick={() => setShowPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A4B0]">
                      {showPwd ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                  <ErrorMsg msg={s1Errors.password} />
                </div>

                {password && (
                  <div className="w-[360px] mb-[16px]">
                    <div className="w-full h-[3px] rounded-full bg-white/5 mb-[6px]">
                      <div className={`h-full rounded-full transition-all duration-500 ${pwdStrength.barClass}`} style={{ width: pwdStrength.percent }} />
                    </div>
                    <div className="flex justify-between">
                      <span className={`text-[11px] font-medium ${pwdStrength.textClass}`}>{pwdStrength.label}</span>
                      <span className="text-[11px] text-[#A3A4B0]/60">{pwdStrength.hint}</span>
                    </div>
                  </div>
                )}

                <div className={`w-[360px] text-left ${password ? 'mb-[40px]' : 'mb-[40px] mt-[16px]'}`}>
                  <Lbl>Підтвердження паролю</Lbl>
                  <div className="relative h-[44px]">
                    <input
                      type={showConfirmPwd ? 'text' : 'password'}
                      value={confirmPassword}
                      onChange={e => {
                        setConfirmPassword(e.target.value);
                        if (s1Errors.confirmPassword) setS1Errors(p => ({ ...p, confirmPassword: undefined }));
                      }}
                      autoComplete="new-password"
                      placeholder="••••••••"
                      className="w-full h-full px-5 pr-12 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all font-sans focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                      style={inputStyle(Boolean(s1Errors.confirmPassword))}
                    />
                    <button type="button" onClick={() => setShowConfirmPwd(v => !v)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A4B0]">
                      {showConfirmPwd ? <EyeOpenIcon /> : <EyeClosedIcon />}
                    </button>
                  </div>
                  <ErrorMsg msg={s1Errors.confirmPassword} />
                </div>

                <button
                  type="submit"
                  disabled={loading || checkingEmail}
                  className="w-[360px] h-[44px] rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_15px_rgba(131,72,193,0.2)]"
                >
                  {checkingEmail ? 'Перевірка...' : 'Далі'}
                </button>

                <div className="flex items-center w-[360px] my-[32px]">
                  <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg,#000 0%,#8348C1 48%,#2C1969 100%)' }} />
                  <span className="px-4 text-[12px] text-[#A3A4B0]">або</span>
                  <div className="flex-1 h-[1px]" style={{ background: 'linear-gradient(90deg,#2C1969 0%,#8348C1 52%,#000 100%)' }} />
                </div>

                {oauthError && (
                  <div className="w-[360px] mb-[-8px] text-[11px] text-red-300 text-center">{oauthError}</div>
                )}
                <div className="flex flex-col gap-[24px] w-full">
                  <button type="button" onClick={() => handleOAuth('google')} className="relative w-[360px] h-[44px] p-[1px] rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)]" />
                    <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[14px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                      <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="" className="w-5 h-5" /><span>Зареєструватися з Google</span>
                    </div>
                  </button>
                  <button type="button" onClick={() => handleOAuth('apple')} className="relative w-[360px] h-[44px] p-[1px] rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95">
                    <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)]" />
                    <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[14px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                      <svg className="w-5 h-5 fill-white" viewBox="0 0 24 24"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.42c1.33.07 2.26.73 3.04.78 1.15-.24 2.26-.93 3.48-.84 1.49.12 2.6.7 3.33 1.77-3.06 1.84-2.33 5.9.65 7.02-.48 1.36-1.13 2.7-2.5 4.13zM12 7.33c-.12-2.84 2.2-5.19 4.9-5.33.36 3.12-2.83 5.46-4.9 5.33z"/></svg>
                      <span>Зареєструватися з Apple</span>
                    </div>
                  </button>
                </div>
              </form>
            </div>
          </Card>
        )}

        {step === 2 && (
          <Card>
            <Stepper step={step} />
            <h1 className="text-white text-[32px] font-bold">Майже готово</h1>
            <p className="font-light text-[16px] text-[#A3A4B0] mt-[4px] mb-[40px]">Завершіть налаштування профілю</p>

            <div className="px-[60px] pb-[60px]">
              {s2GenErr && !success && <ErrBanner msg={s2GenErr} />}
              {success && (
                <div className="mb-[20px] rounded-[18px] border border-[#22C55E]/30 bg-[linear-gradient(135deg,rgba(34,197,94,0.13),rgba(131,72,193,0.08))] px-4 py-3 text-left">
                  <div className="flex items-start gap-3">
                    <div className="mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border border-[#22C55E]/40 bg-[#22C55E]/15 text-[12px] text-[#86EFAC]">✓</div>
                    <div>
                      <p className="text-[12px] font-medium text-[#BBF7D0] leading-[18px]">Готово</p>
                      <p className="text-[12px] text-[#86EFAC]/90 leading-[18px]">{success}</p>
                    </div>
                  </div>
                </div>
              )}

              <form onSubmit={handleS2Submit} noValidate className="flex flex-col items-center gap-[20px]">

                <div className="w-[360px] flex gap-[12px]">
                  <div className="flex-1 text-left">
                    <Lbl>Ім'я</Lbl>
                    <input
                      type="text"
                      value={firstName}
                      onChange={e => {
                        setFirstName(sanitizeNameInput(e.target.value));
                        if (s2Errors.firstName) setS2Errors(p => ({ ...p, firstName: undefined }));
                      }}
                      placeholder="Вкажіть ім'я"
                      autoComplete="given-name"
                      maxLength={50}
                      className="w-full h-[44px] px-4 rounded-full text-[13px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                      style={inputStyle(Boolean(s2Errors.firstName))}
                    />
                    <ErrorMsg msg={s2Errors.firstName} />
                  </div>
                  <div className="flex-1 text-left">
                    <Lbl>Прізвище</Lbl>
                    <input
                      type="text"
                      value={lastName}
                      onChange={e => {
                        setLastName(sanitizeNameInput(e.target.value));
                        if (s2Errors.lastName) setS2Errors(p => ({ ...p, lastName: undefined }));
                      }}
                      placeholder="Вкажіть прізвище"
                      autoComplete="family-name"
                      maxLength={50}
                      className="w-full h-[44px] px-4 rounded-full text-[13px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                      style={inputStyle(Boolean(s2Errors.lastName))}
                    />
                    <ErrorMsg msg={s2Errors.lastName} />
                  </div>
                </div>

                <div className="w-[360px] text-left">
                  <Lbl>Ім'я користувача</Lbl>
                  <div className="relative h-[44px]">
                    <input
                      type="text"
                      value={username}
                      onChange={e => {
                        setUsername(e.target.value);
                        if (s2Errors.username) setS2Errors(p => ({ ...p, username: undefined }));
                        setUsernameAvail(null);
                      }}
                      placeholder="Вкажіть ім'я користувача"
                      autoComplete="username"
                      maxLength={20}
                      className="w-full h-full px-5 pr-12 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                      style={inputStyle(Boolean(s2Errors.username))}
                    />
                    <div className="absolute right-4 top-1/2 -translate-y-1/2">
                      <UsernameIndicator
                        username={username}
                        checkingUsername={checkingUsername}
                        usernameAvail={usernameAvail}
                        hasError={Boolean(s2Errors.username)}
                      />
                    </div>
                  </div>
                  <ErrorMsg msg={s2Errors.username} />
                  {!s2Errors.username && usernameAvail === true && !checkingUsername && (
                    <div className="mt-1 ml-3 text-[11px] text-[#86EFAC]">Ім'я користувача доступне</div>
                  )}
                </div>

                <div className="w-[360px] text-left phone-register-wrapper">
                  <Lbl>Номер телефону</Lbl>
                  <style>{`
                    .phone-register-wrapper .react-tel-input .form-control {
                      width: 100% !important;
                      height: 44px !important;
                      background: #050506 !important;
                      border-radius: 28px !important;
                      border: 1px solid transparent !important;
                      color: white !important;
                      font-family: 'Montserrat', sans-serif !important;
                      font-size: 14px !important;
                      padding-left: 58px !important;
                      background-image: linear-gradient(#050506,#050506), linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) !important;
                      background-origin: padding-box, border-box !important;
                      background-clip: padding-box, border-box !important;
                      outline: none !important;
                      box-shadow: none !important;
                    }
                    .phone-register-wrapper .react-tel-input .form-control:focus {
                      box-shadow: 0 0 15px rgba(131,72,193,0.15) !important;
                    }
                    .phone-register-wrapper .react-tel-input .flag-dropdown {
                      background: transparent !important;
                      border: none !important;
                      border-radius: 28px 0 0 28px !important;
                    }
                    .phone-register-wrapper .react-tel-input .selected-flag {
                      background: transparent !important;
                      padding-left: 15px !important;
                      border-radius: 28px 0 0 28px !important;
                    }
                    .phone-register-wrapper .react-tel-input .selected-flag:hover,
                    .phone-register-wrapper .react-tel-input .selected-flag:focus {
                      background: transparent !important;
                    }
                    .phone-register-wrapper .react-tel-input .country-list {
                      background: #0d0d10 !important;
                      color: #A3A4B0 !important;
                      border: 1px solid rgba(82,46,139,0.4) !important;
                      border-radius: 16px !important;
                      margin-top: 4px !important;
                      box-shadow: 0 8px 32px rgba(0,0,0,0.6) !important;
                    }
                    .phone-register-wrapper .react-tel-input .country-list .country {
                      padding: 10px 16px !important;
                    }
                    .phone-register-wrapper .react-tel-input .country-list .country:hover {
                      background: rgba(131,72,193,0.2) !important;
                    }
                    .phone-register-wrapper .react-tel-input .country-list .country.highlight {
                      background: rgba(131,72,193,0.15) !important;
                    }
                    .phone-register-wrapper .react-tel-input .country-list .country-name {
                      color: #A3A4B0 !important;
                    }
                    .phone-register-wrapper .react-tel-input .country-list .dial-code {
                      color: #8348C1 !important;
                    }
                    .phone-register-wrapper .react-tel-input .search-box {
                      background: #0d0d10 !important;
                      border: 1px solid rgba(82,46,139,0.4) !important;
                      color: white !important;
                      border-radius: 8px !important;
                      padding: 6px 10px !important;
                      margin: 8px !important;
                      width: calc(100% - 16px) !important;
                    }
                    .phone-register-wrapper .react-tel-input .search-box:focus {
                      outline: none !important;
                      border-color: rgba(131,72,193,0.6) !important;
                    }
                  `}</style>

                  <div style={{
                    padding: '1px',
                    borderRadius: '28px',
                    background: isBanned
                      ? 'linear-gradient(90deg, #ef4444, #b91c1c)'
                      : s2Errors.phone
                        ? 'linear-gradient(90deg,rgba(248,113,113,0.6),rgba(239,68,68,0.4))'
                        : 'transparent',
                  }}>
                    <Phone
                      country={'ua'}
                      value={phoneNumber}
                      onChange={handlePhoneChange}
                      enableSearch={true}
                      placeholder="Введіть номер"
                      searchPlaceholder="Пошук країни..."
                      excludeCountries={['ru', 'by']}
                    />
                  </div>

                  {isBanned ? (
                    <div className="mt-2 ml-3 text-[11px] text-red-500 font-bold animate-pulse">
                      🚨 Виявлено спробу реєстрації з країни-агресора. Доступ заборонено.
                    </div>
                  ) : (
                    <ErrorMsg msg={s2Errors.phone} />
                  )}
                </div>

              <div className="w-[360px] text-left">
                <Lbl>Країна проживання</Lbl>
                <div className="relative" data-country>
                  <input
                    type="text"
                    value={selectedCountry}
                    onChange={e => {
                      setSelectedCountry(e.target.value);
                      setCountryOpen(true);
                      if (s2Errors.country) setS2Errors(p => ({ ...p, country: undefined }));
                    }}
                    onFocus={() => setCountryOpen(true)}
                    placeholder="Введіть країну"
                    autoComplete="country-name"
                    className="w-full h-[44px] px-5 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                    style={inputStyle(Boolean(s2Errors.country))}
                  />

                  {countryOpen && selectedCountry.trim() && (
                    <div
                      className="absolute top-[calc(100%+6px)] left-0 right-0 z-50 rounded-[16px] overflow-hidden"
                      style={{ background: '#0d0d10', border: '1px solid rgba(82,46,139,0.4)', boxShadow: '0 8px 32px rgba(0,0,0,0.6)' }}
                    >
                      <div className="max-h-[220px] overflow-y-auto">
                        {loadingCountries ? (
                          <div className="flex items-center justify-center py-6 gap-2 text-[13px] text-[#A3A4B0]">
                            <div className="w-4 h-4 rounded-full border-2 border-[#8348C1] border-t-transparent animate-spin" />
                            Завантаження...
                          </div>
                        ) : (() => {
                          const query = selectedCountry.trim().toLowerCase();
                          const filtered = countries.filter(c =>
                            c.name.toLowerCase().includes(query)
                          ).slice(0, 10);

                          if (filtered.length === 0) {
                            return (
                              <div className="py-4 text-center text-[13px] text-[#A3A4B0]/60">
                                Країну не знайдено
                              </div>
                            );
                          }
                          return filtered.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onMouseDown={e => e.preventDefault()}
                              onClick={() => {
                                setSelectedCountry(c.name);
                                setCountryOpen(false);
                                if (s2Errors.country) setS2Errors(p => ({ ...p, country: undefined }));
                              }}
                              className={`w-full px-5 py-[10px] text-left text-[13px] transition-colors hover:bg-[#8348C1]/20 ${selectedCountry === c.name ? 'text-[#C38BFF]' : 'text-[#A3A4B0]'}`}
                            >
                              {c.name}
                            </button>
                          ));
                        })()}
                      </div>
                    </div>
                  )}
                </div>
                <ErrorMsg msg={s2Errors.country} />
              </div>

                <div className="w-[360px] text-left">
                  <Lbl>Дата народження</Lbl>
                  <div className="relative h-[44px]">
                    <input
                      type="text"
                      value={birthDate}
                      onChange={e => {
                        let v = e.target.value.replace(/[^0-9]/g, '');
                        if (v.length > 2) v = v.slice(0, 2) + '/' + v.slice(2);
                        if (v.length > 5) v = v.slice(0, 5) + '/' + v.slice(5);
                        if (v.length > 10) v = v.slice(0, 10);
                        setBirthDate(v);
                        if (s2Errors.birthDate) setS2Errors(p => ({ ...p, birthDate: undefined }));
                      }}
                      placeholder="ДД/ММ/РРРР"
                      maxLength={10}
                      className="w-full h-full px-5 pr-12 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                      style={inputStyle(Boolean(s2Errors.birthDate))}
                    />
                    <span className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A4B0]/60 pointer-events-none">
                      <CalendarIcon />
                    </span>
                  </div>
                  <ErrorMsg msg={s2Errors.birthDate} />
                </div>

                <div className="w-[360px] mt-[4px] flex flex-col gap-[16px]">
                  <button
                    type="submit"
                    disabled={loading || isBanned}
                    className={`w-full h-[44px] rounded-full flex items-center justify-center text-white text-[14px] font-medium transition-all duration-200
                      ${isBanned
                        ? 'bg-red-900/50 cursor-not-allowed grayscale'
                        : 'bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] hover:scale-[1.02] active:scale-[0.98] shadow-[0_4px_15px_rgba(131,72,193,0.2)]'
                      } disabled:opacity-60`}
                  >
                    {loading ? 'Завантаження...' : isBanned ? 'Вхід заблоковано' : 'Зареєструватися'}
                  </button>

                  <button
                    type="button"
                    onClick={() => { setStep(1); setS2Errors({}); setS2GenErr(''); setUsernameAvail(null); }}
                    className="w-full h-[44px] rounded-full flex items-center justify-center text-[14px] text-[#A3A4B0] transition-all hover:text-white"
                    style={{ background: 'linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box', border: '1px solid transparent' }}
                  >
                    ← Повернутись назад
                  </button>
                </div>
              </form>
            </div>
          </Card>
        )}

        <div className="w-full text-center py-6 z-10 relative">
          <span className="text-[14px] text-[#A3A4B0]">Вже зареєстровані? </span>
          <Link to="/login" className="text-[14px] text-[#25DE28] hover:text-[#1ea84f] transition-all">Увійти</Link>
        </div>
      </div>
    </div>
  );
};

export default RegisterPage;
