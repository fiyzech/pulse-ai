import userAvatar from '../../assets/images/user_avatar.png';

const cardClass =
  'w-full bg-[#0A0A0A] border border-violet-500/20 rounded-[16px] shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_40px_rgba(139,92,246,0.18),0_4px_40px_rgba(0,0,0,0.6)] hover:border-violet-500/35 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_0_60px_rgba(139,92,246,0.28),0_4px_40px_rgba(0,0,0,0.6)] transition-all duration-300';

const editBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  width: '135px',
  height: '36px',
  borderRadius: '999px',
  border: '1px solid transparent',
  background: 'linear-gradient(#0D0D0D, #0D0D0D) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box',
  color: '#A3A4B0',
  fontSize: '14px',
  lineHeight: '20px',
  fontWeight: 400,
  cursor: 'pointer',
  whiteSpace: 'nowrap',
  flexShrink: 0,
};

export default function ProfilePage() {
  return (
    <div className="h-screen overflow-hidden bg-[#050505] text-white w-full" style={{ fontFamily: 'inherit' }}>
      <div style={{ padding: '36px 40px', height: '100%', overflow: 'hidden' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'rgba(255,255,255,0.9)' }}>
              Користувач
            </h2>
            <div className={cardClass} style={{ padding: '24px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '14px', height: '108px', boxSizing: 'border-box', position: 'relative' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                <img
                  src={userAvatar}
                  alt="Avatar"
                  style={{ width: '46px', height: '46px', borderRadius: '50%', objectFit: 'cover', border: '1px solid rgba(255,255,255,0.1)', flexShrink: 0 }}
                />
                <div>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '3px' }}>
                    <span style={{ fontSize: '20px', fontWeight: 600 }}>Alexander Mironov</span>
                    <span style={{
                      fontSize: '12px',
                      fontWeight: 600,
                      padding: '2px 9px',
                      borderRadius: '999px',
                      border: '1px solid transparent',
                      color: 'rgba(255,255,255,0.75)',
                      background: `linear-gradient(#0A0A0A, #0A0A0A) padding-box, linear-gradient(135deg, #FFFFFF 0%, #8348C1 48%, #2C1969 100%) border-box`,
                    }}>Pro</span>
                  </div>
                  <span style={{ fontSize: '14px', color: '#A3A4B0' }}>@alexM</span>
                </div>
              </div>
              <button style={{ ...editBtnStyle, position: 'absolute', top: '24px', right: '24px' }}>
                Редагувати <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.1719 4.17188L17 10M14.0859 7.08594L7.58594 13.5859M7.58594 13.5859L4.67187 10.6719M7.58594 13.5859L10.5 16.5M10 17L17.5858 9.41421C18.3668 8.63316 18.3668 7.36684 17.5858 6.58579L14.5861 3.58609C13.805 2.80504 12.5387 2.80504 11.7577 3.58609L4.17187 11.1719L5.08594 16.0859L10 17Z" stroke="#A3A4B0" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </button>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'rgba(255,255,255,0.9)' }}>
              Персональна інформація
            </h2>
            <div className={cardClass} style={{ padding: '24px', boxSizing: 'border-box', position: 'relative' }}>
              <button style={{ ...editBtnStyle, position: 'absolute', top: '24px', right: '24px' }}>
                Редагувати <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.1719 4.17188L17 10M14.0859 7.08594L7.58594 13.5859M7.58594 13.5859L4.67187 10.6719M7.58594 13.5859L10.5 16.5M10 17L17.5858 9.41421C18.3668 8.63316 18.3668 7.36684 17.5858 6.58579L14.5861 3.58609C13.805 2.80504 12.5387 2.80504 11.7577 3.58609L4.17187 11.1719L5.08594 16.0859L10 17Z" stroke="#A3A4B0" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 300px', rowGap: '24px', columnGap: '16px' }}>
                {[
                  { label: "Ім'я", value: 'Олександр' },
                  { label: 'E-mail', value: 'alexmironov@gmail.com' },
                  { label: 'День народження', value: '07.05.2007', extraSpace: true },
                  { label: 'Прізвище', value: 'Миронов' },
                  { label: 'Телефон', value: '(+380) 98 962 77 13' },
                  { label: 'Регіон', value: 'Україна', extraSpace: true },
                ].map(({ label, value, extraSpace }) => (
                  <div key={label} style={{ paddingLeft: extraSpace ? '86px' : '0' }}>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 400, letterSpacing: '0.1em', color: '#A3A4B0', marginBottom: '5px' }}>{label}</p>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px', color: 'rgba(255,255,255,0.9)' }}>
              Безпека
            </h2>
            <div className={cardClass} style={{ padding: '24px 24px 34px 24px', boxSizing: 'border-box', position: 'relative' }}>
              <button style={{ ...editBtnStyle, position: 'absolute', top: '24px', right: '24px' }}>
                Редагувати <svg width="20" height="20" viewBox="0 0 20 20" fill="none" xmlns="http://www.w3.org/2000/svg"><path d="M11.1719 4.17188L17 10M14.0859 7.08594L7.58594 13.5859M7.58594 13.5859L4.67187 10.6719M7.58594 13.5859L10.5 16.5M10 17L17.5858 9.41421C18.3668 8.63316 18.3668 7.36684 17.5858 6.58579L14.5861 3.58609C13.805 2.80504 12.5387 2.80504 11.7577 3.58609L4.17187 11.1719L5.08594 16.0859L10 17Z" stroke="#A3A4B0" strokeWidth="1.5" strokeLinejoin="round"/></svg>
              </button>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, minmax(0, 200px))', rowGap: '24px', columnGap: '16px' }}>
                {[
                  { label: 'Пароль', value: '•••••••', mono: true },
                  { label: 'Остання зміна', value: '2 тижні тому' },
                  { label: 'Пристрої', value: '2 активних' },
                  { label: 'Останній вхід', value: 'Україна, Львів' },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 400, letterSpacing: '0.1em', color: '#A3A4B0', marginBottom: '5px' }}>{label}</p>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 400, color: 'rgba(255,255,255,0.85)', letterSpacing: mono ? '0.15em' : 'normal' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <div style={{ paddingTop: '8px' }}>
            <button style={{
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: '8px',
              width: '201px',
              height: '44px',
              padding: '0 20px',
              borderRadius: '999px',
              border: '1px solid transparent',
              background: 'linear-gradient(#0D0D0D, #0D0D0D) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box',
              color: 'rgb(239,68,68)',
              fontSize: '14px',
              lineHeight: '20px',
              fontWeight: 400,
              cursor: 'pointer',
            }}>
              Видалити акаунт <svg width="25" height="27" viewBox="0 0 25 27" fill="none" xmlns="http://www.w3.org/2000/svg"><g filter="url(#filter0_d_728_341)"><path d="M10.375 14.4444V10.8889M14.125 14.4444V10.8889M9.4381 4.72212C9.4377 4.70368 9.4375 4.68519 9.4375 4.66667C9.4375 3.19391 10.6967 2 12.25 2C13.4645 2 14.4993 2.72994 14.8928 3.75238M9.4381 4.72212L4.75 5.55556M9.4381 4.72212L14.8928 3.75238M14.8928 3.75238L19.75 2.88889M18.8125 7.33333V16.2222C18.8125 17.2041 17.973 18 16.9375 18H7.5625C6.52697 18 5.6875 17.2041 5.6875 16.2222V7.33333H18.8125Z" stroke="#FF0000" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round"/></g><defs><filter id="filter0_d_728_341" x="-1.25" y="0" width="28" height="28" filterUnits="userSpaceOnUse" colorInterpolationFilters="sRGB"><feFlood floodOpacity="0" result="BackgroundImageFix"/><feColorMatrix in="SourceAlpha" type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 127 0" result="hardAlpha"/><feOffset dy="4"/><feGaussianBlur stdDeviation="2"/><feComposite in2="hardAlpha" operator="out"/><feColorMatrix type="matrix" values="0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0.25 0"/><feBlend mode="normal" in2="BackgroundImageFix" result="effect1_dropShadow_728_341"/><feBlend mode="normal" in="SourceGraphic" in2="effect1_dropShadow_728_341" result="shape"/></filter></defs></svg>
            </button>
          </div>

        </div>
      </div>
    </div>
  );
}