export default function ProfilePage() {
  return (
    <section className="px-8 py-6">
      <div className="max-w-3xl rounded-[34px] border border-white/10 bg-[linear-gradient(180deg,rgba(7,7,7,0.95)_0%,rgba(4,4,4,0.98)_100%)] p-8 shadow-[0_0_0_1px_rgba(124,58,237,0.08),0_0_45px_rgba(124,58,237,0.08)]">
        <h2 className="mb-8 text-[42px] font-semibold leading-none tracking-tight">
          Профіль користувача
        </h2>
        
        <div className="flex items-center gap-6 mb-10">
          <div className="h-24 w-24 rounded-full bg-gradient-to-br from-violet-400 to-indigo-600 flex items-center justify-center text-3xl font-bold">
            R
          </div>
          <div>
            <h3 className="text-2xl font-medium">Roman</h3>
            <p className="text-white/50 text-lg">Full-Stack Web Developer</p>
          </div>
        </div>

        <div className="space-y-6">
          <div className="border-b border-white/10 pb-6">
            <label className="block text-white/40 text-sm mb-2">Email</label>
            <div className="text-xl">roman@cryptopulse.io</div>
          </div>
          
          <div className="border-b border-white/10 pb-6">
            <label className="block text-white/40 text-sm mb-2">Підписка</label>
            <div className="flex items-center gap-3">
              <span className="text-xl">Pro Plan</span>
              <span className="px-3 py-1 rounded-full bg-violet-500/20 text-violet-300 text-sm border border-violet-500/30">Active</span>
            </div>
          </div>
        </div>

        <div className="mt-10 flex gap-4">
          <button className="px-6 py-3 rounded-xl bg-white/10 hover:bg-white/15 transition-colors font-medium">
            Редагувати профіль
          </button>
          <button className="px-6 py-3 rounded-xl text-red-400 hover:bg-red-500/10 transition-colors font-medium">
            Вийти
          </button>
        </div>
      </div>
    </section>
  );
}