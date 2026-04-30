import userAvatar from '../../assets/images/user_avatar.png';
import trashredIcon from '../../assets/icons/trashred.svg';

const cardWrapperClass =
  'p-[1px] rounded-2xl bg-[linear-gradient(90deg,rgba(82,46,139,0.32),rgba(179,179,179,0.32))] shadow-[0_20px_70px_rgba(131,72,193,0.10),0_8px_25px_rgba(0,0,0,0.35)]';

const cardClass =
  'relative h-full rounded-2xl bg-[#050506] overflow-hidden';

const editBtnStyle: React.CSSProperties = {
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '6px',
  width: '135px',
  height: '36px',
  borderRadius: '999px',
  border: '1px solid transparent',
  background:
    'linear-gradient(#0D0D0D, #0D0D0D) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box',
  color: '#A3A4B0',
  fontSize: '14px',
  cursor: 'pointer',
};

export default function ProfilePage() {
  return (
    <div className="h-screen bg-[#050505] text-white w-full">
      <div style={{ padding: '24px 40px 36px' }}>

        {/* USER */}

          {/* Користувач */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
              Користувач
            </h2>

            <div className={cardWrapperClass}>
              <div
                className={cardClass}
                style={{
                  padding: '24px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  height: '108px',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
                  <img
                    src={userAvatar}
                    alt="Avatar"
                    style={{ width: '46px', height: '46px', borderRadius: '50%' }}
                  />

                  <div>
                    <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                      <span style={{ fontSize: '20px', fontWeight: 600 }}>
                        Alexander Mironov
                      </span>

                      <span
                        style={{
                          fontSize: '12px',
                          padding: '2px 9px',
                          borderRadius: '999px',
                          border: '1px solid transparent',
                          background:
                            'linear-gradient(#0A0A0A, #0A0A0A) padding-box, linear-gradient(135deg, #FFFFFF 0%, #8348C1 48%, #2C1969 100%) border-box',
                        }}
                      >
                        Pro
                      </span>
                    </div>

                    <span style={{ fontSize: '14px', color: '#A3A4B0' }}>
                      @alexM
                    </span>
                  </div>
                </div>

                <button style={editBtnStyle}>Редагувати</button>
              </div>
            </div>
          </section>

          {/* Персональна інформація */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
              Персональна інформація
            </h2>

            <div className={cardWrapperClass}>
              <div className={cardClass} style={{ padding: '24px', position: 'relative' }}>
                <button style={{ ...editBtnStyle, position: 'absolute', top: '24px', right: '24px' }}>
                  Редагувати
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: '200px 200px 300px', gap: '24px' }}>
                  {[
                    { label: "Ім'я", value: 'Олександр' },
                    { label: 'E-mail', value: 'alexmironov@gmail.com' },
                    { label: 'День народження', value: '07.05.2007' },
                    { label: 'Прізвище', value: 'Миронов' },
                    { label: 'Телефон', value: '(+380) 98 962 77 13' },
                    { label: 'Регіон', value: 'Україна' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: '14px', color: '#A3A4B0', marginBottom: '5px' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '14px' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* Безпека */}
          <section>
            <h2 style={{ fontSize: '24px', fontWeight: 600, marginBottom: '24px' }}>
              Безпека
            </h2>

            <div className={cardWrapperClass}>
              <div className={cardClass} style={{ padding: '24px', position: 'relative' }}>
                <button style={{ ...editBtnStyle, position: 'absolute', top: '24px', right: '24px' }}>
                  Редагувати
                </button>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 200px)', gap: '24px' }}>
                  {[
                    { label: 'Пароль', value: '•••••••' },
                    { label: 'Остання зміна', value: '2 тижні тому' },
                    { label: 'Пристрої', value: '2 активних' },
                    { label: 'Останній вхід', value: 'Україна, Львів' },
                  ].map(({ label, value }) => (
                    <div key={label}>
                      <p style={{ fontSize: '14px', color: '#A3A4B0', marginBottom: '5px' }}>
                        {label}
                      </p>
                      <p style={{ fontSize: '14px' }}>{value}</p>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </section>

          {/* КНОПКА ВИДАЛЕННЯ */}
          <div style={{ marginTop: '40px' }}>
            <button
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '8px',
                width: '201px',
                height: '44px',
                borderRadius: '28px',
                border: '1px solid transparent',
                background:
                  'linear-gradient(#050506, #050506) padding-box, linear-gradient(90deg, #2C1969 0%, #8348C1 50%, #C38BFF 100%) border-box',
                color: '#FF0000',
                fontSize: '14px',
                lineHeight: '20px',
                fontWeight: 400,
                boxShadow:
                  '0 20px 70px rgba(131,72,193,0.10), 0 8px 25px rgba(0,0,0,0.35)',
                cursor: 'pointer',
              }}
            >
              <span
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  lineHeight: '20px',
                }}
              >
                Видалити акаунт
              </span>

              <img
                src={trashredIcon}
                alt="delete"
                style={{
                  width: '20px',
                  height: '20px',
                  display: 'block',
                  position: 'relative',
                  top: '1px', // 🔥 головний фікс вирівнювання
                }}
              />
            </button>
          </div>

      </div>
    </div>
  );
}