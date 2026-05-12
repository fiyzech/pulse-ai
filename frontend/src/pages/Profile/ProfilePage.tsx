import { useEffect, useRef, useState } from "react";
import type { ChangeEvent, FormEvent } from "react";
import { useNavigate } from "react-router-dom";
import { supabase } from "../../supabaseClient";
import { getPlanLabel, mergeAccountCache, readAccountCache } from "../../utils/accountCache";
import userAvatar from "../../assets/images/user_avatar.png";
import editIcon from "../../assets/icons/pencil-edit.svg";

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

const cardWrapper =
  "p-[1px] rounded-[28px] bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)] transition-all duration-500 ease-out hover:shadow-[0_20px_100px_rgba(131,72,193,0.3),0_8px_25px_rgba(0,0,0,0.4)]";

const editButtonOuter =
  "h-9 min-w-[135px] rounded-full p-[1px] bg-[linear-gradient(90deg,#2C1969_0%,#8348C1_50%,#C38BFF_100%)] transition-all hover:shadow-[0_0_16px_rgba(131,72,193,0.35)] cursor-pointer";

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

const inputStyle = (hasError?: boolean): React.CSSProperties => ({
  background: hasError
    ? "linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(248,113,113,0.6),rgba(239,68,68,0.4)) border-box"
    : "linear-gradient(#050506,#050506) padding-box,linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32)) border-box",
  border: "1px solid transparent",
});

const Modal = ({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) => (
  <div className="fixed inset-0 z-[1000] flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
    <div className="w-full max-w-[560px] rounded-[24px] border border-white/10 bg-[#050506] p-7 shadow-[0_20px_70px_rgba(0,0,0,0.5)]">
      <div className="mb-6 flex items-center justify-between">
        <h3 className="text-[22px] font-semibold text-white">{title}</h3>
        <button type="button" onClick={onClose} className="h-9 w-9 rounded-full border border-white/10 bg-white/5 text-[#A3A4B0] hover:text-white">
          ×
        </button>
      </div>
      {children}
    </div>
  </div>
);

const Field = ({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  readOnly,
}: {
  label: string;
  value: string;
  onChange?: (value: string) => void;
  placeholder?: string;
  type?: string;
  readOnly?: boolean;
}) => (
  <div className="text-left">
    <label className="mb-2 block text-[12px] text-[#A3A4B0]">{label}</label>
    <input
      type={type}
      value={value}
      readOnly={readOnly}
      onChange={(e) => onChange?.(e.target.value)}
      placeholder={placeholder}
      className="h-[44px] w-full rounded-full px-5 text-[14px] text-white outline-none placeholder:text-[#A3A4B0]/50 read-only:text-white/45"
      style={inputStyle(false)}
    />
  </div>
);

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
  const [profileModalOpen, setProfileModalOpen] = useState(false);
  const [securityModalOpen, setSecurityModalOpen] = useState(false);
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [saving, setSaving] = useState(false);
  const [uploadingAvatar, setUploadingAvatar] = useState(false);
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");

  const openProfileModal = () => {
    setEditForm({
      firstName: user.firstName === "Ім'я" || user.firstName === "Завантаження..." ? "" : user.firstName,
      lastName: user.lastName === "Прізвище" ? "" : user.lastName,
      username: user.username.replace(/^@/, "") === "username" ? "" : user.username.replace(/^@/, ""),
      phone: user.phone === "-" ? "" : user.phone,
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

    try {
      const payload = {
        first_name: editForm.firstName.trim(),
        last_name: editForm.lastName.trim(),
        username: username || null,
        phone_number: editForm.phone.trim() || null,
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
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    disabled={uploadingAvatar}
                    className="absolute -bottom-1 -right-1 h-7 w-7 rounded-full border border-white/10 bg-[#0D0D0D] text-[#A3A4B0] hover:text-white flex items-center justify-center"
                    title="Змінити аватар"
                  >
                    <img src={editIcon} className="w-3.5 h-3.5 opacity-80" alt="" />
                  </button>
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
              <EditButton onClick={openProfileModal} />
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
              <div className="grid grid-cols-1 md:grid-cols-3 gap-y-6 gap-x-12">
                <div><p className="text-[#A3A4B0] text-sm mb-1">Ім'я</p><p className="text-white text-sm">{user.firstName}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">E-mail</p><p className="text-white text-sm">{user.email}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">День народження</p><p className="text-white text-sm">{user.birthDate}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Прізвище</p><p className="text-white text-sm">{user.lastName}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Телефон</p><p className="text-white text-sm">{user.phone}</p></div>
                <div><p className="text-[#A3A4B0] text-sm mb-1">Регіон</p><p className="text-white text-sm">{user.region}</p></div>
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
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
            className="w-[210px] h-[44px] rounded-full bg-transparent border-none p-[1.5px] bg-gradient-to-r from-[#2C1969] via-[#8348C1] to-[#C38BFF] transition-all hover:scale-105 cursor-pointer disabled:opacity-60"
          >
            <div className="w-full h-full rounded-full bg-[#050506] flex items-center justify-center gap-2 text-[#FF0000] text-sm">
              <span>{saving ? "Обробка..." : "Видалити акаунт"}</span>
              <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
                <path d="M8.333 9.167V14.167M11.667 9.167V14.167M3.333 5.833H16.667M7.5 5.833V4.167C7.5 3.706 7.873 3.333 8.333 3.333H11.667C12.127 3.333 12.5 3.706 12.5 4.167V5.833M15.833 5.833L15.111 15.944C15.052 16.766 14.368 17.5 13.544 17.5H6.456C5.632 17.5 4.948 16.766 4.889 15.944L4.167 5.833" stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" />
              </svg>
            </div>
          </button>
        </div>
      </div>

      {profileModalOpen && (
        <Modal title="Редагувати профіль" onClose={() => setProfileModalOpen(false)}>
          <form onSubmit={handleSaveProfile} className="flex flex-col gap-4">
            <div className="flex items-center gap-4 rounded-[20px] border border-white/10 bg-white/[0.02] p-4">
              <img src={user.avatarUrl || userAvatar} alt="Avatar" className="h-16 w-16 rounded-full object-cover border border-white/10" />
              <div>
                <button type="button" onClick={() => fileInputRef.current?.click()} className="rounded-full px-5 py-2 text-[13px] text-white" style={{ background: "linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)" }}>
                  {uploadingAvatar ? "Завантаження..." : "Змінити аватар"}
                </button>
                <p className="mt-2 text-[12px] text-[#A3A4B0]">PNG, JPG, WEBP або GIF до 5 MB</p>
              </div>
            </div>

            <div className="grid grid-cols-2 gap-4">
              <Field label="Ім'я" value={editForm.firstName} onChange={(v) => setEditForm((p) => ({ ...p, firstName: v }))} />
              <Field label="Прізвище" value={editForm.lastName} onChange={(v) => setEditForm((p) => ({ ...p, lastName: v }))} />
            </div>
            <Field label="E-mail" value={user.email} readOnly />
            <Field label="Ім'я користувача" value={editForm.username} onChange={(v) => setEditForm((p) => ({ ...p, username: v }))} placeholder="username" />
            <div className="grid grid-cols-2 gap-4">
              <Field label="Телефон" value={editForm.phone} onChange={(v) => setEditForm((p) => ({ ...p, phone: v }))} placeholder="+380..." />
              <Field label="Дата народження" value={editForm.birthDate} onChange={(v) => setEditForm((p) => ({ ...p, birthDate: v }))} placeholder="YYYY-MM-DD" />
            </div>
            <Field label="Регіон" value={editForm.region} onChange={(v) => setEditForm((p) => ({ ...p, region: v }))} />

            <div className="mt-2 flex gap-4">
              <button type="button" onClick={() => setProfileModalOpen(false)} className="h-[44px] flex-1 rounded-full border border-white/10 text-[#A3A4B0] hover:text-white">
                Скасувати
              </button>
              <button type="submit" disabled={saving} className="h-[44px] flex-1 rounded-full text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)" }}>
                {saving ? "Збереження..." : "Зберегти"}
              </button>
            </div>
          </form>
        </Modal>
      )}

      {securityModalOpen && (
        <Modal title="Змінити пароль" onClose={() => setSecurityModalOpen(false)}>
          <form onSubmit={handleChangePassword} className="flex flex-col gap-4">
            <Field label="Новий пароль" type="password" value={newPassword} onChange={setNewPassword} placeholder="Мінімум 8 символів" />
            <Field label="Повторіть пароль" type="password" value={confirmPassword} onChange={setConfirmPassword} placeholder="Мінімум 8 символів" />
            <div className="mt-2 flex gap-4">
              <button type="button" onClick={() => setSecurityModalOpen(false)} className="h-[44px] flex-1 rounded-full border border-white/10 text-[#A3A4B0] hover:text-white">
                Скасувати
              </button>
              <button type="submit" disabled={saving} className="h-[44px] flex-1 rounded-full text-white disabled:opacity-60" style={{ background: "linear-gradient(90deg,#2C1969,#8348C1,#C38BFF)" }}>
                {saving ? "Збереження..." : "Оновити пароль"}
              </button>
            </div>
          </form>
        </Modal>
      )}
    </div>
  );
}
