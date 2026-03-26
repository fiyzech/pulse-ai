import { useNavigate } from "react-router-dom";

export default function LandingPage() {
  const navigate = useNavigate();

  return (
    <div className="min-h-screen bg-[#050816] text-white">
      <section className="mx-auto flex min-h-screen max-w-7xl flex-col items-start justify-center px-6">
        <p className="mb-4 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-sm text-white/70">
          Smart crypto monitoring
        </p>

        <h1 className="max-w-4xl text-5xl font-bold leading-tight md:text-7xl">
          Track crypto smarter with AI insights and Telegram alerts
        </h1>

        <p className="mt-6 max-w-2xl text-lg text-white/70">
          Monitor assets, create price alerts, connect Telegram, and explore
          market signals in one clean dashboard.
        </p>

        <div className="mt-8 flex gap-4">
          <button
            onClick={() => navigate("/auth")}
            className="rounded-2xl bg-white px-6 py-3 font-medium text-black"
          >
            Get Started
          </button>

          <button
            onClick={() => navigate("/pricing")}
            className="rounded-2xl border border-white/15 px-6 py-3 text-white"
          >
            View Plans
          </button>
        </div>
      </section>
    </div>
  );
}