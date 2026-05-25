import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { useAccount } from "../../context/accountContextValue";
import { supabase } from "../../supabaseClient";
// @ts-ignore
import thirdGradPic from '../../assets/images/third-grad-pic.svg?url';
// @ts-ignore
import seventhGridPic from '../../assets/images/seventh-grid-pic.svg?url';
// @ts-ignore
import eighthGridPic from '../../assets/images/eighth-grid-pic.svg?url';


type LoginFieldErrors = {
  email?: string;
  password?: string;
};

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  background: hasError
    ? "linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(248,113,113,0.6),rgba(239,68,68,0.4)) border-box"
    : "linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box",
  border: "1px solid transparent",
});

const ErrorMessage = ({ message }: { message?: string }) => {
  if (!message) return null;

  return (
    <div className="mt-1 ml-3 flex items-center gap-2 text-[11px] leading-[16px] text-red-300">
      <span className="flex h-[14px] w-[14px] items-center justify-center rounded-full border border-red-400/40 bg-red-500/10 text-[9px] text-red-300">!</span>
      <span>{message}</span>
    </div>
  );
};

const mapLoginError = (message?: string) => {
  if (!message) return "Неправильний email або пароль";
  if (message === "Invalid login credentials") return "Неправильний email або пароль";
  if (message.includes("Email not confirmed")) return "Підтвердіть email перед входом";
  return message;
};

const LoginPage: React.FC = () => {
  const navigate = useNavigate();
  const { refreshAccount } = useAccount();

  const [showPassword, setShowPassword] = useState(false);
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [fieldErrors, setFieldErrors] = useState<LoginFieldErrors>({});
  const [generalError, setGeneralError] = useState("");
  const [generalSuccess, setGeneralSuccess] = useState("");
  const [loading, setLoading] = useState(false);

  const clearFieldError = (field: keyof LoginFieldErrors) => {
    setFieldErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validateForm = () => {
    const errors: LoginFieldErrors = {};
    const emailValue = email.trim();

    if (!emailValue) errors.email = "Введіть електронну пошту";
    else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) errors.email = "Введіть коректну електронну пошту";

    if (!password.trim()) errors.password = "Введіть пароль";

    return errors;
  };

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setGeneralError("");
    setGeneralSuccess("");

    const errors = validateForm();
    setFieldErrors(errors);
    if (Object.keys(errors).length > 0) return;

    try {
      setLoading(true);

      const { data, error } = await supabase.auth.signInWithPassword({
        email: email.trim(),
        password,
      });

      if (error) {
        setGeneralError(mapLoginError(error.message));
        return;
      }

      if (!data.session || !data.user) {
        setGeneralError("Не вдалося створити сесію входу");
        return;
      }

      await refreshAccount();
      navigate("/dashboard");
    } catch {
      setGeneralError("Не вдалося підключитися до Supabase");
    } finally {
      setLoading(false);
    }
  };

  const handleForgotPassword = async () => {
    setGeneralError("");
    setGeneralSuccess("");

    const emailValue = email.trim();
    if (!emailValue || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(emailValue)) {
      setFieldErrors((prev) => ({ ...prev, email: "Введіть email для відновлення пароля" }));
      return;
    }

    const { error } = await supabase.auth.resetPasswordForEmail(emailValue, {
      redirectTo: `${window.location.origin}/reset-password`,
    });

    if (error) {
      setGeneralError(error.message);
      return;
    }

    setGeneralSuccess("Посилання для відновлення пароля надіслано на email");
  };

  const handleOAuth = async (provider: "google" | "apple") => {
    setGeneralError("");
    const { error } = await supabase.auth.signInWithOAuth({
      provider,
      options: {
        redirectTo: `${window.location.origin}/dashboard`,
      },
    });

    if (error) setGeneralError(error.message);
  };

  return (
    <div className="min-h-screen bg-[#000008] flex flex-col relative overflow-hidden font-montserrat">
      <img src={eighthGridPic} alt="" className="absolute top-[-10%] -left-[10%] w-[600px] opacity-60 pointer-events-none mix-blend-screen z-0" />
      <img src={seventhGridPic} alt="" className="absolute bottom-0 -right-[5%] w-[500px] opacity-50 pointer-events-none mix-blend-screen z-0" />

      <div className="absolute top-8 left-8 flex items-center gap-3 cursor-pointer z-20" onClick={() => navigate("/")}>
        <img src="/logo-crypro-pulse.svg" alt="CryptoPulse" className="w-7 h-7 object-contain" />
        <div className="text-[18px] tracking-wide">
          <span className="font-light text-white">Crypto</span>
          <span className="font-medium bg-gradient-to-r from-[#ceafef] to-[#9a64d4] bg-clip-text text-transparent">Pulse</span>
        </div>
      </div>

      <div className="absolute top-1/4 -left-[200px] w-[480px] h-[680px] bg-[#522E8B]/30 blur-[150px] rounded-full pointer-events-none"></div>
      <div className="absolute bottom-1/4 -right-[200px] w-[600px] h-[600px] bg-[#522E8B]/20 blur-[150px] rounded-full pointer-events-none"></div>

      <div className="flex-1 flex flex-col items-center pt-[120px] z-10 p-4">
        <div className="p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] w-[480px] h-[680px]">
          <div className="relative h-full w-full rounded-[28px] bg-[#050506] px-[60px] py-[60px] text-center shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] overflow-hidden">
            <h1 className="text-white text-[32px] font-bold font-montserrat text-center">Вітаємо</h1>
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
            <p className="w-[200px] h-[24px] mx-auto font-light text-[16px] text-[#A3A4B0] mt-[4px] mb-[48px] flex items-center justify-center font-montserrat">Увійдіть у свій акаунт</p>

            {(generalError || generalSuccess) && (
              <div className={`mb-5 rounded-[18px] border px-4 py-3 text-left shadow-[0_0_24px_rgba(239,68,68,0.08)] ${generalError ? "border-red-400/30 bg-[linear-gradient(135deg,rgba(239,68,68,0.14),rgba(131,72,193,0.08))]" : "border-[#22C55E]/30 bg-[#22C55E]/10"}`}>
                <div className="flex items-start gap-3">
                  <div className={`mt-[1px] flex h-[22px] w-[22px] shrink-0 items-center justify-center rounded-full border text-[13px] ${generalError ? "border-red-400/40 bg-red-500/15 text-red-200" : "border-[#22C55E]/40 bg-[#22C55E]/15 text-[#86EFAC]"}`}>
                    {generalError ? "!" : "✓"}
                  </div>
                  <div>
                    <p className={`text-[12px] font-medium leading-[18px] ${generalError ? "text-red-200" : "text-[#BBF7D0]"}`}>{generalError ? "Не вдалося увійти" : "Готово"}</p>
                    <p className={`text-[12px] leading-[18px] ${generalError ? "text-red-300/90" : "text-[#86EFAC]/90"}`}>{generalError || generalSuccess}</p>
                  </div>
                </div>
              </div>
            )}

            <form onSubmit={handleLogin} noValidate className="flex flex-col gap-4 text-left items-center">
              <div className="w-[360px] mb-[2px] text-left">
                <label className="text-[12px] text-[#A3A4B0] text-left pl-[1px] mb-[12px] block font-montserrat">Електронна пошта</label>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => {
                    setEmail(e.target.value);
                    clearFieldError("email");
                    setGeneralError("");
                    setGeneralSuccess("");
                  }}
                  placeholder="Введіть електронну пошту"
                  className="w-[360px] h-[44px] px-5 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                  style={inputStyle(Boolean(fieldErrors.email))}
                />
                <ErrorMessage message={fieldErrors.email} />
              </div>

              <div className="w-[360px] mb-[12px]">
                <div className="flex justify-between items-center mb-[12px]">
                  <label className="text-[12px] text-[#A3A4B0] text-left pl-[1px]">Пароль</label>
                  <button type="button" onClick={handleForgotPassword} className="text-[12px] text-[#A3A4B0] hover:text-white transition-colors">
                    Забули пароль?
                  </button>
                </div>

                <div className="relative h-[44px]">
                  <input
                    type={showPassword ? "text" : "password"}
                    placeholder="••••••••"
                    value={password}
                    onChange={(e) => {
                      setPassword(e.target.value);
                      clearFieldError("password");
                      setGeneralError("");
                    }}
                    className="w-full h-full px-5 pr-12 rounded-full text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 transition-all font-sans focus:shadow-[0_0_15px_rgba(131,72,193,0.15)]"
                    style={inputStyle(Boolean(fieldErrors.password))}
                  />
                  <button type="button" onClick={() => setShowPassword(!showPassword)} className="absolute right-4 top-1/2 -translate-y-1/2 text-[#A3A4B0] hover:text-white transition-colors">
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

              <button type="submit" disabled={loading} className="w-[360px] h-[44px] mt-2 rounded-full flex items-center justify-center bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] font-medium transition-transform hover:scale-[1.02] active:scale-[0.98] disabled:opacity-60 shadow-[0_4px_15px_rgba(131,72,193,0.2)]">
                {loading ? "Вхід..." : "Увійти"}
              </button>
            </form>

            <div className="flex items-center w-[360px] mx-auto my-[32px]">
              <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg,#000 0%,#8348C1 48%,#2C1969 100%)" }} />
              <span className="px-4 text-[12px] text-[#A3A4B0]">або</span>
              <div className="flex-1 h-[1px]" style={{ background: "linear-gradient(90deg,#2C1969 0%,#8348C1 52%,#000 100%)" }} />
            </div>

            <div className="flex flex-col gap-[24px] w-[360px] mx-auto">
              <button type="button" onClick={() => handleOAuth("google")} className="relative w-[360px] h-[44px] p-[1px] rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)]" />
                <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[14px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                  <img src="https://www.svgrepo.com/show/475656/google-color.svg" alt="Google" className="w-5 h-5" />
                  <span>Увійти з Google</span>
                </div>
              </button>

              <button type="button" onClick={() => handleOAuth("apple")} className="relative w-[360px] h-[44px] p-[1px] rounded-full overflow-hidden group transition-all hover:scale-105 active:scale-95">
                <div className="absolute inset-0 bg-[linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)]" />
                <div className="relative flex items-center justify-center w-full h-full bg-[#050506] rounded-full gap-3 text-[14px] text-white group-hover:bg-[#0a0a0c] transition-colors">
                  <svg viewBox="0 0 24 24" className="w-5 h-5 fill-white"><path d="M17.05 20.28c-.98.95-2.05.8-3.08.35-1.09-.46-2.09-.48-3.24 0-1.44.62-2.2.44-3.06-.35C2.79 15.25 3.51 7.7 9.05 7.4c1.35.07 2.29.74 3.08.8 1.18-.24 2.31-.93 3.57-.84 1.51.12 2.65.72 3.4 1.8-3.12 1.87-2.38 5.98.48 7.13-.57 1.5-1.31 2.99-2.54 4zm-3.1-17.6c.06 2.3-1.7 4.17-3.9 4.05-.3-2.15 1.86-4.17 3.9-4.05z"/></svg>
                  <span>Увійти з Apple</span>
                </div>
              </button>
            </div>
          </div>
        </div>
      </div>



      <div className="w-full text-center mt-[40px] z-10">
        <span className="text-[14px] text-[#A3A4B0]">Не маєте акаунту? </span>
        <Link to="/register" className="text-[14px] text-[#25DE28] hover:text-[#1ea84f] transition-all">
          Зареєструватись
        </Link>
      </div>
    </div>
  );
};

export default LoginPage;
