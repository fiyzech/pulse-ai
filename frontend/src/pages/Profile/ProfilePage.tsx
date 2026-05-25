import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { getPlanLabel, mergeAccountCache, readAccountCache } from "../../utils/accountCache";
import userAvatar from "../../assets/images/user_avatar.png";
import editIcon from "../../assets/icons/pencil-edit.svg";
import shareUploadIcon from "../../assets/icons/share-upload.svg";
import logOutWhiteIcon from "../../assets/icons/log-out-white.svg";

type ProfileUser = {
  id: string;
  firstName: string;
  lastName: string;
  email: string;
  username: string;
  phone: string;
  birthDate: string;
  region: string;
  plan: string;
  avatarUrl: string;
  passwordLastChanged: string;
};

type EditForm = {
  firstName: string;
  lastName: string;
  username: string;
  phone: string;
  birthDate: string;
  region: string;
};

type CountryOption = {
  name: string;
  code: string;
  region: string;
};

type PhoneCountryOption = {
  name: string;
  code: string;
  region: string;
  dialCode: string;
};

interface ApiCountry {
  cca2: string;
  region?: string;
  idd?: {
    root?: string;
    suffixes?: string[];
  };  
}

const BANNED_COUNTRIES = ['ru', 'by'];

const countryNameFormatter = new Intl.DisplayNames(['uk'], {
  type: 'region',
});

const useCountries = () => {
  const [countries, setCountries] = useState<CountryOption[]>([]);
  const [loadingCountries, setLoadingCountries] = useState(true);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=cca2,region')
      .then(r => r.json())
      .then((data: ApiCountry[]) => {
        const mapped: CountryOption[] = data
          .filter(c => c.cca2)
          .filter(c => !BANNED_COUNTRIES.includes(c.cca2.toLowerCase()))
          .map(c => ({
            name: countryNameFormatter.of(c.cca2) || c.cca2,
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

const usePhoneCountries = () => {
  const [phoneCountries, setPhoneCountries] = useState<PhoneCountryOption[]>([]);

  useEffect(() => {
    fetch('https://restcountries.com/v3.1/all?fields=cca2,region,idd')
      .then(r => r.json())
      .then((data: ApiCountry[]) => {
        const mapped = data
          .filter(c => c.cca2)
          .filter(c => !BANNED_COUNTRIES.includes(c.cca2.toLowerCase()))
          .map(c => ({
            name: countryNameFormatter.of(c.cca2) || c.cca2,
            code: c.cca2,
            region: c.region || 'Інше',
            dialCode: `${c.idd?.root || ''}${c.idd?.suffixes?.[0] || ''}`,
          }))
          .filter(c => c.dialCode)
          .sort((a, b) => a.name.localeCompare(b.name, 'uk'));

        setPhoneCountries(mapped);
      });
  }, []);

  return phoneCountries;
};

const cardWrapper =
  "w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] ";

const profileInfoGrid =
  "grid grid-cols-[120px_220px_220px] gap-x-[52px] gap-y-[24px] pr-[170px]";

const securityInfoGrid =
  "grid grid-cols-[120px_220px] gap-x-[52px] gap-y-[24px] pr-[170px]";

const editButtonOuter =
  "h-9 min-w-[135px] rounded-full p-[1px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer disabled:opacity-60";

const editButtonInner =
  "flex h-full w-full items-center justify-center gap-2 rounded-full bg-[#050506] px-4 text-[#A3A4B0] text-sm transition-colors hover:text-white";

const emptyUser: ProfileUser = {
  id: "",
  firstName: "Завантаження...",
  lastName: "",
  email: "",
  username: "",
  phone: "",
  birthDate: "",
  region: "",
  plan: "Завантаження...",
  avatarUrl: "",
  passwordLastChanged: "Щойно",
};

const profileCacheKey = "cryptopulse_profile_cache";

const readCachedProfile = (): ProfileUser => {
  const account = readAccountCache();
  if (account) {
    return {
      id: account.userId,
      firstName: account.firstName || "Ім'я",
      lastName: account.lastName || "Прізвище",
      email: account.email || "-",
      username: account.username ? `@${account.username}` : "@username",
      phone: account.phoneNumber || "-",
      birthDate: account.birthDate || "-",
      region: account.region || "Не вказано",
      plan: getPlanLabel(account.planKey),
      avatarUrl: account.avatarUrl,
      passwordLastChanged: account.passwordLastChanged
        ? new Date(account.passwordLastChanged).toLocaleDateString("uk-UA")
        : "Щойно",
    };
  }

  if (typeof window === "undefined") return emptyUser;

  try {
    const raw = window.localStorage.getItem(profileCacheKey);
    if (!raw) return emptyUser;

    const parsed = JSON.parse(raw) as Partial<ProfileUser>;
    if (!parsed.id) return emptyUser;

    return { ...emptyUser, ...parsed };
  } catch {
    return emptyUser;
  }
};

const writeCachedProfile = (profile: ProfileUser) => {
  if (typeof window === "undefined") return;
  window.localStorage.setItem(profileCacheKey, JSON.stringify(profile));
  mergeAccountCache({
    userId: profile.id,
    email: profile.email === "-" ? "" : profile.email,
    firstName: profile.firstName === "Ім'я" ? "" : profile.firstName,
    lastName: profile.lastName === "Прізвище" ? "" : profile.lastName,
    username: profile.username.replace(/^@/, "") === "username" ? "" : profile.username.replace(/^@/, ""),
    phoneNumber: profile.phone === "-" ? "" : profile.phone,
    birthDate: profile.birthDate === "-" ? "" : profile.birthDate,
    region: profile.region === "Не вказано" ? "" : profile.region,
    avatarUrl: profile.avatarUrl,
  });
};

const Modal = ({
  children,
  widthClass = "w-[560px]",
  heightClass = "h-auto",
}: {
  children: React.ReactNode;
  widthClass?: string;
  heightClass?: string;
}) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className={`p-[1px] rounded-[24px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]`}>
      <div className={`${widthClass} ${heightClass} rounded-[24px] bg-[#050506] flex flex-col relative overflow-visible`}>
        {children}
      </div>
    </div>
  </div>
);

const ProfileInput = ({ 
  label, 
  value, 
  onChange, 
  placeholder, 
  icon, 
  type = "text",
  options,
  isCountrySelect,
  countries = [],
  loadingCountries
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  icon?: React.ReactNode;
  type?: string;
  options?: string[];
  isCountrySelect?: boolean;
  countries?: CountryOption[];
  loadingCountries?: boolean;
}) => {
  const [isOpen, setIsOpen] = useState(false);
  const [countrySearch, setCountrySearch] = useState('');
  const wrapperRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
        setIsOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div ref={wrapperRef} className="flex flex-col text-left w-[360px] h-[72px] relative z-20">
      <label className="mb-[12px] block font-montserrat text-[12px] font-normal leading-[16px] text-[#A3A4B0] m-0 p-0">
        {label}
      </label>

      <div className="w-[360px] h-[44px] p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
        <div className="relative flex items-center w-full h-full rounded-full bg-[#050506] m-0 p-0">

          {isCountrySelect ? (
            <div className="flex-1 h-full w-full relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
              <div className="flex-1 h-full bg-transparent px-5 font-montserrat text-[14px] font-normal leading-[18px] text-white flex items-center justify-between">
                <span>{value || <span className="text-[#A3A4B0]/50">{placeholder}</span>}</span>
                <span className={`text-[#A3A4B0] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  {icon}
                </span>
              </div>
              {isOpen && (
                <div className="absolute left-[-10px] bottom-[calc(100%+10px)] z-[100] w-[374px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-lg" onClick={e => e.stopPropagation()}>
                  <div className="bg-[#050506] rounded-[28px] flex flex-col overflow-hidden">
                    <div className="px-[12px] pt-[12px] pb-[12px] border-b border-[rgba(82,46,139,0.3)] bg-[#050506] z-10">
                      <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
                      <input
                        type="text"
                        name="country-search"
                        id="country-search"
                        value={countrySearch}
                        onChange={e => setCountrySearch(e.target.value)}
                        placeholder="Пошук країни..."
                        autoFocus
                        autoComplete="new-password"
                        autoCorrect="off"
                        autoCapitalize="off"
                        spellCheck={false}
                        translate="no"
                        className="w-full h-[44px] bg-[#050506] rounded-[27px] px-4 text-[14px] text-white placeholder:text-[#A3A4B0]/50 outline-none border-none [&::-webkit-contacts-auto-fill-button]:hidden [&::-webkit-credentials-auto-fill-button]:hidden [&::-webkit-search-cancel-button]:hidden"
                      />
                    </div>
                    </div>
                    
                    <div className="max-h-[140px] overflow-y-auto overflow-x-hidden overscroll-contain">
                      {loadingCountries ? (
                        <div className="flex items-center justify-center py-6 gap-2 text-[13px] text-[#A3A4B0]">
                          <div className="w-4 h-4 rounded-full border-2 border-[#8348C1] border-t-transparent animate-spin" />
                          Завантаження...
                        </div>
                      ) : (() => {
                      
                      const search = countrySearch.toLowerCase().trim();

                      const filtered = countries.filter(c =>
                        c.name.toLowerCase().includes(search) ||
                        c.code.toLowerCase().includes(search)
                      );

                      const grouped = filtered.reduce<Record<string, CountryOption[]>>((acc, c) => {
                        const r = c.region;
                        if (!acc[r]) acc[r] = [];
                        acc[r].push(c);
                        return acc;
                      }, {});
                      
                      const regionOrder = ['Europe', 'Asia', 'Americas', 'Africa', 'Oceania', 'Antarctic', 'Інше'];
                      const sorted = Object.entries(grouped).sort(
                        ([a], [b]) => regionOrder.indexOf(a) - regionOrder.indexOf(b)
                      );
                      const regionLabels: Record<string, string> = {
                        Europe: 'Європа', Asia: 'Азія', Americas: 'Америка',
                        Africa: 'Африка', Oceania: 'Океанія', Antarctic: 'Антарктика', Інше: 'Інше',
                      };
                      if (sorted.length === 0) {
                        return <div className="py-4 text-center text-[13px] text-[#A3A4B0]/60">Країну не знайдено</div>;
                      }
                      return sorted.map(([region, items]) => (
                        <div key={region}>
                          <div className="px-4 py-[6px] text-[10px] font-semibold uppercase tracking-wider bg-[rgba(82,46,139,0.08)]">
                            <span className="bg-[linear-gradient(90deg,#AA65F4_0%,#C38BFF_70%)] bg-clip-text text-transparent">
                              {regionLabels[region] ?? region}
                            </span>
                          </div>
                          {items.map(c => (
                            <button
                              key={c.code}
                              type="button"
                              onClick={() => {
                                onChange(c.name);
                                setIsOpen(false);
                                setCountrySearch('');
                              }}
                              className="w-full px-5 py-[9px] text-left text-[13px] transition-colors hover:bg-[#8348C1]/20 flex items-center gap-2 text-[#A3A4B0]"
                            >
                              <span className="block w-full min-w-0 truncate">
                                {c.name}
                              </span>
                            </button>
                          ))}
                        </div>
                      ));
                    })()}
                  </div>
                </div>
              </div>
              )}
            </div>
          ) : options ? (
            <div className="flex-1 h-full w-full relative cursor-pointer" onClick={() => setIsOpen(!isOpen)}>
              <div className="flex-1 h-full bg-transparent px-5 font-montserrat text-[14px] font-normal leading-[18px] text-white flex items-center justify-between">
                <span>{value || <span className="text-[#A3A4B0]/50">{placeholder}</span>}</span>
                <span className={`text-[#A3A4B0] transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}>
                  {icon}
                </span>
              </div>
              {isOpen && (
                <div className="absolute left-0 bottom-[calc(100%+8px)] z-[100] w-[374px] p-[1px] rounded-[16px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-lg">
                  <div className="bg-[#050506] rounded-[16px] p-2 flex flex-col gap-1 max-h-[200px] overflow-y-auto">
                    {options.map(opt => (
                      <button 
                        key={opt} 
                        type="button" 
                        onClick={() => { onChange(opt); setIsOpen(false); }} 
                        className="px-4 py-3 text-left font-montserrat text-[14px] font-normal text-white/80 hover:bg-white/10 hover:text-white rounded-[12px] transition-colors"
                      >
                        {opt}
                      </button>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ) : (
            <input
              type={type}
              value={value}
              onChange={(e) => onChange(e.target.value)}
              placeholder={placeholder}
              style={{ colorScheme: "dark" }}
              className="flex-1 h-full w-full bg-transparent px-5 font-montserrat text-[14px] font-normal leading-[18px] text-white outline-none placeholder:text-[#A3A4B0]/50 [&::-webkit-calendar-picker-indicator]:cursor-pointer"
            />
          )}

          {!isCountrySelect && !options && icon && (
            <div className="pr-5 text-[#A3A4B0] pointer-events-none">
              {icon}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

const EditButton = ({ onClick }: { onClick: () => void }) => (
  <button type="button" onClick={onClick} className={editButtonOuter}>
    <span className={editButtonInner}>
      Редагувати <img src={editIcon} className="w-4 h-4 opacity-70" alt="" />
    </span>
  </button>
);

export default function ProfilePage() {
  const navigate = useNavigate();
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const [user, setUser] = useState<ProfileUser>(() => readCachedProfile());
  const [editForm, setEditForm] = useState<EditForm>({
    firstName: "",
    lastName: "",
    username: "",
    phone: "",
    birthDate: "",
    region: "",
  });
  
  const { countries, loadingCountries } = useCountries();

  const phoneCountries = usePhoneCountries();
  const [phoneDropdownOpen, setPhoneDropdownOpen] = useState(false);
  const [phoneSearch, setPhoneSearch] = useState("");
  const [selectedPhoneCountry, setSelectedPhoneCountry] = useState<PhoneCountryOption | null>(null);

  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const formatPhoneNumber = (value: string) => {
    const digits = value.replace(/\D/g, "").slice(0, 10);

    if (digits.length <= 3) return digits;
    if (digits.length <= 6) return `${digits.slice(0, 3)} ${digits.slice(3)}`;
    if (digits.length <= 8) return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6)}`;

    return `${digits.slice(0, 3)} ${digits.slice(3, 6)} ${digits.slice(6, 8)} ${digits.slice(8, 10)}`;
  };

  useEffect(() => {
    if (profileModalOpen || securityModalOpen) {
      document.body.style.overflow = 'hidden';
    } else {
      document.body.style.overflow = 'unset';
    }
    return () => {
      document.body.style.overflow = 'unset';
    };
  }, [profileModalOpen, securityModalOpen]);

  const openProfileModal = () => {
    const savedPhone = user.phone === "-" ? "" : user.phone;
    
    setEditForm({
      firstName: user.firstName === "Ім'я" || user.firstName === "Завантаження..." ? "" : user.firstName,
      lastName: user.lastName === "Прізвище" ? "" : user.lastName,
      username: user.username.replace(/^@/, "") === "username" ? "" : user.username.replace(/^@/, ""),
      phone: savedPhone,
      birthDate: user.birthDate === "-" ? "" : user.birthDate,
      region: user.region === "Не вказано" ? "" : user.region,
    });
    setError("");
    setMessage("");
    setProfileModalOpen(true);
  };

useEffect(() => {
  let cancelled = false;

  const loadProfile = async () => {
    const {
      data: { user: authUser },
      error: authError,
    } = await supabase.auth.getUser();

    if (cancelled) return;

    if (authError || !authUser) {
      navigate("/login");
      return;
    }

    const { data, error: profileError } = await supabase
      .from("users")
      .select("first_name, last_name, email, username, phone_number, birth_date, region, active_plan, subscription, avatar_url, password_last_changed")
      .eq("id", authUser.id)
      .maybeSingle();

    if (cancelled) return;

    if (profileError) {
      console.error("Profile load error:", profileError);
      setError("Не вдалося завантажити профіль");
      return;
    }

    const currentPlan = data?.active_plan || data?.subscription || "free";

    const loadedUser = {
      id: authUser.id,
      firstName: data?.first_name || "Ім'я",
      lastName: data?.last_name || "Прізвище",
      email: data?.email || authUser.email || "-",
      username: data?.username ? `@${data.username}` : "@username",
      phone: data?.phone_number || "-",
      birthDate: data?.birth_date || "-",
      region: data?.region || "Не вказано",
      plan: getPlanLabel(currentPlan),
      avatarUrl: data?.avatar_url || "",
      passwordLastChanged: data?.password_last_changed
        ? new Date(data.password_last_changed).toLocaleDateString("uk-UA")
        : "Щойно",
    };

    setUser(loadedUser);
    writeCachedProfile(loadedUser);
  };

  void loadProfile();

  return () => {
    cancelled = true;
  };
}, [navigate]);

  const handleAvatarChange = async (e: ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user.id) return;

    setError("");
    setMessage("");

    if (!file.type.startsWith("image/")) {
      setError("Оберіть файл зображення");
      return;
    }

    if (file.size > 5 * 1024 * 1024) {
      setError("Аватар має бути до 5 MB");
      return;
    }

    try {
      setUploadingAvatar(true);
      const safeName = file.name.replace(/[^a-zA-Z0-9._-]/g, "_");
      const filePath = `${user.id}/${Date.now()}-${safeName}`;

      const { error: uploadError } = await supabase.storage
        .from("avatars")
        .upload(filePath, file, { upsert: true });

      if (uploadError) throw uploadError;

      const { data: publicData } = supabase.storage.from("avatars").getPublicUrl(filePath);
      const avatarUrl = publicData.publicUrl;

      const { error: updateError } = await supabase
        .from("users")
        .update({ avatar_url: avatarUrl })
        .eq("id", user.id)
        .select("id")
        .single();

      if (updateError) throw updateError;

      const updatedUser = { ...user, avatarUrl };
      setUser(updatedUser);
      writeCachedProfile(updatedUser);
      setMessage("Аватар оновлено");
    } catch (err) {
      console.error("Avatar upload error:", err);
      setError("Не вдалося завантажити аватар. Перевірте bucket avatars і policies.");
    } finally {
      setUploadingAvatar(false);
      if (fileInputRef.current) fileInputRef.current.value = "";
    }
  };

  const handleSaveProfile = async (e: FormEvent) => {
    e.preventDefault();
    if (!user.id) return;

    setSaving(true);
    setError("");
    setMessage("");

    const username = editForm.username.trim().replace(/^@/, "");

    if (!editForm.firstName.trim()) {
      setError("Введіть ім'я");
      setSaving(false);
      return;
    }

    if (!editForm.lastName.trim()) {
      setError("Введіть прізвище");
      setSaving(false);
      return;
    }

    if (username && !/^[a-zA-Z0-9_]{3,20}$/.test(username)) {
      setError("Username: 3-20 символів, латиниця, цифри або _");
      setSaving(false);
      return;
    }

    const fullPhone = editForm.phone.trim() ? (editForm.phone.startsWith('+') ? editForm.phone : `+${editForm.phone.replace(/\D/g, '')}`) : null;

    try {
      const payload = {
        first_name: editForm.firstName.trim(),
        last_name: editForm.lastName.trim(),
        username: username || null,
        phone_number: fullPhone,
        birth_date: editForm.birthDate.trim() || null,
        region: editForm.region.trim() || null,
      };

      const { error: updateError } = await supabase
        .from("users")
        .update(payload)
        .eq("id", user.id)
        .select("id")
        .single();

      if (updateError) throw updateError;

      await supabase.auth.updateUser({
        data: {
          username: payload.username,
          first_name: payload.first_name,
          last_name: payload.last_name,
          phone_number: payload.phone_number,
          birth_date: payload.birth_date,
          region: payload.region,
        },
      });

      const updatedUser = {
        ...user,
        firstName: payload.first_name,
        lastName: payload.last_name,
        username: payload.username ? `@${payload.username}` : "@username",
        phone: payload.phone_number || "-",
        birthDate: payload.birth_date || "-",
        region: payload.region || "Не вказано",
      };
      setUser(updatedUser);
      writeCachedProfile(updatedUser);
      setProfileModalOpen(false);
      setMessage("Профіль оновлено");
    } catch (err) {
      console.error("Profile save error:", err);
      setError("Не вдалося зберегти профіль");
    } finally {
      setSaving(false);
    }
  };

  const handleChangePassword = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    setMessage("");

    if (newPassword.length < 8) {
      setError("Пароль має містити мінімум 8 символів");
      return;
    }

    if (newPassword !== confirmPassword) {
      setError("Паролі не збігаються");
      return;
    }

    try {
      setSaving(true);
      const { error: passwordError } = await supabase.auth.updateUser({ password: newPassword });
      if (passwordError) throw passwordError;

      const now = new Date().toISOString();
      const { error: updateError } = await supabase
        .from("users")
        .update({ password_last_changed: now })
        .eq("id", user.id)
        .select("id")
        .single();

      if (updateError) throw updateError;

      const updatedUser = { ...user, passwordLastChanged: "Щойно" };
      setUser(updatedUser);
      writeCachedProfile(updatedUser);
      setNewPassword("");
      setConfirmPassword("");
      setSecurityModalOpen(false);
      setMessage("Пароль оновлено");
    } catch (err) {
      console.error("Password update error:", err);
      setError("Не вдалося оновити пароль");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteAccount = async () => {
    if (!window.confirm("Ви точно хочете видалити акаунт? Цю дію неможливо скасувати.")) return;

    try {
      setSaving(true);
      const { error: rpcError } = await supabase.rpc("delete_current_user");
      if (rpcError) throw rpcError;
      window.localStorage.removeItem(profileCacheKey);
      await supabase.auth.signOut();
      navigate("/");
    } catch (err) {
      console.error("Delete account error:", err);
      setError("Не вдалося видалити акаунт. Перевірте SQL-функцію delete_current_user.");
    } finally {
      setSaving(false);
    }
  };

  return (
    <div className="w-full min-h-screen bg-[#050505] text-white px-10 pt-6 font-montserrat">
      <div className="flex flex-col gap-6 h-full max-w-[1116px]">
        {(error || message) && (
          <div className={`rounded-[18px] border px-4 py-3 text-sm ${error ? "border-red-400/30 bg-red-500/10 text-red-200" : "border-[#22C55E]/30 bg-[#22C55E]/10 text-[#BBF7D0]"}`}>
            {error || message}
          </div>
        )}

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Користувач</h2>
          <div className={cardWrapper}>
            <div className="relative flex items-center justify-between h-[108px] p-6 rounded-[28px] bg-[#050506] overflow-hidden">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <img
                    src={user.avatarUrl || userAvatar}
                    className="w-[60px] h-[60px] shrink-0 object-cover rounded-full border border-white/10"
                    alt="Avatar"
                  />

                  <input ref={fileInputRef} type="file" accept="image/*" className="hidden" onChange={handleAvatarChange} />
                </div>

                <div>
                  <div className="flex items-center gap-3 mb-1">
                    <span className="text-xl font-semibold">{user.firstName} {user.lastName}</span>
                    <div className="p-[1px] rounded-full bg-[linear-gradient(90deg,#FFFFFF_0%,#8348C1_48%,#2C1969_100%)]">
                      <span className="flex items-center justify-center px-3 h-6 rounded-full bg-[#0A0A0A] text-[#5C49AA] text-[12px]">{user.plan}</span>
                    </div>
                  </div>
                  <span className="text-sm font-extralight text-white/70">{user.username}</span>
                </div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Персональна інформація</h2>
          <div className={cardWrapper}>
            <div className="relative p-6 rounded-[28px] bg-[#050506] overflow-hidden min-h-[160px]">
              <div className="absolute top-6 right-6">
                <EditButton onClick={openProfileModal} />
              </div>

              <div className={profileInfoGrid}>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Ім'я</p><p className="text-white text-sm">{user.firstName}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">E-mail</p><p className="text-white text-sm">{user.email}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">День народження</p><p className="text-white text-sm">{user.birthDate}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Прізвище</p><p className="text-white text-sm">{user.lastName}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Телефон</p><p className="text-white text-sm">{user.phone}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Країна</p><p className="text-white text-sm">{user.region}</p></div>
              </div>
            </div>
          </div>
        </section>

        <section className="flex flex-col gap-6">
          <h2 className="text-2xl font-semibold">Безпека</h2>
          <div className={cardWrapper}>
            <div className="relative p-6 rounded-[28px] bg-[#050506] overflow-hidden">
              <div className="absolute top-6 right-6">
                <EditButton onClick={() => setSecurityModalOpen(true)} />
              </div>

              <div className={securityInfoGrid}>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Пароль</p><p className="text-white text-sm tracking-widest">********</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Остання зміна</p><p className="text-white text-sm">{user.passwordLastChanged}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Пристрої</p><p className="text-white text-sm">1 активний</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Останній вхід</p><p className="text-white text-sm">{user.region}</p></div>
              </div>
            </div>
          </div>
        </section>

        <div className="pt-4 pb-12">
          <button
            type="button"
            onClick={handleDeleteAccount}
            disabled={saving}
            className="group relative inline-flex w-[210px] h-[44px] items-center justify-center rounded-full p-[1.5px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all duration-300 hover:scale-105 hover:shadow-[0_0_15px_rgba(131,72,193,0.4)] active:scale-95 cursor-pointer disabled:opacity-60">

            <div className="flex h-full w-full items-center justify-center gap-2 rounded-full bg-[#050506] text-[#F40000] text-[14px] font-normal">
              <span>{saving ? "Обробка..." : "Видалити акаунт"}</span>
              
              <svg
                width="20"
                height="20"
                viewBox="0 0 20 20"
                fill="none"
                className="shrink-0">

                <path
                  d="M10.375 14.4444V10.8889M14.125 14.4444V10.8889M9.4381 4.72212C9.4377 4.70368 9.4375 4.68519 9.4375 4.66667C9.4375 3.19391 10.6967 2 12.25 2C13.4645 2 14.4993 2.72994 14.8928 3.75238M14.8928 3.75238L9.4381 4.72212L4.75 5.55556M14.8928 3.75238L19.75 2.88889M18.8125 7.33333V16.2222C18.8125 17.2041 17.973 18 16.9375 18H7.5625C6.52697 18 5.6875 17.2041 5.6875 16.2222V7.33333H18.8125Z"
                  stroke="currentColor"
                  strokeWidth="1.5"
                  strokeLinecap="round"
                  strokeLinejoin="round"
                />  
              </svg>
            </div>
         </button>
        </div>


      {profileModalOpen && (
        <Modal 
          widthClass="w-[792px]" 
          heightClass="h-[556px]"
        >
          <form onSubmit={handleSaveProfile} className="relative w-full h-full m-0 p-0">
            
            <div className="absolute left-0 top-0 w-[792px] h-[76px] bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)] border-b border-white/10 rounded-t-[24px]">
              <h3 className="absolute left-[24px] top-[24px] text-[24px] font-semibold leading-[28px] text-white m-0 p-0">
                Редагування персональної інформації
              </h3>
              <div className="absolute right-[24px] top-[16px] w-[44px] h-[44px] p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95">
                <button 
                  type="button" 
                  onClick={() => setProfileModalOpen(false)} 
                  className="w-full h-full flex items-center justify-center rounded-full bg-[#050506] text-[#A3A4B0] hover:text-white transition-colors cursor-pointer"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M5 5L15 15M5 15L15 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            <div className="absolute left-0 top-[76px] w-[792px] h-[480px] overflow-visible">
              
              <img 
                src={user.avatarUrl || userAvatar} 
                alt="Avatar" 
                className="absolute left-[24px] top-[24px] h-[60px] w-[60px] rounded-full object-cover border border-white/10" 
              />
              
              <div className="absolute left-[96px] top-[33px] flex flex-col gap-[8px]">
                <span className="text-[20px] font-semibold text-white leading-[20px] m-0 p-0">
                  {user.firstName} {user.lastName}
                </span>
                <span className="text-[14px] font-extralight text-[#A3A4B0] leading-[14px] m-0 p-0">
                  {user.username}
                </span>
              </div>
              
              <div className="absolute right-[84px] top-[32px] w-[201px] h-[44px] p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95">
                <button 
                  type="button" 
                  onClick={() => fileInputRef.current?.click()} 
                  className="w-full h-full flex items-center justify-center gap-[8px] rounded-full bg-[#050506] text-[14px] font-medium leading-[18px] text-white transition-colors cursor-pointer"
                >
                  {uploadingAvatar ? "Завантаження..." : "Завантажити фото"}
                  {!uploadingAvatar && (
                          <img
                            src={shareUploadIcon}
                            alt=""
                            className="w-[24px] h-[24px] shrink-0 object-contain"
                          />
                  )}
                </button>
              </div>

              <div className="absolute right-[24px] top-[32px] w-[44px] h-[44px] p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95">
                <button 
                  type="button" 
                  className="w-full h-full flex items-center justify-center rounded-full bg-[#050506] text-[#A3A4B0] hover:text-[#F40000] transition-colors cursor-pointer">

                  <svg 
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0">

                    <g transform="translate(-2.25 0)">
                      <path
                        d="M10.375 14.4444V10.8889M14.125 14.4444V10.8889M9.4381 4.72212C9.4377 4.70368 9.4375 4.68519 9.4375 4.66667C9.4375 3.19391 10.6967 2 12.25 2C13.4645 2 14.4993 2.72994 14.8928 3.75238M14.8928 3.75238L9.4381 4.72212L4.75 5.55556M14.8928 3.75238L19.75 2.88889M18.8125 7.33333V16.2222C18.8125 17.2041 17.973 18 16.9375 18H7.5625C6.52697 18 5.6875 17.2041 5.6875 16.2222V7.33333H18.8125Z"
                        stroke="currentColor"
                        strokeWidth="1.5"
                        strokeLinecap="round"
                        strokeLinejoin="round"
                      />
                    </g>
                 </svg>
                </button>
              </div>

              <div className="absolute left-[24px] top-[108px] grid grid-cols-2 gap-x-[24px] gap-y-[24px] overflow-visible">
                <ProfileInput label="Ім'я" value={editForm.firstName} onChange={(v) => setEditForm((p) => ({ ...p, firstName: v.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]/g, ""), }))} placeholder="Вкажіть ім'я" />
                <ProfileInput label="Прізвище" value={editForm.lastName} onChange={(v) => setEditForm((p) => ({ ...p, lastName: v.replace(/[^a-zA-Zа-яА-ЯіІїЇєЄґҐ\s]/g, ""), }))} placeholder="Вкажіть прізвище" />
                <ProfileInput label="Ім'я користувача" value={editForm.username} onChange={(v) => setEditForm((p) => ({ ...p, username: v }))} placeholder="Вкажіть ім'я користувача" />
                
                <div className="flex flex-col text-left w-[360px] h-[72px] relative z-20 phone-profile-wrapper">
                  <label className="mb-[12px] block font-montserrat text-[12px] font-normal leading-[16px] text-[#A3A4B0] m-0 p-0">
                    Номер телефону
                  </label>
 <style>{`
  .phone-profile-wrapper .react-tel-input .form-control {
    width: 100% !important;
    height: 44px !important;
    padding-left: 58px !important;
    background: linear-gradient(#050506,#050506) padding-box,
      linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box !important;
    border: 1px solid transparent !important;
    border-radius: 28px !important;
    color: white !important;
    font-family: 'Montserrat', sans-serif !important;
    font-size: 14px !important;
    outline: none !important;
  }

  .phone-profile-wrapper .react-tel-input .flag-dropdown,
  .phone-profile-wrapper .react-tel-input .selected-flag {
    background: transparent !important;
    border: none !important;
  }

.phone-profile-wrapper .react-tel-input .country-list {
  bottom: calc(100% + 10px) !important;
  top: auto !important;
  width: 374px !important;
  max-height: 180px !important;
  margin: 0 !important;
  padding: 0 !important;
  background: #050506 !important;
  border: 1px solid rgba(82,46,139,0.32) !important;
  border-radius: 28px !important;
  overflow-y: auto !important;
  overflow-x: hidden !important;
}


.phone-profile-wrapper .react-tel-input .country-list .search {
  background: #050506 !important;
  border-bottom: 1px solid rgba(82,46,139,0.3) !important;
  padding: 12px !important;
}

.phone-profile-wrapper .react-tel-input .country-list .search::before,
.phone-profile-wrapper .react-tel-input .country-list .search::after {
  display: none !important;
  content: none !important;
}

.phone-profile-wrapper .react-tel-input .country-list .search-box {
  width: 100% !important;
  height: 44px !important;
  margin: 0 !important;
  padding: 0 16px !important;
  background: #050506 !important;
  color: white !important;
  border: 1px solid rgba(82,46,139,0.32) !important;
  border-radius: 28px !important;
  outline: none !important;
}

  .phone-profile-wrapper .react-tel-input .country-list .country {
    padding: 10px 16px !important;
    color: #A3A4B0 !important;
  }

  .phone-profile-wrapper .react-tel-input .country-list .country:hover,
  .phone-profile-wrapper .react-tel-input .country-list .country.highlight {
    background: rgba(131,72,193,0.2) !important;
  }

  .phone-profile-wrapper .react-tel-input .country-list .dial-code {
    color: #8348C1 !important;
  }
`}</style>
                  <div className="w-[360px] h-[44px] rounded-full relative">
  <div className="w-full h-full p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
    <div className="relative w-full h-full rounded-full bg-[#050506] flex items-center">
      
      <button
        type="button"
        onClick={() => setPhoneDropdownOpen((p) => !p)}
        className="h-full flex items-center gap-[6px] pl-[14px] pr-[10px] text-[14px] text-white cursor-pointer"
      >
        <span>{selectedPhoneCountry?.code || "UA"}</span>
        <span className="text-white">{selectedPhoneCountry?.dialCode || "+380"}</span>
        <svg
          className={`text-[#A3A4B0] transition-transform duration-200 ${phoneDropdownOpen ? 'rotate-180' : ''}`}
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
        >
          <polyline points="6 9 12 15 18 9" />
        </svg>
      </button>

      <input
        type="tel"
        value={formatPhoneNumber(
          editForm.phone.replace(selectedPhoneCountry?.dialCode || "+380", "")
        )}
        onChange={(e) => {
          const dial = selectedPhoneCountry?.dialCode || "+380";
          const digits = e.target.value.replace(/\D/g, "").slice(0, 10);
          setEditForm((p) => ({ ...p, phone: `${dial}${digits}` }));
        }}
        placeholder="Введіть номер"
        className="flex-1 h-full bg-transparent pr-5 text-[14px] text-white placeholder:text-[#A3A4B0]/50 outline-none"
      />
    </div>
  </div>

  {phoneDropdownOpen && (
    <div className="absolute left-[-10px] bottom-[calc(100%+10px)] z-[100] w-[374px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-lg">
      <div className="bg-[#050506] rounded-[28px] flex flex-col overflow-hidden">
        <div className="px-[12px] py-[12px] border-b border-[rgba(82,46,139,0.3)]">
          <div className="w-full p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))]">
            <input
              type="text"
              value={phoneSearch}
              onChange={(e) => setPhoneSearch(e.target.value)}
              placeholder="Пошук країни..."
              autoFocus
              className="w-full h-[44px] bg-[#050506] rounded-[27px] px-4 text-[14px] text-white placeholder:text-[#A3A4B0]/50 outline-none border-none"
            />
          </div>
        </div>

        <div className="max-h-[140px] overflow-y-auto overflow-x-hidden overscroll-contain">
          {phoneCountries
            .filter(c =>
              c.name.toLowerCase().includes(phoneSearch.toLowerCase().trim()) ||
              c.code.toLowerCase().includes(phoneSearch.toLowerCase().trim()) ||
              c.dialCode.includes(phoneSearch.trim())
            )
            .map(c => (
              <button
                key={c.code}
                type="button"
                onClick={() => {
                  setSelectedPhoneCountry(c);
                  setEditForm((p) => ({ ...p, phone: c.dialCode }));
                  setPhoneDropdownOpen(false);
                  setPhoneSearch("");
                }}
                className="w-full px-5 py-[9px] text-left text-[13px] transition-colors hover:bg-[#8348C1]/20 flex items-center justify-between gap-2 text-[#A3A4B0]"
              >
                <span className="block min-w-0 truncate">{c.name}</span>
                <span className="shrink-0 text-[#8348C1]">{c.dialCode}</span>
              </button>
            ))}
        </div>
      </div>
    </div>
  )}
</div>
</div>
                
                <ProfileInput 
                  label="Країна" 
                  value={editForm.region} 
                  onChange={(v) => setEditForm((p) => ({ ...p, region: v }))} 
                  placeholder="Оберіть країну" 
                  isCountrySelect={true}
                  countries={countries}
                  loadingCountries={loadingCountries}
                  icon={<svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round"><polyline points="6 9 12 15 18 9"/></svg>} 
                />

                <ProfileInput 
                  label="Дата народження" 
                  value={editForm.birthDate} 
                  onChange={(v) => setEditForm((p) => ({ ...p, birthDate: v }))} 
                  placeholder="ДД/ММ/РР" 
                  type="date"
                />
              </div>

              <div className="absolute left-[24px] top-[412px] flex gap-[24px]">
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-[360px] h-[44px] flex items-center justify-center rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium disabled:opacity-60 transition-all duration-300 hover:scale-105 active:scale-95 m-0 p-0 cursor-pointer">

                  {saving ? "Збереження..." : "Зберегти"}
                </button>
                <button 
                  type="button" 
                  onClick={() => setProfileModalOpen(false)} 
                  className="group relative flex w-[360px] h-[44px] items-center justify-center rounded-[28px] text-[14px] font-medium leading-[20px] text-white transition-all duration-300 hover:scale-105 active:scale-95t m-0 p-0 cursor-pointer"
                >
                  <svg className="absolute inset-0 h-full w-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="358" height="42" rx="21" fill="none" stroke="url(#gradient-border-cancel-prof)" strokeWidth="1.5" />
                    <defs>
                      <linearGradient id="gradient-border-cancel-prof" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2C1969" />
                        <stop offset="50%" stopColor="#8348C1" />
                        <stop offset="100%" stopColor="#C38BFF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="relative z-10">Скасувати</span>
                </button>
              </div>
            </div>
          </form>
        </Modal>
      )}

      {securityModalOpen && (
        <Modal 
          widthClass="w-[792px]" 
          heightClass="h-[506px]"
        >
          <form onSubmit={handleChangePassword} className="relative w-full h-full m-0 p-0">
            
            {/* ШАПКА ПОП-АПУ */}
            <div className="absolute left-0 top-0 w-[792px] h-[76px] bg-[linear-gradient(90deg,rgba(96,67,164,0.2)_0%,rgba(1,3,21,0.2)_100%)] border-b border-white/10 rounded-t-[24px]">
              <h3 className="absolute left-[24px] top-[24px] h-[20px] text-[24px] font-semibold leading-[28px] text-white m-0 p-0">
                Редагування безпеки
              </h3>
              <div className="absolute right-[24px] top-[16px] w-[44px] h-[44px] p-[1px] rounded-full bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95">
                <button 
                  type="button" 
                  onClick={() => setSecurityModalOpen(false)} 
                  className="w-full h-full flex items-center justify-center rounded-full bg-[#050506] text-[#A3A4B0] hover:text-white transition-colors cursor-pointer"
                >
                  <svg
                    width="20"
                    height="20"
                    viewBox="0 0 20 20"
                    fill="none"
                    className="shrink-0"
                  >
                    <path
                      d="M5 5L15 15M5 15L15 5"
                      stroke="currentColor"
                      strokeWidth="1.5"
                      strokeLinecap="round"
                      strokeLinejoin="round"
                    />
                  </svg>
                </button>
              </div>
            </div>

            {/* КОНТЕНТ НИЖЧЕ ШАПКИ */}
            <div className="absolute left-0 top-[76px] w-[792px] h-[430px]">
              
              <h4 className="absolute left-[24px] top-[24px] h-[20px] font-montserrat text-[20px] font-semibold text-white leading-[20px] m-0 p-0">
                Зміна пароля
              </h4>

              {/* СІТКА ІНПУТІВ */}
              <div className="absolute left-[24px] top-[68px] grid grid-cols-2 gap-x-[24px] gap-y-[24px]">
                <ProfileInput 
                  label="Пароль" 
                  type="password" 
                  value={newPassword} 
                  onChange={setNewPassword} 
                  placeholder="Введіть пароль" 
                />
                <ProfileInput 
                  label="Підтвердження паролю" 
                  type="password" 
                  value={confirmPassword} 
                  onChange={setConfirmPassword} 
                  placeholder="Підтвердіть пароль" 
                />
              </div>

              {/* Заголовок "Активні пристрої" */}
              <h4 className="absolute left-[24px] top-[164px] h-[20px] text-[20px] font-semibold font-montserrat text-white leading-[20px] m-0 p-0">
                Активні пристрої
              </h4>

              {/* Прямокутник пристроїв */}
              <div className="absolute left-[24px] top-[208px] w-[744px] h-[98px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]">
                <div className="relative w-full h-full rounded-[28px] bg-[#050506] flex items-center justify-between px-[24px]">
                  
                  {/* Текст зліва */}
                  <div className="flex flex-col gap-[8px]">
                    <span className="text-[18px] font-medium text-white leading-none m-0 p-0 block">
                      MacBook Air M1
                    </span>
                    <span className="text-[14px] font-normal text-[#A3A4B0] leading-none m-0 p-0 block">
                      Україна, Київ, в мережі
                    </span>
                  </div>

                  {/* Кнопка "Завершити сеанс" СПРАВА */}
                  <div className="relative w-[190px] h-[44px] p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(179,179,179,0.32),rgba(82,46,139,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-300 hover:scale-105 active:scale-95">
                    <button 
                      type="button" 
                      className="w-full h-full flex items-center justify-center gap-[8px] rounded-[28px] bg-[#050506] text-[14px] font-medium leading-[20px] text-white transition-colors m-0 p-0 cursor-pointer"
                    >
                      <span>Завершити сеанс</span>

                      <img
                        src={logOutWhiteIcon}
                        alt=""
                        className="w-5 h-5 shrink-0 object-contain"
                      />
                    </button>
                  </div>

                </div>
              </div>

              {/* КНОПКИ "ЗБЕРЕГТИ" / "ВІДМІНИТИ" */}
              <div className="absolute left-[24px] top-[362px] flex gap-[24px]">
                {/* Кнопка "Зберегти" */}
                <button 
                  type="submit" 
                  disabled={saving} 
                  className="w-[360px] h-[44px] flex items-center justify-center rounded-full bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] text-white text-[14px] leading-[20px] font-medium disabled:opacity-60 transition-all duration-300 hover:scale-105 active:scale-95 m-0 p-0 cursor-pointer">

                  {saving ? "Збереження..." : "Зберегти"}
                </button>
                
                {/* Кнопка "Відмінити" */}
                <button 
                  type="button" 
                  onClick={() => setSecurityModalOpen(false)} 
                  className="group relative flex w-[360px] h-[44px] items-center justify-center rounded-[28px] text-[14px] font-medium leading-[20px] text-white transition-all duration-300 hover:scale-105 active:scale-95 m-0 p-0 cursor-pointer">

                  <svg className="absolute inset-0 h-full w-full pointer-events-none" xmlns="http://www.w3.org/2000/svg">
                    <rect x="1" y="1" width="358" height="42" rx="21" fill="none" stroke="url(#gradient-border-cancel-sec)" strokeWidth="1.5" />
                    <defs>
                      <linearGradient id="gradient-border-cancel-sec" x1="0%" y1="0%" x2="100%" y2="0%">
                        <stop offset="0%" stopColor="#2C1969" />
                        <stop offset="50%" stopColor="#8348C1" />
                        <stop offset="100%" stopColor="#C38BFF" />
                      </linearGradient>
                    </defs>
                  </svg>
                  <span className="relative z-10">Скасувати</span>
                </button>
              </div>
            </div>
            
          </form>
        </Modal>
      )}
    </div>
  </div>
  );
}
