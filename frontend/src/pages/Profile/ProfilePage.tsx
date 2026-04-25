import React from 'react';
import userAvatar from '../../assets/images/user_avatar.png';

const cardClass =
  'w-full bg-[#0A0A0A] border border-violet-500/20 rounded-[16px] shadow-[0_0_0_1px_rgba(139,92,246,0.08),0_0_40px_rgba(139,92,246,0.18),0_4px_40px_rgba(0,0,0,0.6)] hover:border-violet-500/35 hover:shadow-[0_0_0_1px_rgba(139,92,246,0.12),0_0_60px_rgba(139,92,246,0.28),0_4px_40px_rgba(0,0,0,0.6)] transition-all duration-300';

export default function ProfilePage() {
  return (
    <div className="min-h-screen bg-[#050505] text-white w-full" style={{ fontFamily: 'inherit' }}>
      <div style={{ padding: '36px 32px' }}>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '24px' }}>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>
              Користувач
            </h2>
            <div className={cardClass} style={{ padding: '16px 20px', display: 'flex', alignItems: 'center', gap: '14px', height: '108px', boxSizing: 'border-box'}}>
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
                    background: `
                      linear-gradient(#0A0A0A, #0A0A0A) padding-box, 
                      linear-gradient(135deg, #FFFFFF 0%, #8348C1 48%, #2C1969 100%) border-box
                    `,
                  }}>Pro</span>
                </div>
                <span style={{ fontSize: '14px', color: 'rgba(255,255,255,0.25)' }}>@alexM</span>
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>
              Персональна інформація
            </h2>
            <div className={cardClass} style={{ padding: '24px', boxSizing: 'border-box' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: '200px 200px 300px', 
                rowGap: '24px', 
                columnGap: '16px' 
              }}>
                {[
                  { label: "Ім'я", value: 'Олександр' },
                  { label: 'E-mail', value: 'alexmironov@gmail.com' },
                  { label: 'День народження', value: '07.05.2007', extraSpace: true },
                  { label: 'Прізвище', value: 'Миронов' },
                  { label: 'Телефон', value: '(+380) 98 962 77 13' },
                  { label: 'Регіон', value: 'Україна', extraSpace: true },
                ].map(({ label, value, extraSpace }) => (
                  <div key={label} style={{ paddingLeft: extraSpace ? '86px' : '0' }}>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 400, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: '5px' }}>{label}</p>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 400, color: 'rgba(255,255,255,0.85)' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '12px', color: 'rgba(255,255,255,0.9)' }}>
              Безпека
            </h2>
            <div className={cardClass} style={{ padding: '24px 24px 34px 24px', boxSizing: 'border-box' }}>
              <div style={{ 
                display: 'grid', 
                gridTemplateColumns: 'repeat(2, minmax(0, 200px))', 
                rowGap: '24px', 
                columnGap: '16px' 
              }}>
                {[
                  { label: 'Пароль', value: '•••••••', mono: true },
                  { label: 'Остання зміна', value: '2 тижні тому' },
                  { label: 'Пристрої', value: '2 активних' },
                  { label: 'Останній вхід', value: 'Україна, Львів' },
                ].map(({ label, value, mono }) => (
                  <div key={label}>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 600, letterSpacing: '0.1em', color: 'rgba(255,255,255,0.2)', marginBottom: '5px' }}>{label}</p>
                    <p style={{ fontSize: '14px', lineHeight: '18px', fontWeight: 500, color: 'rgba(255,255,255,0.85)', letterSpacing: mono ? '0.15em' : 'normal' }}>{value}</p>
                  </div>
                ))}
              </div>
            </div>
          </section>

        </div>
      </div>
    </div>
  );
}