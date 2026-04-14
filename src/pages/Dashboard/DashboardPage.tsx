export default function Dashboard() {
  const sidebarItems = [
    { label: "Dashboard", icon: "▦", active: true },
    { label: "Watchlist", icon: "◉" },
    { label: "Markets", icon: "ϟ" },
    { label: "Alerts", icon: "◔" },
  ];

  const bottomItems = [
    { label: "Support", icon: "◌" },
    { label: "Settings", icon: "⚙" },
  ];

  return (
    <div className="min-h-screen bg-[#050505] text-white">
      <div className="relative min-h-screen overflow-hidden bg-[radial-gradient(circle_at_top_right,rgba(108,43,217,0.18),transparent_22%),radial-gradient(circle_at_40%_55%,rgba(88,35,190,0.14),transparent_24%),linear-gradient(180deg,#060606_0%,#030303_100%)]">
        <div className="absolute inset-0 pointer-events-none opacity-40 [background:linear-gradient(to_right,rgba(124,58,237,0.08)_1px,transparent_1px),linear-gradient(to_bottom,rgba(124,58,237,0.05)_1px,transparent_1px)] [background-size:120px_120px]" />
        <div className="flex min-h-screen">
          <aside className="w-[280px] border-r border-violet-900/40 bg-black/70 px-6 py-5 backdrop-blur-xl">
            <div className="flex h-full flex-col">
              <div>
                <div className="mb-10 flex items-center gap-3 px-3">
                  <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 text-lg font-semibold text-white shadow-[0_0_30px_rgba(139,92,246,0.35)]">
                    ◈
                  </div>
                  <span className="text-[32px] font-medium tracking-tight text-white/95">
                    CryptoPulse
                  </span>
                </div>

                <nav className="space-y-4">
                  {sidebarItems.map((item) => (
                    <button
                      key={item.label}
                      className={`flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-lg transition ${
                        item.active
                          ? "bg-white/18 text-white shadow-[inset_0_0_0_1px_rgba(255,255,255,0.06)]"
                          : "text-white/60 hover:bg-white/5 hover:text-white/90"
                      }`}
                    >
                      <span className="w-6 text-center text-xl">{item.icon}</span>
                      <span>{item.label}</span>
                    </button>
                  ))}
                </nav>
              </div>

              <div className="mt-auto space-y-4">
                {bottomItems.map((item) => (
                  <button
                    key={item.label}
                    className="flex w-full items-center gap-4 rounded-xl px-4 py-4 text-left text-lg text-white/60 transition hover:bg-white/5 hover:text-white/90"
                  >
                    <span className="w-6 text-center text-xl">{item.icon}</span>
                    <span>{item.label}</span>
                  </button>
                ))}

                <div className="mt-4 rounded-2xl border border-white/10 bg-[linear-gradient(180deg,rgba(31,29,52,0.9)_0%,rgba(18,17,31,0.9)_100%)] p-4 shadow-[0_0_40px_rgba(139,92,246,0.12)]">
                  <div className="mb-2 flex items-center gap-2 text-white">
                    <span className="text-lg">✦</span>
                    <span className="text-base font-medium">Активуйте PulseAI</span>
                  </div>
                  <p className="text-sm leading-5 text-white/55">
                    Ваш особистий крипто-помічник
                  </p>
                </div>
              </div>
            </div>
          </aside>

          <main className="flex-1">
            <header className="flex items-center justify-between border-b border-violet-900/30 px-8 py-8">
              <h1 className="text-[42px] font-medium tracking-tight">Dashboard</h1>

              <div className="flex items-center gap-5">
                <div className="flex h-14 w-[310px] items-center gap-3 rounded-2xl border border-white/10 bg-black/40 px-4 text-white/40 shadow-[inset_0_0_0_1px_rgba(124,58,237,0.08)] backdrop-blur-xl">
                  <span className="text-xl">⌕</span>
                  <span className="text-sm">Search</span>
                </div>
                <button className="text-2xl text-white/80 transition hover:text-white">◔</button>
                <button className="text-2xl text-white/80 transition hover:text-white">◌</button>
              </div>
            </header>

            <section className="px-8 py-6">
              <div className="grid grid-cols-[1fr_310px] gap-8">
                <div>
                  <h2 className="mb-6 text-[56px] font-semibold leading-none tracking-tight">
                    Популярне сьогодні
                  </h2>

                  <div className="grid grid-cols-3 gap-5">
                    {[1, 2, 3].map((item) => (
                      <div
                        key={item}
                        className="h-[275px] rounded-[30px] border border-white/12 bg-[linear-gradient(180deg,rgba(8,8,8,0.94)_0%,rgba(4,4,4,0.98)_100%)] shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_0_35px_rgba(124,58,237,0.08)]"
                      />
                    ))}
                  </div>
                </div>

                <div className="pt-2">
                  <div className="rounded-[30px] border border-violet-400/20 bg-[linear-gradient(180deg,rgba(9,10,33,0.92)_0%,rgba(21,11,34,0.82)_100%)] p-6 shadow-[0_0_45px_rgba(109,40,217,0.18)] backdrop-blur-xl">
                    <div className="mb-8 flex items-center gap-3">
                      <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-violet-300 via-violet-500 to-indigo-700 text-white shadow-[0_0_20px_rgba(139,92,246,0.3)]">
                        ◈
                      </div>
                      <span className="text-[30px] font-medium tracking-tight text-white/95">
                        CryptoPulse
                      </span>
                    </div>

                    <h3 className="mb-4 text-[32px] font-medium leading-tight">
                      Smart Alerts in Telegram
                    </h3>
                    <p className="mb-8 max-w-[260px] text-[17px] leading-7 text-white/55">
                      Підключи Telegram, щоб миттєво отримувати сповіщення про свої
                      алерти та ринкові зміни.
                    </p>

                    <div className="space-y-4">
                      <button className="h-14 w-full rounded-2xl bg-[#b79cff] text-lg font-medium text-[#1b1330] transition hover:opacity-95">
                        Підключити Telegram
                      </button>
                      <button className="h-14 w-full rounded-2xl border border-violet-300/20 bg-violet-400/10 text-lg font-medium text-white/80 transition hover:bg-violet-400/15">
                        Дізнатись більше
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="mt-6 border-t border-violet-900/30 pt-8">
                <div className="rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,7,7,0.95)_0%,rgba(4,4,4,0.98)_100%)] px-6 py-5 shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_0_45px_rgba(124,58,237,0.08)]">
                  <h2 className="mb-5 text-[58px] font-semibold leading-none tracking-tight">
                    Відстежувані активи
                  </h2>
                  <div className="h-[360px] rounded-[28px] border border-transparent" />
                </div>
              </div>
            </section>
          </main>
        </div>
      </div>
    </div>
  );
}
